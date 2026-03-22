# Code Quality Improvements — Design Spec
**Date:** 2026-03-22
**Status:** Approved

## Overview

Four internal improvements to the codebase: user-configurable categories (replacing hardcoded arrays), `getMenu()` result caching, `editingRowId` moved into `appState`, and event binding standardized to delegation. The first item adds a user-facing Admin feature; the other three are purely internal refactors.

---

## Change 1: User-Configurable Categories

### Storage

A new `categories` key in localStorage stores an ordered array of category name strings.

```json
["Drinks", "Food"]
```

**`getCategories()`** — reads and parses `localStorage['categories']`. Returns the array, or an empty array if the key is absent or unparseable. In normal operation this should never return empty — `seedCategoriesIfNeeded()` runs before any render and ensures the key is populated.

**`saveCategories(arr)`** — serializes the array and writes to `localStorage['categories']`. Called after every category mutation (add, rename, delete, reorder).

Both functions follow the same pattern as the existing `getMenu()` / `saveMenu()` pair. `getCategories()` is not cached (the list is small and infrequently read).

**Seeding:** A `seedCategoriesIfNeeded()` function checks if `localStorage['categories']` is absent. If so, it writes `['Drinks', 'Food']`. It is called on page load alongside `seedMenuIfNeeded()`, before any render function runs.

---

### Admin Tab — Category Management Section

A new section added to the Admin tab, above the existing menu item management. It contains:

- A list of current categories, each row showing:
  - Category name (editable inline — see Rename Behaviour below)
  - Up / Down reorder buttons (disabled via `disabled` attribute at first/last position respectively)
  - Delete button
- An "Add Category" input + button at the bottom of the list

**Reorder behaviour:** Each Up or Down click immediately calls `saveCategories()` with the updated array and re-renders the category management section. No pending state.

**Empty categories guard:** The Delete button is disabled when only one category remains. Staff cannot reduce the category list to zero — this prevents all menu items from becoming permanently unassignable.

---

### Rename Behaviour

Category name editing uses the same inline edit pattern as menu items. The rename is committed on **blur or Enter key**. On commit:

1. If the new name equals the original name (unchanged), cancel the edit and re-render without saving — no writes occur.
2. Validate the new name is not empty and does not match any other existing category (case-insensitive). If invalid, revert to the original name and re-render without saving.
3. Call `getMenu()` to get the current menu array. Iterate over the items in memory and update the `category` field on every item whose `category` exactly matches the old name (case-sensitive — since categories were validated unique case-insensitively at creation time, exact match is correct). Pass the mutated array to `saveMenu()`. **Do not write to `localStorage['menu']` directly** — all menu writes must go through `saveMenu()` to keep `_menuCache` valid.
4. Call `saveCategories()`.
5. Re-render the category section and menu table.

**Effect on the report tab:** `renderReportTab()` looks up each line item's menu item by `itemId` and reads its `category` field. When a menu item is found, its updated `category` field (post-rename) is used. When a menu item is not found (deleted), the lookup returns `undefined` — the existing code at line 724 handles this: `category: menuItem ? menuItem.category : 'Other'`. No new code required for this case.

The "Other" fallback in `renderReportTab()` (lines 724, 756–758) applies whenever a line item's resolved category name does not match any category in `getCategories()`. This covers: (a) the menu item was deleted (lookup returns undefined → 'Other'), and (b) the menu item exists but its category was deleted and not yet reassigned (the orphaned name doesn't match any group heading → falls through to 'Other').

---

### Deletion Behaviour

If a category being deleted has one or more menu items assigned to it, show a confirmation prompt. The item count X is derived from `getMenu()` at the time the delete button is clicked:

> "This category has X item(s). They will not appear in the order panel until reassigned to another category. Delete anyway?"

If staff confirms:
1. Remove the category from the array and call `saveCategories()`
2. Re-render the category management section, the menu table, and the order panel

The menu items assigned to the deleted category are retained in localStorage unchanged. They appear in the Admin table for reassignment and fall through to "Other" in the report tab.

If staff cancels: no change.

---

### Items in Deleted Categories

**In the Admin tab:** `renderMenuTable()` shows all menu items regardless of category validity. Items in deleted categories appear in the Admin table and can be reassigned via the inline edit row. The category dropdown in the edit row is populated from `getCategories()` — only valid categories are available for reassignment.

**In the order panel:** `renderOrderPanel()` groups items by category using `getCategories()`. Any item whose `category` value is not in the current categories list is excluded.

**In the report tab:** Items in deleted categories fall through to the "Other" group via the existing fallback (see Rename Behaviour above).

---

### All Category References Replaced

Every hardcoded `['Drinks', 'Food']` array in the JS is replaced with a `getCategories()` call:

- `renderMenuTable()` — category group headings
- `renderOrderPanel()` — category sections in the order form
- `renderReportTab()` — category sections in the item breakdown table
- Admin add-item form `<select>` — populated dynamically on render; first category is selected by default

---

## Change 2: `getMenu()` Caching

A module-level variable `let _menuCache = null` is added.

`getMenu()` returns `_menuCache` if it is not null. Otherwise it parses `localStorage['menu']`, stores the result in `_menuCache`, and returns it.

`saveMenu(items)` sets `_menuCache = null` after writing to localStorage (deliberately null rather than `items`, to avoid holding a stale reference if items is later mutated externally). The next `getMenu()` call re-reads and caches fresh data.

**Required invariant: all writes to `localStorage['menu']` must go through `saveMenu()`** — direct `localStorage.setItem('menu', ...)` calls bypass cache invalidation and produce stale reads. This applies to all code paths including the rename flow in Change 1.

**Multi-tab behaviour:** This cache is module-level and per-tab. The existing app has no cross-tab sync — adding a cache preserves that existing limitation without introducing new cross-tab bugs. This tradeoff is intentional and accepted.

---

## Change 3: `editingRowId` into `appState`

`let editingRowId = null` (currently a module-level standalone variable at line 345) is moved into `appState` as `appState.editingRowId: null`. The initial value `null` must be explicitly set in the `appState` object literal.

All references to `editingRowId` are updated to `appState.editingRowId`.

No behavior change.

---

## Change 4: Event Binding Standardization

The ticket cards container (`#ticket-cards`) and the admin menu table container (`#menu-table`) are updated to use event delegation — separate listeners on the stable parent container — instead of re-attaching listeners on every render.

**`#ticket-cards` delegation uses two listeners:**

- A `click` listener on `#ticket-cards`:
  ```js
  // Preserve existing guard: don't fire when clicking the status dropdown
  if (e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') return;
  const card = e.target.closest('.ticket-card:not(.served)');
  if (!card) return;
  openTicketInPanel(parseInt(card.dataset.ticketId, 10));
  ```

- A `change` listener on `#ticket-cards`:
  ```js
  const sel = e.target.closest('.status-select');
  if (!sel) return;
  updateTicketStatus(parseInt(sel.dataset.ticketId, 10), sel.value);
  ```

Note: `click` and `change` are separate event types and require separate `addEventListener` calls. No other interactive elements currently exist inside ticket cards beyond `.status-select`, so the `SELECT`/`OPTION` guard is sufficient.

**`#menu-table` delegation uses a `click` listener that handles:**
- Click on edit button → enter inline edit for that row
- Click on delete button → `deleteMenuItem(id)`
- Click on save button (inline edit) → commit edit
- Click on cancel button (inline edit) → discard edit

This matches the existing delegation pattern on `#order-panel`. No behavior change.

---

## Out of Scope

- Drag-to-reorder categories (up/down buttons only)
- Category-level reporting breakdowns beyond what already exists
- Retroactive rename of ticket line items when a category is renamed
