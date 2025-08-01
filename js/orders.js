// =================================================
// BAGIAN 6: UI RENDERING (orders.js)
// =================================================

// Variabel untuk Debounce Search Input
let searchDebounceTimer;

/**
 * Memperbarui tampilan daftar semua order di halaman "All Orders".
 * Ini sekarang akan menampilkan SEMUA filteredOrders yang cocok.
 * Untuk 22.000 data, DOM rendering mungkin lambat.
 * Pertimbangkan Virtualisasi Daftar jika ini menjadi bottleneck.
 */
function updateAllOrdersDisplay() {
    const allOrdersList = document.getElementById('allOrdersList');
    if (!allOrdersList) return; // Pastikan elemen ada

    allOrdersList.innerHTML = ''; // Kosongkan container

    if (filteredOrders.length > 0) {
        const fragment = document.createDocumentFragment(); // Gunakan DocumentFragment untuk rendering yang lebih efisien

        filteredOrders.forEach(orderData => {
            const displayCard = document.createElement('div');
            displayCard.classList.add('input-card', 'bg-neutral-50', 'rounded-2xl', 'p-6', 'border', 'border-neutral-200', 'shadow-md', 'transition-all', 'duration-200', 'relative', 'flex', 'flex-col', 'hover:-translate-y-0.5', 'hover:shadow-lg');
            displayCard.setAttribute('data-order-id', orderData.id);

            displayCard.innerHTML = `
                <div class="card-actions absolute top-4 right-4 flex gap-2">
                    <button class="action-icon-btn edit-order-btn bg-primary-500 hover:bg-primary-600 text-white p-2 rounded-md text-sm shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md" data-order-id="${orderData.id}" title="Edit Order"><i class="fas fa-edit"></i></button>
                    <button class="action-icon-btn delete-server-btn bg-error-500 hover:bg-error-600 text-white p-2 rounded-md text-sm shadow-sm transition-all duration-200 hover:scale-110 hover:shadow-md" data-order-id="${orderData.id}" title="Hapus Order"><i class="fas fa-trash-alt"></i></button>
                </div>
                <div class="input-card-content flex flex-col">
                    <h4 class="order-id-short text-lg font-bold text-primary-600 mb-2 cursor-pointer" data-order-id="${orderData.id}">ID #${orderData.id}</h4>
                    <p class="text-neutral-600 text-sm leading-tight"><strong>Pelanggan:</strong> <span class="block text-neutral-800 font-medium">${orderData.namaPelanggan}</span></p>
                    <p class="text-neutral-600 text-sm leading-tight"><strong>ULP:</strong> <span class="block text-neutral-800 font-medium">${orderData.ulp}</span></p>
                    <p class="text-neutral-600 text-sm leading-tight"><strong>Tanggal Bayar:</strong> <span class="block text-neutral-800 font-medium">${orderData.tglBayar}</span></p>
                </div>
            `;
            fragment.appendChild(displayCard);
        });
        allOrdersList.appendChild(fragment); // Tambahkan semua kartu ke DOM dalam satu operasi

        const noAllOrdersData = document.getElementById('noAllOrdersData');
        if (noAllOrdersData) noAllOrdersData.style.display = 'none';
    } else {
        const noAllOrdersData = document.getElementById('noAllOrdersData');
        if (noAllOrdersData) noAllOrdersData.style.display = 'flex';
    }
}

/**
 * Fungsi untuk menampilkan detail order lengkap dalam bentuk popup (SweetAlert2).
 * @param {Object} orderData - Objek data order lengkap.
 */
function showOrderDetailPopup(orderData) {
    const detailHtml = `
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-left text-neutral-800">
            <p class="py-1"><strong>Nama Pelanggan:</strong> <span class="font-normal">${orderData.namaPelanggan}</span></p>
            <p class="py-1"><strong>ULP:</strong> <span class="font-normal">${orderData.ulp}</span></p>
            <p class="py-1"><strong>ID Pelanggan:</strong> <span class="font-normal">${orderData.idPelanggan}</span></p>
            <p class="py-1"><strong>No. Agenda:</strong> <span class="font-normal">${orderData.noAgenda || '-'}</span></p>
            <p class="py-1"><strong>Tanggal Bayar:</strong> <span class="font-normal">${orderData.tglBayar}</span></p>
            <p class="py-1"><strong>PB/PD:</strong> <span class="font-normal">${orderData.pbPd}</span></p>
            <p class="py-1"><strong>Tarif/Daya Lama:</strong> <span class="font-normal">${orderData.tarifDayaLama || '-'}</span></p>
            <p class="py-1"><strong>Tarif/Daya Baru:</strong> <span class="font-normal">${orderData.tarifDayaBaru}</span></p>
            <p class="py-1"><strong>Kebutuhan KWH:</strong> <span class="font-normal">${orderData.kebutuhanKwh || '-'}</span></p>
            <p class="py-1"><strong>Kebutuhan MCB:</strong> <span class="font-normal">${orderData.kebutuhanMcb || '-'}</span></p>
            <p class="py-1"><strong>Kebutuhan Box APP:</strong> <span class="font-normal">${orderData.kebutuhanBoxApp || '-'}</span></p>
            <p class="py-1"><strong>Kebutuhan Kabel:</strong> <span class="font-normal">${orderData.kebutuhanKabel || '-'}</span></p>
            <p class="py-1"><strong>Jumlah Kabel:</strong> <span class="font-normal">${orderData.jumlahKabel || '-'}</span></p>
            <p class="py-1"><strong>Cover:</strong> <span class="font-normal">${orderData.cover}</span></p>
            <p class="py-1"><strong>AMR/Modem:</strong> <span class="font-normal">${orderData.amrModem}</span></p>
            <p class="py-1"><strong>Conpres Qty (16-35mm²):</strong> <span class="font-normal">${orderData.conpresQty16_35}</span></p>
            <p class="py-1"><strong>Conpres Qty (16-35mm²) #2:</strong> <span class="font-normal">${orderData.conpresQty16_35_2 || '-'}</span></p>
            <p class="py-1"><strong>Conpres Qty (35-70mm²):</strong> <span class="font-normal">${orderData.conpresQty35_70}</span></p>
            <p class="py-1"><strong>Conpres Qty (35-70mm²) #2:</strong> <span class="font-normal">${orderData.conpresQty35_70_2 || '-'}</span></p>
            <p class="py-1"><strong>Segel:</strong> <span class="font-normal">${orderData.segel || '-'}</span></p>
            <p class="py-1"><strong>Cetak PK:</strong> <span class="font-normal">${orderData.cetakPk}</span></p>
            <p class="col-span-full py-1"><strong>Alamat Lengkap:</strong> <span class="font-normal">${orderData.alamat || '-'}</span></p>
            <p class="col-span-full py-1"><strong>Keterangan:</strong> <span class="font-normal">${orderData.keterangan || '-'}</span></p>
            <p class="col-span-full py-1"><strong>Status Order:</strong> <span class="font-bold ${getStatusColorClass(orderData.status)}">${orderData.status}</span></p>
            <p class="col-span-full py-1"><strong>Foto PK:</strong> 
                ${orderData.fotoPk && orderData.fotoPk !== 'Tidak ada foto'
                    ? `<a href="${orderData.fotoPk}" target="_blank" rel="noopener noreferrer" onclick="event.preventDefault(); Swal.fire({ title: 'Foto PK', imageUrl: '${orderData.fotoPk}', imageAlt: 'Foto PK', imageHeight: 'auto', confirmButtonText: 'Tutup', confirmButtonColor: '#4f46e5', background: '#f9fafb', customClass: { popup: 'swal2-popup', title: 'swal2-title', confirmButton: 'swal2-confirm' } });">Lihat Foto (${orderData.fotoPk.split('/').pop()})</a>`
                    : 'Tidak ada foto'
                }
            </p>
            <p class="py-1"><strong>Dibuat Pada:</strong> <span class="font-normal">${new Date(orderData.createdAt).toLocaleString()}</span></p>
            <p class="py-1"><strong>Diupdate Pada:</strong> <span class="font-normal">${orderData.updatedAt ? new Date(orderData.updatedAt).toLocaleString() : '-'}</span></p>
        </div>
    `;

    Swal.fire({
        title: `Detail Order #${orderData.id}`,
        html: detailHtml,
        icon: 'info',
        width: '90%',
        confirmButtonText: 'Tutup',
        confirmButtonColor: '#4f46e5',
        customClass: {
            popup: 'swal2-popup',
            title: 'swal2-title',
            htmlContainer: 'swal2-html-container',
            confirmButton: 'swal2-confirm'
        },
        background: '#ffffff'
    });
}

/**
 * Memperbarui opsi filter di halaman "All Orders".
 */
function updateFilterOptions() {
    const filterUlpSelect = document.getElementById('filterUlp');
    if (!filterUlpSelect) return;

    const currentUlpValue = choicesInstances['filterUlp'] ? choicesInstances['filterUlp'].getValue(true) : filterUlpSelect.value;

    if (choicesInstances['filterUlp']) {
        choicesInstances['filterUlp'].destroy();
        delete choicesInstances[filterUlpSelect.id];
    }

    while (filterUlpSelect.options.length > 1) {
        filterUlpSelect.remove(1);
    }

    if (loadedOptions.ulp && loadedOptions.ulp.length > 0) {
        loadedOptions.ulp.forEach(ulp => {
            const option = document.createElement('option');
            option.value = ulp;
            option.textContent = ulp;
            filterUlpSelect.appendChild(option);
        });
    }

    choicesInstances['filterUlp'] = new Choices(filterUlpSelect, {
        shouldSort: false,
        itemSelectText: '',
        placeholder: true,
        placeholderValue: 'Pilih ULP'
    });

    if (currentUlpValue) {
        choicesInstances['filterUlp'].setChoiceByValue(currentUlpValue);
    }
}

/**
 * Menerapkan filter ke daftar order dan memperbarui tampilan.
 * Ini dipanggil pada:
 * 1. Navigasi ke halaman "Orders".
 * 2. Perubahan pada input pencarian (real-time, dengan debounce).
 * 3. Perubahan pada filter ULP (real-time).
 * 4. Klik tombol "Reset Filter".
 */
function applyFilters() {
    const filterSearchInput = document.getElementById('filterSearch');
    const filterUlpSelect = document.getElementById('filterUlp');

    const searchTerm = filterSearchInput ? filterSearchInput.value.toLowerCase() : '';
    const selectedUlp = filterUlpSelect && choicesInstances['filterUlp'] ? choicesInstances['filterUlp'].getValue(true) : '';

    filteredOrders = allOrders.filter(order => {
        const matchesSearch = searchTerm === '' ||
            order.namaPelanggan.toLowerCase().includes(searchTerm) ||
            order.idPelanggan.toLowerCase().includes(searchTerm) ||
            (order.noAgenda && order.noAgenda.toLowerCase().includes(searchTerm)) ||
            // >>>>>>>>>>>>>>> TAMBAHKAN KOLOM LAIN YANG MUNGKIN MENGANDUNG KATA KUNCI PENCARIAN DI SINI <<<<<<<<<<<<<<<
            (order.alamat && order.alamat.toLowerCase().includes(searchTerm)) ||
            (order.keterangan && order.keterangan.toLowerCase().includes(searchTerm)) ||
            (order.pbPd && order.pbPd.toLowerCase().includes(searchTerm)); // Contoh lain

        const matchesUlp = selectedUlp === '' || (order.ulp && order.ulp === selectedUlp);
        return matchesSearch && matchesUlp;
    });

    updateAllOrdersDisplay();
}

/**
 * Mereset semua filter ke nilai default.
 */
function resetFilters() {
    const filterSearchInput = document.getElementById('filterSearch');
    const filterUlpSelect = document.getElementById('filterUlp');

    if (filterSearchInput) {
        filterSearchInput.value = '';
    }
    if (filterUlpSelect && choicesInstances['filterUlp']) {
        choicesInstances['filterUlp'].setChoiceByValue('');
    }
    applyFilters(); // Re-apply filters with cleared values
}

/**
 * Mengekspor semua data order ke file XLSX melalui API backend.
 */
async function exportXlsx() {
    if (allOrders.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Tidak Ada Data!',
            text: 'Tidak ada order yang tersedia untuk diekspor ke Excel.',
            confirmButtonColor: '#4f46e5'
        });
        return;
    }

    Swal.fire({
        title: 'Mengekspor Data...',
        text: 'Harap tunggu, proses ekspor mungkin membutuhkan waktu.',
        icon: 'info',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const response = await fetch(`${API_BASE_URL}/api/orders/export-xlsx`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ekspor gagal di server: ${response.status} - ${errorText}`);
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        a.download = `Data_Orders_${dateStr}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        Swal.fire({
            icon: 'success',
            title: 'Ekspor Berhasil!',
            text: 'Data order telah berhasil diekspor ke file Excel.',
            confirmButtonColor: '#10b981'
        });
    } catch (error) {
        console.error('Error exporting XLSX:', error);
        Swal.fire({
            icon: 'error',
            title: 'Ekspor Gagal!',
            text: `Terjadi kesalahan saat mengekspor data: ${error.message}. Pastikan server backend berjalan dan data valid.`,
            confirmButtonColor: '#ef4444'
        });
    }
}

/**
 * Menghapus data order dari backend.
 * @param {number} orderId - ID order yang akan dihapus.
 */
async function deleteOrder(orderId) {
    Swal.fire({
        title: 'Anda yakin?',
        text: `Anda akan menghapus data order #${orderId} dari server. Aksi ini tidak dapat dibatalkan!`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, { method: 'DELETE' });
                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
                    throw new Error(`Gagal menghapus order di server: ${response.status} - ${errorBody.message || 'Respons tidak valid'}`);
                }

                Swal.fire(
                    'Dihapus!',
                    'Order berhasil dihapus.',
                    'success'
                );
                await fetchOrders(); // Gunakan fetchOrders dari global.js untuk memuat ulang semua data
                applyFilters(); // Re-apply filters untuk memperbarui daftar
                renderCharts(); // Render ulang chart untuk merefleksikan data baru
            } catch (error) {
                console.error("Error deleting order:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Menghapus!',
                    text: `Gagal menghapus order dari server: ${error.message}. Pastikan server backend berjalan.`,
                    confirmButtonColor: '#ef4444'
                });
            }
        }
    });
}

// Inisialisasi Event Listeners setelah DOM siap
document.addEventListener('DOMContentLoaded', () => {
    const filterSearchInput = document.getElementById('filterSearch');
    const filterUlpSelect = document.getElementById('filterUlp');
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    const exportXlsxBtn = document.getElementById('exportXlsxBtn');

    // Event listener untuk search input dengan debounce
    if (filterSearchInput) {
        filterSearchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                applyFilters();
            }, 300); // Debounce 300ms
        });
    }

    // Event listener untuk filter ULP (Choices.js akan memicu event 'change' pada elemen aslinya)
    if (filterUlpSelect) {
        filterUlpSelect.addEventListener('change', applyFilters);
    }

    // Event listener untuk tombol reset filter
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', resetFilters);
    }

    // Event listener untuk tombol export XLSX
    if (exportXlsxBtn) {
        exportXlsxBtn.addEventListener('click', exportXlsx);
    }

    // Event delegation untuk tombol edit dan delete
    document.getElementById('allOrdersList')?.addEventListener('click', (event) => {
        const target = event.target;
        const editBtn = target.closest('.edit-order-btn');
        const deleteBtn = target.closest('.delete-server-btn');
        const orderIdShort = target.closest('.order-id-short');

        if (editBtn) {
            const orderId = editBtn.dataset.orderId;
            const orderToEdit = allOrders.find(o => o.id === orderId);
            if (orderToEdit) {
                // Asumsi ada fungsi editOrder (mungkin dari form.js)
                editOrder(orderToEdit);
            }
        } else if (deleteBtn) {
            const orderId = deleteBtn.dataset.orderId;
            deleteOrder(orderId);
        } else if (orderIdShort) {
            const orderId = orderIdShort.dataset.orderId;
            const orderData = allOrders.find(order => order.id === orderId);
            if (orderData) {
                showOrderDetailPopup(orderData);
            }
        }
    });

    // Panggil applyFilters saat DOM siap untuk menampilkan data awal
    applyFilters();
});