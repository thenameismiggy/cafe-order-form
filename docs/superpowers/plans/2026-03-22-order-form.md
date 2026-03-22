# Order Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single `index.html` staff-operated café order form with concurrent ticket management, live running totals, order status tracking, and a localStorage-backed admin menu editor.

**Architecture:** Everything lives in one `index.html` file with inline `<style>` and `<script>` — no build step, no dependencies. State is split between in-memory `appState` (tickets, UI state) and `localStorage` (menu catalog + ID counter). The UI is re-rendered by calling `render()` which rewrites the relevant DOM sections from current state.

**Tech Stack:** Vanilla HTML5, CSS3, JavaScript (ES6+), localStorage API. No frameworks, no libraries, no build tools.

---

## File Structure

| File | Responsibility |
|------|---------------|
| `index.html` | Everything — HTML structure, inline CSS, inline JS |

All tasks are additive edits to `index.html`. Build top-to-bottom: structure → styles → state → features.

> **Note on testing:** This project has no test runner. Pure logic functions (price formatting, dirty-state check, total computation) are verified with inline `console.assert()` calls in the browser console. UI behavior is verified by following the manual verification steps listed in each task. Open DevTools before starting.

---

## Task 1: HTML Skeleton + CSS Foundation

**Files:**
- Create: `index.html`

- [ ] **Step 1: Create `index.html` with full HTML structure**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Café Order Form</title>
  <style>
    /* === RESET & BASE === */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; font-size: 15px; background: #f5f5f5; color: #222; min-height: 100vh; }

    /* === HEADER / TABS === */
    header { background: #1a1a2e; padding: 0 1.5rem; display: flex; align-items: center; gap: 2rem; }
    header h1 { color: #fff; font-size: 1.1rem; padding: 1rem 0; white-space: nowrap; }
    .tab-nav { display: flex; gap: 0; }
    .tab-btn { background: none; border: none; color: #aaa; padding: 1rem 1.25rem; cursor: pointer; font-size: 0.95rem; border-bottom: 3px solid transparent; transition: color 0.15s, border-color 0.15s; }
    .tab-btn:hover { color: #fff; }
    .tab-btn.active { color: #fff; border-bottom-color: #e94560; }

    /* === TAB PANELS === */
    .tab-panel { display: none; }
    .tab-panel.active { display: block; }

    /* === ORDERS TAB LAYOUT === */
    #orders-tab { display: none; }
    #orders-tab.active { display: flex; height: calc(100vh - 56px); overflow: hidden; }
    .ticket-list { width: 300px; min-width: 260px; background: #fff; border-right: 1px solid #e0e0e0; overflow-y: auto; display: flex; flex-direction: column; }
    .ticket-list-header { padding: 1rem; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; background: #fff; z-index: 1; }
    .ticket-list-header h2 { font-size: 1rem; }
    .order-panel { flex: 1; overflow-y: auto; padding: 1.5rem; background: #f5f5f5; }

    /* === TICKET CARDS === */
    .ticket-card { padding: 0.85rem 1rem; border-bottom: 1px solid #f0f0f0; cursor: pointer; transition: background 0.1s; }
    .ticket-card:hover:not(.served) { background: #f9f9f9; }
    .ticket-card.served { opacity: 0.5; cursor: default; }
    .ticket-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; }
    .ticket-num { font-weight: 700; font-size: 0.95rem; }
    .ticket-total { font-weight: 600; color: #333; }
    .ticket-meta { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
    .ticket-count { font-size: 0.8rem; color: #888; }
    .status-select { font-size: 0.78rem; border: 1px solid #ddd; border-radius: 4px; padding: 0.2rem 0.4rem; background: #fff; cursor: pointer; }

    /* === STATUS BADGES === */
    .status-badge { font-size: 0.72rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.04em; }
    .status-pending  { background: #e8e8e8; color: #555; }
    .status-preparing { background: #fff3cd; color: #856404; }
    .status-ready    { background: #d1f7d1; color: #1a6a1a; }
    .status-served   { background: #f0f0f0; color: #aaa; }

    /* === ORDER PANEL CONTENT === */
    .panel-empty { color: #888; text-align: center; padding: 3rem 1rem; }
    .panel-form { background: #fff; border-radius: 8px; padding: 1.25rem; max-width: 640px; }
    .panel-form h2 { font-size: 1rem; margin-bottom: 1rem; color: #555; }
    .menu-category { margin-bottom: 1.25rem; }
    .menu-category h3 { font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #888; margin-bottom: 0.6rem; padding-bottom: 0.4rem; border-bottom: 1px solid #eee; }
    .menu-item-row { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #f5f5f5; }
    .menu-item-row:last-child { border-bottom: none; }
    .item-info { display: flex; flex-direction: column; gap: 0.15rem; }
    .item-name { font-size: 0.92rem; }
    .item-price { font-size: 0.8rem; color: #888; }
    .stepper { display: flex; align-items: center; gap: 0.5rem; }
    .stepper button { width: 28px; height: 28px; border: 1px solid #ddd; background: #f5f5f5; border-radius: 4px; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: background 0.1s; }
    .stepper button:hover:not(:disabled) { background: #e0e0e0; }
    .stepper button:disabled { opacity: 0.35; cursor: not-allowed; }
    .stepper .qty { width: 28px; text-align: center; font-weight: 600; font-size: 0.92rem; }

    /* === RUNNING TOTAL === */
    .panel-total { display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 0; margin-top: 0.75rem; border-top: 2px solid #eee; font-weight: 700; font-size: 1.05rem; }
    .panel-error { color: #c0392b; font-size: 0.85rem; margin-top: 0.5rem; min-height: 1.2em; }
    .panel-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }

    /* === BUTTONS === */
    .btn { padding: 0.55rem 1.1rem; border: none; border-radius: 5px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: opacity 0.15s; }
    .btn:hover { opacity: 0.85; }
    .btn-primary { background: #1a1a2e; color: #fff; }
    .btn-success { background: #27ae60; color: #fff; }
    .btn-danger  { background: #e94560; color: #fff; }
    .btn-ghost   { background: #e8e8e8; color: #333; }
    .btn-sm      { padding: 0.35rem 0.75rem; font-size: 0.82rem; }
    .btn-new-order { width: 100%; padding: 0.65rem; border: 2px dashed #ccc; background: none; border-radius: 6px; color: #666; cursor: pointer; font-size: 0.88rem; font-weight: 600; transition: border-color 0.15s, color 0.15s; margin-top: auto; }
    .btn-new-order:hover { border-color: #1a1a2e; color: #1a1a2e; }

    /* === ADMIN TAB === */
    #admin-tab { padding: 1.5rem; max-width: 760px; }
    #admin-tab h2 { font-size: 1.1rem; margin-bottom: 1rem; }
    .add-item-form { background: #fff; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem; }
    .add-item-form h3 { font-size: 0.9rem; font-weight: 700; margin-bottom: 0.85rem; color: #555; text-transform: uppercase; letter-spacing: 0.05em; }
    .form-row { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: flex-end; }
    .form-group { display: flex; flex-direction: column; gap: 0.3rem; }
    .form-group label { font-size: 0.8rem; color: #666; font-weight: 600; }
    .form-group input, .form-group select { padding: 0.45rem 0.65rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.88rem; }
    .form-group input:focus, .form-group select:focus { outline: 2px solid #1a1a2e; border-color: transparent; }
    .form-group.checkbox-group { flex-direction: row; align-items: center; gap: 0.5rem; padding-bottom: 0.45rem; }
    .form-group.checkbox-group label { margin: 0; }
    .menu-table { background: #fff; border-radius: 8px; overflow: hidden; }
    .menu-table-category { border-bottom: 2px solid #eee; }
    .menu-table-category:last-child { border-bottom: none; }
    .menu-table-category-header { padding: 0.6rem 1rem; background: #f9f9f9; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #888; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 0.55rem 1rem; font-size: 0.8rem; color: #888; font-weight: 600; background: #fafafa; border-bottom: 1px solid #eee; }
    td { padding: 0.6rem 1rem; font-size: 0.88rem; border-bottom: 1px solid #f5f5f5; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    td input, td select { padding: 0.35rem 0.5rem; border: 1px solid #bbb; border-radius: 4px; font-size: 0.85rem; }
    td input[type="text"] { width: 160px; }
    td input[type="number"] { width: 70px; }
    .td-actions { display: flex; gap: 0.4rem; }

    /* === CONFIRMATION MODAL === */
    #confirmation-modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 100; align-items: center; justify-content: center; }
    #confirmation-modal.open { display: flex; }
    .modal-box { background: #fff; border-radius: 10px; padding: 1.75rem; width: 100%; max-width: 420px; box-shadow: 0 8px 32px rgba(0,0,0,0.18); }
    .modal-box h2 { font-size: 1.1rem; margin-bottom: 1rem; }
    .modal-line-items { margin-bottom: 1rem; }
    .modal-line-item { display: flex; justify-content: space-between; padding: 0.35rem 0; font-size: 0.9rem; border-bottom: 1px solid #f0f0f0; }
    .modal-line-item:last-child { border-bottom: none; }
    .modal-total { display: flex; justify-content: space-between; padding-top: 0.75rem; border-top: 2px solid #eee; font-weight: 700; font-size: 1rem; margin-bottom: 1.25rem; }
    .modal-actions { display: flex; justify-content: flex-end; }

    /* === EMPTY STATES === */
    .empty-list { padding: 2rem 1rem; text-align: center; color: #aaa; font-size: 0.88rem; }
    .empty-table-row td { text-align: center; color: #aaa; padding: 1.5rem; }
  </style>
</head>
<body>

  <header>
    <h1>☕ Café Orders</h1>
    <nav class="tab-nav">
      <button class="tab-btn active" data-tab="orders-tab">Orders</button>
      <button class="tab-btn" data-tab="admin-tab">Admin</button>
    </nav>
  </header>

  <!-- ORDERS TAB -->
  <div id="orders-tab" class="active">
    <aside class="ticket-list">
      <div class="ticket-list-header">
        <h2>Active Orders</h2>
      </div>
      <div id="ticket-cards"><!-- rendered by JS --></div>
      <button class="btn-new-order" id="btn-new-order">+ New Order</button>
    </aside>

    <main class="order-panel" id="order-panel">
      <p class="panel-empty">Select an order or start a new one.</p>
    </main>
  </div>

  <!-- ADMIN TAB -->
  <div id="admin-tab" class="tab-panel">
    <h2>Menu Management</h2>

    <div class="add-item-form">
      <h3>Add New Item</h3>
      <form id="add-item-form" novalidate>
        <div class="form-row">
          <div class="form-group">
            <label for="new-name">Name</label>
            <input type="text" id="new-name" maxlength="50" required placeholder="e.g. Caramel Macchiato">
          </div>
          <div class="form-group">
            <label for="new-price">Price (₱)</label>
            <input type="number" id="new-price" min="1" step="1" required placeholder="85">
          </div>
          <div class="form-group">
            <label for="new-category">Category</label>
            <select id="new-category">
              <option value="Drinks">Drinks</option>
              <option value="Food">Food</option>
            </select>
          </div>
          <div class="form-group checkbox-group">
            <input type="checkbox" id="new-available" checked>
            <label for="new-available">Available</label>
          </div>
          <div class="form-group">
            <button type="submit" class="btn btn-primary">Add Item</button>
          </div>
        </div>
        <p id="add-item-error" style="color:#c0392b;font-size:0.82rem;margin-top:0.5rem;min-height:1em;"></p>
      </form>
    </div>

    <div class="menu-table" id="menu-table"><!-- rendered by JS --></div>
  </div>

  <!-- CONFIRMATION MODAL -->
  <div id="confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="modal-box">
      <h2 id="modal-title">Order Submitted</h2>
      <div id="modal-order-num" style="color:#888;font-size:0.88rem;margin-bottom:0.75rem;"></div>
      <div class="modal-line-items" id="modal-line-items"></div>
      <div class="modal-total">
        <span>Total</span>
        <span id="modal-total"></span>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" id="btn-modal-done">Done</button>
      </div>
    </div>
  </div>

  <script>
    // JS goes here — added in subsequent tasks
  </script>
</body>
</html>
```

- [ ] **Step 2: Open `index.html` in a browser and verify**
  - Header with "☕ Café Orders" and two tabs (Orders, Admin) visible
  - Orders tab shows the split-panel layout (left sidebar + right panel)
  - Admin tab shows the "Add New Item" form
  - No console errors

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: HTML skeleton and CSS foundation"
```

---

## Task 2: State Management, Menu Seeding, and Tab Switching

**Files:**
- Modify: `index.html` (replace the empty `<script>` block)

- [ ] **Step 1: Replace the `<script>` block with state + initialization code**

```js
// ─── STATE ───────────────────────────────────────────────────────────────────
const appState = {
  tickets: [],          // array of ticket objects
  nextOrderNum: 1,      // resets each page load
  panelTicketId: null,  // id of ticket currently open in panel (null = new order)
  panelQtys: {},        // { itemId: quantity } — current panel quantities (unsaved)
  panelOpen: false,     // is the panel showing an order form?
};

// ─── LOCALSTORAGE HELPERS ─────────────────────────────────────────────────────
function getMenu() {
  return JSON.parse(localStorage.getItem('menu') || 'null');
}
function saveMenu(menu) {
  localStorage.setItem('menu', JSON.stringify(menu));
}
function getIdCounter() {
  return parseInt(localStorage.getItem('menuIdCounter') || '0', 10);
}
function saveIdCounter(n) {
  localStorage.setItem('menuIdCounter', String(n));
}
function nextMenuId() {
  const id = getIdCounter();
  saveIdCounter(id + 1);
  return id;
}

// ─── DEFAULT MENU ─────────────────────────────────────────────────────────────
const DEFAULT_MENU = [
  { name: 'Black Coffee',      price: 60,  category: 'Drinks', available: true },
  { name: 'Latte',             price: 85,  category: 'Drinks', available: true },
  { name: 'Caramel Macchiato', price: 95,  category: 'Drinks', available: true },
  { name: 'Iced Tea',          price: 50,  category: 'Drinks', available: true },
  { name: 'Fruit Soda',        price: 55,  category: 'Drinks', available: true },
  { name: 'French Fries',      price: 40,  category: 'Food',   available: true },
  { name: 'Fish Balls',        price: 25,  category: 'Food',   available: true },
  { name: 'Kwek-Kwek',         price: 25,  category: 'Food',   available: true },
  { name: 'Kikiam',            price: 30,  category: 'Food',   available: true },
  { name: 'Cheese Sticks',     price: 45,  category: 'Food',   available: true },
];

function seedMenuIfNeeded() {
  if (localStorage.getItem('menu') === null) {
    saveIdCounter(DEFAULT_MENU.length);
    const menu = DEFAULT_MENU.map((item, i) => ({ id: i, ...item }));
    saveMenu(menu);
  }
}

// ─── FORMATTING ───────────────────────────────────────────────────────────────
function formatPrice(n) {
  return '₱' + Math.round(n);
}

// ─── TAB SWITCHING ────────────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // orders tab uses flex layout, others use block
      const ordersTab = document.getElementById('orders-tab');
      const adminTab  = document.getElementById('admin-tab');
      if (tabId === 'orders-tab') {
        ordersTab.classList.add('active');
        adminTab.classList.remove('active');
        adminTab.style.display = 'none';
      } else {
        ordersTab.classList.remove('active');
        adminTab.classList.remove('active'); // reset
        adminTab.style.display = 'block';
        renderMenuTable();
      }
    });
  });
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
seedMenuIfNeeded();
initTabs();
```

- [ ] **Step 2: Verify in browser console**

Open DevTools → Console, paste and run these assertions:
```js
// menu seeded
console.assert(JSON.parse(localStorage.getItem('menu')).length === 10, 'Menu should have 10 items');
// counter set
console.assert(parseInt(localStorage.getItem('menuIdCounter')) === 10, 'Counter should be 10');
// formatPrice
console.assert(formatPrice(85) === '₱85', 'formatPrice(85) should be ₱85');
```
All should pass silently. Then verify tab switching: click Admin tab → page body should not show the orders panel.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: state management, menu seeding, tab switching"
```

---

## Task 3: Admin — Render Menu Table

**Files:**
- Modify: `index.html` (add to `<script>` block)

- [ ] **Step 1: Add `renderMenuTable()` function and call it on init**

```js
// ─── ADMIN: RENDER MENU TABLE ─────────────────────────────────────────────────
let editingRowId = null; // id of menu item currently being inline-edited

function renderMenuTable() {
  const menu = getMenu() || [];
  const container = document.getElementById('menu-table');
  const categories = ['Drinks', 'Food'];

  if (menu.length === 0) {
    container.innerHTML = '<p style="padding:1.5rem;color:#aaa;text-align:center;">No menu items yet. Add one above.</p>';
    return;
  }

  container.innerHTML = categories.map(cat => {
    const items = menu.filter(i => i.category === cat);
    if (items.length === 0) return '';
    return `
      <div class="menu-table-category">
        <div class="menu-table-category-header">${cat}</div>
        <table>
          <thead><tr><th>Name</th><th>Price</th><th>Available</th><th>Actions</th></tr></thead>
          <tbody>
            ${items.map(item => renderMenuRow(item)).join('')}
          </tbody>
        </table>
      </div>`;
  }).join('');

  // re-attach edit/delete handlers
  container.querySelectorAll('[data-action]').forEach(el => {
    el.addEventListener('click', handleMenuAction);
  });
}

function renderMenuRow(item) {
  if (editingRowId === item.id) {
    return `
      <tr data-id="${item.id}">
        <td><input type="text" class="edit-name" value="${escHtml(item.name)}" maxlength="50" required></td>
        <td><input type="number" class="edit-price" value="${item.price}" min="1" step="1" required></td>
        <td>
          <select class="edit-category">
            <option value="Drinks" ${item.category === 'Drinks' ? 'selected' : ''}>Drinks</option>
            <option value="Food"   ${item.category === 'Food'   ? 'selected' : ''}>Food</option>
          </select>
          <input type="checkbox" class="edit-available" ${item.available ? 'checked' : ''} title="Available">
        </td>
        <td class="td-actions">
          <button class="btn btn-sm btn-primary" data-action="save-edit" data-id="${item.id}">Save</button>
          <button class="btn btn-sm btn-ghost"   data-action="cancel-edit" data-id="${item.id}">Cancel</button>
        </td>
      </tr>`;
  }
  return `
    <tr data-id="${item.id}">
      <td>${escHtml(item.name)}</td>
      <td>${formatPrice(item.price)}</td>
      <td>${item.available ? 'Yes' : 'No'}</td>
      <td class="td-actions">
        <button class="btn btn-sm btn-ghost"   data-action="edit"   data-id="${item.id}">Edit</button>
        <button class="btn btn-sm btn-danger"  data-action="delete" data-id="${item.id}">Delete</button>
      </td>
    </tr>`;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function handleMenuAction(e) {
  const action = e.currentTarget.dataset.action;
  const id = parseInt(e.currentTarget.dataset.id, 10);
  if (action === 'edit')        startEditRow(id);
  else if (action === 'cancel-edit') cancelEditRow();
  else if (action === 'save-edit')   saveEditRow(id);
  else if (action === 'delete')      deleteMenuItem(id);
}

function startEditRow(id) {
  editingRowId = id;
  renderMenuTable();
}

function cancelEditRow() {
  editingRowId = null;
  renderMenuTable();
}
```

At the bottom of the `<script>` block, add:
```js
// Render admin table when Admin tab is first shown
// (already called inside initTabs on tab click; also render on load for direct-link cases)
// No-op until user clicks Admin tab — renderMenuTable is called there.
```

- [ ] **Step 2: Verify in browser**
  - Click Admin tab — 10 menu items shown, grouped under "Drinks" and "Food"
  - Each row has Edit and Delete buttons
  - Click Edit on any row — row becomes editable inputs with Save/Cancel buttons
  - Click Cancel — row returns to read-only display
  - Click Edit on one row, then Edit on another — first row auto-closes (implemented in next task), verify clicking a second Edit button while one is open works

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: admin menu table render and edit row UI"
```

---

## Task 4: Admin — Save Edit, Delete, and Add Item

**Files:**
- Modify: `index.html` (add to `<script>` block)

- [ ] **Step 1: Add `saveEditRow`, `deleteMenuItem`, and Add Item form handler**

```js
// ─── ADMIN: SAVE EDIT ROW ─────────────────────────────────────────────────────
function saveEditRow(id) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  const name  = row.querySelector('.edit-name').value.trim();
  const price = parseInt(row.querySelector('.edit-price').value, 10);
  const category = row.querySelector('.edit-category').value;
  const available = row.querySelector('.edit-available').checked;

  if (!name || name.length > 50 || isNaN(price) || price < 1) {
    row.querySelector('.edit-name').reportValidity();
    row.querySelector('.edit-price').reportValidity();
    return;
  }

  const menu = getMenu();
  const idx = menu.findIndex(i => i.id === id);
  if (idx === -1) return;
  menu[idx] = { id, name, price, category, available };
  saveMenu(menu);
  editingRowId = null;
  renderMenuTable();
}

// ─── ADMIN: DELETE MENU ITEM ──────────────────────────────────────────────────
function deleteMenuItem(id) {
  const menu = getMenu();
  const item = menu.find(i => i.id === id);
  if (!item) return;
  if (!confirm(`Delete "${item.name}"?`)) return;
  saveMenu(menu.filter(i => i.id !== id));
  editingRowId = null;
  renderMenuTable();
}

// ─── ADMIN: ADD ITEM FORM ─────────────────────────────────────────────────────
document.getElementById('add-item-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const nameEl  = document.getElementById('new-name');
  const priceEl = document.getElementById('new-price');
  const errorEl = document.getElementById('add-item-error');

  const name  = nameEl.value.trim();
  const price = parseInt(priceEl.value, 10);
  const category  = document.getElementById('new-category').value;
  const available = document.getElementById('new-available').checked;

  errorEl.textContent = '';
  if (!name || name.length > 50) { errorEl.textContent = 'Name is required (max 50 characters).'; return; }
  if (isNaN(price) || price < 1) { errorEl.textContent = 'Price must be at least ₱1.'; return; }

  const menu = getMenu() || [];
  menu.push({ id: nextMenuId(), name, price, category, available });
  saveMenu(menu);
  this.reset();
  document.getElementById('new-available').checked = true;
  renderMenuTable();
});
```

- [ ] **Step 2: Verify in browser**

  **Add item:**
  - Enter "Milk Tea", price 70, category Drinks, click Add Item → appears in Drinks table
  - Try submitting with empty name → error message shown
  - Try price 0 → error message shown

  **Edit item:**
  - Click Edit on a row, change the name and price, click Save → row updates in table, localStorage updated
  - Open DevTools → Application → localStorage → confirm `menu` key updated
  - Click Edit on one row, then Edit on another → first row disappears from edit mode (auto-cancel via `startEditRow` overwriting `editingRowId`)

  **Delete item:**
  - Click Delete → confirm dialog appears with item name
  - Confirm → item removed from table

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: admin add/edit/delete menu items"
```

---

## Task 5: Order Panel — Menu Items with Steppers and Running Total

**Files:**
- Modify: `index.html` (add to `<script>` block)

- [ ] **Step 1: Add order panel render functions**

```js
// ─── ORDER PANEL ──────────────────────────────────────────────────────────────
function computeTotal(qtys) {
  const menu = getMenu() || [];
  return menu.reduce((sum, item) => sum + (qtys[item.id] || 0) * item.price, 0);
}

function isDirty() {
  if (!appState.panelOpen) return false;
  if (appState.panelTicketId === null) {
    // new order: dirty if any qty > 0
    return Object.values(appState.panelQtys).some(q => q > 0);
  } else {
    // editing existing: dirty if any qty differs from saved
    const ticket = appState.tickets.find(t => t.id === appState.panelTicketId);
    if (!ticket) return false;
    const menu = getMenu() || [];
    return menu.some(item => (appState.panelQtys[item.id] || 0) !== (ticket.lineItems.find(l => l.itemId === item.id)?.quantity || 0));
  }
}

function renderOrderPanel() {
  const panelEl = document.getElementById('order-panel');
  if (!appState.panelOpen) {
    panelEl.innerHTML = '<p class="panel-empty">Select an order or start a new one.</p>';
    return;
  }

  const menu = getMenu() || [];
  const availableItems = menu.filter(i => i.available);
  const isEdit = appState.panelTicketId !== null;
  const ticket = isEdit ? appState.tickets.find(t => t.id === appState.panelTicketId) : null;
  const title = isEdit ? `Editing ${ticket.orderNum}` : 'New Order';
  const total = computeTotal(appState.panelQtys);

  if (availableItems.length === 0) {
    panelEl.innerHTML = `
      <div class="panel-form">
        <p style="color:#888;text-align:center;padding:2rem 0;">No items available. Add items in the Admin tab.</p>
      </div>`;
    return;
  }

  const categories = ['Drinks', 'Food'];
  const categorySections = categories.map(cat => {
    const items = availableItems.filter(i => i.category === cat);
    if (items.length === 0) return '';
    return `
      <div class="menu-category">
        <h3>${cat}</h3>
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
                <button class="stepper-plus" data-item-id="${item.id}" aria-label="Increase">+</button>
              </div>
            </div>`;
        }).join('')}
      </div>`;
  }).join('');

  panelEl.innerHTML = `
    <div class="panel-form">
      <h2>${title}</h2>
      ${categorySections}
      <div class="panel-total">
        <span>Total</span>
        <span>${formatPrice(total)}</span>
      </div>
      <p class="panel-error" id="panel-error"></p>
      <div class="panel-actions">
        <button class="btn btn-primary" id="btn-save">Save</button>
        <button class="btn btn-success" id="btn-submit">Submit</button>
        <button class="btn btn-ghost"   id="btn-cancel">Cancel</button>
      </div>
    </div>`;

  // Stepper event listeners
  panelEl.querySelectorAll('.stepper-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.itemId, 10);
      appState.panelQtys[id] = (appState.panelQtys[id] || 0) + 1;
      renderOrderPanel();
    });
  });
  panelEl.querySelectorAll('.stepper-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.itemId, 10);
      if ((appState.panelQtys[id] || 0) > 0) {
        appState.panelQtys[id]--;
        renderOrderPanel();
      }
    });
  });

  // Action buttons (wired in Task 8)
}
```

At the bottom of the `<script>` block, add an initial render:
```js
renderOrderPanel();
renderTicketCards();  // defined in Task 6 — add a stub for now
```

Add a stub so the page doesn't error:
```js
function renderTicketCards() { /* stub — implemented in Task 6 */ }
```

- [ ] **Step 2: Verify in browser**

  - Click "+ New Order" (button exists but isn't wired yet — temporarily add `appState.panelOpen = true; renderOrderPanel();` in the console to test the panel)
  - Panel shows menu items grouped by Drinks / Food
  - Clicking + increases quantity, clicking − decreases it (disabled at 0)
  - Running total updates correctly

  Console verification:
  ```js
  // Test computeTotal
  const testQtys = { 0: 2, 5: 1 }; // 2x Black Coffee (60) + 1x French Fries (40)
  console.assert(computeTotal(testQtys) === 160, 'total should be 160');

  // Test isDirty (new order, no qtys)
  appState.panelOpen = true;
  appState.panelTicketId = null;
  appState.panelQtys = {};
  console.assert(isDirty() === false, 'empty new order should not be dirty');
  appState.panelQtys = { 0: 1 };
  console.assert(isDirty() === true, 'new order with qty > 0 should be dirty');
  ```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: order panel with steppers and running total"
```

---

## Task 6: Ticket List — Render Cards and Status Dropdown

**Files:**
- Modify: `index.html` (replace `renderTicketCards` stub, add to `<script>` block)

- [ ] **Step 1: Replace the `renderTicketCards` stub with the full implementation**

```js
// ─── TICKET LIST ──────────────────────────────────────────────────────────────
function renderTicketCards() {
  const container = document.getElementById('ticket-cards');
  if (appState.tickets.length === 0) {
    container.innerHTML = '<p class="empty-list">No orders yet.</p>';
    return;
  }
  container.innerHTML = appState.tickets.map(ticket => {
    const isServed = ticket.status === 'Served';
    const itemCount = ticket.lineItems.reduce((s, l) => s + l.quantity, 0);
    const statusClass = 'status-' + ticket.status.toLowerCase();
    return `
      <div class="ticket-card ${isServed ? 'served' : ''}" data-ticket-id="${ticket.id}">
        <div class="ticket-card-top">
          <span class="ticket-num">${ticket.orderNum}</span>
          <span class="ticket-total">${formatPrice(ticket.total)}</span>
        </div>
        <div class="ticket-meta">
          <span class="ticket-count">${itemCount} item${itemCount !== 1 ? 's' : ''}</span>
          <select class="status-select ${statusClass}" data-ticket-id="${ticket.id}" ${isServed ? 'disabled' : ''}>
            ${['Pending','Preparing','Ready','Served'].map(s =>
              `<option value="${s}" ${ticket.status === s ? 'selected' : ''}>${s}</option>`
            ).join('')}
          </select>
        </div>
      </div>`;
  }).join('');

  // Card click → open in panel
  container.querySelectorAll('.ticket-card:not(.served)').forEach(card => {
    card.addEventListener('click', e => {
      // Don't fire if clicking the dropdown itself
      if (e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') return;
      const id = parseInt(card.dataset.ticketId, 10);
      openTicketInPanel(id);
    });
  });

  // Status dropdown change
  container.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', e => {
      e.stopPropagation();
      const id = parseInt(sel.dataset.ticketId, 10);
      updateTicketStatus(id, sel.value);
    });
  });
}

function updateTicketStatus(id, status) {
  const ticket = appState.tickets.find(t => t.id === id);
  if (!ticket) return;
  ticket.status = status;
  if (status === 'Served') {
    // If this ticket is open in the panel, silently discard and clear
    if (appState.panelTicketId === id) {
      closePanel();
    }
  }
  renderTicketCards();
}

function openTicketInPanel(id) {
  if (isDirty()) {
    if (!confirm('You have an unsaved order. Discard it and start a new one?')) return;
  }
  const ticket = appState.tickets.find(t => t.id === id);
  if (!ticket) return;
  // Populate panelQtys from ticket's line items
  appState.panelQtys = {};
  ticket.lineItems.forEach(l => { appState.panelQtys[l.itemId] = l.quantity; });
  appState.panelTicketId = id;
  appState.panelOpen = true;
  renderOrderPanel();
  renderTicketCards();
}

function closePanel() {
  appState.panelOpen = false;
  appState.panelTicketId = null;
  appState.panelQtys = {};
  renderOrderPanel();
}
```

- [ ] **Step 2: Verify in browser**

  Manually add a test ticket via console to verify cards render:
  ```js
  appState.tickets.push({
    id: 1, orderNum: '#001', status: 'Pending',
    lineItems: [{ itemId: 0, name: 'Black Coffee', price: 60, quantity: 2 }],
    total: 120
  });
  renderTicketCards();
  ```
  - Card shows "#001", "₱120", "2 items", and a status dropdown
  - Status dropdown shows "Pending" selected
  - Changing dropdown to "Served" → card dims and dropdown becomes disabled
  - Clicking a non-Served card should attempt to open it in the panel (panel will render once "+ New Order" wiring is done in Task 7)

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: ticket list cards with status dropdown"
```

---

## Task 7: New Order Button, Dirty-State Guards, and Panel Actions

**Files:**
- Modify: `index.html` (add to `<script>` block)

- [ ] **Step 1: Wire the "+ New Order" button and add Save/Submit/Cancel handlers**

```js
// ─── NEW ORDER BUTTON ─────────────────────────────────────────────────────────
document.getElementById('btn-new-order').addEventListener('click', () => {
  if (isDirty()) {
    if (!confirm('You have an unsaved order. Discard it and start a new one?')) return;
  }
  appState.panelTicketId = null;
  appState.panelQtys = {};
  appState.panelOpen = true;
  renderOrderPanel();
  renderTicketCards();
});

// ─── PANEL ACTION HANDLERS (delegated, called after renderOrderPanel) ─────────
// We use event delegation on the panel container since buttons are re-rendered.
document.getElementById('order-panel').addEventListener('click', e => {
  const btn = e.target.closest('button[id]');
  if (!btn) return;
  if (btn.id === 'btn-save')   handleSave();
  if (btn.id === 'btn-submit') handleSubmit();
  if (btn.id === 'btn-cancel') handleCancel();
});

function validatePanel() {
  const hasItems = Object.values(appState.panelQtys).some(q => q > 0);
  if (!hasItems) {
    const errEl = document.getElementById('panel-error');
    if (errEl) errEl.textContent = 'Add at least one item.';
    return false;
  }
  return true;
}

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

function handleSave() {
  if (!validatePanel()) return;
  const lineItems = buildLineItems();
  const total = lineItems.reduce((s, l) => s + l.price * l.quantity, 0);

  if (appState.panelTicketId !== null) {
    // Update existing ticket
    const ticket = appState.tickets.find(t => t.id === appState.panelTicketId);
    if (ticket) {
      ticket.lineItems = lineItems;
      ticket.total = total;
      ticket.status = 'Pending';
    }
  } else {
    // Create new ticket
    const orderNum = '#' + String(appState.nextOrderNum++).padStart(3, '0');
    appState.tickets.push({
      id: Date.now(),
      orderNum,
      status: 'Pending',
      lineItems,
      total,
    });
  }
  closePanel();
  renderTicketCards();
}

function handleCancel() {
  closePanel();
  renderTicketCards();
}
```

- [ ] **Step 2: Verify in browser**

  - Click "+ New Order" → panel opens with menu items
  - Add items, click Save → ticket card appears in left panel, panel clears
  - Click the ticket card → panel re-opens with saved quantities
  - Change quantities, click Cancel → panel closes, ticket unchanged
  - Click "+ New Order" with a dirty panel (qty > 0) → confirm dialog appears
  - Cancel the dialog → panel stays open with quantities intact
  - Confirm the dialog → panel resets to blank new order

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: new order button, save/cancel panel actions, dirty-state guards"
```

---

## Task 8: Submit Action and Confirmation Modal

**Files:**
- Modify: `index.html` (add to `<script>` block)

- [ ] **Step 1: Add `handleSubmit` and modal show/dismiss logic**

```js
// ─── SUBMIT ───────────────────────────────────────────────────────────────────
function handleSubmit() {
  if (!validatePanel()) return;
  const lineItems = buildLineItems();
  const total = lineItems.reduce((s, l) => s + l.price * l.quantity, 0);

  let orderNum;
  if (appState.panelTicketId !== null) {
    const ticket = appState.tickets.find(t => t.id === appState.panelTicketId);
    if (ticket) {
      ticket.lineItems = lineItems;
      ticket.total = total;
      ticket.status = 'Served';
      orderNum = ticket.orderNum;
    }
  } else {
    orderNum = '#' + String(appState.nextOrderNum++).padStart(3, '0');
    appState.tickets.push({
      id: Date.now(),
      orderNum,
      status: 'Served',
      lineItems,
      total,
    });
  }

  closePanel();
  renderTicketCards();
  showModal(orderNum, lineItems, total);
}

// ─── CONFIRMATION MODAL ───────────────────────────────────────────────────────
function showModal(orderNum, lineItems, total) {
  document.getElementById('modal-order-num').textContent = 'Order ' + orderNum;
  document.getElementById('modal-line-items').innerHTML = lineItems.map(l => `
    <div class="modal-line-item">
      <span>${escHtml(l.name)} × ${l.quantity}</span>
      <span>${formatPrice(l.price * l.quantity)}</span>
    </div>`).join('');
  document.getElementById('modal-total').textContent = formatPrice(total);
  document.getElementById('confirmation-modal').classList.add('open');
}

function hideModal() {
  document.getElementById('confirmation-modal').classList.remove('open');
}

document.getElementById('btn-modal-done').addEventListener('click', hideModal);

// Dismiss on backdrop click
document.getElementById('confirmation-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('confirmation-modal')) hideModal();
});

// Dismiss on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') hideModal();
});
```

- [ ] **Step 2: Verify in browser**

  - Start a new order, add items, click Submit
  - Confirmation modal appears with order number, line items (each showing quantity × unit price subtotal), and grand total
  - All prices formatted as `₱N` with no decimals
  - Click "Done" → modal closes
  - Repeat with Escape key → modal closes
  - Click backdrop outside modal box → modal closes
  - Submitted ticket appears in left panel as dimmed, with disabled status dropdown

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: submit action and confirmation modal"
```

---

## Task 9: Final Wiring and End-to-End Verification

**Files:**
- Modify: `index.html` (ensure init calls are correct and all flows are connected)

- [ ] **Step 1: Ensure the initial render calls at the bottom of `<script>` are correct**

The bottom of the `<script>` block should read (replace the stubs from earlier tasks):
```js
// ─── INITIAL RENDER ───────────────────────────────────────────────────────────
seedMenuIfNeeded();
initTabs();
renderOrderPanel();
renderTicketCards();
```

Remove any temporary test code or stubs added during development.

- [ ] **Step 2: Full end-to-end walkthrough in the browser**

Run through this complete scenario:

1. **Fresh load** — Orders tab active, empty ticket list, panel shows "Select an order or start a new one."
2. **New Order** — Click "+ New Order". Panel opens with all 10 default menu items grouped by Drinks/Food.
3. **Build order** — Add 2× Latte (₱85) and 1× Fish Balls (₱25). Running total shows ₱195.
4. **Save** — Click Save. Ticket "#001" appears in left panel with status "Pending" and total ₱195. Panel clears.
5. **Edit ticket** — Click ticket "#001". Panel re-opens with saved quantities. Change to 1× Latte. Total now ₱110. Click Save. Card updates to ₱110.
6. **Status change** — Use status dropdown on "#001" card to set "Preparing" → amber badge. Then "Ready" → green badge.
7. **Submit** — Click "#001", click Submit. Modal shows order summary. Click Done. Card is now dimmed, dropdown disabled.
8. **New order while dirty** — Click "+ New Order", add an item, then click "+ New Order" again → confirm dialog.
9. **Admin tab** — Switch to Admin. Add new item "Buko Juice", ₱45, Drinks. Item appears in table.
10. **Toggle availability** — Edit "Buko Juice", uncheck Available, Save. Switch back to Orders tab, start new order → "Buko Juice" not shown in panel.
11. **Delete item** — Switch to Admin, delete "Buko Juice". Confirm dialog shows item name. After confirm, item gone from table.
12. **Refresh page** — All tickets are gone (in-memory). Menu items are still present (localStorage). Order counter restarts at #001.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: final wiring and init render"
```

---

## Complete

All tasks done. The app is a single `index.html` that can be opened directly in any browser with no server or build step required.
