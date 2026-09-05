/**
 * ibu-gas.js - Modul Usaha Ibu: Penjualan Gas LPG & Buku Hutang / Piutang Tempo
 * Supplier: Bu Yanto & Mas Aan
 * Kontrol Stok Tabung & Manajemen Piutang/Tempo Lengkap
 */

const GAS_STORAGE_KEY = "usaha_ibu_gas_inventory";
const GAS_SALES_KEY = "usaha_ibu_gas_sales";
const GAS_BON_KEY = "usaha_ibu_gas_bon_pelanggan";
const IBU_TEMPO_KEY = "usaha_ibu_tempo_records";

// Data Awal Stok Tabung Gas (Stok Awal Bersih untuk Go-Live)
const DEFAULT_GAS_INVENTORY = {
  tabungIsi: 0,     // Siap dijual
  tabungKosong: 0,  // Siap ditukar ke Bu Yanto / Mas Aan
  tabungDipinjam: 0, // Dititip / dipinjam pelanggan
  hargaModalDefault: 18500,
  hargaJualDefault: 22000,
  suppliers: [
    { id: "bu_yanto", name: "Bu Yanto", phone: "", address: "Pangkalan Bu Yanto" },
    { id: "mas_aan", name: "Mas Aan", phone: "", address: "Agen Mas Aan" }
  ]
};

// Dapatkan status stok gas
function getGasInventory() {
  const saved = localStorage.getItem(GAS_STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return DEFAULT_GAS_INVENTORY;
}

function saveGasInventory(inv) {
  localStorage.setItem(GAS_STORAGE_KEY, JSON.stringify(inv));
  if (window.SyncModule && window.SyncModule.pushTransactionToSyncQueue) {
    window.SyncModule.pushTransactionToSyncQueue("sync_gas_inventory", { inventory: inv });
  }
}

// Catat Kulakan / Pengambilan Gas dari Bu Yanto / Mas Aan (Mendukung Backdate)
function recordGasRestock(supplierId, qty, modalPerTabung, isPaid = true, customDate = null) {
  const inv = getGasInventory();
  const supplier = inv.suppliers.find(s => s.id === supplierId) || { name: supplierId };
  const totalCost = Number(qty) * Number(modalPerTabung);
  const txDate = customDate ? customDate + "T12:00:00+07:00" : new Date().toISOString();

  // Update stok: tabung kosong berkurang, tabung isi bertambah
  inv.tabungKosong = Math.max(0, inv.tabungKosong - Number(qty));
  inv.tabungIsi += Number(qty);
  inv.hargaModalDefault = Number(modalPerTabung);
  saveGasInventory(inv);

  // Catat riwayat pembelian
  const salesHistory = getGasSales();
  salesHistory.unshift({
    id: "kulak_" + Date.now(),
    type: "restock",
    supplier: supplier.name,
    qty: Number(qty),
    modalPerTabung: Number(modalPerTabung),
    totalCost,
    isPaid,
    date: txDate
  });
  localStorage.setItem(GAS_SALES_KEY, JSON.stringify(salesHistory));

  // Catat transaksi pengeluaran modal ke Buku Kas Ibu jika tunai
  if (isPaid && window.AppModule && window.AppModule.addIbuTransaction) {
    window.AppModule.addIbuTransaction({
      type: "expense",
      unit: "gas",
      category: `Kulakan Gas (${supplier.name})`,
      amount: totalCost,
      note: `Kulakan ${qty} tabung gas @${modalPerTabung}`,
      date: txDate
    });
  } else if (!isPaid) {
    // Catat sebagai Hutang Usaha ke Supplier
    addTempoRecord({
      type: "supplier_debt",
      title: `Hutang Kulakan Gas (${supplier.name})`,
      amount: totalCost,
      date: txDate.split("T")[0],
      dueDate: "",
      customerName: supplier.name,
      note: `Belum bayar kulakan ${qty} tabung gas`
    });
  }

  return true;
}

// Catat Penjualan Gas Eceran (Mendukung Backdate & Tempo)
function recordGasSale(qty, hargaJual, customerName = "Pembeli Umum", isBon = false, customDate = null, tempoDueDate = "") {
  const inv = getGasInventory();
  const count = Number(qty);
  if (inv.tabungIsi < count) {
    alert("Peringatan: Stok tabung gas isi tidak mencukupi!");
    return false;
  }

  const hargaModal = inv.hargaModalDefault || 18500;
  const totalOmset = count * Number(hargaJual);
  const totalModal = count * hargaModal;
  const totalLaba = totalOmset - totalModal;
  const txDate = customDate ? customDate + "T12:00:00+07:00" : new Date().toISOString();
  const dateStr = customDate || new Date().toISOString().split("T")[0];

  // Update stok: tabung isi berkurang, tabung kosong bertambah
  inv.tabungIsi -= count;
  inv.tabungKosong += count;
  saveGasInventory(inv);

  // Jika pembeli nge-bon / tempo (hutang pelanggan)
  if (isBon) {
    addTempoRecord({
      type: "gas_bon",
      title: `Bon Gas (${customerName})`,
      amount: totalOmset,
      qty: count,
      date: dateStr,
      dueDate: tempoDueDate,
      customerName: customerName || "Tetangga",
      note: `Bon ${count} tabung gas eceran`
    });
  } else {
    // Catat transaksi omset dan laba ke Buku Kas Ibu
    if (window.AppModule && window.AppModule.addIbuTransaction) {
      window.AppModule.addIbuTransaction({
        type: "income",
        unit: "gas",
        category: "Penjualan Gas Eceran",
        amount: totalOmset,
        profit: totalLaba,
        note: `Jual ${count} tabung @${hargaJual} (Laba: Rp ${totalLaba.toLocaleString("id-ID")})`,
        date: txDate
      });
    }
  }

  return { totalOmset, totalLaba, count };
}

// Dapatkan riwayat transaksi gas
function getGasSales() {
  const saved = localStorage.getItem(GAS_SALES_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return [];
}

// ================= BUKU PIUTANG & TEMPO USAHA IBU =================
function getTempoRecords() {
  const saved = localStorage.getItem(IBU_TEMPO_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return [];
}

function saveTempoRecords(records) {
  localStorage.setItem(IBU_TEMPO_KEY, JSON.stringify(records));
  // Sinkronkan juga ke GAS_BON_KEY untuk kompatibilitas
  const gasBons = records.filter(r => r.type === "gas_bon");
  localStorage.setItem(GAS_BON_KEY, JSON.stringify(gasBons));
}

// Tambah Catatan Hutang / Piutang Tempo Baru
function addTempoRecord({ type = "gas_bon", title, amount, qty = 1, date = null, dueDate = "", customerName = "", contactPhone = "", note = "" }) {
  const records = getTempoRecords();
  const newRecord = {
    id: "tempo_" + Date.now(),
    type,
    title: title || `Piutang ${customerName}`,
    customerName: customerName || "Pelanggan",
    contactPhone: contactPhone || "",
    qty: Number(qty) || 1,
    amount: Number(amount) || 0,
    date: date || (window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0]),
    dueDate: dueDate || "",
    isLunas: false,
    note: note || ""
  };
  records.unshift(newRecord);
  saveTempoRecords(records);

  // Sinkronkan ke Google Spreadsheet
  if (window.SyncModule && window.SyncModule.pushTransactionToSyncQueue) {
    window.SyncModule.pushTransactionToSyncQueue("add_ibu_tempo", newRecord);
  }

  return newRecord;
}

// Lunasi Catatan Hutang / Piutang Tempo (Mendukung Backdate Pelunasan)
function payTempoRecord(tempoId, payDate = null) {
  const records = getTempoRecords();
  const item = records.find(r => r.id === tempoId);
  if (!item) return false;

  const settledDate = payDate || (window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0]);
  item.isLunas = true;
  item.settledDate = settledDate;
  saveTempoRecords(records);

  // Catat otomatis ke Kas Usaha Ibu
  const actualDate = payDate ? payDate + "T12:00:00+07:00" : new Date().toISOString();
  if (window.AppModule && window.AppModule.addIbuTransaction) {
    if (item.type === "supplier_debt") {
      // Pembayaran hutang kulakan = Pengeluaran
      window.AppModule.addIbuTransaction({
        type: "expense",
        unit: "gas",
        category: "Pelunasan Hutang Supplier",
        amount: item.amount,
        note: `Pelunasan hutang kulakan ke ${item.customerName}`,
        date: actualDate
      });
    } else {
      // Pelunasan piutang bon/sewa = Pemasukan
      window.AppModule.addIbuTransaction({
        type: "income",
        unit: item.type === "kost_rent" ? "kost" : "gas",
        category: item.type === "kost_rent" ? "Pelunasan Tempo Sewa Kost" : "Pelunasan Bon Gas",
        amount: item.amount,
        note: `Pelunasan oleh ${item.customerName || item.title}`,
        date: actualDate
      });
    }
  }

  // Sinkronkan ke Google Spreadsheet
  if (window.SyncModule && window.SyncModule.pushTransactionToSyncQueue) {
    window.SyncModule.pushTransactionToSyncQueue("pay_ibu_tempo", { id: tempoId, payDate: settledDate });
  }

  return true;
}

// Hapus Catatan Tempo
function deleteTempoRecord(tempoId) {
  let records = getTempoRecords();
  records = records.filter(r => r.id !== tempoId);
  saveTempoRecords(records);

  // Sinkronkan ke Google Spreadsheet
  if (window.SyncModule && window.SyncModule.pushTransactionToSyncQueue) {
    window.SyncModule.pushTransactionToSyncQueue("delete_ibu_tempo", { id: tempoId });
  }

  return true;
}

// Backward compatibility wrappers for older callers
function getGasBonList() {
  return getTempoRecords().filter(r => r.type === "gas_bon");
}

function payGasBon(bonId) {
  return payTempoRecord(bonId);
}

function addGasBon(customerName, qty, amount) {
  return addTempoRecord({
    type: "gas_bon",
    title: `Bon Gas (${customerName})`,
    customerName,
    qty,
    amount
  });
}

window.IbuGasModule = {
  getGasInventory,
  saveGasInventory,
  recordGasRestock,
  recordGasSale,
  getGasSales,
  getGasBonList,
  payGasBon,
  addGasBon,
  getTempoRecords,
  saveTempoRecords,
  addTempoRecord,
  payTempoRecord,
  deleteTempoRecord
};
