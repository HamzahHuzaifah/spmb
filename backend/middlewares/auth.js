const jwt = require('jsonwebtoken');

// Secret Key harus persis sama dengan yang di authController
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_super_aman_spmb';

const cekAuth = (req, res, next) => {
    // Mengambil token dari cookies
    const token = req.cookies ? req.cookies.admin_token : null;

    if (!token) {
        // Jika tidak ada token (belum login), kembalikan ke halaman login
        return res.redirect('/login');
    }

    try {
        // Verifikasi keaslian token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Menyimpan data admin yang login ke objek request (bisa diakses di controller)
        req.admin = decoded; 
        
        // Karcis asli! Silakan lewat
        next();
    } catch (err) {
        // Token palsu, diedit hacker, atau sudah kadaluarsa.
        res.clearCookie('admin_token');
        return res.redirect('/login');
    }
};

module.exports = { cekAuth };
