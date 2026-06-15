const fs = require('fs');
let c = fs.readFileSync('frontend/views/kwitansi.ejs', 'utf8');

// The block for nominalRow
const nominalBlock = `<% if ((typeof is_pengeluaran !== 'undefined' && is_pengeluaran) || (typeof is_pembayaran !== 'undefined' && !is_pembayaran)) { %>
                    <tr data-row-id="nominalRow" style="display: flex; width: 100%; order: <%= getOrder('nominalRow') %>; align-items: center; margin-top: 15px; margin-bottom: 15px;">
                        <td class="reorder-controls no-print" style="display: none; width: 40px; padding: 5px; vertical-align: middle;">
                            <button type="button" onclick="moveRowUp(this)" style="background: #e2e8f0; border: 1px solid #cbd5e1; cursor: pointer; padding: 5px; border-radius: 4px; display: block; margin-bottom: 2px;"><i class="fas fa-arrow-up"></i></button>
                            <button type="button" onclick="moveRowDown(this)" style="background: #e2e8f0; border: 1px solid #cbd5e1; cursor: pointer; padding: 5px; border-radius: 4px; display: block;"><i class="fas fa-arrow-down"></i></button>
                        </td>
                        <td style="width: 100%;">
                            <div style="font-size: 14pt; font-weight: bold;">
                                Jumlah Uang &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: Rp <%= nominal_format %>,-
                            </div>
                        </td>
                    </tr>
                <% } else { %>
                    <tr data-row-id="nominalRow" style="display: flex; width: 100%; order: <%= getOrder('nominalRow') %>; align-items: center; margin-top: 15px; margin-bottom: 15px;">
                        <td class="reorder-controls no-print" style="display: none; width: 40px; padding: 5px; vertical-align: middle;">
                            <button type="button" onclick="moveRowUp(this)" style="background: #e2e8f0; border: 1px solid #cbd5e1; cursor: pointer; padding: 5px; border-radius: 4px; display: block; margin-bottom: 2px;"><i class="fas fa-arrow-up"></i></button>
                            <button type="button" onclick="moveRowDown(this)" style="background: #e2e8f0; border: 1px solid #cbd5e1; cursor: pointer; padding: 5px; border-radius: 4px; display: block;"><i class="fas fa-arrow-down"></i></button>
                        </td>
                        <td style="width: 100%;">
                            <div class="amount-box">
                                Rp <%= nominal_format %>,-
                            </div>
                        </td>
                    </tr>
                <% } %>`;

const terbilangBlock = `                    <tr data-row-id="terbilangRow" style="display: flex; width: 100%; order: <%= getOrder('terbilangRow') %>; margin-bottom: 40px;">
                        <td class="reorder-controls no-print" style="display: none; width: 40px; padding: 5px; vertical-align: middle;">
                            <button type="button" onclick="moveRowUp(this)" style="background: #e2e8f0; border: 1px solid #cbd5e1; cursor: pointer; padding: 5px; border-radius: 4px; display: block; margin-bottom: 2px;"><i class="fas fa-arrow-up"></i></button>
                            <button type="button" onclick="moveRowDown(this)" style="background: #e2e8f0; border: 1px solid #cbd5e1; cursor: pointer; padding: 5px; border-radius: 4px; display: block;"><i class="fas fa-arrow-down"></i></button>
                        </td>
                        <td style="width: 100%;">
                            <div class="terbilang-container" style="margin-bottom: 0;">
                                <div class="terbilang-value">Terbilang: <%= terbilang %></div>
                            </div>
                        </td>
                    </tr>`;

// Check if nominal comes before terbilang in the file
const nominalIdx = c.indexOf(nominalBlock.substring(0, 100));
const terbilangIdx = c.indexOf(terbilangBlock.substring(0, 100));

if (nominalIdx !== -1 && terbilangIdx !== -1 && nominalIdx < terbilangIdx) {
    // We need to replace the combined block
    const combinedOriginal = nominalBlock + '\n' + terbilangBlock;
    const combinedNew = terbilangBlock + '\n' + nominalBlock;
    
    // Sometimes whitespace is weird, so let's use regex that matches both
    const rx = /<%\s*if\s*\(\(typeof\s*is_pengeluaran[\s\S]*?<\/div>\s*<\/td>\s*<\/tr>\s*<%\s*}\s*%>\s*<tr\s*data-row-id="terbilangRow"[\s\S]*?<\/div>\s*<\/td>\s*<\/tr>/;
    
    if (rx.test(c)) {
        c = c.replace(rx, combinedNew);
        fs.writeFileSync('frontend/views/kwitansi.ejs', c);
        console.log("Physically swapped nominal and terbilang HTML blocks.");
    } else {
        console.log("Regex didn't match.");
    }
} else {
    console.log("Blocks not found or already swapped.");
}
