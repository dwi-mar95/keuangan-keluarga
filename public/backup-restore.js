/**
 * backup-restore.js - Modul 1-Klik Backup/Restore JSON & Export Excel (.csv)
 */

function exportBackupJson() {
  const backupData = {
    appName: "Catatan Keuangan Keluarga & Usaha Ibu",
    backupDate: window.DateHelper ? window.DateHelper.formatDateTimeIndonesia(new Date()) : new Date().toISOString(),
    transactions: localStorage.getItem("keuangan_keluarga_transactions"),
    categories: localStorage.getItem("keuangan_keluarga_categories"),
    bills: localStorage.getItem("keuangan_keluarga_monthly_bills"),
    shopping: localStorage.getItem("keuangan_keluarga_shopping_items"),
    vehicles: localStorage.getItem("keuangan_keluarga_vehicles"),
    serviceLogs: localStorage.getItem("keuangan_keluarga_service_logs"),
    education: localStorage.getItem("keuangan_keluarga_education_plans"),
    community: localStorage.getItem("keuangan_keluarga_community_events"),
    parents: localStorage.getItem("keuangan_keluarga_parents_gifts"),
    kondangan: localStorage.getItem("keuangan_keluarga_kondangan_events"),
    taxesHolidays: localStorage.getItem("keuangan_keluarga_taxes_holidays"),
    emergencyFund: localStorage.getItem("keuangan_keluarga_emergency_fund"),
    investments: localStorage.getItem("keuangan_keluarga_investments"),
    settings: localStorage.getItem("keuangan_keluarga_branding_settings"),
    ibuKost: localStorage.getItem("usaha_ibu_kost_data"),
    ibuGas: localStorage.getItem("usaha_ibu_gas_inventory"),
    ibuSales: localStorage.getItem("usaha_ibu_gas_sales"),
    ibuBon: localStorage.getItem("usaha_ibu_gas_bon_pelanggan")
  };

  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const tglStr = window.DateHelper ? window.DateHelper.getTodayWIBString() : "backup";
  a.href = url;
  a.download = `backup_keuangan_keluarga_${tglStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importBackupJson(file, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.appName) {
        alert("File backup tidak valid!");
        return;
      }

      // Restore all keys
      if (data.transactions) localStorage.setItem("keuangan_keluarga_transactions", data.transactions);
      if (data.categories) localStorage.setItem("keuangan_keluarga_categories", data.categories);
      if (data.bills) localStorage.setItem("keuangan_keluarga_monthly_bills", data.bills);
      if (data.shopping) localStorage.setItem("keuangan_keluarga_shopping_items", data.shopping);
      if (data.vehicles) localStorage.setItem("keuangan_keluarga_vehicles", data.vehicles);
      if (data.serviceLogs) localStorage.setItem("keuangan_keluarga_service_logs", data.serviceLogs);
      if (data.education) localStorage.setItem("keuangan_keluarga_education_plans", data.education);
      if (data.community) localStorage.setItem("keuangan_keluarga_community_events", data.community);
      if (data.parents) localStorage.setItem("keuangan_keluarga_parents_gifts", data.parents);
      if (data.kondangan) localStorage.setItem("keuangan_keluarga_kondangan_events", data.kondangan);
      if (data.taxesHolidays) localStorage.setItem("keuangan_keluarga_taxes_holidays", data.taxesHolidays);
      if (data.emergencyFund) localStorage.setItem("keuangan_keluarga_emergency_fund", data.emergencyFund);
      if (data.investments) localStorage.setItem("keuangan_keluarga_investments", data.investments);
      if (data.settings) localStorage.setItem("keuangan_keluarga_branding_settings", data.settings);
      if (data.ibuKost) localStorage.setItem("usaha_ibu_kost_data", data.ibuKost);
      if (data.ibuGas) localStorage.setItem("usaha_ibu_gas_inventory", data.ibuGas);
      if (data.ibuSales) localStorage.setItem("usaha_ibu_gas_sales", data.ibuSales);
      if (data.ibuBon) localStorage.setItem("usaha_ibu_gas_bon_pelanggan", data.ibuBon);

      alert("Data berhasil dipulihkan secara sempurna!");
      if (callback) callback();
      window.location.reload();
    } catch (err) {
      alert("Gagal membaca file backup: " + err.message);
    }
  };
  reader.readAsText(file);
}

// Export Riwayat Transaksi ke CSV (Excel Ready)
function exportTransactionsToCsv(transactions = []) {
  if (transactions.length === 0) {
    alert("Belum ada data transaksi untuk diexport!");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "ID;Tanggal WIB;Jenis;Kategori;Sub Kategori;Nominal;Dompet;Dicatat Oleh;Keterangan\r\n";

  transactions.forEach(tx => {
    const tglStr = window.DateHelper ? window.DateHelper.formatDateTimeIndonesia(tx.date) : tx.date;
    const row = [
      tx.id,
      `"${tglStr}"`,
      tx.type === "income" ? "Pemasukan" : "Pengeluaran",
      `"${tx.category || "-"}"`,
      `"${tx.subCategory || "-"}"`,
      tx.amount || 0,
      `"${tx.wallet || "-"}"`,
      `"${tx.user || "-"}"`,
      `"${(tx.note || "-").replace(/"/g, '""')}"`
    ];
    csvContent += row.join(";") + "\r\n";
  });

  const encodedUri = encodeURI(csvContent);
  const a = document.createElement("a");
  const tgl = window.DateHelper ? window.DateHelper.getTodayWIBString() : "laporan";
  a.href = encodedUri;
  a.download = `laporan_keuangan_keluarga_${tgl}.csv`;
  a.click();
}

window.BackupRestoreModule = {
  exportBackupJson,
  importBackupJson,
  exportTransactionsToCsv
};
