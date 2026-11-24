/* Real-site Signature Break acceptance. Serve site/ on localhost:4173 first. */
'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const origin = process.env.RIFT_HOME_URL || 'http://127.0.0.1:4173/';
const output = path.resolve(__dirname, '../test-results/hero-exit');
fs.mkdirSync(output, { recursive: true });
const report = { checks: [], errors: [], viewports: [] };

async function settled(page) {
  await page.waitForFunction(() => window.__portfolioHeroExit && window.__portfolioOpening?.ready && !window.__portfolioOpening.active);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(100);
}
async function seek(page, value) {
  await page.evaluate(value => {
    const state = window.__portfolioHeroExit.getState();
    scrollTo({ top: state.start + (state.end - state.start) * value, behavior: 'instant' });
  }, value);
  await page.waitForTimeout(80);
}
async function state(page) {
  return page.evaluate(() => ({
    ...window.__portfolioHeroExit.getState(),
    hidden: document.querySelector('.hero-exit-art').hidden,
    clip: getComputedStyle(document.getElementById('work')).clipPath,
    heroTransform: getComputedStyle(document.getElementById('nameOpening')).transform,
    workTransform: getComputedStyle(document.getElementById('work')).transform,
    overflow: document.documentElement.scrollWidth > innerWidth,
  }));
}
function clear(actual) {
  assert.equal(actual.active, false);
  assert.equal(actual.hidden, true);
  assert.equal(actual.clip, 'none');
  assert.equal(actual.heroTransform, 'none');
  assert.equal(actual.workTransform, 'none');
  assert.equal(actual.overflow, false);
}

(async () => {
  const browser = await chromium.launch();
  try {
    for (const [width, height] of [[1440, 900], [1280, 800], [768, 1024], [390, 844], [844, 390]]) {
      const context = await browser.newContext({ viewport: { width, height } });
      const page = await context.newPage();
      page.on('pageerror', error => report.errors.push(error.message));
      await page.goto(new URL('#nameOpening', origin).href);
      await settled(page);
      await seek(page, 0);
      clear(await state(page));
      const heroBefore = await page.locator('#nameHeroTitle').screenshot();
      const choreography = new Map();
      for (const value of [0, .25, .45, .65, .85, 1]) {
        await seek(page, value);
        const actual = await state(page);
        assert.equal(actual.overflow, false);
        assert.equal(actual.active, height > 500 && value > 0 && value < 1);
        choreography.set(value, await page.evaluate(() => ({
          clip: getComputedStyle(document.getElementById('work')).clipPath,
          thread: document.querySelector('.hero-exit-thread path').getAttribute('d'),
          first: getComputedStyle(document.querySelector('.name-opening-line')).translate,
        })));
        await page.screenshot({ path: path.join(output, `${width}x${height}-${Math.round(value * 100)}.png`) });
      }
      clear(await state(page));
      await seek(page, 0);
      clear(await state(page));
      assert(heroBefore.equals(await page.locator('#nameHeroTitle').screenshot()), 'Reverse restores identical name typography');
      for (const value of [.67, .24, .82, .46, .61, .28, .97, .25, 1.5, 0]) await seek(page, value);
      clear(await state(page));
      if (height > 500) {
        await seek(page, .45);
        assert.deepEqual(await page.evaluate(() => ({
          clip: getComputedStyle(document.getElementById('work')).clipPath,
          thread: document.querySelector('.hero-exit-thread path').getAttribute('d'),
          first: getComputedStyle(document.querySelector('.name-opening-line')).translate,
        })), choreography.get(.45), 'Repeated reversal reconstructs the same geometry');
      }
      await seek(page, .45);
      const stopped = await state(page);
      await page.waitForTimeout(250);
      const idle = await state(page);
      assert.equal(idle.progress, stopped.progress);
      assert.equal(idle.renders, stopped.renders, 'No idle render loop');
      assert.equal(idle.measurements, stopped.measurements, 'No per-frame layout measurement');
      const count = await page.locator('.hero-exit-art').count();
      assert.equal(count, 1);
      if (height > 500) {
        await page.locator('.name-opening-action').focus();
        clear(await state(page));
        await page.keyboard.press('Tab');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'nameBackToRift');
        await page.mouse.wheel(0, 1);
        await page.evaluate(() => document.activeElement.blur());
        await seek(page, .45);
        if (width >= 1280) {
          const beforeDialog = (await state(page)).progress;
          await page.locator('#quickViewTrigger').click();
          assert.equal(await page.locator('#quickView').evaluate(node => node.open), true);
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('#quickView').evaluate(node => node.open), false);
          assert.equal((await state(page)).progress, beforeDialog);
        }
        // Resize while active, then verify the new native interval and reversal.
        await page.setViewportSize({ width: width - 10, height });
        await page.waitForTimeout(100);
        await seek(page, 0);
        clear(await state(page));
        await page.setViewportSize({ width, height });
        await page.waitForTimeout(100);
        await page.locator('.name-opening-action').click();
        await page.waitForTimeout(1200);
        clear(await state(page));
        assert.equal(await page.evaluate(() => document.activeElement.id), 'workTitle');
        await page.locator('[data-filter="research"]').click();
        assert.equal(await page.locator('.project-card:visible').count(), 1);
        await page.locator('[data-filter="all"]').click();
        assert.equal(await page.locator('.project-card:visible').count(), 6);
      }
      report.viewports.push({ width, height, status: 'passed', shortViewportBypass: height <= 500 });
      await context.close();
    }
    report.checks.push('Rest, six captures, completion, reversal, fast travel, direction changes, idle rendering, resize, native CTA and filters across five viewports');

    for (const hash of ['#work', '#riftProjects']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(new URL(hash, origin).href);
      await settled(page);
      clear(await state(page));
      const title = await page.locator('#workTitle').boundingBox();
      assert(title.y >= 60 && title.y < 250);
      await page.goBack();
      await page.goForward();
      await settled(page);
      clear(await state(page));
      await page.close();
    }
    report.checks.push('Work deep links and browser Back/Forward bypass decorative clipping');

    for (const mode of ['reduced', 'switch', 'url', 'static']) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' });
      await page.goto(new URL(mode === 'url' ? '?motion=off#nameOpening' : '#nameOpening', origin).href);
      await settled(page);
      if (mode === 'switch') await page.locator('#motionSwitch').click();
      if (mode === 'static') await page.evaluate(() => document.documentElement.classList.add('rift-static'));
      await seek(page, .65);
      clear(await state(page));
      await seek(page, 0);
      if (mode === 'switch') await page.locator('#motionSwitch').click();
      if (mode === 'reduced') await page.emulateMedia({ reducedMotion: 'no-preference' });
      if (['switch', 'reduced'].includes(mode)) {
        await seek(page, .45);
        assert.equal((await state(page)).active, true);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForTimeout(100);
        clear(await state(page));
      }
      await page.close();
    }
    report.checks.push('Motion switch, URL, static mode and live reduced-motion changes bypass and reset');
    const entrance = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await entrance.goto(new URL('#nameOpening', origin).href);
    await settled(entrance);
    await entrance.evaluate(() => window.__portfolioOpening.restart());
    await entrance.waitForFunction(() => window.__portfolioOpening.active);
    await seek(entrance, .45);
    clear(await state(entrance));
    await entrance.waitForFunction(() => !window.__portfolioOpening.active);
    await entrance.waitForTimeout(100);
    clear(await state(entrance));
    await entrance.mouse.wheel(0, 1);
    await entrance.waitForFunction(() => window.__portfolioHeroExit.getState().active);
    await seek(entrance, 0);
    clear(await state(entrance));
    await entrance.close();
    report.checks.push('Existing name entrance owns its transforms until settled and a new native gesture activates the exit');
    const fallback = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await fallback.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        if (this.id === 'riftCanvas' && type.startsWith('webgl')) return null;
        return getContext.call(this, type, ...args);
      };
    });
    await fallback.goto(origin);
    await fallback.waitForFunction(() => window.__riftDirector && window.__portfolioHeroExit);
    await fallback.locator('#nameOpeningSkip').click();
    await settled(fallback);
    await fallback.mouse.wheel(0, -1);
    await seek(fallback, .65);
    assert.equal((await state(fallback)).navigation, false);
    clear(await state(fallback));
    await fallback.close();
    report.checks.push('Actual WebGL-unavailable Rift entry bypasses decoration after Skip to work');
    assert.deepEqual(report.errors, []);
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    report.failure = error.stack;
    throw error;
  } finally {
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
