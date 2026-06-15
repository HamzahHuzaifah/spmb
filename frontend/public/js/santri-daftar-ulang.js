// Server-side filtering now handles search and filter, filterData() removed.

        function openSantriModal(btn) {
            const data = JSON.parse(btn.getAttribute('data-santri'));
            
            // Populate data into modal forms
            document.getElementById('m_nomorPendaftaran').value = data.nomorPendaftaran || '';
            document.getElementById('m_email').value = data.email || '';
            document.getElementById('m_jalurPendaftaran').value = data.jalurPendaftaran || 'Reguler';
            document.getElementById('m_nama').value = data.nama || '';
            document.getElementById('m_namaPanggilan').value = data.namaPanggilan || '';
            document.getElementById('m_jenisKelamin').value = data.jenisKelamin || 'Laki-laki';
            document.getElementById('m_unitSebelumnya').value = data.unitSebelumnya || '';
            document.getElementById('m_lanjutKe').value = data.lanjutKe || '';
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

            // Set Action URL for form
            document.getElementById('editSantriForm').action = '/santri-daftar-ulang/edit/' + data.id;

            document.getElementById('santriModal').style.display = 'block';
        }

        function closeSantriModal() {
            document.getElementById('santriModal').style.display = 'none';
        }

        window.onclick = function (event) {
            var modal = document.getElementById('santriModal');
            var addModal = document.getElementById('addSantriModal');
            var deleteModal = document.getElementById('deleteModal');
            var successModal = document.getElementById('successModal');
            if (event.target == modal) {
                modal.style.display = "none";
            }
            if (event.target == addModal) {
                addModal.style.display = "none";
            }
            if (event.target == deleteModal) {
                deleteModal.style.display = "none";
            }
            if (event.target == successModal) {
                successModal.style.display = "none";
                window.location.reload();
            }
        }

        function openAddSantriModal() {
            document.getElementById('addSantriModal').style.display = 'block';
        }

        function closeAddSantriModal() {
            document.getElementById('addSantriModal').style.display = 'none';
        }

        function openDeleteModal(actionUrl) {
            document.getElementById('deleteForm').action = actionUrl;
            document.getElementById('deleteModal').style.display = 'block';
        }

        function closeDeleteModal() {
            document.getElementById('deleteModal').style.display = 'none';
        }

        function fillTestingDataDaftarUlang() {
            const modal = document.getElementById('addSantriModal');
            if (!modal) return;
            
            const inputs = modal.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="number"], textarea');
            inputs.forEach(input => {
                if (input.name === 'namaSantri') input.value = `Test Daftar Ulang ${Math.floor(Math.random() * 1000)}`;
                else if (input.name === 'namaPanggilan') input.value = `Test DU`;
                else if (input.name === 'tempatLahir') input.value = 'Jakarta';
                else if (input.name === 'asalSekolah') input.value = 'TK Testing';
                else if (input.name === 'email') input.value = `testdu${Math.floor(Math.random() * 1000)}@example.com`;
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

            const dateInputs = modal.querySelectorAll('input[type="date"]');
            dateInputs.forEach(input => {
                if (input.name === 'tanggalLahir') input.value = '2015-01-01';
            });

            const selects = modal.querySelectorAll('select');
            selects.forEach(select => {
                if (select.name === 'pendidikanSebelumnya') select.value = 'PAUDQu B';
                else if (select.name === 'lanjutKe') select.value = 'TPQ A';
                else if (select.name === 'agama') select.value = 'Islam';
                else if (select.name === 'statusKeluarga') select.value = 'Anak Kandung';
            });

            const radios = modal.querySelectorAll('input[type="radio"]');
            if (radios.length > 0) {
                radios.forEach(radio => {
                    if (radio.value === 'Laki-laki') radio.checked = true;
                    if (radio.name === 'jalurPendaftaran' && radio.value === 'Reguler') radio.checked = true;
                });
            }
        }

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