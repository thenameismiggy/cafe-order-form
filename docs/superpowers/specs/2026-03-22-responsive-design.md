# Responsive Design — Design Spec
**Date:** 2026-03-22
**Status:** Approved

## Overview

Make the single-file café order form (`index.html`) responsive for mobile phones and tablets. All changes are CSS-only via a `@media (max-width: 768px)` block, with one small JS addition for the Orders tab mobile navigation (a `panel-open` class toggle and a back button).

---

## Context

- **Target breakpoint:** 768px and below (phones and small tablets — covers iPad mini portrait and all phones)
- **Desktop behavior:** Unchanged at viewports wider than 768px
- **Approach:** Add a single `@media (max-width: 768px)` block at the bottom of the existing `<style>` section. Minimal JS additions only for the Orders tab two-view navigation.

---

## Section 1: Header & Navigation

On mobile (≤768px):

- Header `gap` reduces from `2rem` to `0.75rem`
- Tab button padding reduces from `1rem 1.25rem` to `0.75rem 0.85rem`
- Header height remains 56px — no adjustment to `calc(100vh - 56px)` needed

---

## Section 2: Orders Tab — Two-View Mobile Layout

The desktop side-by-side layout (ticket list left, order panel right) becomes a two-view pattern on mobile.

### Default view — Ticket List

- `.ticket-list` takes `width: 100%`
- `.order-panel` is hidden (`display: none`)

### Panel view — Order Editor

When a ticket is opened or a new order is started, the class `panel-open` is added to `#orders-tab`.

CSS rules for `#orders-tab.panel-open` on mobile:
- `.ticket-list` is hidden (`display: none`)
- `.order-panel` is shown (`display: block`), takes full width

### Back button

A "← Orders" button is added at the top of the order panel in the HTML. On desktop it is hidden (`display: none`). On mobile it is shown (`display: block`).

Clicking the back button:
- Removes `panel-open` from `#orders-tab`
- Does **not** discard panel contents — the panel state (current quantities, open ticket) is preserved. The back button is purely a navigation gesture, not a cancel action.

### JS changes

The following functions add `panel-open` to `#orders-tab` after opening the panel:
- `openTicketInPanel()`
- New Order button click handler

The following functions remove `panel-open` from `#orders-tab` after closing the panel:
- `closePanel()` — called by Save, Submit, Cancel, and status-set-to-Served

The back button gets a direct click listener that removes `panel-open`.

---

## Section 3: Admin Tab

On mobile:

- `#admin-tab` padding reduces to `1rem`
- The menu table (`#menu-table`) is wrapped in a `<div class="table-scroll-wrap">` in the HTML
- `.table-scroll-wrap` gets `overflow-x: auto` so the admin table scrolls horizontally rather than overflowing
- Inline edit text inputs (`td input[type="text"]`) width reduces from `160px` to `120px`

---

## Section 4: Report Tab

On mobile:

- `#report-tab` padding reduces to `1rem`
- Summary cards (`.report-summary-cards`) already use `flex-wrap: wrap` with `min-width: 180px` — no changes needed
- `.report-table-wrap` gets `overflow-x: auto` so the item breakdown table scrolls horizontally
- Per-order entries (`.report-order-entry`) are already column layout — no changes needed

---

## Section 5: Confirmation Modal

On mobile:

- `.modal-box` padding reduces from `1.75rem` to `1.1rem`
- `.modal-box` gets `margin: 0 1rem` so it does not touch screen edges

---

## Out of Scope

- Touch gestures (swipe to go back)
- Bottom navigation bar
- Landscape-specific layouts
- Font size scaling beyond what the browser default handles
