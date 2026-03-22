# Order Form — Design Spec
**Date:** 2026-03-22
**Status:** Approved

## Overview

A single-file (`index.html`) staff-operated order-taking web form for a café selling coffee drinks and Filipino street food. No backend, no build tools, no external dependencies. Menu data persists via `localStorage` (survives page refresh). Orders live in memory only — a page refresh clears all active tickets.

---

## Context

- **Operator:** Counter staff taking customer orders
- **Business type:** Café — coffee drinks + Filipino street food (fries, fish balls, etc.)
- **Deployment:** Open `index.html` directly in a browser — no server needed
- **On submit:** Display a confirmation modal with order summary; no data sent anywhere
- **Concurrent orders:** Multiple active tickets at once (e.g., multiple tables or walk-up customers)

---

## Architecture

Single `index.html` with inline `<style>` and a `<script>` block. No frameworks, no build step.

**State:**
- `appState` (in-memory JS object) — active tickets, current view, selected ticket, order counter
- `localStorage['menu']` — menu catalog (persists across page refreshes)

The order number counter is in-memory only. It resets to `#001` on every page load. Order numbers are session-scoped and will repeat across sessions — this is intentional and acceptable for a simple counter display.

**Two tabs:**
1. **Orders** — manage active tickets
2. **Admin** — manage menu catalog

---

## Section 1: Structure

```
index.html
  ├── <header>  — tab navigation (Orders | Admin)
  ├── #orders-tab
  │     ├── .ticket-list   — all active order cards (left panel)
  │     └── .order-panel   — new/active order editor (right panel)
  ├── #admin-tab
  │     ├── .add-item-form
  │     └── .menu-table    — items grouped by category
  └── #confirmation-modal  — shown on order submit
```

---

## Section 2: Order Flow & Status

### Ticket lifecycle

Each ticket has:
- **Order number** — auto-incremented integer, formatted as `#001`, `#002`, etc. Resets on page load.
- **Line items** — array of `{ itemId, name, price, quantity }` where `price` is the item's price at the time it was added to the panel (not live-updated if admin later changes the price). Deleting a catalog item does not retroactively remove it from open panels — in-panel line items are snapshots.
- **Total** — computed from line items
- **Status** — one of: `Pending`, `Preparing`, `Ready`, `Served`

### Status transitions
Staff can set status freely via a `<select>` dropdown on the **ticket card** (left panel). No enforced one-way progression.

**Setting status to `Served` via the dropdown** locks the card immediately (no confirmation modal). The card becomes dimmed and non-clickable. This is distinct from pressing **Submit** in the order panel, which also marks the order Served but additionally shows the confirmation modal.

When a ticket is open in the right panel and its status is changed via the left-panel card dropdown, the panel re-renders to reflect the updated status. If the ticket is locked to `Served` via the dropdown while open in the panel, the panel clears.

### Dirty state definition
- **New order panel:** dirty when at least one item's quantity is greater than 0.
- **Editing an existing ticket:** dirty when any current quantity differs from the persisted ticket's quantities (including zeroing out all items).

### Orders tab layout (side by side)
- **Left — Ticket list:** Cards for all active orders. Each card shows order #, total, item count, and status badge. Color-coded by status using CSS classes:
  - `Pending` → `.status-pending` (gray)
  - `Preparing` → `.status-preparing` (amber)
  - `Ready` → `.status-ready` (green)
  - `Served` → `.status-served` (dimmed/muted, visually de-emphasized)
- Clicking a card opens it in the order panel.
- Served ticket cards are **not clickable** — they are display-only in the list.
- A **"+ New Order"** button creates a fresh ticket and opens it in the panel.
  - If the panel is dirty (see dirty state definition above), clicking "+ New Order" shows a native `confirm()` dialog: "You have an unsaved order. Discard it and start a new one?" If confirmed, the current panel is cleared. If cancelled, nothing changes.

- **Right — Order panel:** Staff build or edit the active order.
  - Menu items are displayed grouped by category (Drinks, then Food).
  - Unavailable items (`available: false`) are **hidden** from the order panel entirely.
  - Each available item shows its name, price (formatted as `₱85`), and a **stepper control** (`-` button, quantity display, `+` button). Quantity defaults to 0. The `-` button is disabled when quantity is 0. Items with quantity > 0 are included as line items.
  - A running total updates live as quantities change. Total is formatted as `₱85`.
  - All prices are whole numbers — no decimals displayed anywhere in the UI.
  - **Empty menu state:** If the menu catalog has no available items, the panel shows a message: "No items available. Add items in the Admin tab." No order controls are shown and Save/Submit are hidden.
  - Actions:
    - **Save** — validates that at least one item has quantity > 0 (shows inline error "Add at least one item" if not); on success, creates or updates the ticket, resets its status to `Pending`, and clears the panel to a blank state
    - **Submit** — same validation as Save; on success, saves the ticket, marks it `Served`, shows the confirmation modal, then clears the panel
    - **Cancel** — if editing an existing ticket, reverts all quantities to the ticket's persisted values (even if the ticket has no saved line items) and clears the panel. If the panel holds a new unsaved order, clears the panel to a blank state with no confirmation dialog.

### Save behavior and status
Save always resets the ticket's status to `Pending`. This is intentional: if a `Ready` ticket is re-opened and modified, it is no longer ready to serve.

### Confirmation modal
Shows full order summary: order #, line items with per-item subtotal (quantity × unit price), and grand total. All amounts displayed as `₱N`. A **"Done"** button dismisses the modal. Pressing **Escape** or clicking the backdrop also dismisses the modal (same behavior as Done).

### Served orders
Once a ticket reaches `Served` status (via Submit button or dropdown), its card is dimmed and not clickable. The status `<select>` dropdown on a Served card is `disabled` — it cannot be changed back. The ticket cannot be reopened or edited.

---

## Section 3: Admin Tab

Manages the menu catalog stored in `localStorage`.

### Menu item schema
```json
{
  "id": 1711084800000,
  "name": "Caramel Macchiato",
  "price": 85,
  "category": "Drinks",
  "available": true
}
```

`id` is a `Date.now()` timestamp assigned at creation time.

### Categories
Fixed two categories: **Drinks** and **Food**. All form fields that accept a category use a `<select>` with exactly these two options.

### UI
- **Add item form** at the top: Name (text input, required, max 50 characters), Price (number input, min 1, whole numbers only), Category (`<select>`: Drinks / Food), Available (checkbox, defaults checked). Submit adds to catalog immediately and persists to `localStorage`.
- **Menu table** below, grouped by category. Columns: Name, Price, Available, Actions.
  - Available column in read-only mode displays "Yes" or "No".
- **Actions per row:**
  - **Edit** — row fields become inline editable inputs with the same validation rules as the Add Item form (Name required, max 50 characters; Price min 1). Two buttons appear on the row: **Save** (validates and commits to `localStorage`) and **Cancel** (restores the previous values). Only one row can be in edit mode at a time.
  - **Delete** — shows a native `confirm()` dialog: "Delete [item name]?" If confirmed, removes from catalog and updates `localStorage`.

### Default menu seeding
On page load, if `localStorage['menu']` is absent (key does not exist), seed the default menu. If the key exists (even as an empty array — meaning staff deleted all items intentionally), do **not** re-seed.

**Default items:**
- **Drinks:** Black Coffee (₱60), Latte (₱85), Caramel Macchiato (₱95), Iced Tea (₱50), Fruit Soda (₱55)
- **Food:** French Fries (₱40), Fish Balls (₱25), Kwek-Kwek (₱25), Kikiam (₱30), Cheese Sticks (₱45)

---

## Out of Scope

- User authentication / password protection
- Order history persistence across sessions
- Printing receipts
- Payment processing
- Multi-device sync
