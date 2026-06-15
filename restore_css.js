const fs = require('fs');
let css = fs.readFileSync('frontend/public/css/kwitansi.css', 'utf8');

const missingCSS = `
        .value {
            border-bottom: 1px dotted #000;
        }

        .value-highlight {
            font-weight: bold;
        }

        .terbilang-container {
            width: 100%;
            border: 1px solid #000;
            padding: 15px 20px;
            margin-bottom: 0px;
            border-radius: 4px;
            background-color: rgba(255, 255, 255, 0.85);
        }

        .terbilang-value {
            font-style: italic;
            font-weight: bold;
            font-size: 12pt;
        }

        .footer-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
`;

// Insert it right after .colon { text-align: center; }
css = css.replace(/(\.colon\s*\{[\s\S]*?\})/, '$1\n' + missingCSS);
fs.writeFileSync('frontend/public/css/kwitansi.css', css);
console.log('Restored missing CSS');
