const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_super_aman_spmb';

const checkRole = (roles) => {
    return (req, res, next) => {
        const token = req.cookies ? req.cookies.admin_token : null;

        if (!token) {
            return res.redirect('/login');
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Periksa apakah role user ada di dalam daftar roles yang diizinkan
            if (roles.length > 0 && !roles.includes(decoded.role)) {
                // Jika tidak ada akses, redirect ke dashboard (yang nantinya membedakan view per role)
                return res.status(403).send("403 Forbidden: Anda tidak memiliki akses ke halaman ini.");
            }

            req.admin = decoded;
            res.locals.admin = decoded;
            next();
        } catch (err) {
            res.clearCookie('admin_token');
            return res.redirect('/login');
        }
    };
};

module.exports = { checkRole };
