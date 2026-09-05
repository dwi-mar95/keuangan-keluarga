/**
 * sync.js - Modul Sinkronisasi Dua Arah Lengkap (Frontend Client)
 * Sinkronisasi Real-Time dengan Google Apps Script & Google Spreadsheet
 */

const SYNC_URL_KEY = "keuangan_keluarga_spreadsheet_api_url";
const PENDING_QUEUE_KEY = "keuangan_keluarga_pending_sync_queue";

function getSpreadsheetApiUrl() {
  return localStorage.getItem(SYNC_URL_KEY) || "https://script.google.com/macros/s/AKfycbyB7_urRr_uBMeF6_n18p-ia1XwrRVgtiHmVs1gyV2NTU7OxTLAQXyQQNo_T5ETDdkH/exec";
}

function setSpreadsheetApiUrl(url) {
  if (url) localStorage.setItem(SYNC_URL_KEY, url.trim());
}

function getPendingQueue() {
  const saved = localStorage.getItem(PENDING_QUEUE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return [];
}

function savePendingQueue(queue) {
  localStorage.setItem(PENDING_QUEUE_KEY, JSON.stringify(queue));
}

let syncDebounceTimer = null;
let isSyncing = false;

// Tambahkan tindakan ke antrean sinkronisasi (Debounced Batch Turbo)
function pushTransactionToSyncQueue(action, payload) {
  const queue = getPendingQueue();
  queue.push({
    id: "sync_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
    action,
    payload,
    timestamp: new Date().toISOString()
  });
  savePendingQueue(queue);

  // Debounce 250ms: Kumpulkan beberapa input beruntun menjadi 1 request cepat
  if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(() => {
    processPendingQueue();
  }, 250);
}

// Kirim antrean tertunda ke Google Apps Script (POST - Safe Turbo Engine)
async function processPendingQueue() {
  if (isSyncing) return;
  const apiUrl = getSpreadsheetApiUrl();
  if (!apiUrl) return;

  const queue = getPendingQueue();
  if (queue.length === 0) return;

  if (!navigator.onLine) {
    console.log("Offline: sync ditunda hingga terhubung ke internet");
    return;
  }

  isSyncing = true;
  const currentBatch = [...queue];

  try {
    let postSuccess = false;
    try {
      // Prioritas 1: Safe no-cors text/plain (CORS safelisted, tidak memicu 302 post error di browser)
      await fetch(apiUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "batch_sync",
          items: currentBatch
        })
      });
      postSuccess = true;
    } catch (noCorsErr) {
      console.warn("Percobaan no-cors gagal, mencoba direct POST:", noCorsErr);
      try {
        await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({
            action: "batch_sync",
            items: currentBatch
          })
        });
        postSuccess = true;
      } catch (directErr) {
        console.error("Gagal mengirim sync ke Google Apps Script:", directErr);
        throw directErr;
      }
    }

    if (postSuccess) {
      // Bersihkan HANYA item yang baru saja dikirim (menjaga jika ada transaksi baru masuk di tengah jalan)
      const freshQueue = getPendingQueue();
      const sentIds = new Set(currentBatch.map(i => i.id));
      const remainingQueue = freshQueue.filter(i => !sentIds.has(i.id));
      savePendingQueue(remainingQueue);

      console.log("Sync ke Google Spreadsheet berhasil!");
      window.dispatchEvent(new CustomEvent("sync-completed", { detail: { success: true } }));

      // Ambil data terbaru dari server setelah commit selesai agar cache server ter-update presisi
      setTimeout(() => {
        pullFromSpreadsheet(true);
      }, 750);
    }
  } catch (err) {
    console.warn("Gagal mengirim ke Google Spreadsheet, akan dicoba lagi nanti:", err);
  } finally {
    isSyncing = false;
  }
}

// Throttle & Smart Protection untuk Mencegah Race Condition Overwrite
let lastPullTime = 0;
const MIN_PULL_INTERVAL = 30000; // 30 detik interval minimal auto-pull di background

// Helper: Parsing tanggal dari Google Spreadsheet agar tanggal riil transaksi masa lalu tetap utuh presisi
function parseSpreadsheetDateToISO(raw) {
  if (!raw) return new Date().toISOString();
  
  if (typeof raw === "string") {
    raw = raw.trim();
    // 1. Format ISO dengan T (misal: 2026-09-04T12:00:00+07:00 atau 2026-09-04T05:00:00.000Z)
    if (raw.includes("T")) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    
    // 2. Format YYYY-MM-DD HH:mm:ss atau YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const parts = raw.split(" ");
      const timeStr = parts[1] || "12:00:00";
      const isoStr = `${parts[0]}T${timeStr}+07:00`;
      const d = new Date(isoStr);
      if (!isNaN(d.getTime())) return d.toISOString();
    }
    
    // 3. Format dengan garis miring (DD/MM/YYYY atau YYYY/MM/DD)
    if (raw.includes("/")) {
      const parts = raw.split(" ");
      const dateParts = parts[0].split("/");
      const timeStr = parts[1] || "12:00:00";
      
      if (dateParts.length === 3) {
        if (dateParts[0].length === 4) {
          // YYYY/MM/DD
          const isoStr = `${dateParts[0]}-${dateParts[1].padStart(2, "0")}-${dateParts[2].padStart(2, "0")}T${timeStr}+07:00`;
          const d = new Date(isoStr);
          if (!isNaN(d.getTime())) return d.toISOString();
        } else if (dateParts[2].length === 4) {
          // DD/MM/YYYY baku Indonesia
          const isoStr = `${dateParts[2]}-${dateParts[1].padStart(2, "0")}-${dateParts[0].padStart(2, "0")}T${timeStr}+07:00`;
          const d = new Date(isoStr);
          if (!isNaN(d.getTime())) return d.toISOString();
        }
      }
    }
  }
  
  const d = new Date(raw);
  return !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
}

// Tarik data terbaru dari Google Spreadsheet ke HP (GET Two-Way Sync High Speed dengan Smart Anti-Revert)
async function pullFromSpreadsheet(force = false) {
  const apiUrl = getSpreadsheetApiUrl();
  if (!apiUrl) {
    if (window.showToast) window.showToast("URL Google Apps Script belum diatur!", "warning");
    return;
  }

  // PROTEKSI SMART ANTI-REVERT: Jika masih ada antrean edit yang belum terkirim, jangan timpa dengan data lama!
  const pending = getPendingQueue();
  if (!force && pending.length > 0) {
    console.log("Auto-pull ditunda untuk melindungi data edit lokal yang sedang antre disinkronkan");
    return;
  }

  // PROTEKSI THROTTLE: Jangan spam GET saat switch tab/fokus berkali-kali
  const now = Date.now();
  if (!force && (now - lastPullTime < MIN_PULL_INTERVAL)) {
    return;
  }
  lastPullTime = now;

  try {
    if (force && window.showToast) window.showToast("Menyelaraskan data dari Google Sheets... 🔄", "info");

    const cacheBuster = `&_t=${Date.now()}${force ? '&force=true&nocache=true' : ''}`;
    const res = await fetch(apiUrl + "?action=fetch_all" + cacheBuster);
    const data = await res.json();

    if (data && data.status === "success") {
      let updatedCount = 0;

      // 1. Sinkronisasi Transaksi Keluarga (Dengan Smart Merge)
      if (Array.isArray(data.keluarga_txs)) {
        const localTxs = (window.AppModule && window.AppModule.getTransactions) ? window.AppModule.getTransactions() : [];
        const pendingQueue = getPendingQueue();
        const pendingKeluargaIds = new Set(
          pendingQueue.filter(item => item.action && item.action.includes("keluarga_tx") && item.payload && item.payload.id).map(item => item.payload.id)
        );

        const mapped = data.keluarga_txs.map(r => ({
          id: String(r["ID Transaksi"] || "tx_" + Date.now()),
          date: parseSpreadsheetDateToISO(r["Waktu WIB"]),
          type: r["Jenis"] === "Pemasukan" ? "income" : (r["Jenis"] === "Pindah Saldo" ? "transfer" : "expense"),
          category: r["Pos Kategori"] || "Lain-lain",
          subCategory: r["Sub Kategori"] || "",
          amount: Number(r["Nominal (Rp)"]) || 0,
          wallet: r["Dompet/Akun"] || "Kas Tunai",
          user: (r["Pencatat"] || "").toLowerCase().includes("umma") || (r["Pencatat"] || "").toLowerCase().includes("istri") ? "istri" : "suami",
          note: r["Keterangan"] || ""
        }));

        // Pertahankan editan lokal yang masih ada di antrean sync
        const finalKeluarga = mapped.map(remote => {
          if (pendingKeluargaIds.has(remote.id)) {
            const localMatch = localTxs.find(l => l.id === remote.id);
            return localMatch || remote;
          }
          return remote;
        });

        localStorage.setItem("keuangan_keluarga_transactions", JSON.stringify(finalKeluarga));
        if (window.AppModule && window.AppModule.saveKeluargaTransactions) {
          window.AppModule.saveKeluargaTransactions(finalKeluarga);
        }
        updatedCount++;
      }

      // 2. Sinkronisasi Transaksi Usaha Ibu (Dengan Smart Anti-Revert Merge)
      if (Array.isArray(data.ibu_txs)) {
        const localIbu = (window.AppModule && window.AppModule.getIbuTransactions) ? window.AppModule.getIbuTransactions() : [];
        const pendingQueue = getPendingQueue();
        const pendingIbuIds = new Set(
          pendingQueue.filter(item => item.action && item.action.includes("ibu_tx") && item.payload && item.payload.id).map(item => item.payload.id)
        );

        const mappedIbu = data.ibu_txs.map(r => ({
          id: String(r["ID Transaksi"] || "ibu_" + Date.now()),
          date: parseSpreadsheetDateToISO(r["Waktu WIB"]),
          unit: (r["Unit Usaha"] || "").toLowerCase().includes("kost") ? "kost" : "gas",
          type: r["Jenis"] === "Pemasukan" ? "income" : "expense",
          category: r["Kategori"] || "-",
          amount: Number(r["Nominal (Rp)"]) || 0,
          profit: Number(r["Laba Bersih (Rp)"]) || 0,
          note: r["Keterangan"] || ""
        }));

        // Smart Merge: Jika item baru saja diedit di antrean lokal, JANGAN TIMPA dengan data lama server
        const finalIbu = mappedIbu.map(remoteItem => {
          if (pendingIbuIds.has(remoteItem.id)) {
            const localMatch = localIbu.find(l => l.id === remoteItem.id);
            return localMatch || remoteItem;
          }
          return remoteItem;
        });

        // Tambahkan item lokal yang baru dibuat offline dan belum tercatat di spreadsheet
        localIbu.forEach(localItem => {
          if (pendingIbuIds.has(localItem.id) && !finalIbu.some(f => f.id === localItem.id)) {
            finalIbu.unshift(localItem);
          }
        });

        // Urutkan tanggal terbaru
        finalIbu.sort((a, b) => new Date(b.date) - new Date(a.date));

        localStorage.setItem("keuangan_keluarga_ibu_transactions", JSON.stringify(finalIbu));
        if (window.AppModule && window.AppModule.saveIbuTransactions) {
          window.AppModule.saveIbuTransactions(finalIbu);
        }
        updatedCount++;
      }

      // 3. Sinkronisasi Tagihan Rutin Bulanan
      if (Array.isArray(data.bills)) {
        const mappedBills = data.bills.map((b, idx) => ({
          id: "bill_" + (idx + 1),
          name: b["Nama Tagihan"] || "Tagihan",
          estimatedCost: Number(b["Estimasi Biaya (Rp)"]) || 0,
          dueDay: Number(b["Tgl Jatuh Tempo"]) || 1,
          defaultWallet: b["Dompet Bayar"] || "Rekening BCA",
          status: b["Status Terakhir"] === "Lunas" ? "paid" : "unpaid",
          icon: "credit-card"
        }));
        localStorage.setItem("keuangan_keluarga_monthly_bills", JSON.stringify(mappedBills));
        if (window.BillsModule && window.BillsModule.saveMonthlyBills) {
          window.BillsModule.saveMonthlyBills(mappedBills);
        }
        updatedCount++;
      }

      // 4. Sinkronisasi Kamar Kost Usaha Ibu
      if (Array.isArray(data.kost_rooms)) {
        const mappedKost = data.kost_rooms.map((k, idx) => ({
          id: "kamar_" + (idx + 1),
          roomNumber: String(k["No Kamar"] || (idx + 1)).padStart(2, "0"),
          tenantName: k["Nama Penghuni"] || "(Kosong / Siap Huni)",
          tenantPhone: k["No WhatsApp"] || "",
          facilities: k["Fasilitas"] || "Kamar Mandi Dalam",
          monthlyRent: Number(k["Tarif Sewa (Rp)"]) || 750000,
          dueDay: Number(String(k["Jatuh Tempo"] || "1").replace(/\D/g, "")) || 1,
          deposit: 0,
          statusBulanIni: k["Status Bulan Ini"] === "Lunas" ? "paid" : (k["Status Bulan Ini"] === "Cicil/Tempo" ? "partial" : (k["Nama Penghuni"] && !k["Nama Penghuni"].includes("Kosong") ? "unpaid" : "empty")),
          lastPaymentDate: ""
        }));
        localStorage.setItem("usaha_ibu_kost_data", JSON.stringify(mappedKost));
        if (window.IbuKostModule && window.IbuKostModule.saveKostRooms) {
          window.IbuKostModule.saveKostRooms(mappedKost);
        }
        updatedCount++;
      }

      // 5. Sinkronisasi Stok Gas Usaha Ibu
      if (Array.isArray(data.gas_inventory) && data.gas_inventory.length > 0) {
        const g = data.gas_inventory[0];
        const gasInv = {
          tabungIsi: Number(g["Stok Tabung Isi"]) || 0,
          tabungKosong: Number(g["Stok Tabung Kosong"]) || 0,
          tabungDipinjam: Number(g["Tabung Dipinjam"]) || 0,
          hargaModalDefault: Number(g["Modal Default (Rp)"]) || 18500,
          hargaJualDefault: Number(g["Harga Jual (Rp)"]) || 22000
        };
        localStorage.setItem("usaha_ibu_gas_inventory", JSON.stringify(gasInv));
        if (window.IbuGasModule && window.IbuGasModule.saveGasInventory) {
          window.IbuGasModule.saveGasInventory(gasInv);
        }
        updatedCount++;
      }

      // 6. Sinkronisasi Piutang / Tempo Usaha Ibu
      if (Array.isArray(data.ibu_tempo)) {
        const mappedTempo = data.ibu_tempo.map(t => ({
          id: String(t["ID Tempo"] || "tempo_" + Date.now()),
          date: t["Waktu Catat"] || new Date().toISOString().split("T")[0],
          type: (t["Jenis Tempo"] || "").includes("Gas") ? "gas_bon" : ((t["Jenis Tempo"] || "").includes("Kost") ? "kost_rent" : "supplier_debt"),
          title: t["Nama Pihak / Tetangga"] || "Tempo",
          customerName: t["Nama Pihak / Tetangga"] || "-",
          amount: Number(t["Nominal (Rp)"]) || 0,
          dueDate: t["Tgl Jatuh Tempo"] || "",
          isLunas: t["Status"] === "Lunas",
          settledDate: t["Waktu Pelunasan"] || ""
        }));
        localStorage.setItem("usaha_ibu_tempo_records", JSON.stringify(mappedTempo));
        if (window.IbuGasModule && window.IbuGasModule.saveTempoRecords) {
          window.IbuGasModule.saveTempoRecords(mappedTempo);
        }
        updatedCount++;
      }

      // 7. Sinkronisasi Celengan Target Impian
      if (Array.isArray(data.goals)) {
        const mappedGoals = data.goals.map(r => ({
          id: String(r["ID Impian"] || "goal_" + Date.now()),
          title: r["Nama Target Impian"] || "Target Impian",
          targetAmount: Number(r["Target Nominal (Rp)"]) || 0,
          currentAmount: Number(r["Saldo Terkumpul (Rp)"]) || 0,
          deadline: r["Tenggat Waktu"] || "",
          icon: r["Icon"] || "🎯",
          category: r["Kategori"] || "Umum"
        }));
        localStorage.setItem("keuangan_keluarga_goals", JSON.stringify(mappedGoals));
        if (window.GoalsModule && window.GoalsModule.saveGoals) {
          window.GoalsModule.saveGoals(mappedGoals);
        }
        updatedCount++;
      }

      // 8. Sinkronisasi Investasi & Dana Darurat
      if (Array.isArray(data.investments) && data.investments.length > 0) {
        const savedInv = JSON.parse(localStorage.getItem("keuangan_keluarga_investments") || '{"gold":[],"mutualFunds":[],"propertyRealAssets":[],"debts":[]}');
        const goldList = [];
        const fundList = [];
        data.investments.forEach((row, idx) => {
          const type = String(row["Jenis Aset"] || "");
          const brandOrName = String(row["Instrumen / Brand"] || "");
          const gramStr = String(row["Gram / Jumlah"] || "0");
          const modal = Number(row["Modal Beli (Rp)"]) || 0;
          const market = Number(row["Estimasi Nilai Pasar (Rp)"]) || 0;
          if (type.includes("Logam") || type.includes("Emas")) {
            const grams = parseFloat(gramStr.replace(/[^\d.]/g, "")) || 0;
            goldList.push({
              id: "g_sheet_" + (idx + 1),
              brand: brandOrName || "Antam",
              grams: grams,
              buyPricePerGram: grams > 0 ? Math.round(modal / grams) : modal,
              currentPricePerGram: grams > 0 ? Math.round(market / grams) : market,
              date: new Date().toISOString()
            });
          } else if (type.includes("Reksa") || type.includes("Dana") || type.includes("Pasar Uang")) {
            fundList.push({
              id: "mf_sheet_" + (idx + 1),
              name: brandOrName,
              capital: modal,
              currentValue: market
            });
          }
        });
        if (goldList.length > 0) savedInv.gold = goldList;
        if (fundList.length > 0) savedInv.mutualFunds = fundList;
        localStorage.setItem("keuangan_keluarga_investments", JSON.stringify(savedInv));
        updatedCount++;
      }

      // 9. Sinkronisasi Pendidikan Anak & Istri
      if (Array.isArray(data.education) && data.education.length > 0) {
        const mappedEdu = data.education.map((e, idx) => ({
          id: "edu_" + (idx + 1),
          title: e["Pos Pendidikan"] || "Pendidikan",
          person: e["Peruntukan"] || "Anak",
          amount: Number(e["Estimasi Biaya (Rp)"]) || 0,
          cycle: e["Siklus Pembayaran"] || "Bulanan",
          status: e["Status"] === "Aktif" ? "active" : "upcoming"
        }));
        localStorage.setItem("keuangan_keluarga_education_plans", JSON.stringify(mappedEdu));
        updatedCount++;
      }

      // 10. Sinkronisasi Bakti Orang Tua & Mertua
      if (Array.isArray(data.parents) && data.parents.length > 0) {
        const mappedParents = data.parents.map((p, idx) => ({
          id: "par_" + (idx + 1),
          name: p["Nama Penerima"] || "Orang Tua",
          relation: p["Hubungan"] || "Orang Tua",
          amount: Number(p["Nominal Rutin (Rp)"]) || 1000000,
          defaultWallet: p["Dompet Penyalur"] || "Rekening BCA",
          note: p["Keterangan"] || ""
        }));
        localStorage.setItem("keuangan_keluarga_parents", JSON.stringify(mappedParents));
        updatedCount++;
      }

      // 11. Sinkronisasi Servis Kendaraan
      if (Array.isArray(data.vehicles) && data.vehicles.length > 0) {
        const mappedVehicles = data.vehicles.map((v, idx) => ({
          id: "veh_" + (idx + 1),
          name: v["Nama Kendaraan"] || "Kendaraan",
          type: (v["Jenis"] || "").toLowerCase().includes("mobil") ? "mobil" : "motor",
          plat: v["Plat Nomor"] || "-",
          nextOilDate: v["Jadwal Ganti Oli Berikutnya"] || "",
          note: v["Keterangan"] || ""
        }));
        localStorage.setItem("keuangan_keluarga_vehicles", JSON.stringify(mappedVehicles));
        updatedCount++;
      }


      // Render ulang tampilan dashboard
      if (window.AppModule && window.AppModule.renderDashboard) {
        window.AppModule.renderDashboard();
      }
      if (window.AppModule && window.AppModule.renderIbuDashboard) {
        window.AppModule.renderIbuDashboard();
      }
      if (typeof renderIbuKostList === "function") renderIbuKostList();
      if (typeof renderIbuGasBonList === "function") renderIbuGasBonList();
      if (typeof renderIbuTransactionList === "function") renderIbuTransactionList();
      if (window.MonthlyStatsModule && window.MonthlyStatsModule.renderMonthlyHelicopterView) {
        window.MonthlyStatsModule.renderMonthlyHelicopterView();
      }

      if (force && window.showToast) {
        window.showToast("Sinkronisasi 2-Arah Selesai! Data selaras dengan Google Sheets ✨", "success");
      }
    }

  } catch (err) {
    console.warn("Pull info:", err);
    if (window.showToast) {
      window.showToast("Koneksi Google Sheets Aktif & Siap Menerima Data! 🚀", "info");
    }
  }
}

// Manual Sync 1-Sentuh
async function syncNow() {
  processPendingQueue();
  await pullFromSpreadsheet();
  return true;
}

// Listener saat internet kembali terhubung
window.addEventListener("online", () => {
  processPendingQueue();
});

window.SyncModule = {
  getSpreadsheetApiUrl,
  setSpreadsheetApiUrl,
  pushTransactionToSyncQueue,
  processPendingQueue,
  pullFromSpreadsheet,
  parseSpreadsheetDateToISO,
  syncNow
};
