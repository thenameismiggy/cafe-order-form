import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js';
import { getFirestore, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

// Named app instance — does not conflict with the default app in index.html
const _app = initializeApp(firebaseConfig, 'inventory');
const db   = getFirestore(_app);
const auth = getAuth(_app);

// ─── SHARED STATE ─────────────────────────────────────────────────────────────
// Keyed by menuItemId (as string). Read by index.html for rendering.
window.inventoryState = {};

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function initInventory() {
  await signInAnonymously(auth);
  onSnapshot(collection(db, 'inventory'), snap => {
    const state = {};
    snap.forEach(d => { state[d.id] = { ...d.data(), menuItemId: d.id }; });
    window.inventoryState = state;
    if (typeof window.renderInventoryTab === 'function')  window.renderInventoryTab();
    if (typeof window.renderLowStockBanner === 'function') window.renderLowStockBanner();
  });
}

// ─── STOCK DEDUCTION ──────────────────────────────────────────────────────────
async function deductStock(lineItems) {
  for (const lineItem of lineItems) {
    const inv = window.inventoryState[String(lineItem.itemId)];
    if (!inv) continue; // drink or unconfigured item — skip

    const toDeduct = lineItem.quantity * (inv.servingSize / inv.unitsPerPurchase);
    const newStock = Math.max(0, inv.currentStock - toDeduct);

    await setDoc(doc(db, 'inventory', String(lineItem.itemId)), { currentStock: newStock }, { merge: true });

    if (newStock <= 0 && typeof window.setMenuItemAvailable === 'function') {
      window.setMenuItemAvailable(lineItem.itemId, false);
    }
  }
}

// ─── STOCK RESTORATION ────────────────────────────────────────────────────────
async function restoreStock(lineItems) {
  // Implemented in Task 13
}

// ─── SAVE INVENTORY CONFIG ────────────────────────────────────────────────────
// merge=false → full setDoc (new config); merge=true → partial update (edit)
async function saveInventoryConfig(itemId, data, merge = false) {
  await setDoc(doc(db, 'inventory', String(itemId)), data, merge ? { merge: true } : undefined);
}

// ─── SAVE RESTOCK ─────────────────────────────────────────────────────────────
async function saveRestock(itemId, unitsAdded, note) {
  const inv = window.inventoryState[String(itemId)];
  if (!inv) return;
  const newStock = inv.currentStock + unitsAdded;
  await setDoc(doc(db, 'inventory', String(itemId)), { currentStock: newStock }, { merge: true });
  await addDoc(collection(db, 'inventory', String(itemId), 'restockLog'), {
    timestamp: serverTimestamp(),
    purchaseUnitsAdded: unitsAdded,
    note: note || '',
  });
}

// ─── DELETE INVENTORY CONFIG ──────────────────────────────────────────────────
async function deleteInventoryConfig(itemId) {
  const logSnap = await getDocs(collection(db, 'inventory', String(itemId), 'restockLog'));
  const deletes = [];
  logSnap.forEach(d => deletes.push(deleteDoc(d.ref)));
  await Promise.all(deletes);
  await deleteDoc(doc(db, 'inventory', String(itemId)));
}

// ─── EXPOSE TO index.html ─────────────────────────────────────────────────────
window.initInventory        = initInventory;
window.deductStock          = deductStock;
window.restoreStock         = restoreStock;
window.saveInventoryConfig  = saveInventoryConfig;
window.saveRestock          = saveRestock;
window.deleteInventoryConfig = deleteInventoryConfig;
