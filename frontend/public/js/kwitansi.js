let isEditing = false;
        let currentMarginTop = window.kwitansiConfig ? parseFloat(window.kwitansiConfig.layoutMarginTop) : 6.5;
        let currentMarginLeft = window.kwitansiConfig ? parseFloat(window.kwitansiConfig.layoutMarginLeft) : 2.5;
        let isTtdVisible = window.kwitansiConfig ? window.kwitansiConfig.ttdVisible : true;
        let currentTtdWidth = window.kwitansiConfig ? parseInt(window.kwitansiConfig.ttdWidth) : 120;
        let currentTtdX = window.kwitansiConfig ? parseInt(window.kwitansiConfig.ttdX) : 0;
        let currentTtdY = window.kwitansiConfig ? parseInt(window.kwitansiConfig.ttdY) : 0;

        function moveRowUp(btn) {
            const tr = btn.closest('tr');
            const tbody = tr.parentNode;
            const rows = Array.from(tbody.querySelectorAll('tr[data-row-id]'));
            rows.sort((a, b) => parseInt(a.style.order) - parseInt(b.style.order));
            
            const idx = rows.indexOf(tr);
            if (idx > 0) {
                const prev = rows[idx - 1];
                const tempOrder = tr.style.order;
                tr.style.order = prev.style.order;
                prev.style.order = tempOrder;
            }
        }

        function moveRowDown(btn) {
            const tr = btn.closest('tr');
            const tbody = tr.parentNode;
            const rows = Array.from(tbody.querySelectorAll('tr[data-row-id]'));
            rows.sort((a, b) => parseInt(a.style.order) - parseInt(b.style.order));
            
            const idx = rows.indexOf(tr);
            if (idx < rows.length - 1) {
                const next = rows[idx + 1];
                const tempOrder = tr.style.order;
                tr.style.order = next.style.order;
                next.style.order = tempOrder;
            }
        }

        function moveTtd(btn, dx, dy) {
            currentTtdX += dx;
            currentTtdY += dy;
            document.querySelectorAll('.ttd-image').forEach(img => {
                img.style.transform = `translate(calc(-50% + ${currentTtdX}px), calc(-50% + ${currentTtdY}px))`;
            });
        }

        
        function moveLayout(xPx, yPx) {
            // Konversi px kasar ke cm (1cm = 37.8px)
            const cmX = xPx / 37.8;
            const cmY = yPx / 37.8;
            
            currentMarginLeft += cmX;
            currentMarginTop += cmY;
            
            const overlay = document.getElementById('contentOverlay');
            overlay.style.paddingLeft = currentMarginLeft.toFixed(2) + 'cm';
            overlay.style.paddingRight = currentMarginLeft.toFixed(2) + 'cm';
            overlay.style.paddingTop = currentMarginTop.toFixed(2) + 'cm';
        }

        function resizeTtd(btn, changePx) {
            currentTtdWidth += changePx;
            if (currentTtdWidth < 50) currentTtdWidth = 50;
            const img = btn.closest('.ttd-container').querySelector('.ttd-image');
            if (img) img.style.width = currentTtdWidth + 'px';
            
            // Sinkronkan ke semua TTD yang ada (biar konsisten)
            document.querySelectorAll('.ttd-image').forEach(i => i.style.width = currentTtdWidth + 'px');
        }

        function deleteTtd(btn) {
            isTtdVisible = false;
            document.querySelectorAll('.ttd-image').forEach(i => i.style.display = 'none');
        }

        function toggleEdit() {
            const btnEdit = document.getElementById('btnEdit');
            const btnPrint = document.getElementById('btnPrint');
            const layoutControls = document.getElementById('layoutControls');
            const editableFields = document.querySelectorAll('.editable-field');
            const ttdControls = document.querySelectorAll('.ttd-controls');
            
            if (!isEditing) {
                // Masuk mode edit
                isEditing = true;
                document.body.classList.add('editable-mode');
                editableFields.forEach(el => {
                    el.contentEditable = "true";
                });
                document.querySelectorAll('.reorder-controls').forEach(el => el.style.display = "table-cell");
                ttdControls.forEach(el => el.style.display = "block");
                layoutControls.style.display = "flex";
                
                btnEdit.innerHTML = '<i class="fas fa-save"></i> Simpan Perubahan';
                btnEdit.style.backgroundColor = '#2563eb';
                btnPrint.style.display = 'none';
            } else {
                // Simpan data
                const payload = {};
                
                // Helper to collect specific single fields
                const getField = (name) => {
                    const el = document.querySelector(`.editable-field[data-field="${name}"]`);
                    return el ? el.innerText.trim() : undefined;
                };

                const dibayarkanKepada = getField('dibayarkanKepada');
                if (dibayarkanKepada !== undefined) payload.dibayarkanKepada = dibayarkanKepada;
                
                const kategoriDana = getField('kategoriDana');
                if (kategoriDana !== undefined) payload.kategoriDana = kategoriDana;
                
                const uraian = getField('uraian_pembayaran');
                if (uraian !== undefined) payload.uraian = uraian;
                
                const diterimaDari = getField('diterimaDari');
                if (diterimaDari !== undefined) payload.diterimaDari = diterimaDari;
                
                const namaPemberi = getField('namaPemberi');
                if (namaPemberi !== undefined) payload.namaPemberi = namaPemberi;

                const docTitle = getField('docTitle');
                if (docTitle !== undefined) payload.docTitle = docTitle;
                
                const diterimaDariPembayaran = getField('diterimaDariPembayaran');
                if (diterimaDariPembayaran !== undefined) payload.diterimaDariPembayaran = diterimaDariPembayaran;
                
                const dibayarkanKepadaSign = getField('dibayarkanKepadaSign');
                if (dibayarkanKepadaSign !== undefined) payload.dibayarkanKepadaSign = dibayarkanKepadaSign;

                // Save layout and TTD settings
                
                payload.layoutMarginTop = currentMarginTop.toFixed(2) + 'cm';
                payload.layoutMarginLeft = currentMarginLeft.toFixed(2) + 'cm';
                payload.ttdVisible = isTtdVisible;
                payload.ttdWidth = currentTtdWidth + 'px';
                payload.ttdX = currentTtdX;
                payload.ttdY = currentTtdY;
                
                const tbody = document.getElementById('kwitansiTbody');
                const rows = Array.from(tbody.querySelectorAll('tr[data-row-id]'));
                rows.sort((a, b) => parseInt(a.style.order) - parseInt(b.style.order));
                payload.rowOrder = JSON.stringify(rows.map(tr => tr.getAttribute('data-row-id')));


                // Collect Rincian Names
                const rincianEls = document.querySelectorAll('.editable-field.rincian-name');
                if (rincianEls.length > 0) {
                    payload.rincianNames = [];
                    rincianEls.forEach(el => {
                        payload.rincianNames.push(el.innerText.trim());
                    });
                }

                // Send to backend via AJAX
                const trxId = window.location.pathname.split('/').pop();
                
                // Set loading status
                btnEdit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';
                
                fetch(`/kwitansi/edit/${trxId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert(data.message);
                        window.location.reload(); // Refresh to reflect synced data (e.g. signatures syncing)
                    } else {
                        alert(data.message || 'Gagal menyimpan');
                        resetEditMode();
                    }
                })
                .catch(err => {
                    console.error(err);
                    alert('Terjadi kesalahan jaringan');
                    resetEditMode();
                });
            }
        }
        
        function resetEditMode() {
            isEditing = false;
            document.body.classList.remove('editable-mode');
            document.querySelectorAll('.editable-field').forEach(el => el.contentEditable = "false");
            document.querySelectorAll('.reorder-controls').forEach(el => el.style.display = "none");
            document.querySelectorAll('.ttd-controls').forEach(el => el.style.display = "none");
            document.getElementById('layoutControls').style.display = "none";
            const btnEdit = document.getElementById('btnEdit');
            const btnPrint = document.getElementById('btnPrint');
            btnEdit.innerHTML = '<i class="fas fa-edit"></i> Edit Data';
            btnEdit.style.backgroundColor = '#f59e0b';
            btnPrint.style.display = 'inline-block';
        }
        function exportToPDF() {
            document.body.classList.add('exporting-pdf');
            const element = document.querySelector('.page-wrapper');
            const no_transaksi = window.kwitansiConfig ? window.kwitansiConfig.no_transaksi : 'unknown';
            
            // Allow a small delay for CSS to apply layout changes before capturing
            setTimeout(() => {
                const opt = {
                    margin:       0,
                    filename:     'Kwitansi_' + no_transaksi + '.pdf',
                    image:        { type: 'jpeg', quality: 1 },
                    html2canvas:  { scale: 3, useCORS: true, scrollY: 0, scrollX: 0 },
                    jsPDF:        { unit: 'cm', format: [21.59, 33], orientation: 'portrait' }
                };
                
                html2pdf().set(opt).from(element).save().then(() => {
                    document.body.classList.remove('exporting-pdf');
                }).catch(() => {
                    document.body.classList.remove('exporting-pdf');
                });
            }, 100);
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

        async function exportToWord() {
            const btn = document.getElementById('btnWord');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
            btn.disabled = true;

            try {
                const bgDataUrl = await getBase64Image('/images/Template%20Laporan%20dan%20Kwintasi.webp');
                
                const clone = document.getElementById('contentOverlay').cloneNode(true);
                clone.querySelectorAll('.no-print').forEach(el => el.remove());
                clone.querySelectorAll('.editable-field').forEach(el => {
                    el.style.border = 'none';
                    el.style.backgroundColor = 'transparent';
                });

                const tbody = clone.querySelector('#kwitansiTbody');
                if (tbody) {
                    const rows = Array.from(tbody.querySelectorAll('tr[data-row-id]'));
                    rows.sort((a, b) => parseInt(a.style.order || 0) - parseInt(b.style.order || 0));
                    tbody.innerHTML = '';
                    rows.forEach(tr => {
                        tr.style.display = ''; 
                        tr.style.order = '';
                        tr.style.width = '';
                        tbody.appendChild(tr);
                    });
                    tbody.style.display = '';
                    tbody.style.flexDirection = '';
                    tbody.style.width = '';
                }
                
                const cTable = clone.querySelector('.content-table');
                if (cTable) cTable.style.display = '';

                const ttdImg = clone.querySelector('.ttd-image');
                if (ttdImg && isTtdVisible) {
                    ttdImg.src = await getBase64Image('/images/TTD%20Bendahara.webp');
                } else if (ttdImg) {
                    ttdImg.remove();
                }

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
                    <v:fill src="\${bgDataUrl}" type="frame"/>
                  </v:rect>
                  <![endif]-->
                  <div style="padding-top: \${currentMarginTop.toFixed(2)}cm; padding-left: \${currentMarginLeft.toFixed(2)}cm; padding-right: \${currentMarginLeft.toFixed(2)}cm; position: relative; z-index: 1;">
                      \${contentStr}
                  </div>
                </div>
                </body>
                </html>
                `;

                const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const no_transaksi = window.kwitansiConfig ? window.kwitansiConfig.no_transaksi : 'unknown';
                a.download = 'Kwitansi_' + no_transaksi + '.doc';
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