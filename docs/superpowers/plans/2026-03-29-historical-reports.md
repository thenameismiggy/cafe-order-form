# Historical Reports & Record Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add date controls to the Report tab (presets + custom range, multi-date aggregation) and a Stored Records section to the Admin tab for deleting previous days' localStorage entries.

**Architecture:** All changes are in `index.html`. New module-level `reportState` tracks the selected date range; `loadOrdersForDate()` reads from localStorage (or `appState.tickets` for today); `renderReportTab()` is refactored to render date controls and aggregate tickets across the selected range. A new `renderStoredRecords()` function handles the admin cleanup UI.

**Tech Stack:** Vanilla HTML/CSS/JS, localStorage, no frameworks or build tools.

---

### Task 1: Add reportState, date helpers, and loadOrdersForDate

**Files:**
- Modify: `index.html` — after `TODAY_KEY` declaration (~line 357)

- [ ] **Step 1: Add `TODAY_DATE_STR`, `reportState`, and helpers after the `TODAY_KEY` block**

Find the comment `// NOTE: TODAY_KEY is fixed at page load...` block (ends around line 359) and insert the following immediately after it:

```js
const TODAY_DATE_STR = TODAY_KEY.slice(7); // e.g. '2026-03-29'

// ─── REPORT STATE ─────────────────────────────────────────────────────────────
const reportState = {
  activePreset: 'today',
  fromDate: TODAY_DATE_STR,
  toDate: TODAY_DATE_STR,
};

function dateStr(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function datesInRange(fromStr, toStr) {
  const dates = [];
  const cur = new Date(fromStr + 'T00:00:00');
  const end = new Date(toStr + 'T00:00:00');
  while (cur <= end) {
    dates.push(
      cur.getFullYear() + '-' +
      String(cur.getMonth() + 1).padStart(2, '0') + '-' +
      String(cur.getDate()).padStart(2, '0')
    );
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function loadOrdersForDate(dateStr) {
  if (dateStr === TODAY_DATE_STR) return appState.tickets;
  try {
    const raw = localStorage.getItem('orders_' + dateStr);
    if (raw === null) return [];
    const parsed = JSON.parse(raw);
    if (
      !Array.isArray(parsed.tickets) ||
      !(Number.isInteger(parsed.nextOrderNum) && parsed.nextOrderNum >= 1) ||
      !(Number.isInteger(parsed.nextTicketId) && parsed.nextTicketId >= 1)
    ) return [];
    return parsed.tickets;
  } catch (e) {
    return [];
  }
}
```

- [ ] **Step 2: Verify in browser**

Open `index.html` in a browser. Open DevTools console and run:

```js
console.log(TODAY_DATE_STR);                     // e.g. '2026-03-29'
console.log(reportState);                         // { activePreset: 'today', fromDate: '2026-03-29', toDate: '2026-03-29' }
console.log(datesInRange('2026-03-27', '2026-03-29')); // ['2026-03-27', '2026-03-28', '2026-03-29']
console.log(loadOrdersForDate(TODAY_DATE_STR));   // same array as appState.tickets
console.log(loadOrdersForDate('2000-01-01'));      // []
```

Expected: all values match descriptions above, no errors thrown.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add reportState, date helpers, and loadOrdersForDate"
```

---

### Task 2: Add CSS for date controls and stored records

**Files:**
- Modify: `index.html` — inside `<style>`, after the `/* === REPORT TAB === */` block (~line 173) and before `/* === RESPONSIVE === */`

- [ ] **Step 1: Add CSS for report date controls**

Insert after the `.report-empty` rule (line ~173), before the `/* === RESPONSIVE === */` comment:

```css
    /* === REPORT DATE CONTROLS === */
    .report-date-controls { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; padding: 0.85rem 1.1rem; background: #fff; border-radius: 8px; }
    .preset-btns { display: flex; gap: 0.4rem; }
    .preset-btn { padding: 0.35rem 0.8rem; border: 1px solid #ddd; border-radius: 20px; background: #f5f5f5; color: #555; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: background 0.12s, color 0.12s, border-color 0.12s; }
    .preset-btn:hover { background: #e8e8e8; }
    .preset-btn.active { background: #1a1a2e; color: #fff; border-color: #1a1a2e; }
    .date-range-inputs { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; font-size: 0.85rem; color: #555; }
    .date-range-inputs label { display: flex; align-items: center; gap: 0.3rem; }
    .date-range-inputs input[type="date"] { padding: 0.3rem 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.82rem; }
    .date-range-inputs input[type="date"]:focus { outline: 2px solid #1a1a2e; border-color: transparent; }
    .report-date-group-heading { font-size: 0.85rem; font-weight: 700; color: #666; padding: 0.5rem 0 0.25rem; margin-top: 0.5rem; }

    /* === STORED RECORDS === */
    .stored-records { background: #fff; border-radius: 8px; padding: 1.25rem; margin-top: 1.5rem; }
    .stored-records h3 { font-size: 0.9rem; font-weight: 700; margin-bottom: 0.85rem; color: #555; text-transform: uppercase; letter-spacing: 0.05em; }
    .stored-records-empty { color: #aaa; font-size: 0.88rem; padding: 0.5rem 0; }
    .stored-record-row { display: flex; align-items: center; gap: 0.65rem; padding: 0.45rem 0; border-bottom: 1px solid #f5f5f5; font-size: 0.9rem; }
    .stored-record-row:last-child { border-bottom: none; }
    .stored-records-actions { margin-top: 1rem; }
```

- [ ] **Step 2: Verify in browser**

Open `index.html`. Open DevTools Elements panel. Confirm no CSS parse errors in the console. The page should look unchanged since no elements with these classes exist yet.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add CSS for report date controls and stored records section"
```

---

### Task 3: Refactor renderReportTab() with date controls and multi-date support

**Files:**
- Modify: `index.html` — replace `renderReportTab()` (~lines 1007–1151) and add `renderReportDateControlsHtml()` and `attachReportDateListeners()` helpers before it

- [ ] **Step 1: Add `renderReportDateControlsHtml()` and `attachReportDateListeners()` before `renderReportTab()`**

Insert the following two functions immediately before the `// ─── REPORT TAB ───` comment:

```js
// ─── REPORT DATE CONTROLS ─────────────────────────────────────────────────────
function renderReportDateControlsHtml() {
  const { activePreset, fromDate, toDate } = reportState;
  return `
    <div class="report-date-controls">
      <div class="preset-btns">
        <button class="preset-btn${activePreset === 'today' ? ' active' : ''}" data-preset="today">Today</button>
        <button class="preset-btn${activePreset === 'yesterday' ? ' active' : ''}" data-preset="yesterday">Yesterday</button>
        <button class="preset-btn${activePreset === 'last7' ? ' active' : ''}" data-preset="last7">Last 7 Days</button>
      </div>
      <div class="date-range-inputs">
        <label>From <input type="date" id="report-from" value="${fromDate}"></label>
        <label>To <input type="date" id="report-to" value="${toDate}"></label>
        <button class="btn btn-sm btn-ghost" id="btn-report-apply">Apply</button>
      </div>
    </div>`;
}

function attachReportDateListeners() {
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.preset;
      reportState.activePreset = preset;
      if (preset === 'today') {
        reportState.fromDate = TODAY_DATE_STR;
        reportState.toDate = TODAY_DATE_STR;
      } else if (preset === 'yesterday') {
        const y = dateStr(-1);
        reportState.fromDate = y;
        reportState.toDate = y;
      } else if (preset === 'last7') {
        reportState.fromDate = dateStr(-6);
        reportState.toDate = TODAY_DATE_STR;
      }
      renderReportTab();
    });
  });

  function updateApplyState() {
    const from = document.getElementById('report-from').value;
    const to = document.getElementById('report-to').value;
    const applyBtn = document.getElementById('btn-report-apply');
    if (applyBtn) applyBtn.disabled = !from || !to || from > to;
  }

  const fromInput = document.getElementById('report-from');
  const toInput = document.getElementById('report-to');
  if (fromInput) fromInput.addEventListener('input', updateApplyState);
  if (toInput) toInput.addEventListener('input', updateApplyState);

  const applyBtn = document.getElementById('btn-report-apply');
  if (applyBtn) {
    updateApplyState();
    applyBtn.addEventListener('click', () => {
      const from = document.getElementById('report-from').value;
      const to = document.getElementById('report-to').value;
      if (!from || !to || from > to) return;
      reportState.activePreset = null;
      reportState.fromDate = from;
      reportState.toDate = to;
      renderReportTab();
    });
  }
}
```

- [ ] **Step 2: Replace the existing `renderReportTab()` function**

Delete the entire existing `renderReportTab()` function (lines ~1007–1151) and replace it with:

```js
// ─── REPORT TAB ───────────────────────────────────────────────────────────────
function renderReportTab() {
  // Guard: will be called from state mutations — skip when report tab is not visible.
  const reportPanel = document.getElementById('report-tab');
  if (!reportPanel.classList.contains('active')) return;

  const container = document.getElementById('report-content');
  const controlsHtml = renderReportDateControlsHtml();

  const TRACKED = ['Served', 'Ready', 'Preparing'];
  const allDates = datesInRange(reportState.fromDate, reportState.toDate);
  const ticketsByDate = allDates
    .map(d => ({ date: d, tickets: loadOrdersForDate(d).filter(t => TRACKED.includes(t.status)) }))
    .filter(({ tickets }) => tickets.length > 0);
  const allTickets = ticketsByDate.flatMap(({ tickets }) => tickets);

  if (allTickets.length === 0) {
    container.innerHTML = controlsHtml + '<p class="report-empty">No orders for the selected period.</p>';
    attachReportDateListeners();
    return;
  }

  // ── Summary cards (aggregated) ─────────────────────────────────────────────
  function sumByStatus(status) {
    return allTickets.filter(t => t.status === status).reduce((s, t) => s + t.total, 0);
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

  // ── Item breakdown table (aggregated) ──────────────────────────────────────
  const itemMap = {};
  const menu = getMenu() || [];
  allTickets.forEach(ticket => {
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

  function cellHtml(entry) {
    return entry.qty === 0 ? '—' : `${entry.qty} — ${formatPrice(entry.sub)}`;
  }

  const categories = getCategories();
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
      <div class="report-table-wrap">
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
      </div>
    </div>`;

  // ── Per-order list (grouped by date if multi-day) ──────────────────────────
  const statusClass = { Served: 'status-served', Ready: 'status-ready', Preparing: 'status-preparing' };

  function renderOrderEntry(ticket) {
    return `
      <div class="report-order-entry">
        <div class="report-order-header">
          <span>${escHtml(ticket.orderNum)}</span>
          <span class="status-badge ${statusClass[ticket.status]}">${escHtml(ticket.status)}</span>
        </div>
        <div class="report-order-items">
          ${ticket.lineItems.map(l => {
            const flavorSuffix = (l.name === 'French Fries' && Array.isArray(l.flavors) && l.flavors.length > 0)
              ? ` (${l.flavors.map(escHtml).join(' / ')})`
              : '';
            return `
            <div class="report-order-line">
              <span>${escHtml(l.name)}${flavorSuffix} × ${l.quantity}</span>
              <span>${formatPrice(l.price * l.quantity)}</span>
            </div>`;
          }).join('')}
          <div class="report-order-total">
            <span>Total</span>
            <span>${formatPrice(ticket.total)}</span>
          </div>
        </div>
      </div>`;
  }

  let ordersInnerHtml;
  if (allDates.length === 1) {
    const sorted = allTickets.slice().sort((a, b) => parseInt(a.orderNum.slice(1), 10) - parseInt(b.orderNum.slice(1), 10));
    ordersInnerHtml = sorted.map(renderOrderEntry).join('');
  } else {
    ordersInnerHtml = ticketsByDate.map(({ date, tickets }) => {
      const sorted = tickets.slice().sort((a, b) => parseInt(a.orderNum.slice(1), 10) - parseInt(b.orderNum.slice(1), 10));
      const label = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      return `<div class="report-date-group-heading">${escHtml(label)}</div>` + sorted.map(renderOrderEntry).join('');
    }).join('');
  }

  const ordersHtml = `
    <div class="report-section">
      <h3>Order Details</h3>
      <div class="report-orders">${ordersInnerHtml}</div>
    </div>`;

  container.innerHTML = controlsHtml + cardsHtml + tableHtml + ordersHtml;
  attachReportDateListeners();
}
```

- [ ] **Step 3: Verify Today preset (default behavior)**

Open `index.html`. Place a few test orders (at least one Served, one in another status). Switch to the Report tab.

Expected:
- Date controls bar appears at the top with "Today" button highlighted
- Report shows today's orders exactly as before
- Summary cards show correct totals

- [ ] **Step 4: Verify Yesterday and Last 7 Days presets**

In the browser console, plant a fake previous day's entry to test with:

```js
// Plant fake data for yesterday
const yesterday = dateStr(-1);
localStorage.setItem('orders_' + yesterday, JSON.stringify({
  tickets: [{ id: 99, orderNum: '#001', status: 'Served', lineItems: [{ itemId: 0, name: 'Black Coffee', price: 60, quantity: 2 }], total: 120 }],
  nextOrderNum: 2,
  nextTicketId: 100
}));
```

Then click "Yesterday" — expected: report shows the planted order, summary card shows ₱120. Click "Last 7 Days" — expected: report shows yesterday's order plus today's orders, summary aggregated. Click "Today" — expected: returns to today's orders only, Yesterday preset no longer active.

- [ ] **Step 5: Verify custom range**

In the Report tab, set "From" and "To" both to yesterday's date and click Apply. Expected: shows yesterday's planted data, no preset button highlighted. Set From > To and confirm Apply button is disabled.

- [ ] **Step 6: Clean up test data**

```js
localStorage.removeItem('orders_' + dateStr(-1));
```

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "feat: add date controls and multi-date rendering to report tab"
```

---

### Task 4: Admin — Stored Records section

**Files:**
- Modify: `index.html` — admin tab HTML (~line 282) and JS (after `deleteMenuItem`, before tab delegation)

- [ ] **Step 1: Add `#stored-records` placeholder to the Admin tab HTML**

Find the closing `</div>` of `#admin-tab` (the one after `</div>` of `.table-scroll-wrap`, around line 282):

```html
    </div>
  </div>
```

Change it to:

```html
    </div>

    <div id="stored-records"><!-- rendered by JS --></div>
  </div>
```

- [ ] **Step 2: Add `renderStoredRecords()` function**

Insert the following after the `deleteMenuItem()` function and before the `// ─── MENU TABLE DELEGATION` comment:

```js
// ─── ADMIN: STORED RECORDS ────────────────────────────────────────────────────
function renderStoredRecords() {
  const container = document.getElementById('stored-records');

  const allKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (/^orders_\d{4}-\d{2}-\d{2}$/.test(key) && key !== TODAY_KEY) {
      allKeys.push(key);
    }
  }
  allKeys.sort((a, b) => b.localeCompare(a)); // most recent first

  if (allKeys.length === 0) {
    container.innerHTML = `
      <div class="stored-records">
        <h3>Stored Records</h3>
        <p class="stored-records-empty">No previous records stored.</p>
      </div>`;
    return;
  }

  const rowsHtml = allKeys.map(key => {
    const datePart = key.slice(7);
    const label = new Date(datePart + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    return `
      <div class="stored-record-row">
        <input type="checkbox" class="stored-record-cb" data-key="${escHtml(key)}" id="cb-${escHtml(key)}">
        <label for="cb-${escHtml(key)}">${escHtml(label)}</label>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="stored-records">
      <h3>Stored Records</h3>
      <div class="stored-record-list">${rowsHtml}</div>
      <div class="stored-records-actions">
        <button class="btn btn-danger btn-sm" id="btn-delete-records" disabled>Delete Selected</button>
      </div>
    </div>`;

  container.querySelectorAll('.stored-record-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const anyChecked = container.querySelectorAll('.stored-record-cb:checked').length > 0;
      document.getElementById('btn-delete-records').disabled = !anyChecked;
    });
  });

  document.getElementById('btn-delete-records').addEventListener('click', () => {
    const checked = Array.from(container.querySelectorAll('.stored-record-cb:checked'));
    const count = checked.length;
    if (!confirm(`Delete records for ${count} day${count === 1 ? '' : 's'}? This cannot be undone.`)) return;
    checked.forEach(cb => localStorage.removeItem(cb.dataset.key));
    renderStoredRecords();
  });
}
```

- [ ] **Step 3: Call `renderStoredRecords()` when the Admin tab is activated**

Find the line in `initTabs()`:

```js
      if (tabId === 'admin-tab') renderMenuTable();
```

Change it to:

```js
      if (tabId === 'admin-tab') { renderMenuTable(); renderStoredRecords(); }
```

- [ ] **Step 4: Verify empty state**

Open `index.html`. Switch to Admin tab. Scroll to the bottom. Expected: "Stored Records" section visible with "No previous records stored." message.

- [ ] **Step 5: Verify with stored records**

In the browser console, plant two fake records:

```js
localStorage.setItem('orders_2026-03-27', JSON.stringify({ tickets: [], nextOrderNum: 1, nextTicketId: 1 }));
localStorage.setItem('orders_2026-03-28', JSON.stringify({ tickets: [], nextOrderNum: 1, nextTicketId: 1 }));
```

Switch away from Admin tab and back. Expected: two rows appear (most recent first), both with checkboxes. Delete Selected button is disabled. Check one box — Delete Selected enables. Click Delete Selected, confirm — one record removed, list updates to one row. Check remaining row and delete — section returns to empty state message.

- [ ] **Step 6: Verify today's key is excluded**

In the console: `localStorage.setItem(TODAY_KEY, JSON.stringify({ tickets: appState.tickets, nextOrderNum: appState.nextOrderNum, nextTicketId: appState.nextTicketId }))`. Re-render admin tab. Expected: today's entry does NOT appear in the Stored Records list.

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "feat: add stored records section to admin tab"
```
