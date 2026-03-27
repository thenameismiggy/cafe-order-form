# Code Quality Improvements — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Four code quality changes — user-configurable categories (admin UI + storage), `getMenu()` cache, `editingRowId` into `appState`, and event binding via delegation.

**Architecture:** All changes are in `index.html` (single-file app). Changes are applied in dependency order: caching first (Change 2), then state cleanup (Change 3), then delegation (Change 4), then the categories feature (Change 1) which depends on the working cache.

**Tech Stack:** Vanilla JS, HTML, CSS — no build system, no test framework. Verification is browser-based (open `index.html` in a browser, use DevTools console).

---

## File Map

| File | Changes |
|------|---------|
| `index.html` | All changes — CSS additions (~30 lines), HTML additions (~10 lines), JS modifications and additions |

**Line references are to the current file at HEAD.** As you apply tasks in order, line numbers shift — use the anchor strings provided to locate edits, not raw line numbers.

---

## Task 1: Move `editingRowId` into `appState` (Change 3)

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add `editingRowId` to `appState`**

Find the `appState` object (search for `const appState = {`). Add `editingRowId: null` as the last property:

```js
const appState = {
  tickets: [],
  nextOrderNum: 1,
  nextTicketId: 1,
  panelTicketId: null,
  panelQtys: {},
  panelOpen: false,
  editingRowId: null,
};
```

- [ ] **Step 2: Remove the standalone variable**

Find and delete the line:
```js
let editingRowId = null; // id of menu item currently being inline-edited
```

- [ ] **Step 3: Update all references**

Replace every bare `editingRowId` with `appState.editingRowId`. There are exactly 5 occurrences (in `renderMenuRow`, `startEditRow`, `cancelEditRow`, `saveEditRow`, `deleteMenuItem`). Use find-and-replace for `editingRowId` → `appState.editingRowId` (the standalone declaration was already deleted so there's no risk of double-replacement).

- [ ] **Step 4: Verify in browser**

Open `index.html` → Admin tab → edit a menu item → save/cancel. Confirm editing works correctly. Open console, run `appState.editingRowId` — confirm it's `null` when not editing, and a number while editing.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "refactor: move editingRowId into appState"
```

---

## Task 2: Add `getMenu()` Cache (Change 2)

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add the cache variable**

Immediately above `function getMenu()`, add:

```js
let _menuCache = null;
```

- [ ] **Step 2: Update `getMenu()` to use the cache**

Replace the existing `getMenu()` body:

```js
// BEFORE:
function getMenu() {
  return JSON.parse(localStorage.getItem('menu') || 'null');
}
```

With:

```js
// AFTER:
function getMenu() {
  if (_menuCache !== null) return _menuCache;
  _menuCache = JSON.parse(localStorage.getItem('menu') || 'null');
  return _menuCache;
}
```

- [ ] **Step 3: Update `saveMenu()` to invalidate the cache**

Replace the existing `saveMenu()` body:

```js
// BEFORE:
function saveMenu(menu) {
  localStorage.setItem('menu', JSON.stringify(menu));
}
```

With:

```js
// AFTER:
function saveMenu(menu) {
  _menuCache = null;
  localStorage.setItem('menu', JSON.stringify(menu));
}
```

- [ ] **Step 4: Verify in browser**

Open `index.html` → Admin tab → add a new menu item → confirm it appears immediately. Edit and save a menu item → confirm the change shows. Open console:

```js
// Should return the cached menu after first access
getMenu() === getMenu()  // should be true (same reference)
saveMenu(getMenu());     // invalidates
getMenu() === getMenu()  // true again after re-population
```

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "perf: cache getMenu() result, invalidate on saveMenu()"
```

---

## Task 3: Event Delegation for `#ticket-cards` (Change 4, part 1)

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Remove per-render listeners from `renderTicketCards()`**

Inside `renderTicketCards()`, find and remove the two event-binding blocks that appear after `container.innerHTML = ...`:

```js
// REMOVE THIS BLOCK:
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
```

Keep the `renderDraftBanner();` call at the end of `renderTicketCards()`.

- [ ] **Step 2: Add delegated listeners on `#ticket-cards`**

Find the `// ─── NEW ORDER BUTTON` section. Immediately before it, add:

```js
// ─── TICKET CARDS DELEGATION ─────────────────────────────────────────────────
document.getElementById('ticket-cards').addEventListener('click', e => {
  if (e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') return;
  const card = e.target.closest('.ticket-card:not(.served)');
  if (!card) return;
  openTicketInPanel(parseInt(card.dataset.ticketId, 10));
});

document.getElementById('ticket-cards').addEventListener('change', e => {
  const sel = e.target.closest('.status-select');
  if (!sel) return;
  updateTicketStatus(parseInt(sel.dataset.ticketId, 10), sel.value);
});
```

- [ ] **Step 3: Verify in browser**

Open `index.html` → create two orders → click a ticket card (confirm it opens in panel) → change the status dropdown on a ticket card (confirm status updates) → confirm the served card becomes faded and non-clickable.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "refactor: use event delegation on #ticket-cards"
```

---

## Task 4: Event Delegation for `#menu-table` (Change 4, part 2)

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Remove per-render listeners from `renderMenuTable()`**

Inside `renderMenuTable()`, find and remove the re-attach block at the end of the function (before the closing `}`):

```js
// REMOVE THIS BLOCK:
  // re-attach edit/delete handlers
  container.querySelectorAll('[data-action]').forEach(el => {
    el.addEventListener('click', handleMenuAction);
  });
```

- [ ] **Step 2: Add delegated listener on `#menu-table`**

Find the `// ─── ADMIN: ADD ITEM FORM` section. Immediately before it, add:

```js
// ─── MENU TABLE DELEGATION ───────────────────────────────────────────────────
document.getElementById('menu-table').addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = parseInt(btn.dataset.id, 10);
  if (action === 'edit')             startEditRow(id);
  else if (action === 'cancel-edit') cancelEditRow();
  else if (action === 'save-edit')   saveEditRow(id);
  else if (action === 'delete')      deleteMenuItem(id);
});
```

- [ ] **Step 3: Verify in browser**

Open `index.html` → Admin tab → edit a menu item (confirm inline edit appears) → save (confirm saved) → delete a menu item (confirm confirm dialog, then item removed).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "refactor: use event delegation on #menu-table"
```

---

## Task 5: Categories Storage Layer (Change 1, part 1)

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add `getCategories()`, `saveCategories()`, `seedCategoriesIfNeeded()`**

Find the `// ─── DEFAULT MENU` section. Immediately before it (after `saveIdCounter` and `nextMenuId`), add:

```js
// ─── CATEGORIES ───────────────────────────────────────────────────────────────
function getCategories() {
  try {
    const raw = localStorage.getItem('categories');
    if (raw === null) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function saveCategories(arr) {
  localStorage.setItem('categories', JSON.stringify(arr));
}
function seedCategoriesIfNeeded() {
  if (localStorage.getItem('categories') === null) {
    saveCategories(['Drinks', 'Food']);
  }
}
```

- [ ] **Step 2: Call `seedCategoriesIfNeeded()` on init**

Find the `// ─── INITIAL RENDER` section at the bottom of the script. Add the seed call alongside `seedMenuIfNeeded()`:

```js
// BEFORE:
seedMenuIfNeeded();
initTabs();
renderOrderPanel();
renderTicketCards();

// AFTER:
seedMenuIfNeeded();
seedCategoriesIfNeeded();
initTabs();
renderOrderPanel();
renderTicketCards();
```

- [ ] **Step 3: Verify in browser**

Open `index.html`, open DevTools → Application → Local Storage. Confirm `categories` key is present with value `["Drinks","Food"]` after page load. In console:

```js
getCategories()        // ["Drinks", "Food"]
saveCategories(['A', 'B']);
getCategories()        // ["A", "B"]
// Reset:
localStorage.removeItem('categories');
location.reload();     // categories key re-seeded to ["Drinks","Food"]
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add getCategories/saveCategories/seedCategoriesIfNeeded"
```

---

## Task 6: Replace Hardcoded Category Arrays (Change 1, part 2)

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Update `renderMenuTable()`**

Find in `renderMenuTable()`:
```js
  const categories = ['Drinks', 'Food'];
```
Replace with:
```js
  const categories = getCategories();
```

- [ ] **Step 2: Update `renderMenuRow()` category select options**

Find the inline edit category select options inside `renderMenuRow()`:
```js
            <option value="Drinks" ${item.category === 'Drinks' ? 'selected' : ''}>Drinks</option>
            <option value="Food"   ${item.category === 'Food'   ? 'selected' : ''}>Food</option>
```
Replace with:
```js
            ${getCategories().map(cat => `<option value="${escHtml(cat)}" ${item.category === cat ? 'selected' : ''}>${escHtml(cat)}</option>`).join('')}
```

- [ ] **Step 3: Update `renderOrderPanel()`**

Find in `renderOrderPanel()`:
```js
  const categories = ['Drinks', 'Food'];
```
Replace with:
```js
  const categories = getCategories();
```

- [ ] **Step 4: Update `renderReportTab()`**

Find in `renderReportTab()`:
```js
  const categories = ['Drinks', 'Food'];
```
Replace with:
```js
  const categories = getCategories();
```

- [ ] **Step 5: Update the Add Item form's category `<select>` in HTML**

Find in the HTML (inside `<div id="admin-tab">`):
```html
            <select id="new-category">
              <option value="Drinks">Drinks</option>
              <option value="Food">Food</option>
            </select>
```
Replace with:
```html
            <select id="new-category">
            </select>
```

Then, at the **top of `renderMenuTable()`** (before the `menu.length === 0` guard), add:

```js
  // Populate the Add Item category select from live categories
  const catSel = document.getElementById('new-category');
  const liveCats = getCategories();
  catSel.innerHTML = liveCats.map(cat => `<option value="${escHtml(cat)}">${escHtml(cat)}</option>`).join('');
```

- [ ] **Step 6: Verify in browser**

Open `index.html` → Admin tab → confirm the Add Item form "Category" dropdown shows Drinks and Food. Order panel: confirm Drinks and Food sections appear. Report tab: confirm category grouping works. Edit a menu item → confirm category dropdown populates correctly.

- [ ] **Step 7: Commit**

```bash
git add index.html
git commit -m "refactor: replace hardcoded category arrays with getCategories()"
```

---

## Task 7: Category Management CSS and HTML (Change 1, part 3)

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add CSS for category management section**

Find the `/* === ADMIN TAB === */` CSS section. After the existing admin tab styles (after the `.td-actions` rule), add:

```css
    /* === CATEGORY MANAGEMENT === */
    .category-mgmt { background: #fff; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.5rem; }
    .category-mgmt h3 { font-size: 0.9rem; font-weight: 700; margin-bottom: 0.85rem; color: #555; text-transform: uppercase; letter-spacing: 0.05em; }
    .category-list { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.85rem; }
    .category-row { display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0; border-bottom: 1px solid #f5f5f5; }
    .category-row:last-child { border-bottom: none; }
    .cat-name { flex: 1; font-size: 0.9rem; cursor: pointer; padding: 0.2rem 0.3rem; border-radius: 3px; }
    .cat-name:hover { background: #f5f5f5; }
    .cat-edit-input { flex: 1; padding: 0.25rem 0.4rem; border: 1px solid #bbb; border-radius: 4px; font-size: 0.88rem; }
    .cat-row-actions { display: flex; gap: 0.3rem; flex-shrink: 0; }
    .cat-add-row { display: flex; gap: 0.5rem; align-items: center; }
    .cat-add-row input { padding: 0.45rem 0.65rem; border: 1px solid #ddd; border-radius: 4px; font-size: 0.88rem; flex: 1; }
    .cat-add-row input:focus { outline: 2px solid #1a1a2e; border-color: transparent; }
```

- [ ] **Step 2: Add the category management container in HTML**

Find the admin tab section:
```html
  <!-- ADMIN TAB -->
  <div id="admin-tab" class="tab-panel">
    <h2>Menu Management</h2>

    <div class="add-item-form">
```

Insert a container for category management between the `<h2>` and the add-item-form:
```html
  <!-- ADMIN TAB -->
  <div id="admin-tab" class="tab-panel">
    <h2>Menu Management</h2>

    <div id="category-management"><!-- rendered by JS --></div>

    <div class="add-item-form">
```

- [ ] **Step 3: Verify HTML renders without errors**

Open `index.html` → Admin tab → confirm no console errors. The `#category-management` div will be empty until `renderCategorySection()` is wired in Task 8.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add CSS and HTML container for category management section"
```

---

## Task 8: Category Management Render and Handlers (Change 1, part 4)

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add `editingCategoryIndex` to `appState`**

In the `appState` object, add:

```js
const appState = {
  tickets: [],
  nextOrderNum: 1,
  nextTicketId: 1,
  panelTicketId: null,
  panelQtys: {},
  panelOpen: false,
  editingRowId: null,
  editingCategoryIndex: null,
};
```

- [ ] **Step 2: Add `renderCategorySection()` function**

Find the `// ─── ADMIN: RENDER MENU TABLE` section. Immediately before it, add:

```js
// ─── ADMIN: CATEGORY MANAGEMENT ──────────────────────────────────────────────
function renderCategorySection() {
  const cats = getCategories();
  const container = document.getElementById('category-management');

  const rowsHtml = cats.map((cat, i) => {
    const isEditing = appState.editingCategoryIndex === i;
    const upDisabled  = i === 0             ? 'disabled' : '';
    const downDisabled = i === cats.length - 1 ? 'disabled' : '';
    const delDisabled  = cats.length === 1  ? 'disabled' : '';
    const nameCell = isEditing
      ? `<input type="text" class="cat-edit-input" value="${escHtml(cat)}" data-original="${escHtml(cat)}" data-index="${i}">`
      : `<span class="cat-name" data-cat-action="start-edit" data-index="${i}">${escHtml(cat)}</span>`;
    return `
      <div class="category-row" data-index="${i}">
        ${nameCell}
        <div class="cat-row-actions">
          <button class="btn btn-sm btn-ghost" data-cat-action="up"     data-index="${i}" ${upDisabled}>↑</button>
          <button class="btn btn-sm btn-ghost" data-cat-action="down"   data-index="${i}" ${downDisabled}>↓</button>
          <button class="btn btn-sm btn-danger" data-cat-action="delete" data-index="${i}" ${delDisabled}>Delete</button>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="category-mgmt">
      <h3>Categories</h3>
      <div class="category-list">${rowsHtml}</div>
      <div class="cat-add-row">
        <input type="text" id="new-category-name" placeholder="Category name" maxlength="50">
        <button class="btn btn-sm btn-primary" id="btn-add-category">Add Category</button>
      </div>
      <p id="cat-error" class="form-error"></p>
    </div>`;

  // Delegation on category list for click actions
  container.querySelector('.category-list').addEventListener('click', e => {
    const el = e.target.closest('[data-cat-action]');
    if (!el) return;
    const action = el.dataset.catAction;
    const idx    = parseInt(el.dataset.index, 10);
    if (action === 'start-edit') {
      appState.editingCategoryIndex = idx;
      renderCategorySection();
    } else if (action === 'up') {
      moveCategoryUp(idx);
    } else if (action === 'down') {
      moveCategoryDown(idx);
    } else if (action === 'delete') {
      deleteCategoryAt(idx);
    }
  });

  // Inline edit input events
  const editInput = container.querySelector('.cat-edit-input');
  if (editInput) {
    editInput.focus();
    editInput.select();
    editInput.addEventListener('blur',    () => commitCategoryRename(editInput));
    editInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') editInput.blur();
      if (e.key === 'Escape') {
        appState.editingCategoryIndex = null;
        renderCategorySection();
      }
    });
  }

  // Add category input/button events
  document.getElementById('new-category-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleAddCategory();
  });
  document.getElementById('btn-add-category').addEventListener('click', handleAddCategory);
}
```

- [ ] **Step 3: Add `moveCategoryUp()` and `moveCategoryDown()`**

After `renderCategorySection()`, add:

```js
function moveCategoryUp(idx) {
  const cats = getCategories();
  if (idx === 0) return;
  [cats[idx - 1], cats[idx]] = [cats[idx], cats[idx - 1]];
  saveCategories(cats);
  renderCategorySection();
}

function moveCategoryDown(idx) {
  const cats = getCategories();
  if (idx === cats.length - 1) return;
  [cats[idx], cats[idx + 1]] = [cats[idx + 1], cats[idx]];
  saveCategories(cats);
  renderCategorySection();
}
```

- [ ] **Step 4: Add `commitCategoryRename()`**

After the move functions, add:

```js
function commitCategoryRename(input) {
  const idx         = parseInt(input.dataset.index, 10);
  const originalName = input.dataset.original;
  const newName     = input.value.trim();

  appState.editingCategoryIndex = null;

  // No change
  if (newName === originalName) {
    renderCategorySection();
    return;
  }

  // Validation
  const cats = getCategories();
  if (!newName) {
    renderCategorySection();
    return;
  }
  const duplicate = cats.some((c, i) => i !== idx && c.toLowerCase() === newName.toLowerCase());
  if (duplicate) {
    renderCategorySection();
    return;
  }

  // Update menu items that reference the old name
  const menu = getMenu() || [];
  menu.forEach(item => {
    if (item.category === originalName) item.category = newName;
  });
  saveMenu(menu);

  // Update categories
  cats[idx] = newName;
  saveCategories(cats);

  renderCategorySection();
  renderMenuTable();
  renderOrderPanel();
}
```

- [ ] **Step 5: Add `deleteCategoryAt()`**

After `commitCategoryRename()`, add:

```js
function deleteCategoryAt(idx) {
  const cats = getCategories();
  if (cats.length === 1) return; // guard: never delete last category

  const catName = cats[idx];
  const menu    = getMenu() || [];
  const affected = menu.filter(i => i.category === catName).length;

  if (affected > 0) {
    const ok = confirm(
      `This category has ${affected} item(s). They will not appear in the order panel until reassigned to another category. Delete anyway?`
    );
    if (!ok) return;
  }

  cats.splice(idx, 1);
  saveCategories(cats);
  renderCategorySection();
  renderMenuTable();
  renderOrderPanel();
}
```

- [ ] **Step 6: Add `handleAddCategory()`**

After `deleteCategoryAt()`, add:

```js
function handleAddCategory() {
  const input   = document.getElementById('new-category-name');
  const errorEl = document.getElementById('cat-error');
  const name    = input.value.trim();

  errorEl.textContent = '';

  if (!name) {
    errorEl.textContent = 'Category name is required.';
    return;
  }

  const cats = getCategories();
  if (cats.some(c => c.toLowerCase() === name.toLowerCase())) {
    errorEl.textContent = 'A category with that name already exists.';
    return;
  }

  cats.push(name);
  saveCategories(cats);
  input.value = '';
  renderCategorySection();
  renderMenuTable(); // update the add-item category select
}
```

- [ ] **Step 7: Wire `renderCategorySection()` into the admin tab**

Find the `renderMenuTable()` function and add a call to `renderCategorySection()` at the top of it, after the `catSel` block (which was added in Task 6):

```js
function renderMenuTable() {
  // Populate the Add Item category select from live categories
  const catSel = document.getElementById('new-category');
  const liveCats = getCategories();
  catSel.innerHTML = liveCats.map(cat => `<option value="${escHtml(cat)}">${escHtml(cat)}</option>`).join('');

  renderCategorySection();  // ← ADD THIS LINE

  const menu = getMenu() || [];
  // ... rest of function unchanged
```

- [ ] **Step 8: Verify full feature in browser**

Open `index.html` → Admin tab and run through each scenario:

**Add category:**
- Type "Snacks" → click Add → confirm "Snacks" row appears in the list
- Confirm "Snacks" appears in the Add Item form's category dropdown
- Try adding a duplicate name → confirm error message

**Rename category:**
- Click on "Drinks" name → confirm input appears, pre-filled
- Type "Beverages" → press Enter → confirm rename succeeded
- Go to Order panel → confirm "Beverages" section shows
- Add a menu item in "Beverages" → edit it → confirm category shows "Beverages"

**Rename validation:**
- Click a category → clear the name → blur → confirm reverts (no save)
- Click a category → type an existing category name (case-insensitive) → blur → confirm reverts

**Delete category:**
- Add a test item to "Snacks" → delete "Snacks" → confirm prompt appears with item count
- Cancel → confirm no change
- Confirm delete → confirm "Snacks" gone, item visible in Admin table (for reassignment), item absent from order panel
- With only one category remaining: confirm Delete button is disabled

**Reorder:**
- Click ↑ on "Food" → confirm "Food" is now first
- Click ↑ on the first row → confirm button is disabled (no effect)

- [ ] **Step 9: Commit**

```bash
git add index.html
git commit -m "feat: add category management UI with add/rename/delete/reorder"
```

---

## Done

All four spec changes are implemented. Run a final sanity check:

- [ ] Open `index.html`, create an order with items from multiple categories → submit → check report tab shows correct category groupings
- [ ] Rename a category → confirm order panel, admin table, and report tab all reflect the new name
- [ ] Reload page → confirm categories persist from localStorage

```bash
git log --oneline -8
```

Expected: 8 commits for this branch (Task 1–8 + the worktree setup commit).
