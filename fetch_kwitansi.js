const http = require('http');
http.get('http://localhost:5000/kwitansi/45', res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const rx = /<tr data-row-id="(nominalRow|terbilangRow)"[^>]*>/g;
        let m;
        while ((m = rx.exec(data)) !== null) {
            console.log(m[0]);
        }
    });
});
