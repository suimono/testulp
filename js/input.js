// =================================================
// BAGIAN 5: FORM RENDERING & MANAGEMENT (input.js)
// =================================================

/**
 * Fungsi untuk merender form order baru atau form edit ke dalam DOM.
 * @param {number} formInstanceId - ID unik untuk instance form ini (bisa localIdCounter atau order.id).
 * @param {HTMLElement} targetContainer - Elemen DOM tempat form akan ditambahkan.
 * @param {Object} [orderDataToEdit=null] - Data order jika dalam mode edit.
 */
function renderOrderForm(formInstanceId, targetContainer, orderDataToEdit = null) {
    const noDynamicFormPlaceholder = document.getElementById('noDynamicFormPlaceholder');
    if (noDynamicFormPlaceholder) {
        noDynamicFormPlaceholder.style.display = 'none'; // Sembunyikan placeholder saat form dirender
    }

    // Fungsi helper untuk mendapatkan nilai dengan aman
    const getSafeValue = (data, field, defaultValue = '') => {
        return (data && data[field] !== undefined && data[field] !== null && data[field] !== '-') ? data[field] : defaultValue;
    };

    const isEditMode = orderDataToEdit !== null;
    const formTitle = isEditMode ? `Edit Order #${orderDataToEdit.id}` : `Form Order Baru`;
    const saveButtonText = isEditMode ? 'Update Order' : 'Simpan Order';
    const deleteButtonText = isEditMode ? 'Batalkan Edit' : 'Batalkan Form Ini';
    const deleteButtonClass = isEditMode ? 'cancel-edit-btn' : 'delete-form-btn';
    const dataIdAttribute = isEditMode ? `data-order-id="${orderDataToEdit.id}"` : `data-local-id="${formInstanceId}"`;

    const initialPbPdValue = getSafeValue(orderDataToEdit, 'pbPd', 'PB'); // Default to PB for new forms
    const initialStatusValue = getSafeValue(orderDataToEdit, 'status', ''); // Default to no selection for new forms
    
    // Perubahan: Menentukan nilai awal yang benar untuk Cover dan AMR / Modem.
    // Default-nya adalah 'Tidak' atau '' untuk memastikan tidak ada warna biru default.
    const initialCoverValue = getSafeValue(orderDataToEdit, 'cover', 'Tidak');
    const initialAmrModemValue = getSafeValue(orderDataToEdit, 'amrModem', 'Tidak');
    const initialCetakPkValue = getSafeValue(orderDataToEdit, 'cetakPk', 'Belum');

    // Determine initial display of Tarif Daya Lama/Baru based on PB/PD
    const tarifDayaLamaDisplay = (initialPbPdValue === 'PD') ? 'block' : 'none';
    const tarifDayaBaruDisplay = 'block'; // Always visible

    const formHtml = `
        <div class="dynamic-input-form bg-neutral-50 rounded-xl p-6 mb-6 shadow-md border border-neutral-200 animate-fadeIn relative transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg" ${dataIdAttribute}>
            <h3 class="text-xl font-semibold text-primary-600 mb-6 flex items-center gap-2">
                <i class="fas fa-file-invoice text-primary-500"></i> ${formTitle}
            </h3>
            <div class="form-grid-row grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div class="form-group">
                    <label for="nama-pelanggan-${formInstanceId}" class="block mb-2 text-neutral-700 font-medium text-sm">Nama Pelanggan <span class="text-red-500">*</span>:</label>
                    <input type="text" id="nama-pelanggan-${formInstanceId}" placeholder="Nama Pelanggan" value="${getSafeValue(orderDataToEdit, 'namaPelanggan')}" class="w-full p-3 border-2 border-neutral-200 rounded-lg text-base transition-all duration-200 bg-white text-neutral-800 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20" required>
                </div>
                <div class="form-group">
                    <label for="ulp-${formInstanceId}" class="block mb-2 text-neutral-700 font-medium text-sm">ULP <span class="text-red-500">*</span>:</label>
                    <select id="ulp-${formInstanceId}" class="choices-select w-full p-3 border-2 border-neutral-200 rounded-lg text-base transition-all duration-200 bg-white text-neutral-800 appearance-none focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20" required data-default-option-text="Pilih ULP">
                        <option value="">Pilih ULP</option>
                        ${(loadedOptions.ulp || []).map(option => `<option value="${option}" ${orderDataToEdit?.ulp === option ? 'selected' : ''}>${option}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="block mb-2 text-neutral-700 font-medium text-sm">PB/PD <span class="text-red-500">*</span>:</label>
                    <div class="radio-pill-group flex flex-wrap gap-2" id="pb-pd-radio-${formInstanceId}">
                    </div>
                    <input type="hidden" id="pb-pd-${formInstanceId}" value="${initialPbPdValue}">
                </div>
                
                <div class="form-group flex flex-col md:flex-row gap-4">
                    <div id="tarif-daya-lama-group-${formInstanceId}" class="flex-1" style="display: ${tarifDayaLamaDisplay};">
                        <label for="tarif-daya-lama-${formInstanceId}" class="block mb-2 text-neutral-700 font-medium text-sm">Tarif /Daya Lama(EX:R2/5500 VA):</label>
                        <input type="text" id="tarif-daya-lama-${formInstanceId}" placeholder="Contoh: R1 / 900 VA" value="${getSafeValue(orderDataToEdit, 'tarifDayaLama')}" class="w-full p-3 border-2 border-neutral-200 rounded-lg text-base transition-all duration-200 bg-white text-neutral-800 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20">
                    </div>
                    <div id="tarif-daya-baru-group-${formInstanceId}" class="flex-1" style="display: ${tarifDayaBaruDisplay};">
                        <label for="tarif-daya-baru-${formInstanceId}" class="block mb-2 text-neutral-700 font-medium text-sm">Tarif / Daya Baru <span class="text-red-500">*</span>:</label>
                        <input type="text" id="tarif-daya-baru-${formInstanceId}" placeholder="Pilih atau Ketik Tarif / Daya Baru" value="${getSafeValue(orderDataToEdit, 'tarifDayaBaru')}" list="tarifDayaList-${formInstanceId}" class="w-full p-3 border-2 border-neutral-200 rounded-lg text-base transition-all duration-200 bg-white text-neutral-800 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20" required>
                        <datalist id="tarifDayaList-${formInstanceId}">
                            ${(loadedOptions.tarifDaya || []).map(option => `<option value="${option}"></option>`).join('')}
                        </datalist>
                    </div>
                </div>

                <div class="form-group">
                    <label for="id-pelanggan-${formInstanceId}" class="block mb-2 text-neutral-700 font-medium text-sm">ID Pelanggan <span class="text-red-500">*</span>:</label>
                    <input type="number" id="id-pelanggan-${formInstanceId}" placeholder="ID Pelanggan (min. 8 angka)" value="${getSafeValue(orderDataToEdit, 'idPelanggan')}" class="w-full p-3 border-2 border-neutral-200 rounded-lg text-base transition-all duration-200 bg-white text-neutral-800 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20" required minlength="8">
                </div>
                <div class="form-group">
                    <label for="no-agenda-${formInstanceId}" class="block mb-2 text-neutral-700 font-medium text-sm">No. Agenda:</label>
                    <input type="number" id="no-agenda-${formInstanceId}" placeholder="No. Agenda (min. 10 angka)" value="${getSafeValue(orderDataToEdit, 'noAgenda')}" class="w-full p-3 border-2 border-neutral-200 rounded-lg text-base transition-all duration-200 bg-white text-neutral-800 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20" minlength="10">
                </div>
                <div class="form-group">
                    <label for="tgl-bayar-${formInstanceId}" class="block mb-2 text-neutral-700 font-medium text-sm">Tanggal Bayar <span class="text-red-500">*</span>:</label>
                    <input type="date" id="tgl-bayar-${formInstanceId}" value="${getSafeValue(orderDataToEdit, 'tglBayar')}" class="w-full p-3 border-2 border-neutral-200 rounded-lg text-base transition-all duration-200 bg-white text-neutral-800 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20" required>
                </div>
                
                <div class="form-group">
                    <label for="kebutuhan-kwh-${formInstanceId}" class="block mb-2 text-neutral-700 font-medium text-sm">Kebutuhan KWH:</label>
                    <select id="kebutuhan-kwh-${formInstanceId}" class="choices-select w-full p-3 border-2 border-neutral-200 rounded-lg text-base transition-all duration-200 bg-white text-neutral-800 appearance-none focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20" data-default-option-text="Pilih KWH">
                        <option value="">Pilih KWH</option>
                        ${(loadedOptions.kebutuhanKwh || []).map(option => `<option value="${option}" ${orderDataToEdit?.kebutuhanKwh === option ? 'selected' : ''}>${option}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="kebutuhan-mcb-${formInstanceId}" class="block mb-2 text-neutral-700 font-medium text-sm">Kebutuhan MCB:</label>
                    <select id="kebutuhan-mcb-${formInstanceId}" class="choices-select w-full p-3 border-2 border-neutral-200 rounded-lg text-base transition-all duration-200 bg-white text-neutral-800 appearance-none focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20" data-default-option-text="Pilih MCB">
                        <option value="">Pilih MCB</option>
                        ${(loadedOptions.kebutuhanMcb || []).map(option => `<option value="${option}" ${orderDataToEdit?.kebutuhanMcb === option ? 'selected' : ''}>${option}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="kebutuhan-box-app-${formInstanceId}" class="block mb-2 text-neutral-700 font-medium text-sm">Kebutuhan Box APP:</label>
                    <select id="kebutuhan-box-app-${formInstanceId}" class="choices-select w-full p-3 border-2 border-neutral-200 rounded-lg text-base transition-all duration-200 bg-white text-neutral-800 appearance-none focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20" data-default-option-text="Pilih Box APP">
                        <option value="">Pilih Box APP</option>
                        ${(loadedOptions.kebutuhanBoxApp || []).map(option => `<option value="${option}" ${orderDataToEdit?.kebutuhanBoxApp === option ? 'selected' : ''}>${option}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label for="kebutuhan-kabel-${formInstanceId}" class="block mb-2 text-neutral-700 font-medium text-sm">Kebutuhan Kabel:</label>
                    <select id="kebutuhan-kabel-${formInstanceId}" class="choices-select w-full p-3 border-2 border-neutral-200 rounded-lg text-base transition-all duration-200 bg-white text-neutral-800 appearance-none focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20" data-default-option-text="Pilih Kebutuhan Kabel">
                        <option value="">Pilih Kebutuhan Kabel</option>
                        ${(loadedOptions.kebutuhanKabel || []).map(option => `<option value="${option}" ${orderDataToEdit?.kebutuhanKabel === option ? 'selected' : ''}>${option}</option>`).join('')}
                    </select>
                </div>

<div class="form-group">
    <label for="segel-${formInstanceId}" class="block mb-2 text-neutral-700 font-medium text-sm">Segel:</label>
    <input 
        type="text" 
        id="segel-${formInstanceId}" 
        placeholder="Detail Segel" 
        value="${orderDataToEdit ? (getSafeValue(orderDataToEdit, 'segel') || 'DARI ULP') : 'DARI ULP'}"
        class="w-full p-3 border-2 border-neutral-200 rounded-lg text-base transition-all duration-200 bg-white text-neutral-800 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20">
</div>

                <div class="form-group">
                    <label for="jumlah-kabel-${formInstanceId}" class="block mb-2 text-neutral-700 font-medium text-sm">Jumlah Kabel:</label>
                    <input type="number" id="jumlah-kabel-${formInstanceId}" placeholder="Jumlah Kabel" value="${getSafeValue(orderDataToEdit, 'jumlahKabel')}" class="w-full p-3 border-2 border-neutral-200 rounded-lg text-base transition-all duration-200 bg-white text-neutral-800 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20" min="0">
                </div>
                
                <div class="form-group flex flex-col md:flex-row gap-4">
                    <div class="flex-1">
                        <label class="block mb-2 text-neutral-700 font-medium text-sm">Cover:</label>
                        <div class="radio-pill-group flex flex-wrap gap-2 justify-start" id="cover-radio-${formInstanceId}">
                        </div>
                        <input type="hidden" id="cover-${formInstanceId}" value="${initialCoverValue}">
                    </div>
                    <div class="flex-1">
                        <label class="block mb-2 text-neutral-700 font-medium text-sm">AMR / Modem:</label>
                        <div class="radio-pill-group flex flex-wrap gap-2 justify-start" id="amr-modem-radio-${formInstanceId}">
                        </div>
                        <input type="hidden" id="amr-modem-${formInstanceId}" value="${initialAmrModemValue}">
                    </div>
                </div>

                <div class="form-group grid grid-cols-2 gap-4">
                    <div>
                        <label for="conpres-qty-16-35-2-${formInstanceId}" class="block mb-2 text-neutral-700 font-medium text-sm">
                            Conpres (16-35mm²):
                        </label>
                        <input
                            type="text"
                            id="conpres-qty-16-35-2-${formInstanceId}"
                            placeholder="Teks atau Angka"
                            value="${getSafeValue(orderDataToEdit, 'conpresQty16_35_2') || 'CP16-35'}"
                            class="w-full p-3 border-2 border-neutral-200 rounded-lg text-base transition-all duration-200 bg-white text-neutral-800 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20">
                    </div>
                    <div>
                        <label for="conpres-qty-16-35-${formInstanceId}" class="block mb-2 text-neutral-700 font-medium text-sm">Jumlah Conpres (16-35mm²):</label>
                        <input type="number" id="conpres-qty-16-35-${formInstanceId}" value="${getSafeValue(orderDataToEdit, 'conpresQty16_35', '')}" min="0" class="w-full p-3 border-2 border-neutral-200 rounded-lg text-base transition-all duration-200 bg-white text-neutral-800 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20">
                    </div>
                </div>
                <div class="form-group grid grid-cols-2 gap-4">
                    <div>
                        <label for="conpres-qty-35-70-2-${formInstanceId}" class="block mb-2 text-neutral-700 font-medium text-sm">
                            Conpres (35-70mm²):
                        </label>
                        <input
                            type="text"
                            id="conpres-qty-35-70-2-${formInstanceId}"
                            placeholder="Teks atau Angka"
                            value="${getSafeValue(orderDataToEdit, 'conpresQty35_70_2') || 'CP35-70'}"
                            class="w-full p-3 border-2 border-neutral-200 rounded-lg text-base transition-all duration-200 bg-white text-neutral-800 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20">
                    </div>
                    <div>
                        <label for="conpres-qty-35-70-${formInstanceId}" class="block mb-2 text-neutral-700 font-medium text-sm">Jumlah Conpres (35-70mm²):</label>
                        <input type="number" id="conpres-qty-35-70-${formInstanceId}" value="${getSafeValue(orderDataToEdit, 'conpresQty35_70', '')}" min="0" class="w-full p-3 border-2 border-neutral-200 rounded-lg text-base transition-all duration-200 bg-white text-neutral-800 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20">
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="block mb-2 text-neutral-700 font-medium text-sm">Cetak PK:</label>
                    <div class="radio-pill-group flex flex-wrap gap-2" id="cetak-pk-radio-${formInstanceId}">
                    </div>
                    <input type="hidden" id="cetak-pk-${formInstanceId}" value="${initialCetakPkValue}">
                </div>
                <div class="form-group">
                    <label for="foto_pk-${formInstanceId}" class="block mb-2 text-neutral-700 font-medium text-sm">Foto PK:</label>
                    <div class="file-upload-container flex items-center gap-3 p-3 border-2 border-neutral-200 rounded-lg bg-white cursor-pointer transition-all duration-200 min-h-[44px]" id="fileUploadContainer-${formInstanceId}">
                        <input type="file" id="foto_pk-${formInstanceId}" accept="image/*" class="hidden">
                        <span id="fileName-${formInstanceId}" class="flex-grow text-neutral-500 text-sm whitespace-nowrap overflow-hidden text-ellipsis">${orderDataToEdit?.fotoPk && orderDataToEdit.fotoPk !== 'Tidak ada foto' ? orderDataToEdit.fotoPk.split('/').pop() : 'Belum ada file dipilih'}</span>
                        <button type="button" class="action-btn bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all duration-200 flex items-center gap-1">
                            Pilih File
                        </button>
                    </div>
                </div>

                <div class="form-group">
                    <label class="block mb-2 text-neutral-700 font-medium text-sm">Status Order <span class="text-red-500">*</span>:</label>
                    <div class="flex gap-2" id="status-order-buttons-${formInstanceId}">
                        <button type="button" data-status="Pending" class="flex-1 py-2.5 px-4 rounded-lg font-semibold border-2 border-neutral-200 text-neutral-800 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-primary-500/20">
                            Pending
                        </button>
                        <button type="button" data-status="Selesai" class="flex-1 py-2.5 px-4 rounded-lg font-semibold border-2 border-neutral-200 text-neutral-800 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-primary-500/20">
                            Selesai
                        </button>
                    </div>
                    <input type="hidden" id="status-${formInstanceId}" value="${initialStatusValue}">
                </div>

                <div class="form-group md:col-span-2">
                    <label for="alamat-${formInstanceId}" class="block mb-2 text-neutral-700 font-medium text-sm">Alamat Lengkap:</label>
                    <textarea id="alamat-${formInstanceId}" placeholder="Alamat lengkap pelanggan" class="w-full p-3 border-2 border-neutral-200 rounded-lg text-base transition-all duration-200 bg-white text-neutral-800 min-h-[60px] resize-y focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20" required>${getSafeValue(orderDataToEdit, 'alamat')}</textarea>
                </div>

                <div class="form-group md:col-span-2">
                    <label for="keterangan-${formInstanceId}" class="block mb-2 text-neutral-700 font-medium text-sm">Keterangan Tambahan:</label>
                    <textarea id="keterangan-${formInstanceId}" placeholder="Catatan tambahan untuk order ini" class="w-full p-3 border-2 border-neutral-200 rounded-lg text-base transition-all duration-200 bg-white text-neutral-800 min-h-[120px] resize-y focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20">${getSafeValue(orderDataToEdit, 'keterangan')}</textarea>
                </div>
            </div>
            <div class="button-container flex flex-wrap gap-3 justify-end mt-6">
                <button type="button" class="save-btn bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 border-none rounded-lg font-semibold cursor-pointer transition-all duration-200 shadow-md flex items-center gap-2  
    hover:from-blue-700 hover:to-blue-800  
    active:from-blue-800 active:to-blue-900  
    transform hover:scale-105 active:scale-100"  
    ${isEditMode ? `data-order-id="${orderDataToEdit.id}"` : `data-local-id="${formInstanceId}"`}><i class="fa-solid fa-floppy-disk"></i> ${saveButtonText}</button>
                <button type="button" class="delete-btn ${deleteButtonClass} bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900 text-white px-5 py-2.5 border-none rounded-lg font-semibold cursor-pointer transition-all duration-200 shadow-md flex items-center gap-2 transform hover:scale-105 active:scale-100" ${isEditMode ? `data-order-id="${orderDataToEdit.id}"` : `data-local-id="${formInstanceId}"`}>
    <i class="fa-solid fa-xmark-circle"></i> ${deleteButtonText}
</button>
            </div>
        </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formHtml;
    const newForm = tempDiv.firstElementChild;
    targetContainer.appendChild(newForm);

    // Initialize Choices.js for select elements
    newForm.querySelectorAll('.choices-select').forEach(selectElement => {
        // Destroy existing Choices instance if it exists and wasn't destroyed by initializeOrderSheetPage
        if (choicesInstances[selectElement.id]) {
            choicesInstances[selectElement.id].destroy();
            delete choicesInstances[selectElement.id];
        }
        
        choicesInstances[selectElement.id] = new Choices(selectElement, {
            shouldSort: false,
            itemSelectText: '',
            placeholder: true,
            placeholderValue: selectElement.dataset.defaultOptionText || '',
            allowHTML: false
        });
    });
    
    /**
     * PERUBAHAN: Fungsi baru untuk mengelola logika toggle button (pill)
     * Sekarang ini mendukung toggle on/off, di mana klik kedua akan menghilangkan pilihan.
     * @param {HTMLElement} form - Elemen form.
     * @param {string} id - ID instance form.
     * @param {string} fieldName - Nama field (mis. 'cover').
     * @param {string} initialValue - Nilai awal dari data order.
     * @param {Array<string>} options - Teks untuk setiap tombol.
     * @param {Array<string>} values - Nilai yang sesuai untuk setiap tombol.
     */
    const setupTogglePillLogic = (form, id, fieldName, initialValue, options, values) => {
        const radioGroup = form.querySelector(`#${fieldName}-radio-${id}`);
        const hiddenInput = form.querySelector(`#${fieldName}-${id}`);
        
        if (!radioGroup || !hiddenInput) {
            console.error(`Missing elements for ${fieldName} toggle pill logic.`);
            return;
        }

        radioGroup.innerHTML = options.map((option, index) => {
            // Awalnya tidak ada tombol yang memiliki warna biru, kecuali PB/PD yang memiliki default
            const isDefaultActive = (fieldName === 'pb-pd' && initialValue === values[index]);
            const buttonClass = `px-4 py-2 rounded-full font-semibold border-2 transition-colors duration-200 ${isDefaultActive ? 'bg-blue-800 text-white' : 'bg-neutral-200 text-neutral-700'}`;
            return `<button type="button" data-value="${values[index]}" class="${buttonClass}">${option}</button>`;
        }).join('');

        const buttons = radioGroup.querySelectorAll('button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const selectedValue = button.dataset.value;
                const currentValue = hiddenInput.value;

                // Logika toggle: Jika tombol yang sama diklik, nonaktifkan
                if (selectedValue === currentValue) {
                    hiddenInput.value = ''; // Reset nilai
                    button.classList.remove('bg-blue-800', 'text-white');
                    button.classList.add('bg-neutral-200', 'text-neutral-700');
                } else {
                    hiddenInput.value = selectedValue; // Atur nilai baru
                    buttons.forEach(btn => {
                        if (btn.dataset.value === selectedValue) {
                            btn.classList.add('bg-blue-800', 'text-white');
                            btn.classList.remove('bg-neutral-200', 'text-neutral-700');
                        } else {
                            btn.classList.remove('bg-blue-800', 'text-white');
                            btn.classList.add('bg-neutral-200', 'text-neutral-700');
                        }
                    });
                }
                // Perbaikan: Pemicu event 'change' secara manual pada hidden input
                hiddenInput.dispatchEvent(new Event('change'));
            });
        });
    };

    // Panggil logika baru untuk PB/PD (perlu default aktif)
    setupTogglePillLogic(newForm, formInstanceId, 'pb-pd', initialPbPdValue, ['PB', 'PD'], ['PB', 'PD']);
    // Panggil logika baru untuk Cover, AMR/Modem, dan Cetak PK (tanpa default aktif)
    setupTogglePillLogic(newForm, formInstanceId, 'cover', initialCoverValue, ['YA', 'TIDAK'], ['COVER', 'Tidak']);
    setupTogglePillLogic(newForm, formInstanceId, 'amr-modem', initialAmrModemValue, ['YA', 'TIDAK'], ['MODEM AMR', 'Tidak']);
    setupTogglePillLogic(newForm, formInstanceId, 'cetak-pk', initialCetakPkValue, ['Sudah', 'Belum'], ['Sudah', 'Belum']);

    // Tambahkan logika untuk tombol Status Order
    const statusButtonsContainer = newForm.querySelector(`#status-order-buttons-${formInstanceId}`);
    const statusHiddenInput = newForm.querySelector(`#status-${formInstanceId}`);

    // Fungsi untuk memperbarui tampilan tombol status
    const updateStatusButtons = () => {
        const currentStatus = statusHiddenInput.value;
        const activeColor = 'bg-blue-800 text-white';
        const inactiveColor = 'bg-neutral-200 text-neutral-700';
        
        statusButtonsContainer.querySelectorAll('button').forEach(button => {
            if (button.dataset.status === currentStatus) {
                button.className = `flex-1 py-2.5 px-4 rounded-lg font-semibold border-2 border-primary-500 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-primary-500/20 ${activeColor}`;
            } else {
                button.className = `flex-1 py-2.5 px-4 rounded-lg font-semibold border-2 border-neutral-200 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-primary-500/20 ${inactiveColor}`;
            }
        });
    };

    // Panggil updateStatusButtons untuk menginisialisasi tampilan
    updateStatusButtons();

    // Tambahkan event listener ke setiap tombol status
    statusButtonsContainer.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
            const selectedStatus = button.dataset.status;
            const currentValue = statusHiddenInput.value;

            // Logika toggle: Jika tombol yang sama diklik, nonaktifkan
            if (selectedStatus === currentValue) {
                statusHiddenInput.value = ''; // Hapus nilai
            } else {
                statusHiddenInput.value = selectedStatus; // Atur nilai baru
            }
            updateStatusButtons(); // Perbarui tampilan tombol
        });
    });

    // Logika untuk menyembunyikan/menampilkan Tarif/Daya Lama/Baru berdasarkan PB/PD
    const pbPdHiddenInput = newForm.querySelector(`#pb-pd-${formInstanceId}`);
    const tarifDayaLamaGroup = newForm.querySelector(`#tarif-daya-lama-group-${formInstanceId}`);
    const tarifDayaBaruGroup = newForm.querySelector(`#tarif-daya-baru-group-${formInstanceId}`);

    const toggleTarifDayaFields = () => {
        const selectedPbPd = pbPdHiddenInput.value;

        if (selectedPbPd === 'PB') {
            tarifDayaLamaGroup.style.display = 'none';
            // Clear value or set to '-' if PB and not already '-'
            const tarifLamaInput = tarifDayaLamaGroup.querySelector('input');
            if (tarifLamaInput && tarifLamaInput.value !== '-') { 
                tarifLamaInput.value = '-';
            }
            tarifDayaBaruGroup.style.display = 'block';
        } else if (selectedPbPd === 'PD') {
            tarifDayaLamaGroup.style.display = 'block';
            // Restore original value if in edit mode and not '-' or clear it
            const tarifLamaInput = tarifDayaLamaGroup.querySelector('input');
            if (tarifLamaInput) { 
                if (isEditMode && orderDataToEdit?.tarifDayaLama && orderDataToEdit.tarifDayaLama !== '-') {
                    tarifLamaInput.value = orderDataToEdit.tarifDayaLama;
                } else if (tarifLamaInput.value === '-') {
                    tarifLamaInput.value = ''; // If it was previously PB and now PD, clear the '-'
                }
            }
            tarifDayaBaruGroup.style.display = 'block';
        }
    };
    
    // Listen to changes on the hidden input, which is updated by setupTogglePillLogic
    if (pbPdHiddenInput) { 
        // Remove existing listener to prevent duplicates
        const oldListener = pbPdHiddenInput._pbPdChangeListener;
        if (oldListener) {
            pbPdHiddenInput.removeEventListener('change', oldListener);
        }
        pbPdHiddenInput.addEventListener('change', toggleTarifDayaFields);
        pbPdHiddenInput._pbPdChangeListener = toggleTarifDayaFields; // Store reference
    }

    toggleTarifDayaFields(); // Call on initial form render

    setupFileUploadLogic(newForm, formInstanceId);

    // Scroll to the new form
    newForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Fungsi inisialisasi untuk halaman "Order Sheet" (Input).
 * Ini akan dipanggil dari app.js ketika halaman 'order-sheet' diaktifkan.
 * @param {Object} [orderDataToEdit=null] - Data order jika dalam mode edit.
 */
async function initializeOrderSheetPage(orderDataToEdit = null) {
    showLoader(); // Tampilkan loader
    const dynamicOrderInputs = document.getElementById('dynamicOrderInputs');
    const noDynamicFormPlaceholder = document.getElementById('noDynamicFormPlaceholder');

    if (!dynamicOrderInputs || !noDynamicFormPlaceholder) {
        console.error("Elemen kontainer form dinamis atau placeholder tidak ditemukan di halaman input.");
        hideLoader();
        return;
    }

    // Hapus semua form yang ada dan destroy Choices.js instances
    document.querySelectorAll('.dynamic-input-form').forEach(form => {
        form.querySelectorAll('.choices-select').forEach(selectElement => {
            choicesInstances[selectElement.id]?.destroy();
            delete choicesInstances[selectElement.id];
        } );
        form.remove();
    });

    // Pastikan loadedOptions sudah terisi sebelum merender form
    if (loadedOptions.ulp.length === 0) {
        console.warn("Opsi dropdown belum dimuat. Mencoba memuat ulang.");
        try {
            await fetchOptions(); // Coba muat ulang jika kosong
        } catch (error) {
            showToast('error', 'Gagal memuat opsi dropdown!', error.message);
            hideLoader();
            return; // Hentikan inisialisasi jika opsi gagal dimuat
        }
    }

    // Render form berdasarkan mode edit atau form baru
    if (orderDataToEdit) {
        renderOrderForm(orderDataToEdit.id, dynamicOrderInputs, orderDataToEdit); // ID di sini adalah ID order dari backend
        noDynamicFormPlaceholder.style.display = 'none'; // Sembunyikan placeholder
    } else {
        noDynamicFormPlaceholder.style.display = 'flex'; // Tampilkan placeholder untuk form baru
    }

    hideLoader(); // Sembunyikan loader
    console.log("Halaman Order Sheet diinisialisasi.", orderDataToEdit ? `Mode Edit untuk Order ID: ${orderDataToEdit.id}` : "Mode Input Baru");
}

// Expose to global scope
window.initializeOrderSheetPage = initializeOrderSheetPage;
window.renderOrderForm = renderOrderForm; 
window.deleteFormOnly = deleteFormOnly; 
window.saveOrder = saveOrder; 


/**
 * Menghapus form input dinamis dari DOM.
 * @param {number} localId - ID lokal form yang akan dihapus.
 * @param {HTMLElement} formContainer - Elemen kontainer form yang akan dihapus.
 */
function deleteFormOnly(localId, formContainer) {
    Swal.fire({
        title: 'Yakin ingin hapus?',
        text: 'Form order ini akan dihapus dan tidak bisa dikembalikan.',
        icon: 'question',
        iconHtml: '<i class="fas fa-trash-alt text-red-500"></i>',
        showCancelButton: true,
        confirmButtonColor: '#dc2626', // red-600
        cancelButtonColor: '#9ca3af',  // gray-400
        confirmButtonText: '<i class="fas fa-check-circle mr-2"></i> Iya,',
        cancelButtonText: '<i class="fas fa-times mr-2"></i> Batal',
        showClass: {
            popup: 'animate__animated animate__fadeInDown faster'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp faster'
        },
        customClass: {
            popup: 'rounded-xl shadow-xl px-8 py-6',
            title: 'text-lg font-semibold text-neutral-800 dark:text-neutral-100',
            htmlContainer: 'text-sm text-neutral-600 dark:text-neutral-300',
            // --- PERBAIKAN DI SINI: MENAMBAHKAN KELAS UNTUK MENAMBAH JARAK ---
            actions: 'mt-6 gap-4', // Menambahkan jarak antar tombol (mt-6 untuk margin-top, gap-4 untuk jarak horizontal)
            confirmButton: 'bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2 rounded-lg shadow-md transition',
            cancelButton: 'bg-neutral-300 hover:bg-neutral-400 text-gray-800 font-semibold px-5 py-2 rounded-lg transition',
        },
        buttonsStyling: false
    }).then((result) => {
        if (result.isConfirmed) {
            // Hapus semua instance Choices.js dari form
            formContainer.querySelectorAll('.choices-select').forEach(selectElement => {
                if (choicesInstances[selectElement.id]) {
                    choicesInstances[selectElement.id].destroy();
                    delete choicesInstances[selectElement.id];
                }
            });

            formContainer.remove(); // Hapus form dari DOM
            showToast('success', 'Dihapus!', `Form Order telah dihapus.`); 

            const dynamicOrderInputs = document.getElementById('dynamicOrderInputs');
            const noDynamicFormPlaceholder = document.getElementById('noDynamicFormPlaceholder');
            if (dynamicOrderInputs && dynamicOrderInputs.querySelectorAll('.dynamic-input-form').length === 0) {
                if (noDynamicFormPlaceholder) {
                    noDynamicFormPlaceholder.style.display = 'flex';
                }
            }
        }
    });
}


/**
 * Menyimpan atau memperbarui data order ke backend.
 * @param {number|null} orderId - ID order jika dalam mode edit, null jika order baru.
 * @param {HTMLElement} formContainer - Elemen form yang berisi data order.
 * @param {Object} [orderDataToEdit=null] - Data order asli jika dalam mode edit, digunakan untuk fotoPk.
 */
async function saveOrder(orderId, formContainer, orderDataToEdit = null) {
    console.log("saveOrder: Memulai proses penyimpanan/pembaruan order.");
    if (!formContainer) {
        console.error("ERROR: formContainer is null or undefined in saveOrder!");
        showToast('error', 'Kesalahan Internal!', 'Form tidak ditemukan. Harap segarkan halaman dan coba lagi.');
        return;
    }

    const isEdit = typeof orderId === 'number' && orderId !== null;
    const idToUse = isEdit ? orderId : formContainer.getAttribute('data-local-id');

    const saveButton = formContainer.querySelector('.save-btn');
    const originalSaveButtonHtml = saveButton.innerHTML;
    saveButton.disabled = true;
    saveButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${isEdit ? 'Memperbarui...' : 'Menyimpan...'}`;

    // Helper function to get value from a standard input/select
    const getElementValue = (selector, isRequired = false, defaultValue = '') => {
        const element = formContainer.querySelector(selector);
        if (!element) {
            console.error(`ERROR: Elemen dengan selector "${selector}" tidak ditemukan di dalam formContainer.`);
            throw new Error(`Missing form element: ${selector}`);
        }
        let value = element.value.trim();
        if (isRequired && !value) {
            throw new Error(`Field '${selector.split('-').pop()}' wajib diisi.`);
        }
        return value || defaultValue;
    };

    // Correctly get value from the hidden input for PB/PD, Cover, AMR/Modem, Cetak PK and the new Status
    const getHiddenInputValue = (idPrefix) => {
        const input = formContainer.querySelector(`#${idPrefix}-${idToUse}`);
        return input ? input.value : '';
    };

    let orderData = {}; // Object untuk menampung semua data order

    try {
        orderData.namaPelanggan = getElementValue(`#nama-pelanggan-${idToUse}`, true);
        orderData.ulp = getElementValue(`#ulp-${idToUse}`, true);
        orderData.alamat = getElementValue(`#alamat-${idToUse}`, true); // PERUBAHAN: Alamat sekarang wajib diisi
        orderData.pbPd = getHiddenInputValue('pb-pd');
        if (!orderData.pbPd) {
            throw new Error('Field "PB/PD" wajib diisi.');
        }

        const tarifDayaLamaGroup = formContainer.querySelector(`#tarif-daya-lama-group-${idToUse}`);
        orderData.tarifDayaLama = (tarifDayaLamaGroup && tarifDayaLamaGroup.style.display !== 'none')
            ? getElementValue(`#tarif-daya-lama-${idToUse}`)
            : '-';

        orderData.tarifDayaBaru = getElementValue(`#tarif-daya-baru-${idToUse}`, true);
        
        // PERUBAHAN: Validasi ID Pelanggan (hanya angka dan min. 8 digit)
        const idPelanggan = getElementValue(`#id-pelanggan-${idToUse}`, true);
        if (idPelanggan.length < 8) {
            throw new Error('Field "ID Pelanggan" wajib minimal 8 angka.');
        }
        if (isNaN(idPelanggan)) {
            throw new Error('Field "ID Pelanggan" harus berupa angka.');
        }
        orderData.idPelanggan = idPelanggan;

        // PERUBAHAN: Validasi No. Agenda (hanya angka dan min. 10 digit)
        const noAgenda = getElementValue(`#no-agenda-${idToUse}`, false, '');
        if (noAgenda !== '' && noAgenda.length < 10) {
            throw new Error('Field "No. Agenda" wajib minimal 10 angka jika diisi.');
        }
        if (noAgenda !== '' && isNaN(noAgenda)) {
            throw new Error('Field "No. Agenda" harus berupa angka.');
        }
        orderData.noAgenda = noAgenda;

        orderData.tglBayar = getElementValue(`#tgl-bayar-${idToUse}`, true);
        orderData.kebutuhanKwh = getElementValue(`#kebutuhan-kwh-${idToUse}`, false, '-');
        orderData.kebutuhanMcb = getElementValue(`#kebutuhan-mcb-${idToUse}`, false, '-');
        orderData.kebutuhanBoxApp = getElementValue(`#kebutuhan-box-app-${idToUse}`, false, '-');
        orderData.kebutuhanKabel = getElementValue(`#kebutuhan-kabel-${idToUse}`, false, '-');
        // PERBAIKAN: Validasi untuk memastikan hanya angka pada Jumlah Kabel
        let jumlahKabel = getElementValue(`#jumlah-kabel-${idToUse}`, false, '');
        if (jumlahKabel !== '' && isNaN(jumlahKabel)) {
            throw new Error('Field "Jumlah Kabel" harus berupa angka.');
        }
        orderData.jumlahKabel = jumlahKabel;

        orderData.segel = getElementValue(`#segel-${idToUse}`, false, '-');

        // Perbaikan: Ambil nilai dari input yang baru
        orderData.cover = getHiddenInputValue('cover') || 'Tidak';
        orderData.amrModem = getHiddenInputValue('amr-modem') || 'Tidak';
        
        // PERBAHAN: Menggunakan getElementValue tanpa konversi number agar tetap string jika kosong
        orderData.conpresQty16_35 = getElementValue(`#conpres-qty-16-35-${idToUse}`, false, '');
        orderData.conpresQty16_35_2 = getElementValue(`#conpres-qty-16-35-2-${idToUse}`, false, '');
        orderData.conpresQty35_70 = getElementValue(`#conpres-qty-35-70-${idToUse}`, false, '');
        orderData.conpresQty35_70_2 = getElementValue(`#conpres-qty-35-70-2-${idToUse}`, false, '');
        // Perbaikan: Validasi agar tetap string jika kosong.
        if (orderData.conpresQty16_35 !== '' && isNaN(parseFloat(orderData.conpresQty16_35))) {
            throw new Error('Jumlah Conpres (16-35mm²) harus berupa angka.');
        }
        if (orderData.conpresQty35_70 !== '' && isNaN(parseFloat(orderData.conpresQty35_70))) {
            throw new Error('Jumlah Conpres (35-70mm²) harus berupa angka.');
        }

        // Perbaikan: Ambil nilai dari input yang baru
        orderData.cetakPk = getHiddenInputValue('cetak-pk') || 'Belum';
        
        orderData.keterangan = getElementValue(`#keterangan-${idToUse}`, false, '-');

        // PERUBAHAN: Status Order menjadi wajib diisi tanpa kotak centang
        orderData.status = getHiddenInputValue('status');
        if (!orderData.status) {
            throw new Error('Field "Status Order" wajib diisi.');
        }

        console.log("saveOrder: Data form terkumpul:", orderData);

    } catch (error) {
        console.error("saveOrder: Error collecting form data:", error);
        showToast('warning', 'Input Tidak Lengkap/Valid!', error.message); 
        saveButton.disabled = false;
        saveButton.innerHTML = originalSaveButtonHtml;
        return;
    }

    // Create FormData object for sending multipart/form-data
    const formData = new FormData();
    for (const key in orderData) {
        formData.append(key, orderData[key]);
    }

    // Handle fotoPk file or string
    const fotoPkInput = formContainer.querySelector(`#foto_pk-${idToUse}`);
    if (fotoPkInput && fotoPkInput.files.length > 0) {
        formData.append('fotoPk', fotoPkInput.files[0]);
        console.log("saveOrder: Mengunggah file fotoPk baru.");
    } else if (isEdit && orderDataToEdit?.fotoPk && orderDataToEdit.fotoPk !== 'Tidak ada foto') {
        formData.append('fotoPk', orderDataToEdit.fotoPk); // Keep existing photo URL
        console.log("saveOrder: Mempertahankan URL fotoPk yang sudah ada.");
    } else {
        formData.append('fotoPk', 'Tidak ada foto'); // Explicitly send "Tidak ada foto"
        console.log("saveOrder: Mengatur fotoPk ke 'Tidak ada foto'.");
    }

    try {
        showLoader(); // Show loader during API call
        let response;
        const apiUrl = isEdit ? `${API_BASE_URL}/api/orders/${orderId}` : `${API_BASE_URL}/api/orders`;
        const method = isEdit ? 'PUT' : 'POST';
        console.log(`saveOrder: Mengirim permintaan ${method} ke ${apiUrl} dengan FormData.`);

        response = await fetch(apiUrl, {
            method: method,
            body: formData
        });

        console.log("saveOrder: Respon API:", response);

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: 'Unknown error or non-JSON response' }));
            throw new Error(errorBody.message || `HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log("saveOrder: Respon sukses dari API:", result);
        showToast('success', isEdit ? 'Berhasil Diperbarui!' : 'Berhasil Disimpan!', isEdit ? `Order #${result.order.id} berhasil diperbarui!` : `Order #${result.order.id} berhasil disimpan!`);

        // Destroy Choices.js instances and remove the form
        formContainer.querySelectorAll('.choices-select').forEach(selectElement => {
            choicesInstances[selectElement.id]?.destroy();
            delete choicesInstances[selectElement.id];
        });
        formContainer.remove();
        console.log("saveOrder: Form berhasil dihapus dari DOM.");

        // Refresh data and UI across relevant sections
        console.log("saveOrder: Memulai refresh data aplikasi...");
        await fetchOrders(); // Reload all orders from backend (defined in global.js)
        applyFilters(); // Re-apply filters to update 'All Orders' list (defined in orders.js)
        renderCharts(); // Re-render charts for dashboard (defined in dashboard.js)
        console.log("saveOrder: Refresh data aplikasi selesai.");

        // Show placeholder if no dynamic forms are left
        const dynamicOrderInputs = document.getElementById('dynamicOrderInputs');
        const noDynamicFormPlaceholder = document.getElementById('noDynamicFormPlaceholder'); // Ensure this is defined
        if (dynamicOrderInputs && dynamicOrderInputs.querySelectorAll('.dynamic-input-form').length === 0) {
            noDynamicFormPlaceholder.style.display = 'flex';
        }

    } catch (error) {
        console.error("saveOrder: Error saving/updating order:", error);
        const titleText = isEdit ? 'Gagal Memperbarui!' : 'Gagal Menyimpan!';
        showToast('error', titleText, `Terjadi kesalahan: ${error.message}.`);
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = originalSaveButtonHtml;
        hideLoader(); // Hide loader after API call
    }
}