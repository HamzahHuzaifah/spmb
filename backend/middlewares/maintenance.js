// Middleware untuk memblokir akses ketika sistem sedang dalam pemeliharaan (Maintenance Mode)
// Hanya berlaku di lingkungan produksi (cPanel/Hosting), tidak memblokir jika diakses dari localhost (development)

const checkMaintenance = (req, res, next) => {
    // Periksa status mode maintenance dari environment variable
    const isMaintenanceMode = process.env.MAINTENANCE_MODE === 'true';
    
    // Periksa apakah request diakses dari komputer lokal (development)
    const isLocal = req.hostname === 'localhost' || 
                    req.hostname === '127.0.0.1' || 
                    req.hostname === '::1' || 
                    process.env.NODE_ENV === 'development';
    
    // Jika mode maintenance aktif dan BUKAN diakses dari localhost, tampilkan halaman maintenance
    if (isMaintenanceMode && !isLocal) {
        res.status(503); // HTTP Status 503: Service Unavailable
        return res.render('public/maintenance', {
            title: 'Sistem Sedang Dipelihara'
        });
    }
    
    // Jika tidak aktif atau diakses dari lokal, lanjutkan request seperti biasa
    next();
};

module.exports = { checkMaintenance };
