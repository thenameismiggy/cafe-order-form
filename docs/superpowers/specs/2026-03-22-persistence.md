# Persistence — Design Spec
**Date:** 2026-03-22
**Status:** Approved

## Overview

Persist order tickets to localStorage, keyed by date. Orders survive page refresh and browser restart within the same calendar day. Order numbering resets to #001 each new calendar day when the page is refreshed. The report tab always reflects only today's orders.

---

## Context

- **Current behavior:** All tickets live in `appState` (in-memory). A page refresh wipes everything.
- **Target behavior:** Tickets are written to localStorage on every state mutation and restored on load. Only today's orders are ever loaded.
- **Session philosophy preserved:** Each calendar day is independent. Yesterday's data stays in localStorage but is never surfaced.

**Relevant `appState` fields restored by this feature:**
- `tickets` — array of ticket objects (the core order data)
- `nextOrderNum` — integer counter used to generate order numbers (`#001`, `#002`, …)
- `nextTicketId` — integer counter used to generate unique in-memory ticket IDs

All other `appState` fields retain their initialized defaults on load — only these three are restored.

**Counter ownership:** Each mutation function is responsible for incrementing the relevant counters before calling `persistOrders()`:
- `handleSave()` — increments `nextOrderNum` and `nextTicketId` when creating a new ticket; leaves them unchanged when updating an existing ticket
- `handleSubmit()` — always increments both `nextOrderNum` and `nextTicketId`
- `updateTicketStatus()` — does not modify either counter

`persistOrders()` captures whatever values exist in `appState` at the time it is called. Counter correctness relies on each mutation function fulfilling this contract.

---

## Storage Key

A module-level constant is computed once on page load using **local time** (not UTC) to match the calendar date the café staff sees:

```js
const _d = new Date();
const TODAY_KEY = 'orders_' + _d.getFullYear() + '-' +
  String(_d.getMonth() + 1).padStart(2, '0') + '-' +
  String(_d.getDate()).padStart(2, '0');
// e.g. 'orders_2026-03-22'
```

`TODAY_KEY` is used for all reads and writes throughout the session. It is not stored in `appState`.

**Known limitation — midnight boundary:** `TODAY_KEY` is fixed at page load. If a tab is left open past midnight, new orders will continue writing to the previous day's key, order numbers will **not** reset to #001, and the report will include orders from both calendar days. This contradicts the "resets each new calendar day" guarantee stated in the Overview — that guarantee only holds when the page is refreshed at the start of each shift. This is an accepted limitation. Staff should refresh the page at the start of each shift.

---

## Saved Data Structure

```json
{
  "tickets": [...],
  "nextOrderNum": 5,
  "nextTicketId": 5
}
```

All three fields are saved and restored together. Each ticket object has: `id`, `orderNum`, `status`, `lineItems`, and `total`.

---

## On Page Load

The entire load sequence — including the initial `localStorage.getItem()` call — is wrapped in a single try/catch. This is important: `localStorage.getItem()` itself throws a `SecurityError` in some browsers when storage is unavailable (private browsing, policy-disabled). On any exception at any step, fall through to **fresh start**.

```
try:
  Step 1. Read localStorage[TODAY_KEY]             ← inside the try block
  Step 2. If null (key missing), go to FRESH START
  Step 3. JSON.parse the value
  Step 4. Validate the parsed structure:
            - parsed.tickets is an Array
            - Number.isInteger(parsed.nextOrderNum) && parsed.nextOrderNum >= 1
            - Number.isInteger(parsed.nextTicketId) && parsed.nextTicketId >= 1
          If any check fails, go to FRESH START
  Step 5. Restore: appState.tickets = parsed.tickets
                   appState.nextOrderNum = parsed.nextOrderNum
                   appState.nextTicketId = parsed.nextTicketId
  Step 6. Done

catch (any error):
  FRESH START

FRESH START: appState.tickets = [], appState.nextOrderNum = 1, appState.nextTicketId = 1
```

**Per-ticket validation:** Individual ticket object fields (`id`, `orderNum`, `status`, `lineItems`, `total`) are not validated beyond the top-level array check. Corrupted per-ticket data is accepted as a known risk — the app may behave unexpectedly if individual tickets are malformed. This is considered a developer-facing edge case and is out of scope.

**Integer validation:** Use `Number.isInteger(value) && value >= 1` — this correctly rejects floats (e.g. `4.7`) and non-numbers.

**Empty tickets array:** When `parsed.tickets` is empty, any `nextOrderNum >= 1` and `nextTicketId >= 1` is valid.

**Load-time storage failure:** If Step 1 throws (localStorage unavailable), the app starts fresh silently — no banner is shown at load time. The banner is deferred to the first write attempt that fails. Staff will see a clean starting state; if writes also fail, the banner will appear on the first save action.

---

## Save Triggers

`persistOrders()` is a new helper that serializes `appState.tickets`, `appState.nextOrderNum`, and `appState.nextTicketId` to `TODAY_KEY`. It is called once at the end of each mutation function:

- `handleSave()` — ticket created or updated
- `handleSubmit()` — ticket created and immediately set to Served
- `updateTicketStatus()` — status changed on any ticket

No explicit "save" button. Persistence is automatic and immediate.

`persistOrders()` is wrapped in try/catch. On failure, `showStorageError()` is called (defined in UX Guards spec: a dismissible red banner injected before `<header>`; reappears on each new failure after dismissal).

---

## Report Tab

No changes required. `renderReportTab()` already derives all data from `appState.tickets`. Since only today's tickets are loaded into `appState`, the report naturally reflects only today's orders.

---

## Old Entries

Previous date entries are left in localStorage indefinitely. This is a known limitation: localStorage is typically capped at ~5 MB per origin. Over many months of daily use, old entries will accumulate. If the quota is hit, `persistOrders()` will throw and the storage error banner will be shown. Cleanup is out of scope.

---

## Out of Scope

- Viewing or exporting data from previous dates
- Manual "end of day" clear
- Automatic cleanup of old date entries
- Cross-device or cross-tab sync
- Automatic date-change detection within a running session
- Per-ticket field validation on restore
