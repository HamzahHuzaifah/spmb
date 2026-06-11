const mockData = require('./backend/data/mockData.js');

const adminController = require('./backend/controllers/adminController.js');

// Add some mock data to test
mockData.tunggakanData.push({
    nama: 'John Doe',
    satuanPendidikan: 'PAUDQu',
    totalTagihan: 1000000,
    totalBayar: 0,
    sisaBayar: 1000000,
    status: 'Belum Lunas'
});

// Simulate post
const reqPost = {
    body: {
        tanggal: '2026-06-10',
        jenisTransaksi: 'Pembayaran Pendaftaran Baru',
        namaPendaftar: 'John Doe',
        nominal: 1000000,
        metodePembayaran: 'Cash'
    }
};

let resRedirected = '';
const resPost = {
    redirect: (url) => { resRedirected = url; }
};

adminController.postInputTransaksi(reqPost, resPost);

console.log('After Post:');
console.log('tunggakanData[0]:', mockData.tunggakanData[0]);
console.log('transaksiTerbaru[0]:', mockData.dashboardData.transaksiTerbaru[0]);

// Simulate delete
const reqDelete = {
    params: {
        id: mockData.dashboardData.transaksiTerbaru[0].id
    }
};

adminController.deleteTransaksi(reqDelete, resPost);

console.log('\nAfter Delete:');
console.log('tunggakanData[0]:', mockData.tunggakanData[0]);
console.log('transaksiTerbaru:', mockData.dashboardData.transaksiTerbaru);
