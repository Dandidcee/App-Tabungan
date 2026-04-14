import puppeteer from 'puppeteer';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, 'dist')));
app.use((req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')));

const server = app.listen(3000, async () => {
    console.log('Server started on 3000');
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        page.on('console', msg => {
            console.log(`BROWSER CONSOLE: ${msg.type()} - ${msg.text()}`);
        });
        
        page.on('pageerror', error => {
            console.log(`BROWSER ERROR: ${error.message}`);
        });
        
        page.on('requestfailed', request => {
            console.log(`BROWSER REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
        });

        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        
        // Let it sit for a second to capture async errors
        await new Promise(r => setTimeout(r, 2000));
        
        await browser.close();
    } catch (e) {
        console.error(e);
    } finally {
        server.close();
        process.exit(0);
    }
});
