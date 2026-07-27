const jwt = require('jsonwebtoken');
require('dotenv').config();

const SSO_SECRET = process.env.SSO_SECRET_KEY || 'sikma_spmb_secret_sso_key_2026';
const SIKMA_URL = process.env.SIKMA_URL || 'https://spmb.mjic.sch.id/dashboard';
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_super_aman_spmb'; // Secret untuk login SPMB

module.exports = {
  // Dipanggil saat Admin SPMB klik tombol "Buka SIKMA"
  goSikma: (req, res) => {
    if (!req.admin || !req.admin.username) {
      return res.redirect('/login');
    }

    // Buat token SSO menggunakan username dari admin yang login
    const token = jwt.sign(
      { username: req.admin.username, source: 'SPMB' },
      SSO_SECRET,
      { expiresIn: '30s' }
    );

    // Redirect ke SIKMA endpoint penerima token
    res.redirect(`${SIKMA_URL}/sso/login?token=${token}`);
  },

  // Dipanggil saat mendapat token dari SIKMA
  loginFromSikma: async (req, res) => {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).send('SSO Token tidak ditemukan.');
    }

    try {
      const decoded = jwt.verify(token, SSO_SECRET);
      
      // Pastikan token asalnya dari SIKMA
      if (decoded.source !== 'SIKMA') {
        return res.status(403).send('Sumber token tidak valid.');
      }

      // Cari admin di database SPMB agar token memiliki 'id' dan 'nama'
      const db = require('../../config/db');
      const [rows] = await db.execute('SELECT * FROM admin WHERE username = ?', [decoded.username]);
      if (rows.length === 0) {
        return res.status(404).send('Akun admin tidak ditemukan di database SPMB. Pastikan username sama persis.');
      }
      
      const admin = rows[0];

      // Buat token login untuk SPMB
      const adminToken = jwt.sign(
        { id: admin.id, username: admin.username, nama: admin.nama_lengkap }, 
        JWT_SECRET, 
        { expiresIn: '1d' }
      );

      // Set cookie login
      res.cookie('admin_token', adminToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 Hari
      });

      // Redirect ke Dashboard SPMB
      res.redirect('/dashboard');
    } catch (error) {
      console.error('SSO Login Error:', error.message);
      return res.status(401).send('SSO Token tidak valid atau sudah kadaluarsa.');
    }
  }
};
