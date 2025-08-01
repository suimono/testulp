// =================================================
// BAGIAN 3: CHART RENDERING & DATA PROCESSING (dashboard.js)
// =================================================

// ulpChartInstance is declared in global.js and accessible here.

/**
 * Memperbarui kartu ringkasan di dashboard (Total Forms, Pending, Completed).
 */
function updateSummaryCards() {
    console.log("updateSummaryCards: Memulai perhitungan ringkasan.");
    const totalFormsFilledElement = document.getElementById('totalFormsFilled');
    const totalPendingOrdersElement = document.getElementById('totalPendingOrders');
    const totalCompletedOrdersElement = document.getElementById('totalCompletedOrders');

    // NOTE: 'totalInProgressOrdersElement' dihapus dari HTML, jadi tidak perlu lagi di sini.
    // Pastikan elemen ada sebelum mencoba menggunakannya
    if (!totalFormsFilledElement || !totalPendingOrdersElement || !totalCompletedOrdersElement) {
        console.warn("updateSummaryCards: Satu atau lebih elemen kartu ringkasan tidak ditemukan.");
        return;
    }

    const totalOrders = allOrders.length;
    
    // Perbaikan: Pastikan perbandingan status sudah benar dan konsisten
    // Menggunakan .toLowerCase() untuk perbandingan yang tidak case-sensitive
    const pendingOrders = allOrders.filter(order => (order.status ?? '').toLowerCase() === 'pending').length;
    const completedOrders = allOrders.filter(order => (order.status ?? '').toLowerCase() === 'selesai').length;
    
    console.log(`updateSummaryCards: Hasil perhitungan:`);
    console.log(`  Total Orders: ${totalOrders}`);
    console.log(`  Pending Orders: ${pendingOrders}`);
    console.log(`  Completed Orders: ${completedOrders}`);


    totalFormsFilledElement.textContent = totalOrders;
    totalPendingOrdersElement.textContent = pendingOrders;
    totalCompletedOrdersElement.textContent = completedOrders;
}


/**
 * Merender grafik distribusi order per ULP di halaman dashboard.
 * Memastikan chart dihancurkan dan dibuat ulang untuk menghindari duplikasi
 * dan memperbarui data dengan benar.
 */
function renderCharts() {
    const ulpChartCanvas = document.getElementById('ulpChart');
    const noChartData = document.getElementById('noChartData');

    // Destroy existing chart instance before creating a new one
    if (ulpChartInstance) {
        ulpChartInstance.destroy();
    }

    // Check if canvas element exists and if there's any order data
    if (!ulpChartCanvas || allOrders.length === 0) {
        if (ulpChartCanvas) ulpChartCanvas.style.display = 'none';
        if (noChartData) noChartData.style.display = 'flex'; // Show message if no data
        return;
    }

    // Ensure canvas is visible and no data message is hidden if data exists
    ulpChartCanvas.style.display = 'block';
    if (noChartData) noChartData.style.display = 'none';

    // Aggregate data for ULP Chart
    const ulpCounts = {};
    allOrders.forEach(order => {
        // Ensure ULP is a string and convert to uppercase for consistency
        const ulp = order.ulp ? String(order.ulp).toUpperCase() : 'UNKNOWN ULP';
        ulpCounts[ulp] = (ulpCounts[ulp] || 0) + 1;
    });
    const ulpLabels = Object.keys(ulpCounts);
    const ulpData = Object.values(ulpCounts);

    // Define a modern, clean, and professional color palette for doughnut chart segments
    const segmentColors = [
        '#4F46E5', // Primary-500 (Indigo)
        '#14B8A6', // Accent-500 (Teal)
        '#8B5CF6', // Violet 500
        '#F59E0B', // Warning-500 (Amber)
        '#EF4444', // Error-500 (Red)
        '#3B82F6', // Info-500 (Blue)
        '#10B981', // Success-500 (Green)
        '#DC2626', // Red 600
        '#6D28D9', // Violet 700
        '#0D9488', // Teal 600
        '#FBBF24', // Amber 400
        '#60A5FA', // Blue 400
    ];

    // Initialize and render the ULP Doughnut Chart
    ulpChartInstance = new Chart(ulpChartCanvas, {
        type: 'doughnut', // Chart type remains doughnut
        data: {
            labels: ulpLabels,
            datasets: [{
                label: 'Jumlah Order',
                data: ulpData,
                backgroundColor: ulpLabels.map((_, i) => segmentColors[i % segmentColors.length]),
                borderColor: '#F9FAFB', // Light background color for borders between segments (white)
                borderWidth: 2, // Border width for segments
                hoverOffset: 10, // Reduced offset on hover for a more subtle effect
                hoverBorderColor: '#D1D5DB', // Neutral grey for hover border
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Allow chart to resize freely
            animation: {
                duration: 800, // Duration in milliseconds
                easing: 'easeInOutQuad' // Smooth easing function
            },
            plugins: {
                legend: {
                    display: false, // Set to false to hide Chart.js built-in legend
                },
                title: {
                    display: true,
                    text: '', // Title text removed (already in HTML)
                    font: {
                        size: 24,
                        weight: 'bold',
                        family: 'Poppins, sans-serif'
                    },
                    color: '#1F2937',
                    padding: {
                        top: 15,
                        bottom: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((sum, current) => sum + current, 0);
                            const percentage = ((value / total) * 100).toFixed(2);
                            return ` ${label}: ${value} (${percentage}%)`;
                        },
                        title: (context) => {
                            return context.label;
                        }
                    },
                    backgroundColor: 'rgba(55, 65, 81, 0.95)',
                    titleColor: '#F9FAFB',
                    bodyColor: '#E5E7EB',
                    borderColor: '#6B7280',
                    borderWidth: 2,
                    cornerRadius: 8,
                    padding: 12,
                    displayColors: false,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 12 }
                },
                datalabels: {
                    color: '#1F2937',
                    font: {
                        size: 12,
                        weight: 'bold',
                        family: 'Inter, sans-serif'
                    },
                    formatter: (value, context) => {
                        const total = context.chart.data.datasets[0].data.reduce((sum, val) => sum + val, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${value}\n(${percentage}%)`;
                    },
                    anchor: 'center',
                    align: 'center',
                    offset: 0,
                    display: 'auto',
                    backgroundColor: 'rgba(249, 250, 251, 0.8)',
                    borderRadius: 4,
                    padding: {
                        top: 4,
                        bottom: 4,
                        left: 6,
                        right: 6
                    },
                    textShadowOffsetX: 1,
                    textShadowOffsetY: 1,
                    textShadowColor: 'rgba(0, 0, 0, 0.3)'
                }
            },
            cutout: '70%',
            layout: {
                padding: {
                    left: 10,
                    right: 10,
                    top: 10,
                    bottom: 10
                }
            },
        }
    });

    // Render the custom HTML legend
    renderCustomLegend(ulpLabels, segmentColors, 'customLegendItems');
}

// =================================================
// Fungsi untuk memuat data dashboard
// =================================================

/**
 * Memuat semua data order dari backend dan memperbarui tampilan dashboard,
 * termasuk jumlah form terisi dan grafik ULP.
 */
async function loadDashboardData() {
    // showLoader() dan hideLoader() dipanggil di app.js untuk transisi halaman
    try {
        // Ambil semua order dari backend (ini akan mengisi 'allOrders' di global.js)
        await fetchOrders(); 

        // 1. Update kartu ringkasan
        updateSummaryCards();

        // 2. Render chart ULP
        renderCharts();

    } catch (error) {
        console.error("Gagal memuat data dashboard:", error);
        // showGlobalError() dipanggil di app.js jika ada error di level page load
    }
}

// Expose to global scope
window.loadDashboardData = loadDashboardData;
