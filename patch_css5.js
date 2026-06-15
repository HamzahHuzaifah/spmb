const fs = require('fs');
let c = fs.readFileSync('frontend/public/css/kwitansi.css', 'utf8');

const searchRegExp = /body \{[\s\S]*?\/\* Konten kwitansi layer atas \*\//;
const replaceStr = `body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            color: #000000;
            margin: 0;
            padding: 0;
            background-color: #e2e8f0;
            font-size: 11pt;
            line-height: 1.5;
        }

        /* Container yang mensimulasikan kertas F4 */
        .page-wrapper, .page-wrapper * {
            font-family: 'Arial', 'Helvetica', sans-serif !important;
        }

        .page-wrapper {
            width: 21.59cm;
            height: 33cm;
            margin: 40px auto;
            background-color: #ffffff;
            background-image: url('/images/Template%20Laporan%20dan%20Kwintasi.webp');
            background-size: 100% 100%;
            background-repeat: no-repeat;
            position: relative;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
            overflow: hidden;
        }

        /* Konten kwitansi layer atas */`;

c = c.replace(searchRegExp, replaceStr);
fs.writeFileSync('frontend/public/css/kwitansi.css', c);
