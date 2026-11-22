// ============================================================================
// PUBLIC PORTAL MODULE (SPMB Madrasah JIC)
// Mengelola:
// 1. Transisi Halaman Publik Tanpa Kedip (Lightweight PJAX + Hover Prefetch)
// 2. Slideshow Foto Jumbotron Halaman Utama
// 3. Fitur Salin Nomor Pendaftaran & Cetak/Unduh PDF Bukti Pendaftaran
// 4. Utilitas Pengisian Data Testing Publik
// ============================================================================

(function () {
    const PUBLIC_ROUTES = new Set(['/', '/daftar', '/daftar-ulang', '/daftar/beasiswa', '/info-pembayaran']);
    const pageCache = new Map();
    let isNavigating = false;
    let jumbotronTimer = null;

    function getProgressBar() {
        return document.getElementById('publicProgressBar');
    }

    function startProgress() {
        const bar = getProgressBar();
        if (!bar) return;
        bar.classList.remove('is-finishing');
        bar.classList.add('is-active');
    }

    function finishProgress() {
        const bar = getProgressBar();
        if (!bar) return;
        bar.classList.add('is-finishing');
        setTimeout(() => {
            bar.classList.remove('is-active', 'is-finishing');
        }, 280);
    }

    function isPublicTransitionUrl(urlStr) {
        try {
            const url = new URL(urlStr, window.location.origin);
            if (url.origin !== window.location.origin) return false;
            if (url.pathname === window.location.pathname && url.hash) return false;
            return PUBLIC_ROUTES.has(url.pathname);
        } catch (e) {
            return false;
        }
    }

    function prefetchUrl(urlStr) {
        try {
            const url = new URL(urlStr, window.location.origin);
            const key = url.pathname + url.search;
            if (pageCache.has(key)) return;
            fetch(key, { headers: { 'X-Public-Prefetch': '1' } })
                .then(res => (res.ok ? res.text() : null))
                .then(html => {
                    if (html) pageCache.set(key, { html, timestamp: Date.now() });
                })
                .catch(() => {});
        } catch (e) {}
    }

    function initHeroJumbotronSlider() {
        if (jumbotronTimer) {
            clearInterval(jumbotronTimer);
            jumbotronTimer = null;
        }
        const heroSection = document.querySelector('.hero-section.has-jumbotron-slider');
        if (!heroSection) return;

        const slides = Array.from(heroSection.querySelectorAll('.hero-jumbotron-slide'));
        const dots = Array.from(heroSection.querySelectorAll('.hero-jumbotron-dot'));
        if (slides.length <= 1) return;

        let currentIdx = 0;
        const intervalMs = parseInt(heroSection.getAttribute('data-jumbotron-interval'), 10) || 5000;

        const goToSlide = (nextIdx) => {
            slides[currentIdx].classList.remove('is-active');
            if (dots[currentIdx]) dots[currentIdx].classList.remove('is-active');

            currentIdx = (nextIdx + slides.length) % slides.length;
            slides[currentIdx].classList.add('is-active');
            if (dots[currentIdx]) dots[currentIdx].classList.add('is-active');
        };

        const startTimer = () => {
            if (jumbotronTimer) clearInterval(jumbotronTimer);
            jumbotronTimer = setInterval(() => {
                goToSlide(currentIdx + 1);
            }, intervalMs);
        };

        dots.forEach((dot, idx) => {
            dot.addEventListener('click', () => {
                goToSlide(idx);
                startTimer();
            });
        });

        startTimer();
    }

    function reinitPublicPlugins() {
        if (typeof initGlobalSelect2 === 'function') initGlobalSelect2();
        if (typeof initGlobalFlatpickr === 'function') initGlobalFlatpickr();
        initHeroJumbotronSlider();
    }

    async function navigatePublic(urlStr, pushState = true) {
        if (isNavigating) return;
        const url = new URL(urlStr, window.location.origin);
        const targetKey = url.pathname + url.search;

        if (targetKey === (window.location.pathname + window.location.search) && !url.hash) {
            return;
        }

        isNavigating = true;
        startProgress();

        const shell = document.getElementById('publicPageShell');
        const stage = shell ? shell.querySelector('.public-view-stage') : null;

        try {
            if (stage) {
                stage.classList.add('stage-leave');
            }

            const cached = pageCache.get(targetKey);
            const fetchPromise = (cached && (Date.now() - cached.timestamp < 45000))
                ? Promise.resolve(cached.html)
                : fetch(targetKey).then(r => {
                    if (!r.ok) throw new Error('Network error');
                    return r.text();
                });

            const [htmlText] = await Promise.all([
                fetchPromise,
                new Promise(r => setTimeout(r, 140))
            ]);

            const parser = new DOMParser();
            const newDoc = parser.parseFromString(htmlText, 'text/html');
            const newShell = newDoc.getElementById('publicPageShell');

            if (!newShell || !shell) {
                window.location.href = urlStr;
                return;
            }

            if (window.jQuery) {
                $('#publicPageShell select.select2-hidden-accessible').each(function () {
                    try { $(this).select2('destroy'); } catch (e) {}
                });
            }
            document.querySelectorAll('.flatpickr-calendar').forEach(el => el.remove());

            document.title = newDoc.title || document.title;
            shell.innerHTML = newShell.innerHTML;

            const newStage = shell.querySelector('.public-view-stage');
            if (newStage) {
                newStage.classList.add('stage-enter');
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        newStage.classList.add('stage-enter-active');
                        setTimeout(() => {
                            newStage.classList.remove('stage-enter', 'stage-enter-active');
                        }, 340);
                    });
                });
            }

            if (pushState) {
                window.history.pushState({ publicPjax: true }, '', urlStr);
            }

            if (url.hash) {
                const targetEl = document.querySelector(url.hash);
                if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.scrollTo({ top: 0, behavior: 'instant' });
            }

            reinitPublicPlugins();
            bindPrefetchListeners();
        } catch (err) {
            window.location.href = urlStr;
        } finally {
            finishProgress();
            isNavigating = false;
        }
    }

    function bindPrefetchListeners() {
        document.querySelectorAll('a[href]').forEach(link => {
            if (link.dataset.pjaxBound) return;
            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:') || link.target === '_blank') return;
            if (isPublicTransitionUrl(href)) {
                link.dataset.pjaxBound = '1';
                link.addEventListener('mouseenter', () => prefetchUrl(href), { passive: true });
                link.addEventListener('touchstart', () => prefetchUrl(href), { passive: true });
            }
        });
    }

    document.addEventListener('click', function (e) {
        const link = e.target.closest('a[href]');
        if (!link) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        if (link.target === '_blank' || link.hasAttribute('download')) return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

        if (isPublicTransitionUrl(href)) {
            e.preventDefault();
            link.classList.add('pjax-clicked');
            navigatePublic(href, true);
        }
    });

    window.addEventListener('popstate', function () {
        if (isPublicTransitionUrl(window.location.href)) {
            navigatePublic(window.location.href, false);
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        bindPrefetchListeners();
        initHeroJumbotronSlider();
    });
})();

// ============================================================================
// FUNGSI HALAMAN SUKSES PENDAFTARAN (Salin Nomor Referensi & Unduh PDF)
// ============================================================================
function copyNoRef(text) {
    const btn = document.getElementById('btnCopyRef');
    const setCopiedUI = () => {
        if (!btn) return;
        const originalHTML = btn.innerHTML;
        btn.classList.add('copied');
        btn.innerHTML = '<i class="fas fa-check"></i> <span>Berhasil Disalin!</span>';
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = originalHTML;
        }, 2200);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(setCopiedUI).catch(() => fallbackCopyNoRef(text, setCopiedUI));
    } else {
        fallbackCopyNoRef(text, setCopiedUI);
    }
}

function fallbackCopyNoRef(text, callback) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        if (typeof callback === 'function') callback();
    } catch (e) {}
    document.body.removeChild(ta);
}

function downloadPDF() {
    if (typeof html2pdf === 'undefined') {
        window.print();
        return;
    }
    const noPrintEls = document.querySelectorAll('.no-print');
    noPrintEls.forEach(el => (el.style.display = 'none'));

    const element = document.querySelector('.sukses-card') || document.querySelector('.form-card');
    const opt = {
        margin: 0.4,
        filename: 'Bukti_Pendaftaran_SPMB_JIC.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        noPrintEls.forEach(el => (el.style.display = ''));
    });
}

// ============================================================================
// UTILITAS PENGISIAN DATA TESTING FORM PUBLIK
// ============================================================================
function fillTestingDataPublic(type) {
    const formCard = document.querySelector('.premium-form-card') || document.querySelector('.form-card');
    if (!formCard) return;

    const prefix = type === 'beasiswa' ? 'Beasiswa' : (type === 'daftar-ulang' ? 'Daftar Ulang' : 'Baru');

    const inputs = formCard.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="number"], textarea');
    inputs.forEach(input => {
        if (input.name === 'namaSantri') input.value = `Test ${prefix} ${Math.floor(Math.random() * 1000)}`;
        else if (input.name === 'namaPanggilan') input.value = 'Test';
        else if (input.name === 'tempatLahir') input.value = 'Jakarta';
        else if (input.name === 'asalSekolah') input.value = 'TK / SD Testing';
        else if (input.name === 'email') input.value = `test_${type}_${Math.floor(Math.random() * 1000)}@example.com`;
        else if (input.name === 'namaAyah') input.value = 'Ayah Testing';
        else if (input.name === 'pekerjaanAyah') input.value = 'Wiraswasta';
        else if (input.name === 'teleponAyah') input.value = '081234567890';
        else if (input.name === 'namaIbu') input.value = 'Ibu Testing';
        else if (input.name === 'pekerjaanIbu') input.value = 'Ibu Rumah Tangga';
        else if (input.name === 'teleponIbu') input.value = '081234567891';
        else if (input.name === 'alamat') input.value = 'Jl. Testing Publik No. 123, Jakarta';
        else if (input.name === 'anakKe') input.value = '1';
        else if (input.name === 'dariBersaudara') input.value = '3';
    });

    const tanggalLahirInput = formCard.querySelector('input[name="tanggalLahir"]');
    if (tanggalLahirInput) {
        if (tanggalLahirInput._flatpickr) {
            tanggalLahirInput._flatpickr.setDate('2016-05-05');
        } else {
            tanggalLahirInput.value = '2016-05-05';
        }
    }

    const selects = formCard.querySelectorAll('select');
    selects.forEach(select => {
        if (select.name === 'pendidikan') select.value = 'TPQ A';
        else if (select.name === 'pendidikanSebelumnya' || select.name === 'unitSebelumnya') select.value = 'PAUDQu B';
        else if (select.name === 'lanjutKe') select.value = 'TPQ A';
        else if (select.name === 'agama') select.value = 'Islam';
        else if (select.name === 'statusKeluarga') select.value = 'Anak Kandung';
        else if (select.name === 'namaSantri') {
            const testName = `Test ${prefix} ${Math.floor(Math.random() * 1000)}`;
            $(select).append(new Option(testName, testName, true, true));
        }

        if ($(select).hasClass('select2-hidden-accessible')) {
            $(select).trigger('change');
        }
    });

    const radios = formCard.querySelectorAll('input[type="radio"]');
    if (radios.length > 0) {
        radios.forEach(radio => {
            if (radio.value === 'Laki-laki') radio.checked = true;
            if (type === 'beasiswa' && radio.name === 'jalurBeasiswa' && radio.value === 'Beasiswa Dhuafa') radio.checked = true;
        });
    }
}
