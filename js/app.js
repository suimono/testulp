

document.addEventListener('DOMContentLoaded', () => {
    // === Selektor Elemen ===
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page-content');
    const addOrderBtn = document.getElementById('add-order-btn');
    const dynamicOrderInputs = document.getElementById('dynamicOrderInputs');
    const exportBtn = document.getElementById('export-xlsx-btn');
    const loader = document.getElementById('loader');
    const reloadAppBtn = document.getElementById('reload-app-btn'); 

    // Filter elements
    const filterSearchInput = document.getElementById('filterSearch');
    const filterUlpSelect = document.getElementById('filterUlp');

    const resetFilterBtn = document.getElementById('resetFilterBtn');
    const resetAllOrdersBtn = document.getElementById('resetAllOrdersBtn'); 

    // Event listener for the global reload button
    if (reloadAppBtn) {
        reloadAppBtn.addEventListener('click', () => {
            window.location.reload(); // Simply reload the page
        });
    }

    /**
     * Fungsi untuk menavigasi antar halaman aplikasi.
     * @param {string} targetPageId - ID halaman tujuan.
     * @param {HTMLElement} [navLinkElement] - Elemen navigasi yang diklik (opsional).
     */
    function navigateToPage(targetPageId, navLinkElement) {
        // Hapus kelas 'active' dari semua nav-link
        navLinks.forEach(nav => {
            nav.classList.remove('active');
            nav.querySelector('i')?.classList.remove('scale-105'); 
            // Pastikan warna teks netral untuk tautan tidak aktif
            nav.classList.remove('text-primary-600');
            nav.classList.add('text-neutral-600'); 
        });

        // Tambahkan kelas 'active' ke nav-link yang diklik
        if (navLinkElement) {
            navLinkElement.classList.add('active');
            navLinkElement.querySelector('i')?.classList.add('scale-105'); 
            // Set warna teks untuk tautan aktif
            navLinkElement.classList.remove('text-neutral-600');
            navLinkElement.classList.add('text-primary-600'); 
        } else {
            // Fallback jika navLinkElement tidak disediakan (misal: navigasi langsung)
            const correspondingNavLink = document.querySelector(`.nav-link[data-page="${targetPageId}"]`);
            if (correspondingNavLink) {
                correspondingNavLink.classList.add('active');
                correspondingNavLink.querySelector('i')?.classList.add('scale-105');
                correspondingNavLink.classList.remove('text-neutral-600');
                correspondingNavLink.classList.add('text-primary-600');
            }
        }

        // Sembunyikan semua halaman konten dan tampilkan yang sesuai
        pages.forEach(page => {
            page.classList.add('hidden');
            page.classList.remove('active'); 
        });
        const activePage = document.getElementById(targetPageId);
        if (activePage) {
            activePage.classList.remove('hidden');
            activePage.classList.add('active'); 
            // Re-trigger fadeIn animation
            activePage.classList.remove('animate-fadeIn');
            void activePage.offsetWidth; // Trigger reflow
            activePage.classList.add('animate-fadeIn');
        }

        // Panggil fungsi spesifik halaman jika diperlukan
        if (targetPageId === 'dashboard') {
            loadDashboardData(); // Memuat data dashboard dan merender chart
        } else if (targetPageId === 'all-orders') {
            applyFilters(); // Memuat order dan menerapkan filter
        } else if (targetPageId === 'manage-options') {
            loadOptionsAndRefreshUI(); // Memuat opsi dan merender daftar opsi
            renderAllOptionLists(); // Render current options when page is opened
        }
        // Update URL hash
        window.location.hash = targetPageId;
    }

    // === Logika Navigasi/Tab ===
    navLinks.forEach(link => {
        link.addEventListener('click', async (event) => { 
            const targetPageId = link.getAttribute('data-page');

            if (targetPageId === 'manage-options') {
                event.preventDefault(); // Prevent default navigation

                const { value: password } = await Swal.fire({
                    title: 'Masukkan Password Admin',
                    input: 'password',
                    inputPlaceholder: 'Password',
                    inputAttributes: {
                        autocapitalize: 'off',
                        autocorrect: 'off'
                    },
                    showCancelButton: true,
                    confirmButtonText: 'Masuk',
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
                        const response = await fetch(`${API_BASE_URL}/api/admin/verify-password`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ password: password })
                        });

                        if (response.ok) {
                            Swal.fire({
                                icon: 'success',
                                title: 'Berhasil!',
                                text: 'Akses diberikan.',
                                showConfirmButton: false,
                                timer: 1000,
                                timerProgressBar: true
                            });
                            navigateToPage(targetPageId, link); // Navigate after success
                        } else {
                            const errorBody = await response.json().catch(() => ({ message: 'Verifikasi gagal' }));
                            Swal.fire({
                                icon: 'error',
                                title: 'Akses Ditolak!',
                                text: `Password salah. ${errorBody.message}`,
                                confirmButtonColor: '#ef4444' 
                            });
                        }
                    } catch (error) {
                        console.error("Error verifying admin password for navigation:", error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Kesalahan Jaringan!',
                            text: 'Tidak dapat terhubung ke server untuk verifikasi password.',
                            confirmButtonColor: '#ef4444' 
                        });
                    }
                }
                return; 
            }

            // Existing navigation logic for other pages
            navigateToPage(targetPageId, link);
        });
    });

    // === Logika Tambah Form Order Baru ===
    if (addOrderBtn) {
        addOrderBtn.addEventListener('click', () => {
            // Periksa apakah ada form edit yang sedang terbuka (memiliki data-order-id)
            if (dynamicOrderInputs && dynamicOrderInputs.querySelector('.dynamic-input-form[data-order-id]')) {
                Swal.fire({
                    icon: 'info',
                    title: 'Form Edit Terbuka!',
                    text: 'Harap selesaikan atau batalkan proses edit order sebelum menambahkan form baru.',
                    confirmButtonColor: '#4f46e5' 
                });
                return; 
            }
            localIdCounter++;
            renderOrderForm(localIdCounter, dynamicOrderInputs);
        });
    }

    // === Logika Ekspor ===
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            const { value: password } = await Swal.fire({
                title: 'Masukkan Password untuk Ekspor',
                input: 'password',
                inputPlaceholder: 'Password',
                inputAttributes: {
                    autocapitalize: 'off',
                    autocorrect: 'off'
                },
                showCancelButton: true,
                confirmButtonText: 'Ekspor',
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
                    const response = await fetch(`${API_BASE_URL}/api/admin/verify-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password: password })
                    });

                    if (response.ok) {
                        exportXlsx(); // Call export function if password is correct
                    } else {
                        const errorBody = await response.json().catch(() => ({ message: 'Verifikasi gagal' }));
                        Swal.fire({
                            icon: 'error',
                            title: 'Akses Ditolak!',
                            text: `Password salah. ${errorBody.message}`,
                            confirmButtonColor: '#ef4444' 
                        });
                    }
                } catch (error) {
                    console.error("Error verifying admin password for export:", error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Kesalahan Jaringan!',
                        text: 'Tidak dapat terhubung ke server untuk verifikasi password.',
                        confirmButtonColor: '#ef4444' 
                    });
                }
            }
        });
    }

    // === Logika Filter Order ===
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', resetFilters);
    }
    if (filterSearchInput) {
        filterSearchInput.addEventListener('input', () => {
            applyFilters();
        });
    }
    if (filterUlpSelect) {
        // Use 'change' event for Choices.js managed select
        filterUlpSelect.addEventListener('change', () => {
             applyFilters();
        });
    }

    // === Logika Reset All Orders ===
    if (resetAllOrdersBtn) {
        resetAllOrdersBtn.addEventListener('click', resetAllOrders);
    }


    // === Event Delegation untuk Tombol Dinamis ===
    document.body.addEventListener('click', async (event) => {
        const target = event.target.closest('button, .order-id-short'); // Include .order-id-short for popup
        if (!target) return;

        // Save/Update Order Button
        if (target.classList.contains('save-btn')) {
            const formContainer = target.closest('.dynamic-input-form');
            const orderId = formContainer.getAttribute('data-order-id') ? parseInt(formContainer.getAttribute('data-order-id')) : null;
            // Find the original order data if it's an edit to pass to saveOrder for fotoPk handling
            const orderDataToEdit = isNaN(orderId) ? null : allOrders.find(order => order.id === orderId);
            await saveOrder(orderId, formContainer, orderDataToEdit);
        }

        // Delete Form Only Button (for new forms not yet saved)
        if (target.classList.contains('delete-form-btn')) {
            const localId = target.getAttribute('data-local-id');
            const formContainer = target.closest('.dynamic-input-form');
            if (localId && formContainer) {
                deleteFormOnly(localId, formContainer);
            }
        }

        // Cancel Edit Button (for forms in edit mode)
        if (target.classList.contains('cancel-edit-btn')) {
            const formContainer = target.closest('.dynamic-input-form');
            if (formContainer) {
                Swal.fire({
                    title: 'Batalkan Edit?',
                    text: 'Perubahan Anda tidak akan disimpan. Lanjutkan?',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#ef4444', 
                    cancelButtonColor: '#6b7280', 
                    confirmButtonText: 'Ya, Batalkan!',
                    cancelButtonText: 'Lanjutkan Edit'
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Hancurkan instance Choices.js yang terkait dengan form ini
                        formContainer.querySelectorAll('.choices-select').forEach(selectElement => {
                            if (choicesInstances[selectElement.id]) {
                                choicesInstances[selectElement.id].destroy();
                                delete choicesInstances[selectElement.id];
                            }
                        });
                        formContainer.remove();
                        // Navigate back to All Orders or re-apply filters if already there
                        const allOrdersNav = document.querySelector('.nav-link[data-page="all-orders"]');
                        if (allOrdersNav && document.getElementById('all-orders').classList.contains('hidden')) {
                            allOrdersNav.click();
                        } else {
                            applyFilters(); // Just refresh the list if on the same page
                        }
                    }
                });
            }
        }

        // Delete Order from Server Button
        if (target.classList.contains('delete-server-btn')) {
            const orderId = target.getAttribute('data-order-id');
            if (orderId) {
                await deleteOrder(parseInt(orderId));
            }
        }

        // Edit Order Button (from All Orders list)
        if (target.classList.contains('edit-order-btn')) {
            const orderId = parseInt(target.getAttribute('data-order-id'));
            const orderToEdit = allOrders.find(order => order.id === orderId);

            if (orderToEdit) {
                // Hapus semua form yang ada sebelum merender form edit
                document.querySelectorAll('.dynamic-input-form').forEach(form => {
                    // Hancurkan Choices.js instance sebelum menghapus form
                    form.querySelectorAll('.choices-select').forEach(selectElement => {
                        if (choicesInstances[selectElement.id]) {
                            choicesInstances[selectElement.id].destroy();
                            delete choicesInstances[selectElement.id];
                        }
                    });
                    form.remove();
                });
                const orderSheetNav = document.querySelector('.nav-link[data-page="order-sheet"]');
                if (orderSheetNav) {
                    orderSheetNav.click(); // Navigasi ke halaman Order Sheet
                }
                renderOrderForm(orderId, dynamicOrderInputs, orderToEdit);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Order Tidak Ditemukan!',
                    text: 'Data order yang ingin diedit tidak ditemukan.',
                    confirmButtonColor: '#ef4444' 
                });
            }
        }

        // NEW: Event listeners for 'Add Option' buttons
        if (target.classList.contains('add-option-btn')) {
            const category = target.dataset.category;
            const inputId = `add${category.charAt(0).toUpperCase() + category.slice(1)}Input`; 
            await addOption(category, inputId);
        }

        // NEW: Event listener for 'Remove Option' chips (delegated to parent container)
        if (target.classList.contains('remove-chip-btn')) {
            const category = target.dataset.category;
            const value = target.dataset.value;
            await deleteOption(category, value);
        }

        // === Logika Tampilkan Detail Order (Popup) ===
        if (target.classList.contains('order-id-short')) {
            const orderId = parseInt(target.getAttribute('data-order-id'));
            const orderData = allOrders.find(order => order.id === orderId);
            if (orderData) {
                showOrderDetailPopup(orderData);
            }
        }
    });

    // === Inisialisasi Aplikasi ===
    async function initializeApp() {
        showLoader(); // Tampilkan loader di awal inisialisasi
        try {
            await loadOptionsAndRefreshUI(); // Load options first so dropdowns are populated
            await fetchOrders(); // Then load orders

            // Determine initial page based on URL hash or default to dashboard
            const initialPageHash = window.location.hash.substring(1);
            const defaultNavLink = document.querySelector('.nav-link[data-page="dashboard"]');
            let targetNavLink = defaultNavLink;

            if (initialPageHash) {
                const navLinkFromHash = document.querySelector(`.nav-link[data-page="${initialPageHash}"]`);
                if (navLinkFromHash) {
                    targetNavLink = navLinkFromHash;
                }
            }
            // Programmatically click the determined nav link to show the page
            if (targetNavLink) {
                navigateToPage(targetNavLink.getAttribute('data-page'), targetNavLink);
            } else {
                navigateToPage(defaultNavLink.getAttribute('data-page'), defaultNavLink); // Fallback to dashboard if something went wrong
            }

        } catch (error) {
            console.error("Error during app initialization:", error);
            // Tampilkan error global jika terjadi masalah kritis saat inisialisasi
            showGlobalError(`Aplikasi gagal dimuat. Server mungkin tidak berjalan atau ada masalah koneksi: ${error.message}.`);
        } finally {
            setTimeout(() => {
                hideLoader(); // Sembunyikan loader setelah inisialisasi selesai
            }, 500); // Tunda sedikit agar animasi terlihat
        }
    }

    initializeApp();
});
