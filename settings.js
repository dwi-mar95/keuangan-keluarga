/**
 * settings.js - Modul Kustomisasi Logo Cerah, Nama Keluarga, & Pilihan Tema Warna
 */

const SETTINGS_STORAGE_KEY = "keuangan_keluarga_branding_settings";

const DEFAULT_SETTINGS = {
  familyName: "Keluarga Baba Pangestu & Umma Atin",
  logoType: "preset", // "preset" | "custom_upload"
  presetIcon: "🏡",   // 🏡 | 👨‍👩‍👧‍👦 | 🌸 | 🌟 | 💎 | 🍃
  customLogoUrl: "",
  activeTheme: "emerald", // "emerald" | "amber" | "blue" | "purple"
  enableSound: true
};

function getSettings() {
  const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (saved) {
    try { return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }; } catch (e) {}
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  applyTheme(settings.activeTheme);
  window.dispatchEvent(new CustomEvent("settings-changed", { detail: settings }));
}

// Terapkan tema warna pada root document
function applyTheme(themeName = "emerald") {
  const root = document.documentElement;
  root.setAttribute("data-theme", themeName);
}

// Play sound ring koin lembut saat simpan transaksi
function playSuccessSound() {
  const settings = getSettings();
  if (!settings.enableSound) return;

  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch (e) {
    // browser audio context not permitted yet
  }
}

window.SettingsModule = {
  getSettings,
  saveSettings,
  applyTheme,
  playSuccessSound
};
