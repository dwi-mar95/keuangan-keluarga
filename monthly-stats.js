/**
 * monthly-stats.js - Modul Statistik & Komparasi Bulanan (Helicopter View)
 * Analisis Multi-Bulan, Tren Cashflow, Perbandingan MoM (Month-over-Month), & Rasio Tabungan
 * Catatan Keuangan Keluarga Baba Pangestu & Umma Atin
 */

let activeHelicopterMonths = 6;
let activeHelicopterLedger = "keluarga"; // 'keluarga' (default terpisah) | 'ibu' | 'all'
let helicopterChartInstance = null;

const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", 
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

const MONTH_NAMES_FULL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

/**
 * Mengumpulkan transaksi sesuai filter ledger
 */
function getHelicopterSourceTransactions(ledger = "all") {
  const allTxs = [];

  // 1. Transaksi Keluarga
  if (ledger === "all" || ledger === "keluarga") {
    if (window.AppModule && window.AppModule.getKeluargaTransactions) {
      const kelTxs = window.AppModule.getKeluargaTransactions() || [];
      kelTxs.forEach(t => {
        allTxs.push({
          date: t.date,
          type: t.type, // 'income' | 'expense' | 'transfer'
          amount: Number(t.amount) || 0,
          category: t.category || "Lain-lain",
          source: "keluarga"
        });
      });
    }
  }

  // 2. Transaksi Usaha Ibu
  if (ledger === "all" || ledger === "ibu") {
    if (window.AppModule && window.AppModule.getIbuTransactions) {
      const ibuTxs = window.AppModule.getIbuTransactions() || [];
      ibuTxs.forEach(t => {
        allTxs.push({
          date: t.date,
          type: t.type, // 'income' | 'expense'
          amount: Number(t.amount) || 0,
          category: t.category || (t.unit === "kost" ? "Sewa Kost" : "Gas LPG"),
          source: "ibu"
        });
      });
    }
  }

  return allTxs;
}

/**
 * Menghasilkan statistik bulanan untuk N bulan terakhir
 */
function getMonthlyStatistics(monthsCount = 6, ledger = "all") {
  const txs = getHelicopterSourceTransactions(ledger);
  
  // Tentukan bulan referensi akhir (hari ini atau bulan transaksi terbaru)
  const now = new Date();
  const endYear = now.getFullYear();
  const endMonth = now.getMonth(); // 0-indexed

  const monthBuckets = [];

  for (let i = monthsCount - 1; i >= 0; i--) {
    const d = new Date(endYear, endMonth - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const yearMonth = `${y}-${String(m + 1).padStart(2, "0")}`;
    const daysInMonth = new Date(y, m + 1, 0).getDate();

    monthBuckets.push({
      yearMonth,
      year: y,
      monthIdx: m,
      shortLabel: `${MONTH_NAMES_SHORT[m]} '${String(y).slice(-2)}`,
      fullLabel: `${MONTH_NAMES_FULL[m]} ${y}`,
      daysInMonth,
      income: 0,
      expense: 0,
      netSavings: 0,
      savingsRate: 0,
      txCount: 0,
      dailyAvgExpense: 0
    });
  }

  // Kelompokkan setiap transaksi ke bulan yang tepat
  txs.forEach(t => {
    if (!t.date || !t.amount) return;
    const tDate = new Date(t.date);
    if (isNaN(tDate.getTime())) return;

    const y = tDate.getFullYear();
    const m = tDate.getMonth();
    const ym = `${y}-${String(m + 1).padStart(2, "0")}`;

    const bucket = monthBuckets.find(b => b.yearMonth === ym);
    if (bucket) {
      bucket.txCount++;
      if (t.type === "income") {
        bucket.income += t.amount;
      } else if (t.type === "expense") {
        bucket.expense += t.amount;
      }
    }
  });

  // Hitung net savings, savings rate, dan rata-rata harian
  monthBuckets.forEach(b => {
    b.netSavings = b.income - b.expense;
    b.savingsRate = b.income > 0 ? Math.max(-100, Math.min(100, Math.round((b.netSavings / b.income) * 100))) : (b.expense > 0 ? -100 : 0);
    b.dailyAvgExpense = b.daysInMonth > 0 ? Math.round(b.expense / b.daysInMonth) : 0;
  });

  // Hitung MoM (Month-over-Month) perbandingan antara bulan berjalan vs bulan lalu
  const curMonth = monthBuckets[monthBuckets.length - 1] || null;
  const prevMonth = monthBuckets.length >= 2 ? monthBuckets[monthBuckets.length - 2] : null;

  let momIncomePct = 0;
  let momExpensePct = 0;
  let momSavingsPct = 0;

  if (curMonth && prevMonth) {
    if (prevMonth.income > 0) {
      momIncomePct = Math.round(((curMonth.income - prevMonth.income) / prevMonth.income) * 100);
    } else if (curMonth.income > 0) {
      momIncomePct = 100;
    }

    if (prevMonth.expense > 0) {
      momExpensePct = Math.round(((curMonth.expense - prevMonth.expense) / prevMonth.expense) * 100);
    } else if (curMonth.expense > 0) {
      momExpensePct = 100;
    }

    if (prevMonth.netSavings !== 0) {
      momSavingsPct = Math.round(((curMonth.netSavings - prevMonth.netSavings) / Math.abs(prevMonth.netSavings)) * 100);
    }
  }

  // Rata-rata keseluruhan periode
  const totalPeriodIncome = monthBuckets.reduce((acc, b) => acc + b.income, 0);
  const totalPeriodExpense = monthBuckets.reduce((acc, b) => acc + b.expense, 0);
  const totalPeriodSavings = totalPeriodIncome - totalPeriodExpense;
  const avgMonthlyIncome = Math.round(totalPeriodIncome / monthsCount);
  const avgMonthlyExpense = Math.round(totalPeriodExpense / monthsCount);
  const avgMonthlySavings = Math.round(totalPeriodSavings / monthsCount);

  return {
    months: monthBuckets,
    curMonth,
    prevMonth,
    momIncomePct,
    momExpensePct,
    momSavingsPct,
    totalPeriodIncome,
    totalPeriodExpense,
    totalPeriodSavings,
    avgMonthlyIncome,
    avgMonthlyExpense,
    avgMonthlySavings
  };
}

/**
 * Render visualisasi Helicopter View di dashboard
 */
function renderMonthlyHelicopterView() {
  const container = document.getElementById("helicopterStatsContainer");
  if (!container) return;

  const stats = getMonthlyStatistics(activeHelicopterMonths, activeHelicopterLedger);
  const cur = stats.curMonth || { income: 0, expense: 0, netSavings: 0, savingsRate: 0, dailyAvgExpense: 0 };
  const prev = stats.prevMonth || { income: 0, expense: 0, netSavings: 0 };

  const formatRp = (num) => window.DateHelper ? window.DateHelper.formatRupiah(num) : "Rp " + Number(num || 0).toLocaleString("id-ID");

  container.innerHTML = `
    <!-- Control Bar Atas -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-base shadow-sm">
          🚁
        </div>
        <div>
          <h3 class="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            Helicopter View: Statistik & Komparasi Bulanan
          </h3>
          <p class="text-[10.5px] text-slate-400 font-medium">Tren arus kas, perbandingan antar-bulan, & analisis tabungan</p>
        </div>
      </div>

      <!-- Filter Controls -->
      <div class="flex items-center gap-2 flex-wrap text-xs">
        <select id="selHelicopterLedger" onchange="window.MonthlyStatsModule.setLedgerFilter(this.value)" class="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-700 outline-none cursor-pointer">
          <option value="all" ${activeHelicopterLedger === 'all' ? 'selected' : ''}>🌐 Gabungan (Keluarga + Usaha)</option>
          <option value="keluarga" ${activeHelicopterLedger === 'keluarga' ? 'selected' : ''}>👨‍👩‍👧 Keuangan Keluarga</option>
          <option value="ibu" ${activeHelicopterLedger === 'ibu' ? 'selected' : ''}>🏠 Usaha Ibu (Kost & Gas)</option>
        </select>

        <select id="selHelicopterMonths" onchange="window.MonthlyStatsModule.setMonthsFilter(this.value)" class="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-700 outline-none cursor-pointer">
          <option value="3" ${activeHelicopterMonths === 3 ? 'selected' : ''}>3 Bulan Terakhir</option>
          <option value="6" ${activeHelicopterMonths === 6 ? 'selected' : ''}>6 Bulan Terakhir</option>
          <option value="12" ${activeHelicopterMonths === 12 ? 'selected' : ''}>12 Bulan (1 Tahun)</option>
        </select>
      </div>
    </div>

    <!-- 4 KPI Komparasi MoM (Month-over-Month) -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
      <!-- 1. Pemasukan MoM -->
      <div class="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1">
        <div class="flex justify-between items-center text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
          <span>Pemasukan Bulan Ini</span>
          <span class="px-1.5 py-0.5 rounded font-black text-[9.5px] ${stats.momIncomePct >= 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-100 text-rose-800'}">
            ${stats.momIncomePct >= 0 ? '↗ +' : '↘ '}${stats.momIncomePct}%
          </span>
        </div>
        <div class="text-base font-black text-emerald-700">${formatRp(cur.income)}</div>
        <div class="text-[9.5px] text-emerald-600 font-medium truncate">vs ${formatRp(prev.income)} (Bln lalu)</div>
      </div>

      <!-- 2. Pengeluaran MoM -->
      <div class="p-3 rounded-2xl bg-rose-50/70 border border-rose-100 space-y-1">
        <div class="flex justify-between items-center text-[10px] font-bold text-rose-800 uppercase tracking-wider">
          <span>Pengeluaran Bulan Ini</span>
          <span class="px-1.5 py-0.5 rounded font-black text-[9.5px] ${stats.momExpensePct <= 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'}">
            ${stats.momExpensePct <= 0 ? '🟢 ' + stats.momExpensePct + '% (Hemat)' : '🔴 +' + stats.momExpensePct + '%'}
          </span>
        </div>
        <div class="text-base font-black text-rose-700">${formatRp(cur.expense)}</div>
        <div class="text-[9.5px] text-rose-600 font-medium truncate">vs ${formatRp(prev.expense)} (Bln lalu)</div>
      </div>

      <!-- 3. Tabungan / Surplus Bersih -->
      <div class="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-1">
        <div class="flex justify-between items-center text-[10px] font-bold text-blue-800 uppercase tracking-wider">
          <span>Surplus / Tabungan</span>
          <span class="px-1.5 py-0.5 rounded font-black text-[9.5px] ${cur.savingsRate >= 20 ? 'bg-emerald-200 text-emerald-900' : (cur.savingsRate > 0 ? 'bg-blue-200 text-blue-900' : 'bg-rose-200 text-rose-900')}">
            ${cur.savingsRate}% Rate
          </span>
        </div>
        <div class="text-base font-black ${cur.netSavings >= 0 ? 'text-blue-700' : 'text-rose-600'}">${formatRp(cur.netSavings)}</div>
        <div class="text-[9.5px] text-blue-600 font-medium truncate">Rata-rata: ${formatRp(stats.avgMonthlySavings)}/bln</div>
      </div>

      <!-- 4. Rata-rata Pengeluaran Harian -->
      <div class="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 space-y-1">
        <div class="flex justify-between items-center text-[10px] font-bold text-amber-800 uppercase tracking-wider">
          <span>Rata-rata / Hari</span>
          <span class="text-[9px] text-amber-700 font-black">${cur.daysInMonth} Hari</span>
        </div>
        <div class="text-base font-black text-amber-800">${formatRp(cur.dailyAvgExpense)}</div>
        <div class="text-[9.5px] text-amber-700 font-medium truncate">Rata-rata bulanan: ${formatRp(stats.avgMonthlyExpense)}</div>
      </div>
    </div>

    <!-- Grafik Multi-Bulan (Chart.js) -->
    <div class="space-y-2 pt-2">
      <div class="flex items-center justify-between">
        <div class="text-[11px] font-black text-slate-700 flex items-center gap-1.5">
          <span>📊</span> Tren Perbandingan Pemasukan vs Pengeluaran (${activeHelicopterMonths} Bulan):
        </div>
        <div class="flex items-center gap-3 text-[10px] font-bold text-slate-500">
          <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span> Masuk</span>
          <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span> Keluar</span>
          <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block"></span> Surplus</span>
        </div>
      </div>
      <div class="h-64 relative bg-slate-50/50 p-2 rounded-2xl border border-slate-100">
        <canvas id="helicopterTrendsChart"></canvas>
      </div>
    </div>

    <!-- Tabel Komparasi Rinci Bulan demi Bulan -->
    <div class="space-y-2 pt-2">
      <div class="text-[11px] font-black text-slate-700 flex items-center gap-1.5">
        <span>📑</span> Rincian Komparasi Bulanan (Helicopter Breakdown):
      </div>
      <div class="overflow-x-auto rounded-xl border border-slate-200">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-600 uppercase tracking-wider">
            <tr>
              <th class="px-3 py-2.5">Bulan</th>
              <th class="px-3 py-2.5">Pemasukan</th>
              <th class="px-3 py-2.5">Pengeluaran</th>
              <th class="px-3 py-2.5">Surplus / Defisit</th>
              <th class="px-3 py-2.5 text-center">Savings Rate</th>
              <th class="px-3 py-2.5">Rata-rata/Hari</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            ${stats.months.slice().reverse().map((m, idx) => {
              const isCur = idx === 0;
              const isSurplus = m.netSavings >= 0;
              return `
                <tr class="${isCur ? 'bg-purple-50/40 font-bold' : 'hover:bg-slate-50/80'} transition-colors">
                  <td class="px-3 py-2.5 whitespace-nowrap">
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-black text-slate-900">${m.fullLabel}</span>
                      ${isCur ? '<span class="text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-full font-black">Bulan Ini</span>' : ''}
                    </div>
                  </td>
                  <td class="px-3 py-2.5 text-emerald-600 font-black whitespace-nowrap">
                    +${formatRp(m.income)}
                  </td>
                  <td class="px-3 py-2.5 text-rose-600 font-black whitespace-nowrap">
                    -${formatRp(m.expense)}
                  </td>
                  <td class="px-3 py-2.5 whitespace-nowrap font-black ${isSurplus ? 'text-blue-600' : 'text-rose-600'}">
                    ${isSurplus ? '+' : ''}${formatRp(m.netSavings)}
                  </td>
                  <td class="px-3 py-2.5 text-center whitespace-nowrap">
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${m.savingsRate >= 20 ? 'bg-emerald-100 text-emerald-800' : (m.savingsRate > 0 ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800')}">
                      ${m.savingsRate}%
                    </span>
                  </td>
                  <td class="px-3 py-2.5 text-slate-500 whitespace-nowrap text-[11px]">
                    ${formatRp(m.dailyAvgExpense)}
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Render Chart.js
  renderHelicopterChart(stats.months);
}

/**
 * Render Chart.js Multi-Bar Tren Bulanan
 */
function renderHelicopterChart(months) {
  const canvas = document.getElementById("helicopterTrendsChart");
  if (!canvas || !window.Chart) return;

  if (helicopterChartInstance) {
    helicopterChartInstance.destroy();
  }

  const labels = months.map(m => m.shortLabel);
  const incomeData = months.map(m => m.income);
  const expenseData = months.map(m => m.expense);
  const savingsData = months.map(m => m.netSavings);

  helicopterChartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Pemasukan",
          data: incomeData,
          backgroundColor: "#10b981",
          borderRadius: 6,
          maxBarThickness: 28
        },
        {
          label: "Pengeluaran",
          data: expenseData,
          backgroundColor: "#f43f5e",
          borderRadius: 6,
          maxBarThickness: 28
        },
        {
          label: "Surplus / Tabungan",
          data: savingsData,
          backgroundColor: "#3b82f6",
          borderRadius: 6,
          maxBarThickness: 28
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          display: false // Sudah ada legend custom di atas
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const val = context.parsed.y || 0;
              const label = context.dataset.label || "";
              const formatted = window.DateHelper ? window.DateHelper.formatRupiah(val) : "Rp " + val.toLocaleString("id-ID");
              return ` ${label}: ${formatted}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 10,
              weight: "bold"
            },
            color: "#64748b"
          }
        },
        y: {
          grid: {
            color: "#f1f5f9"
          },
          ticks: {
            font: {
              size: 9
            },
            color: "#94a3b8",
            callback: function(value) {
              if (Math.abs(value) >= 1000000) {
                return (value / 1000000).toFixed(1) + " Jt";
              } else if (Math.abs(value) >= 1000) {
                return (value / 1000).toFixed(0) + " Rb";
              }
              return value;
            }
          }
        }
      }
    }
  });
}

function setMonthsFilter(months) {
  activeHelicopterMonths = Number(months) || 6;
  renderMonthlyHelicopterView();
}

function setLedgerFilter(ledger) {
  activeHelicopterLedger = ledger || "all";
  renderMonthlyHelicopterView();
}

window.MonthlyStatsModule = {
  getMonthlyStatistics,
  renderMonthlyHelicopterView,
  setMonthsFilter,
  setLedgerFilter
};
