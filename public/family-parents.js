/**
 * family-parents.js - Modul Khusus Berbakti ke Orang Tua & Mertua, Serta Bantuan Saudara
 */

const PARENTS_GIFT_KEY = "keuangan_keluarga_parents_gifts";

// Data Penerima Bawaan
const DEFAULT_RECIPIENTS = [
  { id: "ibu_kandung", name: "Ibu Kandung Baba Pangestu", relation: "Orang Tua", defaultWallet: "BCA" },
  { id: "ayah_kandung", name: "Ayah Kandung Baba Pangestu", relation: "Orang Tua", defaultWallet: "BCA" },
  { id: "ibu_mertua", name: "Ibu Mertua (Orang Tua Istri)", relation: "Mertua", defaultWallet: "BCA" },
  { id: "ayah_mertua", name: "Ayah Mertua (Orang Tua Istri)", relation: "Mertua", defaultWallet: "BCA" },
  { id: "adik_saudara", name: "Adik / Saudara / Keponakan", relation: "Keluarga Besar", defaultWallet: "BCA" }
];

function getParentGifts() {
  const saved = localStorage.getItem(PARENTS_GIFT_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return [];
}

function saveParentGifts(gifts) {
  localStorage.setItem(PARENTS_GIFT_KEY, JSON.stringify(gifts));
}

// Catat pemberian baru ke orang tua / mertua
function addParentGift(gift) {
  const gifts = getParentGifts();
  gifts.unshift({
    id: "pg_" + Date.now(),
    ...gift,
    date: gift.date || (window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0])
  });
  saveParentGifts(gifts);

  // Catat transaksi pengeluaran keluarga
  if (window.AppModule && window.AppModule.addTransaction) {
    window.AppModule.addTransaction({
      type: "expense",
      category: "Bakti Orang Tua & Keluarga",
      subCategory: gift.recipient,
      amount: gift.amount,
      wallet: gift.wallet || "BCA",
      note: `Untuk ${gift.recipient}: ${gift.note || "Uang bulanan/belanja"}`,
      date: gift.date
    });
  }

  return true;
}

window.FamilyParentsModule = {
  DEFAULT_RECIPIENTS,
  getParentGifts,
  addParentGift
};
