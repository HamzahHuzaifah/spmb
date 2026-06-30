// Common functionality like print
    function printPage() {
        window.print();
    }

    // Sidebar Toggle for Mobile responsiveness
    document.addEventListener('DOMContentLoaded', () => {
        const toggleBtn = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (toggleBtn && sidebar) {
            // Create overlay dynamically if it doesn't exist
            let overlay = document.querySelector('.sidebar-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'sidebar-overlay';
                document.body.appendChild(overlay);
            }

            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                overlay.classList.toggle('active');
            });

            overlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            });

            // Close sidebar on menu item click (on mobile)
            const menuItems = document.querySelectorAll('.menu-item');
            menuItems.forEach(item => {
                item.addEventListener('click', () => {
                    if (window.innerWidth <= 992) {
                        sidebar.classList.remove('open');
                        overlay.classList.remove('active');
                    }
                });
            });
        }
    });

    async function handleAjaxSubmitGlobal(event, formElement) {
        event.preventDefault();
        const submitBtn = formElement.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        submitBtn.disabled = true;

        const formData = new FormData(formElement);
        const data = {};
        for (let [key, value] of formData.entries()) {
            let actualKey = key.endsWith('[]') ? key.slice(0, -2) : key;
            if (data.hasOwnProperty(actualKey)) {
                if (!Array.isArray(data[actualKey])) {
                    data[actualKey] = [data[actualKey]];
                }
                data[actualKey].push(value);
            } else {
                data[actualKey] = key.endsWith('[]') ? [value] : value;
            }
        }
        
        try {
            const response = await fetch(formElement.action, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(data)
            });
            
            // Check if redirect
            if (response.redirected) {
                window.location.href = response.url;
                return;
            }

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const result = await response.json();
                
                if(result.success) {
                    const modal = formElement.closest('.modal');
                    if(modal) modal.style.display = 'none';
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: result.message || 'Data berhasil disimpan!',
                        confirmButtonText: 'OK'
                    }).then(() => {
                        window.location.reload();
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal',
                        text: result.message || 'Terjadi kesalahan saat menyimpan data.'
                    });
                }
            } else {
                // If the response is not JSON, but success (e.g. standard redirect intercepted incorrectly by fetch, though fetch follows redirects automatically and we check response.redirected)
                if (response.ok) {
                    const modal = formElement.closest('.modal');
                    if(modal) modal.style.display = 'none';

                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: 'Data berhasil disimpan!',
                        confirmButtonText: 'OK'
                    }).then(() => {
                        window.location.reload();
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Gagal menghubungi server.'
                    });
                }
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Gagal menghubungi server.'
            });
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async function handleAjaxSubmit(event, formElement) {
        event.preventDefault();
        const submitBtn = formElement.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
        submitBtn.disabled = true;

        const formData = new FormData(formElement);
        const data = {};
        for (let [key, value] of formData.entries()) {
            let actualKey = key.endsWith('[]') ? key.slice(0, -2) : key;
            if (data.hasOwnProperty(actualKey)) {
                if (!Array.isArray(data[actualKey])) {
                    data[actualKey] = [data[actualKey]];
                }
                data[actualKey].push(value);
            } else {
                data[actualKey] = key.endsWith('[]') ? [value] : value;
            }
        }

        // Normalisasi field beasiswa jenis kelamin
        if (data.jenisKelaminBeasiswa) {
            data.jenisKelamin = data.jenisKelaminBeasiswa;
            delete data.jenisKelaminBeasiswa;
        }

        try {
            const response = await fetch(formElement.action, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();

            if (result.success) {
                // Sembunyikan modal form saat ini
                const modal = formElement.closest('.modal');
                if (modal) modal.style.display = 'none';

                // Tampilkan successModal jika ada
                const successModal = document.getElementById('successModal');
                if (successModal) {
                    if (result.noRef) {
                        const noRefContainer = document.getElementById('successNoRefContainer');
                        const noRefEl = document.getElementById('successNoRef');
                        if (noRefEl) noRefEl.innerText = result.noRef;
                        if (noRefContainer) noRefContainer.style.display = 'block';
                    }
                    successModal.style.display = 'block';
                } else {
                    // Fallback menggunakan Swal.fire jika tidak ada successModal kustom
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil',
                        text: result.message || 'Pendaftaran berhasil disimpan!',
                        confirmButtonText: 'OK'
                    }).then(() => {
                        window.location.reload();
                    });
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: result.message || 'Terjadi kesalahan saat menyimpan data.'
                });
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Gagal menghubungi server.'
            });
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // Global Select2 Initialization for Custom Dropdowns
    $(document).ready(function() {
        // Run on DOM ready
        initGlobalSelect2();
        initGlobalFlatpickr();
    });

    function initGlobalSelect2() {
        $('select.form-control, select.form-input').each(function() {
            const $this = $(this);
            // Check if already initialized by specific scripts (e.g., AJAX search)
            if (!$this.hasClass('select2-hidden-accessible')) {
                const optionCount = $this.find('option').length;
                let select2Options = {
                    minimumResultsForSearch: optionCount < 8 ? Infinity : 10,
                    width: '100%'
                };
                
                const $modal = $this.closest('.modal');
                if ($modal.length > 0) {
                    select2Options.dropdownParent = $modal;
                }
                
                $this.select2(select2Options);
            }
        });
    }

    function initGlobalFlatpickr() {
        if (typeof flatpickr !== 'undefined') {
            flatpickr("input[type='date']", {
                locale: "id",
                dateFormat: "Y-m-d",
                allowInput: true,
                disableMobile: true, // Memaksa popup HTML/CSS kustom di HP alih-alih UI kalender bawaan HP/Chrome
                monthSelectorType: "dropdown", // Menggunakan dropdown agar pengguna bebas memilih bulan secara langsung
                onReady: function(selectedDates, dateStr, instance) {
                    initMonthSelect2(instance);
                    initYearSelect2(instance);
                },
                onOpen: function(selectedDates, dateStr, instance) {
                    initMonthSelect2(instance);
                    initYearSelect2(instance);
                },
                onMonthChange: function(selectedDates, dateStr, instance) {
                    setTimeout(() => {
                        initMonthSelect2(instance);
                        initYearSelect2(instance);
                    }, 10);
                },
                onYearChange: function(selectedDates, dateStr, instance) {
                    setTimeout(() => {
                        initMonthSelect2(instance);
                        initYearSelect2(instance);
                    }, 10);
                }
            });
        }
    }

    function initMonthSelect2(instance) {
        const $select = $(instance.calendarContainer).find('.flatpickr-monthDropdown-months');
        if ($select.length && !$select.hasClass('select2-hidden-accessible')) {
            $select.select2({
                minimumResultsForSearch: Infinity,
                containerCssClass: 'select2-flatpickr-month', // Diberikan class khusus untuk styling lebar di CSS
                dropdownParent: $(instance.calendarContainer) // Menempelkan dropdown di dalam kalender agar tidak meluber keluar layar HP
            }).on('change', function() {
                // Memicu event native change agar Flatpickr mendeteksi perubahan bulan
                const event = document.createEvent('HTMLEvents');
                event.initEvent('change', true, false);
                this.dispatchEvent(event);
            });

            // Sesuaikan gaya visual teks dropdown pemicu
            $select.next('.select2-container').find('.select2-selection__rendered').css({
                'font-weight': '700',
                'color': 'var(--text-main)',
                'font-size': '14px'
            });
        }
    }

    function initYearSelect2(instance) {
        const $yearWrapper = $(instance.calendarContainer).find('.numInputWrapper');
        if ($yearWrapper.length) {
            let $yearSelect = $(instance.calendarContainer).find('.flatpickr-yearDropdown-years');
            
            // Jika dropdown tahun kustom belum dibuat
            if (!$yearSelect.length) {
                $yearSelect = $('<select class="flatpickr-yearDropdown-years"></select>');
                
                // Isi tahun dari currentYear - 5 s/d currentYear + 10
                const currentYear = new Date().getFullYear();
                const startYear = currentYear - 10;
                const endYear = currentYear + 10;
                
                for (let y = startYear; y <= endYear; y++) {
                    $yearSelect.append(`<option value="${y}">${y}</option>`);
                }
                
                // Samakan nilai awal tahun
                $yearSelect.val(instance.currentYear);
                
                // Masukkan dropdown setelah year wrapper, lalu sembunyikan input angka bawaan Flatpickr
                $yearWrapper.after($yearSelect);
                $yearWrapper.hide();
                
                // Inisialisasi Select2 pada dropdown tahun kustom
                $yearSelect.select2({
                    tags: true, // Memungkinkan pengetikan tahun kustom secara manual
                    createTag: function(params) {
                        const term = $.trim(params.term);
                        // Hanya izinkan input angka 3 atau 4 digit sebagai tahun valid (misal: 1998, 2050, atau 999)
                        if (term === '' || !/^\d{3,4}$/.test(term)) {
                            return null;
                        }
                        return {
                            id: term,
                            text: term,
                            newTag: true
                        };
                    },
                    dropdownParent: $(instance.calendarContainer)
                }).on('change', function() {
                    const selectedYear = parseInt($(this).val());
                    if (selectedYear && selectedYear !== instance.currentYear) {
                        instance.changeYear(selectedYear);
                    }
                });

                // Sesuaikan gaya visual teks dropdown pemicu tahun
                $yearSelect.next('.select2-container').find('.select2-selection__rendered').css({
                    'font-weight': '700',
                    'color': 'var(--text-main)',
                    'font-size': '14px'
                });
            } else {
                // Sinkronkan nilai tahun jika terjadi perubahan dari navigasi tombol
                if (parseInt($yearSelect.val()) !== instance.currentYear) {
                    $yearSelect.val(instance.currentYear).trigger('change.select2');
                }
            }
        }
    }

    // Control logic for the Page Loader
    function hideLoader() {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            loader.classList.add('hidden');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideLoader);
    } else {
        hideLoader();
    }
    document.addEventListener('DOMContentLoaded', () => {
        // Intercept standard navigation links
        document.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && 
                !href.startsWith('#') && 
                !href.startsWith('javascript:') && 
                !link.getAttribute('target') && 
                !link.hasAttribute('download') &&
                !href.includes('/logout') && 
                !href.includes('export-excel') && 
                (href.startsWith('/') || href.includes(window.location.host))
            ) {
                link.addEventListener('click', () => {
                    const loader = document.getElementById('pageLoader');
                    if (loader) loader.classList.remove('hidden');
                });
            }
        });

        // Intercept standard non-AJAX form submissions
        document.querySelectorAll('form').forEach(form => {
            if (!form.classList.contains('ajax-form') && !form.getAttribute('onsubmit') && !form.getAttribute('data-ajax')) {
                form.addEventListener('submit', () => {
                    const loader = document.getElementById('pageLoader');
                     if (loader) loader.classList.remove('hidden');
                });
            }
        });

        // --- Admin Profile Settings & Dropdown ---
        const profileBtn = document.getElementById('userProfileDropdownBtn');
        const profileDropdown = document.getElementById('profileDropdown');
        
        if (profileBtn && profileDropdown) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown.style.display = profileDropdown.style.display === 'none' ? 'block' : 'none';
            });
            
            document.addEventListener('click', () => {
                profileDropdown.style.display = 'none';
            });
        }
        
        const settingsModal = document.getElementById('adminSettingsModal');
        const openSettingsLink = document.getElementById('openAccountSettings');
        const closeSettingsSpan = document.getElementById('closeAdminSettingsModal');
        const cancelSettingsBtns = document.querySelectorAll('.close-settings-modal-btn');
        
        if (settingsModal && openSettingsLink) {
            openSettingsLink.addEventListener('click', (e) => {
                e.preventDefault();
                settingsModal.style.display = 'flex';
            });
            
            const closeModal = () => {
                settingsModal.style.display = 'none';
                document.getElementById('formEditProfile').reset();
                document.getElementById('formAddAdmin').reset();
            };
            
            if (closeSettingsSpan) closeSettingsSpan.addEventListener('click', closeModal);
            cancelSettingsBtns.forEach(btn => btn.addEventListener('click', closeModal));
            
            const btnTabEditProfile = document.getElementById('btnTabEditProfile');
            const btnTabAddAdmin = document.getElementById('btnTabAddAdmin');
            const tabEditProfile = document.getElementById('tabEditProfile');
            const tabAddAdmin = document.getElementById('tabAddAdmin');
            
            if (btnTabEditProfile && btnTabAddAdmin && tabEditProfile && tabAddAdmin) {
                btnTabEditProfile.addEventListener('click', () => {
                    btnTabEditProfile.style.color = '#059669';
                    btnTabEditProfile.style.borderBottomColor = '#059669';
                    btnTabAddAdmin.style.color = '#64748b';
                    btnTabAddAdmin.style.borderBottomColor = 'transparent';
                    tabEditProfile.style.display = 'block';
                    tabAddAdmin.style.display = 'none';
                });
                
                btnTabAddAdmin.addEventListener('click', () => {
                    btnTabAddAdmin.style.color = '#059669';
                    btnTabAddAdmin.style.borderBottomColor = '#059669';
                    btnTabEditProfile.style.color = '#64748b';
                    btnTabEditProfile.style.borderBottomColor = 'transparent';
                    tabAddAdmin.style.display = 'block';
                    tabEditProfile.style.display = 'none';
                    
                    // Reset to list view and load data
                    if(document.getElementById('adminListWrapper')) {
                        document.getElementById('adminListWrapper').style.display = 'block';
                        document.getElementById('formAddAdmin').style.display = 'none';
                        loadAdminList();
                    }
                });
            }
            
            const formEditProfile = document.getElementById('formEditProfile');
            if (formEditProfile) {
                formEditProfile.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const nama_lengkap = document.getElementById('profileNama').value;
                    const username = document.getElementById('profileUsername').value;
                    const password_lama = document.getElementById('profilePasswordLama').value;
                    const password_baru = document.getElementById('profilePasswordBaru').value;
                    
                    if (password_baru && !password_lama) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Peringatan',
                            text: 'Password lama wajib diisi jika ingin mengubah password!'
                        });
                        return;
                    }
                    
                    try {
                        const response = await fetch('/api/admin/profile', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ nama_lengkap, username, password_lama, password_baru })
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            Swal.fire({
                                icon: 'success',
                                title: 'Berhasil',
                                text: result.message
                            }).then(() => {
                                window.location.reload();
                            });
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Gagal',
                                text: result.message
                            });
                        }
                    } catch (err) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Gagal',
                            text: 'Terjadi kesalahan saat memperbarui profil.'
                        });
                    }
                });
            }
            
            const adminListWrapper = document.getElementById('adminListWrapper');
            const btnShowAddAdminForm = document.getElementById('btnShowAddAdminForm');
            const btnCancelAdminForm = document.getElementById('btnCancelAdminForm');
            const formAdminTitle = document.getElementById('formAdminTitle');
            const formAdminIcon = document.getElementById('formAdminIcon');
            const adminEditId = document.getElementById('adminEditId');
            const lblNewAdminPassword = document.getElementById('lblNewAdminPassword');
            const helpNewAdminPassword = document.getElementById('helpNewAdminPassword');
            const newAdminPassword = document.getElementById('newAdminPassword');
            const formAddAdmin = document.getElementById('formAddAdmin');

            const loadAdminList = async () => {
                const tbody = document.getElementById('adminTableBody');
                if(!tbody) return;
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 15px;"><i class="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>';
                try {
                    const res = await fetch('/api/admin/list');
                    const result = await res.json();
                    if(result.success) {
                        tbody.innerHTML = '';
                        result.data.forEach((admin, index) => {
                            const tr = document.createElement('tr');
                            tr.style.borderBottom = '1px solid #e2e8f0';
                            tr.innerHTML = `
                                <td style="padding: 10px;">${index + 1}</td>
                                <td style="padding: 10px;">${admin.nama_lengkap || '-'}</td>
                                <td style="padding: 10px;">${admin.username}</td>
                                <td style="padding: 10px; text-align: center; white-space: nowrap;">
                                    <button type="button" class="btn-edit-admin" data-id="${admin.id}" data-nama="${admin.nama_lengkap || ''}" data-username="${admin.username}" style="background: none; border: none; color: #0284c7; cursor: pointer; margin-right: 8px;" title="Edit"><i class="fas fa-edit"></i></button>
                                    <button type="button" class="btn-delete-admin" data-id="${admin.id}" style="background: none; border: none; color: #dc2626; cursor: pointer;" title="Hapus"><i class="fas fa-trash"></i></button>
                                </td>
                            `;
                            tbody.appendChild(tr);
                        });
                        
                        document.querySelectorAll('.btn-edit-admin').forEach(btn => {
                            btn.addEventListener('click', (e) => {
                                e.preventDefault();
                                adminEditId.value = btn.dataset.id;
                                document.getElementById('newAdminNama').value = btn.dataset.nama;
                                document.getElementById('newAdminUsername').value = btn.dataset.username;
                                newAdminPassword.value = '';
                                newAdminPassword.required = false;
                                lblNewAdminPassword.textContent = 'Password Baru';
                                helpNewAdminPassword.style.display = 'block';
                                formAdminTitle.textContent = 'Edit Admin';
                                formAdminIcon.className = 'fas fa-user-edit';
                                document.getElementById('btnSubmitAdminForm').textContent = 'Simpan Perubahan';
                                
                                adminListWrapper.style.display = 'none';
                                formAddAdmin.style.display = 'flex';
                            });
                        });
                        
                        document.querySelectorAll('.btn-delete-admin').forEach(btn => {
                            btn.addEventListener('click', (e) => {
                                e.preventDefault();
                                const id = btn.dataset.id;
                                Swal.fire({
                                    title: 'Hapus Admin?',
                                    text: "Admin ini akan dihapus permanen!",
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonColor: '#dc2626',
                                    cancelButtonColor: '#6c757d',
                                    confirmButtonText: 'Ya, Hapus!',
                                    cancelButtonText: 'Batal'
                                }).then(async (res) => {
                                    if(res.isConfirmed) {
                                        try {
                                            const delRes = await fetch('/api/admin/delete/' + id, { method: 'DELETE' });
                                            const delData = await delRes.json();
                                            if(delData.success) {
                                                Swal.fire('Berhasil', delData.message, 'success');
                                                loadAdminList();
                                            } else {
                                                Swal.fire('Gagal', delData.message, 'error');
                                            }
                                        } catch(e) {
                                            Swal.fire('Error', 'Gagal menghapus admin', 'error');
                                        }
                                    }
                                });
                            });
                        });
                    }
                } catch (e) {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: red;">Gagal memuat data</td></tr>';
                }
            };
            
            // Make loadAdminList available globally for the initial load when clicking the tab
            window.loadAdminList = loadAdminList;

            if (btnShowAddAdminForm && formAddAdmin) {
                btnShowAddAdminForm.addEventListener('click', () => {
                    adminEditId.value = '';
                    formAddAdmin.reset();
                    newAdminPassword.required = true;
                    lblNewAdminPassword.textContent = 'Password';
                    helpNewAdminPassword.style.display = 'none';
                    formAdminTitle.textContent = 'Tambah Admin Baru';
                    formAdminIcon.className = 'fas fa-user-plus';
                    document.getElementById('btnSubmitAdminForm').textContent = 'Tambah Admin';
                    
                    adminListWrapper.style.display = 'none';
                    formAddAdmin.style.display = 'flex';
                });
                
                btnCancelAdminForm.addEventListener('click', () => {
                    formAddAdmin.style.display = 'none';
                    adminListWrapper.style.display = 'block';
                });
                
                formAddAdmin.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const id = adminEditId.value;
                    const nama_lengkap = document.getElementById('newAdminNama').value;
                    const username = document.getElementById('newAdminUsername').value;
                    const password = newAdminPassword.value;
                    
                    const url = id ? `/api/admin/edit/${id}` : '/api/admin/add';
                    const method = id ? 'PUT' : 'POST';
                    
                    try {
                        const response = await fetch(url, {
                            method: method,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ nama_lengkap, username, password })
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            Swal.fire({
                                icon: 'success',
                                title: 'Berhasil',
                                text: result.message
                            }).then(() => {
                                formAddAdmin.style.display = 'none';
                                adminListWrapper.style.display = 'block';
                                loadAdminList();
                            });
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Gagal',
                                text: result.message
                            });
                        }
                    } catch (err) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Gagal',
                            text: 'Terjadi kesalahan saat memproses data.'
                        });
                    }
                });
            }
        }
    });

    function confirmDelete(actionUrl, customText) {
        const text = customText || "Data yang dihapus tidak dapat dikembalikan!";
        Swal.fire({
            title: 'Apakah Anda yakin?',
            text: text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal',
            focusCancel: true
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