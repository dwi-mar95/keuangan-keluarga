/**
 * education.js - Modul Pendidikan Sekolah Anak & Kuliah/Kursus Istri
 */

const EDUCATION_STORAGE_KEY = "keuangan_keluarga_education_plans";

function getEducationPlans() {
  const saved = localStorage.getItem(EDUCATION_STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return [];
}

function saveEducationPlans(plans) {
  localStorage.setItem(EDUCATION_STORAGE_KEY, JSON.stringify(plans));
  if (window.SyncModule && window.SyncModule.pushTransactionToSyncQueue) {
    window.SyncModule.pushTransactionToSyncQueue("sync_education", { plans });
  }
}

function payEducationFee(planId, payAmount = null, wallet = "BCA") {
  const plans = getEducationPlans();
  const plan = plans.find(p => p.id === planId);
  if (!plan) return false;

  const cost = payAmount || plan.amount;

  if (window.AppModule && window.AppModule.addTransaction) {
    window.AppModule.addTransaction({
      type: "expense",
      category: "Biaya Per Semester (Anak & Istri)",
      subCategory: `${plan.person}: ${plan.title}`,
      amount: cost,
      wallet: wallet,
      note: `Pembayaran ${plan.title} (${plan.person})`,
      date: window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0]
    });
  }

  return true;
}

window.EducationModule = {
  getEducationPlans,
  saveEducationPlans,
  payEducationFee
};
