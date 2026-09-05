# 🛡️ ATURAN RESMI PENGEMBANGAN & GO-LIVE (PRODUCTION SCHEMA FREEZE)
**Aplikasi:** Catatan Keuangan Keluarga Baba Pangestu & Umma Atin + Usaha Ibu  
**Status Lingkungan:** 🟢 **GO-LIVE / PRODUCTION (DATA REAL AKTIF)**  
**Target Repository:** `c:\laragon\www\keuangan-keluarga`  

---

## ⚠️ ATURAN MUTLAK DATABASE GOOGLE SPREADSHEET (LOCKED):

> [!CAUTION]
> **DILARANG KERAS MENAMBAHKAN SHEET / TABEL / DATABASE BARU KE GOOGLE SPREADSHEET!**  
> Seluruh sistem telah berstatus **Go-Live** dengan data keuangan keluarga riil. Setiap modifikasi struktur sheet berpotensi merusak sinkronisasi atau membuat data menjadi rancu (*confused/corrupted*).

### 1. Struktur 11 Sheet Resmi (Final, Paten, & Locked):
Tidak boleh ada penambahan sheet ke-12 atau modifikasi nama sheet berikut:
1. `Keluarga_Transaksi` — Riwayat mutasi, pemasukan, pengeluaran, transfer saldo keluarga.
2. `Usaha_Ibu_Transaksi` — Riwayat arus kas sewa kost dan penjualan gas LPG.
3. `Tagihan_Rutin_Bulanan` — Tagihan bulanan keluarga (PLN, PDAM, Wifi, dll).
4. `Usaha_Ibu_Kost` — Manajemen kamar kost 01–04, tarif sewa, nama penghuni, status bayar.
5. `Usaha_Ibu_Gas` — Stok tabung isi/kosong/pinjam dan harga modal/jual.
6. `Usaha_Ibu_Tempo` — Buku bon gas tetangga, tempo kost, dan hutang supplier.
7. `Pendidikan_Anak_Istri` — Anggaran pendidikan anak & kuliah/kursus Umma Atin.
8. `Bakti_Ortu_Kondangan` — Anggaran orang tua/mertua dan kondangan/buwuh.
9. `Servis_Kendaraan` — Jadwal perawatan kendaraan & ganti oli mesin.
10. `Investasi_DanaDarurat` — Pencatatan aset emas Antam & reksa dana syariah.
11. `Celengan_Target_Impian` — Celengan target impian (qurban, umrah, target keluarga).

### 2. Dilarang Menyuntikkan Dummy Data / Baris Contoh:
- Skrip backend Google Apps Script maupun frontend **tidak boleh menyuntikkan data contoh / dummy** ke dalam spreadsheet yang sudah berisi data real.

### 3. Dilarang Merombak Urutan Header / Nama Kolom:
- Seluruh kolom pada 11 sheet di atas telah dipetakan secara presisi dengan parser frontend. Jangan mengubah nama kolom atau urutan baris judul.

### 4. Kebijakan Pengembangan Fitur Baru di Masa Depan:
- Fitur UI baru (seperti filter, grafik analitik, kalkulator) **wajib menggunakan data dari 11 sheet yang sudah ada** atau disimpan di `localStorage` peramban klien tanpa menambah sheet baru di Google Spreadsheet.

---
*Aturan ini mengikat seluruh pengembang, asisten kecerdasan buatan (AI Agents), dan tim pemelihara.*
