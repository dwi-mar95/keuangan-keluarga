
const INVESTMENTS_STORAGE_KEY = "keuangan_keluarga_investments";

function getInvestmentsData() {
  const saved = localStorage.getItem(INVESTMENTS_STORAGE_KEY);
  if (saved !== null) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return {
    gold: [],
    mutualFunds: [],
    propertyRealAssets: [],
    debts: []
  };
}

function saveInvestmentsData(data) {
  localStorage.setItem(INVESTMENTS_STORAGE_KEY, JSON.stringify(data));
  if (window.AppModule && window.AppModule.renderDashboard) {
    window.AppModule.renderDashboard();
  }
  if (window.SyncModule && window.SyncModule.pushTransactionToSyncQueue) {
    window.SyncModule.pushTransactionToSyncQueue("sync_investments", { investments: data });
  }
}

function addGoldItem(brand, grams, buyPrice, currentPrice) {
  const data = getInvestmentsData();
  data.gold.push({
    id: "g_" + Date.now(),
    brand: brand.trim() || "Antam",
    grams: Number(grams) || 0,
    buyPricePerGram: Number(buyPrice) || 0,
    currentPricePerGram: Number(currentPrice) || Number(buyPrice) || 0,
    date: new Date().toISOString()
  });
  saveInvestmentsData(data);
}

function deleteGoldItem(id) {
  const data = getInvestmentsData();
  data.gold = data.gold.filter(x => x.id !== id);
  saveInvestmentsData(data);
}

function updateGoldItem(id, updated) {
  const data = getInvestmentsData();
  const idx = data.gold.findIndex(x => x.id === id);
  if (idx !== -1) {
    data.gold[idx] = { ...data.gold[idx], ...updated };
    saveInvestmentsData(data);
    return data.gold[idx];
  }
  return null;
}

function addFundItem(name, capital, currentValue) {
  const data = getInvestmentsData();
  data.mutualFunds.push({
    id: "mf_" + Date.now(),
    name: name.trim(),
    capital: Number(capital) || 0,
    currentValue: Number(currentValue) || Number(capital) || 0
  });
  saveInvestmentsData(data);
}

function deleteFundItem(id) {
  const data = getInvestmentsData();
  data.mutualFunds = data.mutualFunds.filter(x => x.id !== id);
  saveInvestmentsData(data);
}

function updateFundItem(id, updated) {
  const data = getInvestmentsData();
  const idx = data.mutualFunds.findIndex(x => x.id === id);
  if (idx !== -1) {
    data.mutualFunds[idx] = { ...data.mutualFunds[idx], ...updated };
    saveInvestmentsData(data);
    return data.mutualFunds[idx];
  }
  return null;
}

function calculateFamilyNetWorth(liquidCash = 0, emergencyFund = 0) {
  const data = getInvestmentsData();

  const totalGoldGrams = data.gold.reduce((sum, g) => sum + Number(g.grams), 0);
  const totalGoldValue = data.gold.reduce((sum, g) => sum + (Number(g.grams) * Number(g.currentPricePerGram)), 0);
  const totalFundsValue = data.mutualFunds.reduce((sum, mf) => sum + Number(mf.currentValue), 0);
  const totalRealAssets = data.propertyRealAssets.reduce((sum, pr) => sum + Number(pr.estimateValue || 0), 0);
  const totalDebts = data.debts.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  const totalInvestments = totalGoldValue + totalFundsValue;
  const familyNetWorth = (Number(liquidCash) + Number(emergencyFund) + totalInvestments + totalRealAssets) - totalDebts;

  return {
    totalGoldGrams,
    totalGoldValue,
    totalFundsValue,
    totalRealAssets,
    totalInvestments,
    totalDebts,
    liquidCash,
    emergencyFund,
    familyNetWorth
  };
}

window.InvestmentsModule = {
  getInvestmentsData,
  saveInvestmentsData,
  addGoldItem,
  updateGoldItem,
  deleteGoldItem,
  addFundItem,
  updateFundItem,
  deleteFundItem,
  calculateFamilyNetWorth
};
