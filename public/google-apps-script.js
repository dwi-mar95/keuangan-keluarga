/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT (TURBO ULTRA-FAST ENTERPRISE ENGINE)
 * CATATAN KEUANGAN KELUARGA BABA PANGESTU & UMMA ATIN + USAHA IBU TERPISAH
 * ==============================================================================
 * URL Web App:
 * https://script.google.com/macros/s/AKfycbyB7_urRr_uBMeF6_n18p-ia1XwrRVgtiHmVs1gyV2NTU7OxTLAQXyQQNo_T5ETDdkH/exec
 * 
 * ==============================================================================
 * ⚠️ ATURAN KETAT GO-LIVE / PRODUCTION SCHEMA LOCK (DILARANG MERUSAK DATA REAL)
 * ==============================================================================
 * 1. STATUS GO-LIVE: AKTIF (DATA REAL PRODUCTION SEDANG BERJALAN).
 * 2. DILARANG KERAS MENAMBAH ATAU MERUBAH DATABASE / SHEET BARU!
 * 3. DILARANG KERAS MENYUNTIKKAN DATA DUMMY / CONTOH KE SHEET YANG SUDAH ADA!
 * 4. STRUKTUR 11 SHEET INI SUDAH FINAL & LOCKED:
 *    [1] Keluarga_Transaksi       [7] Pendidikan_Anak_Istri
 *    [2] Usaha_Ibu_Transaksi      [8] Bakti_Ortu_Kondangan
 *    [3] Usaha_Ibu_Kost           [9] Servis_Kendaraan
 *    [4] Usaha_Ibu_Gas           [10] Investasi_DanaDarurat
 *    [5] Usaha_Ibu_Tempo         [11] Celengan_Target_Impian
 *    [6] Tagihan_Rutin_Bulanan
 * ==============================================================================
 */

// KUNCI GO-LIVE: Mengunci skrip agar tidak membuat database/sheet baru
const PRODUCTION_GO_LIVE_LOCKED = true;

// Daftar Putih (Whitelist) 11 Sheet Resmi - Paten & Tidak Boleh Dirubah
const OFFICIAL_11_SHEETS_WHITELIST = [
  "Keluarga_Transaksi",
  "Usaha_Ibu_Transaksi",
  "Tagihan_Rutin_Bulanan",
  "Usaha_Ibu_Kost",
  "Usaha_Ibu_Gas",
  "Usaha_Ibu_Tempo",
  "Pendidikan_Anak_Istri",
  "Bakti_Ortu_Kondangan",
  "Servis_Kendaraan",
  "Investasi_DanaDarurat",
  "Celengan_Target_Impian"
];

const CACHE_KEY_ALL = "keuangan_keluarga_all_payload_v2";
const CACHE_TTL_SECONDS = 180; // Cache 3 menit (otomatis di-reset seketika jika ada transaksi baru)

// Memory cache objek sheet per request
let _activeSheetCache = {};

function getSheetSafe(ss, sheetName) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!sheetName) sheetName = "Keluarga_Transaksi";
  if (!_activeSheetCache[sheetName]) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = setupSingleSheet(ss, sheetName);
    }
    _activeSheetCache[sheetName] = sheet;
  }
  return _activeSheetCache[sheetName];
}

// Fungsi Tes Manual (Bisa dipilih jika ingin menguji tombol 'Run' di editor Google Apps Script)
function testRun() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log("✅ Google Spreadsheet Sukses Terhubung: " + ss.getName());
  Logger.log("✅ Engine Apps Script Siap Berjalan untuk Baba Pangestu & Umma Atin!");
  return "OK";
}

// ================= ENTRY POINT: GET (TARIK DATA DARI SPREADSHEET - HIGH SPEED) =================
function doGet(e) {
  try {
    const isForce = e && e.parameter && (e.parameter.force === "true" || e.parameter.nocache === "true");
    const action = e && e.parameter && e.parameter.action ? e.parameter.action : "fetch_all";

    // 1. Cek Server-Side Cache untuk respon instan < 250ms
    if (action === "fetch_all" && !isForce) {
      const scriptCache = CacheService.getScriptCache();
      const cachedPayload = scriptCache.get(CACHE_KEY_ALL);
      if (cachedPayload) {
        return ContentService.createTextOutput(cachedPayload)
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    _activeSheetCache = {}; // Reset cache memory request baru

    if (action === "fetch_all") {
      const payload = {
        status: "success",
        cached: false,
        timestamp: Utilities.formatDate(new Date(), "Asia/Jakarta", "dd/MM/yyyy HH:mm:ss"),
        keluarga_txs: getSheetDataAsJson(getSheetSafe(ss, "Keluarga_Transaksi")),
        ibu_txs: getSheetDataAsJson(getSheetSafe(ss, "Usaha_Ibu_Transaksi")),
        bills: getSheetDataAsJson(getSheetSafe(ss, "Tagihan_Rutin_Bulanan")),
        kost_rooms: getSheetDataAsJson(getSheetSafe(ss, "Usaha_Ibu_Kost")),
        gas_inventory: getSheetDataAsJson(getSheetSafe(ss, "Usaha_Ibu_Gas")),
        education: getSheetDataAsJson(getSheetSafe(ss, "Pendidikan_Anak_Istri")),
        parents: getSheetDataAsJson(getSheetSafe(ss, "Bakti_Ortu_Kondangan")),
        vehicles: getSheetDataAsJson(getSheetSafe(ss, "Servis_Kendaraan")),
        investments: getSheetDataAsJson(getSheetSafe(ss, "Investasi_DanaDarurat")),
        ibu_tempo: getSheetDataAsJson(getSheetSafe(ss, "Usaha_Ibu_Tempo")),
        goals: getSheetDataAsJson(getSheetSafe(ss, "Celengan_Target_Impian"))
      };

      const jsonString = JSON.stringify(payload);

      // Simpan ke Cache jika di bawah batas 100KB Apps Script CacheService
      if (jsonString.length < 98000) {
        try {
          const scriptCache = CacheService.getScriptCache();
          scriptCache.put(CACHE_KEY_ALL, jsonString, CACHE_TTL_SECONDS);
        } catch (ce) {
          // Abaikan jika payload melebihi limit cache
        }
      }

      return ContentService.createTextOutput(jsonString)
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "setup") {
      setupAllSheetsIfMissing(ss);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Seluruh 11 sheet berhasil diinisialisasi secara rapi!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Google Apps Script Turbo Engine Online & Ready for Baba Pangestu & Umma Atin"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ================= ENTRY POINT: POST (SIMPAN DATA DARI HP KE SPREADSHEET) =================
function doPost(e) {
  const lock = LockService.getScriptLock();
  // Kunci 6 detik untuk mencegah balapan konkurensi antar perangkat
  const lockSuccess = lock.tryLock(6000);

  try {
    const rawData = e.postData.contents;
    const data = JSON.parse(rawData);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    _activeSheetCache = {}; // Reset cache memory

    if (data.action === "batch_sync" && Array.isArray(data.items)) {
      data.items.forEach(item => {
        handleSingleSyncItem(ss, item);
      });
    } else if (data.action) {
      handleSingleSyncItem(ss, data);
    }

    // INVALIDASI CACHE SERVER-SIDE: Pastikan pembacaan berikutnya mendapat data paling segar
    try {
      const scriptCache = CacheService.getScriptCache();
      scriptCache.remove(CACHE_KEY_ALL);
    } catch (ce) { }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data berhasil diselaraskan ke Google Sheets (Turbo Sync)!"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    if (lockSuccess) {
      try { lock.releaseLock(); } catch (le) { }
    }
  }
}

// ================= DISPATCHER TINDAKAN SINKRONISASI =================
function handleSingleSyncItem(ss, item) {
  const action = item.action;
  const p = item.payload;
  if (!p) return;

  const tglObj = new Date(p.date || item.timestamp || new Date());
  // Gunakan format standar universal yyyy-MM-dd HH:mm:ss agar TIDAK PERNAH tertukar tanggal & bulan di locale spreadsheet manapun
  const formattedDateWIB = Utilities.formatDate(tglObj, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

  // 1. TAMBAH TRANSAKSI KELUARGA
  if (action === "add_keluarga_tx") {
    const sheet = getSheetSafe(ss, "Keluarga_Transaksi");
    sheet.appendRow([
      p.id,
      formattedDateWIB,
      p.type === "income" ? "Pemasukan" : (p.type === "transfer" ? "Pindah Saldo" : "Pengeluaran"),
      p.category || "-",
      p.subCategory || "-",
      Number(p.amount) || 0,
      p.wallet || "-",
      p.user === "istri" ? "Umma Atin" : (p.user === "suami" ? "Baba Pangestu" : "Keluarga"),
      p.note || "-"
    ]);
  }

  // 2. UPDATE TRANSAKSI KELUARGA (CRUD EDIT)
  else if (action === "update_keluarga_tx") {
    const sheet = getSheetSafe(ss, "Keluarga_Transaksi");
    const data = sheet.getDataRange().getValues();
    for (let r = 1; r < data.length; r++) {
      if (String(data[r][0]) === String(p.id)) {
        sheet.getRange(r + 1, 2).setValue(formattedDateWIB);
        sheet.getRange(r + 1, 3).setValue(p.type === "income" ? "Pemasukan" : "Pengeluaran");
        sheet.getRange(r + 1, 4).setValue(p.category || "-");
        sheet.getRange(r + 1, 5).setValue(p.subCategory || "-");
        sheet.getRange(r + 1, 6).setValue(Number(p.amount) || 0);
        sheet.getRange(r + 1, 7).setValue(p.wallet || "-");
        sheet.getRange(r + 1, 8).setValue(p.user === "istri" ? "Umma Atin" : "Baba Pangestu");
        sheet.getRange(r + 1, 9).setValue(p.note || "-");
        break;
      }
    }
  }

  // 3. HAPUS TRANSAKSI KELUARGA (CRUD DELETE)
  else if (action === "delete_keluarga_tx") {
    const sheet = getSheetSafe(ss, "Keluarga_Transaksi");
    const data = sheet.getDataRange().getValues();
    for (let r = 1; r < data.length; r++) {
      if (String(data[r][0]) === String(p.id)) {
        sheet.deleteRow(r + 1);
        break;
      }
    }
  }

  // 4. PINDAH SALDO ANTAR DOMPET (TRANSFER)
  else if (action === "transfer_wallets") {
    const sheet = getSheetSafe(ss, "Keluarga_Transaksi");
    sheet.appendRow([
      "trf_" + Date.now(),
      formattedDateWIB,
      "Pindah Saldo",
      "Mutasi Antar Dompet",
      (p.from || "Dompet") + " ➔ " + (p.to || "Dompet"),
      Number(p.amount) || 0,
      p.from || "-",
      "Keluarga",
      p.note || ("Pindah saldo dari " + p.from + " ke " + p.to)
    ]);
  }

  // 5. TRANSAKSI USAHA IBU
  else if (action === "add_ibu_tx") {
    const sheet = getSheetSafe(ss, "Usaha_Ibu_Transaksi");
    sheet.appendRow([
      p.id,
      formattedDateWIB,
      p.unit === "kost" ? "Kost-Kostan" : "Gas LPG Eceran",
      p.type === "income" ? "Pemasukan" : "Pengeluaran",
      p.category || "-",
      Number(p.amount) || 0,
      Number(p.profit) || 0,
      p.note || "-"
    ]);
  }

  // 5b. HAPUS TRANSAKSI USAHA IBU (CRUD DELETE)
  else if (action === "delete_ibu_tx") {
    const sheet = getSheetSafe(ss, "Usaha_Ibu_Transaksi");
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      for (let r = 1; r < data.length; r++) {
        if (String(data[r][0]) === String(p.id)) {
          sheet.deleteRow(r + 1);
          break;
        }
      }
    }
  }

  // 6. TRANSAKSI TEMPO & BON USAHA IBU
  else if (action === "add_ibu_tempo") {
    const sheet = getSheetSafe(ss, "Usaha_Ibu_Tempo");
    if (sheet) {
      sheet.appendRow([
        p.id || ("tempo_" + Date.now()),
        formattedDateWIB,
        p.type === "gas_bon" ? "Bon Gas Tetangga" : (p.type === "kost_rent" ? "Sisa Sewa Kost" : "Hutang Supplier Gas"),
        p.customerName || p.title || "-",
        Number(p.amount) || 0,
        p.dueDate || "-",
        p.isLunas ? "Lunas" : "Belum Lunas",
        p.payDate || "-"
      ]);
    }
  }

  // 7. PELUNASAN TEMPO USAHA IBU
  else if (action === "pay_ibu_tempo") {
    const sheet = getSheetSafe(ss, "Usaha_Ibu_Tempo");
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      for (let r = 1; r < data.length; r++) {
        if (String(data[r][0]) === String(p.id)) {
          sheet.getRange(r + 1, 7).setValue("Lunas");
          sheet.getRange(r + 1, 8).setValue(p.payDate || formattedDateWIB);
          break;
        }
      }
    }
  }

  // 8. HAPUS TEMPO USAHA IBU
  else if (action === "delete_ibu_tempo") {
    const sheet = getSheetSafe(ss, "Usaha_Ibu_Tempo");
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      for (let r = 1; r < data.length; r++) {
        if (String(data[r][0]) === String(p.id)) {
          sheet.deleteRow(r + 1);
          break;
        }
      }
    }
  }

  // 9. SINKRONISASI KAMAR KOST DINAMIS
  else if (action === "sync_kost_rooms" && Array.isArray(p.rooms)) {
    const sKost = getSheetSafe(ss, "Usaha_Ibu_Kost");
    if (sKost) {
      if (sKost.getLastRow() > 1) {
        sKost.deleteRows(2, sKost.getLastRow() - 1);
      }
      p.rooms.forEach(r => {
        sKost.appendRow([
          r.roomNumber,
          r.tenantName || "(Kosong / Siap Huni)",
          r.tenantPhone || "",
          r.facilities || "-",
          Number(r.monthlyRent) || 550000,
          "Tgl " + (r.dueDay || 1),
          r.statusBulanIni === "paid" ? "Lunas" : (r.statusBulanIni === "partial" ? "Cicil/Tempo" : "Belum Bayar")
        ]);
      });
    }
  }

  // 10. SINKRONISASI CELENGAN TARGET IMPIAN KELUARGA (FINANCIAL GOALS)
  else if (action === "sync_goals" && Array.isArray(p.goals)) {
    const sGoals = getSheetSafe(ss, "Celengan_Target_Impian");
    if (sGoals) {
      if (sGoals.getLastRow() > 1) {
        sGoals.deleteRows(2, sGoals.getLastRow() - 1);
      }
      p.goals.forEach(g => {
        const cur = Number(g.currentAmount) || 0;
        const tgt = Number(g.targetAmount) || 1;
        const pct = tgt > 0 ? Math.min(100, Math.round((cur / tgt) * 100)) + "%" : "0%";
        sGoals.appendRow([
          g.id,
          g.title || "-",
          tgt,
          cur,
          g.deadline || "-",
          g.icon || "🎯",
          g.category || "Umum",
          pct
        ]);
      });
    }
  }

  // 11. UPDATE CELENGAN TARGET IMPIAN (EDIT NOMINAL SALDO / TARGET)
  else if (action === "update_goal") {
    const sGoals = getSheetSafe(ss, "Celengan_Target_Impian");
    if (sGoals) {
      const data = sGoals.getDataRange().getValues();
      for (let r = 1; r < data.length; r++) {
        if (String(data[r][0]) === String(p.id)) {
          if (p.title !== undefined) sGoals.getRange(r + 1, 2).setValue(p.title);
          if (p.targetAmount !== undefined) sGoals.getRange(r + 1, 3).setValue(Number(p.targetAmount) || 0);
          if (p.currentAmount !== undefined) sGoals.getRange(r + 1, 4).setValue(Number(p.currentAmount) || 0);
          if (p.deadline !== undefined) sGoals.getRange(r + 1, 5).setValue(p.deadline || "-");
          const cur = Number(sGoals.getRange(r + 1, 4).getValue()) || 0;
          const tgt = Number(sGoals.getRange(r + 1, 3).getValue()) || 1;
          sGoals.getRange(r + 1, 8).setValue(Math.round((cur / tgt) * 100) + "%");
          break;
        }
      }
    }
  }

  // 12. HAPUS CELENGAN TARGET IMPIAN
  else if (action === "delete_goal") {
    const sGoals = getSheetSafe(ss, "Celengan_Target_Impian");
    if (sGoals) {
      const data = sGoals.getDataRange().getValues();
      for (let r = 1; r < data.length; r++) {
        if (String(data[r][0]) === String(p.id)) {
          sGoals.deleteRow(r + 1);
          break;
        }
      }
    }
  }

  // 13. RESET TOTAL TRANSAKSI KELUARGA KE RP 0 (DI SPREADSHEET)
  else if (action === "reset_keluarga_data") {
    const sKel = getSheetSafe(ss, "Keluarga_Transaksi");
    if (sKel && sKel.getLastRow() > 1) {
      sKel.deleteRows(2, sKel.getLastRow() - 1);
    }
  }

  // 14. SINKRONISASI TAGIHAN RUTIN BULANAN
  else if (action === "sync_bills" && Array.isArray(p.bills)) {
    const sBills = getSheetSafe(ss, "Tagihan_Rutin_Bulanan");
    if (sBills) {
      if (sBills.getLastRow() > 1) {
        sBills.deleteRows(2, sBills.getLastRow() - 1);
      }
      p.bills.forEach(b => {
        sBills.appendRow([
          b.name || "-",
          Number(b.estimatedCost) || 0,
          Number(b.dueDay) || 1,
          b.defaultWallet || "Rekening BCA",
          b.status === "paid" ? "Lunas" : "Belum Bayar"
        ]);
      });
    }
  }

  // 15. SINKRONISASI PENDIDIKAN ANAK & ISTRI
  else if (action === "sync_education" && Array.isArray(p.plans)) {
    const sEdu = getSheetSafe(ss, "Pendidikan_Anak_Istri");
    if (sEdu) {
      if (sEdu.getLastRow() > 1) {
        sEdu.deleteRows(2, sEdu.getLastRow() - 1);
      }
      p.plans.forEach(ed => {
        sEdu.appendRow([
          ed.title || "-",
          ed.person || "-",
          Number(ed.amount) || 0,
          ed.cycle || "Bulanan",
          ed.status === "active" ? "Aktif" : "Mendatang"
        ]);
      });
    }
  }

  // 16. SINKRONISASI BAKTI ORANG TUA & MERTUA
  else if (action === "sync_parents" && Array.isArray(p.recipients)) {
    const sPar = getSheetSafe(ss, "Bakti_Ortu_Kondangan");
    if (sPar) {
      if (sPar.getLastRow() > 1) {
        sPar.deleteRows(2, sPar.getLastRow() - 1);
      }
      p.recipients.forEach(pr => {
        sPar.appendRow([
          pr.name || "-",
          pr.relation || "Orang Tua",
          Number(pr.amount) || 1000000,
          pr.defaultWallet || "Rekening BCA",
          pr.note || "-"
        ]);
      });
    }
  }

  // 17. SINKRONISASI SERVIS KENDARAAN
  else if (action === "sync_vehicles" && Array.isArray(p.vehicles)) {
    const sVeh = getSheetSafe(ss, "Servis_Kendaraan");
    if (sVeh) {
      if (sVeh.getLastRow() > 1) {
        sVeh.deleteRows(2, sVeh.getLastRow() - 1);
      }
      p.vehicles.forEach(v => {
        sVeh.appendRow([
          v.name || "-",
          v.type === "mobil" ? "Mobil" : "Motor",
          v.plat || "-",
          v.nextOilDate || "-",
          v.note || "Perawatan Berkala"
        ]);
      });
    }
  }

  // 18. SINKRONISASI STOK GAS USAHA IBU
  else if (action === "sync_gas_inventory" && p.inventory) {
    const sGas = getSheetSafe(ss, "Usaha_Ibu_Gas");
    if (sGas) {
      if (sGas.getLastRow() > 1) {
        sGas.deleteRows(2, sGas.getLastRow() - 1);
      }
      const inv = p.inventory;
      sGas.appendRow([
        Number(inv.tabungIsi) || 0,
        Number(inv.tabungKosong) || 0,
        Number(inv.tabungDipinjam) || 0,
        Number(inv.hargaModalDefault) || 18500,
        Number(inv.hargaJualDefault) || 22000,
        inv.suppliers && inv.suppliers[0] ? inv.suppliers[0].name : "Bu Yanto",
        inv.suppliers && inv.suppliers[1] ? inv.suppliers[1].name : "Mas Aan"
      ]);
    }
  }

  // 19. SINKRONISASI INVESTASI & DANA DARURAT
  else if (action === "sync_investments" && p.investments) {
    const sInv = getSheetSafe(ss, "Investasi_DanaDarurat");
    if (sInv) {
      if (sInv.getLastRow() > 1) {
        sInv.deleteRows(2, sInv.getLastRow() - 1);
      }
      const inv = p.investments;
      if (Array.isArray(inv.gold)) {
        inv.gold.forEach(g => {
          sInv.appendRow([
            "Logam Mulia",
            g.brand || "Emas Antam Fisik",
            (g.grams || 0) + " Gram",
            (Number(g.buyPricePerGram) || 0) * (Number(g.grams) || 0),
            (Number(g.currentPricePerGram) || 0) * (Number(g.grams) || 0),
            "Aset Tabungan Emas"
          ]);
        });
      }
    }
  }
}

// ================= INISIALISASI SHEET TUNGGAL SESUAI KEBUTUHAN (LAZY INIT - TANPA DATA DUMMY) =================
function setupSingleSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (sheet) return sheet;

  // SAFEGUARD GO-LIVE: Blokir pembuatan sheet sembarangan di luar 11 sheet whitelist
  if (PRODUCTION_GO_LIVE_LOCKED && !OFFICIAL_11_SHEETS_WHITELIST.includes(sheetName)) {
    throw new Error("Pemberitahuan Go-Live: Penambahan database/sheet baru '" + sheetName + "' diblokir demi menjaga integritas data real!");
  }

  if (sheetName === "Keluarga_Transaksi") {
    sheet = ss.insertSheet("Keluarga_Transaksi");
    sheet.appendRow(["ID Transaksi", "Waktu WIB", "Jenis", "Pos Kategori", "Sub Kategori", "Nominal (Rp)", "Dompet/Akun", "Pencatat", "Keterangan"]);
    sheet.setFrozenRows(1);
    sheet.getRange("A1:I1").setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
  } else if (sheetName === "Usaha_Ibu_Transaksi") {
    sheet = ss.insertSheet("Usaha_Ibu_Transaksi");
    sheet.appendRow(["ID Transaksi", "Waktu WIB", "Unit Usaha", "Jenis", "Kategori", "Nominal (Rp)", "Laba Bersih (Rp)", "Keterangan"]);
    sheet.setFrozenRows(1);
    sheet.getRange("A1:H1").setFontWeight("bold").setBackground("#f59e0b").setFontColor("#000000");
  } else if (sheetName === "Tagihan_Rutin_Bulanan") {
    sheet = ss.insertSheet("Tagihan_Rutin_Bulanan");
    sheet.appendRow(["Nama Tagihan", "Estimasi Biaya (Rp)", "Tgl Jatuh Tempo", "Dompet Bayar", "Status Terakhir"]);
    sheet.setFrozenRows(1);
    sheet.getRange("A1:E1").setFontWeight("bold").setBackground("#0ea5e9").setFontColor("#ffffff");
  } else if (sheetName === "Usaha_Ibu_Kost") {
    sheet = ss.insertSheet("Usaha_Ibu_Kost");
    sheet.appendRow(["No Kamar", "Nama Penghuni", "No WhatsApp", "Fasilitas", "Tarif Sewa (Rp)", "Jatuh Tempo", "Status Bulan Ini"]);
    sheet.setFrozenRows(1);
    sheet.getRange("A1:G1").setFontWeight("bold").setBackground("#f97316").setFontColor("#ffffff");
  } else if (sheetName === "Usaha_Ibu_Gas") {
    sheet = ss.insertSheet("Usaha_Ibu_Gas");
    sheet.appendRow(["Stok Tabung Isi", "Stok Tabung Kosong", "Tabung Dipinjam", "Modal Default (Rp)", "Harga Jual (Rp)", "Supplier 1", "Supplier 2"]);
    sheet.setFrozenRows(1);
    sheet.getRange("A1:G1").setFontWeight("bold").setBackground("#eab308").setFontColor("#000000");
  } else if (sheetName === "Usaha_Ibu_Tempo") {
    sheet = ss.insertSheet("Usaha_Ibu_Tempo");
    sheet.appendRow(["ID Tempo", "Waktu Catat", "Jenis Tempo", "Nama Pihak / Tetangga", "Nominal (Rp)", "Tgl Jatuh Tempo", "Status", "Waktu Pelunasan"]);
    sheet.setFrozenRows(1);
    sheet.getRange("A1:H1").setFontWeight("bold").setBackground("#d97706").setFontColor("#ffffff");
  } else if (sheetName === "Pendidikan_Anak_Istri") {
    sheet = ss.insertSheet("Pendidikan_Anak_Istri");
    sheet.appendRow(["Pos Pendidikan", "Peruntukan", "Estimasi Biaya (Rp)", "Siklus Pembayaran", "Status"]);
    sheet.setFrozenRows(1);
    sheet.getRange("A1:E1").setFontWeight("bold").setBackground("#8b5cf6").setFontColor("#ffffff");
  } else if (sheetName === "Bakti_Ortu_Kondangan") {
    sheet = ss.insertSheet("Bakti_Ortu_Kondangan");
    sheet.appendRow(["Nama Penerima", "Hubungan", "Nominal Rutin (Rp)", "Dompet Penyalur", "Keterangan"]);
    sheet.setFrozenRows(1);
    sheet.getRange("A1:E1").setFontWeight("bold").setBackground("#ec4899").setFontColor("#ffffff");
  } else if (sheetName === "Servis_Kendaraan") {
    sheet = ss.insertSheet("Servis_Kendaraan");
    sheet.appendRow(["Nama Kendaraan", "Jenis", "Plat Nomor", "Jadwal Ganti Oli Berikutnya", "Keterangan"]);
    sheet.setFrozenRows(1);
    sheet.getRange("A1:E1").setFontWeight("bold").setBackground("#3b82f6").setFontColor("#ffffff");
  } else if (sheetName === "Investasi_DanaDarurat") {
    sheet = ss.insertSheet("Investasi_DanaDarurat");
    sheet.appendRow(["Jenis Aset", "Instrumen / Brand", "Gram / Jumlah", "Modal Beli (Rp)", "Estimasi Nilai Pasar (Rp)", "Keterangan"]);
    sheet.setFrozenRows(1);
    sheet.getRange("A1:F1").setFontWeight("bold").setBackground("#1e293b").setFontColor("#ffffff");
  } else if (sheetName === "Celengan_Target_Impian") {
    sheet = ss.insertSheet("Celengan_Target_Impian");
    sheet.appendRow(["ID Impian", "Nama Target Impian", "Target Nominal (Rp)", "Saldo Terkumpul (Rp)", "Tenggat Waktu", "Icon", "Kategori", "Progres (%)"]);
    sheet.setFrozenRows(1);
    sheet.getRange("A1:H1").setFontWeight("bold").setBackground("#9333ea").setFontColor("#ffffff");
  }

  return sheet;
}

// Inisialisasi Seluruh 11 Sheet Sekaligus (Hanya dijalankan jika dipanggil manual atau action=setup)
function setupAllSheetsIfMissing(ss) {
  const allNames = [
    "Keluarga_Transaksi", "Usaha_Ibu_Transaksi", "Tagihan_Rutin_Bulanan",
    "Usaha_Ibu_Kost", "Usaha_Ibu_Gas", "Usaha_Ibu_Tempo",
    "Pendidikan_Anak_Istri", "Bakti_Ortu_Kondangan", "Servis_Kendaraan",
    "Investasi_DanaDarurat", "Celengan_Target_Impian"
  ];
  allNames.forEach(name => {
    setupSingleSheet(ss, name);
  });
}

// Helper: Membaca Data Sheet sebagai Array of JSON Objects
function getSheetDataAsJson(sheet) {
  if (!sheet) return [];
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  const rows = [];
  for (let r = 1; r < values.length; r++) {
    const rowObj = {};
    for (let c = 0; c < headers.length; c++) {
      let cellVal = values[r][c];
      if (cellVal instanceof Date) {
        cellVal = Utilities.formatDate(cellVal, "Asia/Jakarta", "yyyy-MM-dd'T'HH:mm:ss+07:00");
      }
      rowObj[headers[c]] = cellVal;
    }
    rows.push(rowObj);
  }
  return rows;
}
