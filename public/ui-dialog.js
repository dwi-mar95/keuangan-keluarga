/**
 * ui-dialog.js - Sistem Dialog & Notifikasi Modern, Elegan & Profesional
 * Menggantikan popup 'browser says' yang kusam dengan Toast Notification & Modal Konfirmasi Cantik
 */

(function initDialogDom() {
  document.addEventListener("DOMContentLoaded", () => {
    // 1. Toast Container
    if (!document.getElementById("toastContainer")) {
      const toastCont = document.createElement("div");
      toastCont.id = "toastContainer";
      toastCont.className = "fixed top-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none w-full max-w-sm px-4";
      toastCont.style.zIndex = "130000";
      document.body.appendChild(toastCont);
    }

    // 2. Custom Confirm Modal
    if (!document.getElementById("customConfirmModal")) {
      const confirmModal = document.createElement("div");
      confirmModal.id = "customConfirmModal";
      confirmModal.className = "modal-backdrop hidden transition-opacity duration-200 p-4";
      confirmModal.style.zIndex = "120000";
      confirmModal.innerHTML = `
        <div class="modal-content text-center space-y-4 max-w-sm mx-auto p-6 rounded-2xl bg-white shadow-2xl border border-slate-100 my-auto">
          <div id="confirmModalIcon" class="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-sm">
            ✨
          </div>
          <div class="space-y-1">
            <h3 id="confirmModalTitle" class="text-base font-black text-slate-900">Konfirmasi</h3>
            <p id="confirmModalMessage" class="text-xs text-slate-500 leading-relaxed font-medium">Apakah Anda yakin?</p>
          </div>
          <div class="flex gap-2.5 pt-2">
            <button id="btnConfirmCancel" class="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer">
              Batal
            </button>
            <button id="btnConfirmOk" class="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs transition-all cursor-pointer shadow-md">
              Lanjutkan
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmModal);
    }

    // 3. Custom Prompt Modal
    if (!document.getElementById("customPromptModal")) {
      const promptModal = document.createElement("div");
      promptModal.id = "customPromptModal";
      promptModal.className = "modal-backdrop hidden transition-opacity duration-200 p-4";
      promptModal.style.zIndex = "120000";
      promptModal.innerHTML = `
        <div class="modal-content space-y-4 max-w-sm mx-auto p-6 rounded-2xl bg-white shadow-2xl border border-slate-100 my-auto">
          <div class="space-y-1">
            <h3 id="promptModalTitle" class="text-sm font-black text-slate-900">Input Data</h3>
            <p id="promptModalMessage" class="text-xs text-slate-500 font-medium">Silakan masukkan data:</p>
          </div>
          <input type="text" id="promptModalInput" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500">
          <div class="flex gap-2.5 pt-1">
            <button id="btnPromptCancel" class="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer">
              Batal
            </button>
            <button id="btnPromptOk" class="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs transition-all cursor-pointer shadow-md">
              Lanjutkan
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(promptModal);
    }
  });
})();

/**
 * Toast Notification Modern (Menggantikan alert bawaan)
 */
let currentToastTimeout = null;

function showToast(message, type = "success", duration = 2200) {
  const container = document.getElementById("toastContainer");
  if (!container) {
    console.log(message);
    return;
  }

  // Jika pesan yang sama persis sedang tampil, jangan duplikasi animasi
  const activeExisting = container.querySelector(".toast-item");
  if (activeExisting && activeExisting.dataset.msg === String(message)) {
    return;
  }

  // Bersihkan toast sebelumnya agar tidak menumpuk dan macet di layar
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  if (currentToastTimeout) {
    clearTimeout(currentToastTimeout);
    currentToastTimeout = null;
  }

  const toast = document.createElement("div");
  toast.dataset.msg = String(message);
  toast.className = "toast-item pointer-events-auto cursor-pointer flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-bold transition-all duration-300 transform translate-y-2 opacity-0 select-none";

  let icon = "✅";
  if (type === "success") {
    toast.className += " bg-emerald-900/95 text-emerald-100 border-emerald-700/60 backdrop-blur-md";
    icon = "✨";
  } else if (type === "error") {
    toast.className += " bg-rose-900/95 text-rose-100 border-rose-700/60 backdrop-blur-md";
    icon = "❌";
  } else if (type === "warning") {
    toast.className += " bg-amber-900/95 text-amber-100 border-amber-700/60 backdrop-blur-md";
    icon = "⚠️";
  } else {
    toast.className += " bg-slate-900/95 text-slate-100 border-slate-700/60 backdrop-blur-md";
    icon = "ℹ️";
  }

  toast.innerHTML = `
    <div class="flex items-center gap-2.5">
      <span class="text-sm shrink-0">${icon}</span>
      <span class="leading-snug">${String(message).replace(/\n/g, "<br>")}</span>
    </div>
    <button type="button" aria-label="Tutup" class="text-white/60 hover:text-white p-0.5 ml-1 text-xs shrink-0">&times;</button>
  `;

  // Klik langsung untuk menutup toast seketika (Tap to Dismiss)
  const dismiss = () => {
    toast.classList.add("opacity-0", "-translate-y-2");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 200);
  };
  toast.onclick = dismiss;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  });

  currentToastTimeout = setTimeout(() => {
    dismiss();
  }, duration);
}

/**
 * Custom Confirm Modal (Menggantikan confirm bawaan)
 */
function showConfirm(title, message, options = {}) {
  return new Promise((resolve) => {
    const modal = document.getElementById("customConfirmModal");
    const titleEl = document.getElementById("confirmModalTitle");
    const msgEl = document.getElementById("confirmModalMessage");
    const iconEl = document.getElementById("confirmModalIcon");
    const btnOk = document.getElementById("btnConfirmOk");
    const btnCancel = document.getElementById("btnConfirmCancel");

    if (!modal) {
      resolve(true);
      return;
    }

    titleEl.textContent = title || "Konfirmasi";
    msgEl.innerHTML = (message || "Apakah Anda yakin?").replace(/\n/g, "<br>");
    btnOk.textContent = options.confirmText || "Ya, Lanjutkan";
    btnCancel.textContent = options.cancelText || "Batal";

    const iconType = options.type || "question";
    if (iconType === "danger") {
      iconEl.className = "w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-sm bg-rose-50 text-rose-600";
      iconEl.textContent = "🗑️";
      btnOk.className = "flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition-all cursor-pointer shadow-md";
    } else if (iconType === "whatsapp") {
      iconEl.className = "w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-sm bg-emerald-50 text-emerald-600";
      iconEl.textContent = "💬";
      btnOk.className = "flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs transition-all cursor-pointer shadow-md";
    } else {
      iconEl.className = "w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-sm bg-emerald-50 text-emerald-600";
      iconEl.textContent = "✨";
      btnOk.className = "flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs transition-all cursor-pointer shadow-md";
    }

    modal.classList.remove("hidden");

    function cleanup() {
      modal.classList.add("hidden");
      btnOk.onclick = null;
      btnCancel.onclick = null;
    }

    btnOk.onclick = () => { cleanup(); resolve(true); };
    btnCancel.onclick = () => { cleanup(); resolve(false); };
  });
}

/**
 * Custom Prompt Modal (Menggantikan prompt bawaan)
 */
function showPrompt(title, message, defaultValue = "") {
  return new Promise((resolve) => {
    const modal = document.getElementById("customPromptModal");
    const titleEl = document.getElementById("promptModalTitle");
    const msgEl = document.getElementById("promptModalMessage");
    const inputEl = document.getElementById("promptModalInput");
    const btnOk = document.getElementById("btnPromptOk");
    const btnCancel = document.getElementById("btnPromptCancel");

    if (!modal) {
      resolve(defaultValue);
      return;
    }

    titleEl.textContent = title || "Input Data";
    msgEl.innerHTML = (message || "Silakan masukkan data:").replace(/\n/g, "<br>");
    inputEl.value = defaultValue || "";

    modal.classList.remove("hidden");
    inputEl.focus();

    function cleanup() {
      modal.classList.add("hidden");
      btnOk.onclick = null;
      btnCancel.onclick = null;
    }

    btnOk.onclick = () => {
      const val = inputEl.value;
      cleanup();
      resolve(val);
    };

    btnCancel.onclick = () => {
      cleanup();
      resolve(null);
    };
  });
}

// Global Exports
window.showToast = showToast;
window.showConfirm = showConfirm;
window.showPrompt = showPrompt;

// Override window.alert bawaan browser
window.alert = function(msg) {
  showToast(msg, "info");
};
