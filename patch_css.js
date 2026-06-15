const fs = require('fs');
let c = fs.readFileSync('frontend/public/css/kwitansi.css', 'utf8');

const searchRegExp = /@media print {[\s\S]*/;
const replaceStr = `@media print {
            body {
                background-color: #ffffff;
            }
            .page-wrapper {
                margin: 0;
                box-shadow: none;
                width: 21.59cm;
                height: 33cm;
            }
            .no-print {
                display: none !important;
            }
            /* Pastikan background tercetak */
            .page-wrapper {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .terbilang-container, .amount-box {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            /* Remove table borders during print */
            .content-table td, .content-table th, .footer-table td, .footer-table th {
                border: none !important;
            }
        }

        /* Hilangkan garis border table untuk layar & PDF */
        .content-table td, .content-table th, .footer-table td, .footer-table th {
            border: none !important;
        }

        /* Editable Mode Styles */
        .editable-mode .editable-field {
            border: 1px dashed #007bff;
            background-color: #f8f9fa;
            padding: 2px 5px;
            cursor: text;
            display: inline-block;
            min-width: 50px;
        }
        .editable-mode .editable-field:focus {
            outline: 2px solid #007bff;
            background-color: #fff;
        }

        /* PDF Exporting Mode */
        body.exporting-pdf {
            overflow: hidden !important;
        }
        body.exporting-pdf .page-wrapper {
            margin: 0 !important;
            box-shadow: none !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            z-index: 9999 !important;
            transform: none !important;
            border: none !important;
            border-radius: 0 !important;
        }
        body.exporting-pdf .sidebar,
        body.exporting-pdf .topbar,
        body.exporting-pdf .action-buttons {
            display: none !important;
        }

@page WordSection1 {
                    size: 21.59cm 33.0cm;
                    margin: 0cm 0cm 0cm 0cm;
                    mso-header-margin: 0cm;
                    mso-footer-margin: 0cm;
                    mso-paper-source: 0;
                  }
                  div.WordSection1 { page: WordSection1; }
                  body { font-family: Arial, sans-serif; font-size: 11pt; margin: 0; padding: 0; }
                  table { border-collapse: collapse; }
                  td { vertical-align: top; }`;

c = c.replace(searchRegExp, replaceStr);
fs.writeFileSync('frontend/public/css/kwitansi.css', c);
