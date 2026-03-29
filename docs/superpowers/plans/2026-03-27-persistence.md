# Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist order tickets to localStorage keyed by today's date so orders survive page refresh within the same calendar day.

**Architecture:** All changes are in `index.html` (single-file app). A module-level `TODAY_KEY` constant is computed once on load. `persistOrders()` serializes tickets + counters to that key after every mutation. `loadOrders()` restores them on startup with full validation and silent fallback to fresh start.

**Tech Stack:** Vanilla JS, localStorage API, single HTML file (no build step, no test runner — verification is manual via browser).

---

## Dependency Note

`persistOrders()` calls `showStorageError()`, which is formally defined in the UX Guards spec. A minimal stub is added in Task 1 so this feature is self-contained. UX Guards will replace the stub with the real implementation.

---

## File Map

- Modify: `index.html`
  - After line 300 (`nextMenuId` block ends): add `TODAY_KEY` constant + `showStorageError()` stub
  - After `showStorageError()` stub: add `persistOrders()` + `loadOrders()` functions
  - Line 660 (`updateTicketStatus`): add `persistOrders()` call at end
  - Line 889 (`handleSave`): add `persistOrders()` call at end
  - Line 923 (`handleSubmit`): add `persistOrders()` call at end
  - Line 983 (initial render block): add `loadOrders()` call before `seedMenuIfNeeded()`

---

## Task 1: TODAY_KEY constant + showStorageError() stub

**Files:**
- Modify: `index.html` (after line 300, inside the localStorage helpers section)

- [ ] **Step 1: Add TODAY_KEY and showStorageError stub**

Insert the following block after the closing brace of `nextMenuId()` (after line 300), before the `// ─── DEFAULT MENU` comment:

```js
// ─── ORDER PERSISTENCE ───────────────────────────────────────────────────────
const _d = new Date();
const TODAY_KEY = 'orders_' + _d.getFullYear() + '-' +
  String(_d.getMonth() + 1).padStart(2, '0') + '-' +
  String(_d.getDate()).padStart(2, '0');
// e.g. 'orders_2026-03-27'
// NOTE: TODAY_KEY is fixed at page load. If a tab remains open past midnight,
// new orders write to the previous day's key. Staff should refresh at shift start.

// Stub — replaced by UX Guards spec implementation
function showStorageError() {
  if (document.getElementById('storage-error-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'storage-error-banner';
  banner.style.cssText = 'background:#dc2626;color:#fff;padding:0.75rem 1rem;display:flex;justify-content:space-between;align-items:center;';
  banner.innerHTML = '<span>Storage error: your changes could not be saved. Please contact your developer.</span>' +
    '<button onclick="this.parentElement.remove()" style="background:none;border:none;color:#fff;font-size:1.2rem;cursor:pointer;">×</button>';
  document.body.insertBefore(banner, document.body.firstChild);
}
```

- [ ] **Step 2: Verify TODAY_KEY in browser console**

Open `index.html` in browser. Open DevTools console. Type:

```js
TODAY_KEY
```

Expected: `"orders_2026-03-27"` (today's date in local time)

---

## Task 2: persistOrders() function

**Files:**
- Modify: `index.html` (directly after the `showStorageError()` stub from Task 1)

- [ ] **Step 1: Add persistOrders()**

Insert immediately after `showStorageError()`:

```js
function persistOrders() {
  try {
    localStorage.setItem(TODAY_KEY, JSON.stringify({
      tickets: appState.tickets,
      nextOrderNum: appState.nextOrderNum,
      nextTicketId: appState.nextTicketId,
    }));
  } catch (e) {
    showStorageError();
  }
}
```

- [ ] **Step 2: Smoke-test persistOrders() manually**

In browser console, call it directly:

```js
persistOrders();
JSON.parse(localStorage.getItem(TODAY_KEY));
```

Expected: object with `tickets: []`, `nextOrderNum: 1`, `nextTicketId: 1` (fresh state).

---

## Task 3: loadOrders() function

**Files:**
- Modify: `index.html` (directly after `persistOrders()`)

- [ ] **Step 1: Add loadOrders()**

```js
function loadOrders() {
  try {
    const raw = localStorage.getItem(TODAY_KEY);
    if (raw === null) return; // nothing saved today — fresh start
    const parsed = JSON.parse(raw);
    if (
      !Array.isArray(parsed.tickets) ||
      !(Number.isInteger(parsed.nextOrderNum) && parsed.nextOrderNum >= 1) ||
      !(Number.isInteger(parsed.nextTicketId) && parsed.nextTicketId >= 1)
    ) return; // invalid structure — fresh start
    appState.tickets = parsed.tickets;
    appState.nextOrderNum = parsed.nextOrderNum;
    appState.nextTicketId = parsed.nextTicketId;
  } catch (e) {
    // localStorage unavailable or JSON corrupt — fresh start, no banner at load time
  }
}
```

- [ ] **Step 2: Test loadOrders() validation manually**

In browser console, test the fresh-start cases:

```js
// Case 1: key missing — should do nothing
localStorage.removeItem(TODAY_KEY);
appState.tickets = []; appState.nextOrderNum = 1; appState.nextTicketId = 1;
loadOrders();
console.assert(appState.tickets.length === 0, 'Case 1 failed');

// Case 2: invalid structure — should do nothing
localStorage.setItem(TODAY_KEY, JSON.stringify({ tickets: 'bad', nextOrderNum: 1, nextTicketId: 1 }));
loadOrders();
console.assert(appState.tickets.length === 0, 'Case 2: tickets not array');

// Case 3: float counter — should reject
localStorage.setItem(TODAY_KEY, JSON.stringify({ tickets: [], nextOrderNum: 4.7, nextTicketId: 1 }));
loadOrders();
console.assert(appState.nextOrderNum === 1, 'Case 3: float rejected');

// Case 4: valid data — should restore
localStorage.setItem(TODAY_KEY, JSON.stringify({ tickets: [{id:1}], nextOrderNum: 2, nextTicketId: 2 }));
loadOrders();
console.assert(appState.tickets.length === 1, 'Case 4: tickets restored');
console.assert(appState.nextOrderNum === 2, 'Case 4: nextOrderNum restored');
```

Expected: All four assertions pass (no assertion errors logged).

---

## Task 4: Wire loadOrders() into initialization

**Files:**
- Modify: `index.html` (line ~983, the `// ─── INITIAL RENDER` block)

- [ ] **Step 1: Call loadOrders() before seedMenuIfNeeded()**

Find the initial render block:

```js
// ─── INITIAL RENDER ───────────────────────────────────────────────────────────
seedMenuIfNeeded();
initTabs();
renderOrderPanel();
renderTicketCards();
```

Change it to:

```js
// ─── INITIAL RENDER ───────────────────────────────────────────────────────────
loadOrders();
seedMenuIfNeeded();
initTabs();
renderOrderPanel();
renderTicketCards();
```

- [ ] **Step 2: Verify restoration on page refresh**

In browser:
1. Open the app fresh (clear localStorage first via DevTools → Application → Clear Site Data)
2. Create an order — confirm it appears in the ticket list
3. Reload the page (Ctrl+R / Cmd+R)
4. Expected: the ticket reappears in the list with the same order number and status

---

## Task 5: Wire persistOrders() into mutation functions

**Files:**
- Modify: `index.html`
  - `updateTicketStatus()` (~line 660)
  - `handleSave()` (~line 889)
  - `handleSubmit()` (~line 923)

- [ ] **Step 1: Add persistOrders() to updateTicketStatus()**

Find the end of `updateTicketStatus()`:

```js
  renderTicketCards();
  renderReportTab();
}
```

Change to:

```js
  renderTicketCards();
  renderReportTab();
  persistOrders();
}
```

- [ ] **Step 2: Add persistOrders() to handleSave()**

Find the end of `handleSave()`:

```js
  closePanel();
  renderTicketCards();
  renderReportTab();
}
```

Change to:

```js
  closePanel();
  renderTicketCards();
  renderReportTab();
  persistOrders();
}
```

- [ ] **Step 3: Add persistOrders() to handleSubmit()**

Find the end of `handleSubmit()`:

```js
  closePanel();
  renderTicketCards();
  renderReportTab();
  showModal(orderNum, lineItems, total);
}
```

Change to:

```js
  closePanel();
  renderTicketCards();
  renderReportTab();
  showModal(orderNum, lineItems, total);
  persistOrders();
}
```

- [ ] **Step 4: Verify persistence after each mutation**

In browser (clear localStorage first):

1. **Create order:** Click New Order, add items, click Save
   - In console: `JSON.parse(localStorage.getItem(TODAY_KEY)).tickets.length` → `1`
   - `JSON.parse(localStorage.getItem(TODAY_KEY)).nextOrderNum` → `2`

2. **Update order:** Click the saved ticket, change items, click Save
   - In console: `JSON.parse(localStorage.getItem(TODAY_KEY)).tickets.length` → still `1` (updated, not added)
   - `JSON.parse(localStorage.getItem(TODAY_KEY)).nextOrderNum` → still `2` (unchanged on edit)

3. **Status change:** Use the status dropdown on the ticket
   - In console: `JSON.parse(localStorage.getItem(TODAY_KEY)).tickets[0].status` → updated status value

4. **Submit order:** Create a second order, click Submit (Mark as Served)
   - In console: ticket count → `2`, `nextOrderNum` → `3`

- [ ] **Step 5: Verify full round-trip**

1. Create 2–3 orders, change some statuses
2. Reload the page
3. Expected: all tickets restore with correct order numbers and statuses
4. Create one more order — its number should continue from where it left off (not reset to #001)

---

## Task 6: Commit

- [ ] **Step 1: Commit**

```bash
cd C:/Users/Miggy/documents/order-form-test/.worktrees/feature-persistence
git add index.html
git commit -m "feat: persist orders to localStorage keyed by today's date

- Add TODAY_KEY constant (local time, computed once at page load)
- Add persistOrders(): serializes tickets + counters after each mutation
- Add loadOrders(): restores today's tickets on startup with validation
- Wire into handleSave, handleSubmit, updateTicketStatus
- Add showStorageError() stub (UX Guards spec will replace)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
