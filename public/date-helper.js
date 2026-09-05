/**
 * date-helper.js - Modul Standarisasi Waktu Indonesia Barat (WIB / UTC+7)
 * Format Baku: [Hari], [Tanggal] [Nama Bulan] [Tahun] (Contoh: Kamis, 03 September 2026)
 */

const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Dapatkan objek Date dalam zona waktu WIB (UTC+7)
function getNowWIB() {
  const now = new Date();
  const utcOffset = now.getTime() + (now.getTimezoneOffset() * 60000);
  const wibTime = new Date(utcOffset + (7 * 3600000));
  return wibTime;
}

// Format ISO YYYY-MM-DD WIB (untuk input type="date")
function getTodayWIBString() {
  const d = getNowWIB();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Format lengkap: Kamis, 03 September 2026
function formatDateIndonesia(dateInput) {
  if (!dateInput) return "-";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  
  const hari = NAMA_HARI[d.getDay()];
  const tgl = String(d.getDate()).padStart(2, "0");
  const bln = NAMA_BULAN[d.getMonth()];
  const thn = d.getFullYear();
  
  return `${hari}, ${tgl} ${bln} ${thn}`;
}

// Format lengkap dengan jam: Kamis, 03 September 2026 - 14:30 WIB
function formatDateTimeIndonesia(dateInput) {
  if (!dateInput) return "-";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  
  const hari = NAMA_HARI[d.getDay()];
  const tgl = String(d.getDate()).padStart(2, "0");
  const bln = NAMA_BULAN[d.getMonth()];
  const thn = d.getFullYear();
  const jam = String(d.getHours()).padStart(2, "0");
  const menit = String(d.getMinutes()).padStart(2, "0");
  
  return `${hari}, ${tgl} ${bln} ${thn} - ${jam}:${menit} WIB`;
}

// Format nominal Rupiah rapi (Mendukung Privacy Mode Sensor Angka)
function formatRupiah(amount, ignorePrivacy = false) {
  if (!ignorePrivacy && window.AuthModule && typeof window.AuthModule.isPrivacyMode === "function" && window.AuthModule.isPrivacyMode()) {
    return "Rp ••••••••";
  }
  const num = Number(amount) || 0;
  return `Rp ${num.toLocaleString("id-ID")}`;
}

window.DateHelper = {
  NAMA_HARI,
  NAMA_BULAN,
  getNowWIB,
  getTodayWIBString,
  formatDateIndonesia,
  formatDateTimeIndonesia,
  formatRupiah
};
