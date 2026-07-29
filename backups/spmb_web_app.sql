    -- Script untuk membuat tabel-tabel di database MySQL
    -- Sesuaikan nama database dengan yang ada di .env (DB_NAME)

    CREATE TABLE IF NOT EXISTS santri (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nomorPendaftaran VARCHAR(100) NOT NULL,
        timestamp VARCHAR(50),
        email VARCHAR(100),
        jalurPendaftaran VARCHAR(50),
        nama VARCHAR(150) NOT NULL,
        namaPanggilan VARCHAR(50),
        jenisKelamin VARCHAR(20),
        pendidikan VARCHAR(50),
        tempatLahir VARCHAR(100),
        tanggalLahir DATE,
        agama VARCHAR(50),
        statusKeluarga VARCHAR(50),
        anakKe INT,
        dariBersaudara INT,
        asalSekolah VARCHAR(100),
        usia INT,
        namaAyah VARCHAR(100),
        pekerjaanAyah VARCHAR(100),
        teleponAyah VARCHAR(20),
        namaIbu VARCHAR(100),
        pekerjaanIbu VARCHAR(100),
        teleponIbu VARCHAR(20),
        alamat TEXT,
        noTelepon VARCHAR(20)
    );

    CREATE TABLE IF NOT EXISTS santri_daftar_ulang (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nomorPendaftaran VARCHAR(100) NOT NULL,
        timestamp VARCHAR(50),
        email VARCHAR(100),
        jalurPendaftaran VARCHAR(50),
        nama VARCHAR(150) NOT NULL,
        namaPanggilan VARCHAR(50),
        jenisKelamin VARCHAR(20),
        unitSebelumnya VARCHAR(50),
        lanjutKe VARCHAR(50),
        tempatLahir VARCHAR(100),
        tanggalLahir DATE,
        agama VARCHAR(50),
        statusKeluarga VARCHAR(50),
        anakKe INT,
        dariBersaudara INT,
        asalSekolah VARCHAR(100),
        usia INT,
        namaAyah VARCHAR(100),
        pekerjaanAyah VARCHAR(100),
        teleponAyah VARCHAR(20),
        namaIbu VARCHAR(100),
        pekerjaanIbu VARCHAR(100),
        teleponIbu VARCHAR(20),
        alamat TEXT,
        noTelepon VARCHAR(20)
    );

    CREATE TABLE IF NOT EXISTS tagihan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(150) NOT NULL,
        jalur VARCHAR(50),
        satuanPendidikan VARCHAR(50),
        formulir INT DEFAULT 0,
        uangPangkal INT DEFAULT 0,
        perlengkapan INT DEFAULT 0,
        seragam INT DEFAULT 0,
        spp INT DEFAULT 0,
        totalTagihan INT DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tagihan_daftar_ulang (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(150) NOT NULL,
        jalur VARCHAR(50),
        satuanPendidikanSebelumnya VARCHAR(50),
        satuanPendidikan VARCHAR(50),
        formulir INT DEFAULT 0,
        uangPangkal INT DEFAULT 0,
        perlengkapan INT DEFAULT 0,
        seragam INT DEFAULT 0,
        spp INT DEFAULT 0,
        totalTagihan INT DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tunggakan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(150) NOT NULL,
        satuanPendidikan VARCHAR(50),
        noTelepon VARCHAR(20),
        totalTagihan INT DEFAULT 0,
        totalBayar INT DEFAULT 0,
        sisaBayar INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Belum Lunas'
    );

    CREATE TABLE IF NOT EXISTS tunggakan_daftar_ulang (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(150) NOT NULL,
        satuanPendidikan VARCHAR(50),
        noTelepon VARCHAR(20),
        totalTagihan INT DEFAULT 0,
        totalBayar INT DEFAULT 0,
        sisaBayar INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Belum Lunas'
    );

    CREATE TABLE IF NOT EXISTS transaksi (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tanggal VARCHAR(50),
        noTransaksi VARCHAR(100) NOT NULL,
        namaSantri VARCHAR(150),
        jenis VARCHAR(50),
        nominal INT DEFAULT 0,
        satuanPendidikan VARCHAR(50),
        metodePembayaran VARCHAR(50),
        dibayarkanKepada VARCHAR(150),
        kategoriDana VARCHAR(100),
        rincianNames JSON,
        rincianNominals JSON,
        diterimaDari VARCHAR(150),
        namaPemberi VARCHAR(150)
    );

    CREATE TABLE IF NOT EXISTS laporan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tanggal VARCHAR(50),
        bulan VARCHAR(50),
        tahun VARCHAR(20),
        noTransaksi VARCHAR(100),
        uraian TEXT,
        pemasukan INT DEFAULT 0,
        pengeluaran INT DEFAULT 0
    );
