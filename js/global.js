/**
 * =================================================
 * BAGIAN 1: GLOBAL STATE & CONFIGURATION
 * =================================================
 */
const API_BASE_URL = 'http://localhost:3000'; // Sesuaikan jika alamat server berbeda

// Variabel global untuk menyimpan state aplikasi
let allOrders = []; // Menyimpan semua data order yang dimuat dari server
let filteredOrders = []; // Menyimpan data order setelah filter diterapkan
let localIdCounter = 0; // Counter untuk ID lokal form input dinamis
let ulpChartInstance = null; // Instance Chart.js untuk ULP
let choicesInstances = {}; // Menyimpan instance Choices.js untuk pengelolaan yang lebih baik

// Memastikan loadedOptions selalu memiliki struktur yang diperlukan
let loadedOptions = {
    ulp: [],
    tarifDaya: [],
    kebutuhanKwh: [],
    kebutuhanMcb: [],
    kebutuhanBoxApp: [],
    kebutuhanKabel: []
};

/**
 * =================================================
 * BAGIAN 2: UTILITY FUNCTIONS (global.js)
 * =================================================
 */

/**
 * Menampilkan overlay loader.
 */
function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.remove('hidden');
        loader.classList.add('flex');
    }
}

/**
 * Menyembunyikan overlay loader.
 */
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
        loader.classList.remove('flex');
    }
}

/**
 * Menampilkan pesan toast menggunakan SweetAlert2.
 * @param {string} icon - Ikon toast ('success', 'error', 'warning', 'info').
 * @param {string} title - Judul toast.
 * @param {string} text - Teks pesan toast.
 */
function showToast(icon, title, text) {
    Swal.fire({
        icon: icon,
        title: title,
        text: text,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
}

/**
 * Memuat semua data order dari backend.
 * Mengisi variabel global 'allOrders'.
 */
async function fetchOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders`);
        if (!response.ok) { 
            const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(`Gagal memuat order dari server: ${response.status} - ${errorBody.message || 'Respons tidak valid'}`); 
        }
        const data = await response.json();
        allOrders = data.sort((a, b) => a.id - b.id);
        // console.log("Orders loaded:", allOrders); // Hapus atau komentari untuk produksi
    } catch (error) {
        console.error("Error loading orders from backend:", error);
        // Tampilkan error global jika gagal memuat order, terutama saat inisialisasi
        showGlobalError(`Gagal memuat data order: ${error.message}`);
        // Penting: Kosongkan allOrders agar tidak ada data yang salah ditampilkan
        allOrders = []; 
    }
}

/**
 * Memuat opsi dropdown dari backend.
 * Mengisi variabel global 'loadedOptions'.
 */
async function fetchOptions() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/options`);
        if (!response.ok) { 
            const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(`Gagal memuat opsi dari server: ${response.status} - ${errorBody.message || 'Respons tidak valid'}`); 
        }
        const data = await response.json();
        // Ensure that loadedOptions has default empty arrays if a category is missing from backend
        loadedOptions.ulp = data.ulp || [];
        loadedOptions.tarifDaya = data.tarifDaya || [];
        loadedOptions.kebutuhanKwh = data.kebutuhanKwh || [];
        loadedOptions.kebutuhanMcb = data.kebutuhanMcb || [];
        loadedOptions.kebutuhanBoxApp = data.kebutuhanBoxApp || [];
        loadedOptions.kebutuhanKabel = data.kebutuhanKabel || [];
        
        // console.log("Options loaded:", loadedOptions); // Hapus atau komentari untuk produksi
    } catch (error) {
        console.error("Error loading options:", error);
        // Tampilkan error global jika gagal memuat opsi, terutama saat inisialisasi
        showGlobalError(`Gagal memuat opsi dropdown: ${error.message}`);
    }
}

/**
 * Merender legenda HTML kustom untuk grafik donat.
 * @param {Array<string>} labels - Label untuk segmen grafik.
 * @param {Array<string>} colors - Warna untuk segmen grafik.
 * @param {string} containerId - ID elemen HTML tempat legenda akan dirender.
 */
function renderCustomLegend(labels, colors, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`renderCustomLegend: Container dengan ID '${containerId}' tidak ditemukan.`);
        return;
    }
    container.innerHTML = ''; // Clear existing legend items

    labels.forEach((label, index) => {
        const legendItem = document.createElement('div');
        legendItem.classList.add('legend-item');
        legendItem.innerHTML = `
            <span class="color-box" style="background-color: ${colors[index % colors.length]};"></span>
            <span class="text-label">${label}</span>
        `;
        container.appendChild(legendItem);
    });
}

/**
 * Helper function to get status color class for UI.
 * @param {string} status - The status string (e.g., 'Pending', 'Selesai').
 * @returns {string} Tailwind CSS class for the status color.
 */
function getStatusColorClass(status) {
    switch (status) {
        case 'Pending': return 'text-warning-600';
        case 'Dalam Proses': return 'text-primary-600';
        case 'Selesai': return 'text-accent-600'; 
        case 'Dibatalkan': return 'text-error-600';
        default: return 'text-neutral-600';
    }
}

/**
 * Mengatur logika untuk elemen toggle button tunggal (misal: Cover, AMR/Modem).
 * Tombol ini beralih antara status 'trueText' (aktif) dan 'Tidak' (non-aktif).
 * @param {HTMLElement} formContainer - Kontainer form tempat tombol berada.
 * @param {number} counter - ID unik untuk tombol ini.
 * @param {string} fieldId - ID dasar untuk input tersembunyi (misal: 'cover', 'amr-modem').
 * @param {string} [initialValue] - Nilai awal ('trueText' atau 'Tidak').
 * @param {string} [trueText='Ya'] - Teks yang ditampilkan pada tombol ketika aktif.
 */
function setupSingleToggleButtonLogic(formContainer, counter, fieldId, initialValue, trueText = 'Ya') {
    const hiddenInput = formContainer.querySelector(`#${fieldId}-${counter}`);
    const pillContainer = formContainer.querySelector(`#${fieldId}-radio-${counter}`);

    const updateVisual = (selectedValue) => {
        if (!pillContainer || !hiddenInput) return;

        // Clear existing content to avoid duplicates on re-render
        pillContainer.innerHTML = '';
        
        const label = document.createElement('label');
        label.classList.add('radio-pill-single-toggle', 'transition-all', 'duration-200', 'ease-in-out'); // Custom class for styling
        label.setAttribute('tabindex', '0'); // Make it focusable

        const radioInput = document.createElement('input');
        radioInput.type = 'radio';
        radioInput.name = `${fieldId}_option_${counter}`; // Unique name for radio group
        radioInput.value = trueText; // Only this value makes it active
        radioInput.classList.add('hidden'); // Hide the actual radio button

        const spanText = document.createElement('span');
        spanText.textContent = trueText;

        label.appendChild(radioInput);
        label.appendChild(spanText);

        if (selectedValue === trueText) {
            label.classList.remove('inactive');
            label.classList.add('active');
            radioInput.checked = true;
        } else {
            label.classList.remove('active');
            label.classList.add('inactive');
            radioInput.checked = false;
        }
        pillContainer.appendChild(label);
    };

    // Always set initial value for the hidden input based on initialValue
    hiddenInput.value = (initialValue === trueText) ? trueText : 'Tidak';

    // Handle click event on the pill container (delegated from the label)
    pillContainer.addEventListener('click', () => {
        if (hiddenInput.value === trueText) {
            // If currently active, set to 'Tidak' (inactive state)
            hiddenInput.value = 'Tidak';
        } else {
            // If currently inactive, set to trueText (active state)
            hiddenInput.value = trueText;
        }
        updateVisual(hiddenInput.value); // Re-render visual based on new value
        // Dispatch a custom change event on the hidden input for consistency
        const event = new Event('change');
        hiddenInput.dispatchEvent(event);
    });

    // Initial render when form loads
    updateVisual(hiddenInput.value);
}


/**
 * Mengatur logika untuk elemen radio pill dengan dua pilihan (misal: PB/PD, Cetak PK).
 * @param {HTMLElement} formContainer - Kontainer form tempat radio pill berada.
 * @param {number} counter - ID unik untuk grup radio ini.
 * @param {string} fieldId - ID dasar untuk input tersembunyi (misal: 'pb-pd').
 * @param {string} [initialValue] - Nilai awal yang akan dipilih.
 * @param {string} [option1Text='PB'] - Teks untuk opsi pertama.
 * @param {string} [option2Text='PD'] - Teks untuk opsi kedua.
 */
function setupDualPillLogic(formContainer, counter, fieldId, initialValue, option1Text = 'PB', option2Text = 'PD') {
    const radioGroupDiv = formContainer.querySelector(`#${fieldId}-radio-${counter}`);
    const hiddenInput = formContainer.querySelector(`#${fieldId}-${counter}`);

    const updateVisualAndHiddenInput = (selectedValue) => {
        if (!radioGroupDiv || !hiddenInput) return;

        hiddenInput.value = selectedValue; // Update the hidden input

        radioGroupDiv.querySelectorAll('.radio-pill').forEach(pillLabel => {
            const radio = pillLabel.querySelector('input[type="radio"]');
            if (radio.value === selectedValue) {
                pillLabel.classList.remove('inactive');
                pillLabel.classList.add('active');
                radio.checked = true;
            } else {
                pillLabel.classList.remove('active');
                pillLabel.classList.add('inactive');
                radio.checked = false;
            }
        });
        // Dispatch a custom change event on the hidden input
        const event = new Event('change');
        hiddenInput.dispatchEvent(event);
    };

    if (radioGroupDiv) {
        // Clear existing content to prevent duplicates on re-render
        radioGroupDiv.innerHTML = `
            <label class="radio-pill transition-all duration-200 ease-in-out">
                <input type="radio" name="${fieldId}_option_${counter}" value="${option1Text}" class="hidden"> ${option1Text}
            </label>
            <label class="radio-pill transition-all duration-200 ease-in-out">
                <input type="radio" name="${fieldId}_option_${counter}" value="${option2Text}" class="hidden"> ${option2Text}
            </label>
        `;

        // Listen to change event on the actual radio buttons within the labels
        radioGroupDiv.addEventListener('change', (event) => {
            if (event.target.type === 'radio' && event.target.name === `${fieldId}_option_${counter}`) {
                updateVisualAndHiddenInput(event.target.value);
            }
        });
        
        // Set initial state based on initialValue or default to option1Text
        updateVisualAndHiddenInput(initialValue || option1Text);
    }
}


/**
 * Mengatur logika untuk input file, termasuk drag-and-drop dan menampilkan nama file.
 * @param {HTMLElement} formContainer - Kontainer form tempat input file berada.
 * @param {number} counter - ID unik untuk input file ini.
 */
function setupFileUploadLogic(formContainer, counter) {
    const fileUploadContainer = formContainer.querySelector(`#fileUploadContainer-${counter}`);
    const fileInput = formContainer.querySelector(`#foto_pk-${counter}`);
    const fileNameDisplay = formContainer.querySelector(`#fileName-${counter}`);

    if (fileUploadContainer && fileInput && fileNameDisplay) {
        fileUploadContainer.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', () => {
            const file = fileInput.files[0];
            fileNameDisplay.textContent = file ? file.name : 'Belum ada file dipilih';
        });

        fileUploadContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadContainer.classList.add('border-primary-500', 'shadow-md');
        });
        fileUploadContainer.addEventListener('dragleave', () => {
            fileUploadContainer.classList.remove('border-primary-500', 'shadow-md');
        });
        fileUploadContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadContainer.classList.remove('border-primary-500', 'shadow-md');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                fileNameDisplay.textContent = files[0].name;
            }
        });
    }
}

/**
 * Fungsi untuk menampilkan pesan error global.
 * @param {string} message - Pesan error yang akan ditampilkan.
 */
function showGlobalError(message) {
    const globalErrorMessageDiv = document.getElementById('global-error-message');
    const globalErrorText = document.getElementById('global-error-text');
    if (globalErrorMessageDiv && globalErrorText) {
        globalErrorText.textContent = message;
        globalErrorMessageDiv.classList.remove('hidden');
        globalErrorMessageDiv.classList.add('flex'); 
        // Sembunyikan loader jika error global muncul
        document.getElementById('loader')?.classList.add('hidden');
    }
}
