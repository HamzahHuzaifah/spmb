const fs = require('fs');
const path = require('path');

// Read the original file which might be UTF-16LE
const raw = fs.readFileSync(path.join(__dirname, 'temp_old_input.ejs'));
// If it's UTF-16LE (has FFFE or FEFF), decode it properly
let content = raw.toString('utf16le');
if (!content.includes('<%- include')) {
    // maybe it was utf8 already?
    content = raw.toString('utf8');
}
if (!content.includes('<%- include')) {
    content = fs.readFileSync(path.join(__dirname, 'temp_old_input_utf8.ejs'), 'utf8');
}

// Remove BOM if exists
if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
}

// 1. Remove "Cari Nomor Pendaftaran" input block
content = content.replace(/<div style="flex: 1;">[\s\S]*?Cari Nomor Pendaftaran[\s\S]*?<\/div>/i, '');

// 2. Add Select2 CSS
content = content.replace('<link rel="stylesheet" href="/css/input-transaksi.css">', '<link rel="stylesheet" href="/css/input-transaksi.css">\n<link href="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css" rel="stylesheet" />');

// 3. Replace namaPendaftar select block
const pendaftarRegex = /<select name="namaPendaftar" id="namaPendaftar" class="form-control" style="width: 100%; margin-bottom: 15px;">[\s\S]*?<\/select>/i;
content = content.replace(pendaftarRegex, '<select name="namaSantriBaru" id="namaPendaftar" class="form-control" style="width: 100%; margin-bottom: 15px;">\n    <option value="">-- Ketik Nama untuk Mencari --</option>\n</select>');

// 4. Fix name of satuanPendidikanBaru
content = content.replace('<select id="satuanPendidikanBaru" class="form-control"', '<select id="satuanPendidikanBaru" name="satuanPendidikan" class="form-control"');

// 5. Replace namaSantriDaftarUlang select block
const santriDaftarUlangRegex = /<select name="namaSantriDaftarUlang" id="namaSantriDaftarUlang" class="form-control" style="width: 100%;">[\s\S]*?<\/select>/i;
content = content.replace(santriDaftarUlangRegex, '<select name="namaSantriDaftarUlang" id="namaSantriDaftarUlang" class="form-control" style="width: 100%;">\n    <option value="">-- Ketik Nama untuk Mencari --</option>\n</select>');

// 6. Fix name of satuanPendidikan for Daftar Ulang
content = content.replace('<select name="satuanPendidikan" id="satuanPendidikan" class="form-control"', '<select name="satuanPendidikanDaftarUlang" id="satuanPendidikan" class="form-control"');

// 7. Add Pagination UI after tabelTransaksi
const paginBlock = `
        <!-- Pagination Controls -->
        <% if (typeof totalPages !== 'undefined' && totalPages > 1) { %>
            <div class="pagination" style="margin-top: 20px; display: flex; justify-content: center; gap: 5px;">
                <% if (currentPage > 1) { %>
                    <a href="?page=<%= currentPage - 1 %>&search=<%= typeof searchQuery !== 'undefined' ? searchQuery : '' %>&startDate=<%= typeof startDateQuery !== 'undefined' ? startDateQuery : '' %>&endDate=<%= typeof endDateQuery !== 'undefined' ? endDateQuery : '' %>&pendidikan=<%= typeof pendidikanQuery !== 'undefined' ? pendidikanQuery : '' %>" class="btn btn-secondary" style="padding: 5px 10px;">&laquo; Prev</a>
                <% } %>
                
                <% for(let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) { %>
                    <a href="?page=<%= i %>&search=<%= typeof searchQuery !== 'undefined' ? searchQuery : '' %>&startDate=<%= typeof startDateQuery !== 'undefined' ? startDateQuery : '' %>&endDate=<%= typeof endDateQuery !== 'undefined' ? endDateQuery : '' %>&pendidikan=<%= typeof pendidikanQuery !== 'undefined' ? pendidikanQuery : '' %>" class="btn <%= currentPage === i ? 'btn-primary' : 'btn-secondary' %>" style="padding: 5px 10px;"><%= i %></a>
                <% } %>
                
                <% if (currentPage < totalPages) { %>
                    <a href="?page=<%= currentPage + 1 %>&search=<%= typeof searchQuery !== 'undefined' ? searchQuery : '' %>&startDate=<%= typeof startDateQuery !== 'undefined' ? startDateQuery : '' %>&endDate=<%= typeof endDateQuery !== 'undefined' ? endDateQuery : '' %>&pendidikan=<%= typeof pendidikanQuery !== 'undefined' ? pendidikanQuery : '' %>" class="btn btn-secondary" style="padding: 5px 10px;">Next &raquo;</a>
                <% } %>
            </div>
            <div style="text-align: center; margin-top: 10px; color: #64748b; font-size: 14px;">
                Menampilkan halaman <%= currentPage %> dari <%= totalPages %> (Total: <%= totalData %> data)
            </div>
        <% } %>
`;
content = content.replace('</table>\r\n    </div>', '</table>\r\n        ' + paginBlock + '\r\n    </div>');
content = content.replace('</table>\n    </div>', '</table>\n        ' + paginBlock + '\n    </div>'); // Fallback for LF

// 8. Make filter search Server-Side (Change filter bar to GET form)
const filterBarRegex = /<div class="filter-bar"[\s\S]*?<\/div>/i;
const newFilterBar = `
    <form method="GET" action="/input-transaksi" class="filter-bar" style="margin-top: 30px; margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        <input type="text" name="search" class="form-control" placeholder="Cari Nama Santri atau No Transaksi..." style="width: 250px;" value="<%= typeof searchQuery !== 'undefined' ? searchQuery : '' %>">
        
        <label style="font-weight: 600; margin-left: 10px;">Dari Tanggal:</label>
        <input type="date" name="startDate" class="form-control" style="width: 140px;" value="<%= typeof startDateQuery !== 'undefined' ? startDateQuery : '' %>">
        
        <label style="font-weight: 600; margin-left: 10px;">Sampai Tanggal:</label>
        <input type="date" name="endDate" class="form-control" style="width: 140px;" value="<%= typeof endDateQuery !== 'undefined' ? endDateQuery : '' %>">

        <select name="pendidikan" class="form-control" style="width: 180px;">
            <option value="">Semua Pendidikan</option>
            <option value="PAUDQu" <%= typeof pendidikanQuery !== 'undefined' && pendidikanQuery === 'PAUDQu' ? 'selected' : '' %>>PAUDQu</option>
            <option value="TPQ" <%= typeof pendidikanQuery !== 'undefined' && pendidikanQuery === 'TPQ' ? 'selected' : '' %>>TPQ</option>
            <option value="MDT" <%= typeof pendidikanQuery !== 'undefined' && pendidikanQuery === 'MDT' ? 'selected' : '' %>>MDT</option>
        </select>
        
        <button type="submit" class="btn btn-primary">Filter</button>
        <a href="/input-transaksi" class="btn btn-secondary">Reset</a>
    </form>
`;
content = content.replace(filterBarRegex, newFilterBar);

// 9. Remove all those inline <script> tags for JSON data (tunggakanData etc)
content = content.replace(/<script id="tunggakanDaftarUlangData"[\s\S]*?<\/script>/gi, '');
content = content.replace(/<script id="tunggakanData"[\s\S]*?<\/script>/gi, '');
content = content.replace(/<script id="santriData"[\s\S]*?<\/script>/gi, '');
content = content.replace(/<script id="santriDaftarUlangData"[\s\S]*?<\/script>/gi, '');

// 10. Clear the giant <script> logic at the bottom, just leave jQuery and Select2
const giantScriptRegex = /<script>\s*\/\/\s*Data tunggakan dari server[\s\S]*?<\/script>/i;
content = content.replace(giantScriptRegex, '');

// 11. Add jQuery and Select2 JS at the bottom before footer
const jsInclude = `
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"></script>
`;
content = content.replace("<%- include('partials/footer') %>", jsInclude + "\n<%- include('partials/footer') %>\n<script src=\"/js/input-transaksi.js\"></script>");

fs.writeFileSync(path.join(__dirname, 'frontend/views/input-transaksi.ejs'), content, 'utf8');
console.log('Successfully rebuilt input-transaksi.ejs!');
