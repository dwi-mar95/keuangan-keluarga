/**
 * auth.js - Sistem Keamanan & Autentikasi Cerdas Ramah Keluarga
 * Mendukung PIN 8-Digit Rahasia Keluarga (29122021), Remember Me Selamanya di HP, QR Code Pairing, & Biometrik
 */

const AUTH_STORAGE_KEY = "keuangan_keluarga_auth_session";
const PIN_STORAGE_KEY = "keuangan_keluarga_family_pin";
const USER_PROFILE_KEY = "keuangan_keluarga_active_profile";
const PRIVACY_MODE_KEY = "keuangan_keluarga_privacy_mode";

// Default PIN Rahasia Keluarga (Dapat diubah di menu Pengaturan)
const DEFAULT_PIN = "2429";

// Cek apakah sudah login permanen di HP ini
function isAuthenticated() {
  const session = localStorage.getItem(AUTH_STORAGE_KEY);
  return session === "valid_family_session";
}

// Dapatkan PIN aktif (otomatis migrasi jika masih tersimpan PIN lama 29122021)
function getFamilyPin() {
  const saved = localStorage.getItem(PIN_STORAGE_KEY);
  if (!saved || saved === "29122021") {
    localStorage.setItem(PIN_STORAGE_KEY, DEFAULT_PIN);
    return DEFAULT_PIN;
  }
  return saved;
}

// Ubah PIN keluarga
function setFamilyPin(newPin) {
  if (!newPin || newPin.length < 4) return false;
  localStorage.setItem(PIN_STORAGE_KEY, newPin);
  return true;
}

// Verifikasi PIN login
function verifyPin(inputPin, rememberMe = true, profile = "suami") {
  const correctPin = getFamilyPin();
  if (inputPin === correctPin) {
    if (rememberMe) {
      localStorage.setItem(AUTH_STORAGE_KEY, "valid_family_session");
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, "valid_family_session");
    }
    setActiveProfile(profile);
    return true;
  }
  return false;
}

// Logout & Hapus Sesi
function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  window.location.reload();
}

// Profil Aktif (suami, istri, keluarga)
function getActiveProfile() {
  return localStorage.getItem(USER_PROFILE_KEY) || "keluarga";
}

function setActiveProfile(profile) {
  localStorage.setItem(USER_PROFILE_KEY, profile);
  window.dispatchEvent(new CustomEvent("profile-changed", { detail: { profile } }));
}

// Mode Privasi (Sensor nominal saldo)
function isPrivacyMode() {
  return localStorage.getItem(PRIVACY_MODE_KEY) === "true";
}

function togglePrivacyMode() {
  const current = isPrivacyMode();
  localStorage.setItem(PRIVACY_MODE_KEY, (!current).toString());
  window.dispatchEvent(new CustomEvent("privacy-mode-changed", { detail: { isPrivacy: !current } }));
  return !current;
}

// Format sensor angka jika privacy mode aktif
function maskMoney(formattedRupiah) {
  if (!isPrivacyMode()) return formattedRupiah;
  return "Rp ••••••••";
}

// Generate URL Pairing untuk HP Istri (Tinggal di-scan QR)
function generatePairingUrlForWife() {
  const currentUrl = window.location.origin + window.location.pathname;
  const pin = getFamilyPin();
  return `${currentUrl}?pair=istri&token=${btoa("family_auth_" + pin)}`;
}

// Tangani Auto-Login dari URL Pairing QR Code
function checkUrlPairing() {
  const params = new URLSearchParams(window.location.search);
  const pair = params.get("pair");
  const token = params.get("token");

  if (pair && token) {
    try {
      const decoded = atob(token);
      const pin = getFamilyPin();
      if (decoded === "family_auth_" + pin) {
        localStorage.setItem(AUTH_STORAGE_KEY, "valid_family_session");
        setActiveProfile(pair === "istri" ? "istri" : "suami");
        window.history.replaceState({}, document.title, window.location.pathname);
        return true;
      }
    } catch (e) {
      console.warn("Pairing token invalid");
    }
  }
  return false;
}

window.AuthModule = {
  isAuthenticated,
  getFamilyPin,
  setFamilyPin,
  verifyPin,
  logout,
  getActiveProfile,
  setActiveProfile,
  isPrivacyMode,
  togglePrivacyMode,
  maskMoney,
  generatePairingUrlForWife,
  checkUrlPairing
};
