# Session Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a live "Report" tab to the café order form that shows a session-scoped sales summary broken down by order status (Served, Ready, Preparing).

**Architecture:** Single `index.html` modification — add one tab button, one `#report-tab` panel, CSS for the new UI components, and a `renderReportTab()` function that derives all data from `appState.tickets`. No new state is introduced. The render function is called after every state mutation and when the tab is activated.

**Tech Stack:** Vanilla HTML5/CSS3/JavaScript (ES6+), no frameworks, no build tools. Single file.

---

## File Structure

Only one file is modified:

- **Modify:** `index.html` — add CSS, HTML markup, JS function, and hook render calls into existing state mutations.

---

### Task 1: CSS — Report tab styles

**Files:**
- Modify: `index.html` (inside the `<style>` block, after the `/* === EMPTY STATES ===*/` section, before `</style>`)

Add styles for:
- `#report-tab` panel layout
- `.report-summary-cards` flex row of stat cards
- `.summary-card` individual card (white box, rounded, padding)
- `.summary-card-label` muted small label
- `.summary-card-value` large bold value
- `.report-section` section wrapper with heading
- `.report-table` the item breakdown table
- `.report-orders` per-order list container
- `.report-order-entry` individual order block
- `.report-order-header` order # + status badge row
- `.report-order-items` line items inside an order entry
- `.report-order-line` single line item row (name × qty — subtotal)
- `.report-order-total` order total row
- `.report-empty` empty state message

- [ ] **Step 1: Add CSS block**

Add the following CSS inside `<style>`, immediately before `</style>` (after the existing `.form-error` / `.modal-order-num` lines):

```css
/* === REPORT TAB === */
#report-tab { padding: 1.5rem; max-width: 860px; }
.report-summary-cards { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.75rem; }
.summary-card { background: #fff; border-radius: 8px; padding: 1.1rem 1.4rem; flex: 1; min-width: 180px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.summary-card-label { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #888; margin-bottom: 0.35rem; }
.summary-card-value { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; }
.report-section { margin-bottom: 2rem; }
.report-section h3 { font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #888; margin-bottom: 0.75rem; padding-bottom: 0.4rem; border-bottom: 1px solid #eee; }
.report-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; }
.report-table th { text-align: left; padding: 0.55rem 1rem; font-size: 0.8rem; color: #888; font-weight: 600; background: #fafafa; border-bottom: 1px solid #eee; }
.report-table th:not(:first-child) { text-align: right; }
.report-table td { padding: 0.6rem 1rem; font-size: 0.88rem; border-bottom: 1px solid #f5f5f5; }
.report-table tr:last-child td { border-bottom: none; }
.report-table td:not(:first-child) { text-align: right; color: #555; }
.report-table .cat-header td { background: #f9f9f9; font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #888; }
.report-orders { display: flex; flex-direction: column; gap: 0.75rem; }
.report-order-entry { background: #fff; border-radius: 8px; padding: 0.9rem 1.1rem; }
.report-order-header { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.6rem; font-weight: 700; font-size: 0.9rem; }
.report-order-items { border-top: 1px solid #f0f0f0; padding-top: 0.5rem; }
.report-order-line { display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.87rem; color: #555; }
.report-order-total { display: flex; justify-content: space-between; padding-top: 0.5rem; margin-top: 0.35rem; border-top: 1px solid #eee; font-weight: 700; font-size: 0.9rem; }
.report-empty { color: #aaa; text-align: center; padding: 3rem 1rem; font-size: 0.9rem; }
```

- [ ] **Step 2: Verify visually**

Open `index.html` in a browser. No visual change yet (the Report tab doesn't exist in the HTML). Confirm no console errors from CSS parsing.

- [ ] **Step 3: Commit**

```bash
cd "C:/Users/Miggy/documents/order-form-test"
git add index.html
git commit -m "feat: add CSS styles for report tab"
```

---

### Task 2: HTML — Report tab button and panel

**Files:**
- Modify: `index.html` (header nav + body, after the admin tab markup)

Two changes:
1. Add a third `<button>` to the tab nav in `<header>`
2. Add the `#report-tab` panel `<div>` after the `#admin-tab` closing `</div>`

- [ ] **Step 1: Add the tab nav button**

Find this in `<header>`:
```html
      <button class="tab-btn" data-tab="admin-tab">Admin</button>
```

Add the Report button immediately after it:
```html
      <button class="tab-btn" data-tab="report-tab">Report</button>
```

- [ ] **Step 2: Add the report tab panel**

Find this comment and closing div:
```html
  <!-- CONFIRMATION MODAL -->
```

Add the report tab panel immediately before that line:
```html
  <!-- REPORT TAB -->
  <div id="report-tab" class="tab-panel">
    <div id="report-content"><!-- rendered by JS --></div>
  </div>

```

- [ ] **Step 3: Verify tab button appears**

Open `index.html` in a browser. You should see three tabs in the header: **Orders | Admin | Report**. Clicking Report should show a blank panel (no content yet — JS not wired). No console errors.

- [ ] **Step 4: Commit**

```bash
cd "C:/Users/Miggy/documents/order-form-test"
git add index.html
git commit -m "feat: add report tab button and panel markup"
```

---

### Task 3: JS — `renderReportTab()` function and tab wiring

**Files:**
- Modify: `index.html` (inside `<script>`, two sub-changes: new function + update `initTabs`)

#### Part A — `renderReportTab()` function

Add this function inside `<script>`, after the `updateTicketStatus` function (around line 590), before `openTicketInPanel`:

```js
// ─── REPORT TAB ───────────────────────────────────────────────────────────────
function renderReportTab() {
  // Only render if report tab is active to avoid unnecessary DOM work
  const reportPanel = document.getElementById('report-tab');
  if (!reportPanel.classList.contains('active')) return;

  const TRACKED = ['Served', 'Ready', 'Preparing'];
  const tickets = appState.tickets.filter(t => TRACKED.includes(t.status));
  const container = document.getElementById('report-content');

  if (tickets.length === 0) {
    container.innerHTML = '<p class="report-empty">No orders have been placed yet this session.</p>';
    return;
  }

  // ── Summary cards ──────────────────────────────────────────────────────────
  function sumByStatus(status) {
    return appState.tickets
      .filter(t => t.status === status)
      .reduce((s, t) => s + t.total, 0);
  }
  const cardsHtml = `
    <div class="report-summary-cards">
      <div class="summary-card">
        <div class="summary-card-label">Confirmed Revenue</div>
        <div class="summary-card-value">${formatPrice(sumByStatus('Served'))}</div>
      </div>
      <div class="summary-card">
        <div class="summary-card-label">Awaiting Pickup</div>
        <div class="summary-card-value">${formatPrice(sumByStatus('Ready'))}</div>
      </div>
      <div class="summary-card">
        <div class="summary-card-label">In Preparation</div>
        <div class="summary-card-value">${formatPrice(sumByStatus('Preparing'))}</div>
      </div>
    </div>`;

  // ── Item breakdown table ───────────────────────────────────────────────────
  // Aggregate qty and subtotal per itemId per status from tracked tickets
  const itemMap = {}; // { itemId: { name, category, Served: {qty,sub}, Ready: {qty,sub}, Preparing: {qty,sub} } }
  tickets.forEach(ticket => {
    ticket.lineItems.forEach(l => {
      if (!itemMap[l.itemId]) {
        itemMap[l.itemId] = {
          name: l.name,
          category: l.category || 'Other',
          Served:    { qty: 0, sub: 0 },
          Ready:     { qty: 0, sub: 0 },
          Preparing: { qty: 0, sub: 0 },
        };
      }
      const entry = itemMap[l.itemId][ticket.status];
      entry.qty += l.quantity;
      entry.sub += l.price * l.quantity;
    });
  });

  function cellHtml(entry) {
    return entry.qty === 0 ? '—' : `${entry.qty} — ${formatPrice(entry.sub)}`;
  }

  const categories = ['Drinks', 'Food'];
  let tableBody = '';
  categories.forEach(cat => {
    const items = Object.values(itemMap).filter(i => i.category === cat);
    if (items.length === 0) return;
    tableBody += `<tr class="cat-header"><td colspan="4">${escHtml(cat)}</td></tr>`;
    items.forEach(item => {
      tableBody += `
        <tr>
          <td>${escHtml(item.name)}</td>
          <td>${cellHtml(item.Served)}</td>
          <td>${cellHtml(item.Ready)}</td>
          <td>${cellHtml(item.Preparing)}</td>
        </tr>`;
    });
  });
  // Items whose category is neither Drinks nor Food (edge case)
  const otherItems = Object.values(itemMap).filter(i => !categories.includes(i.category));
  if (otherItems.length > 0) {
    tableBody += `<tr class="cat-header"><td colspan="4">Other</td></tr>`;
    otherItems.forEach(item => {
      tableBody += `
        <tr>
          <td>${escHtml(item.name)}</td>
          <td>${cellHtml(item.Served)}</td>
          <td>${cellHtml(item.Ready)}</td>
          <td>${cellHtml(item.Preparing)}</td>
        </tr>`;
    });
  }

  const tableHtml = `
    <div class="report-section">
      <h3>Item Breakdown</h3>
      <table class="report-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Served</th>
            <th>Ready</th>
            <th>Preparing</th>
          </tr>
        </thead>
        <tbody>${tableBody}</tbody>
      </table>
    </div>`;

  // ── Per-order list ─────────────────────────────────────────────────────────
  const statusClass = { Served: 'status-served', Ready: 'status-ready', Preparing: 'status-preparing' };
  const ordersHtml = `
    <div class="report-section">
      <h3>Order Details</h3>
      <div class="report-orders">
        ${tickets.map(ticket => `
          <div class="report-order-entry">
            <div class="report-order-header">
              <span>${escHtml(ticket.orderNum)}</span>
              <span class="status-badge ${statusClass[ticket.status]}">${ticket.status}</span>
            </div>
            <div class="report-order-items">
              ${ticket.lineItems.map(l => `
                <div class="report-order-line">
                  <span>${escHtml(l.name)} × ${l.quantity}</span>
                  <span>${formatPrice(l.price * l.quantity)}</span>
                </div>`).join('')}
              <div class="report-order-total">
                <span>Total</span>
                <span>${formatPrice(ticket.total)}</span>
              </div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;

  container.innerHTML = cardsHtml + tableHtml + ordersHtml;
}
```

**Note on `l.category`:** Line items in `appState` do not currently store a `category` field — they store `{ itemId, name, price, quantity }`. To group items by category in the report, the category must be looked up from the menu catalog at render time, not from the line item snapshot. Update the `itemMap` population block to look up the category:

```js
// Replace this line inside the tickets.forEach loop:
//   category: l.category || 'Other',
// With a lookup from the current menu catalog:
const menu = getMenu() || [];
// ... then inside the forEach:
if (!itemMap[l.itemId]) {
  const menuItem = menu.find(m => m.id === l.itemId);
  itemMap[l.itemId] = {
    name: l.name,
    category: menuItem ? menuItem.category : 'Other',
    // ...
  };
}
```

The full corrected `itemMap` population loop (replace the version above with this):

```js
  const menu = getMenu() || [];
  tickets.forEach(ticket => {
    ticket.lineItems.forEach(l => {
      if (!itemMap[l.itemId]) {
        const menuItem = menu.find(m => m.id === l.itemId);
        itemMap[l.itemId] = {
          name: l.name,
          category: menuItem ? menuItem.category : 'Other',
          Served:    { qty: 0, sub: 0 },
          Ready:     { qty: 0, sub: 0 },
          Preparing: { qty: 0, sub: 0 },
        };
      }
      const entry = itemMap[l.itemId][ticket.status];
      entry.qty += l.quantity;
      entry.sub += l.price * l.quantity;
    });
  });
```

#### Part B — Update `initTabs()` to handle the third tab

The current `initTabs()` function has a hardcoded `if/else` for orders-tab vs admin-tab. Replace it with a generic multi-tab approach that works for any number of tabs.

Find the current `initTabs` function (around line 263):

```js
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const ordersTab = document.getElementById('orders-tab');
      const adminTab  = document.getElementById('admin-tab');
      if (tabId === 'orders-tab') {
        ordersTab.classList.add('active');
        adminTab.classList.remove('active');
      } else {
        ordersTab.classList.remove('active');
        adminTab.classList.add('active');
        renderMenuTable();
      }
    });
  });
}
```

Replace with:

```js
function initTabs() {
  const TAB_IDS = ['orders-tab', 'admin-tab', 'report-tab'];
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      // Update active button
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // Update active panel
      TAB_IDS.forEach(id => {
        document.getElementById(id).classList.toggle('active', id === tabId);
      });
      // Per-tab side effects
      if (tabId === 'admin-tab') renderMenuTable();
      if (tabId === 'report-tab') renderReportTab();
    });
  });
}
```

- [ ] **Step 1: Add `renderReportTab()` function** as described in Part A (with the corrected `itemMap` loop using `getMenu()` lookup).

- [ ] **Step 2: Replace `initTabs()`** with the updated version from Part B.

- [ ] **Step 3: Verify report tab renders correctly**

Open `index.html` in browser. Create 2–3 orders. Change one to Preparing, one to Ready, one to Served. Click the Report tab. Verify:
- Three summary cards show correct totals
- Item breakdown table shows grouped rows with correct qty and subtotals per status
- Per-order list shows all three orders with line items and totals
- Cells for statuses with no quantity show `—`
- Status badges are color-coded correctly

- [ ] **Step 4: Verify empty state**

Refresh the page (clears all tickets). Click Report tab. Verify: "No orders have been placed yet this session." message is shown. No cards, table, or order list.

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/Miggy/documents/order-form-test"
git add index.html
git commit -m "feat: add renderReportTab() function and update initTabs() for three tabs"
```

---

### Task 4: JS — Hook `renderReportTab()` into state mutations

**Files:**
- Modify: `index.html` (inside `<script>`, three existing functions)

The report must update live whenever ticket state changes. Add `renderReportTab()` calls at the end of each state-mutating function.

- [ ] **Step 1: Hook into `updateTicketStatus()`**

Find `updateTicketStatus` (around line 576). It currently ends with:
```js
  renderTicketCards();
}
```

Add `renderReportTab()` call so it reads:
```js
  renderTicketCards();
  renderReportTab();
}
```

- [ ] **Step 2: Hook into `handleSave()`**

Find `handleSave` (around line 658). It currently ends with:
```js
  closePanel();
  renderTicketCards();
}
```

Add the call:
```js
  closePanel();
  renderTicketCards();
  renderReportTab();
}
```

- [ ] **Step 3: Hook into `handleSubmit()`**

Find `handleSubmit` (around line 692). It currently ends with:
```js
  closePanel();
  renderTicketCards();
  showModal(orderNum, lineItems, total);
}
```

Add the call:
```js
  closePanel();
  renderTicketCards();
  renderReportTab();
  showModal(orderNum, lineItems, total);
}
```

- [ ] **Step 4: Verify live updates**

Open `index.html`. Click the Report tab. In a separate browser tab or same tab:
1. Create an order and save it (status: Pending) → Report should still show empty state (Pending excluded)
2. Change the order status to Preparing → Report should immediately update with the order in "In Preparation"
3. Change to Ready → "Awaiting Pickup" card updates, "In Preparation" drops to ₱0
4. Change to Served → "Confirmed Revenue" updates
5. Create and Submit a second order directly → "Confirmed Revenue" increases immediately

- [ ] **Step 5: Commit**

```bash
cd "C:/Users/Miggy/documents/order-form-test"
git add index.html
git commit -m "feat: hook renderReportTab() into state mutations for live updates"
```

---

## Manual Verification Checklist

After all tasks are complete, do a full end-to-end check:

- [ ] Three tabs visible: Orders, Admin, Report
- [ ] Report tab shows empty state on fresh page load
- [ ] Summary cards show ₱0 for all statuses when no qualifying tickets exist
- [ ] Item breakdown groups by Drinks then Food; items with 0 qty across all statuses are hidden
- [ ] Zero-quantity status cells display `—`
- [ ] Per-order list shows orders in ascending order number sequence
- [ ] Status badges on per-order entries use correct color classes
- [ ] Switching Orders → Report → Orders preserves ticket list and panel state
- [ ] Report re-renders when status dropdown changes while on a different tab (next activation)
- [ ] Pending tickets never appear in the report
- [ ] No XSS: item names with `<`, `>`, `"`, `'`, `&` characters display correctly in the report
