const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();

// Set View Engine ke EJS
app.set('view engine', 'ejs');
// Arahkan folder views ke frontend/views
app.set('views', path.join(__dirname, '../frontend/views'));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Arahkan static assets ke frontend/public
app.use(express.static(path.join(__dirname, '../frontend/public')));

// ==========================================
// ROUTES
// ==========================================
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');

// Mount routes
app.use('/', adminRoutes);
app.use('/', publicRoutes);

// Menjalankan Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
