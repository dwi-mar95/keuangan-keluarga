/**
 * kondangan-social.js - Modul Khusus Kondangan, Hajatan, Tilik Bayi, Tilik Sakit & Takziah
 */

const KONDANGAN_STORAGE_KEY = "keuangan_keluarga_kondangan_events";

function getKondanganEvents() {
  const saved = localStorage.getItem(KONDANGAN_STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return [];
}

function saveKondanganEvents(events) {
  localStorage.setItem(KONDANGAN_STORAGE_KEY, JSON.stringify(events));
}

function addKondanganEvent(eventData) {
  const events = getKondanganEvents();
  const isPaid = eventData.isPaid !== false;

  const newEvent = {
    id: "knd_" + Date.now(),
    ...eventData,
    status: isPaid ? "completed" : "upcoming"
  };
  events.unshift(newEvent);
  saveKondanganEvents(events);

  // Jika sudah dibayar/diserahkan, catat ke transaksi pengeluaran keluarga
  if (isPaid && window.AppModule && window.AppModule.addTransaction) {
    window.AppModule.addTransaction({
      type: "expense",
      category: "Kondangan & Sosial",
      subCategory: eventData.type,
      amount: eventData.amount,
      wallet: eventData.wallet || "Kas Tunai",
      note: `${eventData.type}: ${eventData.hostName} (${eventData.note || "-"})`,
      date: eventData.eventDate || (window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0])
    });
  }

  return newEvent;
}

window.KondanganModule = {
  getKondanganEvents,
  addKondanganEvent
};
