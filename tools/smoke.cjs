// usage: node smoke.cjs <baseUrl> <outdir>
const { chromium, devices } = require('/Users/mmarmar/Code/violet-labs/violet/node_modules/playwright');
(async () => {
  const [base, out] = process.argv.slice(2);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13'], serviceWorkers: 'allow' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.screenshot({ path: `${out}/home.png`, fullPage: false });
  await page.click('#odl');
  await page.waitForFunction(() => /Everything is saved/.test(document.getElementById('ostatus').textContent), null, { timeout: 120000 });
  console.log('status:', await page.textContent('#ostatus'));
  await ctx.setOffline(true);
  await page.goto(base + '#/s/1/12');
  await page.reload();
  await page.waitForSelector('.route.flash');
  const imgsOk = await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('.topo-img img')];
    for (const i of imgs) { i.loading = 'eager'; if (!i.complete) await new Promise((r) => { i.onload = i.onerror = r; }); }
    return imgs.map((i) => i.naturalWidth > 0);
  });
  console.log('offline sector imgs loaded:', imgsOk.join(','));
  await page.screenshot({ path: `${out}/sector.png` });
  await page.goto(base + '#/routes'); await page.fill('#q', 'diedre');
  console.log('search count:', await page.textContent('#count'));
  await page.screenshot({ path: `${out}/search.png` });
  await page.goto(base + '#/s/1');
  await page.click('.topo-img >> nth=1');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/viewer.png` });
  console.log('errors:', errors.length ? errors : 'none');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
