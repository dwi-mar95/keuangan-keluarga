/**
 * community.js - Modul Kegiatan Sosial Kemasyarakatan: Arisan RT, RW, PKK & Dasa Wisma
 */

const COMMUNITY_STORAGE_KEY = "keuangan_keluarga_community_events";

function getCommunityEvents() {
  const saved = localStorage.getItem(COMMUNITY_STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return [];
}

function saveCommunityEvents(events) {
  localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(events));
}

function payCommunityFee(eventId, wallet = "Kas Tunai") {
  const events = getCommunityEvents();
  const event = events.find(e => e.id === eventId);
  if (!event) return false;

  if (window.AppModule && window.AppModule.addTransaction) {
    window.AppModule.addTransaction({
      type: "expense",
      category: "Kondangan & Sosial",
      subCategory: event.name,
      amount: event.monthlyFee,
      wallet: wallet,
      note: `Iuran bulanan ${event.name} (${event.person})`,
      date: window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0]
    });
  }

  return true;
}

window.CommunityModule = {
  getCommunityEvents,
  saveCommunityEvents,
  payCommunityFee
};
