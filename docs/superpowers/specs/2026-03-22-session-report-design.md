# Session Report — Design Spec
**Date:** 2026-03-22
**Status:** Approved

## Overview

A third tab ("Report") added to the existing two-tab order form (`index.html`). It shows a live session summary of all non-Pending tickets, broken down by status (Served, Ready, Preparing). Session-scoped only — clears on page refresh, matching ticket behavior.

---

## Context

- **Operator:** Counter staff monitoring sales and inventory usage during a shift
- **Session scope:** In-memory only; resets with page refresh (same as tickets)
- **Live updates:** The report re-renders automatically whenever a ticket status changes — no manual refresh or generate button
- **Statuses tracked:** Served (confirmed revenue), Ready (awaiting pickup), Preparing (in preparation). Pending orders are excluded — no inventory has been touched yet.

---

## Architecture

Single `index.html` addition — a new `#report-tab` panel and a `renderReportTab()` function. No new state is introduced; the report derives everything by filtering `appState.tickets`. `renderReportTab()` is called:
- When the Report tab is clicked (active tab switch)
- After any `updateTicketStatus()` call
- After `handleSave()`, `handleSubmit()`, or any action that creates or modifies a ticket

---

## Section 1: Tab Navigation

The header tab bar gains a third tab: **Report**. Tab switching behavior is identical to the existing Orders/Admin pattern — `classList.add/remove('active')` on both the nav button and the panel.

---

## Section 2: Report Tab Layout

The `#report-tab` panel has three stacked sections:

### 2.1 Summary Cards

Three stat cards displayed in a row (flex, wraps on narrow screens):

| Card | Value |
|------|-------|
| **Confirmed Revenue** | Sum of totals from all `Served` tickets |
| **Awaiting Pickup** | Sum of totals from all `Ready` tickets |
| **In Preparation** | Sum of totals from all `Preparing` tickets |

All amounts formatted as `₱N` (whole numbers, no decimals), consistent with the rest of the app. Cards show ₱0 when no tickets exist in that status.

### 2.2 Item Breakdown Table

A table grouped by category (Drinks first, then Food), one row per menu item that has at least one unit across any tracked status.

**Columns:** Item Name | Served | Ready | Preparing

Each status column cell shows quantity and subtotal in a single cell, e.g. `3 — ₱255`. If quantity is 0 for that status, the cell shows `—`.

- Subtotal = quantity × unit price (the price recorded in the line item snapshot, not the current catalog price)
- Items with zero quantity across all three statuses are hidden
- If an entire category has no items to show, the category heading is hidden too
- If no tickets exist at all in any tracked status, show a message: "No orders have been placed yet this session."

### 2.3 Per-Order List

All tickets with status `Served`, `Ready`, or `Preparing`, listed in ascending order number sequence (i.e., `#001` first).

Each entry shows:
- Order number + status badge (color-coded, same CSS classes as ticket cards: `.status-served`, `.status-ready`, `.status-preparing`)
- Line items: name, quantity, unit price, line subtotal
- Order total

Pending tickets are not shown. If no qualifying tickets exist, this section is hidden (the "no orders" message in 2.2 covers the empty state).

---

## Section 3: Live Update Triggers

`renderReportTab()` is called after every state mutation that could affect the report:

- `updateTicketStatus()` — status change on any ticket
- `handleSave()` — ticket created or updated (status resets to Pending on save, but existing Served/Ready/Preparing tickets may still be in the list)
- `handleSubmit()` — ticket submitted directly to Served

The report only re-renders if it is the active tab, to avoid unnecessary DOM work. If the Report tab is inactive, the render is skipped — it will render fresh when the tab is next activated.

---

## Section 4: Empty State

If `appState.tickets` has no tickets with status Served, Ready, or Preparing, the report tab shows:

> "No orders have been placed yet this session."

No cards, no table, no order list.

---

## Out of Scope

- Persistence across sessions (localStorage)
- Export to CSV or print
- Date/time timestamps on orders
- Filtering or sorting the report
- Responsive layout (handled in a separate feature)
