# Inventory Module — Design Spec
**Date:** 2026-03-29
**Status:** Approved

## Overview

A new Inventory module for the café order form that tracks food item stock levels, deducts inventory as orders are prepared, logs restocks, and provides cost/margin analysis. Implemented as a separate `inventory.js` file — the first step in migrating the single-file app toward a modular multi-file structure.

---

## Context

- **Scope:** Food category items only. Drinks are excluded for now (complex recipes).
- **Operator:** All staff (same access level as the rest of the app — no role restrictions).
- **Persistence:** Firebase Firestore, synced in real-time across devices.
- **Stock continuity:** No shift resets — ending inventory of one shift becomes starting inventory of the next.
- **Deduction trigger:** When a ticket status changes to **Preparing** (ingredients are committed at that point).

---

## Architecture

### File structure
```
index.html       — loads inventory.js via <script src>, renders Inventory tab UI, calls inventory functions at status change events
inventory.js     — all inventory logic: Firestore listeners, deduction, restoration, restock, cost calculations
```

### Integration points

`inventory.js` exposes three functions that `index.html` calls at key events:

| Function | Called when |
|----------|-------------|
| `initInventory()` | App startup, alongside `initFirebase()` |
| `deductStock(ticketItems)` | Ticket status changes to `Preparing` |
| `restoreStock(ticketItems)` | Ticket reverts from `Preparing` to `Pending` (after user confirms) |

`inventory.js` owns its own Firestore `onSnapshot` listener and keeps state in `window.inventoryState` — a plain object keyed by `menuItemId`. `index.html` reads `window.inventoryState` when rendering the Inventory tab and the Orders tab low-stock banner.

### Firestore schema

```
/inventory/{menuItemId}
  - menuItemId: string           — matches menu item ID in /config/menu
  - purchaseUnitName: string     — e.g., "pack"
  - purchaseUnitSize: string     — e.g., "500g" (display label only)
  - unitsPerPurchase: number     — pieces/units per purchase unit (e.g., 20)
  - servingSize: number          — pieces per serving (e.g., 20)
  - costPerPurchase: number      — ₱ cost per purchase unit (whole numbers)
  - currentStock: number         — current stock in purchase units (fractional allowed)
  - lowStockThreshold: number    — warn when currentStock is at or below this value (in purchase units)

/inventory/{menuItemId}/restockLog/{auto-id}
  - timestamp: Firestore timestamp
  - purchaseUnitsAdded: number
  - note: string (optional)
```

---

## Section 1: Inventory Tab

A fourth tab added to the header nav: **Inventory**. Tab switching behavior is identical to the existing Orders / Admin / Report pattern.

### 1.1 Summary Cards

Three stat cards in a flex row at the top (consistent with Report tab):

| Card | Value |
|------|-------|
| **Total Stock Value** | Sum of `currentStock × costPerPurchase` across all tracked items |
| **Low Stock Items** | Count of items where `currentStock ≤ lowStockThreshold` and `currentStock > 0` |
| **Out of Stock** | Count of items where `currentStock = 0` |

### 1.2 Item Table

One row per Food menu item. Items with inventory configured show full data. Items without inventory configured show a faint **"+ Set up inventory"** action row so staff know they can add it.

**Columns:**

| Column | Notes |
|--------|-------|
| Item Name | From menu catalog |
| Purchase Unit | e.g., "3 packs (500g)" — `currentStock` + `purchaseUnitName` + `purchaseUnitSize` |
| Servings Remaining | `floor(currentStock × unitsPerPurchase / servingSize)` |
| Cost / Serving | `costPerPurchase ÷ (unitsPerPurchase ÷ servingSize)` |
| Revenue / Serving | Current menu item price |
| Margin % | `((revenue − cost) ÷ revenue) × 100` — color-coded badge |
| Stock Value | `currentStock × costPerPurchase` |
| Low Stock Threshold | Editable inline (in purchase units) |
| Status | Badge: **OK** / **Low** / **Out** |
| Actions | Restock, Edit, Delete |

**Row highlight colors:**
- Out of stock → red tint
- Low stock → amber tint
- OK → no highlight

**Margin badge colors:**
- ≥ 50% → green
- 20–49% → amber
- < 20% → red

**Revenue caveat:** Revenue uses the current catalog price, not a historical snapshot. A small label reads: "Based on current menu prices."

### 1.3 Restock Log

A table of the 50 most recent restock events across all items, newest first.

**Columns:** Date/Time | Item | Units Added | Note

A **"+ Restock"** button per item row (in the Item Table) opens a small inline form: units added (number input) + optional note. On confirm, increments `currentStock` in Firestore and writes a restock log entry to the subcollection.

---

## Section 2: Inventory Setup & Editing

### Adding inventory to a Food item

Clicking **"+ Set up inventory"** on an unconfigured item opens an inline form on that row:

| Field | Input | Validation |
|-------|-------|-----------|
| Purchase unit name | Text | Required |
| Purchase unit size | Text | Required (display label, e.g., "500g") |
| Units per purchase | Number | Required, min 1, whole numbers |
| Serving size | Number | Required, min 1, whole numbers |
| Cost per purchase unit | Number (₱) | Required, min 1, whole numbers |
| Starting stock | Number | Required, min 0, whole numbers |
| Low stock threshold | Number | Required, min 0, whole numbers |

On save, creates `/inventory/{menuItemId}` in Firestore.

### Editing an existing inventory item

Clicking **Edit** opens the same inline form pre-filled. Only one row can be in edit mode at a time — clicking Edit on another row auto-cancels the first (silently discards unsaved edits), consistent with the Admin tab behavior.

**Changing `unitsPerPurchase` or `servingSize` does not retroactively adjust `currentStock`** — only future deductions use the new ratio. This is noted in the edit form with a small inline warning.

### Deleting inventory config

A **Delete** button with a `confirm()` dialog:
> "Remove inventory tracking for [item name]? Current stock data and restock log will be deleted."

If confirmed, deletes the Firestore document and its `restockLog` subcollection. Does not affect the menu item itself.

---

## Section 3: Stock Deduction & Restoration

### Deduction — ticket moves to Preparing

When `updateTicketStatus()` changes a ticket to `Preparing`, `index.html` calls `deductStock(ticket.items)`.

For each line item in the ticket:
1. Skip if item has no inventory config (e.g., drinks).
2. Calculate: `purchaseUnitsToDeduct = quantity × (servingSize / unitsPerPurchase)`
3. Decrement `currentStock` by that amount.
4. Write updated `currentStock` to Firestore.
5. If `currentStock ≤ 0`: set `currentStock = 0` and set the menu item's `available: false` in Firestore (auto-hides it from the order panel).
6. If `currentStock ≤ lowStockThreshold` (but > 0): trigger low-stock indicator.

### Restoration — ticket reverts from Preparing to Pending

When a ticket's status changes from `Preparing` back to `Pending`, `index.html` shows a `confirm()` dialog before calling any inventory function:

> "Restore stock for this order? [list of tracked items and quantities] — OK / Cancel"

- **OK** → calls `restoreStock(ticket.items)`, reverses the deduction using the same formula, writes updated `currentStock` to Firestore. Does **not** automatically re-enable `available` on items that were auto-hidden — staff manage availability manually in the Admin tab.
- **Cancel** → status reverts to Pending but stock is not restored.

### Edge case — Preparing ticket re-opened, edited, and saved

If a Preparing ticket is re-opened, edited, and saved — its status resets to Pending (per existing Save behavior). The original deduction is **not reversed automatically**. Staff must restock manually if quantities changed. A small note appears on the Save button when the active ticket was previously in Preparing status: "Note: saving will not restore previously deducted stock."

---

## Section 4: Low-Stock Indicators on Orders Tab

### Warning banner

A dismissible warning banner appears above the order panel (right side) on the Orders tab when any tracked Food item is low or out of stock.

**Banner states (priority order — show highest applicable):**
1. Out of stock items present: "Some items are out of stock and have been hidden from the menu."
2. Low stock items only: "Some items are running low. Check the Inventory tab."

The banner has a close (×) button that hides it for the session. It reappears if the stock situation changes (a new item goes low or out of stock).

### Live updates

The banner re-evaluates on every `inventoryState` update (Firestore snapshot). No separate listener needed — `inventory.js` notifies `index.html` by calling a `renderLowStockBanner()` function after each snapshot.

---

## Section 5: Live Updates

The Inventory tab is live — it re-renders whenever `inventoryState` updates via Firestore snapshot. This mirrors the Report tab behavior: re-render only if the Inventory tab is currently active; otherwise render fresh when the tab is next opened.

`renderInventoryTab()` in `index.html` is called by `inventory.js` after each snapshot (if the tab is active).

---

## Out of Scope

- Drinks inventory (complex recipes — deferred)
- Per-shift stock resets
- Inventory history / audit log beyond the restock log
- Export or print
- Role-based access control
- Ingredient-level tracking (e.g., grams of sugar per drink)
- Supplier management
- Purchase order generation
