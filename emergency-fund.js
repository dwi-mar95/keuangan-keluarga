/**
 * emergency-fund.js - Modul Dana Darurat Keluarga (3/6/12 Bulan)
 */

const EMERGENCY_FUND_KEY = "keuangan_keluarga_emergency_fund";

function getEmergencyFundData() {
  const saved = localStorage.getItem(EMERGENCY_FUND_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return {
    monthlyExpenseBaseline: 0, // Dihitung dari pengeluaran riil
    multiplierMonths: 6,       // Target 6 bulan biaya hidup
    currentSaved: 0,           // Dana darurat yang tersimpan saat ini
    history: []
  };
}

function saveEmergencyFundData(data) {
  localStorage.setItem(EMERGENCY_FUND_KEY, JSON.stringify(data));
}

function calculateEmergencyMetrics() {
  const data = getEmergencyFundData();
  const targetGoal = data.monthlyExpenseBaseline * data.multiplierMonths;
  const progressPct = Math.min(100, Math.round((data.currentSaved / targetGoal) * 100));
  
  let status = "aman";
  let statusLabel = "SANGAT AMAN (Siap Melindungi Keluarga)";
  let statusColor = "emerald";

  if (progressPct < 50) {
    status = "bahaya";
    statusLabel = "PERLU DITAMBAH (Di Bawah 50%)";
    statusColor = "rose";
  } else if (progressPct < 90) {
    status = "cukup";
    statusLabel = "CUKUP (Tetap Tambah Perlahan)";
    statusColor = "amber";
  }

  return {
    monthlyBaseline: data.monthlyExpenseBaseline,
    multiplierMonths: data.multiplierMonths,
    targetGoal,
    currentSaved: data.currentSaved,
    progressPct,
    status,
    statusLabel,
    statusColor
  };
}

function depositEmergencyFund(amount, wallet = "BCA") {
  const data = getEmergencyFundData();
  const amt = Number(amount);
  data.currentSaved += amt;
  data.history.unshift({
    id: "ef_" + Date.now(),
    type: "deposit",
    amount: amt,
    date: window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0],
    note: "Setoran dana darurat keluarga"
  });
  saveEmergencyFundData(data);

  if (window.AppModule && window.AppModule.addTransaction) {
    window.AppModule.addTransaction({
      type: "expense",
      category: "Pajak, Ibadah & Tabungan Tahunan",
      subCategory: "Dana Darurat & Logam Mulia Emas",
      amount: amt,
      wallet: wallet,
      note: "Setoran alokasi dana darurat keluarga",
      date: window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0]
    });
  }

  return true;
}

window.EmergencyFundModule = {
  getEmergencyFundData,
  saveEmergencyFundData,
  calculateEmergencyMetrics,
  depositEmergencyFund
};
