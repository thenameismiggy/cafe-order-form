# French Fries Flavor Selection — Design Spec

**Date:** 2026-03-28
**Scope:** Order form (`index.html`) — flavor picker for French Fries only

---

## Overview

When a customer orders French Fries, staff can optionally select up to 2 flavors (half-and-half style). Flavors are included in the base price. Selection is optional.

Available flavors: **Cheese**, **BBQ**, **Sour Cream** (hardcoded).

---

## Data Model

### Constant

```js
const FRIES_FLAVORS = ['Cheese', 'BBQ', 'Sour Cream'];
```

French Fries is identified by `item.name === 'French Fries'`.

### `appState`

Add one field:

```js
panelFlavors: []  // string[], 0–2 entries; only meaningful when fries qty > 0
```

### Line item

The French Fries line item gets an optional `flavors` field:

```js
{ itemId, name, price, quantity, flavors: [] }
// flavors: string[], 0–2 entries — empty array means no flavor chosen
```

All other line items are unaffected (no `flavors` field).

---

## Order Panel UI

- When French Fries qty > 0, render a flavor picker directly below the fries stepper row.
- The picker shows three checkboxes: Cheese, BBQ, Sour Cream.
- Once 2 are checked, all remaining unchecked boxes are disabled.
- Unchecking one re-enables the others.
- When French Fries qty drops to 0, hide the picker and reset `panelFlavors` to `[]`.
- When editing an existing ticket, `panelFlavors` is populated from the saved line item's `flavors` array (same pattern as `panelQtys` restoration).

---

## Display

### Ticket card (left list)

- Item count and total: unchanged.
- If fries have at least one flavor selected, show a small flavor note below the item count:
  - Example: `Fries: BBQ / Cheese`
  - If no flavor selected, show nothing extra.

### Report tab — line items

- Render flavor inline with the item name when present:
  - With flavor: `French Fries (BBQ / Cheese) × 2`
  - Without flavor: `French Fries × 2` (no change)

---

## `buildLineItems()` changes

The French Fries entry in the returned array includes `flavors: [...appState.panelFlavors]`. All other items are unchanged.

---

## Out of scope

- Flavors on any menu item other than French Fries.
- Admin UI for managing flavors.
- Flavor-based price differences.
- Requiring a flavor selection before save/submit.
