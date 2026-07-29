const fs = require('fs');

const styleBlock = `
    <style>
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
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
        }

        .close-modal {
            color: #999;
            float: right;
            font-size: 32px;
            font-weight: 300;
            cursor: pointer;
            margin-left: 15px;
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

        .form-input:focus {
            border-color: #007bff;
            box-shadow: 0 0 5px rgba(0, 123, 255, 0.3);
            outline: none;
        }
    </style>
`;

const commonScripts = `
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
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                
                if(result.success) {
                    closeAddSantriModal();
                    const successModal = document.getElementById('successModal');
                    if(result.noRef) {
                        document.getElementById('successNoRef').innerText = result.noRef;
                        document.getElementById('successNoRefContainer').style.display = 'block';
                    } else {
                        document.getElementById('successNoRefContainer').style.display = 'none';
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

const successModalHtml = `
    <!-- Success Modal -->
    <div id="successModal" class="modal">
        <div class="modal-content" style="max-width: 600px; text-align: center; padding: 50px 30px;">
            <div style="font-size: 60px; color: var(--success); margin-bottom: 20px;">
                <i class="fas fa-check-circle"></i>
            </div>
            
            <h2>Pendaftaran Berhasil Disimpan!</h2>
            
            <div id="successNoRefContainer" style="display: none; background-color: #e8f5e9; padding: 20px; border-radius: var(--radius-sm); border: 2px solid #4caf50; margin-bottom: 25px; text-align: center;">
                <h3 style="color: #2e7d32; margin-bottom: 5px; font-size: 16px;">Nomor Pendaftaran Anda:</h3>
                <div id="successNoRef" style="font-size: 26px; font-weight: bold; color: #1b5e20; letter-spacing: 1px;"></div>
                <p style="margin-top: 10px; font-size: 14px; color: #388e3c; margin-bottom: 0;">Harap simpan nomor pendaftaran ini untuk keperluan selanjutnya.</p>
            </div>
            
            <div style="background-color: #f8fbf8; padding: 20px; border-radius: var(--radius-sm); border: 1px dashed var(--primary); margin-bottom: 30px; display: inline-block; text-align: left;">
                <h4 style="color: var(--primary); margin-bottom: 10px;">Langkah Selanjutnya:</h4>
                <ul style="color: var(--text-main); margin-left: 20px; line-height: 1.6;">
                    <li>Siapkan dokumen fisik yang telah Anda baca pada formulir pendaftaran beasiswa yang telah anda pilih</li>
                    <li>Tunggu pesan konfirmasi dari panitia via WhatsApp.</li>
                    <li>Silakan datang ke kantor JIC untuk verifikasi dokumen atau pembayaran administrasi jika di perlukan.</li>
                </ul>
            </div>
            
            <div>
                <button onclick="closeSuccessModalAndReload()" class="btn-submit" style="display: inline-block; width: auto; background-color: var(--surface); color: var(--primary); border: 2px solid var(--primary); padding: 10px 30px; cursor: pointer; border-radius: 6px; font-weight: bold;">Tutup & Kembali</button>
            </div>
        </div>
    </div>
    <script>
    function closeSuccessModalAndReload() {
        document.getElementById('successModal').style.display = 'none';
        window.location.reload();
    }
    </script>
`;

// ==========================================
// Rebuild santri.ejs
// ==========================================
let santriContent = fs.readFileSync('frontend/views/santri_backup.ejs', 'utf-8');
const santriCutIndex = santriContent.indexOf('<!-- The Add Modal -->');
if(santriCutIndex !== -1) {
    santriContent = santriContent.substring(0, santriCutIndex);
}

const addModalSantri = `
    <!-- The Add Modal -->
    <div id="addSantriModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 style="color: var(--primary); margin: 0;">Tambah Santri Baru</h2>
                <span class="close-modal" onclick="closeAddSantriModal()">&times;</span>
            </div>

            <form action="/daftar" method="POST" onsubmit="return handleAjaxSubmit(event, this)">
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
                        <div class="radio-group">
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
                        <label class="required">Anak ke (berdasarkan Kartu Keluarga)</label>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span>Anak ke</span>
                            <input type="number" name="anakKe" class="form-input" style="width: 70px;" required>
                            <span>dari</span>
                            <input type="number" name="dariBersaudara" class="form-input" style="width: 70px;" required>
                            <span>Bersaudara</span>
                        </div>
                    </div>

                    <div class="form-group-modal">
                        <label>Asal Sekolah</label>
                        <input type="text" name="asalSekolah" class="form-input" placeholder="Nama asal sekolah. Kosongkan jika belum pernah.">
                    </div>
                </div>

                <h3 style="margin-bottom: 15px; color: var(--text-main); border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 20px;">B. Data Orang Tua / Wali</h3>
                <div class="modal-grid">
                    <div class="form-group-modal">
                        <label class="required">Email Pendaftar (Orang Tua/Wali)</label>
                        <input type="email" name="email" class="form-input" placeholder="contoh@email.com" required>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Nama Ayah</label>
                        <input type="text" name="namaAyah" class="form-input" placeholder="Nama lengkap ayah" required>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Pekerjaan Ayah</label>
                        <input type="text" name="pekerjaanAyah" class="form-input" placeholder="Pekerjaan ayah saat ini" required>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">No. Telepon/WhatsApp Ayah</label>
                        <input type="tel" name="teleponAyah" class="form-input" placeholder="08xxxxxxxxxx" required>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Nama Ibu</label>
                        <input type="text" name="namaIbu" class="form-input" placeholder="Nama lengkap ibu" required>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Pekerjaan Ibu</label>
                        <input type="text" name="pekerjaanIbu" class="form-input" placeholder="Pekerjaan ibu saat ini" required>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">No. Telepon/WhatsApp Ibu</label>
                        <input type="tel" name="teleponIbu" class="form-input" placeholder="08xxxxxxxxxx" required>
                    </div>
                </div>

                <div class="form-group-modal" style="margin-bottom: 20px;">
                    <label class="required">Alamat Lengkap</label>
                    <textarea name="alamat" class="form-input" placeholder="Alamat domisili saat ini" rows="3" required></textarea>
                </div>

                <div style="margin-top: 30px; text-align: right; border-top: 1px solid #eee; padding-top: 15px;">
                    <button type="button" class="btn btn-secondary" onclick="closeAddSantriModal()" style="padding: 10px 25px; border-radius: 6px; border: none; font-weight: bold;">Batal</button>
                    <button type="submit" class="btn btn-primary" style="margin-left: 10px; padding: 10px 25px; border-radius: 6px; border: none; font-weight: bold; background-color: #007bff; color: white;">Simpan Data</button>
                </div>
            </form>
        </div>
    </div>
`;

fs.writeFileSync('frontend/views/santri.ejs', santriContent + styleBlock + addModalSantri + successModalHtml + commonScripts);


// ==========================================
// Rebuild santri-daftar-ulang.ejs
// ==========================================
let duContent = fs.readFileSync('frontend/views/santri-daftar-ulang_backup.ejs', 'utf-8');
const duCutIndex = duContent.indexOf('<!-- The Add Modal -->');
if(duCutIndex !== -1) {
    duContent = duContent.substring(0, duCutIndex);
}

const addModalDU = `
    <!-- The Add Modal -->
    <div id="addSantriModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 style="color: var(--primary); margin: 0;">Tambah Data Daftar Ulang</h2>
                <span class="close-modal" onclick="closeAddSantriModal()">&times;</span>
            </div>

            <form action="/daftar-ulang" method="POST" onsubmit="return handleAjaxSubmit(event, this)">
                <h3 style="margin-bottom: 15px; color: var(--text-main); border-bottom: 1px solid #eee; padding-bottom: 10px;">A. Data Calon Santri</h3>
                <div class="modal-grid">
                    <div class="form-group-modal">
                        <label class="required">Jalur Pendaftaran Daftar Ulang</label>
                        <div class="radio-group" style="flex-direction: column; gap: 10px;">
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
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" name="jenisKelamin" value="Laki-laki" required> Laki-laki
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="jenisKelamin" value="Perempuan"> Perempuan
                            </label>
                        </div>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Unit / Satuan Pendidikan Sebelumnya</label>
                        <select name="pendidikanSebelumnya" class="form-input" required>
                            <option value="">-- Pilih Tingkat Sebelumnya --</option>
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
                        <label class="required">Tujuan / Lanjut Ke Tingkat</label>
                        <select name="lanjutKe" class="form-input" required>
                            <option value="">-- Pilih Tujuan Tingkat --</option>
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
                        <label class="required">Anak ke (berdasarkan Kartu Keluarga)</label>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span>Anak ke</span>
                            <input type="number" name="anakKe" class="form-input" style="width: 70px;" required>
                            <span>dari</span>
                            <input type="number" name="dariBersaudara" class="form-input" style="width: 70px;" required>
                            <span>Bersaudara</span>
                        </div>
                    </div>

                    <div class="form-group-modal">
                        <label>Asal Sekolah</label>
                        <input type="text" name="asalSekolah" class="form-input" placeholder="Nama asal sekolah. Kosongkan jika belum pernah.">
                    </div>
                </div>

                <h3 style="margin-bottom: 15px; color: var(--text-main); border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 20px;">B. Data Orang Tua / Wali</h3>
                <div class="modal-grid">
                    <div class="form-group-modal">
                        <label class="required">Email Pendaftar (Orang Tua/Wali)</label>
                        <input type="email" name="email" class="form-input" placeholder="contoh@email.com" required>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Nama Ayah</label>
                        <input type="text" name="namaAyah" class="form-input" placeholder="Nama lengkap ayah" required>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Pekerjaan Ayah</label>
                        <input type="text" name="pekerjaanAyah" class="form-input" placeholder="Pekerjaan ayah saat ini" required>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">No. Telepon/WhatsApp Ayah</label>
                        <input type="tel" name="teleponAyah" class="form-input" placeholder="08xxxxxxxxxx" required>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Nama Ibu</label>
                        <input type="text" name="namaIbu" class="form-input" placeholder="Nama lengkap ibu" required>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">Pekerjaan Ibu</label>
                        <input type="text" name="pekerjaanIbu" class="form-input" placeholder="Pekerjaan ibu saat ini" required>
                    </div>

                    <div class="form-group-modal">
                        <label class="required">No. Telepon/WhatsApp Ibu</label>
                        <input type="tel" name="teleponIbu" class="form-input" placeholder="08xxxxxxxxxx" required>
                    </div>
                </div>

                <div class="form-group-modal" style="margin-bottom: 20px;">
                    <label class="required">Alamat Lengkap</label>
                    <textarea name="alamat" class="form-input" placeholder="Alamat domisili saat ini" rows="3" required></textarea>
                </div>

                <div style="margin-top: 30px; text-align: right; border-top: 1px solid #eee; padding-top: 15px;">
                    <button type="button" class="btn btn-secondary" onclick="closeAddSantriModal()" style="padding: 10px 25px; border-radius: 6px; border: none; font-weight: bold;">Batal</button>
                    <button type="submit" class="btn btn-primary" style="margin-left: 10px; padding: 10px 25px; border-radius: 6px; border: none; font-weight: bold; background-color: #007bff; color: white;">Simpan Data</button>
                </div>
            </form>
        </div>
    </div>
`;

fs.writeFileSync('frontend/views/santri-daftar-ulang.ejs', duContent + styleBlock + addModalDU + successModalHtml + commonScripts);

console.log("Rebuild complete.");
