const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'frontend', 'views');
const cssDir = path.join(__dirname, 'frontend', 'public', 'css');
const stylePath = path.join(cssDir, 'style.css');

if (!fs.existsSync(stylePath)) {
    console.error('style.css not found!');
    process.exit(1);
}

const cssContent = fs.readFileSync(stylePath, 'utf-8');

// Parse blocks: /* From filename.ejs */
const blocks = {};
const regex = /\/\*\s*From\s+([\w-]+)\.ejs\s*\*\/\s*([\s\S]*?)(?=(?:\/\*\s*From\s+[\w-]+\.ejs\s*\*\/)|$)/g;

let match;
while ((match = regex.exec(cssContent)) !== null) {
    let origin = match[1];
    let content = match[2].trim();
    if (!content) continue;

    // We don't have header/footer mapping to global for CSS typically, but just in case
    if (origin === 'header' || origin === 'footer' || origin === 'layout') {
        origin = 'global';
    }

    if (!blocks[origin]) {
        blocks[origin] = [];
    }
    blocks[origin].push(content);
}

// Write the separated files
for (const [name, contentArray] of Object.entries(blocks)) {
    const filename = `${name}.css`;
    const fullPath = path.join(cssDir, filename);
    const content = contentArray.join('\n\n');
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`Created ${filename}`);
}

// Clean up old style.css
fs.renameSync(stylePath, path.join(cssDir, 'style.css.bak'));
// Create an empty style.css just in case it's still linked globally to prevent 404s
fs.writeFileSync(stylePath, '/* Global styles moved to modular files */\n', 'utf-8');

// Update EJS files to include the specific CSS
function updateEjsFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            updateEjsFiles(fullPath);
        } else if (fullPath.endsWith('.ejs')) {
            let content = fs.readFileSync(fullPath, 'utf-8');
            let modified = false;
            const basename = path.basename(file, '.ejs');

            if (blocks[basename] && basename !== 'global') {
                const linkTag = `<link rel="stylesheet" href="/css/${basename}.css">`;
                
                // Don't add if already there
                if (!content.includes(linkTag)) {
                    // Try to insert after header include, or just at the top of the file
                    // But kwitansi.ejs is standalone, it has </head>
                    if (content.includes('</head>')) {
                        content = content.replace('</head>', `    ${linkTag}\n</head>`);
                    } else if (content.includes("include('partials/header'")) {
                        // Find the end of the header include line
                        const headerRegex = /<%- include\('partials\/header'[^>]*>\n?/g;
                        content = content.replace(headerRegex, (match) => {
                            return match + `${linkTag}\n`;
                        });
                    } else if (content.includes("include('../partials/header'")) {
                        const headerRegex = /<%- include\('\.\.\/partials\/header'[^>]*>\n?/g;
                        content = content.replace(headerRegex, (match) => {
                            return match + `${linkTag}\n`;
                        });
                    } else {
                        // Just prepend
                        content = `${linkTag}\n` + content;
                    }
                    modified = true;
                }
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf-8');
                console.log(`Updated CSS inclusions in ${fullPath}`);
            }
        }
    }
}

updateEjsFiles(viewsDir);
console.log('CSS Splitting completed successfully.');
