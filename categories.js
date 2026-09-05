/**
 * categories.js - Master Kategori Lengkap & Dinamis 8 Siklus Keuangan Keluarga
 */

const CATEGORIES_DATA = {
  expense: [
    {
      group: "Bakti Orang Tua & Keluarga",
      icon: "heart-handshake",
      color: "emerald",
      items: [
        { name: "Bakti Orang Tua Kandung", defaultWallet: "BCA" },
        { name: "Bakti Ibu & Ayah Mertua", defaultWallet: "BCA" },
        { name: "Bantuan Saudara & Keponakan", defaultWallet: "BCA" }
      ]
    },
    {
      group: "Kondangan & Sosial",
      icon: "gift",
      color: "rose",
      items: [
        { name: "Kondangan / Buwuh Pernikahan", defaultWallet: "Kas Tunai" },
        { name: "Tilik Bayi & Syukuran", defaultWallet: "Kas Tunai" },
        { name: "Tilik Orang Sakit & Santunan", defaultWallet: "Kas Tunai" },
        { name: "Arisan RT / RW", defaultWallet: "Kas Tunai" },
        { name: "Iuran PKK & Dasa Wisma", defaultWallet: "Kas Tunai" }
      ]
    },
    {
      group: "Tagihan Rutin Bulanan",
      icon: "calendar-clock",
      color: "amber",
      items: [
        { name: "Listrik PLN", defaultWallet: "BCA" },
        { name: "Air PDAM", defaultWallet: "BCA" },
        { name: "BPJS Kesehatan", defaultWallet: "BCA" },
        { name: "Wifi & Internet Rumah", defaultWallet: "BCA" },
        { name: "Belanja Bulanan Sembako", defaultWallet: "Kas Dapur (Istri)" },
        { name: "SPP Bulanan Sekolah Anak", defaultWallet: "BCA" },
        { name: "Iuran Sampah & Keamanan RT", defaultWallet: "Kas Tunai" }
      ]
    },
    {
      group: "Kebutuhan Mingguan Dapur & Rumah",
      icon: "shopping-bag",
      color: "teal",
      items: [
        { name: "Belanja Pasar & Sayur Mayur", defaultWallet: "Kas Dapur (Istri)" },
        { name: "Isi Ulang Air Galon", defaultWallet: "Kas Dapur (Istri)" },
        { name: "Gas LPG 3kg Masak", defaultWallet: "Kas Dapur (Istri)" },
        { name: "Bensin Motor / Mobil Mingguan", defaultWallet: "Kas Tunai" },
        { name: "Uang Saku Mingguan Anak", defaultWallet: "Kas Tunai" }
      ]
    },
    {
      group: "Belanja Online & Kebutuhan Istri",
      icon: "shopping-cart",
      color: "pink",
      items: [
        { name: "Belanja Online Shopee / Tokopedia", defaultWallet: "ShopeePay" },
        { name: "Skincare & Perawatan Umma Atin", defaultWallet: "ShopeePay" },
        { name: "Pampers & Susu Anak", defaultWallet: "Kas Dapur (Istri)" },
        { name: "Pakaian & Hijab Umma Atin / Anak", defaultWallet: "ShopeePay" }
      ]
    },
    {
      group: "Servis Kendaraan & Mobilitas",
      icon: "wrench",
      color: "blue",
      items: [
        { name: "Ganti Oli Mesin & Gardan", defaultWallet: "Kas Tunai" },
        { name: "Servis Rutin & Tune Up", defaultWallet: "BCA" },
        { name: "Ganti Ban & Tambal Ban", defaultWallet: "Kas Tunai" },
        { name: "Aki & Sparepart Kendaraan", defaultWallet: "BCA" },
        { name: "Cuci Motor / Mobil", defaultWallet: "Kas Tunai" }
      ]
    },
    {
      group: "Biaya Per Semester (Anak & Istri)",
      icon: "graduation-cap",
      color: "indigo",
      items: [
        { name: "Semesteran Sekolah Anak (UTS/UAS/LKS)", defaultWallet: "BCA" },
        { name: "Daftar Ulang & Seragam Anak", defaultWallet: "BCA" },
        { name: "UKT / Semesteran Kuliah Istri", defaultWallet: "BCA" },
        { name: "Kursus Skill & Seminar Istri", defaultWallet: "BCA" },
        { name: "Buku & Materi Riset Belajar Istri", defaultWallet: "BCA" }
      ]
    },
    {
      group: "Pajak, Ibadah & Tabungan Tahunan",
      icon: "shield-check",
      color: "violet",
      items: [
        { name: "Pajak PBB Rumah", defaultWallet: "BCA" },
        { name: "Pajak STNK Motor/Mobil Samsat", defaultWallet: "BCA" },
        { name: "Tabungan Qurban Idul Adha", defaultWallet: "BCA" },
        { name: "Anggaran Lebaran & THR Keluarga", defaultWallet: "BCA" },
        { name: "Dana Darurat & Logam Mulia Emas", defaultWallet: "BCA" }
      ]
    },
    {
      group: "Jajan & Harian",
      icon: "coffee",
      color: "orange",
      items: [
        { name: "Jajan Kopi & Cemilan Sore", defaultWallet: "Kas Tunai" },
        { name: "Makan Luar Keluarga", defaultWallet: "GoPay / OVO" },
        { name: "Sedekah Harian / Subuh", defaultWallet: "Kas Tunai" },
        { name: "Parkir & Tol", defaultWallet: "Kas Tunai" }
      ]
    }
  ],
  income: [
    {
      group: "Pemasukan Utama & Tambahan",
      icon: "wallet",
      color: "emerald",
      items: [
        { name: "Gaji / Penghasilan Suami", defaultWallet: "BCA" },
        { name: "Pendapatan Usaha / Bisnis", defaultWallet: "BCA" },
        { name: "Bonus / THR Pekerjaan", defaultWallet: "BCA" },
        { name: "Penghasilan / Bisnis Istri", defaultWallet: "ShopeePay" },
        { name: "Hadiah / Cash Reward", defaultWallet: "Kas Tunai" }
      ]
    }
  ],
  wallets: [
    { id: "kas_suami", name: "Kas Tunai Suami", owner: "suami", type: "cash", initialBalance: 500000 },
    { id: "kas_dapur", name: "Kas Dapur (Istri)", owner: "istri", type: "cash", initialBalance: 750000 },
    { id: "bca", name: "Rekening BCA", owner: "bersama", type: "bank", initialBalance: 12500000 },
    { id: "mandiri_bri", name: "Rekening Mandiri / BRI", owner: "bersama", type: "bank", initialBalance: 4200000 },
    { id: "shopeepay", name: "ShopeePay (Istri)", owner: "istri", type: "ewallet", initialBalance: 350000 },
    { id: "gopay_ovo", name: "GoPay / OVO / DANA", owner: "suami", type: "ewallet", initialBalance: 250000 }
  ]
};

// Dapatkan daftar kategori dari localStorage atau bawaan
function getCategories() {
  const saved = localStorage.getItem("keuangan_keluarga_categories");
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return CATEGORIES_DATA;
}

// Simpan kustomisasi kategori (Lokal & Cloud Sync Otomatis Antar Perangkat)
function saveCategories(cats, shouldSync = true) {
  localStorage.setItem("keuangan_keluarga_categories", JSON.stringify(cats));
  if (shouldSync && window.SyncModule && window.SyncModule.pushTransactionToSyncQueue) {
    window.SyncModule.pushTransactionToSyncQueue("save_categories", { categories: cats });
  }
}

// Terapkan Kategori Kustom dari Cloud ke Browser Lokal
function applyRemoteCategories(remoteCats) {
  if (!remoteCats || typeof remoteCats !== "object") return false;
  if (!Array.isArray(remoteCats.expense) && !Array.isArray(remoteCats.income)) return false;
  
  localStorage.setItem("keuangan_keluarga_categories", JSON.stringify(remoteCats));
  return true;
}

// Tambah Kategori / Sub-kategori baru
function addCategoryItem(type = "expense", groupName, itemName, defaultWallet = "Kas Tunai") {
  const cats = getCategories();
  if (!cats[type]) cats[type] = [];

  let g = cats[type].find(x => x.group.toLowerCase() === groupName.trim().toLowerCase());
  if (!g) {
    g = {
      group: groupName.trim(),
      icon: "tag",
      color: "emerald",
      items: []
    };
    cats[type].push(g);
  }

  const exists = g.items.find(i => i.name.toLowerCase() === itemName.trim().toLowerCase());
  if (!exists) {
    g.items.push({ name: itemName.trim(), defaultWallet: defaultWallet || "Kas Tunai" });
  }

  saveCategories(cats, true);
  return cats;
}

// Edit Sub-kategori
function editCategoryItem(type = "expense", groupName, oldItemName, newItemName) {
  const cats = getCategories();
  if (!cats[type]) return cats;

  const g = cats[type].find(x => x.group.toLowerCase() === groupName.trim().toLowerCase());
  if (g) {
    const item = g.items.find(i => i.name.toLowerCase() === oldItemName.trim().toLowerCase());
    if (item) {
      item.name = newItemName.trim();
      saveCategories(cats, true);
    }
  }
  return cats;
}

// Hapus Sub-kategori
function deleteCategoryItem(type = "expense", groupName, itemName) {
  const cats = getCategories();
  if (!cats[type]) return cats;

  const g = cats[type].find(x => x.group.toLowerCase() === groupName.trim().toLowerCase());
  if (g) {
    g.items = g.items.filter(i => i.name.toLowerCase() !== itemName.trim().toLowerCase());
    if (g.items.length === 0) {
      cats[type] = cats[type].filter(x => x.group.toLowerCase() !== groupName.trim().toLowerCase());
    }
    saveCategories(cats, true);
  }
  return cats;
}

// Reset Kategori ke default bawaan
function resetCategoriesToDefault() {
  localStorage.removeItem("keuangan_keluarga_categories");
  if (window.SyncModule && window.SyncModule.pushTransactionToSyncQueue) {
    window.SyncModule.pushTransactionToSyncQueue("save_categories", { categories: CATEGORIES_DATA });
  }
  return CATEGORIES_DATA;
}

window.CategoriesModule = {
  CATEGORIES_DATA,
  getCategories,
  saveCategories,
  applyRemoteCategories,
  addCategoryItem,
  editCategoryItem,
  deleteCategoryItem,
  resetCategoriesToDefault
};
