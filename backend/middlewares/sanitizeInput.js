// Middleware untuk membersihkan (sanitize) input dari user
// Tujuannya: Mencegah serangan XSS (Cross-Site Scripting)

const escapeHTML = (str) => {
    if (typeof str !== 'string') return str;
    // Mengubah karakter berbahaya menjadi entitas HTML aman
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
};

const sanitizeInput = (req, res, next) => {
    // Bersihkan semua data yang dikirim melalui Form (req.body)
    if (req.body) {
        for (let key in req.body) {
            req.body[key] = escapeHTML(req.body[key]);
        }
    }
    
    // Bersihkan juga data yang dikirim melalui URL (req.query)
    if (req.query) {
        for (let key in req.query) {
            req.query[key] = escapeHTML(req.query[key]);
        }
    }
    
    next(); // Lanjut ke proses berikutnya (controller)
};

module.exports = { sanitizeInput };
