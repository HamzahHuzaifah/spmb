function openTagihanModal(btn) {
    var data = JSON.parse(btn.getAttribute('data-tagihan'));
    
    // Ganti URL action form dengan endpoint edit sesuai ID tagihan (misal /tagihan/edit/:id)
    document.getElementById('editTagihanForm').action = '/tagihan/edit/' + (data.id || '');
    
    document.getElementById('m_nama').value = data.nama || '';
    document.getElementById('m_formulir').value = data.formulir || 0;
    document.getElementById('m_uangPangkal').value = data.uangPangkal || 0;
    document.getElementById('m_perlengkapan').value = data.perlengkapan || 0;
    document.getElementById('m_seragam').value = data.seragam || 0;
    document.getElementById('m_spp').value = data.spp || 0;
    
    document.getElementById('tagihanModal').style.display = 'block';
}

function closeTagihanModal() {
    document.getElementById('tagihanModal').style.display = 'none';
}

window.onclick = function(event) {
    var modal = document.getElementById('tagihanModal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}