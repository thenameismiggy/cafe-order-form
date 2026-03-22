# Order Form — Design Spec
**Date:** 2026-03-22
**Status:** Approved

## Overview

A single-file (`index.html`) staff-operated order-taking web form for a café selling coffee drinks and Filipino street food. No backend, no build tools, no external dependencies. Menu data persists via `localStorage`. Orders live in memory for the session.

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
- `appState` (in-memory JS object) — active tickets, current view, selected ticket
- `localStorage['menu']` — menu catalog (persists across refreshes)

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
- **Order number** — auto-incremented, formatted as `#001`, `#002`, etc.
- **Line items** — array of `{ itemId, name, price, quantity }`
- **Total** — computed from line items
- **Status** — one of: `Pending`, `Preparing`, `Ready`, `Served`

### Status transitions
Staff can advance or set status freely via a dropdown or button group on the ticket card. No enforced one-way progression — staff may need to correct mistakes.

### Orders tab layout (side by side)
- **Left — Ticket list:** Cards for all active orders. Each card shows order #, total, item count, and status badge. Color-coded by status:
  - `Pending` → neutral/gray
  - `Preparing` → yellow/amber
  - `Ready` → green
  - `Served` → dimmed/muted
- Clicking a card opens it in the order panel for editing or status update.
- A **"+ New Order"** button creates a fresh ticket.

- **Right — Order panel:** Staff select items from the menu (grouped by category), set quantities, see a running total. Actions:
  - **Save** — adds/updates the ticket in the ticket list, clears the panel
  - **Submit** — saves the ticket, shows confirmation modal, marks order complete
  - **Cancel** — discards unsaved changes

### Confirmation modal
Shows full order summary: order #, line items with quantities and prices, total. A **"New Order"** button dismisses it and opens a fresh panel.

### Completed orders
Served orders are visually dimmed in the ticket list but remain visible during the session. They are not editable once marked Served.

---

## Section 3: Admin Tab

Manages the menu catalog stored in `localStorage`.

### Menu item schema
```json
{
  "id": "uuid-or-timestamp",
  "name": "Caramel Macchiato",
  "price": 85,
  "category": "Drinks",
  "available": true
}
```

### Categories
Fixed two categories: **Drinks** and **Food**.

### UI
- **Add item form** at the top: fields for Name, Price, Category, Available checkbox. Submit adds to catalog immediately.
- **Menu table** below, grouped by category. Columns: Name, Price, Available, Actions.
- **Actions per row:** Edit (inline — row becomes editable fields) and Delete (with confirmation prompt).
- Changes write to `localStorage` immediately and reflect in the order panel on next render.

### Default menu (seeded on first load if `localStorage` is empty)
**Drinks:** Black Coffee, Latte, Caramel Macchiato, Iced Tea, Fruit Soda
**Food:** French Fries, Fish Balls, Kwek-Kwek, Kikiam, Cheese Sticks

---

## Out of Scope

- User authentication / password protection
- Order history persistence across sessions
- Printing receipts
- Payment processing
- Multi-device sync
