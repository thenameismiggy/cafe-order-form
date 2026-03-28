# French Fries Flavor Selection — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let staff optionally select up to 2 flavors (Cheese, BBQ, Sour Cream) when ordering French Fries, displayed on the ticket card and report tab.

**Architecture:** All changes are in `index.html` — a single-file vanilla JS app. Flavors are hardcoded. A new `panelFlavors` array in `appState` tracks the current selection. The flavor picker renders inline in the order panel below the fries stepper when qty > 0. Flavors are stored on the line item as `flavors: string[]`.

**Tech Stack:** Vanilla HTML/CSS/JS, no frameworks, no test runner — verification is manual in the browser.

---

## File Map

| File | Change |
|------|--------|
| `index.html` | All changes — constant, state, CSS, order panel HTML, event handlers, buildLineItems, openTicketInPanel, closePanel, renderTicketCards, renderReportTab |

---

### Task 1: Add constant and `panelFlavors` to `appState`

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add `FRIES_FLAVORS` constant after `DEFAULT_MENU`**

Find the line (around line 422):
```js
function seedMenuIfNeeded() {
```

Insert immediately before it:
```js
// ─── FRIES FLAVORS ────────────────────────────────────────────────────────────
const FRIES_FLAVORS = ['Cheese', 'BBQ', 'Sour Cream'];

```

- [ ] **Step 2: Add `panelFlavors` to `appState`**

Find:
```js
  panelQtys: {},        // { itemId: quantity } — current panel quantities (unsaved)
```

Replace with:
```js
  panelQtys: {},        // { itemId: quantity } — current panel quantities (unsaved)
  panelFlavors: [],     // string[], 0–2 entries — selected fries flavors (unsaved)
```

- [ ] **Step 3: Add CSS for the flavor picker**

Find the closing `</style>` tag and insert immediately before it:
```css
    /* === FRIES FLAVOR PICKER === */
    .fries-flavor-picker { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; padding: 0.4rem 0 0.2rem 0; font-size: 0.85rem; color: #555; }
    .flavor-label { font-weight: 600; color: #444; }
    .flavor-option { display: flex; align-items: center; gap: 0.25rem; cursor: pointer; }
    .flavor-option.disabled { opacity: 0.4; cursor: not-allowed; }
    .flavor-option input { cursor: pointer; }
    .flavor-option.disabled input { cursor: not-allowed; }
    .ticket-fries-flavor { font-size: 0.78rem; color: #777; margin-top: 0.2rem; }
```

- [ ] **Step 4: Verify the file still loads without errors**

Open `index.html` in a browser. No console errors. App looks and works exactly the same as before — nothing visible has changed yet.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add FRIES_FLAVORS constant, panelFlavors state, and flavor picker CSS"
```

---

### Task 2: Render the flavor picker in the order panel

**Files:**
- Modify: `index.html` — `renderOrderPanel()`, around line 838

- [ ] **Step 1: Update the menu item row template to include the flavor picker for French Fries**

Find this block inside `renderOrderPanel()`:
```js
        ${items.map(item => {
          const qty = appState.panelQtys[item.id] || 0;
          return `
            <div class="menu-item-row">
              <div class="item-info">
                <span class="item-name">${escHtml(item.name)}</span>
                <span class="item-price">${formatPrice(item.price)}</span>
              </div>
              <div class="stepper">
                <button class="stepper-minus" data-item-id="${item.id}" ${qty === 0 ? 'disabled' : ''} aria-label="Decrease">−</button>
                <span class="qty">${qty}</span>
                <button class="stepper-plus" data-item-id="${item.id}" ${qty >= 10 ? 'disabled' : ''} aria-label="Increase">+</button>
              </div>
            </div>`;
        }).join('')}
```

Replace with:
```js
        ${items.map(item => {
          const qty = appState.panelQtys[item.id] || 0;
          const isFries = item.name === 'French Fries';
          const flavorPickerHtml = (isFries && qty > 0) ? `
            <div class="fries-flavor-picker">
              <span class="flavor-label">Flavor:</span>
              ${FRIES_FLAVORS.map(f => {
                const checked = appState.panelFlavors.includes(f);
                const disabled = !checked && appState.panelFlavors.length >= 2;
                return `<label class="flavor-option${disabled ? ' disabled' : ''}">
                  <input type="checkbox" class="flavor-checkbox" data-flavor="${escHtml(f)}"
                    ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}> ${escHtml(f)}
                </label>`;
              }).join('')}
            </div>` : '';
          return `
            <div class="menu-item-row">
              <div class="item-info">
                <span class="item-name">${escHtml(item.name)}</span>
                <span class="item-price">${formatPrice(item.price)}</span>
              </div>
              <div class="stepper">
                <button class="stepper-minus" data-item-id="${item.id}" ${qty === 0 ? 'disabled' : ''} aria-label="Decrease">−</button>
                <span class="qty">${qty}</span>
                <button class="stepper-plus" data-item-id="${item.id}" ${qty >= 10 ? 'disabled' : ''} aria-label="Increase">+</button>
              </div>
              ${flavorPickerHtml}
            </div>`;
        }).join('')}
```

- [ ] **Step 2: Verify the flavor picker appears**

Open `index.html`. Click "New Order". Add French Fries (press `+`). Confirm the flavor picker appears below the fries stepper row with three checkboxes: Cheese, BBQ, Sour Cream.

Reduce fries qty back to 0. Confirm the flavor picker disappears.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: render fries flavor picker in order panel"
```

---

### Task 3: Wire up flavor checkbox interactions

**Files:**
- Modify: `index.html` — event listener block after stepper listeners in `renderOrderPanel()`, plus the stepper-minus handler

- [ ] **Step 1: Add flavor checkbox listener after the stepper listeners in `renderOrderPanel()`**

Find this block (at the end of `renderOrderPanel()`):
```js
  panelEl.querySelectorAll('.stepper-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.itemId, 10);
      if ((appState.panelQtys[id] || 0) > 0) {
        appState.panelQtys[id]--;
        renderOrderPanel();
      }
    });
  });
}
```

Replace with:
```js
  panelEl.querySelectorAll('.stepper-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.itemId, 10);
      if ((appState.panelQtys[id] || 0) > 0) {
        appState.panelQtys[id]--;
        const menu = getMenu() || [];
        const item = menu.find(m => m.id === id);
        if (item && item.name === 'French Fries' && appState.panelQtys[id] === 0) {
          appState.panelFlavors = [];
        }
        renderOrderPanel();
      }
    });
  });

  panelEl.querySelectorAll('.flavor-checkbox').forEach(cb => {
    cb.addEventListener('change', () => {
      const flavor = cb.dataset.flavor;
      if (cb.checked) {
        if (appState.panelFlavors.length < 2) {
          appState.panelFlavors = [...appState.panelFlavors, flavor];
        }
      } else {
        appState.panelFlavors = appState.panelFlavors.filter(f => f !== flavor);
      }
      renderOrderPanel();
    });
  });
}
```

- [ ] **Step 2: Verify checkbox interactions**

Open `index.html`. New Order. Add French Fries. Check "Cheese" — it stays checked on re-render. Check "BBQ" — both Cheese and BBQ checked, "Sour Cream" checkbox is now disabled. Uncheck "Cheese" — Sour Cream becomes enabled again.

Reduce fries qty to 0. Add fries again. Confirm all checkboxes are unchecked (flavor reset when qty hit 0).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: wire up fries flavor checkbox interactions with 2-flavor cap"
```

---

### Task 4: Save and restore flavors in line items

**Files:**
- Modify: `index.html` — `buildLineItems()`, `openTicketInPanel()`, `closePanel()`

- [ ] **Step 1: Update `buildLineItems()` to include `flavors` on the French Fries line item**

Find:
```js
function buildLineItems() {
  const menu = getMenu() || [];
  return menu
    .filter(item => (appState.panelQtys[item.id] || 0) > 0)
    .map(item => ({
      itemId: item.id,
      name: item.name,
      price: item.price,
      quantity: appState.panelQtys[item.id],
    }));
}
```

Replace with:
```js
function buildLineItems() {
  const menu = getMenu() || [];
  return menu
    .filter(item => (appState.panelQtys[item.id] || 0) > 0)
    .map(item => ({
      itemId: item.id,
      name: item.name,
      price: item.price,
      quantity: appState.panelQtys[item.id],
      ...(item.name === 'French Fries' ? { flavors: [...appState.panelFlavors] } : {}),
    }));
}
```

- [ ] **Step 2: Update `openTicketInPanel()` to restore `panelFlavors`**

Find:
```js
  // Populate panelQtys from ticket's line items
  appState.panelQtys = {};
  ticket.lineItems.forEach(l => { appState.panelQtys[l.itemId] = l.quantity; });
```

Replace with:
```js
  // Populate panelQtys and panelFlavors from ticket's line items
  appState.panelQtys = {};
  appState.panelFlavors = [];
  ticket.lineItems.forEach(l => {
    appState.panelQtys[l.itemId] = l.quantity;
    if (l.name === 'French Fries' && Array.isArray(l.flavors)) {
      appState.panelFlavors = [...l.flavors];
    }
  });
```

- [ ] **Step 3: Update `closePanel()` to reset `panelFlavors`**

Find:
```js
function closePanel() {
  appState.panelOpen = false;
  appState.panelTicketId = null;
  appState.panelQtys = {};
  document.getElementById('orders-tab').classList.remove('panel-open');
  renderOrderPanel();
}
```

Replace with:
```js
function closePanel() {
  appState.panelOpen = false;
  appState.panelTicketId = null;
  appState.panelQtys = {};
  appState.panelFlavors = [];
  document.getElementById('orders-tab').classList.remove('panel-open');
  renderOrderPanel();
}
```

- [ ] **Step 4: Verify save and restore**

Open `index.html`. New Order. Add French Fries, select BBQ and Cheese. Click Save. Click the ticket card to reopen it. Confirm the flavor picker shows BBQ and Cheese checked.

Create a second order with French Fries and Sour Cream only. Save. Reopen — confirm only Sour Cream is checked.

Create an order with French Fries and no flavor selected. Save. Reopen — confirm no checkboxes are checked.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: save and restore fries flavors in line items"
```

---

### Task 5: Show flavor note on ticket card

**Files:**
- Modify: `index.html` — `renderTicketCards()`

- [ ] **Step 1: Update the ticket card template to show a flavor note**

Find inside `renderTicketCards()`:
```js
        <div class="ticket-meta">
          <span class="ticket-count">${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
          <select class="status-select ${statusClass}" data-ticket-id="${ticket.id}" ${isServed ? 'disabled' : ''}>
            ${['Pending','Preparing','Ready','Served'].map(s =>
              `<option value="${s}" ${ticket.status === s ? 'selected' : ''}>${s}</option>`
            ).join('')}
          </select>
        </div>
      </div>`;
```

Replace with:
```js
        <div class="ticket-meta">
          <span class="ticket-count">${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
          <select class="status-select ${statusClass}" data-ticket-id="${ticket.id}" ${isServed ? 'disabled' : ''}>
            ${['Pending','Preparing','Ready','Served'].map(s =>
              `<option value="${s}" ${ticket.status === s ? 'selected' : ''}>${s}</option>`
            ).join('')}
          </select>
        </div>
        ${(() => {
          const friesLine = ticket.lineItems.find(l => l.name === 'French Fries' && Array.isArray(l.flavors) && l.flavors.length > 0);
          return friesLine ? `<div class="ticket-fries-flavor">Fries: ${escHtml(friesLine.flavors.join(' / '))}</div>` : '';
        })()}
      </div>`;
```

- [ ] **Step 2: Verify flavor note on ticket card**

Open `index.html`. Create an order with French Fries + BBQ/Cheese. Save. The ticket card on the left should show `Fries: BBQ / Cheese` below the item count.

Create an order with French Fries and no flavor. Save. No flavor note appears on that ticket card.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: show fries flavor note on ticket card"
```

---

### Task 6: Show flavor in report tab line items

**Files:**
- Modify: `index.html` — `renderReportTab()`, the order details line item template

- [ ] **Step 1: Update the report tab line item to include flavor in the name**

Find inside `renderReportTab()`:
```js
              ${ticket.lineItems.map(l => `
                <div class="report-order-line">
                  <span>${escHtml(l.name)} × ${l.quantity}</span>
                  <span>${formatPrice(l.price * l.quantity)}</span>
                </div>`).join('')}
```

Replace with:
```js
              ${ticket.lineItems.map(l => {
                const displayName = (l.name === 'French Fries' && Array.isArray(l.flavors) && l.flavors.length > 0)
                  ? `${l.name} (${l.flavors.join(' / ')})`
                  : l.name;
                return `
                <div class="report-order-line">
                  <span>${escHtml(displayName)} × ${l.quantity}</span>
                  <span>${formatPrice(l.price * l.quantity)}</span>
                </div>`;
              }).join('')}
```

- [ ] **Step 2: Verify flavor in report tab**

Open `index.html`. Create and submit an order with French Fries + Sour Cream. Go to the Report tab. In the Order Details section, the fries line should read `French Fries (Sour Cream) × 1`.

Create another order with French Fries + BBQ/Cheese. Submit. Report shows `French Fries (BBQ / Cheese) × 1`.

Create an order with plain French Fries (no flavor). Submit. Report shows `French Fries × 1` (no parenthetical).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: show fries flavor in report tab line items"
```

---

## Done

All six tasks complete. The full flavor selection feature is live:
- Flavor picker appears in order panel when French Fries qty > 0
- Up to 2 flavors selectable; 3rd checkbox disables when cap reached
- Flavors saved on line item, restored when editing a ticket
- Ticket card shows flavor note (e.g. `Fries: BBQ / Cheese`)
- Report tab shows flavor inline (e.g. `French Fries (BBQ / Cheese) × 2`)
