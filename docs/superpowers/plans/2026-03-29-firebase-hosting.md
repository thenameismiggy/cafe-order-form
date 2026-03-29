# Firebase Hosting & Real-Time Sync — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the café order form to GitHub Pages with Firebase Firestore replacing all localStorage usage, enabling real-time cross-device sync.

**Architecture:** All persistent data (menu, categories, daily orders) moves from localStorage to Firestore. Three `onSnapshot` listeners keep every open device in sync instantly. Anonymous Auth gates Firestore access; a shared-password modal provides UI-level access control. The existing `<script>` block converts to `<script type="module">` to use the Firebase modular SDK via CDN. A one-time migration uploads any existing localStorage data on first load.

**Tech Stack:** Firebase JS SDK (CDN, modular — check https://firebase.google.com/docs/web/setup for latest CDN version), Firebase Firestore, Firebase Anonymous Auth, GitHub Pages

---

## File Map

**Single file modified:** `index.html`
- All changes are within the `<script>` block (lines ~328–1562) plus the `<script>` tag itself and one new `<div>` for the password modal before `<body>` content.
- No new files created.

---

## Task 1: Firebase Project Setup (Manual Prerequisites)

**Files:** None (Firebase console + GitHub settings)

- [ ] **Step 1: Create Firebase project**

  Go to https://console.firebase.google.com → "Add project" → give it a name (e.g., `cafe-order-form`) → disable Google Analytics → Create.

- [ ] **Step 2: Enable Firestore**

  In the Firebase console sidebar: Build → Firestore Database → "Create database" → Start in **test mode** (security rules will be tightened in Task 13) → choose a region close to you → Done.

- [ ] **Step 3: Enable Anonymous Auth**

  Build → Authentication → Sign-in method → Anonymous → Enable → Save.

- [ ] **Step 4: Create the access document**

  In Firestore console: Start collection → Collection ID: `config` → Document ID: `access` → Add field: `password` (string) → set value to your chosen shared password → Save.

- [ ] **Step 5: Get the Firebase config snippet**

  Project Settings (gear icon) → Your apps → Web app → Register app (name it anything) → Copy the `firebaseConfig` object. Keep it open — you'll paste it in Task 2.

- [ ] **Step 6: Enable GitHub Pages**

  Push the repo to GitHub if not already there. Go to repo Settings → Pages → Source: Deploy from a branch → Branch: `main` / `/ (root)` → Save. Note the published URL (e.g., `https://yourusername.github.io/order-form-test`).

---

## Task 2: Convert `<script>` to Module + Add Firebase SDK

**Files:**
- Modify: `index.html` line 328 (`<script>` tag) and top of script block

- [ ] **Step 1: Change the script tag to a module**

  Find line 328:
  ```html
  <script>
  ```
  Replace with:
  ```html
  <script type="module">
  ```

- [ ] **Step 2: Add Firebase imports at the very top of the script block (line 329)**

  Insert these lines immediately after `<script type="module">`, before the `// ─── STATE` comment:
  ```js
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js';
  import { getFirestore, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot, collection } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js';
  import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js';
  ```

  > Note: Replace `11.0.0` with the latest version from https://firebase.google.com/docs/web/setup#available-libraries

- [ ] **Step 3: Add Firebase config and app initialization after the imports**

  ```js
  // ─── FIREBASE ────────────────────────────────────────────────────────────────
  const firebaseConfig = {
    apiKey:            "PASTE_FROM_CONSOLE",
    authDomain:        "PASTE_FROM_CONSOLE",
    projectId:         "PASTE_FROM_CONSOLE",
    storageBucket:     "PASTE_FROM_CONSOLE",
    messagingSenderId: "PASTE_FROM_CONSOLE",
    appId:             "PASTE_FROM_CONSOLE",
  };
  const _app = initializeApp(firebaseConfig);
  const db   = getFirestore(_app);
  const auth = getAuth(_app);
  ```

  Paste the actual values from the Firebase console (Step 5 of Task 1).

- [ ] **Step 4: Verify the script still loads**

  Open `index.html` directly in a browser (or via `http-server` / Live Server). Open DevTools → Console. There should be no errors about `import` syntax. The app may show empty (Firebase not yet wired up) — that's expected.

- [ ] **Step 5: Commit**

  ```bash
  git add index.html
  git commit -m "feat: convert script to module and add Firebase SDK imports"
  ```

---

## Task 3: Add Password Modal HTML + CSS

**Files:**
- Modify: `index.html` — HTML section (before `<script>`) and CSS section

- [ ] **Step 1: Add the modal HTML**

  Find the closing `</div>` of the `#confirmation-modal` element (around line 326, just before `<script>`). Insert immediately after it:

  ```html
  <!-- Password Gate Modal -->
  <div id="auth-modal" class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
    <div class="auth-modal-box">
      <h2 id="auth-title">Café Order Form</h2>
      <p class="auth-modal-sub">Enter the password to continue.</p>
      <input type="password" id="auth-password-input" class="auth-password-input" placeholder="Password" autocomplete="current-password" />
      <p id="auth-error" class="auth-error" aria-live="polite"></p>
      <button class="btn btn-primary" id="auth-submit-btn">Enter</button>
    </div>
  </div>
  ```

- [ ] **Step 2: Add the modal CSS**

  Find the `/* === RESET & BASE === */` comment at the top of the `<style>` block. Add the following CSS at the end of the `<style>` block (before `</style>`):

  ```css
  /* === AUTH MODAL === */
  .auth-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.65); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .auth-modal.hidden { display: none; }
  .auth-modal-box { background: #fff; border-radius: 10px; padding: 2rem; width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 0.85rem; box-shadow: 0 8px 32px rgba(0,0,0,0.25); }
  .auth-modal-box h2 { font-size: 1.15rem; color: #1a1a2e; }
  .auth-modal-sub { font-size: 0.88rem; color: #666; }
  .auth-password-input { width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #ccc; border-radius: 5px; font-size: 0.95rem; }
  .auth-password-input:focus { outline: 2px solid #4a90e2; outline-offset: 1px; }
  .auth-error { color: #c0392b; font-size: 0.82rem; min-height: 1.1em; }
  ```

- [ ] **Step 3: Verify modal appears on load**

  Open `index.html` in a browser. The password modal should be visible and cover the whole screen. Typing in the input should work. The Enter button does nothing yet.

- [ ] **Step 4: Commit**

  ```bash
  git add index.html
  git commit -m "feat: add password gate modal HTML and CSS"
  ```

---

## Task 4: Add Auth Functions and Password Gate Logic

**Files:**
- Modify: `index.html` — script block, in the `// ─── FIREBASE` section

- [ ] **Step 1: Add auth helper functions after the Firebase initialization lines**

  ```js
  function showPasswordModal() {
    document.getElementById('auth-modal').classList.remove('hidden');
    document.getElementById('auth-password-input').focus();
  }

  function hidePasswordModal() {
    document.getElementById('auth-modal').classList.add('hidden');
  }

  async function checkPassword(entered) {
    try {
      const snap = await getDoc(doc(db, 'config', 'access'));
      if (!snap.exists()) return false;
      return snap.data().password === entered;
    } catch {
      return false;
    }
  }

  async function handlePasswordSubmit() {
    const input = document.getElementById('auth-password-input');
    const errorEl = document.getElementById('auth-error');
    const btn = document.getElementById('auth-submit-btn');
    const entered = input.value;
    if (!entered) { errorEl.textContent = 'Please enter the password.'; return; }

    btn.disabled = true;
    errorEl.textContent = '';
    const ok = await checkPassword(entered);
    btn.disabled = false;

    if (ok) {
      sessionStorage.setItem('auth', 'ok');
      hidePasswordModal();
      startApp();
    } else {
      errorEl.textContent = 'Incorrect password.';
      input.value = '';
      input.focus();
    }
  }

  async function initFirebase() {
    await signInAnonymously(auth);
    if (sessionStorage.getItem('auth') === 'ok') {
      hidePasswordModal();
      startApp();
    } else {
      showPasswordModal();
    }
  }
  ```

- [ ] **Step 2: Wire up the password modal event listeners**

  Add after the `initFirebase` function:

  ```js
  document.getElementById('auth-submit-btn').addEventListener('click', handlePasswordSubmit);
  document.getElementById('auth-password-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') handlePasswordSubmit();
  });
  ```

- [ ] **Step 3: Hide the modal by default in HTML**

  Find the `<div id="auth-modal"` element added in Task 3 and add `hidden` class so it starts hidden (JS will show it after checking auth):

  Change:
  ```html
  <div id="auth-modal" class="auth-modal"
  ```
  To:
  ```html
  <div id="auth-modal" class="auth-modal hidden"
  ```

- [ ] **Step 4: Verify the password flow works end-to-end**

  Open `index.html` in a browser (Firebase must be configured in Task 2). The modal should appear. Enter a wrong password → "Incorrect password." error. Enter the correct password (the one you set in Task 1 Step 4) → modal closes, `sessionStorage.auth = 'ok'` should be set (check DevTools → Application → Session Storage). Refreshing should skip the modal.

  > Note: `startApp()` doesn't exist yet — the console will log an error after a correct password. That's expected.

- [ ] **Step 5: Commit**

  ```bash
  git add index.html
  git commit -m "feat: add Firebase auth and password gate logic"
  ```

---

## Task 5: Replace Menu localStorage with Firestore

**Files:**
- Modify: `index.html` — `// ─── LOCALSTORAGE HELPERS` section (~lines 342–373)

- [ ] **Step 1: Replace the menu cache variables and `getMenu()` / `saveMenu()`**

  Find and replace the entire `// ─── LOCALSTORAGE HELPERS` block (lines 342–373):

  ```js
  // ─── MENU STORAGE ─────────────────────────────────────────────────────────────
  let _menuCache = null;
  let _idCounter = 0;

  function getMenu() {
    return _menuCache;
  }

  function saveMenu(menu) {
    _menuCache = menu;
    setDoc(doc(db, 'config', 'menu'), { items: menu, idCounter: _idCounter });
  }

  function getIdCounter() {
    return _idCounter;
  }

  function nextMenuId() {
    const id = _idCounter;
    _idCounter++;
    return id;
  }
  ```

  > `saveIdCounter` is removed. `_idCounter` is incremented in `nextMenuId()` and persisted to Firestore on the next `saveMenu()` call, which always follows `nextMenuId()`.

- [ ] **Step 2: Update `seedMenuIfNeeded` to write to Firestore**

  Find `seedMenuIfNeeded()` (~line 509) and replace it:

  ```js
  async function seedMenuIfNeeded() {
    _idCounter = DEFAULT_MENU.length;
    const menu = DEFAULT_MENU.map((item, i) => ({ id: i, ...item }));
    _menuCache = menu;
    await setDoc(doc(db, 'config', 'menu'), { items: menu, idCounter: DEFAULT_MENU.length });
  }
  ```

- [ ] **Step 3: Verify no remaining references to `saveIdCounter`**

  Search the file for `saveIdCounter` — there should be zero results.

  ```
  grep -n "saveIdCounter" index.html
  ```
  Expected: no output.

- [ ] **Step 4: Verify no remaining `localStorage` in menu functions**

  ```
  grep -n "localStorage.*menu\|localStorage.*menuId" index.html
  ```
  Expected: no output.

- [ ] **Step 5: Commit**

  ```bash
  git add index.html
  git commit -m "feat: replace menu localStorage with Firestore"
  ```

---

## Task 6: Replace Categories localStorage with Firestore

**Files:**
- Modify: `index.html` — `// ─── CATEGORIES` section (~lines 472–489)

- [ ] **Step 1: Replace the categories block**

  Find and replace the entire `// ─── CATEGORIES` section:

  ```js
  // ─── CATEGORIES ───────────────────────────────────────────────────────────────
  let _categoriesCache = [];

  function getCategories() {
    return _categoriesCache;
  }

  function saveCategories(arr) {
    _categoriesCache = arr;
    setDoc(doc(db, 'config', 'categories'), { list: arr });
  }

  async function seedCategoriesIfNeeded() {
    _categoriesCache = ['Drinks', 'Food'];
    await setDoc(doc(db, 'config', 'categories'), { list: ['Drinks', 'Food'] });
  }
  ```

- [ ] **Step 2: Verify no remaining `localStorage` in category functions**

  ```
  grep -n "localStorage.*categor" index.html
  ```
  Expected: no output.

- [ ] **Step 3: Commit**

  ```bash
  git add index.html
  git commit -m "feat: replace categories localStorage with Firestore"
  ```

---

## Task 7: Replace Orders Persistence with Firestore

**Files:**
- Modify: `index.html` — `// ─── ORDER PERSISTENCE` section (~lines 375–470)

- [ ] **Step 1: Replace `persistOrders()` with `saveOrders()` using Firestore**

  Find `function persistOrders()` (~line 442) and replace the entire function:

  ```js
  function saveOrders() {
    setDoc(doc(db, 'orders', TODAY_DATE_STR), {
      tickets: appState.tickets,
      nextOrderNum: appState.nextOrderNum,
      nextTicketId: appState.nextTicketId,
    });
  }
  ```

- [ ] **Step 2: Remove `loadOrders()`**

  Find `function loadOrders()` (~line 454) and delete the entire function (lines 454–470). It is replaced by the `onSnapshot` listener in Task 10.

- [ ] **Step 3: Rename all `persistOrders()` call sites to `saveOrders()`**

  Find and replace all three occurrences:
  - Line ~1132 in `updateTicketStatus`: `persistOrders()` → `saveOrders()`
  - Line ~1486 in `handleSave`: `persistOrders()` → `saveOrders()`
  - Line ~1524 in `handleSubmit`: `persistOrders()` → `saveOrders()`

- [ ] **Step 4: Verify no remaining `persistOrders` references**

  ```
  grep -n "persistOrders" index.html
  ```
  Expected: no output.

- [ ] **Step 5: Commit**

  ```bash
  git add index.html
  git commit -m "feat: replace orders localStorage persistence with Firestore saveOrders"
  ```

---

## Task 8: Make `loadOrdersForDate` Async + Update `renderReportTab`

**Files:**
- Modify: `index.html` — `loadOrdersForDate` (~line 416) and `renderReportTab` (~line 1202)

- [ ] **Step 1: Replace `loadOrdersForDate` with async Firestore version**

  Find `function loadOrdersForDate(targetDateStr)` (~line 416) and replace the entire function:

  ```js
  async function loadOrdersForDate(targetDateStr) {
    if (targetDateStr === TODAY_DATE_STR) return appState.tickets;
    try {
      const snap = await getDoc(doc(db, 'orders', targetDateStr));
      if (!snap.exists()) return [];
      const parsed = snap.data();
      if (
        !Array.isArray(parsed.tickets) ||
        !(Number.isInteger(parsed.nextOrderNum) && parsed.nextOrderNum >= 1) ||
        !(Number.isInteger(parsed.nextTicketId) && parsed.nextTicketId >= 1)
      ) return [];
      return parsed.tickets;
    } catch {
      return [];
    }
  }
  ```

- [ ] **Step 2: Make `renderReportTab` async and await all date fetches**

  Find `function renderReportTab()` (~line 1202). Replace only the opening and the `ticketsByDate` derivation block:

  Change:
  ```js
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
  ```

  To:
  ```js
  async function renderReportTab() {
    // Guard: will be called from state mutations — skip when report tab is not visible.
    const reportPanel = document.getElementById('report-tab');
    if (!reportPanel.classList.contains('active')) return;

    const container = document.getElementById('report-content');
    const controlsHtml = renderReportDateControlsHtml();

    // Show loading state while fetching (covers multi-day and historical ranges)
    container.innerHTML = controlsHtml + '<p class="report-empty">Loading…</p>';
    attachReportDateListeners();

    const TRACKED = ['Served', 'Ready', 'Preparing'];
    const allDates = datesInRange(reportState.fromDate, reportState.toDate);
    const ticketArrays = await Promise.all(allDates.map(d => loadOrdersForDate(d)));
    const ticketsByDate = allDates
      .map((d, i) => ({ date: d, tickets: ticketArrays[i].filter(t => TRACKED.includes(t.status)) }))
      .filter(({ tickets }) => tickets.length > 0);
    const allTickets = ticketsByDate.flatMap(({ tickets }) => tickets);
  ```

  The rest of `renderReportTab` (from `if (allTickets.length === 0)` to the end) is unchanged.

- [ ] **Step 3: Commit**

  ```bash
  git add index.html
  git commit -m "feat: make loadOrdersForDate and renderReportTab async for Firestore"
  ```

---

## Task 9: Update `renderStoredRecords` and Admin Delete

**Files:**
- Modify: `index.html` — `renderStoredRecords` (~line 838) and delete handler (~line 885)

- [ ] **Step 1: Replace `renderStoredRecords` to use Firestore `getDocs`**

  Find `function renderStoredRecords()` (~line 838) and replace the entire function:

  ```js
  async function renderStoredRecords() {
    const container = document.getElementById('stored-records');
    container.innerHTML = `
      <div class="stored-records">
        <h3>Stored Records</h3>
        <p class="stored-records-empty">Loading…</p>
      </div>`;

    let allDates = [];
    try {
      const snap = await getDocs(collection(db, 'orders'));
      allDates = snap.docs
        .map(d => d.id)
        .filter(id => /^\d{4}-\d{2}-\d{2}$/.test(id) && id !== TODAY_DATE_STR)
        .sort((a, b) => b.localeCompare(a)); // most recent first
    } catch {
      container.innerHTML = `
        <div class="stored-records">
          <h3>Stored Records</h3>
          <p class="stored-records-empty">Could not load records.</p>
        </div>`;
      return;
    }

    if (allDates.length === 0) {
      container.innerHTML = `
        <div class="stored-records">
          <h3>Stored Records</h3>
          <p class="stored-records-empty">No previous records stored.</p>
        </div>`;
      return;
    }

    const rowsHtml = allDates.map(dateId => {
      const label = new Date(dateId + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      return `
        <div class="stored-record-row">
          <input type="checkbox" class="stored-record-cb" data-key="${escHtml(dateId)}" id="cb-${escHtml(dateId)}">
          <label for="cb-${escHtml(dateId)}">${escHtml(label)}</label>
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

    container.querySelector('#btn-delete-records').addEventListener('click', async () => {
      const checked = Array.from(container.querySelectorAll('.stored-record-cb:checked'));
      const count = checked.length;
      if (!confirm(`Delete records for ${count} day${count === 1 ? '' : 's'}? This cannot be undone.`)) return;
      await Promise.all(checked.map(cb => deleteDoc(doc(db, 'orders', cb.dataset.key))));
      renderStoredRecords();
    });
  }
  ```

  > Note: `data-key` now stores the date string (e.g. `2026-03-25`) instead of the localStorage key (`orders_2026-03-25`). The delete handler uses `deleteDoc` instead of `localStorage.removeItem`.

- [ ] **Step 2: Verify the old localStorage iteration is fully removed**

  ```
  grep -n "localStorage.key\|localStorage.length" index.html
  ```
  Expected: no output.

- [ ] **Step 3: Commit**

  ```bash
  git add index.html
  git commit -m "feat: update renderStoredRecords and admin delete to use Firestore"
  ```

---

## Task 10: Add `startApp()` with `onSnapshot` Listeners

**Files:**
- Modify: `index.html` — add `startApp()` after `initFirebase()` in the Firebase section

- [ ] **Step 1: Add `startApp()` after `initFirebase()`**

  Find the `initFirebase` function and add `startApp` immediately after it:

  ```js
  function startApp() {
    // Menu snapshot — updates _menuCache and _idCounter on every change
    onSnapshot(doc(db, 'config', 'menu'), snap => {
      if (!snap.exists()) return; // migrateOrSeed() will create it
      const data = snap.data();
      _menuCache = data.items;
      _idCounter = data.idCounter;
      renderMenuTable();
      renderOrderPanel();
    });

    // Categories snapshot — updates _categoriesCache on every change
    onSnapshot(doc(db, 'config', 'categories'), snap => {
      if (!snap.exists()) return;
      _categoriesCache = snap.data().list;
      renderCategorySection();
    });

    // Today's orders snapshot — updates appState.tickets on every change
    onSnapshot(doc(db, 'orders', TODAY_DATE_STR), snap => {
      if (snap.exists()) {
        const data = snap.data();
        appState.tickets = data.tickets;
        appState.nextOrderNum = data.nextOrderNum;
        appState.nextTicketId = data.nextTicketId;
      }
      // Whether or not the doc exists, re-render the ticket list
      renderTicketCards();
    });

    initTabs();
    renderOrderPanel();
    renderTicketCards();

    // Migrate from localStorage or seed defaults if Firestore is empty
    migrateOrSeed();
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add index.html
  git commit -m "feat: add startApp with three Firestore onSnapshot listeners"
  ```

---

## Task 11: Add `migrateOrSeed()`

**Files:**
- Modify: `index.html` — add `migrateOrSeed()` after `startApp()` in the Firebase section

- [ ] **Step 1: Add `migrateOrSeed()` after `startApp()`**

  ```js
  async function migrateOrSeed() {
    // Check if Firestore already has menu data
    const menuSnap = await getDoc(doc(db, 'config', 'menu'));
    if (menuSnap.exists()) return; // already set up — nothing to migrate

    const localMenu = localStorage.getItem('menu');
    if (localMenu) {
      // ── Migrate from localStorage ──────────────────────────────────────────
      const items = JSON.parse(localMenu);
      const idCounter = parseInt(localStorage.getItem('menuIdCounter') || '0', 10);
      await setDoc(doc(db, 'config', 'menu'), { items, idCounter });

      const localCats = localStorage.getItem('categories');
      if (localCats) {
        await setDoc(doc(db, 'config', 'categories'), { list: JSON.parse(localCats) });
      } else {
        await seedCategoriesIfNeeded();
      }

      // Migrate all historical orders
      const keysToMigrate = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (/^orders_\d{4}-\d{2}-\d{2}$/.test(key)) keysToMigrate.push(key);
      }
      for (const key of keysToMigrate) {
        const dateId = key.slice(7); // strip 'orders_' prefix
        const data = JSON.parse(localStorage.getItem(key));
        await setDoc(doc(db, 'orders', dateId), data);
        localStorage.removeItem(key);
      }

      // Clean up remaining localStorage keys
      localStorage.removeItem('menu');
      localStorage.removeItem('menuIdCounter');
      localStorage.removeItem('categories');
    } else {
      // ── Fresh install — seed defaults ──────────────────────────────────────
      await seedMenuIfNeeded();
      await seedCategoriesIfNeeded();
    }
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add index.html
  git commit -m "feat: add migrateOrSeed for localStorage-to-Firestore migration"
  ```

---

## Task 12: Rewire Startup + Remove Obsolete Code

**Files:**
- Modify: `index.html` — bottom of script block (~lines 1555–1561) and `// ─── LOCALSTORAGE HELPERS` sentinel lines

- [ ] **Step 1: Replace the startup sequence at the bottom of the script**

  Find and replace the current startup block (~lines 1555–1561):

  ```js
  loadOrders();
  seedMenuIfNeeded();
  seedCategoriesIfNeeded();
  initTabs();
  renderOrderPanel();
  renderTicketCards();
  ```

  Replace with:

  ```js
  // ─── STARTUP ──────────────────────────────────────────────────────────────────
  initFirebase();
  ```

- [ ] **Step 2: Verify `loadOrders` is fully removed**

  ```
  grep -n "loadOrders" index.html
  ```
  Expected: no output (the function was deleted in Task 7, and the call is now replaced).

- [ ] **Step 3: Verify all localStorage references are gone**

  ```
  grep -n "localStorage" index.html
  ```
  Expected: only the two lines inside `migrateOrSeed()` that read from localStorage during migration (the `localStorage.getItem('menu')`, `localStorage.getItem('menuIdCounter')`, etc.). No other references.

- [ ] **Step 4: Verify no stale `seedMenuIfNeeded` / `seedCategoriesIfNeeded` calls remain outside of `migrateOrSeed`**

  ```
  grep -n "seedMenuIfNeeded\|seedCategoriesIfNeeded" index.html
  ```
  Expected: only the definitions and the two calls inside `migrateOrSeed()`.

- [ ] **Step 5: Commit**

  ```bash
  git add index.html
  git commit -m "feat: rewire startup to initFirebase, remove obsolete localStorage calls"
  ```

---

## Task 13: Set Firestore Security Rules (Manual)

**Files:** None (Firebase console)

- [ ] **Step 1: Open Firestore rules**

  Firebase console → Firestore Database → Rules tab.

- [ ] **Step 2: Replace the default rules with these**

  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {

      // Password check document — any authenticated user (including anonymous) can read
      match /config/access {
        allow read: if request.auth != null;
        allow write: if false;
      }

      // All other data — any authenticated user can read and write
      match /config/{doc} {
        allow read, write: if request.auth != null;
      }

      match /orders/{date} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```

- [ ] **Step 3: Publish the rules**

  Click "Publish". The rules take effect within ~1 minute.

---

## Task 14: Deploy and Smoke Test

- [ ] **Step 1: Push to GitHub**

  ```bash
  git push origin main
  ```

  GitHub Pages re-deploys automatically. Wait ~1 minute, then open `https://yourusername.github.io/order-form-test`.

- [ ] **Step 2: Smoke test — password gate**

  - Open the URL in a fresh browser / incognito window.
  - Password modal should appear.
  - Enter wrong password → error message shown.
  - Enter correct password → modal dismisses, app loads.
  - Refresh page → modal should NOT appear again (sessionStorage retains auth).
  - Close tab → reopen URL → modal should appear again.

- [ ] **Step 3: Smoke test — real-time sync**

  - Open the app in **two separate browser windows** (or two devices on the same network).
  - Enter password on both.
  - In Window A: create a new order (add items, click Submit).
  - In Window B: the new order ticket should appear **without refreshing**.
  - In Window B: change the ticket status to "Preparing".
  - In Window A: the status change should appear immediately.

- [ ] **Step 4: Smoke test — menu sync**

  - In Window A, open Admin tab → add a new menu item.
  - In Window B, open the Orders tab → the new item should appear in the order form without refreshing.

- [ ] **Step 5: Smoke test — historical records**

  - Open Admin tab → Stored Records section.
  - Records from previous days (if any were migrated) should be listed.
  - Delete one record → it should disappear from the list.

- [ ] **Step 6: Smoke test — report tab**

  - Open Report tab → today's orders should display correctly.
  - Change the date range to a past day that has orders → "Loading…" should flash briefly, then orders appear.

- [ ] **Step 7: Smoke test — migration (only if you had existing localStorage data)**

  - On the device that had data before the update, open the app.
  - All previous menu items, categories, and order history should appear.
  - Open DevTools → Application → Local Storage → the `menu`, `menuIdCounter`, `categories`, and `orders_*` keys should be gone (migrated and cleaned up).

- [ ] **Step 8: Final commit (if any fixes were needed)**

  ```bash
  git add index.html
  git commit -m "fix: post-deploy smoke test corrections"
  git push origin main
  ```
