/**
 * taxes-holidays.js - Modul Pajak Tahunan (PBB/STNK) & Tabungan Qurban / Hari Raya
 */

const TAXES_HOLIDAYS_KEY = "keuangan_keluarga_taxes_holidays";

function getTaxesAndHolidays() {
  const saved = localStorage.getItem(TAXES_HOLIDAYS_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return {
    taxes: [],
    qurban: {
      targetAmount: 3500000,
      collectedAmount: 0,
      targetYear: 2027,
      description: "1 Ekor Kambing Qurban Idul Adha"
    },
    lebaran: {
      targetAmount: 5000000,
      collectedAmount: 0,
      targetYear: 2027,
      description: "Baju Lebaran Anak & Istri, Kue Kering, THR Orang Tua & Mertua"
    }
  };
}

function saveTaxesAndHolidays(data) {
  localStorage.setItem(TAXES_HOLIDAYS_KEY, JSON.stringify(data));
}

function addSavingsToGoal(goalType, amount, wallet = "BCA") {
  const data = getTaxesAndHolidays();
  const amt = Number(amount);
  if (goalType === "qurban") {
    data.qurban.collectedAmount += amt;
  } else if (goalType === "lebaran") {
    data.lebaran.collectedAmount += amt;
  }
  saveTaxesAndHolidays(data);

  if (window.AppModule && window.AppModule.addTransaction) {
    window.AppModule.addTransaction({
      type: "expense",
      category: "Pajak, Ibadah & Tabungan Tahunan",
      subCategory: goalType === "qurban" ? "Tabungan Qurban Idul Adha" : "Anggaran Lebaran & THR Keluarga",
      amount: amt,
      wallet: wallet,
      note: `Setoran tabungan ${goalType}`,
      date: window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0]
    });
  }

  return true;
}

window.TaxesHolidaysModule = {
  getTaxesAndHolidays,
  saveTaxesAndHolidays,
  addSavingsToGoal
};
