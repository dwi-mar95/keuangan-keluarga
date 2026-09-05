# 🏡 Catatan Keuangan Keluarga Baba Pangestu & Umma Atin + Usaha Ibu Terpisah

> **Aplikasi Web Modern, Super Cepat, Offline-Ready (PWA), 100% Gratis Selamanya, Terintegrasi Google Spreadsheet 2-Arah, dan Siap Hosting di Netlify.**

---

## 🌟 Fitur Utama & Keunggulan Sistem

### 1. 🏡 Dual Ledger Terpisah (100% Anti-Tercampur)
- **Buku Kas Keluarga Baba Pangestu & Umma Atin:**
  - Kebutuhan mingguan & belanja dapur pasar.
  - Tagihan rutin bulanan (PLN, PDAM, BPJS, Wifi Indihome, SPP Sekolah).
  - Biaya pendidikan anak & kuliah/kursus Umma Atin.
  - Bakti orang tua kandung & mertua serta amplop kondangan/buwuh.
  - Servis kendaraan & pengingat jadwal ganti oli.
  - Tabungan hari raya, qurban, dan pajak tahunan.
  - Portofolio emas fisik Antam & investasi reksa dana syariah.
- **Buku Kas Usaha Ibu (Bisnis Terpisah):**
  - **Usaha Kost-Kostan (4 Kamar Aktif 01–04):** Manajemen kamar dinamis, pencatatan sewa kamar bisa bertanggal mundur (*backdate*), dan mendukung pelunasan tempo/cicilan.
  - **Usaha Pangkalan Gas LPG 3kg:** Restock tabung dari supplier (*Bu Yanto & Mas Aan*), penjualan eceran tunai, dan modal/laba bersih terhitung otomatis.
  - **Buku Tempo & Bon Usaha Ibu:** Pencatatan piutang bon gas tetangga, sisa tempo sewa kost, serta hutang belanja ke pangkalan supplier lengkap dengan tanggal jatuh tempo dan tombol pelunasan 1-klik.

---

### 2. ⚙️ Antarmuka & Pengelolaan 100% Dinamis
- **Menu Fitur Cepat Dashboard Dinamis:**
  - Tombol menu navigasi di dashboard tidak lagi kaku/statis. Melalui tombol **`⚙️ Atur / + Menu`**, Anda bebas menambah tombol baru, mengedit ikon & judul, atau menghapus menu yang jarang digunakan.
- **Tombol Edit Lengkap (`✏️`) di Setiap Isian:**
  - Seluruh modul pop-up (*Tagihan Rutin, Belanja Dapur, Pendidikan, Bakti Ortu, Servis Motor, Pajak/Qurban, dan Pintasan 1-Klik*) dilengkapi tombol **`✏️ Edit`** dan **`🗑️ Hapus`**.
- **Master Kategori Transaksi Dinamis:**
  - Kelola pos kategori pengeluaran dan pemasukan secara bebas melalui tombol **`⚙️ + / Kelola Kategori`** di form transaksi atau di menu Pengaturan.
  - Bisa membuat kelompok kategori baru, menambah sub-pos transaksi baru, mengedit nama, maupun menghapus pos yang tidak diperlukan.

---

### 3. 💳 Multi-Dompet & Pindah Saldo Instan
- Mendukung berbagai kantong dana keluarga:
  - 🟢 **Bank BSI** *(Umma Atin)*
  - 🟠 **Flip Saldo** *(Bebas Biaya Transfer & Top Up)*
  - 🔵 **Rekening BCA** *(Baba Pangestu)*
  - 🟢 **Kas Dapur** *(Umma Atin)*
  - ⚫ **Kas Tunai** *(Baba Pangestu)*
  - 🌸 **ShopeePay** *(Belanja Online Umma)*
- **Fitur Pindah Saldo (Transfer Antar-Dompet):** Catat mutasi kas/transfer antar-rekening secara rapi tanpa merusak perhitungan pemasukan/pengeluaran riil.

---

### 4. 📲 Integrasi WhatsApp & Keamanan Tingkat Tinggi
- **Kirim Rekap 1-Klik ke WhatsApp Pasangan:**
  - 👨 **Baba Pangestu:** `(Tersimpan Privat di Kontak)`
  - 👩 **Umma Atin:** `(Tersimpan Privat di Kontak)`
  - Format pesan rapi dan estetik siap kirim via WhatsApp Web atau aplikasi mobile.
- **Keamanan PIN Rahasia:**
  - Dilengkapi verifikasi PIN otomatis saat aplikasi dibuka di laptop maupun HP (PIN privat dapat diubah kapan saja di menu Pengaturan).
- **Waktu Indonesia Barat (WIB / UTC+7):**
  - Standarisasi penanggalan berbahasa Indonesia yang konsisten (*contoh: Kamis, 03 September 2026*).

---

## 📱 Panduan Instalasi Aplikasi (PWA di HP & Laptop)

Aplikasi ini menggunakan teknologi **Progressive Web App (PWA)** sehingga dapat diinstal di HP tanpa melalui Play Store/App Store dan bisa dibuka seketika secara offline:

### 🤖 Android (Google Chrome)
1. Buka tautan website: **`https://atin-family.netlify.app/`** di Google Chrome.
2. Tekan menu titik tiga (`⋮`) di pojok kanan atas browser.
3. Pilih menu **"Tambahkan ke Layar Utama"** (*Add to Home screen*) atau **"Instal Aplikasi"** (*Install App*).
4. Ikon aplikasi **Keuangan Keluarga** akan langsung muncul di beranda HP Anda layaknya aplikasi Android bawaan.

### 🍏 iPhone / iPad (Safari)
1. Buka tautan website di browser **Safari**.
2. Tekan tombol **Bagikan** (*Share* / ikon kotak dengan panah ke atas) di bagian bawah layar.
3. Gulir ke bawah lalu pilih **"Tambahkan ke Layar Utama"** (*Add to Home Screen*).
4. Tekan **Tambah** (*Add*) di pojok kanan atas.

---

## 📊 Integrasi Google Spreadsheet 2-Arah (Google Apps Script)

Seluruh transaksi otomatis dicadangkan ke Google Spreadsheet keluarga secara gratis dan tanpa batas baris.

### 🛡️ ATURAN KETAT GO-LIVE (PRODUCTION SCHEMA LOCKED):
> **⚠️ PENTING:** Aplikasi saat ini berstatus **GO-LIVE** menggunakan **DATA REAL**.
> **DILARANG MERUBAH ATAU MENAMBAHKAN DATABASE/SHEET BARU** agar tidak rancu atau merusak data real saat ini. Skrip Google Apps Script telah dikunci (`PRODUCTION_GO_LIVE_LOCKED = true`) dan seluruh fitur baru wajib memanfaatkan struktur 11 Sheet Paten yang sudah ada.

### Struktur 11 Sheet Resmi (Final, Paten, & Locked):
1. `Keluarga_Transaksi` — Seluruh riwayat pemasukan, pengeluaran, dan pindah saldo keluarga.
2. `Usaha_Ibu_Transaksi` — Riwayat operasional kost dan gas LPG.
3. `Usaha_Ibu_Kost` — Data 4 kamar kost, tarif sewa, nama penghuni, dan status pembayaran.
4. `Usaha_Ibu_Gas` — Stok tabung isi/kosong/pinjam dan harga modal/jual gas.
5. `Usaha_Ibu_Tempo` — Buku catatan piutang bon gas, sisa sewa kost, dan hutang supplier.
6. `Tagihan_Rutin_Bulanan` — Checklist tagihan bulanan keluarga.
7. `Pendidikan_Anak_Istri` — Anggaran sekolah anak & kuliah Umma Atin.
8. `Bakti_Ortu_Kondangan` — Anggaran kasih sayang orang tua/mertua & amplop kondangan.
9. `Servis_Kendaraan` — Jadwal perawatan kendaraan & pengingat servis oli.
10. `Investasi_DanaDarurat` — Pencatatan aset emas Antam & reksa dana syariah.
11. `Celengan_Target_Impian` — Target celengan qurban, umrah, & impian keluarga.

### 🛠️ Cara Update Kode Google Apps Script:
1. Buka spreadsheet Anda di browser, lalu klik menu **Ekstensi (Extensions)** ➔ **Apps Script**.
2. Buka berkas [google-apps-script.js](google-apps-script.js), salin seluruh isinya (`Ctrl + A`, lalu `Ctrl + C`).
3. Tempelkan (*Paste*) ke editor Apps Script, lalu klik icon **Simpan (Save)** 💾.
4. Klik tombol **Terapkan (Deploy)** di kanan atas ➔ pilih **Kelola penerapan (Manage deployments)**.
5. Klik ikon **Pensil (Edit)** pada penerapan aktif ➔ di kolom Versi, pilih **Versi baru (New version)** ➔ klik **Terapkan (Deploy)**. Selesai! 🎉

---

## 🌐 Panduan Deploy ke Netlify

Jika Anda melakukan perubahan kode lokal di komputer:
1. Masuk ke dasbor Netlify: **[https://app.netlify.com/sites/atin-family/deploys](https://app.netlify.com/sites/atin-family/deploys)** (atau ke [app.netlify.com/drop](https://app.netlify.com/drop)).
2. Tarik (**Drag & Drop**) folder proyek ini:
   ```text
   c:\laragon\www\keuangan-keluarga
   ```
3. Netlify akan langsung mengunggah pembaruan dalam hitungan detik dan website Anda langsung online!

---

## 💾 Cadangan & Pemulihan (Backup & Restore)
- Pada menu **Pengaturan**, tersedia tombol:
  - **`📥 Backup JSON`**: Mengunduh seluruh data transaksi dan setelan ke berkas `.json` di komputer/HP Anda.
  - **`📤 Restore JSON`**: Mengunggah kembali data jika Anda berganti perangkat atau ingin memulihkan cadangan terdahulu.

---

*Dibuat dengan penuh dedikasi untuk keberkahan, kemudahan, dan keteraturan finansial keluarga Baba Pangestu & Umma Atin.* ✨🤲
