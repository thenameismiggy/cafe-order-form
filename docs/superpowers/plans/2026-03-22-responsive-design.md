# Responsive Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the café order form usable on mobile phones and tablets (≤768px) via a CSS media query block, a mobile two-view navigation pattern for the Orders tab, and horizontal-scroll wrappers for tables.

**Architecture:** Single `index.html` modification only. CSS adds a `@media (max-width: 768px)` block. HTML adds an admin table scroll wrapper. JS adds `panel-open` class toggling to the Orders tab and injects a mobile back button inside `renderOrderPanel()`'s generated HTML. No new state is introduced.

**Tech Stack:** Vanilla HTML5/CSS3/JavaScript (ES6+), no frameworks, no build tools. Single file.

---

## File Structure

Only one file is modified:

- **Modify:** `index.html` — CSS section (~line 148), HTML section (~lines 211), JS section (~lines 475–806)

---

### Task 1: CSS — Back button base style and responsive media query block

**Files:**
- Modify: `index.html` — `<style>` block

Two additions to the CSS:

**Part A — Base style for mobile-only back button** (hidden on desktop)

Add this line to the `/* === BUTTONS ===*/` section (around line 81, after `.btn-new-order:hover`):

```css
#btn-back-mobile { display: none; }
```

**Part B — Full `@media (max-width: 768px)` block**

Add the following complete block immediately before `</style>` (after line 147, before `</style>` on line 148):

```css
    /* === RESPONSIVE (≤768px) === */
    @media (max-width: 768px) {
      /* Header */
      header { gap: 0.75rem; }
      .tab-btn { padding: 0.75rem 0.85rem; }

      /* Orders tab — single-column two-view layout */
      #orders-tab.active { display: block; height: auto; overflow: visible; }
      .ticket-list { width: 100%; min-width: 0; height: calc(100vh - 56px); border-right: none; }
      .order-panel { display: none; width: 100%; height: calc(100vh - 56px); padding: 1rem; }
      #orders-tab.panel-open .ticket-list { display: none; }
      #orders-tab.panel-open .order-panel { display: block; }

      /* Back button — visible on mobile only */
      #btn-back-mobile { display: flex; align-items: center; gap: 0.3rem; margin-bottom: 1rem; }

      /* Admin tab */
      #admin-tab { padding: 1rem; }
      .table-scroll-wrap { overflow-x: auto; }
      td input[type="text"] { width: 120px; }

      /* Report tab */
      #report-tab { padding: 1rem; }
      .report-table-wrap { overflow-x: auto; }

      /* Modal */
      .modal-box { padding: 1.1rem; margin: 0 1rem; }
    }
```

- [ ] **Step 1: Add `#btn-back-mobile { display: none; }` to the BUTTONS section**

Find this line (around line 81):
```css
    .btn-new-order:hover { border-color: #1a1a2e; color: #1a1a2e; }
```

Add immediately after it:
```css
    #btn-back-mobile { display: none; }
```

- [ ] **Step 2: Add the full `@media` block before `</style>`**

Find:
```css
    .report-empty { color: #aaa; text-align: center; padding: 3rem 1rem; font-size: 0.9rem; }
  </style>
```

Replace with:
```css
    .report-empty { color: #aaa; text-align: center; padding: 3rem 1rem; font-size: 0.9rem; }

    /* === RESPONSIVE (≤768px) === */
    @media (max-width: 768px) {
      /* Header */
      header { gap: 0.75rem; }
      .tab-btn { padding: 0.75rem 0.85rem; }

      /* Orders tab — single-column two-view layout */
      #orders-tab.active { display: block; height: auto; overflow: visible; }
      .ticket-list { width: 100%; min-width: 0; height: calc(100vh - 56px); border-right: none; }
      .order-panel { display: none; width: 100%; height: calc(100vh - 56px); padding: 1rem; }
      #orders-tab.panel-open .ticket-list { display: none; }
      #orders-tab.panel-open .order-panel { display: block; }

      /* Back button — visible on mobile only */
      #btn-back-mobile { display: flex; align-items: center; gap: 0.3rem; margin-bottom: 1rem; }

      /* Admin tab */
      #admin-tab { padding: 1rem; }
      .table-scroll-wrap { overflow-x: auto; }
      td input[type="text"] { width: 120px; }

      /* Report tab */
      #report-tab { padding: 1rem; }
      .report-table-wrap { overflow-x: auto; }

      /* Modal */
      .modal-box { padding: 1.1rem; margin: 0 1rem; }
    }
  </style>
```

- [ ] **Step 3: Verify by opening in browser and resizing**

Open `index.html` in a browser. Resize to ≤768px width (Chrome DevTools → toggle device toolbar). Verify:
- Tab buttons shrink (no overflow)
- Orders tab shows full-width ticket list (order panel hidden)
- Admin and Report tabs show reduced padding
- No console errors

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/Miggy/documents/order-form-test"
git add index.html
git commit -m "feat: add responsive CSS media query block"
```

---

### Task 2: HTML — Admin table scroll wrapper

**Files:**
- Modify: `index.html` — admin tab HTML section (~line 211)

Wrap the `#menu-table` div in a scroll container so the admin table can scroll horizontally on narrow screens without breaking the layout.

The `#menu-table` div must remain the inner element — JS renders into it via `document.getElementById('menu-table')`, which must continue to work unchanged.

- [ ] **Step 1: Wrap `#menu-table` in `.table-scroll-wrap`**

Find (around line 211):
```html
    <div class="menu-table" id="menu-table"><!-- rendered by JS --></div>
```

Replace with:
```html
    <div class="table-scroll-wrap">
      <div class="menu-table" id="menu-table"><!-- rendered by JS --></div>
    </div>
```

- [ ] **Step 2: Verify admin table renders correctly**

Open `index.html`. Go to the Admin tab. Verify the menu table renders with all items and no visual regressions. Add and edit an item to confirm JS still works (`document.getElementById('menu-table')` is intact). Resize to mobile width and verify the table scrolls horizontally.

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/Miggy/documents/order-form-test"
git add index.html
git commit -m "feat: wrap admin menu table in scroll container for mobile"
```

---

### Task 3: JS — Mobile back button in renderOrderPanel + panel-open toggles

**Files:**
- Modify: `index.html` — JS section

Four changes:

**Part A — Add back button to `renderOrderPanel()` generated HTML**

Note: The spec describes adding the back button as a static HTML element. This plan intentionally uses JS injection instead, because `renderOrderPanel()` replaces `#order-panel`'s entire `innerHTML` on every render — a static element would be destroyed. JS injection is more robust for this codebase.

The back button (`id="btn-back-mobile"`) must be injected by JS because `renderOrderPanel()` replaces `#order-panel`'s entire `innerHTML`. The button is added inside the `<div class="panel-form">` as the first child, in both the "no items available" case and the normal order form case.

Find the "no items available" render path (around line 490):
```js
  if (availableItems.length === 0) {
    panelEl.innerHTML = `
      <div class="panel-form">
        <p style="color:#888;text-align:center;padding:2rem 0;">No items available. Add items in the Admin tab.</p>
      </div>`;
    return;
  }
```

Replace with:
```js
  if (availableItems.length === 0) {
    panelEl.innerHTML = `
      <div class="panel-form">
        <button id="btn-back-mobile" class="btn btn-ghost btn-sm">← Orders</button>
        <p style="color:#888;text-align:center;padding:2rem 0;">No items available. Add items in the Admin tab.</p>
      </div>`;
    return;
  }
```

Find the main form `innerHTML` assignment (around line 522):
```js
  panelEl.innerHTML = `
    <div class="panel-form">
      <h2>${title}</h2>
```

Replace with:
```js
  panelEl.innerHTML = `
    <div class="panel-form">
      <button id="btn-back-mobile" class="btn btn-ghost btn-sm">← Orders</button>
      <h2>${title}</h2>
```

**Part B — Add back button handler to the existing panel click delegation**

Find the panel click delegation (around line 800):
```js
document.getElementById('order-panel').addEventListener('click', e => {
  const btn = e.target.closest('button[id]');
  if (!btn) return;
  if (btn.id === 'btn-save')   handleSave();
  if (btn.id === 'btn-submit') handleSubmit();
  if (btn.id === 'btn-cancel') handleCancel();
});
```

Replace with:
```js
document.getElementById('order-panel').addEventListener('click', e => {
  const btn = e.target.closest('button[id]');
  if (!btn) return;
  if (btn.id === 'btn-save')        handleSave();
  if (btn.id === 'btn-submit')      handleSubmit();
  if (btn.id === 'btn-cancel')      handleCancel();
  if (btn.id === 'btn-back-mobile') document.getElementById('orders-tab').classList.remove('panel-open');
});
```

**Part C — Add `panel-open` in `openTicketInPanel()`**

Find (around line 774):
```js
  appState.panelOpen = true;
  renderOrderPanel();
  renderTicketCards();
}
```

Replace with:
```js
  appState.panelOpen = true;
  document.getElementById('orders-tab').classList.add('panel-open');
  renderOrderPanel();
  renderTicketCards();
}
```

**Part D — Add `panel-open` in the New Order button handler**

Find (around line 793):
```js
  appState.panelOpen = true;
  renderOrderPanel();
  renderTicketCards();
});
```

Replace with:
```js
  appState.panelOpen = true;
  document.getElementById('orders-tab').classList.add('panel-open');
  renderOrderPanel();
  renderTicketCards();
});
```

**Part E — Remove `panel-open` in `closePanel()`**

Find (around line 779):
```js
function closePanel() {
  appState.panelOpen = false;
  appState.panelTicketId = null;
  appState.panelQtys = {};
  renderOrderPanel();
}
```

Replace with:
```js
function closePanel() {
  appState.panelOpen = false;
  appState.panelTicketId = null;
  appState.panelQtys = {};
  document.getElementById('orders-tab').classList.remove('panel-open');
  renderOrderPanel();
}
```

- [ ] **Step 1: Apply Part A** — add back button to both render paths in `renderOrderPanel()`
- [ ] **Step 2: Apply Part B** — add back button handler to panel click delegation
- [ ] **Step 3: Apply Parts C, D, E** — add/remove `panel-open` in `openTicketInPanel`, New Order handler, `closePanel`
- [ ] **Step 4: Verify mobile navigation flow**

Open in browser at ≤768px width:
1. Orders tab shows ticket list full-width, panel hidden
2. Click "New Order" → panel slides in, ticket list hidden, "← Orders" button visible at top
3. Click "← Orders" → ticket list returns, panel hidden
4. Create a ticket (Save) → panel closes, ticket list shows the new ticket
5. Click the ticket card → panel opens with ticket contents, "← Orders" visible
6. Cancel → ticket list returns
7. Verify on desktop (>768px): "← Orders" button NOT visible at any point

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/Miggy/documents/order-form-test"
git add index.html
git commit -m "feat: mobile two-view navigation with panel-open toggle and back button"
```

---

## Manual Verification Checklist

After all tasks complete:

- [ ] Header fits on 375px screen — no overflow, all 3 tab labels visible
- [ ] Orders tab ticket list fills screen on mobile, order panel hidden by default
- [ ] Tapping a ticket or New Order shows the order panel full-width
- [ ] "← Orders" button visible on mobile, hidden on desktop
- [ ] Tapping "← Orders" returns to ticket list (panel state preserved)
- [ ] Save / Submit / Cancel close the panel and return to ticket list on mobile
- [ ] Admin tab table scrolls horizontally on mobile, JS add/edit/delete still works
- [ ] Report tab item breakdown table scrolls horizontally on mobile
- [ ] Summary cards wrap to two rows on narrow screens
- [ ] Confirmation modal fits within screen on mobile (no edge clipping)
- [ ] Desktop layout (>768px) is completely unchanged — no regressions
- [ ] Tapping "← Orders" does NOT discard panel quantities — reopening the same ticket shows unchanged values
