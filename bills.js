/**
 * bills.js - Modul Checklist Tagihan Rutin Bulanan (Bill Tracker 1-Klik)
 */

const BILLS_STORAGE_KEY = "keuangan_keluarga_monthly_bills";

const DEFAULT_MONTHLY_BILLS = [];

function getMonthlyBills() {
  const saved = localStorage.getItem(BILLS_STORAGE_KEY);
  if (saved !== null) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return DEFAULT_MONTHLY_BILLS;
}

function saveMonthlyBills(bills) {
  localStorage.setItem(BILLS_STORAGE_KEY, JSON.stringify(bills));
  if (window.SyncModule && window.SyncModule.pushTransactionToSyncQueue) {
    window.SyncModule.pushTransactionToSyncQueue("sync_bills", { bills });
  }
}

// Bayar tagihan 1-klik
function payBill(billId, actualAmount = null, wallet = null) {
  const bills = getMonthlyBills();
  const bill = bills.find(b => b.id === billId);
  if (!bill) return false;

  const cost = actualAmount || bill.estimatedCost;
  const payWallet = wallet || bill.defaultWallet || "BCA";

  bill.status = "paid";
  saveMonthlyBills(bills);

  // Catat transaksi pengeluaran
  if (window.AppModule && window.AppModule.addTransaction) {
    window.AppModule.addTransaction({
      type: "expense",
      category: "Tagihan Rutin Bulanan",
      subCategory: bill.name,
      amount: cost,
      wallet: payWallet,
      note: `Pelunasan tagihan ${bill.name} bulan ini`,
      date: window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0]
    });
  }

  return bill;
}

// Update tagihan rutin
function updateMonthlyBill(billId, updated) {
  const bills = getMonthlyBills();
  const idx = bills.findIndex(b => b.id === billId);
  if (idx !== -1) {
    bills[idx] = { ...bills[idx], ...updated };
    saveMonthlyBills(bills);
    return bills[idx];
  }
  return null;
}

// Hapus tagihan rutin
function deleteMonthlyBill(billId) {
  let bills = getMonthlyBills();
  bills = bills.filter(b => b.id !== billId);
  saveMonthlyBills(bills);
  return true;
}

// Reset status tagihan awal bulan
function resetMonthlyBillsForNewMonth() {
  const bills = getMonthlyBills();
  bills.forEach(b => { b.status = "unpaid"; });
  saveMonthlyBills(bills);
}

window.BillsModule = {
  getMonthlyBills,
  saveMonthlyBills,
  updateMonthlyBill,
  deleteMonthlyBill,
  payBill,
  resetMonthlyBillsForNewMonth
};
