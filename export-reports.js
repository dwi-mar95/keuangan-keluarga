/**
 * export-reports.js - Modul Ekspor Laporan Excel/CSV & Cetak PDF Resmi Berkop Keluarga
 * Catatan Keuangan Keluarga Baba Pangestu & Umma Atin
 */

function downloadBlob(content, filename, mimeType = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 1. Ekspor CSV/Excel Kas Keluarga
function exportKeluargaToCsv() {
  const txs = window.AppModule ? window.AppModule.getKeluargaTransactions() : [];
  if (txs.length === 0) {
    if (window.showToast) window.showToast("Belum ada data transaksi untuk diekspor!", "warning");
    return;
  }

  // Header CSV dengan UTF-8 BOM agar terbaca sempurna di Microsoft Excel Windows
  let csv = "\uFEFFNo,Tanggal WIB,Jenis,Kategori,Sub Kategori,Nominal (Rp),Dompet/Akun,Pencatat,Keterangan\n";

  txs.forEach((tx, idx) => {
    const tgl = tx.date ? new Date(tx.date).toLocaleDateString("id-ID") : "-";
    const jenis = tx.type === "income" ? "Pemasukan" : (tx.type === "transfer" ? "Pindah Saldo" : "Pengeluaran");
    const kat = `"${(tx.category || '').replace(/"/g, '""')}"`;
    const sub = `"${(tx.subCategory || '').replace(/"/g, '""')}"`;
    const nominal = tx.amount || 0;
    const dompet = `"${(tx.wallet || 'Kas Tunai').replace(/"/g, '""')}"`;
    const user = tx.user === "istri" ? "Umma Atin" : (tx.user === "suami" ? "Baba Pangestu" : "Keluarga");
    const ket = `"${(tx.note || '').replace(/"/g, '""')}"`;

    csv += `${idx + 1},${tgl},${jenis},${kat},${sub},${nominal},${dompet},${user},${ket}\n`;
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const filename = `Laporan_Keuangan_Keluarga_Baba_Umma_${todayStr}.csv`;
  downloadBlob(csv, filename);

  if (window.showToast) {
    window.showToast("Laporan Excel/CSV Keluarga berhasil diunduh! 📄", "success");
  }
}

// 2. Ekspor CSV/Excel Usaha Ibu
function exportIbuToCsv() {
  const txs = window.AppModule ? window.AppModule.getIbuTransactions() : [];
  if (txs.length === 0) {
    if (window.showToast) window.showToast("Belum ada data transaksi Usaha Ibu!", "warning");
    return;
  }

  let csv = "\uFEFFNo,Tanggal WIB,Unit Usaha,Nominal (Rp),Jumlah Tabung/Kamar,Keterangan/Pembeli\n";

  txs.forEach((tx, idx) => {
    const tgl = tx.date ? new Date(tx.date).toLocaleDateString("id-ID") : "-";
    const unit = (tx.category || "").includes("gas") ? "Penjualan Gas LPG" : "Sewa Kamar Kost";
    const nominal = tx.amount || 0;
    const qty = tx.qty || 1;
    const ket = `"${(tx.note || '').replace(/"/g, '""')}"`;

    csv += `${idx + 1},${tgl},${unit},${nominal},${qty},${ket}\n`;
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const filename = `Laporan_Usaha_Ibu_Kost_Gas_${todayStr}.csv`;
  downloadBlob(csv, filename);

  if (window.showToast) {
    window.showToast("Laporan Excel/CSV Usaha Ibu berhasil diunduh! 📄", "success");
  }
}

// 3. Cetak Laporan PDF Resmi Berkop Keluarga
function printOfficialFamilyReport() {
  if (window.showToast) window.showToast("Mempersiapkan dokumen cetak PDF resmi... 🖨️", "info");
  setTimeout(() => {
    window.print();
  }, 300);
}

window.ExportReportsModule = {
  exportKeluargaToCsv,
  exportIbuToCsv,
  printOfficialFamilyReport
};
