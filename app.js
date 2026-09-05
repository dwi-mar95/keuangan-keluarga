/**
 * app.js - Logika Utama, State Management, Kalkulasi Finansial & Charts
 * Catatan Keuangan Keluarga Baba Pangestu & Umma Atin + Usaha Ibu
 */

const TX_KELUARGA_KEY = "keuangan_keluarga_transactions";
const TX_IBU_KEY = "usaha_ibu_transactions";

// Data Transaksi Awal Bersih untuk Go-Live (Tanpa Data Dummy)
const INITIAL_KELUARGA_TX = [];
const INITIAL_IBU_TX = [];

// State Aplikasi
const AppState = {
  activeLedger: "keluarga", // "keluarga" | "ibu"
  timeFilter: "bulan",      // "hari" | "minggu" | "bulan" | "tahun"
  activeProfile: "keluarga", // "suami" | "istri" | "keluarga"
  cashflowChart: null,
  categoryChart: null,
  spouseComparisonChart: null
};

// Dapatkan riwayat transaksi keluarga
function getKeluargaTransactions() {
  const saved = localStorage.getItem(TX_KELUARGA_KEY);
  if (saved !== null) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // Otomatis bersihkan jika browser masih menyimpan data dummy contoh lama
        const cleaned = parsed.filter(t => !["tx_1", "tx_2", "tx_3", "tx_4", "tx_5", "tx_6", "tx_7", "tx_8", "tx_9"].includes(t.id));
        if (cleaned.length !== parsed.length) {
          saveKeluargaTransactions(cleaned);
        }
        return cleaned;
      }
    } catch (e) {}
  }
  return INITIAL_KELUARGA_TX;
}

function saveKeluargaTransactions(txs) {
  localStorage.setItem(TX_KELUARGA_KEY, JSON.stringify(txs));
}

// Dapatkan riwayat transaksi usaha ibu
function getIbuTransactions() {
  const saved = localStorage.getItem(TX_IBU_KEY);
  if (saved !== null) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(t => !["ib_1", "ib_2"].includes(t.id));
        if (cleaned.length !== parsed.length) {
          saveIbuTransactions(cleaned);
        }
        return cleaned;
      }
    } catch (e) {}
  }
  return INITIAL_IBU_TX;
}

function saveIbuTransactions(txs) {
  localStorage.setItem(TX_IBU_KEY, JSON.stringify(txs));
}

// Tambah Transaksi Keluarga (Optimistic Update)
function addTransaction(tx) {
  const txs = getKeluargaTransactions();
  const newTx = {
    id: "tx_" + Date.now(),
    date: tx.date || new Date().toISOString(),
    user: tx.user || (window.AuthModule ? window.AuthModule.getActiveProfile() : "suami"),
    ...tx
  };
  txs.unshift(newTx);
  txs.sort((a, b) => new Date(b.date) - new Date(a.date));
  saveKeluargaTransactions(txs);

  // Play sound effect
  if (window.SettingsModule) window.SettingsModule.playSuccessSound();

  // Push ke Google Spreadsheet via background queue
  if (window.SyncModule) {
    window.SyncModule.pushTransactionToSyncQueue("add_keluarga_tx", newTx);
  }

  // Refresh UI
  renderDashboard();
  return newTx;
}

// Tambah Transaksi Usaha Ibu
function addIbuTransaction(tx) {
  const txs = getIbuTransactions();
  const newTx = {
    id: "ib_" + Date.now(),
    date: tx.date || new Date().toISOString(),
    ...tx
  };
  txs.unshift(newTx);
  saveIbuTransactions(txs);

  if (window.SettingsModule) window.SettingsModule.playSuccessSound();

  if (window.SyncModule) {
    window.SyncModule.pushTransactionToSyncQueue("add_ibu_tx", newTx);
  }

  renderIbuDashboard();
  return newTx;
}

// Hapus Transaksi Usaha Ibu (CRUD Delete)
function deleteIbuTransaction(id) {
  let txs = getIbuTransactions();
  const txToDelete = txs.find(t => t.id === id);
  if (!txToDelete) return false;

  txs = txs.filter(t => t.id !== id);
  saveIbuTransactions(txs);

  if (window.SyncModule && window.SyncModule.markIdAsDeleted) {
    window.SyncModule.markIdAsDeleted(id);
  }

  if (window.SyncModule && window.SyncModule.pushTransactionToSyncQueue) {
    window.SyncModule.pushTransactionToSyncQueue("delete_ibu_tx", { id });
  }

  renderIbuDashboard();
  if (typeof renderIbuTransactionList === "function") {
    renderIbuTransactionList();
  }
  return true;
}

// Update Transaksi Usaha Ibu (Edit / CRUD Update & Backdate Support)
function updateIbuTransaction(id, updatedData) {
  let txs = getIbuTransactions();
  const index = txs.findIndex(t => t.id === id);
  if (index === -1) return false;

  txs[index] = {
    ...txs[index],
    ...updatedData,
    updatedAt: Date.now()
  };

  // Urutkan berdasarkan tanggal terbaru
  txs.sort((a, b) => new Date(b.date) - new Date(a.date));
  saveIbuTransactions(txs);

  if (window.SyncModule && window.SyncModule.pushTransactionToSyncQueue) {
    window.SyncModule.pushTransactionToSyncQueue("update_ibu_tx", txs[index]);
  }

  renderIbuDashboard();
  if (typeof renderIbuTransactionList === "function") {
    renderIbuTransactionList();
  }
  return txs[index];
}

// Hitung metrik keuangan keluarga sesuai filter aktif
function calculateKeluargaMetrics() {
  const allTxs = getKeluargaTransactions();
  const profile = AppState.activeProfile;

  // Filter profil suami vs istri
  let filtered = allTxs;
  if (profile === "suami") {
    filtered = allTxs.filter(t => t.user === "suami" || t.type === "income");
  } else if (profile === "istri") {
    filtered = allTxs.filter(t => t.user === "istri");
  }

  // Filter pencarian teks & rentang tanggal
  const searchInput = document.getElementById("txSearchInput") ? document.getElementById("txSearchInput").value.trim().toLowerCase() : "";
  const startDate = document.getElementById("filterStartDate") ? document.getElementById("filterStartDate").value : "";
  const endDate = document.getElementById("filterEndDate") ? document.getElementById("filterEndDate").value : "";
  const filterType = document.getElementById("filterTypeSelect") ? document.getElementById("filterTypeSelect").value : "all";

  if (searchInput) {
    filtered = filtered.filter(t => {
      const matchCat = (t.category || "").toLowerCase().includes(searchInput);
      const matchSub = (t.subCategory || "").toLowerCase().includes(searchInput);
      const matchNote = (t.note || "").toLowerCase().includes(searchInput);
      const matchWallet = (t.wallet || "").toLowerCase().includes(searchInput);
      return matchCat || matchSub || matchNote || matchWallet;
    });
  }

  if (startDate) {
    filtered = filtered.filter(t => (t.date || "").split("T")[0] >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(t => (t.date || "").split("T")[0] <= endDate);
  }
  if (filterType && filterType !== "all") {
    filtered = filtered.filter(t => t.type === filterType);
  }

  // Update badge jumlah transaksi terfilter
  const badgeEl = document.getElementById("filteredTxCountBadge");
  if (badgeEl) badgeEl.textContent = `${filtered.length} Transaksi`;


  // Hitung total income & expense
  const totalIncome = filtered.filter(t => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = filtered.filter(t => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  // Sisa tagihan rutin pending
  const bills = window.BillsModule ? window.BillsModule.getMonthlyBills() : [];
  const pendingBills = bills.filter(b => b.status === "unpaid").reduce((sum, b) => sum + Number(b.estimatedCost), 0);

  // Sisa anggaran bebas
  const freeBudget = Math.max(0, balance - pendingBills);

  // Pengeluaran per kategori
  const categoryMap = {};
  filtered.filter(t => t.type === "expense").forEach(t => {
    const cat = t.category || "Lain-lain";
    categoryMap[cat] = (categoryMap[cat] || 0) + Number(t.amount);
  });

  // Belanja Suami vs Istri
  const suamiExpense = allTxs.filter(t => t.type === "expense" && t.user === "suami").reduce((sum, t) => sum + Number(t.amount), 0);
  const istriExpense = allTxs.filter(t => t.type === "expense" && t.user === "istri").reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    totalIncome,
    totalExpense,
    balance,
    pendingBills,
    freeBudget,
    categoryMap,
    suamiExpense,
    istriExpense,
    filteredTxs: filtered
  };
}

// Inisialisasi Voice-to-Text Input Cepat
function initVoiceInput(onResult) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Browser HP Anda belum mendukung input suara. Silakan gunakan Chrome terbaru.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "id-ID";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    console.log("Suara terdeteksi:", text);
    parseVoiceText(text, onResult);
  };

  recognition.onerror = (e) => {
    console.warn("Speech error:", e.error);
  };

  return recognition;
}

// Parsing ucapan suara bahasa Indonesia menjadi nominal dan kategori
function parseVoiceText(text, callback) {
  const clean = text.toLowerCase();
  let amount = null;
  let category = "Kebutuhan Mingguan Dapur & Rumah";
  let subCategory = "Belanja Pasar & Sayur Mayur";

  // Deteksi nominal angka / kata ribuan
  const numberWords = {
    "sepuluh": 10000, "dua puluh": 20000, "tiga puluh": 30000, "empat puluh": 40000,
    "lima puluh": 50000, "seratus": 100000, "dua ratus": 200000, "tiga ratus": 300000,
    "lima ratus": 500000, "satu juta": 1000000, "dua juta": 2000000
  };

  for (const [k, v] of Object.entries(numberWords)) {
    if (clean.includes(k)) {
      amount = v;
      break;
    }
  }

  // Jika ada angka langsung
  const numMatch = clean.match(/\d+/);
  if (numMatch && !amount) {
    let num = parseInt(numMatch[0], 10);
    if (clean.includes("ribu") && num < 1000) num *= 1000;
    amount = num;
  }

  // Deteksi kategori
  if (clean.includes("bensin")) {
    category = "Kebutuhan Mingguan Dapur & Rumah";
    subCategory = "Bensin Motor / Mobil Mingguan";
  } else if (clean.includes("galon")) {
    category = "Kebutuhan Mingguan Dapur & Rumah";
    subCategory = "Isi Ulang Air Galon";
  } else if (clean.includes("gas") || clean.includes("lpg")) {
    category = "Kebutuhan Mingguan Dapur & Rumah";
    subCategory = "Gas LPG 3kg Masak";
  } else if (clean.includes("oli") || clean.includes("servis")) {
    category = "Servis Kendaraan & Mobilitas";
    subCategory = "Ganti Oli Mesin & Gardan";
  } else if (clean.includes("shopee") || clean.includes("online")) {
    category = "Belanja Online & Kebutuhan Istri";
    subCategory = "Belanja Online Shopee / Tokopedia";
  } else if (clean.includes("kopi") || clean.includes("jajan") || clean.includes("makan")) {
    category = "Jajan & Harian";
    subCategory = "Jajan Kopi & Cemilan Sore";
  }

  if (callback) {
    callback({ text, amount, category, subCategory });
  }
}

// Render Dashboard Utama
function renderDashboard() {
  const metrics = calculateKeluargaMetrics();
  const isPrivacy = window.AuthModule ? window.AuthModule.isPrivacyMode() : false;
  const maskFn = (num) => isPrivacy ? "Rp ••••••••" : window.DateHelper.formatRupiah(num);

  // Update KPI Cards
  const elIncome = document.getElementById("kpiTotalIncome");
  const elExpense = document.getElementById("kpiTotalExpense");
  const elPending = document.getElementById("kpiPendingBills");
  const elFreeBudget = document.getElementById("kpiFreeBudget");
  const elTotalBalance = document.getElementById("kpiTotalBalance");

  if (elIncome) elIncome.textContent = maskFn(metrics.totalIncome);
  if (elExpense) elExpense.textContent = maskFn(metrics.totalExpense);
  if (elPending) elPending.textContent = maskFn(metrics.pendingBills);
  if (elFreeBudget) elFreeBudget.textContent = maskFn(metrics.freeBudget);
  if (elTotalBalance) elTotalBalance.textContent = maskFn(metrics.balance);

  // Update Net Worth
  if (window.InvestmentsModule) {
    const nw = window.InvestmentsModule.calculateFamilyNetWorth(metrics.balance, 0);
    const elNetWorth = document.getElementById("kpiNetWorth");
    if (elNetWorth) elNetWorth.textContent = maskFn(nw.familyNetWorth);
  }

  // Update Ledger Switcher Badges
  const kelCount = (getKeluargaTransactions() || []).length;
  const ibuCount = (getIbuTransactions() || []).length;
  const bKel = document.getElementById("badgeCountKeluarga");
  const bIbu = document.getElementById("badgeCountIbu");
  if (bKel) bKel.textContent = kelCount;
  if (bIbu) bIbu.textContent = ibuCount;

  // Render Charts & Upcoming Due Dates Widget
  renderCharts(metrics);
  renderUpcomingDueWidget();
  renderDynamicWalletBar();
  renderDynamicPresetsBar();
  updateWalletDom();
  renderRecentTransactions(metrics.filteredTxs);
  if (window.renderDashboardHealthAndGoals) {
    window.renderDashboardHealthAndGoals(metrics);
  }
  if (window.MonthlyStatsModule && window.MonthlyStatsModule.renderMonthlyHelicopterView) {
    window.MonthlyStatsModule.renderMonthlyHelicopterView();
  }
}

// Render Riwayat Transaksi Terbaru
function renderRecentTransactions(txs) {
  const listEl = document.getElementById("recentTxList");
  if (!listEl) return;

  if (!txs || txs.length === 0) {
    const ibuCount = (getIbuTransactions() || []).length;
    if (ibuCount > 0) {
      listEl.innerHTML = `
        <div class="text-center py-7 px-4 rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 space-y-2.5 my-2">
          <div class="text-2xl">🏡</div>
          <div class="font-extrabold text-slate-800 text-xs">Belum Ada Catatan Transaksi di Kas Keluarga</div>
          <div class="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
            Data transaksi Anda tersimpan di buku kas <strong>Usaha Ibu</strong> (terdapat <strong>${ibuCount} transaksi</strong> sewa kost & penjualan gas LPG).
          </div>
          <div class="pt-1">
            <button type="button" onclick="switchLedger('ibu')" class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-sm">
              <span>🏢 Buka Kas Usaha Ibu (${ibuCount} Transaksi) ➔</span>
            </button>
          </div>
        </div>
      `;
    } else {
      listEl.innerHTML = `<div class="text-center py-8 text-slate-400 text-xs font-semibold">Belum ada transaksi pada periode ini</div>`;
    }
    return;
  }

  const isPrivacy = window.AuthModule ? window.AuthModule.isPrivacyMode() : false;

  listEl.innerHTML = txs.slice(0, 15).map(tx => {
    const isIncome = tx.type === "income";
    const amountFormatted = isPrivacy ? "Rp ••••••••" : (isIncome ? `+ ${window.DateHelper.formatRupiah(tx.amount)}` : `- ${window.DateHelper.formatRupiah(tx.amount)}`);
    const dateFormatted = window.DateHelper && window.DateHelper.formatDateTimeCard ? window.DateHelper.formatDateTimeCard(tx.date) : (window.DateHelper ? window.DateHelper.formatDateIndonesia(tx.date) : tx.date);
    const userBadge = tx.user === "istri" ? "👩 Umma Atin" : "👨 Baba Pangestu";

    return `
      <div class="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 hover:border-slate-200 transition-all shadow-2xs">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} shrink-0 font-bold text-lg">
            ${isIncome ? '📥' : '📤'}
          </div>
          <div>
            <div class="text-xs font-bold text-slate-800">${tx.subCategory || tx.category}</div>
            <div class="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span>${dateFormatted}</span>
              <span>•</span>
              <span class="font-semibold text-slate-500">${tx.wallet || 'Kas'}</span>
              <span>•</span>
              <span class="bg-slate-100 px-1.5 py-0.2 rounded text-[9px] font-bold text-slate-600">${userBadge}</span>
            </div>
            ${tx.note ? `<div class="text-[10px] text-slate-500 italic mt-0.5">"${tx.note}"</div>` : ''}
          </div>
        </div>
        <div class="text-right">
          <div class="text-xs font-black ${isIncome ? 'text-emerald-600' : 'text-slate-900'}">${amountFormatted}</div>
          <div class="flex items-center gap-2 justify-end mt-1">
            <button onclick="window.WhatsAppModule.sendTransactionToSpouse(${JSON.stringify(tx).replace(/"/g, '&quot;')}, '${tx.user}')" class="text-[9.5px] font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-0.5 cursor-pointer" title="Kirim ke WA">
              <span>💬 WA</span>
            </button>
            <button onclick="openEditModal('${tx.id}')" class="text-[9.5px] font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5 cursor-pointer" title="Edit Transaksi (CRUD)">
              <span>✏️ Edit</span>
            </button>
            <button onclick="handleDeleteTx('${tx.id}')" class="text-[9.5px] font-bold text-rose-500 hover:text-rose-700 inline-flex items-center gap-0.5 cursor-pointer" title="Hapus Transaksi (CRUD)">
              <span>🗑️</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// ================= WIDGET: JADWAL & TAGIHAN TERDEKAT (7 HARI KE DEPAN) =================
function renderUpcomingDueWidget() {
  const container = document.getElementById("upcomingDueDatesContainer");
  if (!container) return;

  const now = window.DateHelper ? window.DateHelper.getNowWIB() : new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const upcomingItems = [];

  // 1. Tagihan Rutin Bulanan
  if (window.BillsModule && window.BillsModule.getMonthlyBills) {
    const bills = window.BillsModule.getMonthlyBills() || [];
    bills.forEach(b => {
      if (b.status !== "paid") {
        const dueDay = Number(b.dueDay) || 1;
        let diff = dueDay - currentDay;
        if (diff < 0 && (diff + daysInCurrentMonth) <= 7) {
          diff += daysInCurrentMonth;
        }
        if (diff >= 0 && diff <= 7) {
          upcomingItems.push({
            id: b.id,
            module: "bills",
            category: "Tagihan Bulanan",
            title: b.name || "Tagihan",
            amount: Number(b.estimatedCost) || 0,
            daysDiff: diff,
            dueText: diff === 0 ? "Hari Ini!" : (diff === 1 ? "Besok" : `${diff} hari lagi`),
            urgency: diff === 0 ? "urgent" : (diff <= 2 ? "warning" : "normal"),
            actionLabel: "Bayar Tagihan",
            actionClick: "openTabModal('bills')"
          });
        }
      }
    });
  }

  // 2. Sewa Kamar Kost Usaha Ibu
  if (window.IbuKostModule && window.IbuKostModule.getKostRooms) {
    const rooms = window.IbuKostModule.getKostRooms() || [];
    rooms.forEach(r => {
      const isUnpaid = r.statusBulanIni === "unpaid" || r.statusBulanIni === "partial";
      const hasTenant = r.tenantName && !r.tenantName.includes("Kosong");
      if (isUnpaid && hasTenant) {
        const dueDay = Number(r.dueDay) || 1;
        let diff = dueDay - currentDay;
        if (diff < 0 && (diff + daysInCurrentMonth) <= 7) {
          diff += daysInCurrentMonth;
        }
        if (diff >= 0 && diff <= 7) {
          upcomingItems.push({
            id: r.id,
            module: "kost",
            category: "Sewa Kost Usaha Ibu",
            title: `Kamar ${r.roomNumber} (${r.tenantName})`,
            amount: Number(r.monthlyRent) || 0,
            daysDiff: diff,
            dueText: diff === 0 ? "Hari Ini!" : (diff === 1 ? "Besok" : `${diff} hari lagi`),
            urgency: diff === 0 ? "urgent" : (diff <= 2 ? "warning" : "normal"),
            actionLabel: r.tenantPhone ? "Tagih via WA" : "Catat Bayar",
            actionClick: r.tenantPhone ? `window.WhatsAppModule.sendKostReminder(${JSON.stringify(r).replace(/"/g, '&quot;')})` : `openTabModal('kost')`
          });
        }
      }
    });
  }

  // 3. Servis & Ganti Oli Kendaraan
  try {
    const rawVeh = localStorage.getItem("keuangan_keluarga_vehicles");
    if (rawVeh) {
      const vehicles = JSON.parse(rawVeh);
      if (Array.isArray(vehicles)) {
        vehicles.forEach(v => {
          if (v.nextOilDate) {
            const vDate = new Date(v.nextOilDate);
            if (!isNaN(vDate.getTime())) {
              const diffMs = vDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              if (diffDays >= -2 && diffDays <= 7) {
                upcomingItems.push({
                  id: v.id,
                  module: "vehicle",
                  category: "Servis Kendaraan",
                  title: `Ganti Oli: ${v.name} (${v.plat || '-'})`,
                  amount: 0,
                  daysDiff: Math.max(0, diffDays),
                  dueText: diffDays <= 0 ? "Waktunya Servis!" : (diffDays === 1 ? "Besok" : `${diffDays} hari lagi`),
                  urgency: diffDays <= 1 ? "urgent" : "warning",
                  actionLabel: "Lihat Jadwal",
                  actionClick: "openTabModal('vehicles')"
                });
              }
            }
          }
        });
      }
    }
  } catch (ve) { }

  // 4. Tempo / Bon Gas Usaha Ibu
  try {
    const rawTempo = localStorage.getItem("usaha_ibu_tempo_records");
    if (rawTempo) {
      const tempos = JSON.parse(rawTempo);
      if (Array.isArray(tempos)) {
        tempos.forEach(t => {
          if (!t.isLunas && t.dueDate) {
            const tDate = new Date(t.dueDate);
            if (!isNaN(tDate.getTime())) {
              const diffMs = tDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
              if (diffDays >= 0 && diffDays <= 7) {
                upcomingItems.push({
                  id: t.id,
                  module: "tempo",
                  category: "Tempo Bon Usaha Ibu",
                  title: `Janji Bayar: ${t.customerName || t.title}`,
                  amount: Number(t.amount) || 0,
                  daysDiff: diffDays,
                  dueText: diffDays === 0 ? "Hari Ini!" : (diffDays === 1 ? "Besok" : `${diffDays} hari lagi`),
                  urgency: diffDays === 0 ? "urgent" : (diffDays <= 2 ? "warning" : "normal"),
                  actionLabel: "Buka Buku Tempo",
                  actionClick: "openTabModal('gas')"
                });
              }
            }
          }
        });
      }
    }
  } catch (te) { }

  // Urutkan berdasarkan yang paling mendesak (hari terdekat)
  upcomingItems.sort((a, b) => a.daysDiff - b.daysDiff);

  // Jika TIDAK ada tagihan dalam 7 hari ke depan
  if (upcomingItems.length === 0) {
    container.innerHTML = `
      <div class="glass-card p-3.5 bg-gradient-to-r from-emerald-50/90 to-teal-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-lg shrink-0 font-bold">
            🎉
          </div>
          <div>
            <div class="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span>Semua Tagihan & Jadwal Aman</span>
              <span class="text-[9.5px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">7 Hari ke Depan</span>
            </div>
            <p class="text-[10.5px] text-slate-500 mt-0.5 leading-snug">
              Alhamdulillah, tidak ada tagihan rutin, sewa kost, atau jadwal servis yang jatuh tempo pekan ini.
            </p>
          </div>
        </div>
        <button type="button" onclick="openTabModal('bills')" class="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs">
          Lihat Semua Tagihan ➔
        </button>
      </div>
    `;
    return;
  }

  // Jika ADA tagihan jatuh tempo
  const isPrivacy = window.AuthModule ? window.AuthModule.isPrivacyMode() : false;

  container.innerHTML = `
    <div class="glass-card p-4 space-y-3 border-l-4 border-l-amber-500 rounded-2xl shadow-2xs bg-gradient-to-br from-white via-amber-50/20 to-white">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-base shrink-0 font-bold">
            📅
          </div>
          <div>
            <h3 class="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>Jadwal & Tagihan Terdekat</span>
              <span class="text-[9.5px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                ${upcomingItems.length} Perlu Perhatian
              </span>
            </h3>
            <p class="text-[10px] text-slate-400 font-medium">Jatuh tempo dalam 7 hari ke depan (Tagihan, Kost, Servis, Tempo)</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
        ${upcomingItems.map(item => {
          let badgeClass = "bg-slate-100 text-slate-700";
          if (item.urgency === "urgent") badgeClass = "bg-rose-100 text-rose-800 border border-rose-300 font-black animate-pulse";
          else if (item.urgency === "warning") badgeClass = "bg-amber-100 text-amber-800 border border-amber-300 font-bold";

          const amountFormatted = item.amount > 0 ? (isPrivacy ? "Rp ••••••••" : (window.DateHelper ? window.DateHelper.formatRupiah(item.amount) : `Rp ${item.amount.toLocaleString('id-ID')}`)) : "";

          return `
            <div class="p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-amber-300 transition-all shadow-2xs space-y-2 flex flex-col justify-between">
              <div class="space-y-1">
                <div class="flex items-center justify-between gap-1.5">
                  <span class="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">${item.category}</span>
                  <span class="text-[9.5px] px-2 py-0.5 rounded-md ${badgeClass}">${item.dueText}</span>
                </div>
                <div class="text-xs font-bold text-slate-800 truncate" title="${item.title}">${item.title}</div>
                ${amountFormatted ? `<div class="text-xs font-black text-slate-900">${amountFormatted}</div>` : ''}
              </div>
              <div class="pt-1 border-t border-slate-100 flex items-center justify-end">
                <button type="button" onclick="${item.actionClick}" class="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10.5px] font-extrabold transition-all cursor-pointer inline-flex items-center gap-1 shadow-2xs">
                  <span>${item.actionLabel} ➔</span>
                </button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

// Render Charts menggunakan Chart.js (Interaktif, Vibrant, & Komparasi Presisi)
function renderCharts(metrics) {
  const isPrivacy = window.AuthModule ? window.AuthModule.isPrivacyMode() : false;

  // Chart 1: Donut Kategori Pengeluaran
  const catCanvas = document.getElementById("categoryChart");
  if (catCanvas && window.Chart) {
    const rawCategories = metrics.categoryMap || {};
    const labels = Object.keys(rawCategories);
    const dataVals = Object.values(rawCategories);
    const totalExp = dataVals.reduce((sum, v) => sum + Number(v), 0);

    if (AppState.categoryChart) AppState.categoryChart.destroy();

    const chartColors = [
      "#10b981", "#0ea5e9", "#f59e0b", "#ec4899", 
      "#8b5cf6", "#f97316", "#06b6d4", "#14b8a6", 
      "#e11d48", "#64748b"
    ];

    if (dataVals.length === 0 || totalExp === 0) {
      AppState.categoryChart = new Chart(catCanvas, {
        type: "doughnut",
        data: {
          labels: ["Belum Ada Pengeluaran"],
          datasets: [{
            data: [1],
            backgroundColor: ["#e2e8f0"],
            borderWidth: 2,
            borderColor: "#ffffff"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } },
            tooltip: { enabled: false }
          },
          cutout: "70%"
        }
      });
    } else {
      AppState.categoryChart = new Chart(catCanvas, {
        type: "doughnut",
        data: {
          labels: labels,
          datasets: [{
            data: dataVals,
            backgroundColor: chartColors.slice(0, labels.length),
            hoverOffset: 6,
            borderWidth: 2,
            borderColor: "#ffffff"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { animateRotate: true, duration: 800 },
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                boxWidth: 10,
                font: { size: 10, weight: "bold" },
                padding: 10,
                generateLabels: (chart) => {
                  const data = chart.data;
                  if (data.labels.length && data.datasets.length) {
                    return data.labels.map((label, i) => {
                      const val = data.datasets[0].data[i];
                      const pct = totalExp > 0 ? Math.round((val / totalExp) * 100) : 0;
                      return {
                        text: `${label} (${pct}%)`,
                        fillStyle: data.datasets[0].backgroundColor[i],
                        strokeStyle: data.datasets[0].borderColor,
                        lineWidth: data.datasets[0].borderWidth,
                        hidden: isNaN(data.datasets[0].data[i]) || chart.getDatasetMeta(0).data[i].hidden,
                        index: i
                      };
                    });
                  }
                  return [];
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const val = context.parsed;
                  const pct = totalExp > 0 ? ((val / totalExp) * 100).toFixed(1) : 0;
                  const nominal = isPrivacy ? "Rp ••••••••" : (window.DateHelper ? window.DateHelper.formatRupiah(val, true) : `Rp ${val.toLocaleString('id-ID')}`);
                  return ` ${context.label}: ${nominal} (${pct}%)`;
                }
              }
            }
          },
          cutout: "68%"
        }
      });
    }
  }

  // Chart 2: Komparasi Belanja Suami vs Istri
  const spouseCanvas = document.getElementById("spouseComparisonChart");
  if (spouseCanvas && window.Chart) {
    if (AppState.spouseComparisonChart) AppState.spouseComparisonChart.destroy();

    const sExp = Number(metrics.suamiExpense) || 0;
    const iExp = Number(metrics.istriExpense) || 0;
    const totalSpouse = sExp + iExp;

    const sPct = totalSpouse > 0 ? Math.round((sExp / totalSpouse) * 100) : 0;
    const iPct = totalSpouse > 0 ? Math.round((iExp / totalSpouse) * 100) : 0;

    AppState.spouseComparisonChart = new Chart(spouseCanvas, {
      type: "bar",
      data: {
        labels: [`👨 Baba (${sPct}%)`, `👩 Umma (${iPct}%)`],
        datasets: [{
          label: "Total Belanja",
          data: [sExp, iExp],
          backgroundColor: ["#0ea5e9", "#ec4899"],
          hoverBackgroundColor: ["#0284c7", "#db2777"],
          borderRadius: 10,
          borderSkipped: false,
          barPercentage: 0.55
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800 },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              font: { size: 9 },
              callback: function (val) {
                if (isPrivacy) return "•••";
                if (val >= 1000000) return (val / 1000000).toFixed(1) + " Jt";
                if (val >= 1000) return (val / 1000).toFixed(0) + " Rb";
                return val;
              }
            },
            grid: { color: "#f1f5f9" }
          },
          x: {
            ticks: { font: { size: 10, weight: "bold" }, color: "#334155" },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function (context) {
                const val = context.parsed.y;
                const pct = totalSpouse > 0 ? ((val / totalSpouse) * 100).toFixed(1) : 0;
                const nominal = isPrivacy ? "Rp ••••••••" : (window.DateHelper ? window.DateHelper.formatRupiah(val, true) : `Rp ${val.toLocaleString('id-ID')}`);
                return ` Belanja: ${nominal} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }
}

// Render Dashboard Usaha Ibu
function renderIbuDashboard() {
  const txs = getIbuTransactions();
  const kostSummary = window.IbuKostModule ? window.IbuKostModule.getKostSummary() : { totalReceived: 0, totalPending: 0 };
  const gasInv = window.IbuGasModule ? window.IbuGasModule.getGasInventory() : { tabungIsi: 0, tabungKosong: 0 };

  const elKostReceived = document.getElementById("ibuKostReceived");
  const elKostPending = document.getElementById("ibuKostPending");
  const elGasReady = document.getElementById("ibuGasReady");
  const elGasEmpty = document.getElementById("ibuGasEmpty");
  const elSocialTotal = document.getElementById("ibuSocialTotal");
  const elSocialCount = document.getElementById("ibuSocialCount");

  if (elKostReceived) elKostReceived.textContent = window.DateHelper.formatRupiah(kostSummary.totalReceived);
  if (elKostPending) elKostPending.textContent = window.DateHelper.formatRupiah(kostSummary.totalPending);
  if (elGasReady) elGasReady.textContent = `${gasInv.tabungIsi} Tabung`;
  if (elGasEmpty) elGasEmpty.textContent = `${gasInv.tabungKosong} Tabung`;

  // Hitung total sedekah & berbagi Usaha Ibu bulan ini
  const currentMonthWIB = new Date().toISOString().slice(0, 7); // YYYY-MM
  const socialTxs = txs.filter(t => {
    const isSocial = (t.category && (t.category.includes("Sedekah") || t.category.includes("Berbagi"))) || 
                     (t.note && (t.note.includes("Sedekah") || t.note.includes("Gratis") || t.note.includes("Bantuan") || t.note.includes("Mbah")));
    const txMonth = (t.date || "").slice(0, 7);
    return isSocial && (!txMonth || txMonth === currentMonthWIB);
  });

  const totalSocialAmount = socialTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  if (elSocialTotal) elSocialTotal.textContent = window.DateHelper.formatRupiah(totalSocialAmount);
  if (elSocialCount) elSocialCount.textContent = `${socialTxs.length} kali berbagi`;

  if (typeof renderIbuTransactionList === "function") {
    renderIbuTransactionList();
  }
  if (window.MonthlyStatsModule && window.MonthlyStatsModule.renderMonthlyHelicopterView) {
    window.MonthlyStatsModule.renderMonthlyHelicopterView();
  }
}


// Update Transaksi Keluarga (Edit / CRUD Update & Backdate Support)
function updateTransaction(id, updatedData) {
  let txs = getKeluargaTransactions();
  const index = txs.findIndex(t => t.id === id);
  if (index === -1) return false;

  txs[index] = {
    ...txs[index],
    ...updatedData,
    updatedAt: Date.now()
  };

  // Urutkan transaksi berdasarkan tanggal terbaru (mendukung Backdate)
  txs.sort((a, b) => new Date(b.date) - new Date(a.date));
  saveKeluargaTransactions(txs);

  if (window.SyncModule) {
    window.SyncModule.pushTransactionToSyncQueue("update_keluarga_tx", txs[index]);
  }

  renderDashboard();
  return txs[index];
}

// Hapus Transaksi Keluarga (CRUD Delete)
function deleteTransaction(id) {
  let txs = getKeluargaTransactions();
  const txToDelete = txs.find(t => t.id === id);
  if (!txToDelete) return false;

  txs = txs.filter(t => t.id !== id);
  saveKeluargaTransactions(txs);

  if (window.SyncModule && window.SyncModule.markIdAsDeleted) {
    window.SyncModule.markIdAsDeleted(id);
  }

  if (window.SyncModule) {
    window.SyncModule.pushTransactionToSyncQueue("delete_keluarga_tx", { id });
  }

  renderDashboard();
  return true;
}


function getFilteredTransactions() {
  const metrics = calculateKeluargaMetrics();
  return metrics.filteredTxs;
}


const WALLET_KEY = "keuangan_keluarga_wallets";

function getWalletBalances() {
  const saved = localStorage.getItem(WALLET_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return {
    "Kas Tunai Suami": 500000,
    "Kas Dapur (Istri)": 750000,
    "Rekening BCA": 12500000,
    "ShopeePay (Istri)": 350000
  };
}

function setWalletBalances(wallets) {
  localStorage.setItem(WALLET_KEY, JSON.stringify(wallets));
  updateWalletDom();
}

function updateWalletDom() {
  const wallets = getWalletBalances();
  const isPrivacy = window.AuthModule ? window.AuthModule.isPrivacyMode() : false;
  const maskFn = (num) => isPrivacy ? "Rp ••••••••" : (window.DateHelper ? window.DateHelper.formatRupiah(num) : "Rp " + num.toLocaleString("id-ID"));

  document.querySelectorAll(".wallet-val").forEach(el => {
    const parentText = el.parentElement.textContent || "";
    if (parentText.includes("Baba Pangestu")) el.textContent = maskFn(wallets["Kas Tunai Suami"] || 0);
    else if (parentText.includes("Umma Atin")) el.textContent = maskFn(wallets["Kas Dapur (Istri)"] || 0);
    else if (parentText.includes("BCA")) el.textContent = maskFn(wallets["Rekening BCA"] || 0);
    else if (parentText.includes("ShopeePay")) el.textContent = maskFn(wallets["ShopeePay (Istri)"] || 0);
  });
}

// Reset Semua Data ke Rp 0 Bersih
// Reset Semua Data ke Rp 0 Bersih Total
function resetAllDataToZero() {
  // 1. Kosongkan transaksi
  saveKeluargaTransactions([]);
  saveIbuTransactions([]);

  // 2. Kosongkan saldo dompet ke 0
  setWalletBalances({
    "Kas Baba Pangestu": 0,
    "Kas Dapur Umma Atin": 0,
    "Rekening BCA": 0,
    "ShopeePay": 0
  });

  // 3. Kosongkan tagihan bulanan (Tagihan Sisa = Rp 0)
  if (window.BillsModule && window.BillsModule.saveMonthlyBills) {
    window.BillsModule.saveMonthlyBills([]);
  }

  // 4. Kosongkan investasi & aset (Net Worth = Rp 0)
  if (window.InvestmentsModule && window.InvestmentsModule.saveInvestmentsData) {
    window.InvestmentsModule.saveInvestmentsData({
      gold: [],
      mutualFunds: [],
      propertyRealAssets: [],
      debts: []
    });
  }

  // 5. Render ulang ke 0
  renderDashboard();
  renderIbuDashboard();
  updateWalletDom();
}


// ================= DYNAMIC WALLETS ENGINE =================
const DYNAMIC_WALLETS_KEY = "keuangan_keluarga_dynamic_wallets_v2";

const DEFAULT_DYNAMIC_WALLETS = [
  { id: "w_kas_suami", name: "Kas Baba Pangestu", balance: 0, type: "cash", owner: "suami", color: "slate" },
  { id: "w_kas_istri", name: "Kas Dapur Umma Atin", balance: 0, type: "cash", owner: "istri", color: "emerald" },
  { id: "w_bsi", name: "Bank BSI (Umma Atin)", balance: 0, type: "bank", owner: "istri", color: "teal" },
  { id: "w_bca", name: "Rekening BCA", balance: 0, type: "bank", owner: "suami", color: "blue" },
  { id: "w_flip", name: "Flip Saldo", balance: 0, type: "ewallet", owner: "keluarga", color: "orange" },
  { id: "w_shopee", name: "ShopeePay", balance: 0, type: "ewallet", owner: "istri", color: "pink" }
];

function getDynamicWallets() {
  const saved = localStorage.getItem(DYNAMIC_WALLETS_KEY);
  if (saved !== null) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return DEFAULT_DYNAMIC_WALLETS;
}

function saveDynamicWallets(wallets) {
  localStorage.setItem(DYNAMIC_WALLETS_KEY, JSON.stringify(wallets));
  renderDynamicWalletBar();
  populateDynamicWalletDropdowns();
}

function addDynamicWallet(name, initialBalance = 0, type = "bank", owner = "keluarga") {
  const wallets = getDynamicWallets();
  const newW = {
    id: "w_" + Date.now(),
    name: name.trim(),
    balance: Number(initialBalance) || 0,
    type,
    owner,
    color: type === "bank" ? "blue" : type === "cash" ? "emerald" : "orange"
  };
  wallets.push(newW);
  saveDynamicWallets(wallets);
  return newW;
}

function updateDynamicWallet(id, name, balance) {
  const wallets = getDynamicWallets();
  const w = wallets.find(x => x.id === id);
  if (w) {
    w.name = name.trim();
    w.balance = Number(balance) || 0;
    saveDynamicWallets(wallets);
  }
}

function deleteDynamicWallet(id) {
  let wallets = getDynamicWallets();
  if (wallets.length <= 1) {
    alert("Minimal harus ada 1 dompet!");
    return false;
  }
  wallets = wallets.filter(x => x.id !== id);
  saveDynamicWallets(wallets);
  return true;
}

// Render dynamic wallet strip in UI
function renderDynamicWalletBar() {
  const container = document.getElementById("dynamicWalletBar");
  if (!container) return;

  const wallets = getDynamicWallets();
  const isPrivacy = window.AuthModule ? window.AuthModule.isPrivacyMode() : false;
  const maskFn = (num) => isPrivacy ? "Rp ••••••••" : (window.DateHelper ? window.DateHelper.formatRupiah(num) : "Rp " + Number(num).toLocaleString("id-ID"));

  container.innerHTML = wallets.map(w => {
    let colorClass = "bg-slate-100 border-slate-200 text-slate-700";
    if (w.name.includes("BSI")) colorClass = "bg-teal-50 border-teal-200 text-teal-900";
    else if (w.name.includes("BCA")) colorClass = "bg-blue-50 border-blue-200 text-blue-900";
    else if (w.name.includes("Flip")) colorClass = "bg-orange-50 border-orange-200 text-orange-900";
    else if (w.name.includes("Shopee")) colorClass = "bg-pink-50 border-pink-200 text-pink-900";
    else if (w.name.includes("Dapur") || w.name.includes("Umma")) colorClass = "bg-emerald-50 border-emerald-200 text-emerald-900";

    return `
      <div class="px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shrink-0 text-xs font-bold ${colorClass}">
        <span class="text-[10px] opacity-75">${w.name}:</span>
        <span class="font-extrabold">${maskFn(w.balance)}</span>
      </div>
    `;
  }).join("");
}

// Populate all wallet select elements
function populateDynamicWalletDropdowns() {
  const wallets = getDynamicWallets();
  const selects = [document.getElementById("txWalletSelect"), document.getElementById("editTxWallet")];

  selects.forEach(sel => {
    if (sel) {
      sel.innerHTML = wallets.map(w => `<option value="${w.name}">${w.name}</option>`).join("");
    }
  });
}

// ================= DYNAMIC QUICK PRESETS ENGINE =================
const PRESETS_STORAGE_KEY = "keuangan_keluarga_quick_presets_v2";

const DEFAULT_DYNAMIC_PRESETS = [
  { id: "p_bensin_20", label: "⛽ Bensin 20rb", amount: 20000, category: "Kebutuhan Mingguan Dapur & Rumah", subCategory: "Bensin Motor / Mobil Mingguan", wallet: "Kas Baba Pangestu", user: "suami", note: "Bensin Motor" },
  { id: "p_bensin_50", label: "⛽ Bensin 50rb", amount: 50000, category: "Kebutuhan Mingguan Dapur & Rumah", subCategory: "Bensin Motor / Mobil Mingguan", wallet: "Kas Baba Pangestu", user: "suami", note: "Bensin Mobil" },
  { id: "p_galon", label: "💧 Galon 20rb", amount: 20000, category: "Kebutuhan Mingguan Dapur & Rumah", subCategory: "Isi Ulang Air Galon", wallet: "Kas Dapur Umma Atin", user: "istri", note: "Air Galon Minum" },
  { id: "p_gas", label: "🍳 Gas LPG 22rb", amount: 22000, category: "Kebutuhan Mingguan Dapur & Rumah", subCategory: "Gas LPG 3kg Masak", wallet: "Kas Dapur Umma Atin", user: "istri", note: "Gas LPG 3kg" },
  { id: "p_jajan", label: "☕ Jajan 15rb", amount: 15000, category: "Jajan & Harian", subCategory: "Jajan Kopi & Cemilan Sore", wallet: "Kas Baba Pangestu", user: "suami", note: "Jajan / Kopi" }
];

function getDynamicPresets() {
  const saved = localStorage.getItem(PRESETS_STORAGE_KEY);
  if (saved !== null) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return DEFAULT_DYNAMIC_PRESETS;
}

function saveDynamicPresets(presets) {
  localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  renderDynamicPresetsBar();
}

function addDynamicPreset(label, amount, category, subCategory, wallet, user, note) {
  const presets = getDynamicPresets();
  presets.push({
    id: "p_" + Date.now(),
    label: label.trim(),
    amount: Number(amount) || 0,
    category: category || "Kebutuhan Mingguan Dapur & Rumah",
    subCategory: subCategory || label.trim(),
    wallet: wallet || "Kas Dapur Umma Atin",
    user: user || "istri",
    note: note || label.trim()
  });
  saveDynamicPresets(presets);
}

function deleteDynamicPreset(id) {
  let presets = getDynamicPresets();
  presets = presets.filter(p => p.id !== id);
  saveDynamicPresets(presets);
}

function updateDynamicPreset(id, updated) {
  const presets = getDynamicPresets();
  const idx = presets.findIndex(p => p.id === id);
  if (idx !== -1) {
    presets[idx] = { ...presets[idx], ...updated };
    saveDynamicPresets(presets);
    return presets[idx];
  }
  return null;
}

function renderDynamicPresetsBar() {
  const container = document.getElementById("dynamicPresetsContainer");
  if (!container) return;

  const presets = getDynamicPresets();
  container.innerHTML = presets.map(p => `
    <button onclick="executeDynamicPreset('${p.id}')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-2xs">
      ${p.label}
    </button>
  `).join("");
}

function executeDynamicPreset(presetId) {
  const presets = getDynamicPresets();
  const p = presets.find(x => x.id === presetId);
  if (!p) return;

  window.AppModule.addTransaction({
    type: "expense",
    category: p.category,
    subCategory: p.subCategory,
    amount: p.amount,
    wallet: p.wallet,
    user: p.user,
    note: p.note,
    date: window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0]
  });

  if (window.showToast) {
    window.showToast(`Berhasil mencatat ${p.label} (${window.DateHelper.formatRupiah(p.amount)})! ✨`, "success");
  }
}


// Transfer Antar-Dompet (Pindah Saldo Kas / Rekening)
function transferBetweenWallets(fromWalletName, toWalletName, amount, note = "") {
  if (fromWalletName === toWalletName) {
    if (window.showToast) window.showToast("Dompet asal dan tujuan tidak boleh sama!", "error");
    return false;
  }

  const amt = Number(amount);
  if (!amt || amt <= 0) {
    if (window.showToast) window.showToast("Nominal transfer harus lebih dari 0!", "error");
    return false;
  }

  const wallets = getDynamicWallets();
  const fromW = wallets.find(w => w.name === fromWalletName);
  const toW = wallets.find(w => w.name === toWalletName);

  if (!fromW || !toW) {
    if (window.showToast) window.showToast("Dompet tidak ditemukan!", "error");
    return false;
  }

  fromW.balance -= amt;
  toW.balance += amt;
  saveDynamicWallets(wallets);

  // Catat transaksi mutasi
  const tx = {
    id: "tx_trf_" + Date.now(),
    type: "transfer",
    category: "Mutasi Antar Dompet",
    subCategory: `Pindah Saldo: ${fromWalletName} ➔ ${toWalletName}`,
    amount: amt,
    wallet: fromWalletName,
    user: "keluarga",
    note: note || `Transfer dari ${fromWalletName} ke ${toWalletName}`,
    date: window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0]
  };

  const txs = getKeluargaTransactions();
  txs.unshift(tx);
  saveKeluargaTransactions(txs);

  if (window.SyncModule) {
    window.SyncModule.pushTransactionToSyncQueue("transfer_wallets", { from: fromWalletName, to: toWalletName, amount: amt, note });
  }

  renderDashboard();
  if (window.showToast) {
    window.showToast(`Transfer Rp ${amt.toLocaleString("id-ID")} ke ${toWalletName} berhasil! ✨`, "success");
  }
  return true;
}

window.AppModule = {
  AppState,
  getKeluargaTransactions,
  saveKeluargaTransactions,
  getIbuTransactions,
  saveIbuTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  addIbuTransaction,
  updateIbuTransaction,
  deleteIbuTransaction,
  calculateKeluargaMetrics,
  getFilteredTransactions,
  initVoiceInput,
  renderDashboard,
  transferBetweenWallets,
  getDynamicWallets,
  saveDynamicWallets,
  addDynamicWallet,
  updateDynamicWallet,
  deleteDynamicWallet,
  renderDynamicWalletBar,
  populateDynamicWalletDropdowns,
  getDynamicPresets,
  saveDynamicPresets,
  addDynamicPreset,
  updateDynamicPreset,
  deleteDynamicPreset,
  renderDynamicPresetsBar,
  executeDynamicPreset,
  getWalletBalances,
  setWalletBalances,
  updateWalletDom,
  resetAllDataToZero,
  renderIbuDashboard
};
