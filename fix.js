const fs = require('fs');

// 1. Fix dashboard.ejs CSS
let dash = fs.readFileSync('frontend/views/dashboard.ejs', 'utf-8');

dash = dash.replace(/class="grid-cell"/g, 'class="card mb-4"');
dash = dash.replace(/class="cell-title"/g, 'class="card-header bg-success text-white font-weight-bold"');
dash = dash.replace(/class="cell-value"/g, 'class="card-body text-center stat-value" style="font-size: 28px; font-weight: bold;"');
dash = dash.replace(/class="spmb-grid"/g, 'class="row"');
dash = dash.replace(/class="rekap-grid"/g, 'class="row"');
dash = dash.replace(/class="rekap-cell"/g, 'class="card col-md-6 mb-4 px-0"');
dash = dash.replace(/class="rekap-title"/g, 'class="card-header bg-success text-white font-weight-bold text-center"');
dash = dash.replace(/class="table-inner"/g, 'class="table table-bordered table-striped" style="margin-bottom: 0;"');
dash = dash.replace(/class="rekap-table"/g, 'class="table table-bordered table-striped" style="margin-bottom: 0;"');

// Add bootstrap grid col-md-4 wrappers to the first 2 spmb-grid's grid-cells
// Wait, a better way is to just add 'col-md-4' to the card itself if it's in a row.
dash = dash.replace(/class="card mb-4"/g, 'class="card col-md-4 mb-4 px-0"');

fs.writeFileSync('frontend/views/dashboard.ejs', dash);

// 2. Fix santri.ejs AJAX
let santri = fs.readFileSync('frontend/views/santri.ejs', 'utf-8');
const ajaxScriptSantri = `
<script>
document.querySelector('form[action="/daftar"]').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    
    fetch(this.action, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if(result.success) {
            closeAddSantriModal();
            const successModal = document.getElementById('successModal');
            if(result.noRef) {
                document.getElementById('successNoRef').innerText = result.noRef;
                document.getElementById('successNoRefContainer').style.display = 'block';
            }
            successModal.style.display = 'block';
        } else {
            alert('Terjadi kesalahan saat menyimpan data.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Gagal menghubungi server.');
    });
});
</script>
`;
if(!santri.includes("fetch(this.action")) {
    santri = santri.replace('</script>\n\n<%- include(\'partials/footer\') %>', ajaxScriptSantri + '\n</script>\n\n<%- include(\'partials/footer\') %>');
    fs.writeFileSync('frontend/views/santri.ejs', santri);
}

// 3. Fix santri-daftar-ulang.ejs AJAX
let santriDaftarUlang = fs.readFileSync('frontend/views/santri-daftar-ulang.ejs', 'utf-8');
const ajaxScriptDU = `
<script>
document.querySelector('form[action="/daftar-ulang"]').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    
    fetch(this.action, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if(result.success) {
            closeAddSantriModal();
            const successModal = document.getElementById('successModal');
            if(result.noRef) {
                document.getElementById('successNoRef').innerText = result.noRef;
                document.getElementById('successNoRefContainer').style.display = 'block';
            }
            successModal.style.display = 'block';
        } else {
            alert('Terjadi kesalahan saat menyimpan data.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Gagal menghubungi server.');
    });
});
</script>
`;
if(!santriDaftarUlang.includes("fetch(this.action")) {
    santriDaftarUlang = santriDaftarUlang.replace('</script>\n\n<%- include(\'partials/footer\') %>', ajaxScriptDU + '\n</script>\n\n<%- include(\'partials/footer\') %>');
    fs.writeFileSync('frontend/views/santri-daftar-ulang.ejs', santriDaftarUlang);
}

console.log("Done");
