const fs = require('fs');
let c = fs.readFileSync('frontend/views/kwitansi.ejs', 'utf8');

// remove inline styles and replace with link
c = c.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="/css/style.css">\n    <link rel="stylesheet" href="/css/kwitansi.css">');

// remove inline script for kwitansi logic and replace with script tag
c = c.replace(/<script>\s*const rawTransaksi[\s\S]*?<\/script>/, '<script src="/js/global.js"></script>\n    <script>\n        window.kwitansiConfig = {\n            layoutMarginTop: \'<%= typeof layoutMarginTop !== "undefined" ? layoutMarginTop : "6.5cm" %>\',\n            layoutMarginLeft: \'<%= typeof layoutMarginLeft !== "undefined" ? layoutMarginLeft : "2.5cm" %>\',\n            ttdVisible: <%= typeof ttdVisible !== "undefined" ? (ttdVisible ? \'true\' : \'false\') : \'true\' %>,\n            ttdWidth: \'<%= typeof ttdWidth !== "undefined" ? ttdWidth : "120px" %>\',\n            ttdX: <%= typeof ttdX !== "undefined" ? (ttdX || 0) : 0 %>,\n            ttdY: <%= typeof ttdY !== "undefined" ? (ttdY || 0) : 0 %>,\n            no_transaksi: \'<%= typeof no_transaksi !== "undefined" ? no_transaksi : "" %>\'\n        };\n    </script>\n    <script src="/js/kwitansi.js"></script>');

fs.writeFileSync('frontend/views/kwitansi.ejs', c);
console.log('Done');
