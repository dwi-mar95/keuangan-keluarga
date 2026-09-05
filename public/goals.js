/**
 * goals.js - Modul Celengan Target Impian Keluarga (Financial Goals Tracker)
 * Catatan Keuangan Keluarga Baba Pangestu & Umma Atin
 */

const GOALS_STORAGE_KEY = "keuangan_keluarga_financial_goals";

const DEFAULT_FAMILY_GOALS = [
  {
    id: "goal_1",
    title: "Qurban Kambing / Sapi",
    targetAmount: 4000000,
    currentAmount: 0,
    deadline: "2027-05-31",
    icon: "🐐",
    category: "Ibadah",
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "goal_2",
    title: "Tabungan Umrah Baba & Umma",
    targetAmount: 55000000,
    currentAmount: 0,
    deadline: "2027-11-30",
    icon: "🕋",
    category: "Ibadah & Spiritual",
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "goal_3",
    title: "Liburan Keluarga Akhir Tahun",
    targetAmount: 6500000,
    currentAmount: 0,
    deadline: "2026-12-20",
    icon: "🏖️",
    category: "Keluarga & Rekreasi",
    createdAt: "2026-02-01T00:00:00.000Z"
  }
];

function getGoals() {
  const saved = localStorage.getItem(GOALS_STORAGE_KEY);
  if (saved !== null) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.warn("Gagal membaca goals dari local storage", e);
    }
  }
  return DEFAULT_FAMILY_GOALS;
}

function saveGoals(goals) {
  localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  if (window.AppModule && window.AppModule.renderDashboard) {
    window.AppModule.renderDashboard();
  }
  if (window.SyncModule && window.SyncModule.pushTransactionToSyncQueue) {
    window.SyncModule.pushTransactionToSyncQueue("sync_goals", { goals });
  }
}

function addGoal(title, targetAmount, deadline, icon = "🎯", category = "Umum") {
  if (!title || !targetAmount) return false;
  const goals = getGoals();
  const newGoal = {
    id: "goal_" + Date.now(),
    title: title.trim(),
    targetAmount: Number(targetAmount) || 0,
    currentAmount: 0,
    deadline: deadline || "",
    icon: icon.trim() || "🎯",
    category: category.trim() || "Umum",
    createdAt: new Date().toISOString()
  };
  goals.push(newGoal);
  saveGoals(goals);
  return true;
}

function depositToGoal(goalId, amount, walletSource = "Rekening BCA") {
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) return false;

  const goals = getGoals();
  const goal = goals.find(g => g.id === goalId);
  if (!goal) return false;

  goal.currentAmount = (Number(goal.currentAmount) || 0) + numAmount;
  saveGoals(goals);

  // Catat transaksi otomatis di Kas Keluarga (Pindah Saldo / Tabungan)
  if (window.AppModule && window.AppModule.addTransaction) {
    window.AppModule.addTransaction({
      id: "tx_goal_" + Date.now(),
      date: new Date().toISOString(),
      type: "transfer",
      category: "Tabungan Impian",
      subCategory: goal.title,
      amount: numAmount,
      wallet: walletSource,
      user: "keluarga",
      note: `Setoran Celengan: ${goal.title}`
    });
  }

  return true;
}

function withdrawFromGoal(goalId, amount, walletDestination = "Rekening BCA") {
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) return false;

  const goals = getGoals();
  const goal = goals.find(g => g.id === goalId);
  if (!goal) return false;

  if (goal.currentAmount < numAmount) {
    if (window.showToast) window.showToast("Saldo celengan tidak mencukupi!", "error");
    return false;
  }

  goal.currentAmount -= numAmount;
  saveGoals(goals);

  // Catat pengembalian ke dompet
  if (window.AppModule && window.AppModule.addTransaction) {
    window.AppModule.addTransaction({
      id: "tx_goal_wd_" + Date.now(),
      date: new Date().toISOString(),
      type: "income",
      category: "Pencairan Tabungan",
      subCategory: goal.title,
      amount: numAmount,
      wallet: walletDestination,
      user: "keluarga",
      note: `Tarik dari Celengan: ${goal.title}`
    });
  }

  return true;
}

function deleteGoal(goalId) {
  let goals = getGoals();
  goals = goals.filter(g => g.id !== goalId);
  saveGoals(goals);
  return true;
}

function updateGoal(goalId, updatedData) {
  const goals = getGoals();
  const goal = goals.find(g => g.id === goalId);
  if (!goal) return false;

  if (updatedData.title !== undefined) goal.title = updatedData.title.trim();
  if (updatedData.targetAmount !== undefined) goal.targetAmount = Number(updatedData.targetAmount) || 0;
  if (updatedData.currentAmount !== undefined) goal.currentAmount = Math.max(0, Number(updatedData.currentAmount) || 0);
  if (updatedData.deadline !== undefined) goal.deadline = updatedData.deadline;
  if (updatedData.icon !== undefined) goal.icon = updatedData.icon;
  if (updatedData.category !== undefined) goal.category = updatedData.category;

  saveGoals(goals);
  return goal;
}

function calculateGoalsSummary() {
  const goals = getGoals();
  const totalTarget = goals.reduce((sum, g) => sum + Number(g.targetAmount || 0), 0);
  const totalSaved = goals.reduce((sum, g) => sum + Number(g.currentAmount || 0), 0);
  const overallPercentage = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  return {
    totalGoals: goals.length,
    totalTarget,
    totalSaved,
    overallPercentage,
    remainingTarget: Math.max(0, totalTarget - totalSaved)
  };
}

window.GoalsModule = {
  getGoals,
  saveGoals,
  addGoal,
  updateGoal,
  depositToGoal,
  withdrawFromGoal,
  deleteGoal,
  calculateGoalsSummary
};
