import puppeteer from 'puppeteer';

(async () => {
    // 1. Fetch token
    const randomNum = Math.floor(Math.random() * 9000000) + 1000000;
    const tcVal = `100${randomNum}1`; // 11 digits
    const regRes = await fetch('http://localhost:5173/api/patient-auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test Patient',
            email: `test${randomNum}@example.com`,
            password: 'password123',
            tc: tcVal,
            phone: '+905554443322',
            age: 30,
            gender: 'Erkek',
            bloodType: 'A+'
        })
    });
    
    let token = null;
    if (regRes.ok) {
        const regData = await regRes.json();
        token = regData.token;
    } else {
        const errText = await regRes.text();
        console.log("Registration failed:", errText);
        return;
    }

    if (!token) {
        console.log("Failed to get token");
        return;
    }

    console.log("Got token successfully");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('BROWSER CONSOLE ERROR:', msg.text());
        }
    });

    page.on('pageerror', err => {
        console.log('PAGE ERROR EVENT:', err.toString());
    });

    try {
        await page.goto('http://localhost:5173/hasta/giris', { waitUntil: 'load' });
        await page.evaluate((t) => {
            localStorage.setItem('patientToken', t);
        }, token);
        
        await page.goto('http://localhost:5173/hasta/portal', { waitUntil: 'networkidle0', timeout: 15000 });
        console.log('Dashboard Page loaded');
        console.log('Current URL is:', page.url());
        
        await page.screenshot({ path: '/Users/charlie/Desktop/GP-2/puppeteer-test/screenshot_dash.png' });
        console.log('Screenshot saved');
    } catch (e) {
        console.log('Error:', e);
    }
    
    await browser.close();
})();
