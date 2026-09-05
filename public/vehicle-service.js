/**
 * vehicle-service.js - Modul Pemeliharaan Kendaraan & Pengingat Servis / Ganti Oli
 */

const VEHICLE_STORAGE_KEY = "keuangan_keluarga_vehicles";
const SERVICE_LOGS_KEY = "keuangan_keluarga_service_logs";

// Data Awal Kendaraan Keluarga
const DEFAULT_VEHICLES = [
  { id: "v_motor_1", name: "Motor Vario Baba Pangestu", type: "motor", plat: "R 4567 AA", lastOilDate: "2026-07-15", nextOilDate: "2026-09-15" },
  { id: "v_motor_2", name: "Motor Beat Umma Atin", type: "motor", plat: "R 2345 BB", lastOilDate: "2026-08-01", nextOilDate: "2026-10-01" },
  { id: "v_mobil_1", name: "Mobil Keluarga", type: "mobil", plat: "R 1234 CC", lastOilDate: "2026-06-20", nextOilDate: "2026-09-20" }
];

function getVehicles() {
  const saved = localStorage.getItem(VEHICLE_STORAGE_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return DEFAULT_VEHICLES;
}

function saveVehicles(vehicles) {
  localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(vehicles));
  if (window.SyncModule && window.SyncModule.pushTransactionToSyncQueue) {
    window.SyncModule.pushTransactionToSyncQueue("sync_vehicles", { vehicles });
  }
}

function updateVehicle(id, updated) {
  const vehicles = getVehicles();
  const idx = vehicles.findIndex(v => v.id === id);
  if (idx !== -1) {
    vehicles[idx] = { ...vehicles[idx], ...updated };
    saveVehicles(vehicles);
    return vehicles[idx];
  }
  return null;
}

function getServiceLogs() {
  const saved = localStorage.getItem(SERVICE_LOGS_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return [
    { id: "srv_1", vehicleId: "v_motor_1", vehicleName: "Motor Vario Baba Pangestu", type: "Ganti Oli Mesin & Gardan", cost: 95000, date: "2026-07-15", workshop: "Bengkel Langganan" },
    { id: "srv_2", vehicleId: "v_motor_2", vehicleName: "Motor Beat Umma Atin", type: "Ganti Oli Mesin & Tune Up", cost: 120000, date: "2026-08-01", workshop: "Bengkel Resmi" }
  ];
}

// Catat servis baru & perbarui tanggal pengingat ganti oli
function addServiceRecord(record) {
  const logs = getServiceLogs();
  logs.unshift({
    id: "srv_" + Date.now(),
    ...record,
    date: record.date || (window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0])
  });
  localStorage.setItem(SERVICE_LOGS_KEY, JSON.stringify(logs));

  // Jika servis mengandung ganti oli, update jadwal ganti oli berikutnya (default +60 hari)
  if (record.type && record.type.toLowerCase().includes("oli")) {
    const vehicles = getVehicles();
    const v = vehicles.find(veh => veh.id === record.vehicleId);
    if (v) {
      v.lastOilDate = record.date;
      const nextDate = new Date(record.date);
      nextDate.setDate(nextDate.getDate() + 60); // 2 bulan kemudian
      v.nextOilDate = nextDate.toISOString().split("T")[0];
      saveVehicles(vehicles);
    }
  }

  // Tambahkan transaksi ke kas keluarga
  if (window.AppModule && window.AppModule.addTransaction) {
    window.AppModule.addTransaction({
      type: "expense",
      category: "Servis Kendaraan & Mobilitas",
      subCategory: record.type,
      amount: record.cost,
      wallet: record.wallet || "Kas Tunai",
      note: `${record.vehicleName} - ${record.workshop || "Bengkel"}`,
      date: record.date
    });
  }

  return true;
}

// Cek kendaraan yang sudah jatuh tempo ganti oli
function getDueServiceReminders() {
  const vehicles = getVehicles();
  const today = window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0];
  const dueVehicles = [];

  vehicles.forEach(v => {
    if (v.nextOilDate && v.nextOilDate <= today) {
      dueVehicles.push(v);
    }
  });

  return dueVehicles;
}

window.VehicleServiceModule = {
  getVehicles,
  saveVehicles,
  updateVehicle,
  getServiceLogs,
  addServiceRecord,
  getDueServiceReminders
};
