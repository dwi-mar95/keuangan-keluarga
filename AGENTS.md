# 🛡️ ATURAN RESMI PENGEMBANGAN & GO-LIVE (PRODUCTION SCHEMA FREEZE)
**Aplikasi:** Catatan Keuangan Keluarga Baba Pangestu & Umma Atin + Usaha Ibu  
**Status Lingkungan:** 🟢 **GO-LIVE / PRODUCTION (DATA REAL AKTIF)**  
**Target Repository:** `c:\laragon\www\keuangan-keluarga`  
**Live URL:** `https://dwi-mar95.github.io/keuangan-keluarga/`

---

## ⚠️ 1. ATURAN MUTLAK DATABASE GOOGLE SPREADSHEET (LOCKED):

> [!CAUTION]
> **DILARANG KERAS MENAMBAHKAN SHEET / TABEL / DATABASE BARU KE GOOGLE SPREADSHEET!**  
> Seluruh sistem telah berstatus **Go-Live** dengan data keuangan keluarga riil. Setiap modifikasi struktur sheet berpotensi merusak sinkronisasi atau membuat data menjadi rancu (*confused/corrupted*).

### 1.1 Struktur 11 Sheet Resmi (Final, Paten, & Locked):
Tidak boleh ada penambahan sheet ke-12 atau modifikasi nama sheet berikut:
1. `Keluarga_Transaksi` — Riwayat mutasi, pemasukan, pengeluaran, transfer saldo keluarga.
2. `Usaha_Ibu_Transaksi` — Riwayat arus kas sewa kost, penjualan gas LPG, & sedekah/berbagi.
3. `Tagihan_Rutin_Bulanan` — Tagihan bulanan keluarga (PLN, PDAM, Wifi, dll).
4. `Usaha_Ibu_Kost` — Manajemen kamar kost 01–05, tarif sewa, nama penghuni, status bayar.
5. `Usaha_Ibu_Gas` — Stok tabung isi/kosong/pinjam dan harga modal/jual.
6. `Usaha_Ibu_Tempo` — Buku bon gas tetangga, tempo kost, dan hutang supplier.
7. `Pendidikan_Anak_Istri` — Anggaran pendidikan anak & kuliah/kursus Umma Atin.
8. `Bakti_Ortu_Kondangan` — Anggaran orang tua/mertua dan kondangan/buwuh.
9. `Servis_Kendaraan` — Jadwal perawatan kendaraan & ganti oli mesin.
10. `Investasi_DanaDarurat` — Pencatatan aset emas Antam & reksa dana syariah.
11. `Celengan_Target_Impian` — Celengan target impian (qurban, umrah, target keluarga).

### 1.2 Dilarang Menyuntikkan Dummy Data / Baris Contoh:
- Backend Google Apps Script maupun frontend **tidak boleh menyuntikkan data contoh / dummy** ke dalam spreadsheet yang sudah berisi data real.

### 1.3 Dilarang Merombak Urutan Header / Nama Kolom:
- Seluruh kolom pada 11 sheet di atas telah dipetakan secara presisi dengan parser frontend. Jangan mengubah nama kolom atau urutan baris judul.

### 1.4 Kebijakan Pengembangan Fitur Baru:
- Fitur UI baru (seperti filter, grafik analitik, kalkulator, pencatatan sedekah/berbagi) **wajib menggunakan data dari 11 sheet yang sudah ada** atau disimpan di `localStorage` peramban klien tanpa menambah sheet baru di Google Spreadsheet.

---

## 📐 2. KEBIJAKAN INTEGRITAS & STANDARISASI DATA (DATA INTEGRITY)

1. **Format Tanggal Baku Universal (WIB ISO 8601):**  
   - Seluruh penulisan tanggal ke spreadsheet **wajib menggunakan format baku `YYYY-MM-DD HH:mm:ss` (WIB)**.  
   - Dilarang menulis format lokal ambigu seperti `DD/MM/YYYY` langsung ke cell tanggal untuk mencegah kerancuan locale US vs Indonesia (misal: 3 September tertukar dengan 9 Maret).
2. **Sanitasi Nilai Moneter (Pure Integer / Numeric):**  
   - Semua kolom nominal uang (Rupiah), harga modal, harga jual, dan laba bersih **wajib bertipe Number / Integer murni** (contoh: `210000`, bukan teks `"Rp 210.000"`).  
   - Ini menjamin formula agregasi spreadsheet (`SUM`, `AVERAGE`) dan grafik analitik frontend tidak pernah mengalami error `#VALUE!`.
3. **Kewajiban ID Transaksi Unik (Immutable ID):**  
   - Setiap transaksi wajib memiliki pengenal unik permanen di Kolom A (misal: `tx_1788...` atau `ib_1788...`).  
   - ID ini dilarang berubah saat operasi edit/update agar proses pembaruan baris di spreadsheet tetap presisi.

---

## ⚡ 3. PROTOKOL SINKRONISASI DUA ARAH & ANTI-RACE CONDITION

1. **Proteksi Smart Anti-Revert:**  
   - Data lokal yang sedang berada di antrean sinkronisasi (`pendingQueue`) **tidak boleh ditimpa** oleh penarikan otomatis (`pullFromSpreadsheet`) dari server.
2. **Throttle Penarikan Latar Belakang:**  
   - Auto-pull saat pengguna berpindah tab/layar dibatasi minimal interval jeda 30 detik untuk menghindari lonjakan beban request (*request spamming*) dan balapan tulis-baca (*race condition*).
3. **Invalidasi Cache Pasca-Mutasi:**  
   - Setiap operasi `POST` (`batch_sync`, edit, delete) wajib menginvalidasi cache Google Apps Script (`CacheService`), dan klien harus melakukan tarikan ulang dengan parameter `force=true&nocache=true` setelah penulisan selesai.
4. **Resiliensi Offline-First:**  
   - Aplikasi harus tetap dapat digunakan mencatat saat perangkat kehilangan jaringan internet, menyimpannya di antrean lokal, dan memicu sinkronisasi otomatis ketika koneksi kembali terhubung.

---

## 🔒 4. KEAMANAN, KREDENSIAL & PRIVASI KELUARGA (SECURITY & PRIVACY)

1. **Zero Hardcoded Secrets Policy:**  
   - Dilarang keras menyimpan password pribadi, nomor rekening sensitif, atau API Token internal secara terbuka (*plain text*) di repository publik.
2. **Mode Privasi Ruang Publik (*Privacy Eye Masking*):**  
   - Fitur sensor saldo wajib melindungi seluruh angka rupiah di tampilan utama menjadi `Rp ••••••••` saat tombol mata diaktifkan, demi kenyamanan keluarga saat membuka aplikasi di ruang publik.
3. **Perlindungan PIN & Sesi Tepercaya:**  
   - Layar kunci PIN melindungi privasi data keluarga. Perangkat pribadi yang telah diverifikasi dengan opsi *"Ingat di perangkat ini"* diberikan token sesi agar tidak membebani login berulang kali.

---

## 🚀 5. STANDAR RELEASE & CI/CD GITHUB PAGES

1. **Branch Protection & Automated Build:**  
   - Branch `main` harus selalu berada dalam kondisi siap produksi (*clean build*).  
   - Setiap perubahan wajib lolos uji sintaks (`node -c`) dan lolos kompilasi Astro (`npm run build`).
2. **Cache-Busting Otomatis Tanpa F5 Manual:**  
   - Setiap perilisan baru wajib menyertakan query build timestamp unik (`?v=${buildTime}`) pada seluruh pemanggilan file JS dan CSS di `Layout.astro`, serta Service Worker auto-update agar browser pengguna langsung memuat kode termutakhir.
3. **Subpath Safe URL Resolution:**  
   - Semua path asset dan navigasi wajib menghormati subfolder base path `import.meta.env.BASE_URL` (`/keuangan-keluarga/`) agar tidak menimbulkan error 404 pada GitHub Pages maupun lingkungan lokal.

---

## 🤝 6. PRINSIP KEUANGAN KELUARGA & AMAL USAHA IBU

1. **Pemisahan Tegas Kas Keluarga vs Usaha Ibu:**  
   - Buku kas belanja rumah tangga keluarga tidak boleh bercampur dengan arus kas operasional sewa kost dan penjualan gas LPG Ibu.
2. **Pencatatan Berbagi / Sedekah (Mbah & Tetangga):**  
   - Pemberian tabung gas gratis atau santunan kas untuk simbah/tetangga tercatat resmi di buku kas Usaha Ibu sebagai pengeluaran amal sosial dengan Laba = Rp 0, sehingga fisik tabung gas dan uang kas tetap klop 100%.
3. **Komunikasi Penagihan Ramah (WhatsApp Silaturahmi):**  
   - Format pesan pengingat tagihan kost dan bon gas tetangga disusun dengan tata bahasa yang santun dan mengedepankan etika silaturahmi bertetangga.

---
*Kebijakan ini mengikat seluruh pengembang, asisten kecerdasan buatan (AI Agents), dan tim pemelihara.*
