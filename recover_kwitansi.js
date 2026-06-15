const fs = require('fs');

// Path to transcript
const transcriptPath = `C:/Users/hamza/.gemini/antigravity-ide/brain/6241d16a-799c-459c-8a99-3ddddcd1658d/.system_generated/logs/transcript.jsonl`;

const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');
let kwitansiContent = [];
let insideDiff = false;

for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i].trim()) continue;
    let step;
    try {
        step = JSON.parse(lines[i]);
    } catch (e) { continue; }
    
    if (step.type === 'CODE_ACTION' && step.content && step.content.includes('d:\\spmb-web-app\\frontend\\views\\kwitansi.ejs') && step.content.includes('-<!DOCTYPE html>')) {
        const textLines = step.content.split('\n');
        for (let j = 0; j < textLines.length; j++) {
            if (textLines[j].includes('[diff_block_start]')) {
                insideDiff = true;
                // skip @@ line
                j++;
                continue;
            }
            if (textLines[j].includes('[diff_block_end]')) {
                insideDiff = false;
                break;
            }
            
            if (insideDiff) {
                // The lines start with '-', we remove it
                if (textLines[j].startsWith('-')) {
                    kwitansiContent.push(textLines[j].substring(1));
                }
            }
        }
        break;
    }
}

if (kwitansiContent.length > 0) {
    fs.writeFileSync('d:/spmb-web-app/frontend/views/kwitansi.ejs', kwitansiContent.join('\n'));
    console.log('Successfully recovered kwitansi.ejs with ' + kwitansiContent.length + ' lines.');
} else {
    console.log('Failed to find deleted kwitansi content in transcript.');
}
