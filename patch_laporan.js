const fs = require('fs');
let c = fs.readFileSync('frontend/views/laporan.ejs', 'utf8');

const searchStr = '<style>\n                        #previewTable th {';
const replaceStr = `<style>
                        #previewF4Wrapper, #previewF4Wrapper * {
                            font-family: 'Arial', 'Helvetica', sans-serif !important;
                        }
                        #previewTable th {`;
if (c.includes(searchStr)) {
    c = c.replace(searchStr, replaceStr);
    fs.writeFileSync('frontend/views/laporan.ejs', c);
    console.log('laporan.ejs patched successfully');
} else {
    console.log('Search string not found in laporan.ejs');
}
