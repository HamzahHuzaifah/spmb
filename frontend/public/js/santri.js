// Server-side filtering now handles search and filter, filterData() removed.
        function openSantriModal(btn) {
            var data = JSON.parse(btn.getAttribute('data-santri'));

            document.getElementById('editSantriForm').action = '/santri/edit/' + data.id;

            document.getElementById('m_nomorPendaftaran').value = data.nomorPendaftaran || '';
            document.getElementById('m_email').value = data.email || '';
            document.getElementById('m_jalurPendaftaran').value = data.jalurPendaftaran || 'Reguler';
            document.getElementById('m_nama').value = data.nama || '';
            document.getElementById('m_namaPanggilan').value = data.namaPanggilan || '';
            document.getElementById('m_jenisKelamin').value = data.jenisKelamin || 'Laki-laki';
            document.getElementById('m_tingkatPendidikan').value = data.pendidikan || 'PAUDQu A';
            document.getElementById('m_tempatLahir').value = data.tempatLahir || '';
            if(data.tanggalLahir) {
                const dateObj = new Date(data.tanggalLahir);
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                document.getElementById('m_tanggalLahir').value = `${year}-${month}-${day}`;
            } else {
                document.getElementById('m_tanggalLahir').value = '';
            }
            document.getElementById('m_agama').value = data.agama || 'Islam';
            document.getElementById('m_statusKeluarga').value = data.statusKeluarga || 'Anak Kandung';
            document.getElementById('m_anakKe').value = data.anakKe || '';
            document.getElementById('m_dariBersaudara').value = data.dariBersaudara || '';
            document.getElementById('m_asalSekolah').value = data.asalSekolah || '';

            document.getElementById('m_namaAyah').value = data.namaAyah || '';
            document.getElementById('m_pekerjaanAyah').value = data.pekerjaanAyah || '';
            document.getElementById('m_teleponAyah').value = data.teleponAyah || '';

            document.getElementById('m_namaIbu').value = data.namaIbu || '';
            document.getElementById('m_pekerjaanIbu').value = data.pekerjaanIbu || '';
            document.getElementById('m_teleponIbu').value = data.teleponIbu || '';

            document.getElementById('m_alamat').value = data.alamat || '';

            // Update Select2 UI if initialized
            $('#m_tingkatPendidikan, #m_jalurPendaftaran, #m_agama, #m_statusKeluarga').each(function() {
                if ($(this).hasClass('select2-hidden-accessible')) {
                    $(this).trigger('change');
                }
            });

            // Update Flatpickr UI if initialized
            const dateInput = document.getElementById('m_tanggalLahir');
            if (dateInput && dateInput._flatpickr) {
                dateInput._flatpickr.setDate(dateInput.value);
            }

            document.getElementById('santriModal').style.display = 'block';

            // Populate print area
            document.getElementById('p_nomorPendaftaran').innerText = data.nomorPendaftaran || '-';
            document.getElementById('p_email').innerText = data.email || '-';
            document.getElementById('p_jalurPendaftaran').innerText = data.jalurPendaftaran || 'Reguler';
            document.getElementById('p_tingkatPendidikan').innerText = data.pendidikan || '-';
            document.getElementById('p_nama').innerText = data.nama || '-';
            document.getElementById('p_namaPanggilan').innerText = data.namaPanggilan || '-';
            document.getElementById('p_jenisKelamin').innerText = data.jenisKelamin || '-';
            
            // Format TTL
            let ttlText = data.tempatLahir || '-';
            if (data.tanggalLahir) {
                const dateObj = new Date(data.tanggalLahir);
                const monthsList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                const formattedDate = `${dateObj.getDate()} ${monthsList[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
                ttlText += `, ${formattedDate}`;
            }
            document.getElementById('p_ttl').innerText = ttlText;
            
            document.getElementById('p_agama').innerText = data.agama || '-';
            document.getElementById('p_statusKeluarga').innerText = data.statusKeluarga || '-';
            document.getElementById('p_anakKe').innerText = data.anakKe || '-';
            document.getElementById('p_dariBersaudara').innerText = data.dariBersaudara || '-';
            document.getElementById('p_asalSekolah').innerText = data.asalSekolah || '-';
            
            document.getElementById('p_namaAyah').innerText = data.namaAyah || '-';
            document.getElementById('p_pekerjaanAyah').innerText = data.pekerjaanAyah || '-';
            document.getElementById('p_teleponAyah').innerText = data.teleponAyah || '-';
            
            document.getElementById('p_namaIbu').innerText = data.namaIbu || '-';
            document.getElementById('p_pekerjaanIbu').innerText = data.pekerjaanIbu || '-';
            document.getElementById('p_teleponIbu').innerText = data.teleponIbu || '-';
            
            document.getElementById('p_alamat').innerText = data.alamat || '-';
            
            // Current Date for signature
            const today = new Date();
            const monthsList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            const currentDateStr = `${today.getDate()} ${monthsList[today.getMonth()]} ${today.getFullYear()}`;
            document.querySelector('#printDetailArea .print-current-date').innerText = currentDateStr;
        }

        function closeSantriModal() {
            document.getElementById('santriModal').style.display = 'none';
        }


        function openAddSantriModal() {
            console.log("Opening Add Santri Modal");
            document.getElementById('addSantriModal').style.display = 'block';
        }

        function closeAddSantriModal() {
            document.getElementById('addSantriModal').style.display = 'none';
        }

        function openAddSantriBeasiswaModal() {
            console.log("Opening Add Santri Beasiswa Modal");
            document.getElementById('addSantriBeasiswaModal').style.display = 'block';
        }

        function closeAddSantriBeasiswaModal() {
            document.getElementById('addSantriBeasiswaModal').style.display = 'none';
        }

        window.onclick = function (event) {
            var modal = document.getElementById('santriModal');
            var addModal = document.getElementById('addSantriModal');
            var addBeasiswaModal = document.getElementById('addSantriBeasiswaModal');
            if (event.target == modal) {
                modal.style.display = "none";
            }
            if (event.target == addModal) {
                addModal.style.display = "none";
            }
            if (addBeasiswaModal && event.target == addBeasiswaModal) {
                addBeasiswaModal.style.display = "none";
            }
        }

        function fillTestingDataSantri(isBeasiswa = false) {
            const prefix = isBeasiswa ? 'B' : 'R';
            const modalId = isBeasiswa ? 'addSantriBeasiswaModal' : 'addSantriModal';
            const modal = document.getElementById(modalId);
            if (!modal) return;
            
            const inputs = modal.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="number"], textarea');
            inputs.forEach(input => {
                if (input.name === 'namaSantri') input.value = `Test Santri ${prefix} ${Math.floor(Math.random() * 1000)}`;
                else if (input.name === 'namaPanggilan') input.value = `Test ${prefix}`;
                else if (input.name === 'tempatLahir') input.value = 'Jakarta';
                else if (input.name === 'asalSekolah') input.value = 'TK Testing';
                else if (input.name === 'email') input.value = `test${prefix}${Math.floor(Math.random() * 1000)}@example.com`;
                else if (input.name === 'namaAyah') input.value = 'Ayah Testing';
                else if (input.name === 'pekerjaanAyah') input.value = 'Karyawan';
                else if (input.name === 'teleponAyah') input.value = '081234567890';
                else if (input.name === 'namaIbu') input.value = 'Ibu Testing';
                else if (input.name === 'pekerjaanIbu') input.value = 'Ibu Rumah Tangga';
                else if (input.name === 'teleponIbu') input.value = '081234567891';
                else if (input.name === 'alamat') input.value = 'Jl. Testing No. 123, Jakarta';
                else if (input.name === 'anakKe') input.value = '1';
                else if (input.name === 'dariBersaudara') input.value = '2';
            });

            const tanggalLahirInput = modal.querySelector('input[name="tanggalLahir"]');
            if (tanggalLahirInput) {
                if (tanggalLahirInput._flatpickr) {
                    tanggalLahirInput._flatpickr.setDate('2015-01-01');
                } else {
                    tanggalLahirInput.value = '2015-01-01';
                }
            }

            const selects = modal.querySelectorAll('select');
            selects.forEach(select => {
                if (select.name === 'pendidikan') select.value = 'TPQ A';
                else if (select.name === 'agama') select.value = 'Islam';
                else if (select.name === 'statusKeluarga') select.value = 'Anak Kandung';
                
                // Trigger change for Select2 to update UI
                if ($(select).hasClass('select2-hidden-accessible')) {
                    $(select).trigger('change');
                }
            });

            const radios = modal.querySelectorAll('input[type="radio"]');
            if (radios.length > 0) {
                radios.forEach(radio => {
                    if (radio.value === 'Laki-laki') radio.checked = true;
                    if (isBeasiswa && radio.name === 'jalurBeasiswa' && radio.value === 'Beasiswa Dhuafa') radio.checked = true;
                });
            }
        }
