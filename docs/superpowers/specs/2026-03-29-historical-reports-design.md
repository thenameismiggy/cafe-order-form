# Historical Reports & Record Cleanup — Design Spec
**Date:** 2026-03-29
**Status:** Approved

## Overview

Two related features:

1. **Historical Reports** — the Report tab gains date controls so staff can view reports for previous days or a date range, not just today.
2. **Record Cleanup** — the Admin tab gains a "Stored Records" section so staff can delete specific days of saved data (e.g. test data from before going live).

---

## Context

- Orders are already persisted to localStorage under date-keyed entries (`orders_YYYY-MM-DD`), but previous days' data is never surfaced.
- `TODAY_KEY` is computed once at page load and used for all reads/writes during the session — this feature does not change that.
- The report tab currently derives all data from `appState.tickets` (today only). Historical reports will read directly from localStorage for the selected date(s), bypassing `appState`.

---

## Report Tab — Date Controls

A date control bar is added at the top of the report tab, above the existing summary cards.

### Preset buttons
Three buttons: **Today**, **Yesterday**, **Last 7 days**. Selecting a preset:
- Highlights the active preset button
- Immediately re-renders the report for the selected range
- Clears any in-progress custom range inputs

### Custom range
Two date inputs labeled **From** and **To**, plus an **Apply** button.
- Apply is disabled when From > To or either field is empty.
- Clicking Apply deselects any active preset, re-renders the report for the selected range.
- Dates with no stored data are valid — the report shows an empty state.

### Default on load
**Today** preset is active. Report behavior is identical to the current implementation (reads from `appState.tickets` for today, same as before).

---

## Report Content — Multi-Date Rendering

### Single day (Today or a single custom date)
Behavior is unchanged from the current implementation. No date grouping header needed.

**Today specifically:** continues to read from `appState.tickets` (live session data), so in-progress orders are always reflected.

**Any other single day:** reads from `localStorage['orders_YYYY-MM-DD']`. Parses and validates the stored structure; on failure or missing key, renders the empty state.

### Date range (multiple days)
When the selected range spans more than one day:

- **Summary cards** — totals and order count aggregated across all days in the range.
- **Items breakdown table** — quantities and totals aggregated across all days.
- **Order list** — grouped by date, each group preceded by a date heading (e.g. "March 27, 2026"), showing that day's orders underneath in the existing per-order format.

Days with no data are silently skipped (not shown as empty groups).

### Reading historical data
A helper `loadOrdersForDate(dateStr)` reads `localStorage['orders_' + dateStr]`, parses and validates the result (same validation logic as the existing page-load restore: `tickets` is Array, `nextOrderNum` and `nextTicketId` are integers ≥ 1), and returns the tickets array or `[]` on any failure.

Today's data always comes from `appState.tickets`, not from localStorage, so live orders are always included.

---

## Admin Tab — Stored Records Section

A new section titled **Stored Records** is appended at the bottom of the Admin tab.

### Contents
- A list of all `orders_YYYY-MM-DD` keys found in localStorage, each row showing:
  - A checkbox
  - The date formatted readably (e.g. "March 27, 2026")
- Today's entry is excluded — current session data cannot be deleted here.
- If no previous records exist, the section shows a short message: "No previous records stored."

### Delete Selected button
- Disabled until at least one checkbox is checked.
- On click, shows a confirmation dialog: "Delete records for X day(s)? This cannot be undone."
- On confirm: removes each selected localStorage key, refreshes the list.
- On cancel: no action.

### Discovering stored keys
Enumerate all localStorage keys at section render time, filter to those matching `/^orders_\d{4}-\d{2}-\d{2}$/`, exclude today's key, sort descending (most recent first).

The section re-renders after each deletion to reflect what remains.

---

## Out of Scope

- Exporting reports (CSV, print, etc.)
- Editing or merging historical records
- Automatic cleanup of old records
- Cross-device sync
