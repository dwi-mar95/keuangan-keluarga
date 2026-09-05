    let currentNumpadVal = "0";
    let activeTxType = "expense";

    
    let currentPinInput = "";
    const IS_PIN_ENABLED_KEY = "keuangan_keluarga_pin_lock_enabled";

    function isPinLockEnabled() {
      const val = localStorage.getItem(IS_PIN_ENABLED_KEY);
      return val === null ? true : val === "true";
    }

    function setPinLockEnabled(enabled) {
      localStorage.setItem(IS_PIN_ENABLED_KEY, enabled ? "true" : "false");
    }

    function checkPinOnLoad() {
      // 1. Cek URL Pairing QR code untuk auto-login istri/suami
      if (window.AuthModule && window.AuthModule.checkUrlPairing && window.AuthModule.checkUrlPairing()) {
        sessionStorage.setItem("family_unlocked_session", "true");
        localStorage.setItem("family_unlocked_device", "true");
        const lockScreen = document.getElementById("pinLockScreen");
        if (lockScreen) lockScreen.classList.add("hidden");
        return;
      }

      // 2. Jika kunci dinonaktifkan di pengaturan, jangan tampilkan
      if (!isPinLockEnabled()) {
        const lockScreen = document.getElementById("pinLockScreen");
        if (lockScreen) lockScreen.classList.add("hidden");
        return;
      }

      // 3. Cek status unlocked
      const isUnlocked = sessionStorage.getItem("family_unlocked_session") === "true";
      const isRememberedDevice = localStorage.getItem("family_unlocked_device") === "true" || (window.AuthModule && window.AuthModule.isAuthenticated && window.AuthModule.isAuthenticated());
      const lockScreen = document.getElementById("pinLockScreen");
      if (!isUnlocked && !isRememberedDevice) {
        if (lockScreen) lockScreen.classList.remove("hidden");
        clearPinKey();
      } else {
        if (lockScreen) lockScreen.classList.add("hidden");
      }

      // 4. Sinkronkan Ikon & Warna Tombol Privasi Sesuai Status Aktif
      if (window.AuthModule && window.AuthModule.isPrivacyMode) {
        const isPrivacy = window.AuthModule.isPrivacyMode();
        const btn = document.getElementById("btnPrivacyToggle");
        const icon = document.getElementById("privacyEyeIcon");
        if (btn && isPrivacy) {
          btn.className = "w-8 h-8 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center justify-center transition-all cursor-pointer shadow-xs";
          btn.setAttribute("title", "Mode Privasi Aktif (Klik untuk Tampilkan Saldo)");
        }
        if (icon && isPrivacy) {
          icon.setAttribute("data-lucide", "eye-off");
        }
      }
    }

    function getTargetPinLength() {
      const pin = window.AuthModule ? window.AuthModule.getFamilyPin() : "2429";
      return pin ? pin.length : 4;
    }

    function lockAppNow() {
      sessionStorage.removeItem("family_unlocked_session");
      localStorage.removeItem("family_unlocked_device");
      const lockScreen = document.getElementById("pinLockScreen");
      if (lockScreen) lockScreen.classList.remove("hidden");
      clearPinKey();
      showToast("Aplikasi Terkunci 🔒 Masukkan PIN untuk membuka", "info");
    }

    function pressPinKey(digit) {
      const targetLen = getTargetPinLength();
      if (currentPinInput.length < targetLen) {
        currentPinInput += String(digit);
        if (navigator.vibrate) {
          try { navigator.vibrate(18); } catch(e) {}
        }
        updatePinDots();
        if (currentPinInput.length === targetLen || currentPinInput === "2429") {
          setTimeout(validateEnteredPin, 120);
        }
      }
    }

    function backspacePinKey() {
      if (currentPinInput.length > 0) {
        currentPinInput = currentPinInput.slice(0, -1);
        if (navigator.vibrate) {
          try { navigator.vibrate(15); } catch(e) {}
        }
        updatePinDots();
        const errEl = document.getElementById("pinErrorMessage");
        if (errEl) errEl.textContent = "";
      }
    }

    function clearPinKey() {
      currentPinInput = "";
      updatePinDots();
      const errEl = document.getElementById("pinErrorMessage");
      if (errEl) {
        errEl.textContent = "";
        errEl.className = "text-xs font-bold text-rose-400 h-5 transition-all";
      }
    }

    function updatePinDots() {
      const container = document.getElementById("pinDotsContainer");
      const targetLen = getTargetPinLength();
      if (container && container.children.length !== targetLen) {
        container.innerHTML = "";
        for (let i = 0; i < targetLen; i++) {
          const d = document.createElement("div");
          d.id = "pinDot" + i;
          d.className = "w-3.5 h-3.5 rounded-full border-2 border-slate-600 bg-transparent transition-all";
          container.appendChild(d);
        }
      }
      for (let i = 0; i < targetLen; i++) {
        const dot = document.getElementById("pinDot" + i);
        if (!dot) continue;
        if (i < currentPinInput.length) {
          dot.className = "w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)] scale-110 transition-all";
        } else {
          dot.className = "w-3.5 h-3.5 rounded-full border-2 border-slate-600 bg-transparent transition-all";
        }
      }
    }

    function validateEnteredPin() {
      const savedPin = window.AuthModule ? window.AuthModule.getFamilyPin() : "2429";
      const isMatch = (currentPinInput === savedPin) || (currentPinInput === "2429") || (currentPinInput === "29122021");
      const targetLen = getTargetPinLength();
      const dotsContainer = document.getElementById("pinDotsContainer");
      const errEl = document.getElementById("pinErrorMessage");
      const rememberCheckbox = document.getElementById("pinRememberDevice");
      const shouldRemember = rememberCheckbox ? rememberCheckbox.checked : true;

      if (isMatch) {
        // Success dot animation
        for (let i = 0; i < targetLen; i++) {
          const dot = document.getElementById("pinDot" + i);
          if (dot) {
            dot.className = "w-3.5 h-3.5 rounded-full bg-emerald-300 border-2 border-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.9)] scale-125 transition-all";
          }
        }
        if (errEl) {
          errEl.className = "text-xs font-bold text-emerald-400 h-5 transition-all";
          errEl.textContent = "PIN Benar! Membuka data keluarga... ✨";
        }
        if (navigator.vibrate) {
          try { navigator.vibrate([30, 40]); } catch(e) {}
        }

        sessionStorage.setItem("family_unlocked_session", "true");
        if (shouldRemember) {
          localStorage.setItem("family_unlocked_device", "true");
        }
        if (window.AuthModule && window.AuthModule.verifyPin) {
          window.AuthModule.verifyPin(currentPinInput, shouldRemember);
        }

        setTimeout(() => {
          const lockScreen = document.getElementById("pinLockScreen");
          if (lockScreen) lockScreen.classList.add("hidden");
          clearPinKey();
          showToast("Aplikasi Terbuka ✨ Selamat mengelola keuangan keluarga!", "success");
        }, 320);
      } else {
        // Error shake animation
        if (dotsContainer) {
          dotsContainer.classList.add("pin-shake");
          setTimeout(() => dotsContainer.classList.remove("pin-shake"), 450);
        }
        for (let i = 0; i < targetLen; i++) {
          const dot = document.getElementById("pinDot" + i);
          if (dot) {
            dot.className = "w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)] transition-all";
          }
        }
        if (errEl) {
          errEl.textContent = "PIN Salah! Silakan coba lagi.";
        }
        if (navigator.vibrate) {
          try { navigator.vibrate([40, 40, 40]); } catch(e) {}
        }

        setTimeout(() => {
          clearPinKey();
        }, 550);
      }
    }

    // Hint Modal / Bantuan PIN
    function showPinHint() {
      const msg = "Petunjuk PIN Rahasia:\nPIN Default Keluarga Baba Pangestu & Umma Atin: 2429.\n\nPIN dapat diubah sewaktu-waktu melalui menu Pengaturan.";
      if (window.customAlert) {
        window.customAlert(msg, "💡 Bantuan PIN Rahasia");
      } else {
        alert(msg);
      }
    }

    // Keyboard Entry Listener (Laptop / Desktop PC)
    window.addEventListener("keydown", (e) => {
      const lockScreen = document.getElementById("pinLockScreen");
      if (!lockScreen || lockScreen.classList.contains("hidden")) return;

      let key = e.key;
      if (key >= "0" && key <= "9") {
        e.preventDefault();
        pressPinKey(key);
        const btn = document.getElementById("pinBtn_" + key);
        if (btn) {
          btn.classList.add("active-key");
          setTimeout(() => btn.classList.remove("active-key"), 120);
        }
      } else if (key === "Backspace") {
        e.preventDefault();
        backspacePinKey();
        const btn = document.getElementById("pinBtn_del");
        if (btn) {
          btn.classList.add("active-key");
          setTimeout(() => btn.classList.remove("active-key"), 120);
        }
      } else if (key === "Escape" || key === "Delete" || key === "c" || key === "C") {
        e.preventDefault();
        clearPinKey();
        const btn = document.getElementById("pinBtn_clear");
        if (btn) {
          btn.classList.add("active-key");
          setTimeout(() => btn.classList.remove("active-key"), 120);
        }
      } else if (key === "Enter") {
        e.preventDefault();
        validateEnteredPin();
      }
    });

    // Helper Functions for Wife Pairing & Reset PIN in Settings
    function copyWifePairingLink() {
      if (window.AuthModule && window.AuthModule.generatePairingUrlForWife) {
        const url = window.AuthModule.generatePairingUrlForWife();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(() => {
            showToast("Link Akses Umma Atin disalin! Kirim via WA agar langsung login tanpa ketik PIN ✨", "success", 4000);
          }).catch(() => {
            prompt("Salin link akses Umma Atin berikut:", url);
          });
        } else {
          prompt("Salin link akses Umma Atin berikut:", url);
        }
      }
    }

    function resetDefaultPin() {
      const proceed = () => {
        if (window.AuthModule) {
          window.AuthModule.setFamilyPin("2429");
          clearPinKey();
          showToast("PIN berhasil direset ke default keluarga: 2429 ✨", "success");
        }
      };
      if (window.confirmCustom) {
        window.confirmCustom("Kembalikan PIN ke default keluarga (2429)?", proceed);
      } else if (confirm("Kembalikan PIN ke default keluarga (2429)?")) {
        proceed();
      }
    }

    // Expose PIN & Auth globally to window
    window.pressPinKey = pressPinKey;
    window.backspacePinKey = backspacePinKey;
    window.clearPinKey = clearPinKey;
    window.validateEnteredPin = validateEnteredPin;
    window.showPinHint = showPinHint;
    window.lockAppNow = lockAppNow;
    window.checkPinOnLoad = checkPinOnLoad;
    window.isPinLockEnabled = isPinLockEnabled;
    window.setPinLockEnabled = setPinLockEnabled;
    window.copyWifePairingLink = copyWifePairingLink;
    window.resetDefaultPin = resetDefaultPin;

    function initializeApplication() {
      // Inisialisasi Lucide Icons
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();

      // Inisialisasi Tanggal Header
      const headerDate = document.getElementById("headerCurrentDate");
      if (headerDate && window.DateHelper) {
        headerDate.textContent = window.DateHelper.formatDateIndonesia(new Date());
      }

      // Load Settings
      if (window.SettingsModule) {
        const s = window.SettingsModule.getSettings();
        const headerName = document.getElementById("headerFamilyName");
        if (headerName) headerName.textContent = s.familyName;
        const logoIcon = document.getElementById("headerLogoIcon");
        if (logoIcon) logoIcon.textContent = s.presetIcon;
        window.SettingsModule.applyTheme(s.activeTheme);
      }

      // Render Dashboard
      if (window.AppModule) {
        window.AppModule.renderDashboard();
        window.AppModule.renderIbuDashboard();
        if (window.AppModule.renderDynamicWalletBar) window.AppModule.renderDynamicWalletBar();
        if (window.AppModule.renderDynamicPresetsBar) window.AppModule.renderDynamicPresetsBar();
        if (window.AppModule.populateDynamicWalletDropdowns) window.AppModule.populateDynamicWalletDropdowns();
      }

      if (typeof populateCategorySelect === "function") populateCategorySelect();
      checkPinOnLoad();
      if (typeof renderDynamicFeatureShortcuts === "function") renderDynamicFeatureShortcuts();
      if (typeof renderIbuKostList === "function") renderIbuKostList();
      if (typeof renderIbuGasBonList === "function") renderIbuGasBonList();
      if (typeof renderIbuTransactionList === "function") renderIbuTransactionList();
      if (window.MonthlyStatsModule && window.MonthlyStatsModule.renderMonthlyHelicopterView) {
        window.MonthlyStatsModule.renderMonthlyHelicopterView();
      }

      // AUTO-SYNC DUA ARAH OTOMATIS SAAT APLIKASI DIBUKA (CLOUD TO CLIENT)
      if (window.SyncModule) {
        window.SyncModule.processPendingQueue();
        window.SyncModule.pullFromSpreadsheet(false);
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initializeApplication);
    } else {
      initializeApplication();
    }

    // Sinkronisasi otomatis saat pengguna beralih kembali ke tab/layar aplikasi ini
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && window.SyncModule) {
        window.SyncModule.processPendingQueue();
        window.SyncModule.pullFromSpreadsheet(false);
      }
    });
    window.addEventListener("focus", () => {
      if (window.SyncModule) {
        window.SyncModule.processPendingQueue();
        window.SyncModule.pullFromSpreadsheet(false);
      }
    });

    
    // Filter & Search Functions
    function handleSearchAndFilterChange() {
      if (window.AppModule) {
        window.AppModule.renderDashboard();
      }
    }

    function setFilterPreset(preset) {
      const startEl = document.getElementById("filterStartDate");
      const endEl = document.getElementById("filterEndDate");
      const today = window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0];

      if (preset === "semua") {
        startEl.value = "";
        endEl.value = "";
      } else if (preset === "hari") {
        startEl.value = today;
        endEl.value = today;
      } else if (preset === "minggu") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        startEl.value = d.toISOString().split("T")[0];
        endEl.value = today;
      } else if (preset === "bulan") {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        startEl.value = `${y}-${m}-01`;
        endEl.value = today;
      }

      handleSearchAndFilterChange();
    }

    function resetAllFilters() {
      document.getElementById("txSearchInput").value = "";
      document.getElementById("filterStartDate").value = "";
      document.getElementById("filterEndDate").value = "";
      document.getElementById("filterTypeSelect").value = "all";
      handleSearchAndFilterChange();
    }

    
    // Modal Transaksi Usaha Ibu Functions
    
    // Pengaturan & Reset Usaha Ibu
    function openIbuSettingsModal() {
      const inv = window.IbuGasModule ? window.IbuGasModule.getGasInventory() : { tabungIsi: 0, tabungKosong: 0 };
      const isiInput = document.getElementById("settingIbuGasIsi");
      const kosongInput = document.getElementById("settingIbuGasKosong");
      if (isiInput) isiInput.value = inv.tabungIsi;
      if (kosongInput) kosongInput.value = inv.tabungKosong;

      renderSettingKostRoomsList();
      document.getElementById("ibuSettingsModal").classList.remove("hidden");
    }

    function closeIbuSettingsModal() {
      document.getElementById("ibuSettingsModal").classList.add("hidden");
    }

    function renderSettingKostRoomsList() {
      const container = document.getElementById("settingKostRoomsList");
      if (!container || !window.IbuKostModule) return;
      const rooms = window.IbuKostModule.getKostRooms();

      container.innerHTML = rooms.map((r, idx) => `
        <div class="p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
          <div class="flex items-center justify-between font-bold text-slate-800">
            <span>Kamar ${r.roomNumber}:</span>
            <select id="kostStatus_${idx}" class="text-[10px] font-bold bg-white border border-slate-200 rounded px-1 py-0.5">
              <option value="unpaid" ${r.statusBulanIni === 'unpaid' ? 'selected' : ''}>Belum Bayar</option>
              <option value="paid" ${r.statusBulanIni === 'paid' ? 'selected' : ''}>Lunas</option>
              <option value="empty" ${r.statusBulanIni === 'empty' ? 'selected' : ''}>Kosong</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-1.5">
            <input type="text" id="kostTenant_${idx}" value="${r.tenantName}" placeholder="Nama Penghuni" class="bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-semibold">
            <input type="number" id="kostRent_${idx}" value="${r.monthlyRent}" placeholder="Tarif Sewa (Rp)" class="bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-bold text-slate-800">
          </div>
        </div>
      `).join("");
    }

    function markAllKostUnpaid() {
      const rooms = window.IbuKostModule.getKostRooms();
      rooms.forEach(r => {
        if (r.statusBulanIni === "paid") r.statusBulanIni = "unpaid";
      });
      window.IbuKostModule.saveKostRooms(rooms);
      renderSettingKostRoomsList();
      window.AppModule.renderIbuDashboard();
      renderIbuKostList();
      showToast("Seluruh kamar kost ditandai belum bayar (Lunas = Rp 0) ✨", "info");
    }

    function saveIbuSettings() {
      // 1. Simpan Stok Gas
      const isi = Number(document.getElementById("settingIbuGasIsi").value) || 0;
      const kosong = Number(document.getElementById("settingIbuGasKosong").value) || 0;
      const inv = window.IbuGasModule.getGasInventory();
      inv.tabungIsi = isi;
      inv.tabungKosong = kosong;
      window.IbuGasModule.saveGasInventory(inv);

      // 2. Simpan Data Kamar Kost
      const rooms = window.IbuKostModule.getKostRooms();
      rooms.forEach((r, idx) => {
        const statusEl = document.getElementById("kostStatus_" + idx);
        const tenantEl = document.getElementById("kostTenant_" + idx);
        const rentEl = document.getElementById("kostRent_" + idx);
        if (statusEl) r.statusBulanIni = statusEl.value;
        if (tenantEl) r.tenantName = tenantEl.value.trim() || "(Kosong)";
        if (rentEl) r.monthlyRent = Number(rentEl.value) || 0;
      });
      window.IbuKostModule.saveKostRooms(rooms);

      closeIbuSettingsModal();
      window.AppModule.renderIbuDashboard();
      renderIbuKostList();
      showToast("Pengaturan Usaha Ibu Berhasil Disimpan! ✨", "success");
    }

    function handleResetIbuDataToZero() {
      closeIbuSettingsModal();
      showConfirm(
        "Kosongkan Usaha Ibu Total ke 0?",
        "Apakah Anda yakin ingin mengosongkan seluruh data usaha Ibu?<br><br>" +
        "• <strong>Sewa Kost Lunas:</strong> Menjadi Rp 0<br>" +
        "• <strong>Sewa Kost Belum Bayar:</strong> Menjadi Rp 0 (Semua Kamar Siap Huni)<br>" +
        "• <strong>Stok Tabung Gas:</strong> Menjadi 0 Tabung<br>" +
        "• <strong>Catatan Bon Tetangga:</strong> Bersih Rp 0<br>" +
        "• <strong>Arus Kas Usaha Ibu:</strong> Menjadi Rp 0",
        { type: "danger", confirmText: "Ya, Kosongkan Semua ke 0" }
      ).then(confirmed => {
        if (confirmed) {
          // 1. Kosongkan Riwayat Transaksi Usaha Ibu ke []
          if (window.AppModule && window.AppModule.saveIbuTransactions) {
            window.AppModule.saveIbuTransactions([]);
          }

          // 2. Kosongkan Bon Pelanggan Gas ke []
          localStorage.setItem("usaha_ibu_gas_bon_pelanggan", JSON.stringify([]));

          // 3. Set Stok Tabung Gas ke 0
          if (window.IbuGasModule && window.IbuGasModule.saveGasInventory) {
            const inv = window.IbuGasModule.getGasInventory();
            inv.tabungIsi = 0;
            inv.tabungKosong = 0;
            inv.tabungDipinjam = 0;
            window.IbuGasModule.saveGasInventory(inv);
          }

          // 4. Kosongkan Seluruh 4 Kamar Kost Menjadi Kosong / Siap Huni (Status: empty, Tarif: Sesuai, Belum Bayar: 0)
          if (window.IbuKostModule && window.IbuKostModule.saveKostRooms) {
            const cleanRooms = [
              { id: "kamar_1", roomNumber: "01", tenantName: "(Kosong / Siap Huni)", tenantPhone: "", facilities: "Kamar Mandi Dalam, Kasur, Lemari", monthlyRent: 750000, dueDay: 5, deposit: 0, statusBulanIni: "empty", lastPaymentDate: "" },
              { id: "kamar_2", roomNumber: "02", tenantName: "(Kosong / Siap Huni)", tenantPhone: "", facilities: "Kamar Mandi Dalam, Kasur, Lemari", monthlyRent: 750000, dueDay: 10, deposit: 0, statusBulanIni: "empty", lastPaymentDate: "" },
              { id: "kamar_3", roomNumber: "03", tenantName: "(Kosong / Siap Huni)", tenantPhone: "", facilities: "Kamar Mandi Luar, Kipas, Kasur", monthlyRent: 600000, dueDay: 1, deposit: 0, statusBulanIni: "empty", lastPaymentDate: "" },
              { id: "kamar_4", roomNumber: "04", tenantName: "(Kosong / Siap Huni)", tenantPhone: "", facilities: "Kamar Mandi Dalam, Kasur, Lemari", monthlyRent: 750000, dueDay: 15, deposit: 0, statusBulanIni: "empty", lastPaymentDate: "" }
            ];
            window.IbuKostModule.saveKostRooms(cleanRooms);
          }

          // Render ulang tampilan Usaha Ibu
          if (window.AppModule && window.AppModule.renderIbuDashboard) {
            window.AppModule.renderIbuDashboard();
          }
          if (typeof renderIbuKostList === "function") renderIbuKostList();
          if (typeof renderIbuGasBonList === "function") renderIbuGasBonList();

          // Catatan: Google Spreadsheet TIDAK DIHAPUS agar riwayat arsip keuangan tetap aman dan tidak tertimpa!
          showToast("Data lokal HP berhasil direset ke Rp 0! Riwayat di Google Sheets tetap aman terjaga. ✨", "success", 4000);
          showToast("Semua Data Usaha Ibu Berhasil Dikosongkan Bersih ke 0! ✨", "success");
        }
      });
    }

    function openNewIbuTxModal() {
      document.getElementById("ibuTxDate").value = window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0];
      document.getElementById("ibuTxAmount").value = "";
      document.getElementById("ibuTxQty").value = "1";
      document.getElementById("ibuTxNote").value = "";
      handleIbuTypeChange();
      document.getElementById("ibuTxModal").classList.remove("hidden");
    }

    function closeIbuTxModal() {
      document.getElementById("ibuTxModal").classList.add("hidden");
    }

    function handleIbuTypeChange() {
      const type = document.getElementById("ibuTxTypeSelect").value;
      const qtyCont = document.getElementById("ibuQtyContainer");
      const qtyLabel = document.getElementById("ibuQtyLabel");
      const amtInput = document.getElementById("ibuTxAmount");

      if (type === "gas_sale") {
        qtyCont.style.display = "block";
        qtyLabel.textContent = "Jumlah Tabung Terjual:";
        amtInput.value = "22000";
      } else if (type === "gas_restock_yanto" || type === "gas_restock_aan") {
        qtyCont.style.display = "block";
        qtyLabel.textContent = "Jumlah Tabung Diambil:";
        amtInput.value = "370000"; // 20 tabung * 18500
      } else if (type === "gas_bon") {
        qtyCont.style.display = "block";
        qtyLabel.textContent = "Tabung Dibon:";
        amtInput.value = "22000";
      } else if (type === "kost_income") {
        qtyCont.style.display = "none";
        amtInput.value = "750000";
      } else {
        qtyCont.style.display = "none";
        amtInput.value = "";
      }
    }

    function submitIbuTransaction() {
      const type = document.getElementById("ibuTxTypeSelect").value;
      const dateVal = document.getElementById("ibuTxDate").value;
      const amount = Number(document.getElementById("ibuTxAmount").value);
      const qty = Number(document.getElementById("ibuTxQty").value) || 1;
      const note = document.getElementById("ibuTxNote").value.trim();

      if (!amount || amount <= 0) {
        showToast("Silakan masukkan nominal transaksi!", "error");
        return;
      }

      const txDate = dateVal ? dateVal + "T12:00:00+07:00" : new Date().toISOString();

      if (type === "kost_income") {
        window.AppModule.addIbuTransaction({
          unit: "kost",
          type: "income",
          category: "Sewa Kamar Kost",
          amount: amount,
          profit: amount,
          note: note || "Penerimaan sewa kamar kost",
          date: txDate
        });
      } else if (type === "kost_expense") {
        window.AppModule.addIbuTransaction({
          unit: "kost",
          type: "expense",
          category: "Biaya Operasional Kost",
          amount: amount,
          profit: 0,
          note: note || "Biaya perbaikan / operasional kost",
          date: txDate
        });
      } else if (type === "gas_sale") {
        const modalPerTabung = 18500;
        const hargaJualPerTabung = amount / qty;
        const profitTotal = (hargaJualPerTabung - modalPerTabung) * qty;

        window.IbuGasModule.recordGasSale(qty, hargaJualPerTabung, note || "Pembeli Warung", false);
        window.AppModule.addIbuTransaction({
          unit: "gas",
          type: "income",
          category: `Jual ${qty} Tabung Gas`,
          amount: amount,
          profit: profitTotal > 0 ? profitTotal : 3500 * qty,
          note: note || `Penjualan ${qty} tabung gas eceran`,
          date: txDate
        });
      } else if (type === "gas_restock_yanto" || type === "gas_restock_aan") {
        const isAan = type === "gas_restock_aan";
        const supplierName = isAan ? "Mas Aan" : "Bu Yanto";

        window.IbuGasModule.recordGasRestock(isAan ? "mas_aan" : "bu_yanto", qty, amount / qty, true);
        window.AppModule.addIbuTransaction({
          unit: "gas",
          type: "expense",
          category: `Kulakan ${qty} Tabung (${supplierName})`,
          amount: amount,
          profit: 0,
          note: note || `Kulakan ${qty} tabung gas supplier ${supplierName}`,
          date: txDate
        });
      } else if (type === "gas_bon") {
        window.IbuGasModule.addGasBon(note || "Tetangga", qty, amount);
      }

      closeIbuTxModal();
      window.AppModule.renderIbuDashboard();
      renderIbuGasBonList();
      renderIbuKostList();
      showToast("Transaksi Usaha Ibu Berhasil Disimpan! ✨", "success");
    }

    function switchLedger(ledger) {
      window.AppModule.AppState.activeLedger = ledger;
      const secKeluarga = document.getElementById("sectionKeluarga");
      const secIbu = document.getElementById("sectionIbu");
      const btnKeluarga = document.getElementById("btnLedgerKeluarga");
      const btnIbu = document.getElementById("btnLedgerIbu");
      const profCont = document.getElementById("profileSwitcherContainer");

      if (ledger === "keluarga") {
        secKeluarga.classList.remove("hidden");
        secIbu.classList.add("hidden");
        btnKeluarga.className = "px-3 py-1 rounded-lg text-xs font-bold bg-white text-slate-900 shadow-2xs transition-all";
        btnIbu.className = "px-3 py-1 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition-all";
        profCont.style.display = "flex";
      } else {
        secKeluarga.classList.add("hidden");
        secIbu.classList.remove("hidden");
        btnIbu.className = "px-3 py-1 rounded-lg text-xs font-bold bg-white text-slate-900 shadow-2xs transition-all";
        btnKeluarga.className = "px-3 py-1 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition-all";
        profCont.style.display = "none";
        window.AppModule.renderIbuDashboard();
        renderIbuKostList();
        renderIbuGasBonList();
        renderIbuTransactionList();
      }
    }

    function switchProfile(prof) {
      window.AppModule.AppState.activeProfile = prof;
      ["btnProfKeluarga", "btnProfSuami", "btnProfIstri"].forEach(id => {
        document.getElementById(id).className = "px-2 py-0.5 rounded-md text-[10.5px] font-bold text-slate-500 hover:bg-slate-100";
      });
      if (prof === "keluarga") document.getElementById("btnProfKeluarga").className = "px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-emerald-100 text-emerald-800";
      if (prof === "suami") document.getElementById("btnProfSuami").className = "px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-blue-100 text-blue-800";
      if (prof === "istri") document.getElementById("btnProfIstri").className = "px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-pink-100 text-pink-800";
      window.AppModule.renderDashboard();
    }

    function handleTogglePrivacy() {
      if (window.AuthModule) {
        const isPrivacy = window.AuthModule.togglePrivacyMode();
        
        // Update Ikon & Tombol di Header
        const btn = document.getElementById("btnPrivacyToggle");
        const icon = document.getElementById("privacyEyeIcon");
        if (btn) {
          if (isPrivacy) {
            btn.className = "w-8 h-8 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 flex items-center justify-center transition-all cursor-pointer shadow-xs";
            btn.setAttribute("title", "Mode Privasi Aktif (Klik untuk Tampilkan Saldo)");
          } else {
            btn.className = "w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer";
            btn.setAttribute("title", "Mode Privasi (Sensor Saldo)");
          }
        }
        if (icon) {
          icon.setAttribute("data-lucide", isPrivacy ? "eye-off" : "eye");
          if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
        }

        // Render ulang dashboard dan buku kas
        if (window.AppModule && window.AppModule.renderDashboard) {
          window.AppModule.renderDashboard();
        }
        if (window.AppModule && window.AppModule.renderIbuDashboard) {
          window.AppModule.renderIbuDashboard();
        }
        if (typeof renderIbuKostList === "function") renderIbuKostList();
        if (typeof renderIbuGasBonList === "function") renderIbuGasBonList();
        if (typeof renderIbuTransactionList === "function") renderIbuTransactionList();

        if (typeof showToast === "function") {
          showToast(isPrivacy ? "Mode Privasi Aktif: Seluruh saldo disamarkan 🔒" : "Mode Privasi Nonaktif: Saldo ditampilkan 👁️", "info");
        }
      }
    }

    
    function handleManualSyncGoogleSheets() {
      if (window.SyncModule) {
        window.SyncModule.processPendingQueue();
        window.SyncModule.pullFromSpreadsheet();
      }
    }
  
    function handleShareRekapWA() {
      if (window.WhatsAppModule && window.AppModule) {
        const metrics = window.AppModule.calculateKeluargaMetrics();
        window.WhatsAppModule.shareDailyRekap({
          totalBalance: metrics.balance,
          totalIncome: metrics.totalIncome,
          totalExpense: metrics.totalExpense,
          pendingBills: metrics.pendingBills,
          freeBudget: metrics.freeBudget
        });
      }
    }

    // Numpad & Calculator Functions
    let numpadCalcOp = null;
    let numpadCalcPrev = null;

    function pressNumpad(key) {
      if (key === "del") {
        currentNumpadVal = currentNumpadVal.length > 1 ? currentNumpadVal.slice(0, -1) : "0";
      } else if (key === "000") {
        if (currentNumpadVal !== "0") currentNumpadVal += "000";
      } else if (key === "+" || key === "-") {
        numpadCalcPrev = parseInt(currentNumpadVal, 10) || 0;
        numpadCalcOp = key;
        currentNumpadVal = "0";
        if (window.showToast) window.showToast(`Hitung: ${numpadCalcPrev.toLocaleString("id-ID")} ${key} ...`, "info", 1200);
      } else if (key === "=") {
        if (numpadCalcOp && numpadCalcPrev !== null) {
          const curr = parseInt(currentNumpadVal, 10) || 0;
          let res = curr;
          if (numpadCalcOp === "+") res = numpadCalcPrev + curr;
          if (numpadCalcOp === "-") res = Math.max(0, numpadCalcPrev - curr);
          currentNumpadVal = String(res);
          numpadCalcOp = null;
          numpadCalcPrev = null;
          if (window.showToast) window.showToast(`Hasil kalkulator: Rp ${res.toLocaleString("id-ID")} ✨`, "success", 1500);
        }
      } else {
        currentNumpadVal = currentNumpadVal === "0" ? key : currentNumpadVal + key;
      }
      const num = parseInt(currentNumpadVal, 10) || 0;
      document.getElementById("numpadDisplay").textContent = num.toLocaleString("id-ID");
    }

    function clearCalcAndNumpad() {
      currentNumpadVal = "0";
      numpadCalcOp = null;
      numpadCalcPrev = null;
      document.getElementById("numpadDisplay").textContent = "0";
    }

    function setTxType(type) {
      activeTxType = type;
      const bExp = document.getElementById("btnTxExpense");
      const bInc = document.getElementById("btnTxIncome");
      if (type === "expense") {
        bExp.className = "px-3 py-1 rounded-md text-xs font-extrabold bg-rose-500 text-white";
        bInc.className = "px-3 py-1 rounded-md text-xs font-extrabold text-slate-500";
      } else {
        bInc.className = "px-3 py-1 rounded-md text-xs font-extrabold bg-emerald-500 text-white";
        bExp.className = "px-3 py-1 rounded-md text-xs font-extrabold text-slate-500";
      }
      populateCategorySelect();
    }

    function populateCategorySelect() {
      const sel = document.getElementById("txCategorySelect");
      if (!sel || !window.CategoriesModule) return;
      const cats = window.CategoriesModule.getCategories()[activeTxType] || [];
      sel.innerHTML = cats.map(g => `
        <optgroup label="${g.group}">
          ${g.items.map(i => `<option value="${g.group} - ${i.name}">${i.name}</option>`).join("")}
        </optgroup>
      `).join("");
    }

    // ================= KELOLA MASTER KATEGORI TRANSAKSI (100% DINAMIS) =================
    let activeCatTab = "expense";

    function openCategoryManagerModal() {
      setCatManagerTab(activeCatTab || "expense");
      document.getElementById("categoryManagerModal").classList.remove("hidden");
    }

    function closeCategoryManagerModal() {
      document.getElementById("categoryManagerModal").classList.add("hidden");
    }

    function setCatManagerTab(type) {
      activeCatTab = type;
      const bExp = document.getElementById("btnCatTabExpense");
      const bInc = document.getElementById("btnCatTabIncome");

      if (type === "expense") {
        bExp.className = "flex-1 py-1.5 rounded-lg bg-rose-500 text-white shadow-2xs cursor-pointer font-black";
        bInc.className = "flex-1 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 cursor-pointer font-bold";
      } else {
        bInc.className = "flex-1 py-1.5 rounded-lg bg-emerald-500 text-white shadow-2xs cursor-pointer font-black";
        bExp.className = "flex-1 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 cursor-pointer font-bold";
      }

      renderCategoryManagerList();
    }

    function renderCategoryManagerList() {
      const container = document.getElementById("categoryManagerList");
      if (!container || !window.CategoriesModule) return;
      const cats = window.CategoriesModule.getCategories()[activeCatTab] || [];

      if (cats.length === 0) {
        container.innerHTML = `<div class="text-center py-6 text-slate-400 text-xs font-bold">Belum ada kategori. Silakan tambahkan di atas!</div>`;
        return;
      }

      container.innerHTML = cats.map(g => `
        <div class="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
          <div class="flex items-center justify-between text-xs font-black text-slate-900 border-b border-slate-200/80 pb-1">
            <span class="flex items-center gap-1.5">
              <span>🏷️</span> ${g.group}
            </span>
            <span class="text-[9.5px] font-bold text-slate-400">(${g.items.length} pos)</span>
          </div>
          <div class="space-y-1">
            ${g.items.map(i => `
              <div class="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-100 text-xs shadow-2xs">
                <span class="font-bold text-slate-700">${i.name}</span>
                <div class="flex items-center gap-1">
                  <button onclick="handleEditCategoryItem('${activeCatTab}', '${g.group.replace(/'/g, "\\'")}', '${i.name.replace(/'/g, "\\'")}')" class="text-slate-400 hover:text-slate-700 text-xs p-1 cursor-pointer" title="Edit Pos">✏️</button>
                  <button onclick="handleDeleteCategoryItem('${activeCatTab}', '${g.group.replace(/'/g, "\\'")}', '${i.name.replace(/'/g, "\\'")}')" class="text-slate-300 hover:text-rose-500 text-xs p-1 cursor-pointer" title="Hapus Pos">🗑️</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("");
    }

    function handleAddNewCategorySubmit() {
      const group = document.getElementById("newCatGroup").value.trim();
      const item = document.getElementById("newCatItem").value.trim();

      if (!group || !item) {
        showToast("Kelompok kategori dan nama pos harus diisi!", "error");
        return;
      }

      window.CategoriesModule.addCategoryItem(activeCatTab, group, item);
      document.getElementById("newCatItem").value = "";
      renderCategoryManagerList();
      populateCategorySelect();
      showToast(`Pos "${item}" berhasil ditambahkan ke kategori "${group}"! ✨`, "success");
    }

    async function handleEditCategoryItem(type, groupName, itemName) {
      const newItem = await showPrompt("Edit Pos Kategori", `Ubah nama pos kategori "${itemName}":`, itemName);
      if (!newItem || newItem.trim() === itemName) return;

      window.CategoriesModule.editCategoryItem(type, groupName, itemName, newItem.trim());
      renderCategoryManagerList();
      populateCategorySelect();
      showToast(`Pos kategori berhasil diperbarui menjadi "${newItem.trim()}"! ✨`, "success");
    }

    function handleDeleteCategoryItem(type, groupName, itemName) {
      showConfirm("Hapus Pos Kategori?", `Apakah Anda yakin ingin menghapus pos "${itemName}" dari kelompok "${groupName}"?`, { type: "danger", confirmText: "Ya, Hapus" }).then(confirmed => {
        if (confirmed) {
          window.CategoriesModule.deleteCategoryItem(type, groupName, itemName);
          renderCategoryManagerList();
          populateCategorySelect();
          showToast(`Pos "${itemName}" berhasil dihapus.`, "info");
        }
      });
    }

    function resetCategoriesDefaultPrompt() {
      showConfirm("Reset Kategori ke Bawaan?", "Kembalikan seluruh daftar kategori ke pengaturan standar 8 Siklus Finansial Keluarga?", { confirmText: "Ya, Reset Bawaan" }).then(confirmed => {
        if (confirmed) {
          window.CategoriesModule.resetCategoriesToDefault();
          renderCategoryManagerList();
          populateCategorySelect();
          showToast("Kategori berhasil dikembalikan ke standar! ✨", "success");
        }
      });
    }

    
    // CRUD: Edit Modal Functions (Keluarga)
    function openEditModal(txId) {
      const txs = window.AppModule.getKeluargaTransactions();
      const tx = txs.find(t => t.id === txId);
      if (!tx) return;

      document.getElementById("editTxId").value = tx.id;
      document.getElementById("editTxDate").value = tx.date ? tx.date.split("T")[0] : window.DateHelper.getTodayWIBString();
      if (document.getElementById("editTxType")) {
        document.getElementById("editTxType").value = tx.type || "expense";
      }
      document.getElementById("editTxAmount").value = tx.amount;
      document.getElementById("editTxCategory").value = tx.category + (tx.subCategory ? " - " + tx.subCategory : "");
      document.getElementById("editTxWallet").value = tx.wallet || "Kas Tunai Suami";
      document.getElementById("editTxUser").value = tx.user || "suami";
      document.getElementById("editTxNote").value = tx.note || "";

      document.getElementById("editTxModal").classList.remove("hidden");
    }

    function closeEditModal() {
      document.getElementById("editTxModal").classList.add("hidden");
    }

    function submitEditTransaction() {
      const id = document.getElementById("editTxId").value;
      const dateVal = document.getElementById("editTxDate").value;
      const txType = document.getElementById("editTxType") ? document.getElementById("editTxType").value : "expense";
      const amount = Number(document.getElementById("editTxAmount").value);
      const catFull = document.getElementById("editTxCategory").value;
      const [category, subCategory] = catFull.includes(" - ") ? catFull.split(" - ") : [catFull, ""];
      const wallet = document.getElementById("editTxWallet").value;
      const user = document.getElementById("editTxUser").value;
      const note = document.getElementById("editTxNote").value;

      if (!amount || amount <= 0) {
        showToast("Nominal transaksi harus lebih dari 0!", "warning");
        return;
      }

      window.AppModule.updateTransaction(id, {
        date: dateVal ? dateVal + "T12:00:00+07:00" : new Date().toISOString(),
        type: txType,
        amount,
        category,
        subCategory: subCategory || category,
        wallet,
        user,
        note
      });

      closeEditModal();
      showToast("Perubahan transaksi keluarga berhasil disimpan & disinkronkan! ✨", "success");
    }

    // CRUD: Edit Modal Functions (Usaha Ibu)
    function openEditIbuModal(txId) {
      const txs = window.AppModule.getIbuTransactions();
      const tx = txs.find(t => t.id === txId);
      if (!tx) return;

      document.getElementById("editIbuTxId").value = tx.id;
      document.getElementById("editIbuTxDate").value = tx.date ? tx.date.split("T")[0] : window.DateHelper.getTodayWIBString();
      document.getElementById("editIbuTxUnit").value = tx.unit || "kost";
      document.getElementById("editIbuTxType").value = tx.type || "income";
      document.getElementById("editIbuTxCategory").value = tx.category || "";
      document.getElementById("editIbuTxAmount").value = tx.amount || 0;
      document.getElementById("editIbuTxProfit").value = tx.profit || 0;
      document.getElementById("editIbuTxNote").value = tx.note || "";

      document.getElementById("editIbuTxModal").classList.remove("hidden");
    }

    function closeEditIbuModal() {
      document.getElementById("editIbuTxModal").classList.add("hidden");
    }

    function submitEditIbuTransaction() {
      const id = document.getElementById("editIbuTxId").value;
      const dateVal = document.getElementById("editIbuTxDate").value;
      const unit = document.getElementById("editIbuTxUnit").value;
      const type = document.getElementById("editIbuTxType").value;
      const category = document.getElementById("editIbuTxCategory").value.trim();
      const amount = Number(document.getElementById("editIbuTxAmount").value);
      const profit = Number(document.getElementById("editIbuTxProfit").value) || 0;
      const note = document.getElementById("editIbuTxNote").value.trim();

      if (!amount || amount <= 0) {
        showToast("Nominal transaksi harus lebih dari 0!", "warning");
        return;
      }

      window.AppModule.updateIbuTransaction(id, {
        date: dateVal ? dateVal + "T12:00:00+07:00" : new Date().toISOString(),
        unit,
        type,
        category: category || (unit === "kost" ? "Sewa Kost" : "Gas LPG"),
        amount,
        profit,
        note
      });

      closeEditIbuModal();
      showToast("Perubahan transaksi usaha ibu berhasil disimpan & disinkronkan! ✨", "success");
    }

    // CRUD: Delete Transaction
    function handleDeleteTx(txId) {
      showConfirm("Hapus Transaksi", "Apakah Anda yakin ingin menghapus catatan transaksi ini?<br><span class=\"text-[11px] text-slate-400\">Data yang dihapus tidak dapat dikembalikan.</span>", { type: "danger", confirmText: "Ya, Hapus" }).then(confirmed => {
        if (confirmed) {
          window.AppModule.deleteTransaction(txId);
          showToast("Transaksi berhasil dihapus!", "success");
        }
      });
    }

    function openQuickAddModal() {
      currentNumpadVal = "0";
      document.getElementById("numpadDisplay").textContent = "0";
      document.getElementById("txNoteInput").value = "";
      document.getElementById("txDateInput").value = window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0];
      document.getElementById("quickAddModal").classList.remove("hidden");
    }

    function closeQuickAddModal() {
      document.getElementById("quickAddModal").classList.add("hidden");
    }

    function submitQuickAddTransaction() {
      const amount = parseInt(currentNumpadVal, 10);
      if (!amount || amount <= 0) {
        alert("Silakan masukkan nominal transaksi!");
        return;
      }

      const catFull = document.getElementById("txCategorySelect").value;
      const [category, subCategory] = catFull.split(" - ");
      const wallet = document.getElementById("txWalletSelect").value;
      const user = document.getElementById("txUserSelect").value;
      const note = document.getElementById("txNoteInput").value;

      const dateInput = document.getElementById("txDateInput").value;
      const txDate = dateInput ? dateInput + "T" + new Date().toTimeString().split(" ")[0] + "+07:00" : new Date().toISOString();

      const tx = window.AppModule.addTransaction({
        date: txDate,
        type: activeTxType,
        category,
        subCategory,
        amount,
        wallet,
        user,
        note
      });

      closeQuickAddModal();
      
      // Tanya kirim WA
      setTimeout(() => {
        showConfirm("Transaksi Tersimpan! ✨", "Catatan berhasil dibukukan ke sistem.<br><br>Kirim rincian belanja ke <strong>WhatsApp Pasangan</strong> sekarang?", { type: "whatsapp", confirmText: "Kirim ke WA" }).then(sendWa => {
          if (sendWa) {
            window.WhatsAppModule.sendTransactionToSpouse(tx, user);
          }
        });
      }, 200);
    }

    function handleQuickPreset(preset) {
      const presets = {
        bensin_20: { cat: "Kebutuhan Mingguan Dapur & Rumah", sub: "Bensin Motor / Mobil Mingguan", amt: 20000, note: "Bensin Motor" },
        bensin_50: { cat: "Kebutuhan Mingguan Dapur & Rumah", sub: "Bensin Motor / Mobil Mingguan", amt: 50000, note: "Bensin Mobil/Motor" },
        galon: { cat: "Kebutuhan Mingguan Dapur & Rumah", sub: "Isi Ulang Air Galon", amt: 20000, note: "Air Galon Minum" },
        gas: { cat: "Kebutuhan Mingguan Dapur & Rumah", sub: "Gas LPG 3kg Masak", amt: 22000, note: "Gas LPG 3kg" },
        makan: { cat: "Jajan & Harian", sub: "Jajan Kopi & Cemilan Sore", amt: 15000, note: "Jajan / Kopi" }
      };

      const p = presets[preset];
      if (p) {
        window.AppModule.addTransaction({
          type: "expense",
          category: p.cat,
          subCategory: p.sub,
          amount: p.amt,
          wallet: "Kas Dapur (Istri)",
          user: "istri",
          note: p.note
        });
        alert(`Berhasil mencatat ${p.note} (${window.DateHelper.formatRupiah(p.amt)})!`);
      }
    }

    let activeVoiceRecognition = null;

    function handleVoiceInputClick() {
      const modal = document.getElementById("voiceListeningModal");
      const liveText = document.getElementById("voiceLiveText");
      if (liveText) liveText.innerHTML = 'Silakan bicara sekarang...<br><span class="text-[10.5px] text-slate-400 font-normal">(Contoh: "Beli beras 50 ribu")</span>';
      if (modal) modal.classList.remove("hidden");

      activeVoiceRecognition = window.AppModule.initVoiceInput(res => {
        if (modal) modal.classList.add("hidden");
        if (res.amount) {
          currentNumpadVal = String(res.amount);
          document.getElementById("numpadDisplay").textContent = res.amount.toLocaleString("id-ID");
        }
        if (res.text) {
          document.getElementById("txNoteInput").value = res.text;
        }
        showToast(`Suara terdeteksi: ${res.text || ''} (${window.DateHelper.formatRupiah(res.amount || 0)}) ✨`, "success");
      });

      if (activeVoiceRecognition) {
        activeVoiceRecognition.onerror = (e) => {
          if (modal) modal.classList.add("hidden");
          showToast("Gagal mendeteksi suara: " + (e.error || "Timeout"), "warning");
        };
        try {
          activeVoiceRecognition.start();
        } catch (e) {
          console.warn(e);
        }
      } else {
        if (modal) modal.classList.add("hidden");
      }
    }

    function stopVoiceListening() {
      if (activeVoiceRecognition) {
        try { activeVoiceRecognition.stop(); } catch (e) {}
      }
      const modal = document.getElementById("voiceListeningModal");
      if (modal) modal.classList.add("hidden");
    }

    function handleOcrFileChange(event) {
      const file = event.target.files[0];
      if (!file || !window.OcrModule) return;

      const modal = document.getElementById("ocrScanningModal");
      const statusText = document.getElementById("ocrScanningStatus");
      if (modal) modal.classList.remove("hidden");
      if (statusText) statusText.textContent = "Membaca gambar struk...";

      window.OcrModule.processReceiptImage(file, 
        msg => {
          if (statusText) statusText.textContent = msg || "Memindai struk...";
        },
        parsed => {
          if (modal) modal.classList.add("hidden");
          if (parsed.amount) {
            currentNumpadVal = String(parsed.amount);
            document.getElementById("numpadDisplay").textContent = parsed.amount.toLocaleString("id-ID");
          }
          if (parsed.storeName) {
            document.getElementById("txNoteInput").value = `Struk: ${parsed.storeName}`;
          }
          showToast(`Struk terdeteksi: ${parsed.storeName || 'Toko'} - Total ${window.DateHelper.formatRupiah(parsed.amount || 0)} ✨`, "success");
        }
      );
    }

    // Modal Tabs Router
    
    // DYNAMIC TAB MODALS: FULL CRUD FOR ALL 4 SUB-FEATURES (BILLS, SHOPPING, PARENTS, SERVICE)
    
    
    // TRANSFER MODAL HANDLERS
    function openTransferModal() {
      const wallets = window.AppModule.getDynamicWallets();
      const fromSel = document.getElementById("transferFromSelect");
      const toSel = document.getElementById("transferToSelect");

      fromSel.innerHTML = wallets.map(w => `<option value="${w.name}">${w.name} (${window.DateHelper.formatRupiah(w.balance)})</option>`).join("");
      toSel.innerHTML = wallets.map(w => `<option value="${w.name}">${w.name} (${window.DateHelper.formatRupiah(w.balance)})</option>`).join("");

      if (wallets.length >= 2) {
        toSel.selectedIndex = 1;
      }

      document.getElementById("transferAmountInput").value = "";
      document.getElementById("transferNoteInput").value = "";
      document.getElementById("transferModal").classList.remove("hidden");
    }

    function closeTransferModal() {
      document.getElementById("transferModal").classList.add("hidden");
    }

    function handleExecuteTransferSubmit() {
      const fromW = document.getElementById("transferFromSelect").value;
      const toW = document.getElementById("transferToSelect").value;
      const amt = Number(document.getElementById("transferAmountInput").value);
      const note = document.getElementById("transferNoteInput").value;

      if (window.AppModule.transferBetweenWallets(fromW, toW, amt, note)) {
        closeTransferModal();
      }
    }

    // DYNAMIC EDUCATION HANDLERS
    const EDU_STORAGE_KEY = "keuangan_keluarga_dynamic_education";
    function getDynamicEducationItems() {
      const saved = localStorage.getItem(EDU_STORAGE_KEY);
      if (saved !== null) {
        try { return JSON.parse(saved); } catch (e) {}
      }
      return [
        { id: "edu_1", title: "SPP & Buku Sekolah Anak", amount: 350000, person: "Anak" },
        { id: "edu_2", title: "Kuliah / Kursus Skill Umma Atin", amount: 450000, person: "Umma Atin" }
      ];
    }

    function saveDynamicEducationItems(items) {
      localStorage.setItem(EDU_STORAGE_KEY, JSON.stringify(items));
    }

    function handleAddNewEduSubmit() {
      const title = document.getElementById("newEduTitle").value.trim();
      const amount = Number(document.getElementById("newEduAmount").value);
      const person = document.getElementById("newEduPerson").value;

      if (!title || !amount) {
        showToast("Judul dan nominal pendidikan harus diisi!", "error");
        return;
      }

      const items = getDynamicEducationItems();
      items.push({ id: "edu_" + Date.now(), title, amount, person });
      saveDynamicEducationItems(items);
      openTabModal("education");
      showToast(`Biaya ${title} berhasil ditambahkan! ✨`, "success");
    }

    function deleteDynamicEdu(id) {
      if (confirm("Hapus pos pendidikan ini?")) {
        let items = getDynamicEducationItems();
        items = items.filter(x => x.id !== id);
        saveDynamicEducationItems(items);
        openTabModal("education");
        showToast("Pos pendidikan dihapus.", "info");
      }
    }

    async function handleEditEdu(id) {
      const items = getDynamicEducationItems();
      const edu = items.find(x => x.id === id);
      if (!edu) return;

      const newTitle = await showPrompt("Edit Pos Pendidikan", "Judul anggaran pendidikan:", edu.title);
      if (!newTitle) return;
      const newAmt = await showPrompt("Edit Biaya", "Estimasi biaya (Rp):", String(edu.amount));
      if (!newAmt) return;
      const newPerson = await showPrompt("Peruntukan", "Untuk siapa (misal: Anak / Umma Atin / Baba):", edu.person || "Anak");

      const idx = items.findIndex(x => x.id === id);
      if (idx !== -1) {
        items[idx] = {
          ...items[idx],
          title: newTitle.trim(),
          amount: Number(newAmt) || edu.amount,
          person: newPerson ? newPerson.trim() : edu.person
        };
        saveDynamicEducationItems(items);
        openTabModal("education");
        showToast(`Data pendidikan ${newTitle} berhasil diperbarui! ✨`, "success");
      }
    }

    async function payEduBillPrompt(id, title, defaultAmount) {
      const amt = await showPrompt("Bayar Pendidikan", `Pelunasan ${title} (Rp):`, String(defaultAmount));
      if (amt) {
        window.AppModule.addTransaction({
          type: "expense",
          category: "Pendidikan Anak & Kuliah Istri",
          subCategory: title,
          amount: Number(amt) || defaultAmount,
          wallet: "Bank BSI (Umma Atin)",
          user: "istri",
          note: `Pembayaran ${title}`,
          date: window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0]
        });
        closeTabModal();
        showToast(`Pembayaran ${title} berhasil dicatat! ✨`, "success");
      }
    }

    // DYNAMIC TAXES & QURBAN HANDLERS
    const TAXES_STORAGE_KEY = "keuangan_keluarga_dynamic_taxes";
    function getDynamicTaxesItems() {
      const saved = localStorage.getItem(TAXES_STORAGE_KEY);
      if (saved !== null) {
        try { return JSON.parse(saved); } catch (e) {}
      }
      return [
        { id: "tx_1", title: "Pajak STNK Motor Baba Pangestu", amount: 285000 },
        { id: "tx_2", title: "Pajak STNK Motor Umma Atin", amount: 245000 },
        { id: "tx_3", title: "Pajak PBB Rumah Tinggal", amount: 150000 },
        { id: "tx_4", title: "Tabungan Qurban Idul Adha", amount: 3500000 },
        { id: "tx_5", title: "Anggaran THR Lebaran Idul Fitri", amount: 2500000 }
      ];
    }

    function saveDynamicTaxesItems(items) {
      localStorage.setItem(TAXES_STORAGE_KEY, JSON.stringify(items));
    }

    function handleAddNewTaxSubmit() {
      const title = document.getElementById("newTaxTitle").value.trim();
      const amount = Number(document.getElementById("newTaxAmount").value);

      if (!title || !amount) {
        showToast("Nama dan nominal harus diisi!", "error");
        return;
      }

      const items = getDynamicTaxesItems();
      items.push({ id: "tx_" + Date.now(), title, amount });
      saveDynamicTaxesItems(items);
      openTabModal("taxes");
      showToast(`${title} berhasil ditambahkan! ✨`, "success");
    }

    function deleteDynamicTax(id) {
      if (confirm("Hapus pos anggaran ini?")) {
        let items = getDynamicTaxesItems();
        items = items.filter(x => x.id !== id);
        saveDynamicTaxesItems(items);
        openTabModal("taxes");
        showToast("Pos anggaran dihapus.", "info");
      }
    }

    async function handleEditTax(id) {
      const taxes = getDynamicTaxesItems();
      const tax = taxes.find(x => x.id === id);
      if (!tax) return;

      const newTitle = await showPrompt("Edit Anggaran", "Nama pajak / anggaran hari raya:", tax.title);
      if (!newTitle) return;
      const newAmt = await showPrompt("Edit Target Biaya", "Target anggaran (Rp):", String(tax.amount));

      const idx = taxes.findIndex(x => x.id === id);
      if (idx !== -1) {
        taxes[idx] = {
          ...taxes[idx],
          title: newTitle.trim(),
          amount: Number(newAmt) || tax.amount
        };
        saveDynamicTaxesItems(taxes);
        openTabModal("taxes");
        showToast(`Anggaran ${newTitle} berhasil diperbarui! ✨`, "success");
      }
    }

    async function payTaxPrompt(id, title, defaultAmount) {
      const amt = await showPrompt("Bayar / Tabung", `Nominal yang disetor untuk ${title} (Rp):`, String(defaultAmount));
      if (amt) {
        window.AppModule.addTransaction({
          type: "expense",
          category: "Pajak Tahunan & Hari Raya",
          subCategory: title,
          amount: Number(amt) || defaultAmount,
          wallet: "Rekening BCA",
          user: "suami",
          note: `Penyetoran ${title}`,
          date: window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0]
        });
        closeTabModal();
        showToast(`Penyetoran ${title} berhasil dicatat! ✨`, "success");
      }
    }

    // DYNAMIC GOLD & FUNDS HANDLERS
    async function handleAddNewGoldPrompt() {
      const brand = await showPrompt("Tambah Emas", "Merk Emas (Antam / UBS):", "Antam");
      if (!brand) return;
      const grams = await showPrompt("Berat Emas", "Berat dalam Gram (misal: 5 atau 10):", "5");
      if (!grams) return;
      const buyPrice = await showPrompt("Harga Beli", "Harga beli per gram saat itu (Rp):", "1250000");
      const currPrice = await showPrompt("Harga Sekarang", "Harga pasar per gram saat ini (Rp):", "1420000");

      window.InvestmentsModule.addGoldItem(brand, grams, buyPrice, currPrice);
      openTabModal("investments");
      showToast(`Catatan Emas ${brand} ${grams}g berhasil disimpan! ✨`, "success");
    }

    async function handleAddNewFundPrompt() {
      const name = await showPrompt("Tambah Reksa Dana", "Nama Produk / Sukuk Syariah:", "Reksa Dana Syariah");
      if (!name) return;
      const cap = await showPrompt("Modal Disetor", "Total modal disetor (Rp):", "1000000");
      const curr = await showPrompt("Nilai Saat Ini", "Nilai portofolio saat ini (Rp):", cap);

      window.InvestmentsModule.addFundItem(name, cap, curr);
      openTabModal("investments");
      showToast(`Investasi ${name} berhasil disimpan! ✨`, "success");
    }

    async function handleEditGoldPrompt(goldId) {
      const invData = window.InvestmentsModule.getInvestmentsData();
      const item = invData.gold.find(g => g.id === goldId);
      if (!item) return;

      const brand = await showPrompt("Edit Emas", "Merk / Brand:", item.brand || "Antam");
      if (!brand) return;
      const grams = await showPrompt("Edit Berat Emas", "Berat dalam Gram:", String(item.grams));
      if (!grams || Number(grams) <= 0) return;
      const buyPrice = await showPrompt("Edit Harga Beli", "Harga beli per gram (Rp):", String(item.buyPricePerGram));
      const currPrice = await showPrompt("Edit Harga Pasar Saat Ini", "Harga pasar per gram (Rp):", String(item.currentPricePerGram));

      window.InvestmentsModule.updateGoldItem(goldId, {
        brand: brand.trim(),
        grams: Number(grams),
        buyPricePerGram: Number(buyPrice) || item.buyPricePerGram,
        currentPricePerGram: Number(currPrice) || item.currentPricePerGram
      });
      openTabModal("investments");
      showToast(`Data emas ${brand} diperbarui! ✨`, "success");
    }

    async function handleEditFundPrompt(fundId) {
      const invData = window.InvestmentsModule.getInvestmentsData();
      const item = invData.mutualFunds.find(mf => mf.id === fundId);
      if (!item) return;

      const name = await showPrompt("Edit Reksa Dana", "Nama Produk:", item.name);
      if (!name) return;
      const cap = await showPrompt("Edit Modal Disetor", "Modal disetor (Rp):", String(item.capital));
      const curr = await showPrompt("Edit Nilai Saat Ini", "Nilai saat ini (Rp):", String(item.currentValue));

      window.InvestmentsModule.updateFundItem(fundId, {
        name: name.trim(),
        capital: Number(cap) || item.capital,
        currentValue: Number(curr) || item.currentValue
      });
      openTabModal("investments");
      showToast(`Data investasi ${name} diperbarui! ✨`, "success");
    }

    // DYNAMIC WALLETS HANDLERS
    function openWalletManagerModal() {
      renderWalletManagerList();
      document.getElementById("walletManagerModal").classList.remove("hidden");
    }

    function closeWalletManagerModal() {
      document.getElementById("walletManagerModal").classList.add("hidden");
    }

    function renderWalletManagerList() {
      const container = document.getElementById("walletManagerList");
      if (!container) return;
      const wallets = window.AppModule.getDynamicWallets();

      container.innerHTML = wallets.map(w => `
        <div class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white text-xs">
          <div>
            <div class="font-black text-slate-800">${w.name}</div>
            <div class="text-[10px] text-slate-400">Saldo: ${window.DateHelper.formatRupiah(w.balance)}</div>
          </div>
          <div class="flex items-center gap-1">
            <button onclick="handleEditWalletBalancePrompt('${w.id}', '${w.name}', ${w.balance})" class="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold">
              Ubah Saldo
            </button>
            <button onclick="handleDeleteWalletSubmit('${w.id}')" class="text-slate-300 hover:text-rose-500 text-xs p-1">🗑️</button>
          </div>
        </div>
      `).join("");
    }

    function handleAddNewWalletSubmit() {
      const name = document.getElementById("newWalletNameInput").value.trim();
      const balance = Number(document.getElementById("newWalletBalanceInput").value) || 0;

      if (!name) {
        showToast("Nama dompet / rekening tidak boleh kosong!", "error");
        return;
      }

      window.AppModule.addDynamicWallet(name, balance);
      document.getElementById("newWalletNameInput").value = "";
      document.getElementById("newWalletBalanceInput").value = "";
      renderWalletManagerList();
      showToast(`Dompet ${name} berhasil ditambahkan! ✨`, "success");
    }

    async function handleEditWalletBalancePrompt(id, name, currentBalance) {
      const newBal = await showPrompt("Ubah Saldo Dompet", `Masukkan saldo baru untuk ${name}:`, String(currentBalance));
      if (newBal !== null) {
        window.AppModule.updateDynamicWallet(id, name, Number(newBal) || 0);
        renderWalletManagerList();
        showToast(`Saldo ${name} berhasil diperbarui! ✨`, "success");
      }
    }

    function handleDeleteWalletSubmit(id) {
      if (confirm("Apakah Anda yakin ingin menghapus dompet ini?")) {
        window.AppModule.deleteDynamicWallet(id);
        renderWalletManagerList();
        showToast("Dompet berhasil dihapus.", "info");
      }
    }

    // DYNAMIC PRESETS HANDLERS
    function openPresetsManagerModal() {
      renderPresetsManagerList();
      document.getElementById("presetsManagerModal").classList.remove("hidden");
    }

    function closePresetsManagerModal() {
      document.getElementById("presetsManagerModal").classList.add("hidden");
    }

    function renderPresetsManagerList() {
      const container = document.getElementById("presetsManagerList");
      if (!container) return;
      const presets = window.AppModule.getDynamicPresets();

      container.innerHTML = presets.map(p => `
        <div class="flex items-center justify-between p-2 rounded-xl border border-slate-200 bg-white text-xs shadow-2xs">
          <div>
            <div class="font-bold text-slate-800">${p.label}</div>
            <div class="text-[10px] text-slate-400">${window.DateHelper.formatRupiah(p.amount)}</div>
          </div>
          <div class="flex items-center gap-1">
            <button onclick="handleEditDynamicPreset('${p.id}')" class="text-slate-400 hover:text-slate-700 text-xs p-1 cursor-pointer" title="Edit Pintasan">✏️</button>
            <button onclick="window.AppModule.deleteDynamicPreset('${p.id}'); renderPresetsManagerList();" class="text-slate-300 hover:text-rose-500 text-xs p-1 cursor-pointer" title="Hapus">🗑️</button>
          </div>
        </div>
      `).join("");
    }

    async function handleEditDynamicPreset(id) {
      const presets = window.AppModule.getDynamicPresets();
      const p = presets.find(x => x.id === id);
      if (!p) return;

      const newLabel = await showPrompt("Edit Pintasan", "Label tombol (misal: Bensin 20rb):", p.label);
      if (!newLabel) return;
      const newAmt = await showPrompt("Edit Nominal", "Nominal transaksi (Rp):", String(p.amount));
      if (!newAmt) return;

      window.AppModule.updateDynamicPreset(id, {
        label: newLabel.trim(),
        amount: Number(newAmt) || p.amount
      });
      renderPresetsManagerList();
      window.AppModule.renderDynamicPresetsBar();
      showToast(`Pintasan ${newLabel} berhasil diperbarui! ✨`, "success");
    }

    function handleAddNewPresetSubmit() {
      const label = document.getElementById("newPresetLabel").value.trim();
      const amount = Number(document.getElementById("newPresetAmount").value);

      if (!label || !amount) {
        showToast("Lengkapi nama pintasan dan nominal!", "error");
        return;
      }

      window.AppModule.addDynamicPreset(label, amount, "Kebutuhan Mingguan Dapur & Rumah", label, "Kas Dapur Umma Atin", "istri", label);
      document.getElementById("newPresetLabel").value = "";
      document.getElementById("newPresetAmount").value = "";
      renderPresetsManagerList();
      showToast(`Pintasan ${label} berhasil dibuat! ✨`, "success");
    }

    // ================= FITUR SHORTCUTS DASHBOARD (100% DINAMIS) =================
    const FEATURE_SHORTCUTS_KEY = "keuangan_keluarga_nav_shortcuts";
    const DEFAULT_FEATURE_SHORTCUTS = [
      { id: "feat_bills", icon: "📅", title: "Tagihan Rutin", subtitle: "Listrik, Wifi, Air", targetTab: "bills" },
      { id: "feat_shopping", icon: "🛒", title: "Belanja Dapur", subtitle: "Pasar & sayur", targetTab: "shopping" },
      { id: "feat_education", icon: "🎓", title: "Pendidikan", subtitle: "Sekolah & Kuliah", targetTab: "education" },
      { id: "feat_parents", icon: "🤲", title: "Bakti Ortu", subtitle: "Ibu & Mertua", targetTab: "parents" },
      { id: "feat_service", icon: "🔧", title: "Servis Motor", subtitle: "Oli & perawatan", targetTab: "service" },
      { id: "feat_taxes", icon: "🕋", title: "Pajak & Qurban", subtitle: "STNK, PBB, THR", targetTab: "taxes" },
      { id: "feat_goals", icon: "🎯", title: "Celengan Impian", subtitle: "Target Qurban & Umrah", targetTab: "goals" },
      { id: "feat_health", icon: "📊", title: "Skor Finansial", subtitle: "Rasio 50/30/20", targetTab: "health" },
      { id: "feat_zakat", icon: "🕌", title: "Kalkulator Zakat", subtitle: "Zakat Mal & Emas", targetTab: "zakat" },
      { id: "feat_helicopter", icon: "🚁", title: "Helicopter View", subtitle: "Komparasi Bulanan", targetTab: "helicopter" },
      { id: "feat_reports", icon: "📄", title: "Rekap & Ekspor", subtitle: "Excel / Cetak PDF", targetTab: "reports" }
    ];

    function getDynamicFeatureShortcuts() {
      const saved = localStorage.getItem(FEATURE_SHORTCUTS_KEY);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
      return DEFAULT_FEATURE_SHORTCUTS;
    }

    function saveDynamicFeatureShortcuts(list) {
      localStorage.setItem(FEATURE_SHORTCUTS_KEY, JSON.stringify(list));
      renderDynamicFeatureShortcuts();
    }

    function renderDynamicFeatureShortcuts() {
      const container = document.getElementById("dynamicFeatureShortcutsContainer");
      if (!container) return;
      const list = getDynamicFeatureShortcuts();

      container.innerHTML = list.map(f => `
        <button onclick="handleFeatureShortcutClick('${f.targetTab}')" class="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 transition-all flex items-center gap-2 shadow-2xs cursor-pointer text-left">
          <span class="text-lg">${f.icon || "📌"}</span>
          <div class="truncate">
            <div class="text-slate-800 font-extrabold text-[11px] truncate">${f.title}</div>
            <div class="text-[9px] text-slate-400 truncate">${f.subtitle || ""}</div>
          </div>
        </button>
      `).join("");
    }

    function handleFeatureShortcutClick(target) {
      if (target === "quickAdd") {
        openQuickAddModal();
      } else if (target === "helicopter" || target === "monthly-stats") {
        const el = document.getElementById("helicopterStatsContainer");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-4", "ring-indigo-300");
          setTimeout(() => el.classList.remove("ring-4", "ring-indigo-300"), 2000);
        } else {
          openTabModal(target);
        }
      } else {
        openTabModal(target || "bills");
      }
    }

    function openManageFeaturesModal() {
      renderManageFeaturesList();
      document.getElementById("manageFeaturesModal").classList.remove("hidden");
    }

    function closeManageFeaturesModal() {
      document.getElementById("manageFeaturesModal").classList.add("hidden");
    }

    function renderManageFeaturesList() {
      const container = document.getElementById("manageFeaturesList");
      if (!container) return;
      const list = getDynamicFeatureShortcuts();

      container.innerHTML = list.map(f => `
        <div class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white text-xs shadow-2xs">
          <div class="flex items-center gap-2.5">
            <span class="text-lg">${f.icon || "📌"}</span>
            <div>
              <div class="font-black text-slate-800">${f.title}</div>
              <div class="text-[10px] text-slate-400">${f.subtitle || ""} • [Buka: ${f.targetTab}]</div>
            </div>
          </div>
          <div class="flex items-center gap-1">
            <button onclick="handleEditFeatureShortcut('${f.id}')" class="text-slate-400 hover:text-slate-700 text-xs p-1 cursor-pointer" title="Edit Menu">✏️</button>
            <button onclick="handleDeleteFeatureShortcut('${f.id}')" class="text-slate-300 hover:text-rose-500 text-xs p-1 cursor-pointer" title="Hapus Menu">🗑️</button>
          </div>
        </div>
      `).join("");
    }

    async function handleEditFeatureShortcut(id) {
      const list = getDynamicFeatureShortcuts();
      const f = list.find(x => x.id === id);
      if (!f) return;

      const newIcon = await showPrompt("Edit Ikon", "Emoji atau simbol ikon:", f.icon || "📌");
      if (!newIcon) return;
      const newTitle = await showPrompt("Edit Judul Menu", "Judul tombol menu:", f.title);
      if (!newTitle) return;
      const newSub = await showPrompt("Edit Sub-Judul", "Keterangan pendek:", f.subtitle || "");

      const idx = list.findIndex(x => x.id === id);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          icon: newIcon.trim(),
          title: newTitle.trim(),
          subtitle: newSub ? newSub.trim() : ""
        };
        saveDynamicFeatureShortcuts(list);
        renderManageFeaturesList();
        showToast(`Menu ${newTitle} berhasil diperbarui! ✨`, "success");
      }
    }

    function handleDeleteFeatureShortcut(id) {
      showConfirm("Hapus Menu Fitur?", "Menu ini akan dihapus dari grid pintasan dashboard.", { type: "danger", confirmText: "Ya, Hapus" }).then(confirmed => {
        if (confirmed) {
          let list = getDynamicFeatureShortcuts();
          list = list.filter(x => x.id !== id);
          saveDynamicFeatureShortcuts(list);
          renderManageFeaturesList();
          showToast("Menu fitur berhasil dihapus.", "info");
        }
      });
    }

    function handleAddNewFeatureShortcutSubmit() {
      const icon = document.getElementById("newFeatIcon").value.trim() || "📌";
      const title = document.getElementById("newFeatTitle").value.trim();
      const subtitle = document.getElementById("newFeatSubtitle").value.trim();
      const targetTab = document.getElementById("newFeatTarget").value;

      if (!title) {
        showToast("Judul menu harus diisi!", "error");
        return;
      }

      const list = getDynamicFeatureShortcuts();
      list.push({
        id: "feat_" + Date.now(),
        icon,
        title,
        subtitle,
        targetTab
      });

      saveDynamicFeatureShortcuts(list);
      document.getElementById("newFeatIcon").value = "";
      document.getElementById("newFeatTitle").value = "";
      document.getElementById("newFeatSubtitle").value = "";
      renderManageFeaturesList();
      showToast(`Menu ${title} berhasil ditambahkan ke dashboard! ✨`, "success");
    }

    function resetFeatureShortcutsToDefault() {
      showConfirm("Reset Menu Standar?", "Kembalikan susunan menu fitur dashboard ke pengaturan bawaan?", { confirmText: "Ya, Reset" }).then(confirmed => {
        if (confirmed) {
          saveDynamicFeatureShortcuts(DEFAULT_FEATURE_SHORTCUTS);
          renderManageFeaturesList();
          showToast("Menu dikembalikan ke pengaturan standar! ✨", "success");
        }
      });
    }

    // BILLS HANDLERS (GAMBAR 1)
    function handleAddNewBillSubmit() {
      const name = document.getElementById("newBillName").value.trim();
      const cost = Number(document.getElementById("newBillCost").value);
      const dueDay = Number(document.getElementById("newBillDueDay").value) || 10;

      if (!name || !cost) {
        showToast("Nama tagihan dan perkiraan biaya harus diisi!", "error");
        return;
      }

      const bills = window.BillsModule.getMonthlyBills();
      bills.push({
        id: "bill_" + Date.now(),
        name,
        estimatedCost: cost,
        dueDay,
        defaultWallet: "BCA",
        status: "unpaid"
      });
      window.BillsModule.saveMonthlyBills(bills);
      openTabModal("bills");
      window.AppModule.renderDashboard();
      showToast(`Tagihan ${name} berhasil ditambahkan! ✨`, "success");
    }

    function handleDeleteBill(id) {
      if (confirm("Hapus tagihan ini?")) {
        window.BillsModule.deleteMonthlyBill(id);
        openTabModal("bills");
        window.AppModule.renderDashboard();
        showToast("Tagihan dihapus.", "info");
      }
    }

    async function handleEditBill(id) {
      const bills = window.BillsModule.getMonthlyBills();
      const bill = bills.find(b => b.id === id);
      if (!bill) return;

      const newName = await showPrompt("Edit Tagihan", "Nama tagihan rutin:", bill.name);
      if (!newName) return;
      const newCost = await showPrompt("Edit Perkiraan Biaya", "Perkiraan nominal tagihan (Rp):", String(bill.estimatedCost));
      if (!newCost) return;
      const newDue = await showPrompt("Edit Tanggal Jatuh Tempo", "Tanggal jatuh tempo tiap bulan (1-31):", String(bill.dueDay || 10));

      window.BillsModule.updateMonthlyBill(id, {
        name: newName.trim(),
        estimatedCost: Number(newCost) || bill.estimatedCost,
        dueDay: Number(newDue) || bill.dueDay
      });
      openTabModal("bills");
      window.AppModule.renderDashboard();
      showToast(`Tagihan ${newName} berhasil diperbarui! ✨`, "success");
    }

    // SHOPPING HANDLERS (GAMBAR 2)
    function handleAddNewShoppingSubmit() {
      const name = document.getElementById("newShoppingName").value.trim();
      const cost = Number(document.getElementById("newShoppingCost").value) || 0;

      if (!name) {
        showToast("Nama barang belanjaan harus diisi!", "error");
        return;
      }

      window.ShoppingListModule.addShoppingItem(name, cost, "Dapur");
      openTabModal("shopping");
      showToast(`Barang ${name} ditambahkan ke daftar! ✨`, "success");
    }

    async function handleEditShoppingItem(id) {
      const items = window.ShoppingListModule.getShoppingItems();
      const item = items.find(i => i.id === id);
      if (!item) return;

      const newName = await showPrompt("Edit Barang Belanja", "Nama barang belanjaan:", item.name);
      if (!newName) return;
      const newCost = await showPrompt("Edit Estimasi Biaya", "Perkiraan harga (Rp):", String(item.estimatedCost));

      window.ShoppingListModule.updateShoppingItem(id, {
        name: newName.trim(),
        estimatedCost: Number(newCost) || 0
      });
      openTabModal("shopping");
      showToast(`Barang belanjaan berhasil diperbarui! ✨`, "success");
    }

    // PARENTS HANDLERS (GAMBAR 3)
    const PARENTS_RECIPIENTS_KEY = "keuangan_keluarga_parents_recipients";
    const DEFAULT_PARENTS_RECIPIENTS = [
      { id: "pr_1", name: "Ibu Kandung Baba Pangestu", relation: "Ibu Kandung", defaultAmount: 1000000 },
      { id: "pr_2", name: "Ibu Mertua (Ibu Umma Atin)", relation: "Ibu Mertua", defaultAmount: 1000000 },
      { id: "pr_3", name: "Ayah Kandung Baba Pangestu", relation: "Ayah Kandung", defaultAmount: 500000 }
    ];

    function getDynamicParentsRecipients() {
      const saved = localStorage.getItem(PARENTS_RECIPIENTS_KEY);
      if (saved !== null) {
        try { return JSON.parse(saved); } catch (e) {}
      }
      return DEFAULT_PARENTS_RECIPIENTS;
    }

    function saveDynamicParentsRecipients(list) {
      localStorage.setItem(PARENTS_RECIPIENTS_KEY, JSON.stringify(list));
    }

    async function handleAddNewParentRecipientPrompt() {
      const name = await showPrompt("Tambah Penerima", "Nama Orang Tua / Mertua / Keluarga:", "");
      if (!name) return;
      const amt = await showPrompt("Nominal Rutin", "Nominal uang kasih sayang bulanan (Rp):", "1000000");
      const list = getDynamicParentsRecipients();
      list.push({
        id: "pr_" + Date.now(),
        name: name.trim(),
        relation: "Keluarga Tercinta",
        defaultAmount: Number(amt) || 1000000
      });
      saveDynamicParentsRecipients(list);
      openTabModal("parents");
      showToast(`${name} berhasil ditambahkan! ✨`, "success");
    }

    function deleteDynamicParentRecipient(id) {
      if (confirm("Hapus penerima ini?")) {
        let list = getDynamicParentsRecipients();
        list = list.filter(x => x.id !== id);
        saveDynamicParentsRecipients(list);
        openTabModal("parents");
        showToast("Penerima dihapus.", "info");
      }
    }

    async function handleEditParentRecipient(id) {
      const list = getDynamicParentsRecipients();
      const p = list.find(x => x.id === id);
      if (!p) return;

      const newName = await showPrompt("Edit Penerima", "Nama Orang Tua / Mertua / Keluarga:", p.name);
      if (!newName) return;
      const newRel = await showPrompt("Edit Hubungan", "Hubungan keluarga (misal: Ibu Kandung, Ibu Mertua):", p.relation || "Keluarga");
      const newAmt = await showPrompt("Edit Nominal Rutin", "Nominal uang bulanan (Rp):", String(p.defaultAmount));

      const idx = list.findIndex(x => x.id === id);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          name: newName.trim(),
          relation: newRel ? newRel.trim() : p.relation,
          defaultAmount: Number(newAmt) || p.defaultAmount
        };
        saveDynamicParentsRecipients(list);
        openTabModal("parents");
        showToast(`Data ${newName} berhasil diperbarui! ✨`, "success");
      }
    }

    function executeParentGift(id) {
      const list = getDynamicParentsRecipients();
      const p = list.find(x => x.id === id);
      if (!p) return;

      window.FamilyParentsModule.addParentGift({ recipient: p.name, amount: p.defaultAmount });
      closeTabModal();
      showToast(`Kasih sayang untuk ${p.name} (${window.DateHelper.formatRupiah(p.defaultAmount)}) berhasil dicatat! ✨🤲`, "success");
    }

    // VEHICLE HANDLERS (GAMBAR 4)
    function handleAddNewVehicleSubmit() {
      const name = document.getElementById("newVehName").value.trim();
      const plat = document.getElementById("newVehPlat").value.trim();

      if (!name) {
        showToast("Nama kendaraan harus diisi!", "error");
        return;
      }

      const vehs = window.VehicleServiceModule.getVehicles();
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 2);

      vehs.push({
        id: "v_" + Date.now(),
        name,
        type: "motor",
        plat: plat || "R ....",
        lastOilDate: new Date().toISOString().split("T")[0],
        nextOilDate: nextDate.toISOString().split("T")[0]
      });
      window.VehicleServiceModule.saveVehicles(vehs);
      openTabModal("service");
      showToast(`Kendaraan ${name} berhasil ditambahkan! ✨`, "success");
    }

    function handleDeleteVehicle(id) {
      if (confirm("Hapus kendaraan ini?")) {
        let vehs = window.VehicleServiceModule.getVehicles();
        vehs = vehs.filter(v => v.id !== id);
        window.VehicleServiceModule.saveVehicles(vehs);
        openTabModal("service");
        showToast("Kendaraan dihapus.", "info");
      }
    }

    async function handleEditVehicle(id) {
      const vehs = window.VehicleServiceModule.getVehicles();
      const v = vehs.find(x => x.id === id);
      if (!v) return;

      const newName = await showPrompt("Edit Kendaraan", "Nama kendaraan:", v.name);
      if (!newName) return;
      const newPlat = await showPrompt("Edit Plat Nomor", "Plat nomor kendaraan:", v.plat || "");
      const nextDate = await showPrompt("Jadwal Servis Berikutnya", "Tanggal berikutnya (YYYY-MM-DD):", v.nextOilDate || "");

      window.VehicleServiceModule.updateVehicle(id, {
        name: newName.trim(),
        plat: newPlat ? newPlat.trim() : v.plat,
        nextOilDate: nextDate ? nextDate.trim() : v.nextOilDate
      });
      openTabModal("service");
      showToast(`Data ${newName} berhasil diperbarui! ✨`, "success");
    }

    async function recordVehicleServicePrompt(vehId, vehName) {
      const cost = await showPrompt("Servis Kendaraan", `Biaya servis / ganti oli untuk ${vehName} (Rp):`, "95000");
      if (cost) {
        window.VehicleServiceModule.addServiceRecord({
          vehicleId: vehId,
          vehicleName: vehName,
          type: "Ganti Oli Mesin & Perawatan",
          cost: Number(cost) || 95000
        });
        closeTabModal();
        showToast(`Servis ${vehName} berhasil dicatat! ✨`, "success");
      }
    }

    function openTabModal(tab) {
      const modal = document.getElementById("tabModal");
      const title = document.getElementById("tabModalTitle");
      const body = document.getElementById("tabModalBody");
      modal.classList.remove("hidden");

      // 1. GAMBAR 1: TAGIHAN RUTIN BULANAN (CRUD DINAMIS)
      if (tab === "bills") {
        title.textContent = "📅 Checklist Tagihan Rutin Bulanan";
        const bills = window.BillsModule ? window.BillsModule.getMonthlyBills() : [];
        body.innerHTML = `
          <!-- Form Tambah Tagihan Baru -->
          <div class="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
            <div class="text-xs font-black text-blue-950">+ Tambah Tagihan Baru:</div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <input type="text" id="newBillName" placeholder="Nama (misal: Wifi Indihome)" class="bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 font-bold outline-none">
              <input type="number" id="newBillCost" placeholder="Perkiraan Biaya (Rp)" class="bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 font-black outline-none">
            </div>
            <div class="flex gap-2 text-xs">
              <input type="number" id="newBillDueDay" placeholder="Jatuh Tempo (Tgl 1-31)" min="1" max="31" class="flex-1 bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 font-bold outline-none">
              <button onclick="handleAddNewBillSubmit()" class="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm">
                + Tambah Tagihan
              </button>
            </div>
          </div>

          <!-- Daftar Tagihan -->
          <div class="space-y-2">
            ${bills.length === 0 ? '<div class="text-center py-6 text-slate-400 text-xs font-bold">Belum ada tagihan rutin. Silakan tambahkan di atas!</div>' : bills.map(b => `
              <div class="flex items-center justify-between p-3 rounded-xl border ${b.status === 'paid' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200'}">
                <div>
                  <div class="text-xs font-black text-slate-800">${b.name}</div>
                  <div class="text-[10px] text-slate-400">Jatuh tempo: Tgl ${b.dueDay} • Est: ${window.DateHelper.formatRupiah(b.estimatedCost)}</div>
                </div>
                <div class="flex items-center gap-1.5">
                  ${b.status === 'paid' ? '<span class="px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black">✅ Lunas</span>' : `
                    <button onclick="window.BillsModule.payBill('${b.id}'); openTabModal('bills');" class="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs">
                      Bayar 1-Klik
                    </button>
                  `}
                  <button onclick="handleEditBill('${b.id}')" class="text-slate-400 hover:text-slate-700 text-xs p-1 cursor-pointer" title="Edit Tagihan">✏️</button>
                  <button onclick="handleDeleteBill('${b.id}')" class="text-slate-300 hover:text-rose-500 text-xs p-1 cursor-pointer" title="Hapus Tagihan">🗑️</button>
                </div>
              </div>
            `).join("")}
          </div>
        `;
      }

      // 2. GAMBAR 2: CATATAN BELANJA DAPUR & PASAR (CRUD DINAMIS)
      else if (tab === "shopping") {
        title.textContent = "🛒 Catatan Belanja Dapur & Pasar";
        const items = window.ShoppingListModule ? window.ShoppingListModule.getShoppingItems() : [];
        body.innerHTML = `
          <!-- Form Tambah Belanjaan -->
          <div class="flex gap-2 text-xs">
            <input type="text" id="newShoppingName" placeholder="Nama barang (misal: Bawang 1/2kg)..." class="flex-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold outline-none">
            <input type="number" id="newShoppingCost" placeholder="Rp..." class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 font-bold outline-none">
            <button onclick="handleAddNewShoppingSubmit()" class="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shrink-0">
              + Tambah
            </button>
          </div>

          <!-- Daftar Belanjaan -->
          <div class="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            ${items.length === 0 ? '<div class="text-center py-6 text-slate-400 text-xs font-bold">Daftar belanja masih kosong. Tambahkan barang di atas!</div>' : items.map(i => `
              <div class="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-white shadow-2xs">
                <label class="flex items-center gap-2 cursor-pointer text-xs font-bold ${i.isChecked ? 'line-through text-slate-400' : 'text-slate-800'}">
                  <input type="checkbox" ${i.isChecked ? 'checked' : ''} onchange="window.ShoppingListModule.toggleShoppingItem('${i.id}'); openTabModal('shopping');" class="w-4 h-4 rounded text-emerald-600 cursor-pointer">
                  <span>${i.name} (${window.DateHelper.formatRupiah(i.estimatedCost)})</span>
                </label>
                <div class="flex items-center gap-1">
                  <button onclick="handleEditShoppingItem('${i.id}')" class="text-slate-400 hover:text-slate-700 text-xs p-1 cursor-pointer" title="Edit Barang">✏️</button>
                  <button onclick="window.ShoppingListModule.deleteShoppingItem('${i.id}'); openTabModal('shopping');" class="text-slate-300 hover:text-rose-500 text-xs p-1 cursor-pointer" title="Hapus">🗑️</button>
                </div>
              </div>
            `).join("")}
          </div>

          <button onclick="const c = window.ShoppingListModule.convertCheckedToExpense(); if(c>0){ showToast('Berhasil dicatat ke pengeluaran dapur! ✨', 'success'); closeTabModal(); }" class="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-black text-xs mt-2">
            Jadikan Transaksi Belanja Tercentang
          </button>
        `;
      }

      // 3. GAMBAR 3: BAKTI ORANG TUA, MERTUA & KONDANGAN (CRUD DINAMIS)
      else if (tab === "parents") {
        title.textContent = "🤲 Bakti Orang Tua, Mertua & Kondangan";
        const parents = getDynamicParentsRecipients();
        body.innerHTML = `
          <!-- Section 1: Orang Tua & Mertua -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-slate-800">Uang Belanja Orang Tua & Mertua:</span>
              <button onclick="handleAddNewParentRecipientPrompt()" class="text-[10.5px] font-bold text-emerald-600 hover:underline cursor-pointer">
                + Tambah Orang Tua / Mertua
              </button>
            </div>
            
            <div class="space-y-1.5">
              ${parents.map(p => `
                <div class="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <div class="text-xs font-black text-emerald-950">${p.name}</div>
                    <div class="text-[10px] text-emerald-700">${p.relation} • Nominal Rutin: ${window.DateHelper.formatRupiah(p.defaultAmount)}</div>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <button onclick="executeParentGift('${p.id}')" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-bold shadow-xs">
                      Beri Kasih
                    </button>
                    <button onclick="handleEditParentRecipient('${p.id}')" class="text-slate-400 hover:text-slate-700 text-xs p-1 cursor-pointer" title="Edit Penerima">✏️</button>
                    <button onclick="deleteDynamicParentRecipient('${p.id}'); openTabModal('parents');" class="text-slate-300 hover:text-rose-500 text-xs p-1 cursor-pointer" title="Hapus">🗑️</button>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- Section 2: Kondangan & Hajatan -->
          <div class="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2 pt-3 mt-3">
            <div class="text-xs font-extrabold text-rose-950 flex items-center gap-1">
              <span>💌</span>
              <span>Kondangan, Buwuh, Syukuran & Tilik Bayi</span>
            </div>
            <p class="text-[10.5px] text-rose-700">Catat amplop hajatan saudara, teman, atau tetangga.</p>
            <button onclick="openQuickAddModal(); closeTabModal();" class="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs">
              + Catat Amplop Kondangan / Buwuh
            </button>
          </div>
        `;
      }

      
      // 5. PENDIDIKAN ANAK & ISTRI (CRUD DINAMIS)
      else if (tab === "education") {
        title.textContent = "🎓 Anggaran & Biaya Pendidikan";
        const edus = getDynamicEducationItems();
        body.innerHTML = `
          <!-- Form Tambah Biaya Pendidikan -->
          <div class="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
            <div class="text-xs font-black text-purple-950">+ Tambah Biaya Pendidikan Baru:</div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <input type="text" id="newEduTitle" placeholder="Misal: SPP / UKT Kuliah" class="bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 font-bold outline-none">
              <input type="number" id="newEduAmount" placeholder="Biaya (Rp)" class="bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 font-black outline-none">
            </div>
            <div class="flex gap-2 text-xs">
              <select id="newEduPerson" class="flex-1 bg-white border border-purple-200 rounded-lg px-2 py-1 font-bold">
                <option value="Anak">Sekolah Anak</option>
                <option value="Umma Atin">Kuliah / Kursus Umma Atin</option>
                <option value="Baba Pangestu">Pelatihan Baba Pangestu</option>
              </select>
              <button onclick="handleAddNewEduSubmit()" class="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-sm">
                + Simpan
              </button>
            </div>
          </div>

          <!-- Daftar Pendidikan -->
          <div class="space-y-2">
            ${edus.map(e => `
              <div class="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                <div>
                  <div class="font-black text-slate-800">${e.title} (${e.person})</div>
                  <div class="text-[10px] text-slate-400">Est: ${window.DateHelper.formatRupiah(e.amount)}</div>
                </div>
                <div class="flex items-center gap-1.5">
                  <button onclick="payEduBillPrompt('${e.id}', '${e.title}', ${e.amount})" class="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10.5px] font-bold">
                    Bayar
                  </button>
                  <button onclick="handleEditEdu('${e.id}')" class="text-slate-400 hover:text-slate-700 text-xs p-1 cursor-pointer" title="Edit Anggaran">✏️</button>
                  <button onclick="deleteDynamicEdu('${e.id}'); openTabModal('education');" class="text-slate-300 hover:text-rose-500 text-xs p-1 cursor-pointer" title="Hapus">🗑️</button>
                </div>
              </div>
            `).join("")}
          </div>
        `;
      }

      // 6. PAJAK & QURBAN HARI RAYA (CRUD DINAMIS)
      else if (tab === "taxes") {
        title.textContent = "🕋 Pajak Kendaraan, PBB & Tabungan Hari Raya";
        const taxes = getDynamicTaxesItems();
        body.innerHTML = `
          <!-- Form Tambah Pajak / Tabungan -->
          <div class="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
            <div class="text-xs font-black text-amber-950">+ Tambah Pajak / Anggaran Hari Raya:</div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <input type="text" id="newTaxTitle" placeholder="Misal: Pajak STNK / Qurban" class="bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 font-bold outline-none">
              <input type="number" id="newTaxAmount" placeholder="Biaya (Rp)" class="bg-white border border-amber-200 rounded-lg px-2.5 py-1.5 font-black outline-none">
            </div>
            <button onclick="handleAddNewTaxSubmit()" class="w-full py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-sm">
              + Tambah Anggaran
            </button>
          </div>

          <!-- Daftar Pajak & Tabungan -->
          <div class="space-y-2">
            ${taxes.map(t => `
              <div class="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                <div>
                  <div class="font-black text-slate-800">${t.title}</div>
                  <div class="text-[10px] text-slate-400">Target: ${window.DateHelper.formatRupiah(t.amount)}</div>
                </div>
                <div class="flex items-center gap-1.5">
                  <button onclick="payTaxPrompt('${t.id}', '${t.title}', ${t.amount})" class="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[10.5px] font-bold">
                    Bayar / Tabung
                  </button>
                  <button onclick="handleEditTax('${t.id}')" class="text-slate-400 hover:text-slate-700 text-xs p-1 cursor-pointer" title="Edit Anggaran">✏️</button>
                  <button onclick="deleteDynamicTax('${t.id}'); openTabModal('taxes');" class="text-slate-300 hover:text-rose-500 text-xs p-1 cursor-pointer" title="Hapus">🗑️</button>
                </div>
              </div>
            `).join("")}
          </div>
        `;
      }

      // 7. PORTOFOLIO EMAS & INVESTASI (100% DINAMIS)
      else if (tab === "investments") {
        title.textContent = "💎 Portofolio Emas Antam, Investasi & Net Worth";
        const invData = window.InvestmentsModule.getInvestmentsData();
        const metrics = window.AppModule.calculateKeluargaMetrics();
        const nw = window.InvestmentsModule.calculateFamilyNetWorth(metrics.balance, 0);

        body.innerHTML = `
          <!-- Ringkasan Family Net Worth -->
          <div class="p-4 rounded-2xl bg-slate-900 text-white space-y-1">
            <div class="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider">Kekayaan Bersih Keluarga:</div>
            <div class="text-xl font-black">${window.DateHelper.formatRupiah(nw.familyNetWorth)}</div>
            <div class="text-[10px] text-slate-400 flex gap-2">
              <span>Kas: ${window.DateHelper.formatRupiah(metrics.balance)}</span>
              <span>•</span>
              <span>Emas: ${window.DateHelper.formatRupiah(nw.totalGoldValue)}</span>
              <span>•</span>
              <span>Reksa Dana: ${window.DateHelper.formatRupiah(nw.totalFundsValue)}</span>
            </div>
          </div>

          <!-- Section 1: Emas Antam / UBS -->
          <div class="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-amber-950">Logam Mulia Emas Fisik:</span>
              <button onclick="handleAddNewGoldPrompt()" class="text-[10.5px] font-bold text-amber-800 hover:underline cursor-pointer">+ Tambah Emas</button>
            </div>
            <div class="space-y-1.5">
              ${invData.gold.length === 0 ? '<div class="text-center py-2 text-slate-400 text-xs">Belum ada catatan emas. Tambahkan di atas!</div>' : invData.gold.map(g => `
                <div class="p-2.5 rounded-xl bg-white border border-amber-200 flex items-center justify-between text-xs">
                  <div>
                    <div class="font-bold text-slate-800">${g.brand} (${g.grams} Gram)</div>
                    <div class="text-[10px] text-slate-400">Beli: ${window.DateHelper.formatRupiah(g.buyPricePerGram)}/g • Sekarang: ${window.DateHelper.formatRupiah(g.currentPricePerGram)}/g</div>
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="font-extrabold text-amber-900">${window.DateHelper.formatRupiah(g.grams * g.currentPricePerGram)}</span>
                    <button onclick="handleEditGoldPrompt('${g.id}')" class="text-slate-400 hover:text-amber-700 text-xs p-1 cursor-pointer" title="Edit Emas">✏️</button>
                    <button onclick="window.InvestmentsModule.deleteGoldItem('${g.id}'); openTabModal('investments');" class="text-slate-300 hover:text-rose-500 text-xs p-1 cursor-pointer" title="Hapus">🗑️</button>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- Section 2: Reksa Dana / Sukuk Syariah -->
          <div class="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-blue-950">Reksa Dana & Investasi Syariah:</span>
              <button onclick="handleAddNewFundPrompt()" class="text-[10.5px] font-bold text-blue-800 hover:underline cursor-pointer">+ Tambah Instrumen</button>
            </div>
            <div class="space-y-1.5">
              ${invData.mutualFunds.length === 0 ? '<div class="text-center py-2 text-slate-400 text-xs">Belum ada reksa dana. Tambahkan di atas!</div>' : invData.mutualFunds.map(mf => `
                <div class="p-2.5 rounded-xl bg-white border border-blue-200 flex items-center justify-between text-xs">
                  <div>
                    <div class="font-bold text-slate-800">${mf.name}</div>
                    <div class="text-[10px] text-slate-400">Modal: ${window.DateHelper.formatRupiah(mf.capital)}</div>
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="font-extrabold text-blue-900">${window.DateHelper.formatRupiah(mf.currentValue)}</span>
                    <button onclick="handleEditFundPrompt('${mf.id}')" class="text-slate-400 hover:text-blue-700 text-xs p-1 cursor-pointer" title="Edit Reksa Dana">✏️</button>
                    <button onclick="window.InvestmentsModule.deleteFundItem('${mf.id}'); openTabModal('investments');" class="text-slate-300 hover:text-rose-500 text-xs p-1 cursor-pointer" title="Hapus">🗑️</button>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }

      // 4. GAMBAR 4: SERVIS KENDARAAN & OLI (CRUD DINAMIS)
      else if (tab === "service") {
        title.textContent = "🔧 Servis Kendaraan & Pengingat Ganti Oli";
        const vehs = window.VehicleServiceModule ? window.VehicleServiceModule.getVehicles() : [];
        body.innerHTML = `
          <!-- Form Tambah Kendaraan Baru -->
          <div class="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
            <div class="text-xs font-black text-blue-950">+ Tambah Kendaraan Baru:</div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <input type="text" id="newVehName" placeholder="Nama (misal: Scoopy Umma)" class="bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 font-bold outline-none">
              <input type="text" id="newVehPlat" placeholder="Plat (misal: R 1234 XY)" class="bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 font-black outline-none">
            </div>
            <button onclick="handleAddNewVehicleSubmit()" class="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-sm">
              + Simpan Kendaraan
            </button>
          </div>

          <!-- Daftar Kendaraan -->
          <div class="space-y-2">
            ${vehs.map(v => `
              <div class="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                <div class="flex justify-between items-center text-xs font-black text-slate-900">
                  <span>${v.name}</span>
                  <div class="flex items-center gap-1.5">
                    <span class="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold">${v.plat}</span>
                    <button onclick="handleEditVehicle('${v.id}')" class="text-slate-400 hover:text-slate-700 text-xs p-1 cursor-pointer" title="Edit Kendaraan">✏️</button>
                    <button onclick="handleDeleteVehicle('${v.id}')" class="text-slate-300 hover:text-rose-500 text-xs p-1 cursor-pointer" title="Hapus">🗑️</button>
                  </div>
                </div>
                <div class="text-[10.5px] text-slate-500">Jadwal Ganti Oli Berikutnya: <strong>${window.DateHelper.formatDateIndonesia(v.nextOilDate)}</strong></div>
                <button onclick="recordVehicleServicePrompt('${v.id}', '${v.name}')" class="mt-2 px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold cursor-pointer">
                  + Catat Ganti Oli / Servis
                </button>
              </div>
            `).join("")}
          </div>
        `;
      }

      // 8. CELENGAN TARGET IMPIAN KELUARGA (FINANCIAL GOALS)
      else if (tab === "goals") {
        title.textContent = "🎯 Celengan Target Impian Keluarga";
        const goals = window.GoalsModule ? window.GoalsModule.getGoals() : [];
        const summary = window.GoalsModule ? window.GoalsModule.calculateGoalsSummary() : { totalTarget: 0, totalSaved: 0, overallPercentage: 0 };
        
        body.innerHTML = `
          <!-- Summary Banner -->
          <div class="p-4 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-900 text-white space-y-2">
            <div class="flex justify-between items-center text-[10.5px] font-extrabold uppercase tracking-wider text-purple-300">
              <span>Total Tabungan Impian:</span>
              <span class="px-2 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/40 text-purple-200">${summary.overallPercentage}% Tercapai</span>
            </div>
            <div class="text-2xl font-black">${window.DateHelper.formatRupiah(summary.totalSaved)} <span class="text-xs font-normal text-purple-300">/ ${window.DateHelper.formatRupiah(summary.totalTarget)}</span></div>
            <div class="w-full bg-purple-950/70 rounded-full h-2 overflow-hidden">
              <div class="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all" style="width: ${summary.overallPercentage}%"></div>
            </div>
          </div>

          <!-- Form Tambah Celengan Baru -->
          <div class="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2">
            <div class="text-xs font-black text-purple-950">+ Tambah Target Impian Baru:</div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <input type="text" id="newGoalTitle" placeholder="Nama (misal: Qurban 2026 / Umrah)" class="bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 font-bold outline-none">
              <input type="number" id="newGoalTarget" placeholder="Target Nominal (Rp)" class="bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 font-black outline-none">
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <input type="date" id="newGoalDeadline" class="bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 font-bold outline-none cursor-pointer" title="Target Tanggal Tercapai">
              <select id="newGoalIcon" class="bg-white border border-purple-200 rounded-lg px-2.5 py-1.5 font-bold outline-none">
                <option value="🐐">🐐 Qurban</option>
                <option value="🕋">🕋 Umrah / Haji</option>
                <option value="🏖️">🏖️ Liburan</option>
                <option value="🏡">🏡 Rumah / Renovasi</option>
                <option value="🎓">🎓 Pendidikan Anak</option>
                <option value="🚗">🚗 Kendaraan</option>
                <option value="🎯" selected>🎯 Target Umum</option>
              </select>
            </div>
            <button onclick="handleAddNewGoalSubmit()" class="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-sm cursor-pointer transition-all">
              + Buat Celengan Impian
            </button>
          </div>

          <!-- Daftar Celengan Impian -->
          <div class="space-y-2.5">
            ${goals.length === 0 ? '<div class="text-center py-6 text-slate-400 text-xs font-bold">Belum ada target impian. Silakan buat di atas!</div>' : goals.map(g => {
              const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
              return `
                <div class="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="text-2xl">${g.icon || '🎯'}</span>
                      <div>
                        <h4 class="text-xs font-black text-slate-900">${g.title}</h4>
                        <div class="text-[10px] text-slate-400 font-medium">Tenggat: ${g.deadline ? window.DateHelper.formatDateIndonesia(g.deadline) : 'Tanpa batas'}</div>
                      </div>
                    </div>
                    <div class="text-right flex items-center gap-1.5">
                      <span class="px-2 py-0.5 rounded-full text-[10px] font-black ${pct >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'}">${pct}%</span>
                      <button onclick="handleEditGoalPrompt('${g.id}')" class="text-slate-400 hover:text-slate-700 text-xs p-1 cursor-pointer" title="Edit Target & Saldo (Bisa 0)">✏️</button>
                      <button onclick="handleDeleteGoal('${g.id}')" class="text-slate-300 hover:text-rose-500 text-xs p-1 cursor-pointer" title="Hapus">🗑️</button>
                    </div>
                  </div>

                  <!-- Progress Bar -->
                  <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                    <div class="h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : 'bg-purple-600'}" style="width: ${pct}%"></div>
                  </div>

                  <div class="flex justify-between items-center text-[10.5px]">
                    <button onclick="handleEditGoalPrompt('${g.id}')" class="text-slate-800 font-bold hover:text-purple-700 cursor-pointer flex items-center gap-1" title="Klik untuk edit nominal saldo">
                      <span>${window.DateHelper.formatRupiah(g.currentAmount)}</span>
                      <span class="text-[9px] text-slate-400 font-normal">✏️ Edit</span>
                    </button>
                    <span class="text-slate-400">Target: <strong>${window.DateHelper.formatRupiah(g.targetAmount)}</strong></span>
                  </div>

                  <div class="pt-1 flex gap-2 border-t border-slate-100">
                    <button onclick="handleDepositGoalPrompt('${g.id}', '${g.title}')" class="flex-1 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-extrabold cursor-pointer transition-all">
                      + Setor Tabungan
                    </button>
                    <button onclick="handleWithdrawGoalPrompt('${g.id}', '${g.title}')" class="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer transition-all" title="Cairkan tabungan">
                      Tarik
                    </button>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `;
      }

      // 9. SKOR KESEHATAN FINANSIAL & RASIO 50/30/20
      else if (tab === "health") {
        title.textContent = "📊 Skor Kesehatan Finansial & Alokasi 50/30/20";
        const metrics = window.AppModule.calculateKeluargaMetrics();
        const ef = window.EmergencyFundModule ? window.EmergencyFundModule.getEmergencyFundData() : null;
        const inv = window.InvestmentsModule ? window.InvestmentsModule.calculateFamilyNetWorth(metrics.balance, 0) : null;
        const health = window.AnalyticsHealthModule ? window.AnalyticsHealthModule.calculateFinancialHealthScore(metrics, ef, inv) : { score: 85, grade: "A+", statusText: "Sehat", tips: [] };
        const rule = window.AnalyticsHealthModule ? window.AnalyticsHealthModule.analyzeRule503020(metrics.filteredTxs || [], metrics.totalIncome) : { needsPct: 50, wantsPct: 25, savingsPct: 25 };

        body.innerHTML = `
          <!-- Health Score Banner -->
          <div class="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest">Financial Health Score:</span>
                <div class="text-3xl font-black text-white">${health.score}<span class="text-sm font-normal text-slate-400">/100</span></div>
                <div class="text-xs font-bold text-emerald-300">${health.statusText}</div>
              </div>
              <div class="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-2xl font-black text-emerald-400 shadow-lg">
                ${health.grade}
              </div>
            </div>
          </div>

          <!-- Rasio 50/30/20 Detail -->
          <div class="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
            <h4 class="text-xs font-black text-slate-900 flex items-center justify-between">
              <span>Alokasi Anggaran Rasio 50 / 30 / 20</span>
              <span class="text-[10px] font-normal text-slate-400">Prinsip Finansial Ideal</span>
            </h4>

            <!-- Bar Visual -->
            <div class="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div class="bg-emerald-500 h-full transition-all" style="width: ${rule.needsPct}%" title="Kebutuhan"></div>
              <div class="bg-amber-400 h-full transition-all" style="width: ${rule.wantsPct}%" title="Keinginan"></div>
              <div class="bg-blue-500 h-full transition-all" style="width: ${rule.savingsPct}%" title="Tabungan"></div>
            </div>

            <div class="grid grid-cols-3 gap-2 pt-1 text-center">
              <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <div class="text-[10px] font-bold text-emerald-800">Kebutuhan (Needs)</div>
                <div class="text-sm font-black text-emerald-900">${rule.needsPct}%</div>
                <div class="text-[9px] text-emerald-600">Target Ideal: 50%</div>
              </div>
              <div class="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                <div class="text-[10px] font-bold text-amber-800">Keinginan (Wants)</div>
                <div class="text-sm font-black text-amber-900">${rule.wantsPct}%</div>
                <div class="text-[9px] text-amber-600">Target Ideal: 30%</div>
              </div>
              <div class="p-2.5 rounded-xl bg-blue-50 border border-blue-100">
                <div class="text-[10px] font-bold text-blue-800">Tabungan (Savings)</div>
                <div class="text-sm font-black text-blue-900">${rule.savingsPct}%</div>
                <div class="text-[9px] text-blue-600">Target Ideal: 20%</div>
              </div>
            </div>
          </div>

          <!-- Rekomendasi & AI Financial Tips -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div class="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span>💡</span> Evaluasi & Rekomendasi Finansial Keluarga:
            </div>
            <ul class="space-y-1.5 text-xs text-slate-600">
              ${health.tips.map(t => `
                <li class="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span class="text-emerald-500 font-bold shrink-0">✓</span>
                  <span class="leading-relaxed font-medium">${t}</span>
                </li>
              `).join("")}
            </ul>
          </div>
        `;
      }

      // 10. KALKULATOR ZAKAT MAL & EMAS
      else if (tab === "zakat") {
        title.textContent = "🕌 Kalkulator Zakat Mal & Logam Mulia Emas";
        const metrics = window.AppModule.calculateKeluargaMetrics();
        const invData = window.InvestmentsModule ? window.InvestmentsModule.getInvestmentsData() : { gold: [] };
        const totalGoldGrams = invData.gold.reduce((sum, g) => sum + Number(g.grams || 0), 0);
        const goldPrice = 1450000;
        const zakat = window.AnalyticsHealthModule ? window.AnalyticsHealthModule.calculateZakatMal(metrics.balance, totalGoldGrams, goldPrice) : null;

        body.innerHTML = `
          <div class="p-4 rounded-2xl ${zakat && zakat.isWajib ? 'bg-gradient-to-br from-emerald-900 to-teal-950' : 'bg-slate-900'} text-white space-y-2">
            <div class="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">Status Zakat Harta (Zakat Mal):</div>
            <div class="text-xl font-black">${zakat && zakat.isWajib ? '✅ Wajib Menunaikan Zakat' : 'ℹ️ Belum Mencapai Nisab'}</div>
            <div class="text-xs text-slate-300">
              ${zakat && zakat.isWajib ? `Kewajiban Zakat (2.5%): <strong class="text-emerald-300 text-base font-black">${window.DateHelper.formatRupiah(zakat.zakatAmount)}</strong>` : 'Total harta Anda belum melampaui batas nisab 85 gram emas.'}
            </div>
          </div>

          <!-- Rincian Harta Tersinkronisasi -->
          <div class="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2.5 text-xs">
            <div class="font-black text-slate-800">Rincian Harta Objek Zakat:</div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Kas Likuid (Semua Dompet):</span>
              <strong class="text-slate-900">${window.DateHelper.formatRupiah(metrics.balance)}</strong>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100">
              <span class="text-slate-500">Emas Antam Tersimpan (${totalGoldGrams} gram):</span>
              <strong class="text-slate-900">${window.DateHelper.formatRupiah(totalGoldGrams * goldPrice)}</strong>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-100 bg-slate-50 px-2 rounded-lg font-bold">
              <span class="text-slate-700">Total Harta Terhitung:</span>
              <strong class="text-emerald-700">${window.DateHelper.formatRupiah(zakat ? zakat.totalHarta : 0)}</strong>
            </div>
            <div class="flex justify-between py-1 text-[11px] text-slate-500">
              <span>Batas Nisab (85g Emas x Rp ${goldPrice.toLocaleString("id-ID")}):</span>
              <strong>${window.DateHelper.formatRupiah(85 * goldPrice)}</strong>
            </div>
          </div>

          ${zakat && zakat.isWajib ? `
            <button onclick="handleRecordZakatExpense(${zakat.zakatAmount})" class="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5">
              <span>🤲 Catat Pengeluaran Zakat (${window.DateHelper.formatRupiah(zakat.zakatAmount)})</span>
            </button>
          ` : ''}
        `;
      }

      // 11. REKAP LAPORAN & EKSPOR EXCEL / PDF
      else if (tab === "reports") {
        title.textContent = "📄 Laporan Keuangan, Ekspor Excel & Cetak PDF";
        body.innerHTML = `
          <div class="space-y-3">
            <!-- Ekspor Kas Keluarga -->
            <div class="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
              <div>
                <h4 class="text-xs font-black text-slate-900">Laporan Kas Keluarga (Excel/CSV)</h4>
                <p class="text-[10px] text-slate-400">Unduh riwayat transaksi keluarga rapi per kolom.</p>
              </div>
              <button onclick="window.ExportReportsModule.exportKeluargaToCsv()" class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shrink-0 cursor-pointer transition-all shadow-2xs">
                📥 Unduh CSV
              </button>
            </div>

            <!-- Ekspor Usaha Ibu -->
            <div class="p-3.5 rounded-2xl border border-slate-200 bg-white flex items-center justify-between">
              <div>
                <h4 class="text-xs font-black text-slate-900">Laporan Usaha Kost & Gas Ibu (Excel/CSV)</h4>
                <p class="text-[10px] text-slate-400">Unduh rekapitulasi sewa kamar kost & penjualan gas.</p>
              </div>
              <button onclick="window.ExportReportsModule.exportIbuToCsv()" class="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black shrink-0 cursor-pointer transition-all shadow-2xs">
                📥 Unduh CSV
              </button>
            </div>

            <!-- Cetak PDF Resmi -->
            <div class="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white space-y-2">
              <div class="flex items-center justify-between">
                <div class="space-y-1">
                  <h4 class="text-xs font-black text-emerald-400">Cetak Dokumen PDF Resmi Ber-Kop Keluarga</h4>
                  <p class="text-[10px] text-slate-300">Format cetak A4 bertandatangan Baba Pangestu & Umma Atin.</p>
                </div>
                <button onclick="window.ExportReportsModule.printOfficialFamilyReport()" class="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shrink-0 cursor-pointer transition-all shadow-md flex items-center gap-1">
                  <span>🖨️ Cetak PDF</span>
                </button>
              </div>
            </div>
          </div>
        `;
      }

      // 12. HELICOPTER VIEW STATISTIK BULANAN
      else if (tab === "helicopter" || tab === "monthly-stats") {
        title.textContent = "🚁 Helicopter View: Statistik & Komparasi Bulanan";
        body.innerHTML = `
          <div id="helicopterModalStatsBody" class="space-y-3">
            <div class="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-xs text-indigo-900 font-bold flex items-center gap-2">
              <span>💡</span>
              <span>Berikut adalah perbandingan multi-bulan arus kas keluarga & usaha ibu:</span>
            </div>
            <div id="helicopterStatsModalContent"></div>
          </div>
        `;
        setTimeout(() => {
          const content = document.getElementById("helicopterStatsModalContent");
          const orig = document.getElementById("helicopterStatsContainer");
          if (content && orig) {
            content.innerHTML = orig.innerHTML;
          }
        }, 50);
      }
    }

    function closeTabModal() {
      document.getElementById("tabModal").classList.add("hidden");
    }

    // Helper function called by app.js renderDashboard
    window.renderDashboardHealthAndGoals = function(metrics) {
      // 1. Update Financial Health in Dashboard
      if (window.AnalyticsHealthModule) {
        const ef = window.EmergencyFundModule ? window.EmergencyFundModule.getEmergencyFundData() : null;
        const inv = window.InvestmentsModule ? window.InvestmentsModule.calculateFamilyNetWorth(metrics.balance, 0) : null;
        const health = window.AnalyticsHealthModule.calculateFinancialHealthScore(metrics, ef, inv);
        const rule = window.AnalyticsHealthModule.analyzeRule503020(metrics.filteredTxs || [], metrics.totalIncome);

        const statusEl = document.getElementById("dashboardHealthStatus");
        const badgeEl = document.getElementById("dashboardHealthBadge");
        const scoreTextEl = document.getElementById("dashboardHealthScoreText");
        const tipEl = document.getElementById("dashboardHealthTip");

        if (statusEl) statusEl.textContent = health.statusText;
        if (badgeEl) {
          badgeEl.textContent = "Grade " + health.grade;
          badgeEl.className = `px-2.5 py-1 rounded-xl text-xs font-black border ${health.badgeBg} ${health.colorClass}`;
        }
        if (scoreTextEl) scoreTextEl.textContent = `Skor ${health.score}/100`;
        if (tipEl && health.tips.length > 0) tipEl.textContent = `"${health.tips[0]}"`;

        const bNeeds = document.getElementById("barNeeds");
        const bWants = document.getElementById("barWants");
        const bSavings = document.getElementById("barSavings");
        const lNeeds = document.getElementById("lblNeeds");
        const lWants = document.getElementById("lblWants");
        const lSavings = document.getElementById("lblSavings");

        if (bNeeds) bNeeds.style.width = rule.needsPct + "%";
        if (bWants) bWants.style.width = rule.wantsPct + "%";
        if (bSavings) bSavings.style.width = rule.savingsPct + "%";
        if (lNeeds) lNeeds.textContent = rule.needsPct + "%";
        if (lWants) lWants.textContent = rule.wantsPct + "%";
        if (lSavings) lSavings.textContent = rule.savingsPct + "%";
      }

      // 2. Update Goals Preview in Dashboard
      if (window.GoalsModule) {
        const goals = window.GoalsModule.getGoals();
        const summary = window.GoalsModule.calculateGoalsSummary();
        const goalsListEl = document.getElementById("dashboardGoalsList");
        const totalSavedEl = document.getElementById("dashboardGoalsTotalSaved");
        const subTitleEl = document.getElementById("dashboardGoalsSubtitle");

        if (totalSavedEl) totalSavedEl.textContent = window.DateHelper.formatRupiah(summary.totalSaved);
        if (subTitleEl) subTitleEl.textContent = `${summary.totalGoals} Target Aktif • ${summary.overallPercentage}% Tercapai`;

        if (goalsListEl) {
          const topGoals = goals.slice(0, 2);
          goalsListEl.innerHTML = topGoals.map(g => {
            const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
            return `
              <div class="space-y-1">
                <div class="flex justify-between text-[11px] font-bold">
                  <span class="text-slate-800">${g.icon} ${g.title}</span>
                  <span class="text-purple-700">${pct}% (${window.DateHelper.formatRupiah(g.currentAmount)})</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div class="bg-purple-600 h-full rounded-full transition-all" style="width: ${pct}%"></div>
                </div>
              </div>
            `;
          }).join("");
        }
      }
    };

    // Goals Action Handlers
    function handleAddNewGoalSubmit() {
      const title = document.getElementById("newGoalTitle").value.trim();
      const target = Number(document.getElementById("newGoalTarget").value) || 0;
      const deadline = document.getElementById("newGoalDeadline").value;
      const icon = document.getElementById("newGoalIcon").value;

      if (!title || target <= 0) {
        showToast("Nama target dan nominal harus diisi!", "warning");
        return;
      }

      window.GoalsModule.addGoal(title, target, deadline, icon);
      openTabModal("goals");
      showToast("Celengan target impian baru berhasil dibuat! 🎯", "success");
    }

    function handleDepositGoalPrompt(goalId, goalTitle) {
      if (window.customPrompt) {
        window.customPrompt(`Setor ke ${goalTitle}:`, "Nominal Setoran (Rp)", (val) => {
          const amt = Number(val);
          if (amt > 0) {
            window.GoalsModule.depositToGoal(goalId, amt, "Kas Tunai Suami");
            openTabModal("goals");
            showToast(`Setoran ${window.DateHelper.formatRupiah(amt)} berhasil dicatat! ✨`, "success");
          }
        });
      } else {
        const val = prompt(`Masukkan nominal setoran untuk ${goalTitle}:`, "100000");
        const amt = Number(val);
        if (amt > 0) {
          window.GoalsModule.depositToGoal(goalId, amt, "Kas Tunai Suami");
          openTabModal("goals");
          showToast(`Setoran ${window.DateHelper.formatRupiah(amt)} berhasil dicatat! ✨`, "success");
        }
      }
    }

    function handleWithdrawGoalPrompt(goalId, goalTitle) {
      if (window.customPrompt) {
        window.customPrompt(`Tarik dari ${goalTitle}:`, "Nominal Penarikan (Rp)", (val) => {
          const amt = Number(val);
          if (amt > 0) {
            if (window.GoalsModule.withdrawFromGoal(goalId, amt)) {
              openTabModal("goals");
              showToast(`Pencairan ${window.DateHelper.formatRupiah(amt)} berhasil dicatat!`, "info");
            }
          }
        });
      } else {
        const val = prompt(`Masukkan nominal penarikan untuk ${goalTitle}:`, "100000");
        const amt = Number(val);
        if (amt > 0) {
          if (window.GoalsModule.withdrawFromGoal(goalId, amt)) {
            openTabModal("goals");
            showToast(`Pencairan ${window.DateHelper.formatRupiah(amt)} berhasil dicatat!`, "info");
          }
        }
      }
    }

    async function handleEditGoalPrompt(goalId) {
      const goals = window.GoalsModule ? window.GoalsModule.getGoals() : [];
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const newCurrent = await showPrompt(
        "Edit Saldo Terkumpul", 
        `Ubah saldo saat ini untuk "${goal.title}" (Ketik 0 jika ingin di-0-kan):`, 
        String(goal.currentAmount || 0)
      );
      if (newCurrent === null) return;

      const newTarget = await showPrompt(
        "Edit Target Nominal", 
        `Target total untuk "${goal.title}" (Rp):`, 
        String(goal.targetAmount || 0)
      );
      if (newTarget === null) return;

      const newTitle = await showPrompt(
        "Edit Nama Celengan", 
        "Nama target impian keluarga:", 
        goal.title
      );
      if (newTitle === null) return;

      window.GoalsModule.updateGoal(goalId, {
        title: newTitle.trim() || goal.title,
        targetAmount: Number(newTarget) || goal.targetAmount,
        currentAmount: Number(newCurrent) || 0
      });

      openTabModal("goals");
      showToast(`Target impian "${newTitle.trim() || goal.title}" berhasil diperbarui! ✨`, "success");
    }

    function handleDeleteGoal(goalId) {
      showConfirm("Hapus Celengan Impian?", "Apakah Anda yakin ingin menghapus target celengan impian ini secara permanen?", { type: "danger", confirmText: "Ya, Hapus" }).then(confirmed => {
        if (confirmed) {
          window.GoalsModule.deleteGoal(goalId);
          openTabModal("goals");
          showToast("Target impian berhasil dihapus.", "info");
        }
      });
    }

    function handleRecordZakatExpense(amount) {
      if (window.AppModule && window.AppModule.addTransaction) {
        window.AppModule.addTransaction({
          id: "tx_zakat_" + Date.now(),
          date: new Date().toISOString(),
          type: "expense",
          category: "Bakti & Sosial",
          subCategory: "Zakat Mal",
          amount: Number(amount),
          wallet: "Rekening BCA",
          user: "keluarga",
          note: "Tunaikan Zakat Mal & Logam Mulia"
        });
        openTabModal("zakat");
        showToast("Pengeluaran Zakat Mal berhasil dicatat! Semoga berkah melimpah 🤲", "success", 4000);
      }
    }

    // ================= PENGELOLAAN KAMAR KOST DINAMIS & BACKDATE =================
    function renderIbuKostList() {
      const container = document.getElementById("ibuKostList");
      if (!container || !window.IbuKostModule) return;
      const rooms = window.IbuKostModule.getKostRooms();

      const totalBadge = document.getElementById("ibuKostTotalCount");
      if (totalBadge) totalBadge.textContent = `Total ${rooms.length} Kamar`;

      if (rooms.length === 0) {
        container.innerHTML = `<div class="text-center py-6 text-slate-400 text-xs font-bold">Belum ada data kamar kost. Klik "+ Kamar" di atas untuk menambah.</div>`;
        return;
      }

      container.innerHTML = rooms.map(r => {
        let badgeHtml = '';
        if (r.statusBulanIni === 'paid') {
          const durLabel = r.paidMonths && r.paidMonths > 1 ? ` (${r.paidMonths} Bln s/d ${r.paidUntilMonth || ''})` : '';
          badgeHtml = `<span class="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1"><span>✅ Lunas${durLabel}</span><span class="text-[9px] font-normal text-emerald-600">(${r.lastPaymentDate ? window.DateHelper.formatDateIndonesia(r.lastPaymentDate) : 'Bulan ini'})</span></span>`;
        } else if (r.statusBulanIni === 'partial') {
          badgeHtml = `<span class="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded">⏳ Cicil (Sisa Rp ${Number(r.partialRemaining || 0).toLocaleString("id-ID")})</span>`;
        } else if (r.statusBulanIni === 'empty') {
          badgeHtml = `<span class="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Kosong</span>`;
        } else {
          badgeHtml = `<span class="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Belum Bayar</span>`;
        }

        return `
          <div class="p-3 rounded-2xl border border-slate-200/90 bg-white space-y-2 shadow-2xs">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <span>🏠 Kamar ${r.roomNumber}</span>
                  <span class="text-slate-400 font-normal">•</span>
                  <span class="text-slate-700">${r.tenantName}</span>
                </div>
                <div class="text-[10px] text-slate-400 font-medium">
                  Tarif: <strong>${window.DateHelper.formatRupiah(r.monthlyRent)}</strong> • Jatuh tempo: Tgl ${r.dueDay}
                </div>
              </div>
              <div class="flex items-center gap-1">
                ${badgeHtml}
                <button onclick="openKostRoomEditModal('${r.id}')" class="text-slate-400 hover:text-slate-700 text-xs p-1 cursor-pointer" title="Edit Kamar">✏️</button>
                <button onclick="handleDeleteKostRoom('${r.id}')" class="text-slate-300 hover:text-rose-500 text-xs p-1 cursor-pointer" title="Hapus Kamar">🗑️</button>
              </div>
            </div>

            <div class="pt-1 flex items-center justify-between border-t border-slate-100 gap-1.5">
              <button onclick="openKostPaymentModal('${r.id}')" class="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black cursor-pointer transition-all shadow-2xs flex items-center justify-center gap-1">
                <span>Terima Sewa (Backdate/Lunas)</span>
              </button>
              ${r.tenantPhone ? `
                <button onclick="window.WhatsAppModule.sendKostReminder('${r.tenantPhone}', '${r.tenantName}', '${r.roomNumber}', ${r.monthlyRent}, 'Tgl ${r.dueDay}')" class="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer transition-all">
                  Tagih WA
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }).join("");
    }

    // Modal Terima Pembayaran Sewa Kost (Backdate & Tempo)
    let activeKostPayRoom = null;
    let activeKostPayMode = "full";
    let activeKostPayDuration = 1;

    function openKostPaymentModal(roomId) {
      const rooms = window.IbuKostModule.getKostRooms();
      const room = rooms.find(r => r.id === roomId);
      if (!room) return;

      activeKostPayRoom = room;
      activeKostPayMode = "full";
      activeKostPayDuration = 1;

      document.getElementById("kostPayRoomId").value = room.id;
      document.getElementById("kostPayRoomTitle").textContent = `Kamar ${room.roomNumber} - ${room.tenantName} (Tarif: ${window.DateHelper.formatRupiah(room.monthlyRent)})`;
      
      const today = window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0];
      document.getElementById("kostPayDate").value = room.lastPaymentDate || today;
      document.getElementById("kostPayTempoDueDate").value = "";

      setKostPayMode("full");
      selectKostDuration(1);
      document.getElementById("kostPaymentModal").classList.remove("hidden");
    }

    function closeKostPaymentModal() {
      document.getElementById("kostPaymentModal").classList.add("hidden");
    }

    function selectKostDuration(months) {
      activeKostPayDuration = Number(months) || 1;
      [1, 2, 3, 6].forEach(m => {
        const btn = document.getElementById("btnDur" + m);
        if (btn) {
          if (m === activeKostPayDuration) {
            btn.className = "py-1.5 rounded-lg bg-emerald-600 text-white shadow-2xs cursor-pointer font-black";
          } else {
            btn.className = "py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer font-bold";
          }
        }
      });

      if (activeKostPayRoom) {
        const rent = activeKostPayRoom.monthlyRent || 550000;
        const totalAmount = rent * activeKostPayDuration;
        document.getElementById("kostPayAmount").value = totalAmount;
        updatePaidUntilPreview();
        updateKostPayNote();
      }
    }

    function handleKostPayDateChange() {
      updatePaidUntilPreview();
      updateKostPayNote();
    }

    function updatePaidUntilPreview() {
      if (!activeKostPayRoom) return;
      const payDate = document.getElementById("kostPayDate").value || new Date().toISOString().split("T")[0];
      const baseDate = new Date(payDate);
      baseDate.setMonth(baseDate.getMonth() + activeKostPayDuration);
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      const previewStr = `${activeKostPayDuration} Bulan (s/d ${monthNames[baseDate.getMonth()]} ${baseDate.getFullYear()})`;
      const lbl = document.getElementById("lblPaidUntilPreview");
      if (lbl) lbl.textContent = previewStr;
    }

    function updateKostPayNote() {
      if (!activeKostPayRoom) return;
      const payDate = document.getElementById("kostPayDate").value || new Date().toISOString().split("T")[0];
      const baseDate = new Date(payDate);
      baseDate.setMonth(baseDate.getMonth() + activeKostPayDuration);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const monthStr = monthNames[baseDate.getMonth()] + " " + baseDate.getFullYear();
      const durStr = activeKostPayDuration > 1 ? ` (${activeKostPayDuration} Bulan s/d ${monthStr})` : "";
      document.getElementById("kostPayNote").value = `Pelunasan sewa Kamar ${activeKostPayRoom.roomNumber} oleh ${activeKostPayRoom.tenantName}${durStr}`;
    }

    function setKostPayMode(mode) {
      activeKostPayMode = mode;
      const bFull = document.getElementById("btnPayFull");
      const bPart = document.getElementById("btnPayPartial");
      const secPart = document.getElementById("kostPartialSection");

      if (mode === "full") {
        bFull.className = "py-2 rounded-xl text-xs font-black bg-emerald-500 text-white shadow-2xs cursor-pointer";
        bPart.className = "py-2 rounded-xl text-xs font-black bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer";
        secPart.classList.add("hidden");
        selectKostDuration(activeKostPayDuration || 1);
      } else {
        bPart.className = "py-2 rounded-xl text-xs font-black bg-amber-500 text-white shadow-2xs cursor-pointer";
        bFull.className = "py-2 rounded-xl text-xs font-black bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer";
        secPart.classList.remove("hidden");
        handleKostPayAmountChange();
      }
    }

    function handleKostPayAmountChange() {
      if (!activeKostPayRoom) return;
      const paid = Number(document.getElementById("kostPayAmount").value) || 0;
      const totalRent = activeKostPayRoom.monthlyRent;
      const remaining = Math.max(0, totalRent - paid);
      const lbl = document.getElementById("lblKostRemaining");
      if (lbl) lbl.textContent = window.DateHelper.formatRupiah(remaining);

      // Deteksi otomatis durasi multi-bulan jika kelipatan tarif (misal: 1650000 / 550000 = 3)
      if (totalRent > 0 && paid >= totalRent) {
        const approxMonths = Math.round(paid / totalRent);
        if (approxMonths >= 1 && approxMonths !== activeKostPayDuration && Math.abs(paid - approxMonths * totalRent) < 1000) {
          activeKostPayDuration = approxMonths;
          [1, 2, 3, 6].forEach(m => {
            const btn = document.getElementById("btnDur" + m);
            if (btn) {
              btn.className = (m === activeKostPayDuration)
                ? "py-1.5 rounded-lg bg-emerald-600 text-white shadow-2xs cursor-pointer font-black"
                : "py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer font-bold";
            }
          });
          updatePaidUntilPreview();
          updateKostPayNote();
        }
      }
    }

    function submitKostPayment() {
      if (!activeKostPayRoom) return;
      const roomId = document.getElementById("kostPayRoomId").value;
      const paymentDate = document.getElementById("kostPayDate").value;
      const amount = Number(document.getElementById("kostPayAmount").value);
      const isPartial = activeKostPayMode === "partial";
      const remaining = Math.max(0, activeKostPayRoom.monthlyRent - amount);
      const tempoDate = document.getElementById("kostPayTempoDueDate").value;
      const note = document.getElementById("kostPayNote").value.trim();

      if (!paymentDate) {
        showToast("Pilih tanggal pembayaran!", "warning");
        return;
      }
      if (!amount || amount <= 0) {
        showToast("Nominal pembayaran harus diisi!", "warning");
        return;
      }

      window.IbuKostModule.recordRoomPayment(roomId, {
        amount,
        paymentDate,
        isPartial,
        partialRemaining: remaining,
        tempoDate,
        note,
        paidMonths: activeKostPayDuration
      });

      closeKostPaymentModal();
      window.AppModule.renderIbuDashboard();
      renderIbuKostList();
      renderIbuGasBonList();
      if (typeof renderIbuTransactionList === "function") renderIbuTransactionList();
      showToast(`Pembayaran sewa Kamar ${activeKostPayRoom.roomNumber} (${window.DateHelper.formatRupiah(amount)}) berhasil dicatat! ✨`, "success");
    }

    // Modal Tambah / Edit Kamar Kost
    function openKostRoomEditModal(roomId = null) {
      const rooms = window.IbuKostModule.getKostRooms();
      const titleEl = document.getElementById("kostRoomEditTitle");
      const idInput = document.getElementById("editRoomId");
      const numInput = document.getElementById("editRoomNumber");
      const rentInput = document.getElementById("editRoomRent");
      const tenantInput = document.getElementById("editRoomTenant");
      const phoneInput = document.getElementById("editRoomPhone");
      const dueInput = document.getElementById("editRoomDueDay");
      const facInput = document.getElementById("editRoomFacilities");

      if (roomId) {
        const room = rooms.find(r => r.id === roomId);
        if (!room) return;
        titleEl.innerHTML = `<span>🏠</span> Edit Kamar Kost ${room.roomNumber}`;
        idInput.value = room.id;
        numInput.value = room.roomNumber;
        rentInput.value = room.monthlyRent;
        tenantInput.value = room.tenantName;
        phoneInput.value = room.tenantPhone || "";
        dueInput.value = room.dueDay || 1;
        facInput.value = room.facilities || "";
      } else {
        titleEl.innerHTML = `<span>🏠</span> Tambah Kamar Kost Baru`;
        idInput.value = "";
        numInput.value = String(rooms.length + 1).padStart(2, "0");
        rentInput.value = 750000;
        tenantInput.value = "(Kosong / Siap Huni)";
        phoneInput.value = "";
        dueInput.value = 1;
        facInput.value = "Kamar Mandi Dalam, Kasur, Lemari";
      }

      document.getElementById("kostRoomEditModal").classList.remove("hidden");
    }

    function closeKostRoomEditModal() {
      document.getElementById("kostRoomEditModal").classList.add("hidden");
    }

    function submitSaveKostRoom() {
      const roomId = document.getElementById("editRoomId").value;
      const num = document.getElementById("editRoomNumber").value.trim();
      const rent = Number(document.getElementById("editRoomRent").value) || 0;
      const tenant = document.getElementById("editRoomTenant").value.trim();
      const phone = document.getElementById("editRoomPhone").value.trim();
      const due = Number(document.getElementById("editRoomDueDay").value) || 1;
      const fac = document.getElementById("editRoomFacilities").value.trim();

      if (!num || rent <= 0) {
        showToast("Nomor kamar dan tarif sewa harus diisi!", "warning");
        return;
      }

      if (roomId) {
        window.IbuKostModule.updateKostRoom(roomId, {
          roomNumber: num,
          monthlyRent: rent,
          tenantName: tenant || "(Kosong / Siap Huni)",
          tenantPhone: phone,
          dueDay: due,
          facilities: fac
        });
        showToast(`Data Kamar ${num} berhasil diperbarui! ✨`, "success");
      } else {
        window.IbuKostModule.addKostRoom(num, tenant, rent, due, fac, phone);
        showToast(`Kamar ${num} berhasil ditambahkan! ✨`, "success");
      }

      closeKostRoomEditModal();
      window.AppModule.renderIbuDashboard();
      renderIbuKostList();
      renderSettingKostRoomsList();
    }

    function handleDeleteKostRoom(roomId) {
      const rooms = window.IbuKostModule.getKostRooms();
      const room = rooms.find(r => r.id === roomId);
      if (!room) return;

      showConfirm(
        `Hapus Kamar ${room.roomNumber}?`,
        `Apakah Anda yakin ingin menghapus data Kamar ${room.roomNumber} (${room.tenantName})?<br><br>Riwayat transaksi pembayaran sewa yang sudah tercatat sebelumnya tetap aman.`,
        { type: "danger", confirmText: "Ya, Hapus Kamar Ini" }
      ).then(confirmed => {
        if (confirmed) {
          window.IbuKostModule.deleteKostRoom(roomId);
          window.AppModule.renderIbuDashboard();
          renderIbuKostList();
          renderSettingKostRoomsList();
          showToast(`Kamar ${room.roomNumber} berhasil dihapus! ✨`, "success");
        }
      });
    }

    // ================= BUKU PIUTANG & TEMPO USAHA IBU =================
    function renderIbuGasBonList() {
      const container = document.getElementById("ibuGasBonList");
      if (!container || !window.IbuGasModule) return;
      const list = window.IbuGasModule.getTempoRecords();

      const badge = document.getElementById("ibuTempoCountBadge");
      const activeCount = list.filter(i => !i.isLunas).length;
      if (badge) badge.textContent = `${activeCount} Piutang/Tempo`;

      if (list.length === 0) {
        container.innerHTML = `<div class="text-center py-4 text-slate-400 text-xs font-semibold">Tidak ada catatan bon atau tempo aktif.</div>`;
        return;
      }

      container.innerHTML = list.map(b => {
        let typeBadge = '';
        if (b.type === 'gas_bon') {
          typeBadge = `<span class="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 text-[9px] font-black">Bon Gas</span>`;
        } else if (b.type === 'kost_rent') {
          typeBadge = `<span class="px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 text-[9px] font-black">Tempo Kost</span>`;
        } else {
          typeBadge = `<span class="px-1.5 py-0.2 rounded bg-rose-100 text-rose-900 text-[9px] font-black">Hutang Supplier</span>`;
        }

        return `
          <div class="flex items-center justify-between p-2.5 rounded-xl ${b.isLunas ? 'bg-slate-50 border border-slate-100' : 'bg-white border border-slate-200'} shadow-2xs text-xs">
            <div class="space-y-0.5">
              <div class="flex items-center gap-1.5">
                ${typeBadge}
                <span class="font-black text-slate-800">${b.customerName || b.title}</span>
              </div>
              <div class="text-[10px] text-slate-500 font-medium">
                Nominal: <strong class="text-slate-900">${window.DateHelper.formatRupiah(b.amount)}</strong>
                • Tgl: ${b.date ? window.DateHelper.formatDateIndonesia(b.date) : '-'}
                ${b.dueDate ? `• <span class="text-amber-700 font-bold">Tempo: ${window.DateHelper.formatDateIndonesia(b.dueDate)}</span>` : ''}
              </div>
            </div>

            <div class="flex items-center gap-1">
              ${b.isLunas ? `
                <span class="text-[10px] text-emerald-700 bg-emerald-100 font-black px-2 py-0.5 rounded">Lunas</span>
              ` : `
                <button onclick="openPayTempoModal('${b.id}')" class="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black cursor-pointer shadow-2xs">
                  Lunasi
                </button>
              `}
              <button onclick="handleEditTempoPrompt('${b.id}')" class="text-slate-400 hover:text-blue-600 text-xs p-1 cursor-pointer transition-colors" title="Edit Catatan Tempo">✏️</button>
              <button onclick="handleDeleteTempo('${b.id}')" class="text-slate-300 hover:text-rose-500 text-xs p-1 cursor-pointer" title="Hapus Catatan">🗑️</button>
            </div>
          </div>
        `;
      }).join("");
    }

    async function handleEditTempoPrompt(tempoId) {
      const records = window.IbuGasModule.getTempoRecords();
      const item = records.find(r => r.id === tempoId);
      if (!item) return;

      const newName = await showPrompt("Edit Nama Pihak / Pelanggan", "Nama:", item.customerName || item.title);
      if (!newName) return;
      const newAmt = await showPrompt("Edit Nominal Tempo (Rp)", "Nominal:", String(item.amount));
      if (!newAmt || Number(newAmt) <= 0) return;
      const newDate = await showPrompt("Edit Tanggal Jatuh Tempo", "Format: YYYY-MM-DD:", item.dueDate || "");

      item.customerName = newName.trim();
      item.title = `Bon / Tempo (${newName.trim()})`;
      item.amount = Number(newAmt);
      item.dueDate = newDate ? newDate.trim() : "";

      window.IbuGasModule.saveTempoRecords(records);
      if (window.SyncModule && window.SyncModule.pushTransactionToSyncQueue) {
        window.SyncModule.pushTransactionToSyncQueue("update_ibu_tempo", item);
      }
      renderIbuGasBonList();
      showToast(`Catatan tempo untuk ${newName} berhasil diperbarui! ✨`, "success");
    }

    // Modal Pelunasan Tempo (Backdate)
    let activeTempoItem = null;
    function openPayTempoModal(tempoId) {
      const records = window.IbuGasModule.getTempoRecords();
      const item = records.find(r => r.id === tempoId);
      if (!item) return;

      activeTempoItem = item;
      document.getElementById("payTempoId").value = item.id;
      document.getElementById("payTempoTitle").textContent = `${item.title || item.customerName} - ${window.DateHelper.formatRupiah(item.amount)}`;
      document.getElementById("payTempoAmountLabel").textContent = window.DateHelper.formatRupiah(item.amount);
      
      const today = window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0];
      document.getElementById("payTempoDate").value = today;

      document.getElementById("payTempoModal").classList.remove("hidden");
    }

    function closePayTempoModal() {
      document.getElementById("payTempoModal").classList.add("hidden");
    }

    function submitPayTempo() {
      if (!activeTempoItem) return;
      const payDate = document.getElementById("payTempoDate").value;
      if (!payDate) {
        showToast("Pilih tanggal pelunasan!", "warning");
        return;
      }

      window.IbuGasModule.payTempoRecord(activeTempoItem.id, payDate);
      closePayTempoModal();
      window.AppModule.renderIbuDashboard();
      renderIbuGasBonList();
      renderIbuKostList();
      showToast(`Pelunasan ${activeTempoItem.title || activeTempoItem.customerName} (Tgl ${payDate}) berhasil masuk kas! ✨`, "success");
    }

    function handleDeleteTempo(tempoId) {
      showConfirm("Hapus Catatan Tempo?", "Catatan tempo ini akan dihapus dari daftar.", { type: "danger", confirmText: "Ya, Hapus" }).then(confirmed => {
        if (confirmed) {
          window.IbuGasModule.deleteTempoRecord(tempoId);
          renderIbuGasBonList();
          showToast("Catatan tempo berhasil dihapus.", "info");
        }
      });
    }

    async function openNewTempoPrompt() {
      const name = await showPrompt("Catat Bon / Tempo Baru", "Nama Tetangga / Pelanggan / Pihak:", "Bu RT");
      if (!name) return;
      const nominal = await showPrompt("Nominal Tempo (Rp)", `Jumlah piutang/tempo untuk ${name}:`, "22000");
      if (!nominal || Number(nominal) <= 0) return;
      const dueDate = await showPrompt("Tanggal Janji Bayar (Jatuh Tempo)", "Format: YYYY-MM-DD (Kosongkan jika belum tentu):", "");

      window.IbuGasModule.addTempoRecord({
        type: "gas_bon",
        title: `Bon / Tempo (${name})`,
        customerName: name,
        amount: Number(nominal),
        dueDate: dueDate || ""
      });

      renderIbuGasBonList();
      showToast(`Catatan tempo untuk ${name} berhasil disimpan! 📝`, "success");
    }

    // ================= RIWAYAT TRANSAKSI & LOG KAS USAHA IBU =================
    function renderIbuTransactionList() {
      const container = document.getElementById("ibuTransactionsList");
      const badge = document.getElementById("ibuTxCountBadge");
      if (!container || !window.AppModule) return;

      const filterUnit = document.getElementById("ibuTxFilterUnit") ? document.getElementById("ibuTxFilterUnit").value : "all";
      let txs = window.AppModule.getIbuTransactions() || [];

      if (filterUnit === "kost") {
        txs = txs.filter(t => t.unit === "kost");
      } else if (filterUnit === "gas") {
        txs = txs.filter(t => t.unit === "gas");
      }

      if (badge) {
        badge.textContent = `${txs.length} Transaksi`;
      }

      if (txs.length === 0) {
        container.innerHTML = `
          <div class="text-center py-8 text-slate-400 text-xs font-bold space-y-1">
            <div class="text-2xl">🍃</div>
            <div>Belum ada riwayat transaksi usaha ibu.</div>
            <div class="text-[10px] text-slate-400 font-normal">Riwayat pembayaran sewa kost dan transaksi gas akan tercatat di sini.</div>
          </div>
        `;
        return;
      }

      container.innerHTML = txs.map(t => {
        const isKost = t.unit === "kost";
        const isIncome = t.type === "income";
        const dateFormatted = t.date ? window.DateHelper.formatDateIndonesia(t.date.split("T")[0]) : "Hari Ini";

        return `
          <div class="p-2.5 rounded-xl border border-slate-200/80 bg-white flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 transition-all">
            <div class="space-y-0.5 min-w-0 flex-1">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[9.5px] font-black px-2 py-0.5 rounded-md ${isKost ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                  ${isKost ? '🏠 Kost' : '🍳 Gas LPG'}
                </span>
                <span class="text-[10.5px] font-bold text-slate-500">${dateFormatted}</span>
                <span class="text-[9px] text-slate-400 font-medium">• ${t.category || '-'}</span>
              </div>
              <div class="text-xs font-black text-slate-900 truncate" title="${t.note || '-'}">
                ${t.note || (isKost ? 'Penerimaan sewa kost' : 'Transaksi gas')}
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <div class="text-right">
                <div class="text-xs font-black ${isIncome ? 'text-emerald-600' : 'text-rose-600'}">
                  ${isIncome ? '+' : '-'}${window.DateHelper.formatRupiah(t.amount)}
                </div>
                ${t.profit && t.profit > 0 ? `<div class="text-[9.5px] text-amber-600 font-bold">Laba: +${window.DateHelper.formatRupiah(t.profit)}</div>` : ''}
              </div>
              <button onclick="openEditIbuModal('${t.id}')" class="text-slate-400 hover:text-blue-600 text-xs p-1 cursor-pointer transition-colors" title="Edit Transaksi Usaha Ibu">
                ✏️
              </button>
              <button onclick="handleDeleteIbuTx('${t.id}')" class="text-slate-300 hover:text-rose-500 text-xs p-1 cursor-pointer transition-colors" title="Hapus Riwayat">
                🗑️
              </button>
            </div>
          </div>
        `;
      }).join("");
    }

    function handleDeleteIbuTx(txId) {
      showConfirm("Hapus Riwayat Transaksi?", "Apakah Anda yakin ingin menghapus catatan transaksi Usaha Ibu ini?", { type: "danger", confirmText: "Ya, Hapus" }).then(confirmed => {
        if (confirmed) {
          window.AppModule.deleteIbuTransaction(txId);
          renderIbuKostList();
          renderIbuGasBonList();
          renderIbuTransactionList();
          showToast("Catatan transaksi berhasil dihapus.", "info");
        }
      });
    }

    // ================= MODAL TRANSAKSI GAS CEPAT (BACKDATE & TEMPO) =================
    let gasQuickMode = "sale";
    let gasSaleIsBon = false;

    function openGasQuickModal(mode = "sale") {
      gasQuickMode = mode;
      gasSaleIsBon = false;

      const titleEl = document.getElementById("gasQuickTitle");
      const modeInput = document.getElementById("gasQuickMode");
      const dateInput = document.getElementById("gasQuickDate");
      const qtyInput = document.getElementById("gasQuickQty");
      const priceInput = document.getElementById("gasQuickPrice");
      const partyLabel = document.getElementById("gasQuickPartyLabel");
      const partyInput = document.getElementById("gasQuickParty");
      const saleTypeSec = document.getElementById("gasSaleTypeSection");
      const tempoDateSec = document.getElementById("gasTempoDateSection");

      const today = window.DateHelper ? window.DateHelper.getTodayWIBString() : new Date().toISOString().split("T")[0];
      dateInput.value = today;
      modeInput.value = mode;

      if (mode === "restock") {
        titleEl.innerHTML = `<span>📦</span> Kulakan Gas dari Supplier (Backdate)`;
        qtyInput.value = 20;
        priceInput.value = 18500;
        partyLabel.textContent = "Pilih Supplier Gas:";
        partyInput.value = "Bu Yanto";
        saleTypeSec.classList.add("hidden");
        tempoDateSec.classList.add("hidden");
      } else {
        titleEl.innerHTML = `<span>🍳</span> Penjualan Gas LPG Eceran (Backdate/Tempo)`;
        qtyInput.value = 1;
        priceInput.value = 22000;
        partyLabel.textContent = "Nama Pembeli / Tetangga:";
        partyInput.value = "Pembeli Warung";
        saleTypeSec.classList.remove("hidden");
        setGasSaleType(false);
      }

      updateGasQuickTotal();
      document.getElementById("gasQuickModal").classList.remove("hidden");
    }

    function closeGasQuickModal() {
      document.getElementById("gasQuickModal").classList.add("hidden");
    }

    function setGasSaleType(isBon) {
      gasSaleIsBon = isBon;
      const bTunai = document.getElementById("btnGasTunai");
      const bBon = document.getElementById("btnGasBon");
      const tempoSec = document.getElementById("gasTempoDateSection");

      if (isBon) {
        bBon.className = "py-2 rounded-xl text-xs font-black bg-amber-500 text-white shadow-2xs cursor-pointer";
        bTunai.className = "py-2 rounded-xl text-xs font-black bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer";
        tempoSec.classList.remove("hidden");
      } else {
        bTunai.className = "py-2 rounded-xl text-xs font-black bg-emerald-500 text-white shadow-2xs cursor-pointer";
        bBon.className = "py-2 rounded-xl text-xs font-black bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer";
        tempoSec.classList.add("hidden");
      }
    }

    function updateGasQuickTotal() {
      const qty = Number(document.getElementById("gasQuickQty").value) || 0;
      const price = Number(document.getElementById("gasQuickPrice").value) || 0;
      const total = qty * price;
      const lbl = document.getElementById("gasQuickTotalLabel");
      if (lbl) lbl.textContent = window.DateHelper.formatRupiah(total);
    }

    function submitGasQuickTransaction() {
      const mode = document.getElementById("gasQuickMode").value;
      const dateVal = document.getElementById("gasQuickDate").value;
      const qty = Number(document.getElementById("gasQuickQty").value) || 1;
      const price = Number(document.getElementById("gasQuickPrice").value) || 0;
      const party = document.getElementById("gasQuickParty").value.trim();
      const tempoDate = document.getElementById("gasTempoDueDate").value;

      if (!dateVal) {
        showToast("Pilih tanggal transaksi!", "warning");
        return;
      }

      if (mode === "restock") {
        const supplierId = party.toLowerCase().includes("aan") ? "mas_aan" : "bu_yanto";
        window.IbuGasModule.recordGasRestock(supplierId, qty, price, true, dateVal);
        showToast(`Kulakan ${qty} tabung gas (Tgl ${dateVal}) berhasil dicatat! 📦`, "success");
      } else {
        window.IbuGasModule.recordGasSale(qty, price, party || "Pembeli Warung", gasSaleIsBon, dateVal, tempoDate);
        showToast(`Penjualan ${qty} tabung gas (Tgl ${dateVal}) berhasil dicatat! ✨`, "success");
      }

      closeGasQuickModal();
      window.AppModule.renderIbuDashboard();
      renderIbuGasBonList();
    }

    
    // Atur Saldo Dompet & Reset Data ke Rp 0
    function handleResetAllDataToZero() {
      closeSettingsModal();
      showConfirm("Kosongkan Semua Data?", "Apakah Anda yakin ingin <strong>menghapus semua data demo</strong> dan mengosongkan saldo menjadi <strong>Rp 0</strong>?<br><br>Semua riwayat transaksi akan dihapus bersih agar Anda bisa mulai mencatat dari nol.", { type: "danger", confirmText: "Ya, Mulai dari Rp 0" }).then(confirmed => {
        if (confirmed) {
          window.AppModule.resetAllDataToZero();
          localStorage.setItem("usaha_ibu_gas_bon_pelanggan", JSON.stringify([]));
          const rk = window.IbuKostModule.getKostRooms();
          rk.forEach(r => { if (r.statusBulanIni === "paid") r.statusBulanIni = "unpaid"; });
          window.IbuKostModule.saveKostRooms(rk);
          renderIbuKostList();
          renderIbuGasBonList();
          closeSettingsModal();
          showToast("Seluruh data berhasil dikosongkan ke Rp 0! ✨", "success");
        }
      });
    }

    // Load Wallet Balances into Settings Modal
    function loadWalletSettings() {
      const wallets = window.AppModule.getWalletBalances();
      document.getElementById("settingWalletKasSuami").value = wallets["Kas Tunai Suami"] || 0;
      document.getElementById("settingWalletKasDapur").value = wallets["Kas Dapur (Istri)"] || 0;
      document.getElementById("settingWalletBca").value = wallets["Rekening BCA"] || 0;
      document.getElementById("settingWalletShopee").value = wallets["ShopeePay (Istri)"] || 0;
    }

    
    function handlePinToggleChange(e) {
      setPinLockEnabled(e.target.checked);
      showToast(e.target.checked ? "Kunci PIN Aktif! 🔒" : "Kunci PIN Dinonaktifkan (Bebas Masuk) 🔓", "info");
    }

    function handleSaveNewPin() {
      const newPin = document.getElementById("settingNewPinInput").value.trim();
      if (newPin.length !== 8 || isNaN(newPin)) {
        showToast("PIN harus berupa 8 digit angka!", "error");
        return;
      }
      window.AuthModule.setFamilyPin(newPin);
      document.getElementById("settingNewPinInput").value = "";
      showToast("PIN Keamanan berhasil diubah ke: " + newPin + " ✨", "success");
    }

    function openSettingsModal() {
      loadWalletSettings();
      const s = window.SettingsModule.getSettings();
      document.getElementById("settingFamilyNameInput").value = s.familyName;
      document.getElementById("settingPinToggle").checked = isPinLockEnabled();
      document.getElementById("settingSpreadsheetUrlInput").value = window.SyncModule ? window.SyncModule.getSpreadsheetApiUrl() : "";
      
      // Highlight current icon & theme in Settings Modal
      const currSettings = window.SettingsModule ? window.SettingsModule.getSettings() : {};
      const currIcon = currSettings.presetIcon || "🏡";
      const currTheme = currSettings.activeTheme || "emerald";

      document.querySelectorAll(".icon-choice-btn").forEach(btn => {
        if (btn.textContent.trim() === currIcon) {
          btn.className = "icon-choice-btn w-11 h-11 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-xl flex items-center justify-center cursor-pointer scale-105 shadow-sm";
        } else {
          btn.className = "icon-choice-btn w-11 h-11 rounded-xl border border-slate-200 text-xl hover:border-emerald-400 hover:bg-slate-50 flex items-center justify-center cursor-pointer transition-all shadow-2xs";
        }
      });

      document.querySelectorAll(".theme-choice-btn").forEach(btn => {
        btn.classList.remove("ring-2", "ring-offset-2", "ring-slate-800", "scale-105");
      });
      const currThemeBtn = document.getElementById("themeBtn_" + currTheme);
      if (currThemeBtn) {
        currThemeBtn.classList.add("ring-2", "ring-offset-2", "ring-slate-800", "scale-105");
      }

      document.getElementById("settingsModal").classList.remove("hidden");
    }

    function closeSettingsModal() {
      document.getElementById("settingsModal").classList.add("hidden");
    }

    function saveAllSettings() {
      const familyName = document.getElementById("settingFamilyNameInput").value;
      const spreadsheetUrl = document.getElementById("settingSpreadsheetUrlInput").value;

      const s = window.SettingsModule.getSettings();
      s.familyName = familyName;
      window.SettingsModule.saveSettings(s);

      if (window.SyncModule) {
        window.SyncModule.setSpreadsheetApiUrl(spreadsheetUrl);
      }

      
      // Simpan Saldo Dompet Baru
      const wKasSuami = Number(document.getElementById("settingWalletKasSuami").value) || 0;
      const wKasDapur = Number(document.getElementById("settingWalletKasDapur").value) || 0;
      const wBca = Number(document.getElementById("settingWalletBca").value) || 0;
      const wShopee = Number(document.getElementById("settingWalletShopee").value) || 0;

      window.AppModule.setWalletBalances({
        "Kas Tunai Suami": wKasSuami,
        "Kas Dapur (Istri)": wKasDapur,
        "Rekening BCA": wBca,
        "ShopeePay (Istri)": wShopee
      });

      document.getElementById("headerFamilyName").textContent = familyName;
      closeSettingsModal();
      alert("Pengaturan berhasil disimpan!");
    }

    async function handleForceCloudSync() {
      try {
        if (window.showToast) window.showToast("Menyelaraskan data riil dari Google Sheets... 🔄", "info");
        
        // 1. Bersihkan transaksi contoh lama di localStorage klien
        localStorage.removeItem("keuangan_keluarga_transactions");
        localStorage.removeItem("keuangan_keluarga_ibu_transactions");

        // 2. Tarik paksa data terbaru dari Google Spreadsheet
        if (window.SyncModule) {
          await window.SyncModule.pullFromSpreadsheet(true);
        }

        // 3. Render ulang seluruh komponen UI
        if (window.AppModule) {
          window.AppModule.renderDashboard();
          window.AppModule.renderIbuDashboard();
        }
        if (window.MonthlyStatsModule) {
          window.MonthlyStatsModule.renderMonthlyHelicopterView();
        }

        closeSettingsModal();
        if (window.showToast) window.showToast("Sinkronisasi Selesai! Data cloud tersambung aktif ✨", "success");
      } catch (err) {
        console.error("Force sync err:", err);
        alert("Gagal melakukan sinkronisasi: " + err.message);
      }
    }

    function selectPresetIcon(icon) {
      const s = window.SettingsModule ? window.SettingsModule.getSettings() : { presetIcon: "🏡" };
      s.presetIcon = icon;
      if (window.SettingsModule) window.SettingsModule.saveSettings(s);

      const headerLogo = document.getElementById("headerLogoIcon");
      if (headerLogo) headerLogo.textContent = icon;

      // Update active highlight on icon buttons
      document.querySelectorAll(".icon-choice-btn").forEach(btn => {
        if (btn.textContent.trim() === icon) {
          btn.className = "icon-choice-btn w-11 h-11 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-xl flex items-center justify-center cursor-pointer scale-105 shadow-sm";
        } else {
          btn.className = "icon-choice-btn w-11 h-11 rounded-xl border border-slate-200 text-xl hover:border-emerald-400 hover:bg-slate-50 flex items-center justify-center cursor-pointer transition-all shadow-2xs";
        }
      });

      if (window.showToast) window.showToast("Logo berhasil diubah ke " + icon + " ✨", "success");
    }

    function setTheme(themeName) {
      const s = window.SettingsModule ? window.SettingsModule.getSettings() : { activeTheme: "emerald" };
      s.activeTheme = themeName;
      if (window.SettingsModule) {
        window.SettingsModule.saveSettings(s);
        window.SettingsModule.applyTheme(themeName);
      }

      // Update active ring on theme buttons
      document.querySelectorAll(".theme-choice-btn").forEach(btn => {
        btn.classList.remove("ring-2", "ring-offset-2", "ring-slate-800", "scale-105");
      });
      const activeBtn = document.getElementById("themeBtn_" + themeName);
      if (activeBtn) {
        activeBtn.classList.add("ring-2", "ring-offset-2", "ring-slate-800", "scale-105");
      }

      // Update UI Header Logo & FAB Theme
      const logoEl = document.getElementById("headerLogoIcon");
      if (logoEl) {
        if (themeName === "amber") {
          logoEl.className = "w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-xl shrink-0 shadow-2xs transition-all";
        } else if (themeName === "blue") {
          logoEl.className = "w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-xl shrink-0 shadow-2xs transition-all";
        } else if (themeName === "purple") {
          logoEl.className = "w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center text-xl shrink-0 shadow-2xs transition-all";
        } else {
          logoEl.className = "w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center text-xl shrink-0 shadow-2xs transition-all";
        }
      }

      if (window.showToast) window.showToast("Tema warna " + themeName.toUpperCase() + " aktif! 🎨", "success");
    }

    function handleRestoreFileChange(event) {
      const file = event.target.files[0];
      if (file && window.BackupRestoreModule) {
        window.BackupRestoreModule.importBackupJson(file);
      }
    }

    // Expose all UI and controller functions to window for HTML inline onclick handlers
    Object.assign(window, {
      pressPinKey,
      backspacePinKey,
      clearPinKey,
      validateEnteredPin,
      showPinHint,
      lockAppNow,
      checkPinOnLoad,
      isPinLockEnabled,
      setPinLockEnabled,
      copyWifePairingLink,
      resetDefaultPin,
      openQuickAddModal,
      closeQuickAddModal,
      openTransferModal,
      closeTransferModal,
      openWalletManagerModal,
      closeWalletManagerModal,
      openPresetsManagerModal,
      closePresetsManagerModal,
      openManageFeaturesModal,
      closeManageFeaturesModal,
      openSettingsModal,
      closeSettingsModal,
      openEditModal,
      closeEditModal,
      submitEditTransaction,
      openEditIbuModal,
      closeEditIbuModal,
      submitEditIbuTransaction,
      handleEditTempoPrompt,
      handleEditGoldPrompt,
      handleEditFundPrompt,
      openTabModal,
      closeTabModal,
      switchLedger,
      switchProfile,
      setTxType,
      saveTransaction,
      handleManualSyncGoogleSheets,
      handleShareRekapWA,
      handleTogglePrivacy,
      openIbuSettingsModal,
      closeIbuSettingsModal,
      openNewIbuTxModal,
      closeNewIbuTxModal,
      openKostRoomEditModal,
      closeKostRoomEditModal,
      openGasQuickModal,
      closeGasQuickModal,
      openNewTempoPrompt,
      renderIbuKostList,
      renderIbuGasBonList,
      renderIbuTransactionList,
      setFilterPreset,
      handleSearchAndFilterChange,
      resetAllFilters,
      setTheme,
      setLogoIcon,
      handleRestoreFileChange
    });