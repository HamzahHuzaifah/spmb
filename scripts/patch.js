const fs = require('fs');
let c = fs.readFileSync('frontend/views/kwitansi.ejs', 'utf8');
const searchRegExp = /<script src="\/js\/global\.js"><\/script>[\s\S]*?<script src="\/js\/kwitansi\.js"><\/script>/;
const replaceStr = `<script src="/js/global.js"></script>
    <script>
        window.kwitansiConfig = {
            layoutMarginTop: '<%= typeof layoutMarginTop !== "undefined" ? layoutMarginTop : "6.5cm" %>',
            layoutMarginLeft: '<%= typeof layoutMarginLeft !== "undefined" ? layoutMarginLeft : "2.5cm" %>',
            ttdVisible: <%= typeof ttdVisible !== "undefined" ? (ttdVisible ? 'true' : 'false') : 'true' %>,
            ttdWidth: '<%= typeof ttdWidth !== "undefined" ? ttdWidth : "120px" %>',
            ttdX: <%= typeof ttdX !== "undefined" ? (ttdX || 0) : 0 %>,
            ttdY: <%= typeof ttdY !== "undefined" ? (ttdY || 0) : 0 %>,
            no_transaksi: '<%= typeof no_transaksi !== "undefined" ? no_transaksi : "" %>'
        };
    </script>
    <script src="/js/kwitansi.js"></script>`;
c = c.replace(searchRegExp, replaceStr);
fs.writeFileSync('frontend/views/kwitansi.ejs', c);
