/* Start the site/ HTTP preview, then run node scripts/test_quick_view.cjs. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const origin = process.env.QUICK_VIEW_URL || 'http://127.0.0.1:4173/';
const output = path.resolve(__dirname, '../test-results/quick-view');
fs.mkdirSync(output, { recursive: true });
const checks = [];
const errors = [];
const transitionCancellations = [];

async function sceneState(page) {
  return page.evaluate(() => {
    const state = window.__riftDirector.getState();
    return {
      mode: state.mode, scroll: state.scroll, revealProgress: state.revealProgress,
      paused: state.paused, reduced: state.reduced, releasing: state.releasing,
      scrollX, scrollY, hash: location.hash,
      ready: window.__portfolioOpening.ready, active: window.__portfolioOpening.active,
      seen: sessionStorage.getItem('dk-name-handoff-seen')
    };
  });
}
async function openQuickView(page, mobile = false) {
  if (mobile) {
    await page.locator('#menuToggle').click();
    await page.locator('#mobileMenu [data-quick-view]').click();
  } else {
    await page.locator('#quickViewTrigger').click();
  }
  await page.waitForFunction(() => quickView.open && document.activeElement.id === 'quickViewClose');
}
async function record(name, run) {
  await run();
  checks.push(name);
  console.log('PASS', name);
}

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined
  });
  async function pageFor(options = {}, suffix = '') {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ...options });
    page.on('pageerror', error => {
      if (error.message === 'Transition was aborted because of invalid state. ViewTransition opt-in disabled')
        transitionCancellations.push(error.message);
      else errors.push(error.message);
    });
    await page.route('**/*', route => route.request().url().startsWith(new URL(origin).origin) ? route.continue() : route.abort());
    await page.goto(new URL(suffix, origin).href, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__riftDirector && window.portfolioGuide);
    return page;
  }
  try {
    const page = await pageFor();
    await record('Desktop keyboard, native modality, content and resource destinations', async () => {
      await page.locator('#quickViewTrigger').focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#quickView').evaluate(node => node.matches(':modal')), true);
      assert.equal(await page.locator('#quickView').getAttribute('aria-labelledby'), 'quickViewTitle');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'quickViewClose');
      assert.equal(await page.locator('.quick-view-project').count(), 3);
      assert.deepEqual(await page.locator('.quick-view-case').evaluateAll(nodes => nodes.map(node => node.getAttribute('href'))), [
        'projects/srmedu.html#cp-chapter-cp-results', 'projects/kv.html#cp-chapter-cp-results', 'projects/projectmatch.html#cp-chapter-cp-results'
      ]);
      assert.deepEqual(await page.locator('#quickViewLinks a').evaluateAll(nodes => nodes.map(node => node.href)),
        await page.locator('.about-actions a').evaluateAll(nodes => nodes.map(node => node.href)));
      assert.equal(await page.locator('#quickViewEmail').getAttribute('href'), await page.locator('.email-link').getAttribute('href'));
      for (const link of await page.locator('#quickView a').all()) {
        const href = await link.getAttribute('href');
        if (!href.startsWith('https:') && !href.startsWith('mailto:'))
          assert.equal((await page.request.get(new URL(href, origin).href)).status(), 200, href);
      }
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.locator('.quick-view-case').last().evaluate(node => node === document.activeElement), true);
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'quickViewClose');
      for (let count = 0; count < 18; count++) {
        await page.keyboard.press('Tab');
        assert.equal(await page.evaluate(() => quickView.contains(document.activeElement)), true);
      }
      await page.locator('#searchTrigger').evaluate(node => node.focus());
      assert.equal(await page.evaluate(() => quickView.contains(document.activeElement)), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'quickViewTrigger');
      assert.equal(await page.locator('#quickViewTrigger').getAttribute('aria-expanded'), 'false');
      assert.equal(await page.evaluate(() => document.body.style.overflow), '');
    });
    await record('Responsive layouts and explicit close at eight viewport sizes', async () => {
      for (const [width, height] of [[1440,900],[1280,720],[1024,768],[768,1024],[390,844],[360,640],[320,568],[844,390]]) {
        await page.setViewportSize({ width, height });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Page overflow ${width}`);
        await openQuickView(page, width <= 760);
        await page.waitForTimeout(320);
        const geometry = await page.locator('.quick-view-scroll').evaluate(node => ({
          overflow: node.scrollWidth > node.clientWidth,
          close: document.getElementById('quickViewClose').getBoundingClientRect().bottom,
          viewport: innerHeight
        }));
        assert.equal(geometry.overflow, false, `Drawer overflow ${width}`);
        assert(geometry.close <= geometry.viewport, `Close control clipped ${width}`);
        await page.screenshot({ path: path.join(output, `drawer-${width}-${height}.png`) });
        await page.locator('#quickViewLinks a').last().focus();
        const resource = await page.locator('#quickViewLinks a').last().boundingBox();
        assert(resource.y >= 0 && resource.y + resource.height <= height, `Resources unreachable ${width}`);
        await page.locator('#quickViewClose').click();
        assert.equal(await page.evaluate(() => document.activeElement.id), width <= 760 ? 'menuToggle' : 'quickViewTrigger');
      }
      await page.setViewportSize({ width: 1440, height: 900 });
    });
    await record('All five Rift modes retain exact scroll, scene state and frozen animation clock', async () => {
      for (const mode of ['director', 'kinetic', 'fracture', 'infinite', 'ascension']) {
        for (const progress of [0, .45, .86]) {
          await page.evaluate(({ mode, progress }) => {
            window.__riftDirector.setMode(mode);
            scrollTo({ top: (document.querySelector('.intro').offsetHeight - innerHeight) * progress, behavior: 'instant' });
          }, { mode, progress });
          await page.waitForTimeout(100);
          const before = await sceneState(page);
          await openQuickView(page);
          const frozen = await page.evaluate(() => __riftDirector.getState());
          await page.mouse.move(1100, 300);
          await page.mouse.wheel(0, -600);
          await page.waitForTimeout(400);
          assert.deepEqual(await page.evaluate(() => __riftDirector.getState()), frozen);
          assert.deepEqual(await sceneState(page), before);
          await page.keyboard.press('Escape');
          assert.deepEqual(await sceneState(page), before);
        }
      }
    });
    await record('Mid-burst suspension resumes the same handoff without replay', async () => {
      await page.evaluate(() => {
        const span = document.querySelector('.intro').offsetHeight - innerHeight;
        scrollTo({ top: span * .9, behavior: 'instant' });
      });
      await page.waitForFunction(() => __riftDirector.getState().releasing);
      await openQuickView(page);
      const before = await sceneState(page);
      assert.equal(before.releasing, true);
      await page.waitForTimeout(900);
      assert.deepEqual(await sceneState(page), before);
      await page.locator('#quickViewClose').click();
      await page.waitForFunction(() => __portfolioOpening.ready && !__portfolioOpening.active);
      const after = await sceneState(page);
      await openQuickView(page);
      await page.mouse.wheel(0, -800);
      await page.keyboard.press('PageDown');
      await page.waitForTimeout(200);
      assert.deepEqual(await sceneState(page), after);
      await page.keyboard.press('Escape');
      assert.deepEqual(await sceneState(page), after);
    });
    await record('Command palette, case overlays, Kio and rapid reopen coordinate safely', async () => {
      await page.locator('#v6GuideToggle').click();
      await openQuickView(page);
      assert.equal(await page.locator('#kioGuide').evaluate(node => node.inert), true);
      await page.keyboard.press('Control+k');
      await page.waitForFunction(() => document.activeElement.id === 'paletteInput');
      assert.equal(await page.locator('#quickView').evaluate(node => node.open), false);
      assert.equal(await page.locator('#commandPalette').isVisible(), true);
      assert.equal(await page.evaluate(() => main.inert && document.body.style.overflow === 'hidden'), true);
      await page.locator('#paletteInput').fill('Recruiter Quick View');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#quickView').evaluate(node => node.open), true);
      assert.equal(await page.locator('#commandPalette').isVisible(), false);
      await page.keyboard.press('Control+k');
      await page.locator('#paletteInput').fill('SRM Smart Study Hub');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#caseOverlay').isVisible(), true);
      assert.equal(await page.locator('#quickView').evaluate(node => node.open), false);
      assert.equal(await page.locator('#commandPalette').isVisible(), false);
      await page.keyboard.press('Control+k');
      await page.locator('#paletteInput').fill('Recruiter Quick View');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#caseOverlay').isVisible(), false);
      assert.equal(await page.locator('#quickView').evaluate(node => node.open), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#kioGuide').evaluate(node => node.inert), false);
      for (let count = 0; count < 3; count++) {
        await openQuickView(page);
        await page.locator('#quickViewClose').click();
      }
      assert.equal(await page.evaluate(() => main.inert || siteHeader.inert || document.body.style.overflow !== ''), false);
      await openQuickView(page);
      await page.mouse.click(100, 300);
      assert.equal(await page.locator('#quickView').evaluate(node => node.open), false);
    });
    await record('Actual case-study navigation from Quick View and browser Back', async () => {
      for (const slug of ['srmedu', 'kv', 'projectmatch']) {
        await openQuickView(page);
        await page.locator(`.quick-view-case[href="projects/${slug}.html#cp-chapter-cp-results"]`).click();
        await page.waitForURL(`**/projects/${slug}.html#cp-chapter-cp-results`);
        await page.goBack();
        await page.waitForFunction(() => window.__riftDirector && window.portfolioGuide);
        // Back may restore the document from BFCache with its native modal open.
        if (await page.locator('#quickView').evaluate(node => node.open)) await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(() => document.body.style.overflow), '');
      }
    });
    await page.close();
    await record('Touch entry, internal scrolling, mobile focus restoration and reduced motion', async () => {
      const phone = await pageFor({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
      await phone.locator('#menuToggle').tap();
      await phone.locator('#mobileMenu [data-quick-view]').tap();
      assert.equal(await phone.locator('#mobileMenu').isVisible(), false);
      assert.equal(await phone.locator('.quick-view-shell').evaluate(node => getComputedStyle(node).animationName), 'none');
      const before = await sceneState(phone);
      const cdp = await phone.context().newCDPSession(phone);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: 700 }] });
      for (const y of [620, 520, 420, 300, 160]) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y }] });
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await phone.waitForTimeout(300);
      assert(await phone.locator('.quick-view-scroll').evaluate(node => node.scrollTop) > 0, 'Touch did not scroll the drawer');
      assert.deepEqual(await sceneState(phone), before);
      await phone.locator('#quickViewLinks a').last().scrollIntoViewIfNeeded();
      await phone.screenshot({ path: path.join(output, 'mobile-resources.png') });
      await phone.locator('#quickViewClose').tap();
      assert.equal(await phone.evaluate(() => document.activeElement.id), 'menuToggle');
      assert.deepEqual(await sceneState(phone), before);
      await phone.close();
    });
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ origin, checks, errors, transitionCancellations, limitations: ['Mobile touch tests use Chromium device emulation. Physical iOS/Android testing remains manual.'] }, null, 2));
    console.log(`${checks.length} focused checks passed`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
