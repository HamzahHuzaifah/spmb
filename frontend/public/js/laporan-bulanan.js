// --- SCALING LOGIC ---
function adjustPreviewScale() {
    const container = document.getElementById('previewF4ScaleContainer');
    const wrapper = document.getElementById('previewF4Wrapper');
    if (!container || !wrapper) return;

    wrapper.style.transform = 'none';
    wrapper.style.marginLeft = '0';
    container.style.height = 'auto';

    const containerWidth = container.offsetWidth;
    const targetWidth = wrapper.offsetWidth || 816;
    const targetHeight = wrapper.offsetHeight || 1247;

    if (containerWidth < targetWidth) {
        const scale = containerWidth / targetWidth;
        wrapper.style.transform = `scale(${scale})`;
        wrapper.style.transformOrigin = 'top left';
        container.style.height = (targetHeight * scale) + 'px';
        wrapper.style.marginLeft = '0';
    } else {
        wrapper.style.transform = 'none';
        container.style.height = 'auto';
        const marginLeft = (containerWidth - targetWidth) / 2;
        wrapper.style.marginLeft = marginLeft + 'px';
    }
}

window.addEventListener('resize', adjustPreviewScale);
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(adjustPreviewScale, 100);
});

// --- EDIT LOGIC ---
let isLaporanEditing = false;
let currentLaporanMarginTop = 3.5 * 37.8;
let currentLaporanMarginLeft = 1.5 * 37.8;

function moveLaporanLayout(xPx, yPx) {
    currentLaporanMarginLeft += xPx;
    currentLaporanMarginTop += yPx;

    const overlay = document.getElementById('contentOverlayLaporan');
    if (overlay) {
        overlay.style.paddingLeft = currentLaporanMarginLeft + 'px';
        overlay.style.paddingRight = currentLaporanMarginLeft + 'px';
    }
    
    const spacer = document.getElementById('printSpacerTop');
    if (spacer) {
        spacer.style.height = currentLaporanMarginTop + 'px';
    }
}

function toggleEditLaporan() {
    isLaporanEditing = !isLaporanEditing;
    const modal = document.getElementById('previewF4Wrapper');
    const btn = document.getElementById('btnEditLaporan');
    const controls = document.getElementById('layoutControlsLaporan');
    const editableElements = document.querySelectorAll('[contenteditable]');
    
    if (isLaporanEditing) {
        modal.classList.add('editable-mode');
        btn.innerHTML = '<i class="fas fa-check"></i> Selesai Edit';
        btn.style.backgroundColor = '#059669';
        controls.style.display = 'flex';
        editableElements.forEach(el => el.setAttribute('contenteditable', 'true'));
    } else {
        modal.classList.remove('editable-mode');
        btn.innerHTML = '<i class="fas fa-edit"></i> Edit Data';
        btn.style.backgroundColor = '#f59e0b';
        controls.style.display = 'none';
        editableElements.forEach(el => el.setAttribute('contenteditable', 'false'));
    }
}

// --- EXPORT LOGIC ---
async function exportToPDF() {
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengekspor...';
        btn.disabled = true;

        if (isLaporanEditing) {
            toggleEditLaporan();
        }

        const element = document.getElementById('previewF4Wrapper');
        
        const opt = {
            margin: 0,
            filename: 'Laporan_Keuangan_SPMB.pdf',
            image: { type: 'jpeg', quality: 1.0 },
            html2canvas: { 
                scale: 2, 
                useCORS: true,
                logging: false,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
            },
            jsPDF: { unit: 'mm', format: [215.9, 330], orientation: 'portrait' } // F4
        };

        await html2pdf().set(opt).from(element).save();
    } catch (e) {
        console.error(e);
        alert('Terjadi kesalahan saat meng-export PDF');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

async function exportToWord() {
    const btn = event.currentTarget;
    const originalText = btn.innerHTML;
    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengekspor...';
        btn.disabled = true;

        if (isLaporanEditing) {
            toggleEditLaporan();
        }

        const bgUrl = window.location.origin + '/images/Template%20Laporan%20dan%20Kwintasi.webp';
        
        const response = await fetch(bgUrl);
        const blobImg = await response.blob();
        
        const reader = new FileReader();
        const bgDataUrl = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blobImg);
        });

        const clone = document.getElementById('contentOverlayLaporan').cloneNode(true);
        
        const pt = currentLaporanMarginTop / 37.8;
        const pl = currentLaporanMarginLeft / 37.8;
        
        const contentStr = clone.innerHTML;

        const html = `
        <html xmlns:v="urn:schemas-microsoft-com:vml"
        xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:w="urn:schemas-microsoft-com:office:word"
        xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
        xmlns="http://www.w3.org/TR/REC-html40">
        <head>
        <meta charset="utf-8">
        <style>
          @page WordSection1 {
            size: 21.59cm 33.0cm;
            margin: 0cm 0cm 0cm 0cm;
            mso-header-margin: 0cm;
            mso-footer-margin: 0cm;
            mso-paper-source: 0;
          }
          div.WordSection1 { page: WordSection1; }
          body { font-family: Arial, sans-serif; font-size: 11pt; margin: 0; padding: 0; }
          table { border-collapse: collapse; }
          td { vertical-align: top; }
        </style>
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
          <div style="padding-top: ${pt}cm; padding-left: ${pl}cm; padding-right: ${pl}cm; position: relative; z-index: 1;">
              ${contentStr}
          </div>
        </div>
        </body>
        </html>
        `;

        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
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
