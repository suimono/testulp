const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const ExcelJS = require('exceljs');
const multer = require('multer');
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 3000; // Use process.env.PORT for flexibility

const ORDERS_FILE = path.join(__dirname, 'orders.json');
const OPTIONS_FILE = path.join(__dirname, 'db.json'); // Menggunakan db.json untuk options
const UPLOADS_DIR = path.join(__dirname, 'uploads'); // Direktori untuk menyimpan file yang diunggah

// Dapatkan password admin dari environment variable
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'default_admin_password';

// Definisikan struktur default untuk opsi dropdown
const defaultOptionsStructure = {
    options: {
        ulp: [],
        tarifDaya: [],
        kebutuhanKwh: [],
        kebutuhanMcb: [],
        kebutuhanBoxApp: [],
        kebutuhanKabel: []
    }
};

// Pastikan direktori 'uploads' ada untuk multer
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

app.use(cors());
app.use(bodyParser.json());

// --- START: ADDED/MODIFIED FOR SERVING FRONTEND STATIC FILES ---

// 1. Serve static files from the 'js' directory
//    This tells Express to look inside the 'js' folder when a request
//    comes in for something like /js/global.js
app.use('/js', express.static(path.join(__dirname, 'js')));

// 2. Serve static files from the root directory for HTML and other assets
//    This will serve my_frontend_app.html and any CSS files if they are directly in the root.
app.use(express.static(__dirname));

// 3. Specific route for the root URL to serve your main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'my_frontend_app.html'));
});

// --- END: ADDED/MODIFIED FOR SERVING FRONTEND STATIC FILES ---

// Tambahkan middleware untuk melayani file statis (gambar) dari folder 'uploads'
app.use('/uploads', express.static(UPLOADS_DIR));


// Konfigurasi Multer untuk upload file (misalnya foto_pk)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR); // Pastikan folder 'uploads' ada
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + '-' + path.basename(file.originalname, ext) + ext);
    }
});
const upload = multer({ storage: storage });

// Warna tema untuk styling Excel, disesuaikan agar lebih netral dan modern
const THEME_COLOR = {
    HEADER_BG: 'FF4338CA', // primary-700 (Biru Ungu lebih gelap) untuk kesan elegan
    HEADER_FONT: 'FFFFFFFF', // Putih
    BORDER_COLOR: 'FFC7D2FE', // primary-200 (Biru Ungu terang)
    SHEET_TAB: 'FF059669', // accent-600 (Hijau Emerald)
    ODD_ROW_BG: 'FFFFFFFF', // Putih
    EVEN_ROW_BG: 'FFF8FAFB', // neutral-50 (Abu-abu sangat terang untuk sedikit perbedaan)
    FONT_COLOR: 'FF374151' // neutral-700
};

// Fungsi utilitas untuk membaca dan menulis JSON
async function readJsonFile(filePath, defaultData) {
    try {
        const data = await fsp.readFile(filePath, 'utf8');
        if (!data.trim()) {
            console.log(`[readJsonFile] File ${path.basename(filePath)} kosong. Menulis data default.`);
            await fsp.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
            return defaultData;
        }
        const parsedData = JSON.parse(data);
        // --- DIAGNOSTIC LOG START ---
        if (parsedData.orders && !Array.isArray(parsedData.orders)) {
            console.warn(`[readJsonFile] Properti 'orders' di ${path.basename(filePath)} bukan array. Mengatur ke array kosong.`);
            parsedData.orders = [];
        }
        console.log(`[readJsonFile] Berhasil membaca ${path.basename(filePath)}. Ukuran data: ${parsedData.orders ? parsedData.orders.length : 'N/A'}. ID pertama/terakhir (jika ada): ${parsedData.orders && parsedData.orders.length > 0 ? parsedData.orders[0].id + '...' + parsedData.orders[parsedData.orders.length - 1].id : 'N/A'}`);
        // --- DIAGNOSTIC LOG END ---
        return parsedData;
    } catch (error) {
        if (error.code === 'ENOENT' || error instanceof SyntaxError) {
            console.warn(`[readJsonFile] File ${path.basename(filePath)} tidak ditemukan atau JSON tidak valid. Membuat dengan data default.`);
            await fsp.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
            return defaultData;
        }
        throw new Error(`Error reading or parsing ${path.basename(filePath)}: ${error.message}`);
    }
}

async function writeJsonFile(filePath, data) {
    try {
        await fsp.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        // --- DIAGNOSTIC LOG START ---
        console.log(`[writeJsonFile] Berhasil menulis ke ${path.basename(filePath)}. Ukuran data: ${data.orders ? data.orders.length : 'N/A'}. ID pertama/terakhir (jika ada): ${data.orders && data.orders.length > 0 ? data.orders[0].id + '...' + data.orders[data.orders.length - 1].id : 'N/A'}`);
        // --- DIAGNOSTIC LOG END ---
    } catch (error) {
        throw new Error(`Error writing to ${path.basename(filePath)}: ${error.message}`);
    }
}

// Fungsi styling Excel
function applyModernExcelStyling(worksheet, columnConfig) {
    worksheet.columns = columnConfig.map(col => ({
        header: col.header,
        key: col.key,
        width: col.width,
        style: {
            font: { name: 'Segoe UI', size: 10, color: { argb: THEME_COLOR.FONT_COLOR } },
            alignment: { horizontal: 'center', vertical: 'middle', wrapText: true }
        }
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;

    columnConfig.forEach((col, index) => {
        const cell = headerRow.getCell(index + 1);
        
        cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: THEME_COLOR.HEADER_FONT } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME_COLOR.HEADER_BG } };
        cell.border = { 
            top: { style: 'thin', color: { argb: THEME_COLOR.HEADER_FONT } }, 
            left: { style: 'thin', color: { argb: THEME_COLOR.HEADER_FONT } }, 
            bottom: { style: 'thin', color: { argb: THEME_COLOR.HEADER_FONT } }, 
            right: { style: 'thin', color: { argb: THEME_COLOR.HEADER_FONT } } 
        };
    });
}

function applyDataRowStyling(worksheet, columnConfig, startRow = 2) {
    const endRow = worksheet.rowCount;
    
    for (let rowNum = startRow; rowNum <= endRow; rowNum++) {
        const row = worksheet.getRow(rowNum);
        row.height = 22;
        
        columnConfig.forEach((col, colIndex) => {
            const cell = row.getCell(colIndex + 1);
            
            cell.font = { name: 'Segoe UI', size: 10, color: { argb: THEME_COLOR.FONT_COLOR } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: (rowNum % 2 === 0) ? THEME_COLOR.EVEN_ROW_BG : THEME_COLOR.ODD_ROW_BG } };
            
            cell.border = { 
                top: { style: 'thin', color: { argb: THEME_COLOR.BORDER_COLOR } }, 
                left: { style: 'thin', color: { argb: THEME_COLOR.BORDER_COLOR } }, 
                bottom: { style: 'thin', color: { argb: THEME_COLOR.BORDER_COLOR } }, 
                right: { style: 'thin', color: { argb: THEME_COLOR.BORDER_COLOR } } 
            };
        });
    }
}

// =====================================================
// NEW: ADMIN PASSWORD VERIFICATION ENDPOINT
// =====================================================
app.post('/api/admin/verify-password', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.status(200).json({ message: 'Password verified successfully.' });
    } else {
        res.status(401).json({ message: 'Invalid password.' });
    }
});


// =====================================================
// ORDERS ENDPOINTS
// =====================================================

app.get('/api/orders', async (req, res) => {
    try {
        const ordersData = await readJsonFile(ORDERS_FILE, { orders: [] });
        res.json(ordersData.orders);
    } catch (error) {
        console.error('Error fetching orders:', error.message);
        res.status(500).json({ message: 'Failed to retrieve orders', error: error.message });
    }
});

app.post('/api/orders', upload.single('fotoPk'), async (req, res) => {
    try {
        const newOrder = req.body; 
        
        newOrder.fotoPk = req.file ? `/uploads/${req.file.filename}` : 'Tidak ada foto';

        const requiredFields = ['namaPelanggan', 'ulp', 'idPelanggan', 'tglBayar', 'tarifDayaBaru', 'status', 'alamat'];
        const missingFields = requiredFields.filter(field => !newOrder[field]);

        if (missingFields.length > 0) {
            if (req.file && fs.existsSync(req.file.path)) {
                await fsp.unlink(req.file.path);
            }
            return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
        }

        const ordersData = await readJsonFile(ORDERS_FILE, { orders: [] });
        const orders = ordersData.orders;

        // --- DIAGNOSTIC LOGS START ---
        console.log(`[POST /api/orders] Current orders count: ${orders.length}`);
        if (orders.length > 0) {
            const maxId = Math.max(...orders.map(o => o.id));
            console.log(`[POST /api/orders] Max existing ID: ${maxId}`);
            newOrder.id = maxId + 1;
        } else {
            console.log(`[POST /api/orders] No existing orders. Setting ID to 1.`);
            newOrder.id = 1;
        }
        // --- DIAGNOSTIC LOGS END ---

        newOrder.createdAt = new Date().toISOString();
        newOrder.status = newOrder.status || '';

        // PERBAIKAN: Pastikan nilai kosong tidak diubah menjadi 0
        newOrder.conpresQty16_35 = newOrder.conpresQty16_35 || '';
        newOrder.conpresQty16_35_2 = newOrder.conpresQty16_35_2 || '';
        newOrder.conpresQty35_70 = newOrder.conpresQty35_70 || '';
        newOrder.conpresQty35_70_2 = newOrder.conpresQty35_70_2 || '';

        newOrder.noAgenda = newOrder.noAgenda || '';
        newOrder.alamat = newOrder.alamat || '';
        newOrder.tarifDayaLama = newOrder.tarifDayaLama === undefined || newOrder.tarifDayaLama === null ? '-' : newOrder.tarifDayaLama;
        newOrder.kebutuhanKwh = newOrder.kebutuhanKwh || '-';
        newOrder.kebutuhanMcb = newOrder.kebutuhanMcb || '-';
        newOrder.kebutuhanBoxApp = newOrder.kebutuhanBoxApp || '-';
        newOrder.kebutuhanKabel = newOrder.kebutuhanKabel || '-';
        newOrder.jumlahKabel = newOrder.jumlahKabel || '';
        newOrder.cover = newOrder.cover || 'Tidak';
        newOrder.amrModem = newOrder.amrModem || 'Tidak';
        newOrder.segel = newOrder.segel || '-';
        newOrder.cetakPk = newOrder.cetakPk || 'Belum';
        newOrder.keterangan = newOrder.keterangan || '-';


        orders.push(newOrder);
        await writeJsonFile(ORDERS_FILE, { orders });

        res.status(201).json({ message: 'Order added successfully!', order: newOrder });
    } catch (error) {
        console.error('Error adding order:', error.message);
        if (req.file && fs.existsSync(req.file.path)) {
            await fsp.unlink(req.file.path);
        }
        res.status(500).json({ message: 'Failed to add order', error: error.message });
    }
});

app.delete('/api/orders/reset', async (req, res) => {
    try {
        const { password } = req.body;

        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ message: 'Unauthorized: Invalid password.' });
        }

        const ordersData = await readJsonFile(ORDERS_FILE, { orders: [] });
        const orders = ordersData.orders;

        for (const order of orders) {
            if (order.fotoPk && order.fotoPk !== 'Tidak ada foto' && order.fotoPk.startsWith('/uploads/')) {
                const absolutePath = path.join(__dirname, order.fotoPk);
                if (fs.existsSync(absolutePath)) {
                    await fsp.unlink(absolutePath);
                }
            }
        }

        await writeJsonFile(ORDERS_FILE, { orders: [] });
        // --- DIAGNOSTIC LOG START ---
        const confirmedOrdersData = await readJsonFile(ORDERS_FILE, { orders: [] });
        console.log(`[DELETE /api/orders/reset] orders.json has been reset. Confirmed content: ${confirmedOrdersData.orders.length} items.`);
        // --- DIAGNOSTIC LOG END ---
        res.status(200).json({ message: 'All orders and associated files have been reset successfully.' });
    } catch (error) {
        console.error('Error resetting all orders:', error.message);
        res.status(500).json({ message: 'Failed to reset all orders', error: error.message });
    }
});

app.put('/api/orders/:id', upload.single('fotoPk'), async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const updatedData = req.body; 
        
        const ordersData = await readJsonFile(ORDERS_FILE, { orders: [] });
        const orders = ordersData.orders;
        
        const orderIndex = orders.findIndex(order => order.id === orderId);
        
        if (orderIndex === -1) {
            if (req.file && fs.existsSync(req.file.path)) {
                await fsp.unlink(req.file.path);
            }
            return res.status(404).json({ message: `Order with ID ${orderId} not found.` });
        }

        if (req.file) {
            const oldFotoPkPath = orders[orderIndex].fotoPk;
            if (oldFotoPkPath && oldFotoPkPath !== 'Tidak ada foto' && oldFotoPkPath.startsWith('/uploads/')) {
                const absoluteOldPath = path.join(__dirname, oldFotoPkPath);
                if (fs.existsSync(absoluteOldPath)) {
                    await fsp.unlink(absoluteOldPath);
                }
            }
            updatedData.fotoPk = `/uploads/${req.file.filename}`;
        } else if (updatedData.fotoPk === 'Tidak ada foto' && orders[orderIndex].fotoPk !== 'Tidak ada foto') {
            const oldFotoPkPath = orders[orderIndex].fotoPk;
            if (oldFotoPkPath && oldFotoPkPath.startsWith('/uploads/')) {
                const absoluteOldPath = path.join(__dirname, oldFotoPkPath);
                if (fs.existsSync(absoluteOldPath)) {
                    await fsp.unlink(absoluteOldPath);
                }
            }
            updatedData.fotoPk = 'Tidak ada foto';
        } else if (!updatedData.fotoPk && orders[orderIndex].fotoPk) {
            updatedData.fotoPk = orders[orderIndex].fotoPk;
        }

        // PERBAIKAN: Pastikan nilai kosong tidak diubah menjadi 0
        updatedData.conpresQty16_35 = updatedData.conpresQty16_35 || '';
        updatedData.conpresQty16_35_2 = updatedData.conpresQty16_35_2 || '';
        updatedData.conpresQty35_70 = updatedData.conpresQty35_70 || '';
        updatedData.conpresQty35_70_2 = updatedData.conpresQty35_70_2 || '';

        updatedData.noAgenda = updatedData.noAgenda || '';
        updatedData.alamat = updatedData.alamat || '';
        updatedData.tarifDayaLama = updatedData.tarifDayaLama === undefined || updatedData.tarifDayaLama === null ? '-' : updatedData.tarifDayaLama;
        updatedData.kebutuhanKwh = updatedData.kebutuhanKwh || '-';
        updatedData.kebutuhanMcb = updatedData.kebutuhanMcb || '-';
        updatedData.kebutuhanBoxApp = updatedData.kebutuhanBoxApp || '-';
        updatedData.kebutuhanKabel = updatedData.kebutuhanKabel || '-';
        updatedData.jumlahKabel = updatedData.jumlahKabel || '';
        updatedData.cover = updatedData.cover || 'Tidak';
        updatedData.amrModem = updatedData.amrModem || 'Tidak';
        updatedData.segel = updatedData.segel || '-';
        updatedData.cetakPk = updatedData.cetakPk || 'Belum';
        updatedData.keterangan = updatedData.keterangan || '-';
        updatedData.status = updatedData.status || '';

        orders[orderIndex] = { ...orders[orderIndex], ...updatedData, updatedAt: new Date().toISOString() };
        await writeJsonFile(ORDERS_FILE, { orders });
        
        res.status(200).json({ message: `Order with ID ${orderId} updated successfully.`, order: orders[orderIndex] });
    } catch (error) {
        console.error('Error updating order:', error.message);
        if (req.file && fs.existsSync(req.file.path)) {
            await fsp.unlink(req.file.path);
        }
        res.status(500).json({ message: 'Failed to update order', error: error.message });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    try {
        const orderId = parseInt(req.params.id);
        const ordersData = await readJsonFile(ORDERS_FILE, { orders: [] });
        let orders = ordersData.orders;
        
        const orderToDelete = orders.find(order => order.id === orderId);

        if (!orderToDelete) {
            return res.status(404).json({ message: `Order with ID ${orderId} not found.` });
        }

        orders = orders.filter(order => order.id !== orderId);

        if (orderToDelete.fotoPk && orderToDelete.fotoPk !== 'Tidak ada foto' && orderToDelete.fotoPk.startsWith('/uploads/')) {
            const absolutePath = path.join(__dirname, orderToDelete.fotoPk);
            if (fs.existsSync(absolutePath)) {
                await fsp.unlink(absolutePath);
            }
        }
        await writeJsonFile(ORDERS_FILE, { orders });
        res.status(200).json({ message: `Order with ID ${orderId} deleted successfully.` });
    } catch (error) {
        console.error('Error deleting order:', error.message);
        res.status(500).json({ message: 'Failed to delete order', error: error.message });
    }
});

app.get('/api/options', async (req, res) => {
    try {
        const optionsData = await readJsonFile(OPTIONS_FILE, defaultOptionsStructure);
        res.json(optionsData.options || {}); 
    } catch (error) {
        console.error('Error fetching options:', error.message);
        res.status(500).json({ message: 'Failed to retrieve options', error: error.message });
    }
});

app.put('/api/options', async (req, res) => {
    try {
        const newOptionsData = req.body; 

        if (!newOptionsData || typeof newOptionsData !== 'object') {
            return res.status(400).json({ message: 'Invalid options data provided. Expected an object with categories.' });
        }
        
        const currentData = await readJsonFile(OPTIONS_FILE, defaultOptionsStructure);
        currentData.options = newOptionsData;
        
        await writeJsonFile(OPTIONS_FILE, currentData);
        res.status(200).json({ 
            message: 'All options updated successfully.',
            updatedOptions: currentData.options
        });
    } catch (error) {
        console.error('Error updating all options:', error.message);
        res.status(500).json({ message: 'Failed to update options', error: error.message });
    }
});

app.put('/api/options/:category', async (req, res) => {
    const category = req.params.category;
    const updatedOptionsArray = req.body;

    if (!Array.isArray(updatedOptionsArray)) {
        return res.status(400).json({ message: 'Request body for category update must be an array.' });
    }

    try {
        const data = await readJsonFile(OPTIONS_FILE, defaultOptionsStructure);

        if (data.options && data.options.hasOwnProperty(category)) {
            data.options[category] = updatedOptionsArray;
            await writeJsonFile(OPTIONS_FILE, data);
            res.json({ message: `Options for category '${category}' updated successfully.`, options: data.options[category] });
        } else {
            res.status(404).json({ message: `Category '${category}' not found in options.` });
        }
    } catch (error) {
        console.error(`Error updating options for category ${category}:`, error.message);
        res.status(500).json({ message: 'Failed to update options for category ${category}', error: error.message });
    }
});

// =====================================================
// EXCEL EXPORT ENDPOINT - Updated with new fields
// =====================================================

app.get('/api/orders/export-xlsx', async (req, res) => {
    try {
        const ordersData = await readJsonFile(ORDERS_FILE, { orders: [] });
        const orders = ordersData.orders;

        if (orders.length === 0) {
            return res.status(404).json({ message: 'No order data available for export.' });
        }

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Sistem Manajemen Order';
        workbook.lastModifiedBy = 'Sistem';
        workbook.created = new Date();
        workbook.modified = new Date();
        
        const worksheet = workbook.addWorksheet('Data Order Pelanggan', {
            properties: { tabColor: { argb: THEME_COLOR.SHEET_TAB } }
        });

        const columnConfig = [
            { header: "Order ID", key: "id", width: 12 }, 
            { header: "NAMA PELANGGAN", key: "namaPelanggan", width: 32 },
            { header: "ULP", key: "ulp", width: 22 }, 
            { header: "ALAMAT", key: "alamat", width: 42 },
            { header: "PB/PD", key: "pbPd", width: 16 }, 
            { header: "TARIF/DAYA LAMA (EX:R2/5500 VA)", key: "tarifDayaLama", width: 26 },
            { header: "TARIF / DAYA BARU", key: "tarifDayaBaru", width: 26 }, 
            { header: "ID PELANGGAN", key: "idPelanggan", width: 22 },
            { header: "No. AGENDA", key: "noAgenda", width: 26 }, 
            { header: "TANGGAL BAYAR", key: "tglBayar", width: 20 },
            { header: "CETAK PK", key: "cetakPk", width: 16 }, 
            { header: "KEBUTUHAN KWH", key: "kebutuhanKwh", width: 22 }, 
            { header: "KEBUTUHAN MCB", key: "kebutuhanMcb", width: 22 },
            { header: "KEBUTUHAN BOX", key: "kebutuhanBoxApp", width: 30 }, 
            { header: "KEBUTUHAN KABEL", key: "kebutuhanKabel", width: 22 },
            { header: "JUMLAH KABEL", key: "jumlahKabel", width: 20 },
            { header: "SEGEL", key: "segel", width: 15 },
            { header: "MODEM AMR", key: "amrModem", width: 16 },
            { header: "COVER", key: "cover", width: 12 }, 
            { header: "CONPRES 16-35", key: "conpresQty16_35_2", width: 25 }, 
            { header: "JUMLAH CONPRES 16-35", key: "conpresQty16_35", width: 25 },
            { header: "CONPRES 35-70", key: "conpresQty35_70_2", width: 25 },
            { header: "JUMLAH CONPRES 35-70", key: "conpresQty35_70", width: 25 },
             
            { header: "", width: 25 },
            { header: "Foto PK", key: "fotoPk", width: 35 }, 
            { header: "Keterangan", key: "keterangan", width: 52 },
            { header: "Status", key: "status", width: 15 },
            { header: "Dibuat Pada", key: "createdAt", width: 25 },
            { header: "Diupdate Pada", key: "updatedAt", width: 25 },
    
        ];

        applyModernExcelStyling(worksheet, columnConfig);
        
        const transformedOrders = orders.map((order, index) => {
            const transformedOrder = { ...order };

            // Logic untuk mengubah teks 'AMR' menjadi 'MODEM AMR' di Excel
            // Jika nilai adalah 'AMR', ubah menjadi 'MODEM AMR'
            // Jika nilai adalah 'Tidak', ubah menjadi kosong
            // Jika nilai lain, biarkan apa adanya atau default ke '-'
            if (transformedOrder.amrModem && transformedOrder.amrModem.toUpperCase() === 'AMR') {
                transformedOrder.amrModem = 'MODEM AMR';
            } else if (transformedOrder.amrModem && transformedOrder.amrModem.toUpperCase() === 'TIDAK') {
                transformedOrder.amrModem = ''; // Mengubah 'Tidak' menjadi kosong
            } else {
                transformedOrder.amrModem = transformedOrder.amrModem || ''; // Pastikan kosong jika null/undefined
            }

            // Logic untuk kolom 'Cover'
            // Jika nilai adalah 'COVER', biarkan 'COVER'
            // Jika nilai adalah 'NON COVER' atau 'Tidak', ubah menjadi kosong
            if (transformedOrder.cover && transformedOrder.cover.toUpperCase() === 'COVER') {
                transformedOrder.cover = 'COVER';
            } else if (transformedOrder.cover && (transformedOrder.cover.toUpperCase() === 'NON COVER' || transformedOrder.cover.toUpperCase() === 'TIDAK')) {
                transformedOrder.cover = ''; // Mengubah 'NON COVER' atau 'Tidak' menjadi kosong
            } else {
                transformedOrder.cover = transformedOrder.cover || ''; // Pastikan kosong jika null/undefined
            }

            // PERBAIKAN: Gunakan `undefined` untuk nilai kosong agar ExcelJS membuat cell kosong.
            transformedOrder.conpresQty16_35 = order.conpresQty16_35 === '' ? undefined : Number(order.conpresQty16_35);
            transformedOrder.conpresQty16_35_2 = transformedOrder.conpresQty16_35_2 || '';
            transformedOrder.conpresQty35_70 = order.conpresQty35_70 === '' ? undefined : Number(order.conpresQty35_70);
            transformedOrder.conpresQty35_70_2 = transformedOrder.conpresQty35_70_2 || '';

            const getExcelColumnLetter = (key) => {
                const colIndex = columnConfig.findIndex(col => col.key === key);
                if (colIndex === -1) return '';
                let letter = '';
                let tempIndex = colIndex;
                while (tempIndex >= 0) {
                    letter = String.fromCharCode(65 + (tempIndex % 26)) + letter;
                    tempIndex = Math.floor(tempIndex / 26) - 1;
                }
                return letter;
            };

            const colR = getExcelColumnLetter('conpresQty16_35');
            const colT = getExcelColumnLetter('conpresQty35_70');

            const excelRowNum = index + 2;
            transformedOrder.totalConpresFormula = {
                formula: `${colR}${excelRowNum}+${colT}${excelRowNum}`,
                result: (order.conpresQty16_35 === '' ? 0 : Number(order.conpresQty16_35)) + (order.conpresQty35_70 === '' ? 0 : Number(order.conpresQty35_70))
            };

            return transformedOrder;
        });

        worksheet.addRows(transformedOrders);
        
        if (orders.length > 0) {
            applyDataRowStyling(worksheet, columnConfig);
        }

        worksheet.autoFilter = {
            from: 'A1',
            to: `${String.fromCharCode(65 + columnConfig.length - 1)}1`
        };

        worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

        const filename = `data_order_pelanggan_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error exporting Excel:', error.message);
        res.status(500).json({ message: 'Failed to export data to Excel', error: error.message });
    }
});

// =====================================================
// EXCEL IMPORT ENDPOINT - Updated with new fields and fotoPk handling
// =====================================================

app.post('/api/upload-excel', upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }

        const filePath = req.file.path;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
            await fsp.unlink(filePath);
            return res.status(400).json({ message: 'First worksheet not found or empty.' });
        }

        const ordersData = await readJsonFile(ORDERS_FILE, { orders: [] });
        let orders = ordersData.orders;
        let currentMaxId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) : 0;
        const newOrders = [];



        const expectedHeaderKeys = {
            "Order ID": "id",
            "NAMA PELANGGAN": "namaPelanggan",
            "ULP": "ulp",
            "ALAMAT": "alamat",
            "PB/PD": "pbPd",
            "TARIF/DAYA LAMA (EX:R2/5500 VA)": "tarifDayaLama",
            "TARIF / DAYA BARU": "tarifDayaBaru",
            "ID PELANGGAN": "idPelanggan",
            "NO. AGENDA": "noAgenda",
            "TANGGAL BAYAR": "tglBayar",
            "CETAK PK": "cetakPk",
            "KEBUTUHAN KWH": "kebutuhanKwh",
            "KEBUTUHAN MCB": "kebutuhanMcb",
            "KEBUTUHAN BOX": "kebutuhanBoxApp",
            "KEBUTUHAN KABEL": "kebutuhanKabel",
            "JUMLAH KABEL": "jumlahKabel",
            "SEGEL": "segel",
            "MODEM AMR": "amrModem",
            "COVER": "cover",
            "CONPRES 16-35": "conpresQty16_35_2",
            "JUMLAH CONPRES 16-35": "conpresQty16_35",
            "CONPRES 35-70": "conpresQty35_70_2",
            "JUMLAH CONPRES 35-70": "conpresQty35_70",
            
            
            "Foto PK": "fotoPk",
            "keterangan": "keterangan",
            "status": "status",
            "dibuat pada": "createdAt",
            "diupdate pada": "updatedAt",
        };
        
        const headerRow = worksheet.getRow(1);
        if (!headerRow || headerRow.actualCellCount === 0) {
            await fsp.unlink(filePath);
            return res.status(400).json({ message: 'Excel file is empty or has no header row.' });
        }

        const headerMap = {};
        headerRow.eachCell((cell, colNumber) => {
            const headerText = String(cell.value).trim().toLowerCase();
            if (expectedHeaderKeys[headerText]) {
                headerMap[expectedHeaderKeys[headerText]] = colNumber;
            }
        });

        const requiredHeadersPresent = [
            "namaPelanggan", "idPelanggan", "tglBayar", "tarifDayaBaru"
        ].every(key => headerMap[key]);

        if (!requiredHeadersPresent) {
            await fsp.unlink(filePath);
            const missing = [
                "namaPelanggan", "idPelanggan", "tglBayar", "tarifDayaBaru"
            ].filter(key => !headerMap[key]).map(key => Object.keys(expectedHeaderKeys).find(k => expectedHeaderKeys[k] === key));
            return res.status(400).json({ message: `Missing required columns in Excel file: ${missing.join(', ')}` });
        }


        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            if (rowNumber > 1) { // Skip header row
                const getCellValue = (key) => {
                    const colIndex = headerMap[key];
                    if (colIndex === undefined) return undefined;

                    const cell = row.getCell(colIndex);
                    return cell.value ? (cell.value.text || cell.value) : undefined;
                };

                const namaPelanggan = getCellValue("namaPelanggan");
                const idPelanggan = getCellValue("idPelanggan");
                const tglBayar = getCellValue("tglBayar");
                const tarifDayaBaru = getCellValue("tarifDayaBaru");

                if (!namaPelanggan || !idPelanggan || !tglBayar || !tarifDayaBaru) {
                    console.warn(`Skipping row ${rowNumber} due to missing critical data.`);
                    return;
                }

                currentMaxId++;
                const order = {
                    id: currentMaxId,
                    namaPelanggan: String(namaPelanggan),
                    ulp: String(getCellValue("ulp") || ''), 
                    alamat: String(getCellValue("alamat") || ''),
                    pbPd: String(getCellValue("pbPd") || 'PB'), 
                    tarifDayaLama: String(getCellValue("tarifDayaLama") || '-'),
                    tarifDayaBaru: String(tarifDayaBaru),
                    idPelanggan: String(idPelanggan), 
                    noAgenda: String(getCellValue("noAgenda") || '-'), 
                    tglBayar: (getCellValue("tglBayar") instanceof Date) 
                                 ? getCellValue("tglBayar").toISOString().split('T')[0] 
                                 : String(getCellValue("tglBayar") || ''),
                    kebutuhanKwh: String(getCellValue("kebutuhanKwh") || '-'), 
                    kebutuhanMcb: String(getCellValue("kebutuhanMcb") || '-'),
                    kebutuhanBoxApp: String(getCellValue("kebutuhanBoxApp") || '-'), 
                    kebutuhanKabel: String(getCellValue("kebutuhanKabel") || '-'),
                    jumlahKabel: String(getCellValue("jumlahKabel") || '-'),
                    cover: String(getCellValue("cover") || 'Tidak'), 
                    amrModem: String(getCellValue("amrModem") || 'Tidak'),
                    // PERBAIKAN: Memastikan nilai kosong dari Excel tetap string kosong
                    conpresQty16_35: String(getCellValue("conpresQty16_35") || ''), 
                    conpresQty16_35_2: String(getCellValue("conpresQty16_35_2") || ''),
                    conpresQty35_70: String(getCellValue("conpresQty35_70") || ''),
                    conpresQty35_70_2: String(getCellValue("conpresQty35_70_2") || ''),
                    segel: String(getCellValue("segel") || '-'),
                    cetakPk: String(getCellValue("cetakPk") || 'Belum'), 
                    fotoPk: String(getCellValue("fotoPk") || 'Tidak ada foto'),
                    keterangan: String(getCellValue("keterangan") || '-'), 
                    status: String(getCellValue("status") || ''),
                    createdAt: (getCellValue("createdAt") instanceof Date) 
                                 ? getCellValue("createdAt").toISOString() 
                                 : new Date().toISOString(),
                    updatedAt: (getCellValue("updatedAt") instanceof Date) 
                                 ? getCellValue("updatedAt").toISOString() 
                                 : null
                };
                newOrders.push(order);
            }
        });

        const updatedOrders = [...orders, ...newOrders];
        await writeJsonFile(ORDERS_FILE, { orders: updatedOrders });
        await fsp.unlink(filePath);
        res.status(200).json({ message: `Successfully imported ${newOrders.length} orders from Excel file.`, importedCount: newOrders.length });
    } catch (error) {
        console.error("Error processing uploaded file:", error);
        if (req.file && fs.existsSync(req.file.path)) {
            await fsp.unlink(filePath);
        }
        res.status(500).json({ message: 'Failed to process Excel file.', error: error.message });
    }
});


// =====================================================
// UTILITY ENDPOINTS
// =====================================================

app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        endpoints: {
            orders: '/api/orders',
            options: '/api/options',
            export: '/api/orders/export-xlsx',
            upload: '/api/upload-excel',
            health: '/api/health'
        }
    });
});

// IMPORTANT: This catch-all route MUST be the LAST route defined.
// If it's before your static file serving, it will intercept all requests.
app.use('*', (req, res) => {
    res.status(404).json({ 
        message: 'Endpoint not found',
        available_endpoints: [
            'GET /api/orders',
            'POST /api/orders (body: orderData, supports fotoPk multipart)', 
            'PUT /api/orders/:id (body: orderData, supports fotoPk multipart)',
            'DELETE /api/orders/:id',
            'DELETE /api/orders/reset (body: { password: "your_admin_password" })',
            'GET /api/options (returns { options: { ... } })', 
            'PUT /api/options (body: { "ulp": [...], "tarifDaya": [...], ... } )',
            'PUT /api/options/:category (body: array of strings)', 
            'GET /api/orders/export-xlsx',
            'POST /api/upload-excel (multipart: excelFile)',
            'GET /api/health',
            'POST /api/admin/verify-password (body: { password: "..." })', 
            'GET / (serves frontend application)', 
            'GET /js/*' 
        ]
    });
});

// =====================================================
// SERVER STARTUP
// =====================================================

app.listen(PORT, async () => {
    try {
        await readJsonFile(ORDERS_FILE, { orders: [] });
        await readJsonFile(OPTIONS_FILE, defaultOptionsStructure); 
        
        console.log('🚀=====================================🚀');
        console.log(`📡 Backend server is running at http://localhost:${PORT}`);
        console.log(`📁 Order data saved to: ${ORDERS_FILE}`);
        console.log(`📁 Options data saved to: ${OPTIONS_FILE}`);
        console.log('📋 Available API Endpoints:');
        console.log('    🔹 GET    /api/orders');
        console.log('    🔹 POST   /api/orders (body: orderData, supports fotoPk multipart)');
        console.log('    🔹 PUT    /api/orders/:id (body: orderData, supports fotoPk multipart)');
        console.log('    🔹 DELETE /api/orders/:id');
        console.log('    🔥 DELETE /api/orders/reset (body: { password: "your_admin_password" })');
        console.log('    🔸 GET    /api/options (returns { options: { ... } })'); 
        console.log('    🔸 PUT    /api/options (body: { "ulp": [...], "tarifDaya": [...], ... })');
        console.log('    🔸 PUT    /api/options/:category (body: array of strings)'); 
        console.log('    📊 GET    /api/orders/export-xlsx');
        console.log('    📤 POST   /api/upload-excel (multipart: excelFile)');
        console.log('    ❤️    GET    /api/health');
        console.log('    🔑 POST   /api/admin/verify-password'); 
        console.log('    🌐 GET    / (serves frontend application)'); 
        console.log('⚡ Server is ready to accept requests!');
        console.log('🚀=====================================🚀');
    } catch (err) {
        console.error('❌ Failed to start server:', err.message);
        process.exit(1);
    }
});
