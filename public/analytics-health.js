/**
 * analytics-health.js - Modul Analitik Cerdas, Rasio 50/30/20 & Kalkulator Zakat Mal
 * Catatan Keuangan Keluarga Baba Pangestu & Umma Atin
 */

// Kategori Kebutuhan Pokok (Needs - 50%)
const NEEDS_CATEGORIES = [
  "Dapur & Belanja Pasar", "Listrik & Air (PLN/PDAM)", "Pendidikan & Kuliah",
  "Kesehatan & Obat", "Servis Kendaraan & Bensin", "Bakti Orang Tua & Mertua",
  "Pajak & STNK", "Kebutuhan Rumah Tangga"
];

// Kategori Tabungan & Investasi (Savings - 20%)
const SAVINGS_CATEGORIES = [
  "Investasi Emas & Reksa Dana", "Dana Darurat", "Tabungan Impian", "Tabungan Umrah", "Qurban"
];

function analyzeRule503020(transactions = [], totalIncome = 0) {
  let needsAmount = 0;
  let wantsAmount = 0;
  let savingsAmount = 0;

  transactions.forEach(tx => {
    if (tx.type === "expense") {
      const cat = tx.category || "";
      if (NEEDS_CATEGORIES.some(n => cat.toLowerCase().includes(n.toLowerCase()))) {
        needsAmount += Number(tx.amount || 0);
      } else if (SAVINGS_CATEGORIES.some(s => cat.toLowerCase().includes(s.toLowerCase()))) {
        savingsAmount += Number(tx.amount || 0);
      } else {
        wantsAmount += Number(tx.amount || 0);
      }
    } else if (tx.type === "transfer" && (tx.category || "").toLowerCase().includes("tabungan")) {
      savingsAmount += Number(tx.amount || 0);
    }
  });

  const totalExpense = needsAmount + wantsAmount;
  const baseIncome = totalIncome > 0 ? totalIncome : (totalExpense + savingsAmount || 1);

  const needsPct = Math.round((needsAmount / baseIncome) * 100);
  const wantsPct = Math.round((wantsAmount / baseIncome) * 100);
  const savingsPct = Math.round((savingsAmount / baseIncome) * 100);

  return {
    baseIncome,
    needsAmount,
    wantsAmount,
    savingsAmount,
    needsPct,
    wantsPct,
    savingsPct,
    ideal: { needs: 50, wants: 30, savings: 20 }
  };
}

function calculateFinancialHealthScore(metrics, emergencyFundData, investmentsData) {
  let score = 0;
  const tips = [];

  const income = metrics.totalIncome || 0;
  const expense = metrics.totalExpense || 0;
  const balance = metrics.balance || 0;

  // 1. Arus Kas Positif (Max 30 Poin)
  if (income > expense) {
    const surplusRatio = income > 0 ? (income - expense) / income : 0;
    if (surplusRatio >= 0.2) {
      score += 30;
      tips.push("Arus kas keluarga sangat prima dengan surplus tabungan di atas 20%. Pertahankan!");
    } else {
      score += 20;
      tips.push("Arus kas positif, namun surplus masih tipis. Coba tekan pos pengeluaran sekunder.");
    }
  } else if (income === expense) {
    score += 10;
    tips.push("Arus kas seimbang (tidak ada tabungan sisa bulan ini).");
  } else {
    score += 0;
    tips.push("Pengeluaran melebihi pemasukan bulan ini! Segera evaluasi pos belanja non-pokok.");
  }

  // 2. Kesiapan Dana Darurat (Max 30 Poin)
  const efCurrent = emergencyFundData ? (emergencyFundData.currentAmount || 0) : 0;
  const efTarget = emergencyFundData ? (emergencyFundData.targetAmount || 30000000) : 30000000;
  const efRatio = efTarget > 0 ? efCurrent / efTarget : 0;

  if (efRatio >= 1) {
    score += 30;
    tips.push("Benteng pertahanan keluarga sempurna! Dana darurat telah mencapai target 100%.");
  } else if (efRatio >= 0.5) {
    score += 20;
    tips.push(`Dana darurat sudah terkumpul ${Math.round(efRatio * 100)}%. Selangkah lagi menuju target aman.`);
  } else if (efRatio > 0) {
    score += 10;
    tips.push("Dana darurat mulai terbentuk. Alokasikan minimal 10% pemasukan rutin ke sini.");
  } else {
    tips.push("Dana darurat masih 0. Prioritaskan pos ini untuk mengamankan kebutuhan tak terduga.");
  }

  // 3. Portofolio Aset & Investasi Emas/Reksadana (Max 20 Poin)
  const totalGold = investmentsData ? investmentsData.totalGoldValue || 0 : 0;
  const totalFunds = investmentsData ? investmentsData.totalFundsValue || 0 : 0;
  const totalInvest = totalGold + totalFunds;

  if (totalInvest >= 25000000) {
    score += 20;
    tips.push("Portofolio investasi keluarga (Emas Antam & Reksa Dana) bertumbuh sangat kokoh.");
  } else if (totalInvest > 0) {
    score += 12;
    tips.push("Bagus! Kebiasaan mencicil emas Antam dan investasi telah dimulai.");
  } else {
    score += 5;
    tips.push("Pertimbangkan mulai menabung emas fisik (1 gram) atau reksa dana pasar uang.");
  }

  // 4. Rasio Kebutuhan Terkendali (Max 20 Poin)
  const rule = analyzeRule503020(metrics.filteredTxs || [], income);
  if (rule.needsPct <= 55) {
    score += 20;
  } else if (rule.needsPct <= 70) {
    score += 12;
  } else {
    score += 5;
    tips.push("Biaya kebutuhan pokok memakan porsi besar (>70%). Cari alternatif belanja hemat.");
  }

  // Penentuan Grade
  let grade = "C";
  let statusText = "Perlu Perhatian";
  let colorClass = "text-amber-500";
  let badgeBg = "bg-amber-500/10 border-amber-500/30";

  if (score >= 85) {
    grade = "A+";
    statusText = "Finansial Sangat Sehat & Mandiri";
    colorClass = "text-emerald-500";
    badgeBg = "bg-emerald-500/10 border-emerald-500/30";
  } else if (score >= 70) {
    grade = "A";
    statusText = "Kondisi Sehat & Seimbang";
    colorClass = "text-emerald-400";
    badgeBg = "bg-emerald-400/10 border-emerald-400/30";
  } else if (score >= 50) {
    grade = "B";
    statusText = "Kondisi Cukup Baik";
    colorClass = "text-sky-500";
    badgeBg = "bg-sky-500/10 border-sky-500/30";
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    grade,
    statusText,
    colorClass,
    badgeBg,
    tips: tips.slice(0, 3)
  };
}

// Kalkulator Zakat Mal & Zakat Emas Syar'i
function calculateZakatMal(liquidCash = 0, goldGrams = 0, goldPricePerGram = 1450000) {
  const goldValue = Number(goldGrams) * Number(goldPricePerGram);
  const totalHarta = Number(liquidCash) + goldValue;
  
  // Nisab Zakat Mal = 85 gram emas murni
  const nisabRupiah = 85 * Number(goldPricePerGram);
  const isWajib = totalHarta >= nisabRupiah;
  const zakatAmount = isWajib ? Math.round(totalHarta * 0.025) : 0;

  return {
    liquidCash,
    goldGrams,
    goldPricePerGram,
    goldValue,
    totalHarta,
    nisabRupiah,
    isWajib,
    zakatAmount,
    nisabGrams: 85
  };
}

window.AnalyticsHealthModule = {
  analyzeRule503020,
  calculateFinancialHealthScore,
  calculateZakatMal
};
