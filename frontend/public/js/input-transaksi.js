// Set tanggal hari ini sebagai default (dengan timezone lokal)
const d = new Date();
const year = d.getFullYear();
const month = String(d.getMonth() + 1).padStart(2, '0');
const day = String(d.getDate()).padStart(2, '0');
document.getElementById('tanggal').value = `${year}-${month}-${day}`;

$(document).ready(function() {
    // Inisialisasi Select2 untuk Pencarian Nama Pendaftar Baru (AJAX)
    $('#namaPendaftar').select2({
        ajax: {
            url: '/api/search-santri',
            dataType: 'json',
            delay: 250,
            data: function (params) {
                return {
                    q: params.term, // keyword pencarian
                    tipe: 'baru',
                    satuanPendidikan: $('#satuanPendidikanBaru').val()
                };
            },
            processResults: function (data) {
                if(data.success && data.data) {
                    return {
                        results: data.data.map(item => ({
                            id: item.nama,
                            text: `${item.nomorPendaftaran ? '[' + item.nomorPendaftaran + '] ' : ''}${item.nama} - Sisa: Rp ${item.sisaBayar ? parseInt(item.sisaBayar).toLocaleString('id-ID') : '0'}`
                        }))
                    };
                }
                return { results: [] };
            },
            cache: true
        },
        placeholder: '-- Ketik Nama atau Nomor Pendaftaran --'
    });

    // Trigger ulang pencarian jika satuan pendidikan berubah
    $('#satuanPendidikanBaru').on('change', function() {
        $('#namaPendaftar').val(null).trigger('change');
    });

    // Inisialisasi Select2 untuk Pencarian Nama Daftar Ulang (AJAX)
    $('#namaSantriDaftarUlang').select2({
        ajax: {
            url: '/api/search-santri',
            dataType: 'json',
            delay: 250,
            data: function (params) {
                return {
                    q: params.term, // keyword pencarian
                    tipe: 'daftar_ulang',
                    satuanPendidikan: $('#satuanPendidikan').val()
                };
            },
            processResults: function (data) {
                if(data.success && data.data) {
                    return {
                        results: data.data.map(item => ({
                            id: item.nama,
                            text: `${item.nomorPendaftaran ? '[' + item.nomorPendaftaran + '] ' : ''}${item.nama} - Sisa: Rp ${item.sisaBayar ? parseInt(item.sisaBayar).toLocaleString('id-ID') : '0'}`
                        }))
                    };
                }
                return { results: [] };
            },
            cache: true
        },
        placeholder: '-- Ketik Nama atau Nomor Pendaftaran --'
    });

    // Trigger ulang pencarian jika satuan pendidikan berubah
    $('#satuanPendidikan').on('change', function() {
        $('#namaSantriDaftarUlang').val(null).trigger('change');
    });
});

function handleKategoriDana() {
    const val = document.getElementById('kategoriDana').value;
    const lainnyaInput = document.getElementById('kategoriDanaLainnya');
    if (val === 'Lainnya') {
        lainnyaInput.style.display = 'block';
        lainnyaInput.required = true;
    } else {
        lainnyaInput.style.display = 'none';
        lainnyaInput.required = false;
        lainnyaInput.value = '';
    }
}

function addRincian() {
    const container = document.getElementById('rincian-container');
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.gap = '10px';
    div.style.marginBottom = '10px';
    div.innerHTML = `
        <input type="text" name="rincianNames[]" class="form-control" style="flex: 2;" placeholder="Nama Barang / Keperluan">
        <input type="number" name="rincianNominals[]" class="form-control rincian-nominal" style="flex: 1;" placeholder="Rp" oninput="calculateTotalNominal()">
        <button type="button" class="btn btn-danger" onclick="this.parentElement.remove(); calculateTotalNominal();" style="padding: 5px 10px;"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(div);
}

function calculateTotalNominal() {
    const jenis = document.getElementById('jenisTransaksi').value;
    if (jenis !== 'Pengeluaran') return;

    const nominalInputs = document.querySelectorAll('.rincian-nominal');
    let total = 0;
    let hasRincian = false;
    nominalInputs.forEach(input => {
        hasRincian = true;
        total += parseInt(input.value) || 0;
    });
    
    const nominalField = document.getElementById('inputNominalTotal');
    if (hasRincian) {
        nominalField.value = total || '';
        nominalField.readOnly = true;
        nominalField.style.backgroundColor = '#e9ecef';
    } else {
        nominalField.readOnly = false;
        nominalField.style.backgroundColor = '#ffffff';
    }
}

function handleJenisTransaksi() {
    const jenis = document.getElementById('jenisTransaksi').value;

    // Hide all sections first
    document.getElementById('sec-pendaftaran').style.display = 'none';
    document.getElementById('sec-daftar-ulang').style.display = 'none';
    document.getElementById('sec-lainnya').style.display = 'none';
    document.getElementById('sec-nominal').style.display = 'none';

    if (!jenis) return;

    // Show nominal for all valid types
    document.getElementById('sec-nominal').style.display = 'block';
    
    const wrapperPengeluaranDetail = document.getElementById('wrapper-pengeluaran-detail');
    if (wrapperPengeluaranDetail) wrapperPengeluaranDetail.style.display = 'none';

    const wrapperPemasukanDetail = document.getElementById('wrapper-pemasukan-detail');
    if (wrapperPemasukanDetail) wrapperPemasukanDetail.style.display = 'none';
    
    const nominalField = document.getElementById('inputNominalTotal');
    nominalField.readOnly = false;
    nominalField.style.backgroundColor = '#ffffff';

    if (jenis === 'Pembayaran Pendaftaran Baru') {
        document.getElementById('sec-pendaftaran').style.display = 'block';
    }
    else if (jenis === 'Pembayaran Daftar Ulang') {
        document.getElementById('sec-daftar-ulang').style.display = 'block';
    }
    else if (jenis === 'Pemasukan' || jenis === 'Pengeluaran') {
        document.getElementById('sec-lainnya').style.display = 'block';

        const wrapperSatuan = document.getElementById('wrapper-satuan-pengeluaran');
        if (wrapperSatuan) {
            wrapperSatuan.style.display = jenis === 'Pengeluaran' ? 'block' : 'none'; // Only for Pengeluaran
        }

        // Ubah label uraian agar lebih jelas
        const labelUraian = document.getElementById('label-uraian');
        if (labelUraian) {
            labelUraian.innerText = jenis === 'Pemasukan' ? 'Uraian Pemasukan' : 'Uraian Pengeluaran';
        }

        if (jenis === 'Pemasukan' && wrapperPemasukanDetail) {
            wrapperPemasukanDetail.style.display = 'block';
        }

        if (jenis === 'Pengeluaran' && wrapperPengeluaranDetail) {
            wrapperPengeluaranDetail.style.display = 'block';
            calculateTotalNominal();
        }
    }
}



function openEditModal(id, tanggal, nominal, metode) {
    document.getElementById('editTransaksiForm').action = '/input-transaksi/edit/' + id;
    const editTanggalEl = document.getElementById('editTanggal');
    if (editTanggalEl._flatpickr) {
        editTanggalEl._flatpickr.setDate(tanggal);
    } else {
        editTanggalEl.value = tanggal;
    }
    document.getElementById('editNominal').value = nominal;
    document.getElementById('editMetode').value = metode || 'Cash';
    document.getElementById('editModal').style.display = 'block';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

window.onclick = function(event) {
    var editModal = document.getElementById('editModal');
    if (event.target == editModal) {
        editModal.style.display = "none";
    }
}

function openDeleteModal(actionUrl) {
    Swal.fire({
        title: 'Konfirmasi Hapus',
        text: 'Apakah Anda yakin ingin menghapus data ini? Nominal tagihan santri akan dikembalikan seperti semula.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Hapus Data',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = actionUrl;
            document.body.appendChild(form);
            form.submit();
        }
    });
}

function openKwitansiModal(trxId) {
    document.getElementById("kwitansiIframe").src = "/kwitansi/" + trxId;
    document.getElementById("kwitansiModal").style.display = "block";
}

function closeKwitansiModal() {
    document.getElementById("kwitansiModal").style.display = "none";
    document.getElementById("kwitansiIframe").src = "";
}

setTimeout(() => {
    const s = document.getElementById("successAlert");
    if(s) s.style.display="none";
    const e = document.getElementById("errorAlert");
    if(e) e.style.display="none";
}, 4000);