/**
 * whatsapp.js - Modul Integrasi Otomatis WhatsApp Keluarga & Usaha Ibu
 * Kontak Baba Pangestu: 6285747361272
 * Kontak Istri (Umma Atin): 6285725201598
 */

const WHATSAPP_CONFIG = {
  SUAMI_PHONE: "6285747361272", // Baba Pangestu
  SUAMI_NAME: "Baba Pangestu",
  ISTRI_PHONE: "6285725201598",  // Umma Atin
  ISTRI_NAME: "Umma Atin"
};

// Kirim info pengeluaran/pemasukan baru ke pasangan
function sendTransactionToSpouse(tx, fromUser = "istri") {
  const isIstri = fromUser === "istri";
  const targetPhone = isIstri ? WHATSAPP_CONFIG.SUAMI_PHONE : WHATSAPP_CONFIG.ISTRI_PHONE;
  const targetGreeting = isIstri ? "Baba Pangestu tercinta ❤️" : "Umma Atin tercinta ❤️";
  const senderTitle = isIstri ? "Umma Atin" : "Baba Pangestu";

  const tglWIB = window.DateHelper ? window.DateHelper.formatDateTimeIndonesia(tx.date || new Date()) : new Date().toLocaleString();
  const nominalStr = window.DateHelper ? window.DateHelper.formatRupiah(tx.amount) : `Rp ${tx.amount}`;
  const jenisEmoji = tx.type === "income" ? "📥 *PEMASUKAN*" : "📤 *PENGELUARAN*";

  const message = 
`Halo ${targetGreeting}, ada info transaksi baru dari ${senderTitle}:
${jenisEmoji}
────────────────────────
📅 Waktu: ${tglWIB}
🏷️ Pos: ${tx.category} ${tx.subCategory ? `(${tx.subCategory})` : ""}
💰 Nominal: *${nominalStr}*
💳 Dompet/Akun: ${tx.wallet || "Kas"}
📝 Catatan: ${tx.note || "-"}
────────────────────────
Semoga rezeki keluarga kita selalu berkah & melimpah! ✨🤲`;

  const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

// Bagikan rekap kas harian / mingguan ke pasangan
function shareDailyRekap(rekap, targetPhone = null) {
  const phone = targetPhone || WHATSAPP_CONFIG.ISTRI_PHONE;
  const tglWIB = window.DateHelper ? window.DateHelper.formatDateIndonesia(new Date()) : new Date().toLocaleDateString();

  const message =
`📊 *REKAP KEUANGAN KELUARGA BAHAGIA*
📅 ${tglWIB} (WIB)
👨 Baba Pangestu & 👩 Umma Atin
───────────────────────────────
💰 *Total Saldo Kas Likuid:* ${window.DateHelper.formatRupiah(rekap.totalBalance)}
📥 Total Pemasukan: ${window.DateHelper.formatRupiah(rekap.totalIncome)}
📤 Total Belanja: ${window.DateHelper.formatRupiah(rekap.totalExpense)}
───────────────────────────────
⏳ Sisa Tagihan Rutin Pending: ${window.DateHelper.formatRupiah(rekap.pendingBills)}
🎯 Sisa Anggaran Bebas: *${window.DateHelper.formatRupiah(rekap.freeBudget)}*
───────────────────────────────
Alhamdulillah, semoga senantiasa diberikan kelancaran & keberkahan rizki. 💖🤲`;

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

// Kirim pengingat tagihan sewa kamar kost ke anak kost (Usaha Ibu)
function sendKostReminder(phone, tenantName, roomNumber, amount, dueDate) {
  const cleanPhone = String(phone).replace(/\D/g, "").replace(/^0/, "62");
  const nominalStr = window.DateHelper ? window.DateHelper.formatRupiah(amount) : `Rp ${amount}`;
  const tglStr = window.DateHelper ? window.DateHelper.formatDateIndonesia(dueDate) : String(dueDate);

  const message =
`Selamat siang Kak *${tenantName}* 🙏,
Sekadar mengingatkan untuk pembayaran sewa kamar kost:
🏠 *Kamar Kost No. ${roomNumber}*
💰 *Biaya Sewa:* ${nominalStr}
📅 *Jatuh Tempo:* ${tglStr}

Bisa ditransfer atau diserahkan langsung ke Ibu Kost ya Kak.
Terima kasih banyak atas kerjasamanya! Semoga sehat & sukses selalu. 😊🙏`;

  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

// Kirim bukti kwitansi sewa kamar kost lunas ke anak kost (Usaha Ibu)
function sendKostReceipt(phone, tenantName, roomNumber, amount, payDate) {
  const cleanPhone = String(phone).replace(/\D/g, "").replace(/^0/, "62");
  const nominalStr = window.DateHelper ? window.DateHelper.formatRupiah(amount) : `Rp ${amount}`;
  const tglStr = window.DateHelper ? window.DateHelper.formatDateTimeIndonesia(payDate) : String(payDate);

  const message =
`🧾 *KWITANSI PEMBAYARAN KOST IBU (LUNAS)*
───────────────────────────────
Telah diterima dari : *Kak ${tenantName}*
Untuk sewa          : *Kamar Kost No. ${roomNumber}*
Jumlah              : *${nominalStr}*
Waktu Pembayaran    : ${tglStr}
Status              : ✅ *LUNAS*
───────────────────────────────
Terima kasih Kak telah melunasi sewa kost tepat waktu. Semoga betah & nyaman selalu! 🙏✨
- *Ibu Kost*`;

  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

window.WhatsAppModule = {
  CONFIG: WHATSAPP_CONFIG,
  sendTransactionToSpouse,
  shareDailyRekap,
  sendKostReminder,
  sendKostReceipt
};
