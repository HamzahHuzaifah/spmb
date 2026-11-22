// ============================================================================
// SUPER ADMIN MASTER DATA & CONFIGURATION MODULE
// Mengelola:
// 1. Navigasi Tab Master Data (Jenjang, Gelombang, Jalur, Tahun Ajaran, Jumbotron)
// 2. Modal CRUD Dinamis & Submit AJAX
// 3. Kompresi & Pratinjau Gambar Jumbotron (Client-Side WebP/JPEG Compression)
// 4. Pengaturan Transisi & Overlay Jumbotron
// ============================================================================

function switchTab(tabId) {
    document.querySelectorAll('.tab-content-section').forEach(el => {
        el.style.display = 'none';
    });
    document.querySelectorAll('.nav-tab').forEach(el => {
        el.style.background = 'transparent';
        el.style.color = '#64748b';
        el.classList.remove('active-tab');
    });

    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) targetTab.style.display = 'block';

    const activeBtn = document.getElementById('tab-btn-' + tabId);
    if (activeBtn) {
        activeBtn.style.background = '#e0f2fe';
        activeBtn.style.color = '#0ea5e9';
        activeBtn.classList.add('active-tab');
    }
}

function openModal(type, isEdit = false, data = {}) {
    const modal = document.getElementById('masterModal');
    if (!modal) return;
    const modalContent = modal.querySelector('div');

    const titleName = type.charAt(0).toUpperCase() + type.slice(1);
    document.getElementById('modalTitle').innerText = isEdit ? 'Edit ' + titleName : 'Tambah ' + titleName;
    document.getElementById('formType').value = type;
    document.getElementById('dataId').value = data.id || '';
    document.getElementById('m_nama').value = data.nama || '';
    document.getElementById('m_status').value = data.status || 'Aktif';

    document.querySelectorAll('.jenjang-only, .gelombang-only, .jalur-only, .tahun-ajaran-only, .jumbotron-only').forEach(el => {
        el.style.display = 'none';
    });
    const statusHelp = document.getElementById('status_help_text');
    if (statusHelp) statusHelp.style.display = (type === 'tahun-ajaran') ? 'block' : 'none';

    if (type === 'jenjang') {
        document.querySelectorAll('.jenjang-only').forEach(el => (el.style.display = 'block'));
        document.getElementById('m_kuota').value = data.kuota || 0;
    } else if (type === 'gelombang') {
        document.querySelectorAll('.gelombang-only').forEach(el => (el.style.display = 'block'));
        document.getElementById('m_tgl_mulai').value = data.tanggal_mulai ? data.tanggal_mulai.split('T')[0] : '';
        document.getElementById('m_tgl_selesai').value = data.tanggal_selesai ? data.tanggal_selesai.split('T')[0] : '';
        document.getElementById('m_buka_baru').checked = data.buka_pendaftaran_baru !== undefined ? Boolean(data.buka_pendaftaran_baru) : true;
        document.getElementById('m_buka_beasiswa').checked = data.buka_pendaftaran_beasiswa !== undefined ? Boolean(data.buka_pendaftaran_beasiswa) : true;
        document.getElementById('m_buka_ulang').checked = data.buka_daftar_ulang !== undefined ? Boolean(data.buka_daftar_ulang) : true;
    } else if (type === 'jalur') {
        document.querySelectorAll('.jalur-only').forEach(el => (el.style.display = 'block'));
        document.getElementById('m_biaya').value = data.biaya || 0;
        document.getElementById('m_syarat').value = data.syarat_dokumen || '';
    } else if (type === 'tahun-ajaran') {
        document.querySelectorAll('.tahun-ajaran-only').forEach(el => (el.style.display = 'block'));
        const curY = new Date().getFullYear();
        document.getElementById('m_tahun_mulai').value = data.tahun_mulai || curY;
        document.getElementById('m_tahun_selesai').value = data.tahun_selesai || (curY + 1);
        if (!isEdit && !data.nama) {
            document.getElementById('m_nama').value = `${curY}/${curY + 1}`;
        }
    } else if (type === 'jumbotron') {
        document.querySelectorAll('.jumbotron-only').forEach(el => (el.style.display = 'block'));
        document.getElementById('m_nama').value = data.judul || data.nama || '';
        document.getElementById('m_urutan').value = data.urutan || 1;
        document.getElementById('m_image_base64').value = '';
        document.getElementById('m_jumbotron_file').value = '';
        document.getElementById('m_image_url_manual').value = data.image_url || '';

        const prevWrap = document.getElementById('m_jumbotron_preview_wrap');
        const prevImg = document.getElementById('m_jumbotron_preview');
        if (data.image_url) {
            prevImg.src = data.image_url;
            prevWrap.style.display = 'block';
        } else {
            prevImg.src = '';
            prevWrap.style.display = 'none';
        }
    }

    modal.style.display = 'flex';
    void modal.offsetWidth;
    modal.style.opacity = '1';
    if (modalContent) modalContent.style.transform = 'translateY(0)';
}

function closeModal() {
    const modal = document.getElementById('masterModal');
    if (!modal) return;
    const modalContent = modal.querySelector('div');

    modal.style.opacity = '0';
    if (modalContent) modalContent.style.transform = 'translateY(-20px)';

    setTimeout(() => {
        modal.style.display = 'none';
        const form = document.getElementById('masterForm');
        if (form) form.reset();
    }, 300);
}

function setDefaultTA(id) {
    Swal.fire({
        title: 'Jadikan Default Publik?',
        text: 'Form pendaftaran publik akan diarahkan ke tahun ajaran ini.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Ya, Jadikan Default',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/superadmin/master-data/tahun-ajaran/set-default/${id}`, { method: 'POST' })
                .then(r => r.json())
                .then(res => {
                    if (res.success) {
                        Swal.fire('Berhasil!', res.message, 'success').then(() => location.reload());
                    } else {
                        Swal.fire('Gagal!', res.message, 'error');
                    }
                });
        }
    });
}

function deleteData(type, id) {
    Swal.fire({
        title: 'Hapus Data?',
        text: 'Tindakan ini tidak dapat dibatalkan!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Ya, hapus!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/superadmin/master-data/${type}/delete/${id}`, { method: 'POST' })
                .then(r => r.json())
                .then(res => {
                    if (res.success) {
                        Swal.fire('Terhapus!', 'Data telah dihapus.', 'success').then(() => location.reload());
                    } else {
                        Swal.fire('Gagal!', res.message, 'error');
                    }
                });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const masterForm = document.getElementById('masterForm');
    if (masterForm) {
        masterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const type = document.getElementById('formType').value;
            const id = document.getElementById('dataId').value;
            const url = `/superadmin/master-data/${type}/${id ? 'edit/' + id : 'add'}`;

            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(new FormData(this)))
            })
                .then(r => r.json())
                .then(res => {
                    if (res.success) {
                        Swal.fire('Berhasil!', 'Data berhasil disimpan.', 'success').then(() => location.reload());
                    } else {
                        Swal.fire('Gagal!', res.message, 'error');
                    }
                });
        });
    }

    const tMul = document.getElementById('m_tahun_mulai');
    const tSel = document.getElementById('m_tahun_selesai');
    if (tMul && tSel) {
        tMul.addEventListener('input', function () {
            if (document.getElementById('formType').value === 'tahun-ajaran') {
                const y = parseInt(this.value, 10);
                if (!isNaN(y)) {
                    tSel.value = y + 1;
                    document.getElementById('m_nama').value = `${y}/${y + 1}`;
                }
            }
        });
        tSel.addEventListener('input', function () {
            if (document.getElementById('formType').value === 'tahun-ajaran') {
                const y1 = parseInt(tMul.value, 10);
                const y2 = parseInt(this.value, 10);
                if (!isNaN(y1) && !isNaN(y2)) {
                    document.getElementById('m_nama').value = `${y1}/${y2}`;
                }
            }
        });
    }

    const jbFileInput = document.getElementById('m_jumbotron_file');
    if (jbFileInput) {
        jbFileInput.addEventListener('change', function (e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (evt) {
                const img = new Image();
                img.onload = function () {
                    const maxW = 1600;
                    const maxH = 1000;
                    let w = img.width;
                    let h = img.height;
                    if (w > maxW) {
                        h = Math.round(h * (maxW / w));
                        w = maxW;
                    }
                    if (h > maxH) {
                        w = Math.round(w * (maxH / h));
                        h = maxH;
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);

                    let compressedDataUrl = canvas.toDataURL('image/webp', 0.82);
                    if (!compressedDataUrl.startsWith('data:image/webp')) {
                        compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
                    }

                    document.getElementById('m_image_base64').value = compressedDataUrl;
                    const prevImg = document.getElementById('m_jumbotron_preview');
                    const prevWrap = document.getElementById('m_jumbotron_preview_wrap');
                    if (prevImg && prevWrap) {
                        prevImg.src = compressedDataUrl;
                        prevWrap.style.display = 'block';
                    }
                };
                img.src = evt.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    const jbSettingsForm = document.getElementById('jumbotronSettingsForm');
    if (jbSettingsForm) {
        jbSettingsForm.addEventListener('submit', function (e) {
            e.preventDefault();
            fetch('/superadmin/master-data/jumbotron/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(new FormData(this)))
            })
                .then(r => r.json())
                .then(res => {
                    if (res.success) {
                        Swal.fire('Berhasil!', res.message, 'success');
                    } else {
                        Swal.fire('Gagal!', res.message, 'error');
                    }
                });
        });
    }

    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.background = '#d97706';
            btn.style.color = 'white';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'rgba(245, 158, 11, 0.1)';
            btn.style.color = '#d97706';
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.background = '#ef4444';
            btn.style.color = 'white';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'rgba(239, 68, 68, 0.1)';
            btn.style.color = '#ef4444';
        });
    });
});
