const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  for (const L of ['en', 'de']) {
    const img = (n) => 'data:image/png;base64,' + fs.readFileSync(`${__dirname}/out/${L}/${n}.png`).toString('base64');
    const html = `<html><body style="margin:0;width:1600px;height:800px;display:flex;align-items:center;justify-content:center;gap:56px;
      background:radial-gradient(circle at 20% 10%, #0f95a2 0, transparent 45%),radial-gradient(circle at 85% 95%, #d369a2 0, transparent 40%),#0c1518">
      ${['phone-1', 'phone-2', 'phone-3'].map((n, i) => `<div style="width:318px;height:688px;border-radius:44px;padding:10px;background:#05090b;
        box-shadow:0 0 0 2px #2b3a40, 0 40px 80px -20px rgba(0,0,0,.6);transform:translateY(${i === 1 ? -14 : 14}px)">
        <img src="${img(n)}" style="width:100%;height:100%;object-fit:cover;object-position:top;border-radius:34px;display:block"></div>`).join('')}
    </body></html>`;
    const p = await b.newPage({ viewport: { width: 1600, height: 800 } });
    await p.setContent(html); await p.waitForTimeout(300);
    await p.screenshot({ path: `${__dirname}/out/${L}/phone.png` });
  }
  await b.close();
})();
