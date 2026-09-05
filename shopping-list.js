/**
 * shopping-list.js - Modul Daftar Belanja Pasar & Dapur (Interactive Shopping List)
 */

const SHOPPING_STORAGE_KEY = "keuangan_keluarga_shopping_items";

const DEFAULT_SHOPPING_ITEMS = [];

function getShoppingItems() {
  const saved = localStorage.getItem(SHOPPING_STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return DEFAULT_SHOPPING_ITEMS;
}

function saveShoppingItems(items) {
  localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(items));
}

function addShoppingItem(name, estimatedCost = 0, category = "Dapur") {
  const items = getShoppingItems();
  items.unshift({
    id: "sp_" + Date.now(),
    name,
    estimatedCost: Number(estimatedCost) || 0,
    isChecked: false,
    category
  });
  saveShoppingItems(items);
}

function toggleShoppingItem(id) {
  const items = getShoppingItems();
  const item = items.find(i => i.id === id);
  if (item) {
    item.isChecked = !item.isChecked;
    saveShoppingItems(items);
  }
}

function deleteShoppingItem(id) {
  let items = getShoppingItems();
  items = items.filter(i => i.id !== id);
  saveShoppingItems(items);
}

function updateShoppingItem(id, updated) {
  const items = getShoppingItems();
  const idx = items.findIndex(i => i.id === id);
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...updated };
    saveShoppingItems(items);
    return items[idx];
  }
  return null;
}

// Convert barang yang sudah dicentang menjadi transaksi pengeluaran pasar
function convertCheckedToExpense(wallet = "Kas Dapur (Istri)") {
  const items = getShoppingItems();
  const checked = items.filter(i => i.isChecked);
  if (checked.length === 0) return 0;

  const totalCost = checked.reduce((sum, i) => sum + Number(i.estimatedCost), 0);
  const names = checked.map(i => i.name).join(", ");

  if (window.AppModule && window.AppModule.addTransaction) {
    window.AppModule.addTransaction({
      type: "expense",
      category: "Kebutuhan Mingguan Dapur & Rumah",
      subCategory: "Belanja Pasar & Sayur Mayur",
      amount: totalCost,
      wallet: wallet,
      note: `Belanja dapur: ${names}`,
      date: window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0]
    });
  }

  // Hapus barang yang sudah dikonversi
  const remaining = items.filter(i => !i.isChecked);
  saveShoppingItems(remaining);

  return totalCost;
}

window.ShoppingListModule = {
  getShoppingItems,
  saveShoppingItems,
  addShoppingItem,
  updateShoppingItem,
  toggleShoppingItem,
  deleteShoppingItem,
  convertCheckedToExpense
};
