const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    // Assuming there's no auth, or we can just render the raw HTML
    // Wait, puppeteer might need auth.
    // I will just read the EJS file and look for anything suspicious
    await browser.close();
})();
