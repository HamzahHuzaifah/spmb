const rawLaporanData = <%- JSON.stringify(laporan || []) %>;
        const rawTransaksi = <%- JSON.stringify(typeof transaksiTerbaru !== 'undefined' ? transaksiTerbaru : []) %>;

        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

        function getMonthIndex(name) {
            return monthNames.indexOf(name);
        }

        function formatRupiah(num) {
            if (!num) return '';
            return 'Rp' + parseInt(num).toLocaleString('id-ID');
        }

        let currentTtdWidth = 120;
        let currentTtdX = 0;
        let currentTtdY = 0;

        function resizeTtd(btn, changePx) {
            currentTtdWidth += changePx;
            if (currentTtdWidth < 50) currentTtdWidth = 50;
            const img = btn.closest('.ttd-container').querySelector('.ttd-image');
            if (img) img.style.width = currentTtdWidth + 'px';
        }

        function deleteTtd(btn) {
            const img = btn.closest('.ttd-container').querySelector('.ttd-image');
            if (img) img.style.display = 'none';
        }

        function moveTtd(btn, dx, dy) {
            currentTtdX += dx;
            currentTtdY += dy;
            const img = btn.closest('.ttd-container').querySelector('.ttd-image');
            if (img) img.style.transform = `translate(calc(-50% + ${currentTtdX}px), calc(-50% + ${currentTtdY}px))`;
        }

        let isLaporanEditing = false;
        let currentLaporanMarginTop = 4.8 * 37.8;
        let currentLaporanMarginLeft = 1.5 * 37.8;

        function moveLaporanLayout(xPx, yPx) {
            currentLaporanMarginLeft += xPx;
            currentLaporanMarginTop += yPx;
            
            const overlay = document.getElementById('contentOverlayLaporan');
            overlay.style.paddingLeft = (currentLaporanMarginLeft / 37.8).toFixed(2) + 'cm';
            overlay.style.paddingRight = (currentLaporanMarginLeft / 37.8).toFixed(2) + 'cm';
            overlay.style.paddingTop = (currentLaporanMarginTop / 37.8).toFixed(2) + 'cm';
        }

        function toggleEditLaporan() {
            const btnEdit = document.getElementById('btnEditLaporan');
            const layoutControls = document.getElementById('layoutControlsLaporan');
            const ttdControls = document.querySelectorAll('#previewModal .ttd-controls');
            const modal = document.getElementById('previewModal');
            
            if (!isLaporanEditing) {
                isLaporanEditing = true;
                modal.classList.add('editable-mode');
                ttdControls.forEach(el => el.style.display = "block");
                layoutControls.style.display = "flex";
                
                btnEdit.innerHTML = '<i class="fas fa-check"></i> Selesai Edit';
                btnEdit.classList.replace('btn-warning', 'btn-success');
                btnEdit.style.backgroundColor = '#059669';
                
                // Enable editing manually in case they were disabled
                document.querySelectorAll('#previewModal [contenteditable]').forEach(el => el.setAttribute('contenteditable', 'true'));
            } else {
                isLaporanEditing = false;
                modal.classList.remove('editable-mode');
                ttdControls.forEach(el => el.style.display = "none");
                layoutControls.style.display = "none";
                
                btnEdit.innerHTML = '<i class="fas fa-edit"></i> Edit Data';
                btnEdit.classList.replace('btn-success', 'btn-warning');
                btnEdit.style.backgroundColor = '#f59e0b';
                
                // Disable editing for cleaner print
                document.querySelectorAll('#previewModal [contenteditable]').forEach(el => el.setAttribute('contenteditable', 'false'));
            }
        }

        function openPreviewLaporan() {
            const filterTahun = document.getElementById("filterTahun").value;
            const filterBulan = document.getElementById("filterBulan").value;

            if (!filterBulan) {
                alert("Silakan pilih Bulan terlebih dahulu untuk melihat preview laporan bulanan.");
                return;
            }

            document.getElementById('previewTahunJudul').innerText = `TAHUN PELAJARAN ${filterTahun}/${parseInt(filterTahun) + 1}`;
            document.getElementById('previewBulanJudul').innerText = `Bulan ${filterBulan}`;

            let d = new Date();
            document.getElementById('previewTanggalCetak').innerText = `${d.getDate()} ${filterBulan} ${filterTahun}`;

            let selTahun = parseInt(filterTahun);
            let selBulanIdx = getMonthIndex(filterBulan);

            let saldoAwal = 0;
            let currentData = [];

            rawLaporanData.forEach(item => {
                let itemTahun = parseInt(item.tahun);
                let itemBulanIdx = getMonthIndex(item.bulan);

                if (itemTahun < selTahun || (itemTahun === selTahun && itemBulanIdx < selBulanIdx)) {
                    saldoAwal += (item.pemasukan || 0) - (item.pengeluaran || 0);
                } else if (itemTahun === selTahun && itemBulanIdx === selBulanIdx) {
                    currentData.push(item);
                }
            });

            const tbody = document.getElementById('previewTbody');
            tbody.innerHTML = '';

            let no = 1;
            let prevMonthName = selBulanIdx === 0 ? "Desember" : monthNames[selBulanIdx - 1];
            let prevMonthYear = selBulanIdx === 0 ? selTahun - 1 : selTahun;

            let totalDebit = saldoAwal;
            let totalKredit = 0;
            let runningSaldo = saldoAwal;

            // Row 1: Saldo Awal
            let trAwal = document.createElement('tr');
            trAwal.innerHTML = `
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">${no++}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center;">01/${(selBulanIdx + 1).toString().padStart(2, '0')}/${selTahun}</td>
            <td style="border: 1px solid #000; padding: 6px;">Saldo Bulan ${prevMonthName} ${prevMonthYear}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatRupiah(saldoAwal)}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: right;"></td>
            <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatRupiah(saldoAwal)}</td>
        `;
            tbody.appendChild(trAwal);

            // Transactions
            currentData.forEach(item => {
                runningSaldo += (item.pemasukan || 0) - (item.pengeluaran || 0);
                totalDebit += (item.pemasukan || 0);
                totalKredit += (item.pengeluaran || 0);

                // Format Uraian
                let uraianText = item.uraian;

                // Try cross reference to get namaSantri and satuanPendidikan
                const trx = rawTransaksi.find(t => t.noTransaksi === item.noTransaksi);
                if (trx) {
                    if (item.pemasukan > 0) {
                        if (uraianText.includes('Pendaftaran Baru') || uraianText.includes('Daftar Ulang') || uraianText.includes('Pembayaran')) {
                            // Clean up existing 'Pembayaran Pendaftaran Baru [Nama]' to just the action.
                            let actionType = "Pembayaran Pendaftaran Baru";
                            if (uraianText.includes('Daftar Ulang')) actionType = "Pembayaran Daftar Ulang";
                            else if (trx.kategoriDana && trx.kategoriDana !== '-') actionType = `Pembayaran ${trx.kategoriDana}`;

                            let sat = trx.satuanPendidikan || 'SPMB';
                            if (sat === 'MADRASAH') sat = 'MDT';
                            uraianText = `Diterima ${actionType} ${sat} Tahun Pelajaran ${filterTahun}/${parseInt(filterTahun) + 1} dari ${trx.namaSantri}`;
                        } else {
                            uraianText = `Diterima ${uraianText} dari ${trx.namaSantri || trx.diterimaDari || 'Siswa'}`;
                        }
                    } else if (item.pengeluaran > 0) {
                        uraianText = `Dikeluarkan untuk ${uraianText}`;
                    }
                } else {
                    // Fallback basic text
                    if (item.pemasukan > 0 && !uraianText.startsWith('Diterima')) uraianText = "Diterima " + uraianText;
                    if (item.pengeluaran > 0 && !uraianText.startsWith('Dikeluarkan')) uraianText = "Dikeluarkan untuk " + uraianText;
                }

                let tr = document.createElement('tr');
                tr.innerHTML = `
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${no++}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${item.tanggal}</td>
                <td style="border: 1px solid #000; padding: 6px;">${uraianText}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: right;">${item.pemasukan ? formatRupiah(item.pemasukan) : ''}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: right;">${item.pengeluaran ? formatRupiah(item.pengeluaran) : ''}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: right;">${formatRupiah(runningSaldo)}</td>
            `;
                tbody.appendChild(tr);
            });

            // Row Terakhir: Total
            let trTotal = document.createElement('tr');
            trTotal.innerHTML = `
            <td colspan="3" style="border: 1px solid #000; padding: 6px; text-align: center; font-style: italic; font-weight: bold;">Total Saldo</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">${formatRupiah(totalDebit)}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">${formatRupiah(totalKredit)}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">${formatRupiah(runningSaldo)}</td>
        `;
            tbody.appendChild(trTotal);

            document.getElementById('previewModal').style.display = 'flex';
            document.getElementById('previewModal').classList.remove('editable-mode');
            document.querySelectorAll('#previewModal [contenteditable]').forEach(el => el.setAttribute('contenteditable', 'false'));
            
            // Reset Edit Button State
            const btnEdit = document.getElementById('btnEditLaporan');
            if (btnEdit) {
                isLaporanEditing = false;
                btnEdit.innerHTML = '<i class="fas fa-edit"></i> Edit Data';
                btnEdit.classList.remove('btn-success');
                btnEdit.classList.add('btn-warning');
                btnEdit.style.backgroundColor = '#f59e0b';
                
                const layoutControls = document.getElementById('layoutControlsLaporan');
                if (layoutControls) layoutControls.style.display = 'none';
                
                const ttdControls = document.querySelectorAll('#previewModal .ttd-controls');
                ttdControls.forEach(el => el.style.display = 'none');
            }
        }

        function closePreviewLaporan() {
            document.getElementById('previewModal').style.display = 'none';
        }

        function printPreview() {
            const p = document.getElementById('previewF4Wrapper');
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
            <html>
            <head>
                <title>Cetak Laporan</title>
                
            </head>
            <body>
                <div class="wrapper">
                    ${p.innerHTML}
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(() => {
                            window.print();
                            window.close();
                        }, 500);
                    };
                </` + `script>
            </body>
            </html>
        `);
            printWindow.document.close();
        }

        function exportPreviewToPDF() {
            const element = document.getElementById('previewF4Wrapper');
            const btn = document.querySelector('button[onclick="exportPreviewToPDF()"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';

            const opt = {
                margin: 0,
                filename: 'Laporan_Keuangan_SPMB.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'cm', format: [21.59, 33], orientation: 'portrait' }
            };

            html2pdf().set(opt).from(element).save().then(() => {
                btn.innerHTML = originalText;
            });
        }

        function getBase64Image(url) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/png'));
                };
                img.onerror = reject;
                img.src = url;
            });
        }

        async function exportPreviewToWord() {
            const btn = document.querySelector('button[onclick="exportPreviewToWord()"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
            btn.disabled = true;

            try {
                const bgDataUrl = await getBase64Image('/images/Template%20Laporan%20dan%20Kwintasi.webp');

                const clone = document.getElementById('previewF4Wrapper').cloneNode(true);
                clone.querySelectorAll('[contenteditable]').forEach(el => {
                    el.removeAttribute('contenteditable');
                    el.style.border = 'none';
                });
                const contentStr = clone.innerHTML;

                const html = `
            <html xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
            xmlns="http://www.w3.org/TR/REC-html40">
            <head>
            <meta charset="utf-8">
            
            <!--[if gte mso 9]>
            <xml>
             <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
             </w:WordDocument>
            </xml>
            <![endif]-->
            </head>
            <body>
            <div class="WordSection1">
              <!--[if gte vml 1]>
              <v:rect id="bgimg" style="position:absolute;left:0;top:0;width:21.59cm;height:33.0cm;z-index:-1" stroked="f">
                <v:fill src="${bgDataUrl}" type="frame"/>
              </v:rect>
              <![endif]-->
              ${contentStr}
            </div>
            </body>
            </html>
            `;

                const blob = new Blob(['\\ufeff', html], { type: 'application/msword' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'Laporan_Keuangan_SPMB.doc';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

            } catch (e) {
                console.error(e);
                alert('Gagal mengexport ke Word.');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }