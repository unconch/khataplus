// Screenshot capture script using Playwright
const { chromium } = require('playwright');

async function captureScreenshot() {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Set viewport for mobile-like screenshot
    await page.setViewportSize({ width: 390, height: 844 });

    try {
        console.log('Navigating to app...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });

        // Wait for content to load
        await page.waitForTimeout(2000);

        console.log('Taking screenshot...');
        await page.screenshot({
            path: './public/images/khataplus_mockup.png',
            fullPage: false
        });

        console.log('Screenshot saved to public/images/khataplus_mockup.png');
    } catch (error) {
        console.error('Error:', error.message);

        // Try the landing page instead
        try {
            console.log('Trying landing page...');
            await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 10000 });
            await page.waitForTimeout(1000);
            await page.screenshot({ path: './public/images/khataplus_mockup.png' });
            console.log('Landing page screenshot saved!');
        } catch (e) {
            console.error('Failed to capture any screenshot:', e.message);
        }
    }

    await browser.close();
    console.log('Done!');
}

captureScreenshot();
