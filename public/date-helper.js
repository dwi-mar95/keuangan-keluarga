/**
 * date-helper.js - Modul Standarisasi Waktu Indonesia Barat (WIB / UTC+7)
 * Format Baku: [Hari], [Tanggal] [Nama Bulan] [Tahun] (Contoh: Kamis, 03 September 2026)
 * Mendukung penyimpanan transaksi Real-Time (dengan jam & menit akurat) dan Backdate (tanggal lampau)
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

// Dapatkan jam realtime sekarang dalam WIB (HH:mm:ss)
function getNowWIBTimeString() {
  const d = getNowWIB();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

// Format lengkap ISO WIB: YYYY-MM-DDTHH:mm:ss+07:00
function getNowWIBISOString() {
  return `${getTodayWIBString()}T${getNowWIBTimeString()}+07:00`;
}

// Konversi aman input tanggal apapun (hari ini, realtime, maupun backdate) ke ISO WIB (+07:00)
function toWIBISOString(dateInput, fallbackTime = null) {
  if (!dateInput) return getNowWIBISOString();
  
  if (typeof dateInput === "string") {
    const s = dateInput.trim();
    
    // 1. Format tanggal murni YYYY-MM-DD (misal dari input type="date")
    const pureDateMatch = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
    if (pureDateMatch) {
      const y = pureDateMatch[1];
      const m = pureDateMatch[2].padStart(2, "0");
      const d = pureDateMatch[3].padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      const today = getTodayWIBString();
      // Jika tanggal adalah hari ini, gunakan jam realtime saat ini!
      // Jika backdate (tanggal lampau/berbeda), gunakan jam 12:00:00 atau jam yang ditentukan
      const timeStr = (dateStr === today) ? getNowWIBTimeString() : (fallbackTime || "12:00:00");
      return `${dateStr}T${timeStr}+07:00`;
    }
    
    // 2. Format ISO lengkap dengan T dan offset +07:00
    if (s.includes("T") && s.includes("+07:00")) {
      return s;
    }
    
    // 3. Format ISO dengan spasi atau T tanpa timezone (YYYY-MM-DD HH:mm:ss)
    const spaceMatch = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (spaceMatch) {
      const y = spaceMatch[1];
      const m = spaceMatch[2].padStart(2, "0");
      const d = spaceMatch[3].padStart(2, "0");
      const h = spaceMatch[4].padStart(2, "0");
      const min = spaceMatch[5].padStart(2, "0");
      const sec = (spaceMatch[6] || "00").padStart(2, "0");
      return `${y}-${m}-${d}T${h}:${min}:${sec}+07:00`;
    }

    // 4. Format DD/MM/YYYY
    const dmyMatch = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (dmyMatch) {
      const d = dmyMatch[1].padStart(2, "0");
      const m = dmyMatch[2].padStart(2, "0");
      const y = dmyMatch[3];
      const dateStr = `${y}-${m}-${d}`;
      const today = getTodayWIBString();
      const h = dmyMatch[4] ? dmyMatch[4].padStart(2, "0") : (dateStr === today ? getNowWIBTimeString().split(":")[0] : "12");
      const min = dmyMatch[5] ? dmyMatch[5].padStart(2, "0") : (dateStr === today ? getNowWIBTimeString().split(":")[1] : "00");
      const sec = dmyMatch[6] ? dmyMatch[6].padStart(2, "0") : (dateStr === today ? getNowWIBTimeString().split(":")[2] : "00");
      return `${dateStr}T${h}:${min}:${sec}+07:00`;
    }
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return getNowWIBISOString();

  // Konversi Date ke WIB
  const utcOffset = d.getTime() + (d.getTimezoneOffset() * 60000);
  const wibTime = new Date(utcOffset + (7 * 3600000));
  const year = wibTime.getFullYear();
  const month = String(wibTime.getMonth() + 1).padStart(2, "0");
  const day = String(wibTime.getDate()).padStart(2, "0");
  const hours = String(wibTime.getHours()).padStart(2, "0");
  const minutes = String(wibTime.getMinutes()).padStart(2, "0");
  const seconds = String(wibTime.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`;
}

// Format aman untuk <input type="date"> (YYYY-MM-DD) dalam zona waktu WIB (UTC+7)
function toInputDateFormat(dateInput) {
  if (!dateInput) return getTodayWIBString();
  
  if (typeof dateInput === "string") {
    const s = dateInput.trim();
    const isoMatch = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
    }
    const slashMatch = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    if (slashMatch) {
      return `${slashMatch[3]}-${slashMatch[2].padStart(2, "0")}-${slashMatch[1].padStart(2, "0")}`;
    }
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return getTodayWIBString();
  const utcOffset = d.getTime() + (d.getTimezoneOffset() * 60000);
  const wibTime = new Date(utcOffset + (7 * 3600000));
  const year = wibTime.getFullYear();
  const month = String(wibTime.getMonth() + 1).padStart(2, "0");
  const day = String(wibTime.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Format lengkap: Kamis, 03 September 2026
function formatDateIndonesia(dateInput) {
  if (!dateInput) return "-";
  const dateStr = toInputDateFormat(dateInput);
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const dt = new Date(Date.UTC(y, m, d, 12, 0, 0));
    const hari = NAMA_HARI[dt.getUTCDay()];
    const tgl = String(d).padStart(2, "0");
    const bln = NAMA_BULAN[m];
    return `${hari}, ${tgl} ${bln} ${y}`;
  }
  return String(dateInput);
}

// Format lengkap dengan jam: Kamis, 03 September 2026 - 14:30 WIB
function formatDateTimeIndonesia(dateInput) {
  if (!dateInput) return "-";
  const dateStr = formatDateIndonesia(dateInput);
  let timeStr = "12:00";
  if (typeof dateInput === "string") {
    const timeMatch = dateInput.match(/[T\s](\d{2}):(\d{2})/);
    if (timeMatch) timeStr = `${timeMatch[1]}:${timeMatch[2]}`;
  }
  return `${dateStr} - ${timeStr} WIB`;
}

// Format rapi untuk kartu riwayat transaksi (misal: Senin, 31 Agustus 2026 • 19:22 WIB)
function formatDateTimeCard(dateInput) {
  if (!dateInput) return "-";
  
  let timeStr = "";
  if (typeof dateInput === "string") {
    const s = dateInput.trim();
    const timeMatch = s.match(/[T\s](\d{2}):(\d{2})/);
    if (timeMatch) {
      timeStr = `${timeMatch[1]}:${timeMatch[2]} WIB`;
    }
  }
  
  const dateOnlyStr = formatDateIndonesia(dateInput);
  if (timeStr) {
    return `${dateOnlyStr} • ${timeStr}`;
  }
  return dateOnlyStr;
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
  getNowWIBTimeString,
  getNowWIBISOString,
  toWIBISOString,
  toInputDateFormat,
  formatDateIndonesia,
  formatDateTimeIndonesia,
  formatDateTimeCard,
  formatRupiah
};
