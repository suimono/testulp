// =================================================
// BAGIAN 7: OPTIONS MANAGEMENT (settings.js)
// =================================================

/**
 * Memuat opsi dropdown dari backend.
 * Dan menginisialisasi ulang dropdown Choices.js di form input.
 * NOTE: Fungsi ini sekarang memanggil fetchOptions dari global.js
 */
async function loadOptionsAndRefreshUI() {
    try {
        await fetchOptions(); // Memuat opsi dari backend ke loadedOptions (global)
        
        // console.log("Options loaded:", loadedOptions); // Hapus atau komentari untuk produksi
        updateFilterOptions(); // Update filter dropdowns after loading options (from orders.js)
        
        // MODIFIED: Re-initialize Choices.js on ALL dynamic forms that are currently open
        // This is crucial if a user adds an option while an input form is open
        document.querySelectorAll('.dynamic-input-form').forEach(formContainer => {
            formContainer.querySelectorAll('.choices-select').forEach(selectElement => {
                // Determine the correct category key from the select element's ID
                const categoryMatch = selectElement.id.match(/^(ulp|kebutuhan-kwh|kebutuhan-mcb|kebutuhan-box-app|kebutuhan-kabel)/);
                const category = categoryMatch ? categoryMatch[0].replace(/-/g, '') : null; // e.g., 'ulp', 'kebutuhanKwh'

                if (!category || !loadedOptions[category]) {
                    // console.warn(`Category ${category} not found in loadedOptions or ID mismatch for select: ${selectElement.id}`); // Hapus atau komentari untuk produksi
                    return;
                }

                // Store current selected value to re-select after re-initialization
                const currentSelectedValue = choicesInstances[selectElement.id] ? choicesInstances[selectElement.id].getValue(true) : selectElement.value;

                // Destroy old instance
                if (choicesInstances[selectElement.id]) {
                    choicesInstances[selectElement.id].destroy();
                    delete choicesInstances[selectElement.id];
                }

                // Populate with new options
                selectElement.innerHTML = ''; // Clear existing options
                const defaultOptionText = selectElement.dataset.defaultOptionText || `Pilih ${category.replace(/([A-Z])/g, ' $1').trim()}`; // Convert camelCase to readable text
                selectElement.innerHTML += `<option value="">${defaultOptionText}</option>`; // Add default option

                if (loadedOptions[category] && Array.isArray(loadedOptions[category])) {
                    loadedOptions[category].forEach(option => {
                        const opt = document.createElement('option');
                        opt.value = option;
                        opt.textContent = option; // Add text content for better accessibility and display
                        selectElement.appendChild(opt);
                    });
                }
                
                // Re-initialize new Choices instance
                choicesInstances[selectElement.id] = new Choices(selectElement, {
                    shouldSort: false,
                    itemSelectText: '',
                    placeholder: true,
                    placeholderValue: defaultOptionText,
                    allowHTML: false
                });

                // Re-select the value if it was previously selected
                if (currentSelectedValue) {
                    choicesInstances[selectElement.id].setChoiceByValue(currentSelectedValue);
                }
            });

            // Update datalist for 'tarif-daya-baru'
            const tarifDayaDatalist = formContainer.querySelector(`#tarifDayaList-${formContainer.getAttribute('data-local-id') || formContainer.getAttribute('data-order-id')}`);
            if (tarifDayaDatalist) {
                tarifDayaDatalist.innerHTML = '';
                (loadedOptions.tarifDaya || []).forEach(option => {
                    const opt = document.createElement('option');
                    opt.value = option;
                    opt.textContent = option; // Add text content for better accessibility and display
                    tarifDayaDatalist.appendChild(opt); 
                });
            }
        });

    } catch (error) {
        console.error("Error loading options and refreshing UI:", error);
        // Tampilkan error global jika gagal memuat opsi, terutama saat inisialisasi
        showGlobalError(`Gagal memuat opsi dropdown: ${error.message}`);
    }
}

// NEW: Render all option lists in the "manage-options" page
function renderAllOptionLists() {
    if (!loadedOptions || Object.keys(loadedOptions).length === 0) {
        // console.warn("loadedOptions is empty, cannot render option lists."); 
        return;
    }

    // Function to render a single category's options
    const renderCategoryOptions = (category, containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = ''; // Clear previous chips
        const options = loadedOptions[category] || [];

        options.forEach(optionText => {
            const chip = document.createElement('div');
            chip.classList.add('option-chip');
            chip.innerHTML = `
                <span>${optionText}</span>
                <button class="remove-chip-btn" data-category="${category}" data-value="${optionText}"><i class="fas fa-times"></i></button>
            `;
            container.appendChild(chip);
        });
    };

    // Render all relevant lists for form fields
    renderCategoryOptions('ulp', 'ulpOptionsList');
    renderCategoryOptions('tarifDaya', 'tarifDayaOptionsList');
    renderCategoryOptions('kebutuhanKwh', 'kebutuhanKwhOptionsList');
    renderCategoryOptions('kebutuhanMcb', 'kebutuhanMcbOptionsList');
    renderCategoryOptions('kebutuhanBoxApp', 'kebutuhanBoxAppOptionsList');
    renderCategoryOptions('kebutuhanKabel', 'kebutuhanKabelOptionsList');
    
    // Add other fields that can have dynamic options, if any
    // For now, assume a static set of options for pill buttons
}

// NEW: Add option to a specific category
async function addOption(category, inputElementId) {
    const inputElement = document.getElementById(inputElementId);
    const newValue = inputElement.value.trim();

    if (!newValue) {
        Swal.fire({
            icon: 'warning',
            title: 'Input Kosong',
            text: 'Opsi tidak boleh kosong!',
            confirmButtonColor: '#facc15' 
        });
        return;
    }

    // Check for duplicates (case-insensitive for better UX)
    const currentOptions = loadedOptions[category] || [];
    if (currentOptions.some(opt => opt.toLowerCase() === newValue.toLowerCase())) {
        Swal.fire({
            icon: 'info',
            title: 'Duplikat Opsi',
            text: `Opsi "${newValue}" sudah ada dalam daftar.`,
            confirmButtonColor: '#4f46e5' 
        });
        return;
    }

    const updatedOptions = [...currentOptions, newValue];
    
    Swal.fire({
        title: 'Menyimpan Opsi...',
        text: 'Harap tunggu.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const response = await fetch(`${API_BASE_URL}/api/options/${category}`, {
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedOptions)
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorBody.message || 'Unknown error'}`);
        }

        Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: `Opsi "${newValue}" berhasil ditambahkan ke ${category}.`,
            confirmButtonColor: '#10b981' 
        });
        inputElement.value = ''; // Clear input field
        await loadOptionsAndRefreshUI(); // Reload all options and update forms/filters
        renderAllOptionLists(); // Re-render option chips on this page
    } catch (error) {
        console.error("Error adding option:", error);
        Swal.fire({
            icon: 'error',
            title: 'Gagal Menambah Opsi!',
            text: `Terjadi kesalahan: ${error.message}. Pastikan server backend berjalan.`,
            confirmButtonColor: '#ef4444' 
        });
    }
}

// NEW: Delete option from a specific category
async function deleteOption(category, valueToDelete) {
    Swal.fire({
        title: 'Anda yakin?',
        text: `Anda akan menghapus opsi "${valueToDelete}" dari ${category}. Aksi ini tidak dapat dibatalkan!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const currentOptions = loadedOptions[category] || [];
            const updatedOptions = currentOptions.filter(item => item !== valueToDelete);

            Swal.fire({
                title: 'Menghapus Opsi...',
                text: 'Harap tunggu.',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });

            try {
                const response = await fetch(`${API_BASE_URL}/api/options/${category}`, {
                    method: 'PUT', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedOptions)
                });

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
                    throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorBody.message || 'Unknown error'}`);
                }

                Swal.fire(
                    'Dihapus!',
                    `Opsi "${valueToDelete}" berhasil dihapus dari ${category}.`,
                    'success'
                );
                await loadOptionsAndRefreshUI(); // Reload all options and update forms/filters
                renderAllOptionLists(); // Re-render option chips on this page
            } catch (error) {
                console.error("Error deleting option:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Menghapus Opsi!',
                    text: `Terjadi kesalahan: ${error.message}. Pastikan server backend berjalan.`,
                    confirmButtonColor: '#ef4444' 
                });
            }
        }
    });
}

/**
 * Menghapus semua data order dari backend (reset orders.json).
 * Meminta password admin dan memverifikasinya melalui backend.
 */
async function resetAllOrders() {
    const { value: password } = await Swal.fire({
        title: 'Masukkan Password Admin',
        input: 'password',
        inputPlaceholder: 'Password',
        inputAttributes: {
            autocapitalize: 'off',
            autocorrect: 'off'
        },
        showCancelButton: true,
        confirmButtonText: 'Reset',
        cancelButtonText: 'Batal',
        confirmButtonColor: '#4f46e5', 
        cancelButtonColor: '#6b7280', 
        inputValidator: (value) => {
            if (!value) {
                return 'Password tidak boleh kosong!';
            }
        }
    });

    if (password) { // Only proceed if password was entered (not cancelled)
        try {
            // VERIFIKASI PASSWORD VIA BACKEND
            const verifyResponse = await fetch(`${API_BASE_URL}/api/admin/verify-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: password })
            });

            if (!verifyResponse.ok) {
                const errorBody = await verifyResponse.json().catch(() => ({ message: 'Verifikasi password gagal.' }));
                Swal.fire({
                    icon: 'error',
                    title: 'Akses Ditolak!',
                    text: errorBody.message || 'Password salah.',
                    confirmButtonColor: '#ef4444' 
                });
                return; // Stop execution if password is incorrect
            }

            // Jika password benar, lanjutkan dengan konfirmasi reset
            Swal.fire({
                title: 'Anda Yakin Ingin Menghapus SEMUA Order?',
                html: '<p class="text-red-500 font-bold">Aksi ini TIDAK DAPAT DIBATALKAN!</p><p>Semua data order akan dihapus secara permanen dari server.</p>',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444', 
                cancelButtonColor: '#6b7280', 
                confirmButtonText: 'Ya, Hapus SEMUA Order!',
                cancelButtonText: 'Batal'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        title: 'Menghapus Semua Order...',
                        text: 'Harap tunggu, proses ini mungkin membutuhkan waktu.',
                        icon: 'info',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    try {
                        // Kirim password di body request ke endpoint reset
                        const response = await fetch(`${API_BASE_URL}/api/orders/reset`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ password: password })
                        });
                        
                        if (!response.ok) {
                            const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
                            throw new Error(`Gagal mereset order di server: ${response.status} - ${errorBody.message || 'Respons tidak valid'}`);
                        }

                        Swal.fire({
                            icon: 'success',
                            title: 'Semua Order Dihapus!',
                            text: 'Semua data order telah berhasil dihapus.',
                            confirmButtonColor: '#10b981' 
                        });
                        await fetchOrders(); // Reload empty orders
                        applyFilters(); // Update UI to show no orders
                        renderCharts(); // Clear charts
                    } catch (error) {
                        console.error("Error resetting all orders:", error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Gagal Mereset Order!',
                            text: `Terjadi kesalahan saat mereset data: ${error.message}.`,
                            confirmButtonColor: '#ef4444' 
                        });
                    }
                }
            });
        } catch (error) {
            console.error("Error during password verification:", error);
            Swal.fire({
                icon: 'error',
                title: 'Kesalahan Jaringan!',
                text: 'Tidak dapat terhubung ke server untuk verifikasi password.',
                confirmButtonColor: '#ef4444' 
            });
        }
    }
}
