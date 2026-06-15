const fs = require('fs');
let c = fs.readFileSync('frontend/public/css/kwitansi.css', 'utf8');

const searchRegExp = /body\.exporting-pdf \.page-wrapper {[\s\S]*?}/;
const replaceStr = `body.exporting-pdf .page-wrapper {
            margin: 0 !important;
            box-shadow: none !important;
            transform: none !important;
            border: none !important;
            border-radius: 0 !important;
            height: 33cm !important;
            max-height: 33cm !important;
            overflow: hidden !important;
        }`;

if (c.match(searchRegExp)) {
    c = c.replace(searchRegExp, replaceStr);
    fs.writeFileSync('frontend/public/css/kwitansi.css', c);
    console.log("Replaced successfully");
} else {
    console.log("Could not find pattern in kwitansi.css");
}
