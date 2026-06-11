import puppeteer from 'puppeteer';

(async () => {
    // 1. Fetch token via registration
    const randomNum = Math.floor(Math.random() * 9000000) + 1000000;
    const tcVal = `100${randomNum}1`;

    const regRes = await fetch('http://localhost:5000/api/patient-auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Review Test Patient',
            email: `review${randomNum}@example.com`,
            password: 'password123',
            tc: tcVal,
            phone: '+905554443322',
            age: 30,
            gender: 'Erkek',
            bloodType: 'A+'
        })
    });

    let token = null;
    let patientId = null;
    if (regRes.ok) {
        const regData = await regRes.json();
        token = regData.token;
        patientId = regData.patient.id;
    } else {
        const errText = await regRes.text();
        console.log("Registration failed:", errText);
        process.exit();
    }

    // 2. Fetch doctors to get an ID
    const docsRes = await fetch('http://localhost:5000/api/patient-portal/doctors', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const docs = await docsRes.json();
    if (docs.length === 0) {
        console.log("No doctors found");
        process.exit();
    }
    const doctorId = docs[0]._id;

    // 3. Create a completed appointment via direct fetch to backend API test route, or we can just mock the dashboard response in puppeteer
    // Actually, it's easier to just mock the network response in Puppeteer

    // 4. Puppeteer test
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Intercept API calls
    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.url().includes('/api/patient-portal/my-appointments') && request.method() === 'GET') {
            request.respond({
                content: 'application/json',
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify([{
                    _id: 'mock_appt_1',
                    patientId: patientId,
                    doctorId: { _id: doctorId, name: 'Dr. TestMock' },
                    date: new Date('2023-01-01').toISOString(),
                    time: '10:00',
                    type: 'Kontrol',
                    status: 'tamamlandı'
                }])
            });
        } else {
            request.continue();
        }
    });

    try {
        await page.goto('http://localhost:5173/hasta/giris', { waitUntil: 'load' });
        await page.evaluate((t) => {
            localStorage.setItem('patientToken', t);
        }, token);

        await page.goto('http://localhost:5173/hasta/portal', { waitUntil: 'networkidle0', timeout: 15000 });
        console.log('Dashboard Page loaded');

        await page.screenshot({ path: '/Users/charlie/Desktop/GP-2/puppeteer-test/review_dash.png' });

        // click rate doctor button
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const rateBtn = btns.find(b => b.textContent && (b.textContent.includes('Değerlendir') || b.textContent.includes('Rate')));
            if (rateBtn) rateBtn.click();
        });

        await new Promise(r => setTimeout(r, 1000));
        await page.screenshot({ path: '/Users/charlie/Desktop/GP-2/puppeteer-test/review_modal.png' });
        console.log('Screenshots saved');

    } catch (e) {
        console.log('Error:', e);
    }

    await browser.close();
    process.exit();
})();
