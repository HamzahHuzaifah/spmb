function openModalLaporan() {
    const filterBulan = document.getElementById("filterBulan").value;
    const filterTahun = document.querySelector('input[name="tahun"]').value || new Date().getFullYear();
    
    if (!filterBulan) {
        Swal.fire({
            icon: 'warning',
            title: 'Pemberitahuan',
            text: 'Silakan pilih Bulan terlebih dahulu untuk melihat preview laporan bulanan.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#3a7b5e'
        });
        return;
    }

    document.getElementById('laporanModal').style.display = 'flex';
    document.getElementById('laporanIframe').src = '/laporan-bulanan?bulan=' + filterBulan + '&tahun=' + filterTahun;
}

function closeModalLaporan() {
    document.getElementById('laporanModal').style.display = 'none';
    document.getElementById('laporanIframe').src = '';
}

function filterData() {
    var filterTahun = document.getElementById("filterTahun").value.toLowerCase();
    var filterBulan = document.getElementById("filterBulan").value.toLowerCase();
    var table = document.getElementById("tabelLaporan");
    var tr = table.getElementsByTagName("tr");

    for (var i = 1; i < tr.length; i++) {
        var tdBulan = tr[i].getElementsByTagName("td")[2]; // Bulan dan Tahun is index 2
        if (tdBulan) {
            var txtBulan = tdBulan.textContent || tdBulan.innerText;
            var txtLower = txtBulan.toLowerCase();

            var matchTahun = filterTahun === "" || txtLower.indexOf(filterTahun) > -1;
            var matchBulan = filterBulan === "" || txtLower.indexOf(filterBulan) > -1;

            if (matchTahun && matchBulan) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}

function switchTab(tabId) {
    // Hide all tab contents
    document.getElementById('spmb-tab-content').style.display = 'none';
    document.getElementById('sikma-tab-content').style.display = 'none';
    
    // Show target tab content
    document.getElementById(tabId + '-content').style.display = 'block';
    
    // Reset button styles
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        btn.style.color = 'var(--text-muted)';
        btn.style.borderBottom = '3px solid transparent';
    });
    
    // Set active button style
    const activeBtn = document.getElementById('btn-' + tabId);
    if (activeBtn) {
        activeBtn.style.color = 'var(--primary)';
        activeBtn.style.borderBottom = '3px solid var(--primary)';
    }
}