/**
 * ibu-kost.js - Modul Manajemen Kost-Kostan Usaha Ibu (100% Dinamis & Mendukung Backdate/Tempo)
 * Terpisah dari keuangan keluarga Mas Pangestu
 */

const KOST_STORAGE_KEY = "usaha_ibu_kost_data";

// Data Awal Kamar Kost (4 Kamar Siap Huni - Tanpa Data Dummy untuk Go-Live)
const DEFAULT_KOST_ROOMS = [
  {
    id: "kamar_1",
    roomNumber: "01",
    tenantName: "(Kosong / Siap Huni)",
    tenantPhone: "",
    facilities: "Kamar Mandi Dalam, Kasur, Lemari",
    monthlyRent: 750000,
    dueDay: 5,
    deposit: 0,
    statusBulanIni: "empty",
    lastPaymentDate: ""
  },
  {
    id: "kamar_2",
    roomNumber: "02",
    tenantName: "(Kosong / Siap Huni)",
    tenantPhone: "",
    facilities: "Kamar Mandi Dalam, Kasur, Lemari",
    monthlyRent: 750000,
    dueDay: 10,
    deposit: 0,
    statusBulanIni: "empty",
    lastPaymentDate: ""
  },
  {
    id: "kamar_3",
    roomNumber: "03",
    tenantName: "(Kosong / Siap Huni)",
    tenantPhone: "",
    facilities: "Kamar Mandi Luar, Kipas, Kasur",
    monthlyRent: 600000,
    dueDay: 1,
    deposit: 0,
    statusBulanIni: "empty",
    lastPaymentDate: ""
  },
  {
    id: "kamar_4",
    roomNumber: "04",
    tenantName: "(Kosong / Siap Huni)",
    tenantPhone: "",
    facilities: "Kamar Mandi Dalam, Kasur, Lemari",
    monthlyRent: 750000,
    dueDay: 15,
    deposit: 0,
    statusBulanIni: "empty",
    lastPaymentDate: ""
  }
];

// Dapatkan data kamar kost (otomatis membersihkan kamar 5 jika sebelumnya tersimpan)
function getKostRooms() {
  const saved = localStorage.getItem(KOST_STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(r => r.id !== "kamar_5" && r.roomNumber !== "05");
        return cleaned;
      }
    } catch (e) {}
  }
  return DEFAULT_KOST_ROOMS;
}

// Simpan data kamar kost & sinkronkan ke Google Spreadsheet
function saveKostRooms(rooms) {
  localStorage.setItem(KOST_STORAGE_KEY, JSON.stringify(rooms));
  if (window.SyncModule && window.SyncModule.pushTransactionToSyncQueue) {
    window.SyncModule.pushTransactionToSyncQueue("sync_kost_rooms", { rooms });
  }
}

// Tambah Kamar Kost Baru Secara Dinamis
function addKostRoom(roomNumber, tenantName = "(Kosong / Siap Huni)", monthlyRent = 750000, dueDay = 1, facilities = "Kamar Mandi Dalam", tenantPhone = "") {
  const rooms = getKostRooms();
  const newRoom = {
    id: "kamar_" + Date.now(),
    roomNumber: String(roomNumber).padStart(2, "0"),
    tenantName: tenantName || "(Kosong / Siap Huni)",
    tenantPhone: tenantPhone || "",
    facilities: facilities || "Kamar Mandi Dalam",
    monthlyRent: Number(monthlyRent) || 750000,
    dueDay: Number(dueDay) || 1,
    deposit: 0,
    statusBulanIni: tenantName && !tenantName.includes("Kosong") ? "unpaid" : "empty",
    lastPaymentDate: ""
  };
  rooms.push(newRoom);
  saveKostRooms(rooms);
  return newRoom;
}

// Hapus Kamar Kost Secara Dinamis
function deleteKostRoom(roomId) {
  let rooms = getKostRooms();
  rooms = rooms.filter(r => r.id !== roomId);
  saveKostRooms(rooms);
  return true;
}

// Update Kamar Kost
function updateKostRoom(roomId, updatedData) {
  const rooms = getKostRooms();
  const idx = rooms.findIndex(r => r.id === roomId);
  if (idx !== -1) {
    rooms[idx] = { ...rooms[idx], ...updatedData };
    saveKostRooms(rooms);
    return rooms[idx];
  }
  return null;
}

// Catat Pembayaran Sewa Kost (Mendukung Multi-Bulan / 3 Bulan, Backdate, Cicil, dan Tempo)
function recordRoomPayment(roomId, { amount, paymentDate, isPartial = false, partialRemaining = 0, tempoDate = "", note = "", paidMonths = 1 }) {
  const rooms = getKostRooms();
  const room = rooms.find(r => r.id === roomId);
  if (!room) return false;

  const actualDate = paymentDate ? paymentDate + "T12:00:00+07:00" : new Date().toISOString();
  const dateStrOnly = paymentDate || (window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0]);

  const numMonths = Number(paidMonths) || Math.max(1, Math.round(Number(amount) / (room.monthlyRent || 1)));

  // Hitung tanggal akhir sewa (paidUntil) menggunakan zona waktu lokal yang konsisten
  const baseDate = new Date(dateStrOnly + "T12:00:00");
  const endRentalDate = new Date(dateStrOnly + "T12:00:00");
  endRentalDate.setMonth(endRentalDate.getMonth() + Math.max(0, numMonths - 1));
  
  baseDate.setMonth(baseDate.getMonth() + numMonths);
  const paidUntilDate = baseDate.toISOString().split("T")[0];
  
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const paidUntilMonthStr = monthNames[endRentalDate.getMonth()] + " " + endRentalDate.getFullYear();

  room.statusBulanIni = isPartial ? "partial" : "paid";
  room.lastPaymentDate = dateStrOnly;
  room.lastPaymentAmount = Number(amount) || room.monthlyRent;
  room.paidMonths = numMonths;
  room.paidUntil = paidUntilDate;
  room.paidUntilMonth = paidUntilMonthStr;

  if (isPartial) {
    room.partialRemaining = Number(partialRemaining);
    room.tempoDate = tempoDate;
  } else {
    delete room.partialRemaining;
    delete room.tempoDate;
  }
  saveKostRooms(rooms);

  // 1. Catat Transaksi Penerimaan Kas ke Buku Usaha Ibu (dengan tanggal backdate & keterangan jelas)
  const durationDesc = numMonths > 1 ? ` (${numMonths} Bulan s/d ${paidUntilMonthStr})` : "";
  const finalNote = note || (isPartial 
    ? `Cicil sewa Kamar ${room.roomNumber} oleh ${room.tenantName} (Sisa tempo Rp ${Number(partialRemaining).toLocaleString("id-ID")})` 
    : `Pelunasan sewa Kamar ${room.roomNumber} oleh ${room.tenantName}${durationDesc}`);

  if (window.AppModule && window.AppModule.addIbuTransaction) {
    window.AppModule.addIbuTransaction({
      type: "income",
      unit: "kost",
      category: `Sewa Kamar ${room.roomNumber}`,
      amount: Number(amount) || room.monthlyRent,
      note: finalNote,
      date: actualDate
    });
  }

  // 2. Jika ada sisa tempo / hutang sewa, catat ke Buku Piutang & Tempo Usaha Ibu
  if (isPartial && Number(partialRemaining) > 0 && window.IbuGasModule && window.IbuGasModule.addTempoRecord) {
    window.IbuGasModule.addTempoRecord({
      type: "kost_rent",
      title: `Sisa Sewa Kamar ${room.roomNumber} (${room.tenantName})`,
      amount: Number(partialRemaining),
      dueDate: tempoDate || "",
      contactPhone: room.tenantPhone || "",
      note: `Sisa sewa yang belum lunas tanggal bayar ${dateStrOnly}`
    });
  }

  return room;
}

// Tandai kamar lunas bulan ini (Backward compatible wrapper)
function markRoomPaid(roomId, amount = null, paymentDate = null) {
  return recordRoomPayment(roomId, {
    amount,
    paymentDate,
    isPartial: false
  });
}

// Hitung ringkasan pendapatan kost bulan ini
function getKostSummary() {
  const rooms = getKostRooms();
  const activeRooms = rooms.filter(r => r.statusBulanIni !== "empty");
  const paidRooms = activeRooms.filter(r => r.statusBulanIni === "paid");
  const unpaidRooms = activeRooms.filter(r => r.statusBulanIni === "unpaid" || r.statusBulanIni === "partial");

  const totalExpected = activeRooms.reduce((sum, r) => sum + Number(r.monthlyRent), 0);

  // Total diterima: gunakan total riil transaksi sewa kost bulan ini jika ada, atau lastPaymentAmount
  let totalReceived = 0;
  if (window.AppModule && window.AppModule.getIbuTransactions) {
    const txs = window.AppModule.getIbuTransactions();
    const currentYearMonth = new Date().toISOString().slice(0, 7);
    const kostIncomeTxs = txs.filter(t => t.unit === "kost" && t.type === "income" && (t.date || "").startsWith(currentYearMonth));
    if (kostIncomeTxs.length > 0) {
      totalReceived = kostIncomeTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    }
  }

  if (totalReceived === 0) {
    totalReceived = paidRooms.reduce((sum, r) => sum + (Number(r.lastPaymentAmount) || Number(r.monthlyRent)), 0);
  }

  const totalPending = unpaidRooms.reduce((sum, r) => {
    if (r.statusBulanIni === "partial" && r.partialRemaining) {
      return sum + Number(r.partialRemaining);
    }
    return sum + Number(r.monthlyRent);
  }, 0);

  return {
    totalRooms: rooms.length,
    activeCount: activeRooms.length,
    paidCount: paidRooms.length,
    unpaidCount: unpaidRooms.length,
    emptyCount: rooms.length - activeRooms.length,
    totalExpected,
    totalReceived,
    totalPending
  };
}

window.IbuKostModule = {
  getKostRooms,
  saveKostRooms,
  addKostRoom,
  deleteKostRoom,
  updateKostRoom,
  recordRoomPayment,
  markRoomPaid,
  getKostSummary
};
