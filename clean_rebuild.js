const fs = require('fs');

function cleanAndRebuild(filePath, postAction) {
    let content = fs.readFileSync(filePath + '_backup.ejs', 'utf-8');

    // Remove old success modal, old delete modal, and old add modal
    // By finding the first one of them and slicing there.
    let cutIndex = content.indexOf('<!-- Success Modal -->');
    if (cutIndex === -1) cutIndex = content.indexOf('<!-- Delete Modal -->');
    if (cutIndex === -1) cutIndex = content.indexOf('<!-- The Add Modal -->');

    if (cutIndex !== -1) {
        content = content.substring(0, cutIndex);
    }

    // Now append a clean, single version of everything
    const css = `
    <style>
        .modal {
            display: none;
            position: fixed;
            z-index: 9999;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            overflow-y: auto;
            padding-top: 50px;
            padding-bottom: 50px;
            backdrop-filter: blur(4px);
        }

        .modal-content {
            background-color: #ffffff;
            margin: 0 auto;
            padding: 35px 40px;
            border-radius: 12px;
            width: 90%;
            max-width: 850px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            position: relative;
        }

        .close-modal {
            color: #999;
            float: right;
            font-size: 32px;
            font-weight: 300;
            cursor: pointer;
            transition: color 0.3s;
        }

        .close-modal:hover {
            color: #333;
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 20px;
        }

        .modal-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .form-group-modal label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #444;
            font-size: 14px;
        }

        .form-input {
            width: 100%;
            padding: 12px 15px;
            border: 1px solid #ccc;
            border-radius: 6px;
            font-size: 15px;
            transition: border-color 0.3s, box-shadow 0.3s;
            box-sizing: border-box;
        }
        .form-help {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        .radio-group {
            display: flex;
            gap: 15px;
            margin-top: 10px;
        }
        .radio-label {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            font-weight: 500;
            cursor: pointer;
        }
        .radio-label input[type="radio"], .radio-label input[type="checkbox"] {
            margin-top: 3px;
        }
    </style>
    `;

    const deleteModal = `
    <!-- Delete Modal -->
    <div id="deleteModal" class="modal">
        <div class="modal-content" style="max-width: 400px; text-align: center; padding: 40px 30px; margin-top: 100px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #dc3545; margin-bottom: 20px;"></i>
            <h3 style="margin-bottom: 15px; color: var(--text-main);">Konfirmasi Hapus</h3>
            <p style="color: #666; margin-bottom: 30px; line-height: 1.5;">Apakah Anda yakin ingin menghapus data ini? Data yang sudah dihapus tidak dapat dikembalikan.</p>
            <form id="deleteForm" method="POST" action="">
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('deleteModal').style.display='none'" style="padding: 10px 25px; border-radius: 6px; border: none; font-weight: bold;">Batal</button>
                    <button type="submit" class="btn btn-danger" style="background-color: #dc3545; color: white; border: none; padding: 10px 25px; border-radius: 6px; cursor: pointer; font-weight: bold;">Ya, Hapus Data</button>
                </div>
            </form>
        </div>
    </div>
    `;

    const successModal = `
    <!-- Success Modal -->
    <div id="successModal" class="modal">
        <div class="modal-content" style="max-width: 600px; text-align: center; padding: 50px 30px;">
            <div style="font-size: 60px; color: var(--success); margin-bottom: 20px;">
                <i class="fas fa-check-circle"></i>
            </div>
            
            <h2>Pendaftaran Berhasil Disimpan!</h2>
            
            <div id="successNoRefContainer" style="display: none; background-color: #e8f5e9; padding: 20px; border-radius: 8px; border: 2px solid #4caf50; margin-bottom: 25px; text-align: center;">
                <h3 style="color: #2e7d32; margin-bottom: 5px; font-size: 16px;">Nomor Pendaftaran Anda:</h3>
                <div id="successNoRef" style="font-size: 26px; font-weight: bold; color: #1b5e20; letter-spacing: 1px;"></div>
                <p style="margin-top: 10px; font-size: 14px; color: #388e3c; margin-bottom: 0;">Harap simpan nomor pendaftaran ini untuk keperluan selanjutnya.</p>
            </div>
            
            <div style="background-color: #f8fbf8; padding: 20px; border-radius: 8px; border: 1px dashed var(--primary); margin-bottom: 30px; display: inline-block; text-align: left;">
                <h4 style="color: var(--primary); margin-bottom: 10px;">Langkah Selanjutnya:</h4>
                <ul style="color: var(--text-main); margin-left: 20px; line-height: 1.6;">
                    <li>Siapkan dokumen fisik yang telah Anda baca pada formulir pendaftaran beasiswa yang telah anda pilih</li>
                    <li>Tunggu pesan konfirmasi dari panitia via WhatsApp.</li>
                    <li>Silakan datang ke kantor JIC untuk verifikasi dokumen atau pembayaran administrasi jika di perlukan.</li>
                </ul>
            </div>
            
            <div>
                <button onclick="document.getElementById('successModal').style.display='none'; window.location.reload();" class="btn btn-primary" style="padding: 10px 30px; border-radius: 6px; font-weight: bold;">Tutup & Kembali</button>
            </div>
        </div>
    </div>
    `;

    const addSantriFields = `
                <h3 style="margin-bottom: 15px; color: var(--text-main); border-bottom: 1px solid #eee; padding-bottom: 10px;">A. Data Calon Santri</h3>
                <div class="modal-grid">
                    <div class="form-group-modal">
                        <label class="required">Nama Lengkap Santri</label>
                        <input type="text" name="namaSantri" class="form-input" placeholder="Masukkan nama lengkap" required>
                    </div>

                    <div class="form-group-modal">
                        <label>Nama Panggilan</label>
                        <input type="text" name="namaPanggilan" class="form-input" placeholder="Masukkan nama panggilan">
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Jenis Kelamin</label>
                        <div class="radio-group" style="display: flex; gap: 15px; margin-top: 10px;">
                            <label class="radio-label">
                                <input type="radio" name="jenisKelamin" value="Laki-laki" required> Laki-laki
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="jenisKelamin" value="Perempuan"> Perempuan
                            </label>
                        </div>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Tingkat Pendidikan yang Didaftar</label>
                        <select name="pendidikan" class="form-input" required>
                            <option value="">-- Pilih Satuan Pendidikan --</option>
                            <option value="PAUDQu A">PAUDQu A</option>
                            <option value="PAUDQu B">PAUDQu B</option>
                            <option value="TPQ A">TPQ A</option>
                            <option value="TPQ B">TPQ B</option>
                            <option value="MDT 1">MDT 1</option>
                            <option value="MDT 2">MDT 2</option>
                            <option value="MDT 3">MDT 3</option>
                            <option value="MDT 4">MDT 4</option>
                        </select>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Tempat Lahir</label>
                        <input type="text" name="tempatLahir" class="form-input" placeholder="Kota tempat lahir" required>
                    </div>
                    
                    <div class="form-group-modal">
                        <label class="required">Tanggal Lahir</label>
                        <input type="date" name="tanggalLahir" class="form-input" required>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Agama</label>
                        <select name="agama" class="form-input" required>
                            <option value="">-- Pilih Agama --</option>
                            <option value="Islam" selected>Islam</option>
                            <option value="Kristen">Kristen</option>
                            <option value="Katolik">Katolik</option>
                            <option value="Hindu">Hindu</option>
                            <option value="Buddha">Buddha</option>
                            <option value="Konghucu">Konghucu</option>
                        </select>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Status dalam Keluarga</label>
                        <select name="statusKeluarga" class="form-input" required>
                            <option value="">-- Pilih Status --</option>
                            <option value="Anak Kandung">Anak Kandung</option>
                            <option value="Anak Tiri">Anak Tiri</option>
                            <option value="Anak Angkat">Anak Angkat</option>
                        </select>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Anak ke (berdasarkan KK)</label>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <input type="number" name="anakKe" class="form-input" style="width: 70px;" required>
                            <span>dari</span>
                            <input type="number" name="dariBersaudara" class="form-input" style="width: 70px;" required>
                        </div>
                    </div>

                    <div class="form-group-modal">
                        <label>Asal Sekolah</label>
                        <input type="text" name="asalSekolah" class="form-input" placeholder="Nama asal sekolah">
                    </div>
                </div>
    `;

    const addDaftarUlangFields = `
                <h3 style="margin-bottom: 15px; color: var(--text-main); border-bottom: 1px solid #eee; padding-bottom: 10px;">A. Data Calon Santri</h3>
                <div class="modal-grid">
                    <div class="form-group-modal">
                        <label class="required">Jalur Pendaftaran</label>
                        <div class="radio-group" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                            <label class="radio-label">
                                <input type="radio" name="jalurPendaftaran" value="Reguler" required> Reguler
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="jalurPendaftaran" value="Beasiswa Dhuafa"> Beasiswa Dhuafa
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="jalurPendaftaran" value="Beasiswa Yatim/Piatu"> Beasiswa Yatim/Piatu
                            </label>
                        </div>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Nama Lengkap Santri</label>
                        <input type="text" name="namaSantri" class="form-input" placeholder="Masukkan nama lengkap" required>
                    </div>

                    <div class="form-group-modal">
                        <label>Nama Panggilan</label>
                        <input type="text" name="namaPanggilan" class="form-input" placeholder="Masukkan nama panggilan">
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Jenis Kelamin</label>
                        <div class="radio-group" style="display: flex; gap: 15px; margin-top: 10px;">
                            <label class="radio-label">
                                <input type="radio" name="jenisKelamin" value="Laki-laki" required> Laki-laki
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="jenisKelamin" value="Perempuan"> Perempuan
                            </label>
                        </div>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Unit Sebelumnya</label>
                        <select name="pendidikanSebelumnya" class="form-input" required>
                            <option value="">-- Pilih Tingkat --</option>
                            <option value="PAUDQu A">PAUDQu A</option>
                            <option value="PAUDQu B">PAUDQu B</option>
                            <option value="TPQ A">TPQ A</option>
                            <option value="TPQ B">TPQ B</option>
                            <option value="MDT 1">MDT 1</option>
                            <option value="MDT 2">MDT 2</option>
                            <option value="MDT 3">MDT 3</option>
                        </select>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Lanjut Ke Tingkat</label>
                        <select name="lanjutKe" class="form-input" required>
                            <option value="">-- Pilih Tujuan --</option>
                            <option value="PAUDQu B">PAUDQu B</option>
                            <option value="TPQ A">TPQ A</option>
                            <option value="TPQ B">TPQ B</option>
                            <option value="MDT 1">MDT 1</option>
                            <option value="MDT 2">MDT 2</option>
                            <option value="MDT 3">MDT 3</option>
                            <option value="MDT 4">MDT 4</option>
                        </select>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Tempat Lahir</label>
                        <input type="text" name="tempatLahir" class="form-input" placeholder="Kota tempat lahir" required>
                    </div>
                    
                    <div class="form-group-modal">
                        <label class="required">Tanggal Lahir</label>
                        <input type="date" name="tanggalLahir" class="form-input" required>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Agama</label>
                        <select name="agama" class="form-input" required>
                            <option value="">-- Pilih Agama --</option>
                            <option value="Islam" selected>Islam</option>
                            <option value="Kristen">Kristen</option>
                            <option value="Katolik">Katolik</option>
                            <option value="Hindu">Hindu</option>
                            <option value="Buddha">Buddha</option>
                            <option value="Konghucu">Konghucu</option>
                        </select>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Status dalam Keluarga</label>
                        <select name="statusKeluarga" class="form-input" required>
                            <option value="">-- Pilih Status --</option>
                            <option value="Anak Kandung">Anak Kandung</option>
                            <option value="Anak Tiri">Anak Tiri</option>
                            <option value="Anak Angkat">Anak Angkat</option>
                        </select>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Anak ke (berdasarkan KK)</label>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <input type="number" name="anakKe" class="form-input" style="width: 70px;" required>
                            <span>dari</span>
                            <input type="number" name="dariBersaudara" class="form-input" style="width: 70px;" required>
                        </div>
                    </div>

                    <div class="form-group-modal">
                        <label>Asal Sekolah</label>
                        <input type="text" name="asalSekolah" class="form-input" placeholder="Nama asal sekolah">
                    </div>
                </div>
    `;

    const commonParentFields = `
                <h3 style="margin-bottom: 15px; color: var(--text-main); border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 20px;">B. Data Orang Tua / Wali</h3>
                <div class="modal-grid">
                    <div class="form-group-modal">
                        <label class="required">Email Pendaftar</label>
                        <input type="email" name="email" class="form-input" placeholder="contoh@email.com" required>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Nama Ayah</label>
                        <input type="text" name="namaAyah" class="form-input" placeholder="Nama lengkap ayah" required>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Pekerjaan Ayah</label>
                        <input type="text" name="pekerjaanAyah" class="form-input" placeholder="Pekerjaan ayah" required>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">No. Telp Ayah</label>
                        <input type="tel" name="teleponAyah" class="form-input" placeholder="08xxxxxxxxxx" required>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Nama Ibu</label>
                        <input type="text" name="namaIbu" class="form-input" placeholder="Nama lengkap ibu" required>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Pekerjaan Ibu</label>
                        <input type="text" name="pekerjaanIbu" class="form-input" placeholder="Pekerjaan ibu" required>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">No. Telp Ibu</label>
                        <input type="tel" name="teleponIbu" class="form-input" placeholder="08xxxxxxxxxx" required>
                    </div>
                </div>

                <div class="form-group-modal" style="margin-bottom: 20px;">
                    <label class="required">Alamat Lengkap</label>
                    <textarea name="alamat" class="form-input" placeholder="Alamat domisili saat ini" rows="3" required></textarea>
                </div>
    `;

    const addRegularTerms = `
    <div style="background-color: var(--bg-card); border: 1px solid var(--border); padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="margin-bottom: 15px; color: var(--text-main); text-align: left;">Selamat Datang!</h3>
        <p style="margin-bottom: 15px; font-size: 14px; line-height: 1.6; text-align: left;">Assalamualaikum warahmatullahi wabarakatuh,<br><br>Terima kasih atas minat Anda untuk menjadi bagian dari Madrasah Jakarta Islamic Centre. Kami memiliki tujuan untuk menjadi sekolah sekaligus komunitas pembelajaran yang menghasilkan generasi qur'ani yang cerdas, mandiri, kreatif dan berwawasan luas.<br><br>Silahkan Anda mengisi formulir pendaftaran berikut untuk memulai PENDAFTARAN!</p>
        
        <h4 style="margin-top: 25px; margin-bottom: 10px; color: var(--text-main); text-align: left;">SYARAT & KETENTUAN PENDAFTARAN</h4>
        <p style="margin-bottom: 15px; font-size: 14px; line-height: 1.6; text-align: left;">Harap membaca ketentuan berikut dengan seksama sebelum mengisi dan mengirimkan aplikasi pendaftaran Anda. Saat Anda mengirimkan aplikasi pendaftaran Anda, Anda berarti telah menyetujui seluruh syarat dan ketentuan berikut.</p>
        
        <div style="max-height: 150px; overflow-y: auto; background: var(--bg-main); padding: 15px; border-radius: 4px; font-size: 13px; line-height: 1.6; border: 1px solid var(--border); margin-bottom: 15px; text-align: left;">
            <p><strong>[ A. KETENTUAN UMUM ]</strong><br>
            Proses pendaftaran SPMB Madrasah Jakarta Islamic Centre dimulai setelah Anda melengkapi formulir singkat pada formulir SPMB yang telah kami berikan.<br><br>
            Biaya pendaftaran dibayarkan melalui bank transfer pada rekening yang telah ditentukan. Sertakan bukti pembayaran dalam formulir pendaftaran di bawah ini.<br><br>
            Semua biaya pendaftaran yang sudah dibayarkan tidak dapat ditarik kembali/dikembalikan atau dialihkan untuk pembayaran lainnya.</p>
            
            <hr style="border: 0; border-top: 1px dashed var(--border); margin: 15px 0;">
            
            <p><strong>[ B. INFORMASI UMUM ]</strong><br>
            Saat orang tua/wali sah mengisi Formulir Pendaftaran, Madrasah Jakarta Islamic Centre akan mengumpulkan berbagai informasi pribadi tentang orang tua/wali sah dan anak.<br><br>
            Informasi yang telah dibagikan oleh orang tua/wali resmi kepada Madrasah Jakarta Islamic Centre melalui pendaftaran atau email ini akan digunakan oleh Madrasah Jakarta Islamic Centre untuk memenuhi komitmen layanan kami kepada Anda. Kami tidak membagikan informasi pribadi Anda kepada orang atau organisasi manapun, dan pihak ketiga tidak diizinkan untuk menggunakan informasi pribadi Anda untuk tujuan mereka sendiri.<br><br>
            Setiap informasi yang salah, tidak akurat atau menyesatkan yang diberikan pada Formulir Pendaftaran dan/atau dokumen pendukung lainnya dapat menyebabkan penolakan pendaftaran.<br><br>
            Orang tua/wali yang sah harus setiap saat menginformasikan kepada Madrasah Jakarta Islamic Centre tentang setiap perubahan informasi yang diberikan dalam formulir pendaftaran secara tertulis kepada pihak administrasi keanggotaan sekolah, di mana anak tersebut telah terdaftar sebagai santri di sistem Madrasah Jakarta Islamic Centre.<br><br>
            Semua pemberitahuan, surat dan korespondensi dari Madrasah Jakarta Islamic Centre akan dikirim ke orang tua/wali yang sah di alamat yang diberikan dalam Formulir Pendaftaran dan akan dianggap cukup dilayani jika dikirim melalui pos biasa, email atau diserahkan ke anak.</p>

            <hr style="border: 0; border-top: 1px dashed var(--border); margin: 15px 0;">
            
            <p><strong>[ C. BIAYA PENDAFTARAN & PROSES PENERIMAAN ]</strong><br>
            Proses pendaftaran calon santri baru akan dimulai setelah Formulir Pendaftaran diserahkan ke Madrasah Jakarta Islamic Centre melalui formulir ini oleh Panitia SPMB Madrasah Jakarta Islamic Centre.<br><br>
            Semua biaya yang telah dibayarkan tidak dapat dikembalikan atau ditransfer ke pembayaran lain terkecuali syarat dan ketentuan berlaku.<br><br>
            Madrasah Jakarta Islamic Centre dapat membatalkan pendaftaran Anda jika ada pembayaran terutang terkait anak Anda.<br><br>
            Jika pendaftaran dibatalkan, semua proses pengajuan/pendaftaran ulang akan dianggap sebagai aplikasi baru. Proses aplikasi baru akan ditempatkan dalam antrian lagi di tingkat kelas dan tahun akademik yang sesuai.<br><br>
            Keputusan penerimaan santri adalah kebijakan mutlak pihak Madrasah Jakarta Islamic Centre. Madrasah Jakarta Islamic Centre pada umumnya mempertimbangkan berbagai faktor, antara lain usia anak, kemampuan akademik, dan perilaku anak serta visi & misi orang tua/wali yang sah.<br><br>
            Santri tidak boleh memulai tahun akademik kecuali biaya pendidikan telah dibayarkan secara penuh.<br><br>
            Pendaftaran ulang untuk santri yang melanjutkan tidak akan diterima kecuali semua biaya terutang telah dibayar.</p>

            <hr style="border: 0; border-top: 1px dashed var(--border); margin: 15px 0;">

            <p><strong>[ D. PENERIMAAN SANTRI ]</strong><br>
            Formulir Pendaftaran yang telah diisi adalah sebagai bukti anak anda akan mengikuti Observasi. Setelah Anda diberi tahu tentang hasil observasi anak Anda dan biaya pendaftaran telah dilunasi, akan ada kontrak yang mengikat antara Madrasah Jakarta Islamic Centre dan orang tua/wali yang sah, dengan ketentuan bahwa seluruh peraturan yang berlaku di Madrasah Jakarta Islamic Centre telah dipatuhi.<br><br>
            Dengan memberi kami izin ini, ini memungkinkan kami untuk memberi Anda berita dan layanan terbaru yang kami kembangkan saat ini atau di masa depan.<br><br>
            Atas perhatian Bapak/Ibu kami sampaikan terima kasih.<br><br>
            Wassalamualaikum warahmatullahi wabarakatuh.<br><br>
            Salam Hormat,<br>
            Panitia SPMB<br>
            Madrasah Jakarta Islamic Centre</p>
        </div>
        
        <div class="form-group-modal" style="margin-top: 15px; text-align: left;">
            <label class="radio-label" style="font-weight: 500; color: var(--primary);">
                <input type="checkbox" name="setujuSK" required> Saya telah membaca dan menyetujui seluruh Syarat & Ketentuan pendaftaran di atas.
            </label>
        </div>
    </div>
    `;

    const addBeasiswaTerms = `
    <div style="background-color: var(--bg-card); border: 1px solid var(--border); padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="margin-bottom: 15px; color: var(--text-main); text-align: left;">Selamat Datang di Jalur Beasiswa!</h3>
        <p style="margin-bottom: 15px; font-size: 14px; line-height: 1.6; text-align: left;">Assalamualaikum warahmatullahi wabarakatuh,<br><br>Madrasah Jakarta Islamic Centre menyediakan berbagai opsi beasiswa untuk membantu meringankan biaya pendidikan bagi santri yang berhak. Silahkan Anda mengisi formulir pendaftaran berikut untuk memulai pendaftaran di jalur beasiswa yang sesuai.</p>
        
        <h4 style="margin-top: 25px; margin-bottom: 10px; color: var(--text-main); text-align: left;">SYARAT & KETENTUAN PENDAFTARAN BEASISWA</h4>
        <p style="margin-bottom: 15px; font-size: 14px; line-height: 1.6; text-align: left;">Harap membaca ketentuan berikut dengan seksama sebelum mengisi aplikasi pendaftaran Anda.</p>
        
        <div style="max-height: 150px; overflow-y: auto; background: var(--bg-main); padding: 15px; border-radius: 4px; font-size: 13px; line-height: 1.6; border: 1px solid var(--border); margin-bottom: 15px; text-align: left;">
            <p><strong>[ KETENTUAN BEASISWA ]</strong><br>
            1. Calon santri yang mendaftar melalui jalur beasiswa wajib melampirkan dokumen pendukung asli saat proses verifikasi (seperti SKTM, Akta Kematian untuk Yatim, dll).<br>
            2. Pihak Panitia SPMB berhak melakukan survei atau membatalkan status beasiswa apabila data yang diberikan terbukti tidak valid.<br>
            3. Ketentuan biaya dan potongan diatur lebih lanjut dalam kebijakan sekolah.</p>
        </div>
        
        <div class="form-group-modal" style="margin-top: 15px; text-align: left;">
            <label class="radio-label" style="font-weight: 500; color: var(--primary);">
                <input type="checkbox" name="setujuSK" required> Saya telah membaca dan menyetujui seluruh Syarat & Ketentuan pendaftaran di atas.
            </label>
        </div>
    </div>
    `;

    const addBeasiswaJalurSelector = `
        <h3 style="margin-bottom: 15px; color: var(--text-main); border-bottom: 1px solid #eee; padding-bottom: 10px; text-align: left;">Jalur Pendaftaran Beasiswa</h3>
        <div class="form-group-modal" style="margin-bottom: 30px;">
            <div class="radio-group" style="flex-direction: column; gap: 15px; display: flex; text-align: left;">
                <label class="radio-label">
                    <input type="radio" name="jalurBeasiswa" value="Beasiswa Dhuafa" required>
                    <div>
                        <strong>Beasiswa Dhuafa</strong>
                        <div class="form-help">Potongan biaya khusus bagi kaum dhuafa (wajib melampirkan SKTM).</div>
                    </div>
                </label>
                <label class="radio-label">
                    <input type="radio" name="jalurBeasiswa" value="Beasiswa Yatim/Piatu">
                    <div>
                        <strong>Beasiswa Yatim/Piatu</strong>
                        <div class="form-help">Potongan biaya khusus anak yatim/piatu (wajib melampirkan Surat Keterangan/Akta Kematian dan SKTM).</div>
                    </div>
                </label>
                <label class="radio-label">
                    <input type="radio" name="jalurBeasiswa" value="Beasiswa Pegawai/Komunitas JIC">
                    <div>
                        <strong>Beasiswa Pegawai/Komunitas JIC</strong>
                        <div class="form-help">Potongan biaya khusus bagi keluarga pegawai/pjlp/komunitas di lingkungan JIC. (wajib melampirkan KTP & KK orang tua serta kartu pegawai/pjlp/komunitas JIC atau surat keterangan dari kantor atau komunitas)</div>
                    </div>
                </label>
                <label class="radio-label">
                    <input type="radio" name="jalurBeasiswa" value="Beasiswa Satu Keluarga">
                    <div>
                        <strong>Beasiswa Satu Keluarga</strong>
                        <div class="form-help">Potongan biaya khusus jika mendaftarkan atau menyekolahkan 2 anak kandung atau lebih dalam satu keluarga. (wajib melampirkan KTP & KK orang tua)</div>
                    </div>
                </label>
            </div>
        </div>
    `;

    let addModal = '';
    if (filePath.includes('daftar-ulang')) {
        addModal = `
        <!-- The Add Modal -->
        <div id="addSantriModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 style="color: var(--primary); margin: 0;">Tambah Data</h2>
                    <span class="close-modal" onclick="document.getElementById('addSantriModal').style.display='none'">&times;</span>
                </div>

                <form action="${postAction}" method="POST" onsubmit="return handleAjaxSubmit(event, this)">
                    ${addDaftarUlangFields}
                    ${commonParentFields}

                    <div style="margin-top: 30px; text-align: right; border-top: 1px solid #eee; padding-top: 15px;">
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('addSantriModal').style.display='none'" style="padding: 10px 25px; border-radius: 6px; border: none; font-weight: bold;">Batal</button>
                        <button type="submit" class="btn btn-primary" style="margin-left: 10px; padding: 10px 25px; border-radius: 6px; border: none; font-weight: bold; background-color: #007bff; color: white;">Simpan Data</button>
                    </div>
                </form>
            </div>
        </div>
        `;
    } else {
        addModal = `
        <!-- The Add Modal -->
        <div id="addSantriModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 style="color: var(--primary); margin: 0;">Tambah Santri Baru</h2>
                    <span class="close-modal" onclick="document.getElementById('addSantriModal').style.display='none'">&times;</span>
                </div>

                <form action="${postAction}" method="POST" onsubmit="return handleAjaxSubmit(event, this)">
                    ${addRegularTerms}
                    ${addSantriFields}
                    ${commonParentFields}

                    <div style="margin-top: 30px; text-align: right; border-top: 1px solid #eee; padding-top: 15px;">
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('addSantriModal').style.display='none'" style="padding: 10px 25px; border-radius: 6px; border: none; font-weight: bold;">Batal</button>
                        <button type="submit" class="btn btn-primary" style="margin-left: 10px; padding: 10px 25px; border-radius: 6px; border: none; font-weight: bold; background-color: #007bff; color: white;">Simpan Data</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- The Add Modal (Scholarship) -->
        <div id="addSantriBeasiswaModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 style="color: #d35400; margin: 0;">Tambah Santri Baru (Jalur Beasiswa)</h2>
                    <span class="close-modal" onclick="document.getElementById('addSantriBeasiswaModal').style.display='none'">&times;</span>
                </div>

                <form action="/daftar/beasiswa" method="POST" onsubmit="return handleAjaxSubmit(event, this)">
                    ${addBeasiswaTerms}
                    ${addBeasiswaJalurSelector}
                    ${addSantriFields}
                    ${commonParentFields}

                    <div style="margin-top: 30px; text-align: right; border-top: 1px solid #eee; padding-top: 15px;">
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('addSantriBeasiswaModal').style.display='none'" style="padding: 10px 25px; border-radius: 6px; border: none; font-weight: bold;">Batal</button>
                        <button type="submit" class="btn btn-primary" style="margin-left: 10px; padding: 10px 25px; border-radius: 6px; border: none; font-weight: bold; background-color: #d35400; color: white;">Simpan Data Beasiswa</button>
                    </div>
                </form>
            </div>
        </div>
        `;
    }

    const scripts = `
    <script>
        async function handleAjaxSubmit(event, formElement) {
            event.preventDefault();
            const submitBtn = formElement.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
            submitBtn.disabled = true;

            const formData = new FormData(formElement);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch(formElement.action, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                
                if(result.success) {
                    formElement.closest('.modal').style.display = 'none';
                    const successModal = document.getElementById('successModal');
                    if(result.noRef) {
                        document.getElementById('successNoRef').innerText = result.noRef;
                        document.getElementById('successNoRefContainer').style.display = 'block';
                    }
                    successModal.style.display = 'block';
                } else {
                    alert('Terjadi kesalahan saat menyimpan data.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Gagal menghubungi server.');
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    </script>
    <%- include('partials/footer') %>
    `;

    fs.writeFileSync(filePath + '.ejs', content + css + deleteModal + successModal + addModal + scripts);
}

cleanAndRebuild('frontend/views/santri', '/daftar');
cleanAndRebuild('frontend/views/santri-daftar-ulang', '/daftar-ulang');

// Fix the onclick attributes on the buttons in the HTML directly
function fixOnclick(filePath) {
    let content = fs.readFileSync(filePath + '.ejs', 'utf-8');
    // Replace onclick="openAddSantriModal()" with direct assignment
    content = content.replace(/onclick="openAddSantriModal\(\)"/g, "onclick=\"document.getElementById('addSantriModal').style.display='block'\"");
    // Replace openDeleteModal to directly use the modal id
    content = content.replace(/onclick="openDeleteModal\('([^']+)'\)"/g, "onclick=\"document.getElementById('deleteForm').action='$1'; document.getElementById('deleteModal').style.display='block';\"");
    fs.writeFileSync(filePath + '.ejs', content);
}

fixOnclick('frontend/views/santri');
fixOnclick('frontend/views/santri-daftar-ulang');

console.log("Complete fix applied.");
