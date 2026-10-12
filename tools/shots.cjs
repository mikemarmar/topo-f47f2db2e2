const { chromium, devices } = require('/Users/mmarmar/Code/violet-labs/violet/node_modules/playwright');
(async () => {
  const [base, out] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'], colorScheme: 'dark' });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  for (const [name, hash] of [['home', ''], ['s5', '#/s/5'], ['s15', '#/s/15/23'], ['search', '#/routes'], ['gloss', '#/info/glossary'], ['access', '#/info/access']]) {
    await p.goto(base + hash); await p.waitForTimeout(500);
    if (name === 'search') { await p.fill('#q', 'dalle'); await p.click('[data-band="6"]'); await p.waitForTimeout(200); }
    await p.screenshot({ path: `${out}/${name}.png` });
  }
  const w = await p.evaluate(() => document.documentElement.scrollWidth);
  console.log('scrollWidth', w, 'errors', errs);
  await b.close();
})();
