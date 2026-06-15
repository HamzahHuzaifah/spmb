const fs = require('fs');
let c = fs.readFileSync('frontend/views/kwitansi.ejs', 'utf8');

const replaceStr = `    const defaultOrder = ['diterimaDari', 'namaSantri', 'satuanPendidikan', 'untukPembayaran', 'terbilangRow', 'nominalRow', 'dibayarkanKepada', 'kategoriDana', 'keteranganPengeluaran', 'rincianPengeluaran', 'untukBantuan'];
    let currentOrder = [];
    try {
        if (typeof rowOrder !== 'undefined' && rowOrder) {
            currentOrder = JSON.parse(rowOrder);
            let idxNominal = currentOrder.indexOf('nominalRow');
            let idxTerbilang = currentOrder.indexOf('terbilangRow');
            if (idxNominal !== -1 && idxTerbilang !== -1 && idxNominal < idxTerbilang) {
                currentOrder[idxNominal] = 'terbilangRow';
                currentOrder[idxTerbilang] = 'nominalRow';
            }
        }
    } catch(e) {}`;

// Use regex to match regardless of exact spaces
const rx = /const\s+defaultOrder\s*=\s*\[.*?'nominalRow'\s*,\s*'terbilangRow'.*?\];[\s\S]*?catch\s*\(\s*e\s*\)\s*\{\s*\}/;

if (rx.test(c)) {
    c = c.replace(rx, replaceStr);
    fs.writeFileSync('frontend/views/kwitansi.ejs', c);
    console.log('Swap patched successfully with regex');
} else {
    console.log('Regex did not match!');
}
