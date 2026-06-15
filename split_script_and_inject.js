const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'frontend', 'views');
const jsDir = path.join(__dirname, 'frontend', 'public', 'js');
const scriptPath = path.join(jsDir, 'script.js');

if (!fs.existsSync(scriptPath)) {
    console.error('script.js not found!');
    process.exit(1);
}

const scriptContent = fs.readFileSync(scriptPath, 'utf-8');

// Parse blocks: /* From filename.ejs */
const blocks = {};
const regex = /\/\*\s*From\s+([\w-]+)\.ejs\s*\*\/\s*([\s\S]*?)(?=(?:\/\*\s*From\s+[\w-]+\.ejs\s*\*\/)|$)/g;

let match;
while ((match = regex.exec(scriptContent)) !== null) {
    let origin = match[1];
    let content = match[2].trim();
    if (!content) continue;

    // Map footer and layout to 'global'
    if (origin === 'footer' || origin === 'layout' || origin === 'header' || origin === 'landing') {
        origin = 'global';
    }

    if (!blocks[origin]) {
        blocks[origin] = [];
    }
    blocks[origin].push(content);
}

// Write the separated files
for (const [name, contentArray] of Object.entries(blocks)) {
    const filename = `${name}.js`;
    const fullPath = path.join(jsDir, filename);
    const content = contentArray.join('\n\n');
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`Created ${filename}`);
}

// Clean up old script.js (rename as backup just in case)
fs.renameSync(scriptPath, path.join(jsDir, 'script.js.bak'));

// Now, update EJS files to include the specific scripts and global.js
function updateEjsFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            updateEjsFiles(fullPath);
        } else if (fullPath.endsWith('.ejs')) {
            let content = fs.readFileSync(fullPath, 'utf-8');
            let modified = false;

            // 1. Replace <script src="/js/script.js"></script> with global.js if it exists
            if (content.includes('<script src="/js/script.js"></script>')) {
                content = content.replace(/<script src="\/js\/script\.js"><\/script>/g, '<script src="/js/global.js"></script>');
                modified = true;
            }

            // 2. Add specific script inclusion
            const basename = path.basename(file, '.ejs');
            if (blocks[basename] && basename !== 'global') {
                const scriptTag = `<script src="/js/${basename}.js"></script>`;
                
                // Don't add if already there
                if (!content.includes(scriptTag)) {
                    // Try to insert before </body>
                    if (content.includes('</body>')) {
                        content = content.replace('</body>', `    ${scriptTag}\n</body>`);
                    } else if (content.includes("<%- include('partials/footer') %>")) {
                        content = content.replace("<%- include('partials/footer') %>", `<%- include('partials/footer') %>\n${scriptTag}`);
                    } else {
                        // Just append
                        content += `\n${scriptTag}\n`;
                    }
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf-8');
                console.log(`Updated inclusions in ${fullPath}`);
            }
        }
    }
}

updateEjsFiles(viewsDir);
console.log('Splitting completed successfully.');
