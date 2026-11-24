/* Default entry and full production handoff regression. Serve site/ on :4173. */
'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const origin = 'http://127.0.0.1:4173/';
const output = 'test-results/release';
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const checks = [];
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
      const page = await context.newPage();
      for (const suffix of ['', '#top']) {
        await page.goto(origin + suffix);
        await page.waitForFunction(() => window.__riftDirector?.getState().webglReady);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(200);
        assert.equal(await page.evaluate(() => window.__portfolioOpening.ready), false);
        assert.equal(await page.evaluate(() => scrollY), 0);
        await page.screenshot({ path: `${output}/entry-${width}-${suffix ? 'top' : 'root'}.png` });
        // Use the real native scroll range to trigger the existing finishing burst.
        await page.evaluate(() => scrollTo({ top: (document.querySelector('.intro').offsetHeight - innerHeight) * .9, behavior: 'instant' }));
        await page.waitForFunction(() => window.__portfolioOpening.ready && !window.__portfolioOpening.active);
        assert.equal(await page.evaluate(() => scrollY), 0);
        await page.mouse.wheel(0, 300);
        await page.waitForFunction(() => window.__portfolioHeroExit.getState().active);
        await page.screenshot({ path: `${output}/signature-${width}-${suffix ? 'top' : 'root'}.png` });
        await page.mouse.wheel(0, 1200);
        await page.waitForFunction(() => !window.__portfolioHeroExit.getState().active);
        await page.locator('[data-filter="research"]').click();
        assert.equal(await page.locator('.project-card:visible').count(), 1);
        await page.locator('[data-filter="all"]').click();
        await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
        await page.mouse.wheel(0, -100);
        await page.waitForFunction(() => !window.__portfolioOpening.ready);
        await page.waitForTimeout(250);
        // Seen session state and an old scroll position must not skip on reload.
        await page.locator('#nameOpeningSkip').click();
        await page.evaluate(suffix => history.replaceState(null, '', '/' + suffix), suffix);
        await page.reload();
        await page.screenshot({ path: `${output}/reload-${width}.png` });
        await page.waitForFunction(() => window.__riftDirector?.getState().webglReady);
        await page.waitForTimeout(200);
        assert.equal(await page.evaluate(() => window.__portfolioOpening.ready), false);
        assert.equal(await page.evaluate(() => scrollY), 0, `${width}px ${suffix || '/'} reload returns to zero`);
        checks.push(`${width}px ${suffix || '/'} fresh, forward, reverse and reload passed`);
      }
      for (const hash of ['#work', '#riftProjects', '#prooflab', '#journey']) {
        await page.goto(origin + hash);
        await page.waitForFunction(() => window.__portfolioOpening?.ready);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(200);
        assert.equal(await page.evaluate(() => window.__portfolioHeroExit.getState().active), false);
        assert.equal(await page.locator('.intro').isVisible(), false);
      }
      await page.goto(origin);
      await page.locator('#nameOpeningSkip').click();
      assert.equal(await page.evaluate(() => document.activeElement.id), 'workTitle');
      await page.goto(origin);
      await page.locator('#motionSwitch').click();
      await page.waitForFunction(() => window.__portfolioOpening.ready);
      await page.reload();
      await page.waitForFunction(() => window.__portfolioOpening.ready);
      assert.equal(await page.locator('.intro').isVisible(), false);
      await context.close();
      const reduced = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      reduced.on('pageerror', error => errors.push(error.message));
      await reduced.goto(origin + '#top');
      await reduced.waitForFunction(() => window.__portfolioOpening?.ready);
      assert.equal(await reduced.locator('.intro').isVisible(), false);
      await reduced.close();
      checks.push(`${width}px content deep links, skip, persisted Motion OFF and reduced motion passed`);
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ checks, errors }, null, 2));
    fs.writeFileSync(`${output}/entry-report.json`, JSON.stringify({ checks, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
