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
        const data = Object.fromEntries(formData.entries());
        
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
                $this.select2({
                    minimumResultsForSearch: optionCount < 8 ? Infinity : 10,
                    width: '100%'
                });
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
    window.addEventListener('load', () => {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            loader.classList.add('hidden');
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        // Failsafe check if page is already loaded
        if (document.readyState === 'complete') {
            const loader = document.getElementById('pageLoader');
            if (loader) loader.classList.add('hidden');
        }

        // Intercept standard navigation links
        document.querySelectorAll('a').forEach(link => {
            const href = link.getAttribute('href');
            if (href && 
                !href.startsWith('#') && 
                !href.startsWith('javascript:') && 
                !link.getAttribute('target') && 
                !link.hasAttribute('download') &&
                !href.includes('/logout') && 
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
    });