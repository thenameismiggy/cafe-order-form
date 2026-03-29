# Firebase Hosting & Real-Time Sync — Design Spec

**Date:** 2026-03-29
**Status:** Approved

## Overview

Deploy the café order form to the internet with free hosting (GitHub Pages) and real-time cross-device synchronization (Firebase Firestore). Supports 2–3 devices, 1–2 users, with a shared-password access gate.

---

## 1. Architecture

- **Hosting:** GitHub Pages serves `index.html` from the `main` branch. No build step. `git push` = deploy.
- **Database:** Firebase Firestore (free Spark plan) — real-time sync via `onSnapshot` listeners.
- **Auth:** Firebase Anonymous Auth — auto sign-in on page load, invisible to user. Required for Firestore security rules.
- **SDK:** Firebase loaded via CDN `<script>` tags. `index.html` remains a single file with no build tooling.

---

## 2. Firestore Data Model

Three documents, one collection for historical orders:

```
/config/menu
  {
    items: Array<{ id, name, price, category, available }>,
    idCounter: number
  }

/config/categories
  {
    list: string[]
  }

/config/access
  {
    password: string
  }

/orders/{YYYY-MM-DD}
  {
    tickets: Array<ticket>,
    nextOrderNum: number,
    nextTicketId: number
  }
```

**Design decisions:**
- `menuIdCounter` is merged into `/config/menu` as `idCounter` — keeps the counter in sync with items.
- Each day's orders are one document. At ~100 orders/day each ticket is ~200 bytes — well under Firestore's 1MB document limit.
- Historical records are the `/orders` collection. Queried on demand; no live listener needed.
- UI state (`panelOpen`, `panelQtys`, `panelFlavors`, `editingRowId`, `editingCategoryIndex`) stays in-memory only — not synced. Each device manages its own UI independently.

---

## 3. Real-Time Sync

Three `onSnapshot` listeners attach at startup:

| Listener | On change |
|---|---|
| `/config/menu` | Update `_menuCache`, re-render menu table + order panel |
| `/config/categories` | Update categories cache, re-render category section |
| `/orders/YYYY-MM-DD` | Update `appState.tickets`, `nextOrderNum`, `nextTicketId`, re-render ticket list |

**Write flow:** All saves (`saveMenu`, `saveCategories`, `saveOrders`) become `setDoc` calls. The `onSnapshot` fires immediately after, so UI re-renders from Firestore state — keeping all devices consistent including the writer.

**Day rollover:** The orders listener targets today's date computed at load time. Reload after midnight picks up the new day automatically.

**Historical data:** Report and Admin tabs fetch past days with a one-time `getDocs` query on the `/orders` collection. No live listener needed.

**Offline:** Firestore SDK caches reads and queues writes automatically. Changes sync on reconnect. No extra code required.

---

## 4. Auth & Password Gate

**Anonymous Auth:** `signInAnonymously()` runs on page load. Gives the browser a valid Firebase auth token. Firestore security rules require this token — unauthenticated requests are rejected.

**Password modal:** Before the app renders, a full-screen modal prompts for the shared password. The entered value is compared against `/config/access.password` in Firestore (readable by any anonymous-auth user; all other documents require the password gate to have passed). On match:
- `sessionStorage.setItem('auth', 'ok')` is set
- Modal closes, app renders normally

On subsequent page loads in the same browser session, the modal is skipped.

**Changing the password:** Update `/config/access.password` directly in the Firebase console. No redeploy needed.

**Security rules:**
```
/config/access     → read: authenticated (anonymous OK), write: never from client
/config/menu       → read/write: authenticated anonymous
/config/categories → read/write: authenticated anonymous
/orders/**         → read/write: authenticated anonymous
```

The password gate is UI-level protection, appropriate for preventing strangers from accessing café order data. The app contains no sensitive personal data (no customer names, no payment info).

**Session end:** Closing the browser tab clears `sessionStorage`. Password required again on next visit.

---

## 5. Data Migration (localStorage → Firestore)

Runs automatically on first load after deployment. Logic:

1. After sign-in, read `/config/menu` from Firestore.
2. If document **does not exist** AND `localStorage` has a `menu` key:
   - Upload `menu` + `menuIdCounter` → `/config/menu`
   - Upload `categories` → `/config/categories`
   - Upload all `orders_YYYY-MM-DD` keys → `/orders/YYYY-MM-DD` (one doc per day)
   - Remove migrated localStorage keys
3. If Firestore already has data → skip.
4. If both are empty → seed defaults (same as current behavior).

The first device to load after deployment becomes the source of truth. All other devices sync from Firestore on their next load.

---

## 6. Code Changes

### New code
- Firebase SDK `<script>` tags (CDN)
- Firebase config object (from Firebase console, ~7 lines)
- Password modal HTML + CSS
- `initFirebase()` — signs in anonymously, attaches three `onSnapshot` listeners
- `migrateFromLocalStorage()` — one-time migration on first load

### Modified functions

| Function | Change |
|---|---|
| `getMenu()` | Reads from `_menuCache` (populated by snapshot, not localStorage) |
| `saveMenu(menu)` | `setDoc('/config/menu', { items: menu, idCounter })` |
| `getIdCounter()` | Removed — `idCounter` lives in `/config/menu` |
| `saveIdCounter(n)` | Removed — merged into `saveMenu()` |
| `getCategories()` | Reads from in-memory cache (populated by snapshot) |
| `saveCategories(arr)` | `setDoc('/config/categories', { list: arr })` |
| `saveOrders()` | `setDoc('/orders/TODAY_DATE_STR', { tickets, nextOrderNum, nextTicketId })` |
| `loadTodayOrders()` | Removed — handled by orders `onSnapshot` on startup |
| `loadOrdersForDate(dateStr)` | `getDoc('/orders/dateStr')` |
| Admin delete records | `deleteDoc('/orders/dateStr')` per checked item |

### Unchanged
- All UI rendering functions (`renderMenuTable`, `renderOrderPanel`, `renderTicketCards`, `renderStoredRecords`, etc.)
- All business logic (`validatePanel`, `computeTotal`, `buildLineItems`, etc.)
- All CSS
- `appState` structure
- Mobile layout and navigation
- Report tab rendering logic

**Estimated scope:** ~15 function modifications, ~60–80 lines of new Firebase initialization/migration code.

---

## 7. Out of Scope

- Per-user accounts or role-based access (can be added later if needed)
- Push notifications
- Conflict resolution for simultaneous edits to the same ticket (Firestore last-write-wins is acceptable at this scale)
- Custom domain (GitHub Pages provides a `username.github.io/repo` URL by default)
