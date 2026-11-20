#!/usr/bin/env node
/* Homepage acceptance checks. Start a static server for site/, then run
 * RIFT_HOME_URL=http://localhost:4175/ npm run test:rift-home.
 * Captures and scene-only pixel comparisons are written to ignored test-results/.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const url = process.env.RIFT_HOME_URL || 'http://127.0.0.1:4173/';
const out = path.resolve(__dirname, '../test-results/rift-home');
fs.mkdirSync(out, { recursive: true });
const report = { url, checks: [], sceneDifferences: [], transitionCancellations: [], errors: [], limitations: ['Viewport emulation does not replace physical device testing.'] };
const modes = ['director', 'kinetic', 'fracture', 'infinite', 'ascension'];
const positions = [0, .25, .5, .75, .9];
async function seek(page, progress) {
  await page.evaluate(progress => {
    const intro = document.querySelector('.rift-home .intro');
    scrollTo({ top: (intro.offsetHeight - innerHeight) * progress, behavior: 'instant' });
  }, progress);
  await page.waitForTimeout(120);
}
async function open(context, suffix = '') {
  const page = await context.newPage();
  page.on('pageerror', error => {
    const skipped = 'Transition was aborted because of invalid state. ViewTransition opt-in disabled';
    if (error.message === skipped) report.transitionCancellations.push(error.message);
    else report.errors.push(error.message);
  });
  page.on('response', response => {
    if (response.url().startsWith(new URL(url).origin) && response.status() >= 400)
      report.errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto(new URL(suffix || '/', url).href, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__riftDirector?.getState().webglReady);
  await page.evaluate(() => document.fonts.ready);
  return page;
}
async function scenePixels(page) {
  // Read after the renderer's RAF, before the drawing buffer is discarded.
  return page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => {
    const sample = document.createElement('canvas');
    sample.width = 96; sample.height = 60;
    const context = sample.getContext('2d');
    context.drawImage(document.getElementById('riftCanvas'), 0, 0, 96, 60);
    resolve(Array.from(context.getImageData(0, 0, 96, 60).data));
  })));
}
function difference(first, second) {
  return first.reduce((sum, value, index) => sum + Math.abs(value - second[index]), 0) / first.length;
}
async function layout(page, width, height) {
  await page.setViewportSize({ width, height });
  await seek(page, 0);
  const state = await page.evaluate(() => {
    const box = selector => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
    };
    return { title: box('#heroTitle'), actions: box('.hero-actions'), modes: box('.rift-mode-switcher'), header: box('#siteHeader'), overflow: document.documentElement.scrollWidth > innerWidth };
  });
  assert(!state.overflow, `Overflow at ${width}×${height}`);
  assert(state.title.top >= state.header.bottom, `Title under header at ${width}×${height}`);
  assert(state.title.right <= width, `Clipped title at ${width}×${height}`);
  assert(state.actions.bottom <= state.modes.top, `Action overlaps style controls at ${width}×${height}`);
  assert(state.modes.bottom <= height - 35, `Style controls clipped at ${width}×${height}`);
  await page.screenshot({ path: path.join(out, `opening-${width}-${height}.png`) });
  report.checks.push(`Layout ${width}×${height}`);
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await open(desktop);
    assert.equal(await page.locator('#cursorHalo,.rift-handoff,.bridge-grid,#heroArt,#sculptureCanvas').count(), 0);
    assert.equal(await page.locator('#projectsGrid').count(), 1);
    assert.equal(await page.locator('.project-card').count(), 6);
    assert.deepEqual(await page.locator('.project-card').evaluateAll(cards => cards.map(card => card.dataset.project)), await page.evaluate(() => PORTFOLIO.projects.map(project => project.id)));
    assert.equal(await page.locator('.hero-action').count(), 1);
    assert.equal(await page.locator('.motion-button').count(), 0);
    assert((await page.locator('#kioGuide').boundingBox()).width <= 80);
    for (const [width, height] of [[1440,900],[1280,720],[1024,768],[768,1024],[390,844],[360,640],[320,568]])
      await layout(page, width, height);
    await page.setViewportSize({ width: 1440, height: 900 });
    const samples = new Map();
    for (const progress of positions) {
      await seek(page, progress);
      const scroll = await page.evaluate(() => scrollY);
      for (const mode of modes) {
        // Exercise the real buttons at opening and mid-scroll. At the exit,
        // hero controls yield to work, so use their shared controller directly.
        if (progress <= .5) await page.locator(`button[data-rift-mode="${mode}"]`).click();
        else await page.evaluate(mode => window.__riftDirector.setMode(mode), mode);
        await page.waitForTimeout(100);
        assert.equal((await page.evaluate(() => window.__riftDirector.getState())).mode, mode);
        assert.equal(await page.evaluate(() => scrollY), scroll, 'Mode switch resets scroll');
        samples.set(`${mode}-${progress}`, await scenePixels(page));
        const style = await page.addStyleTag({ content: '.rift-home #work,.stage>:not(canvas),.site-header,#kioGuide{visibility:hidden!important}' });
        await page.screenshot({ path: path.join(out, `scene-${mode}-${progress * 100}.png`) });
        await style.evaluate(node => node.remove());
      }
    }
    for (const progress of positions) {
      for (let first = 0; first < modes.length; first++) {
        for (let second = first + 1; second < modes.length; second++) {
          const delta = difference(samples.get(`${modes[first]}-${progress}`), samples.get(`${modes[second]}-${progress}`));
          report.sceneDifferences.push({ progress, first: modes[first], second: modes[second], meanPixelDifference: delta });
          assert(delta > 2, `Scenes too similar at ${progress}: ${modes[first]} / ${modes[second]} (${delta})`);
        }
      }
    }
    report.checks.push('25 rendered mode/progress states, all 50 pairwise scene differences exceed 2/255');
    await page.evaluate(() => window.__riftDirector.setMode('director'));
    for (const progress of [.6,.7,.75,.8,.9,1]) {
      await seek(page, progress);
      await page.screenshot({ path: path.join(out, `handoff-${progress * 100}.png`) });
      if (progress >= .9) {
        assert(Number(await page.locator('#work').evaluate(node => getComputedStyle(node).opacity)) > .99);
        const first = await page.locator('.project-visual').first().boundingBox();
        assert(first.y < 600, 'Real work missing at end of fly-through');
        assert.equal(await page.locator('#kioLaunch').isVisible(), false, 'Kio covers showcase');
      }
    }
    await seek(page, .25);
    assert(Number(await page.locator('.title-wrap').evaluate(node => getComputedStyle(node).opacity)) > .99);
    await seek(page, 0);
    await page.locator('.hero-action').focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    assert.equal(new URL(page.url()).hash, '#work');
    await page.locator('[data-filter="research"]').click();
    assert.equal(await page.locator('.project-card:visible').count(), 1);
    await page.locator('[data-filter="all"]').click();
    assert.equal(await page.locator('.project-card:visible').count(), 6);
    const firstLink = page.locator('.project-case-open').first();
    await firstLink.focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    assert.equal(await firstLink.evaluate(node => getComputedStyle(node).outlineStyle), 'solid');
    await page.keyboard.press('Enter');
    await page.waitForURL('**/projects/srmedu.html');
    await page.goBack();
    await page.waitForFunction(() => window.__riftDirector?.getState().webglReady);
    assert.equal(await page.locator('.project-case-open').first().evaluate(node => node === document.activeElement), true);
    report.checks.push('Entry anchor, filtering, keyboard case link, focus restoration and browser Back');
    for (const hash of ['#work','#riftProjects']) {
      // Fresh entry tests deep-link targeting separately from Back's scroll restoration.
      const linked = await open(desktop, '/' + hash);
      await linked.waitForTimeout(250);
      assert((await linked.locator('#workTitle').boundingBox()).y >= 60, 'Deep link under header');
      assert((await linked.locator('#workTitle').boundingBox()).y < 250, 'Deep link lost work');
      assert(Number(await linked.locator('#work').evaluate(node => getComputedStyle(node).opacity)) > .99);
      await linked.close();
    }
    await seek(page, 0);
    await page.locator('#kioLaunch').click();
    assert(await page.locator('#kioClose').isVisible());
    await page.locator('#kioClose').click();
    await page.locator('#searchTrigger').click();
    assert(await page.locator('#paletteInput').isVisible());
    await page.keyboard.press('Escape');
    await page.locator('#motionSwitch').click();
    assert((await page.evaluate(() => window.__riftDirector.getState())).paused);
    assert.equal(await page.locator('.intro').evaluate(node => node.offsetHeight), 900);
    await page.locator('#motionSwitch').click();
    report.checks.push('Both work deep links, reverse scroll, Kio, search and global motion toggle');
    await desktop.close();
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const phone = await open(mobile);
    await phone.locator('#riftModeSelect').selectOption('ascension');
    await seek(phone, .25);
    const before = await phone.evaluate(() => scrollY);
    await phone.locator('#riftModeSelect').selectOption('fracture');
    assert.equal(await phone.evaluate(() => scrollY), before);
    await phone.locator('#menuToggle').click();
    await phone.locator('#mobileMenu a[href="#work"]').click();
    await phone.waitForTimeout(800);
    assert.equal(await phone.locator('#kioLaunch').isVisible(), false);
    await phone.screenshot({ path: path.join(out, 'mobile-work.png') });
    await phone.locator('.project-case-open').first().click();
    await phone.waitForURL('**/projects/srmedu.html');
    await phone.goBack();
    await phone.waitForFunction(() => window.__riftDirector?.getState().webglReady);
    await seek(phone, 0);
    assert(!await phone.evaluate(() => document.documentElement.scrollWidth > innerWidth));
    await mobile.close();
    report.checks.push('Mobile selector after scrolling, menu, case navigation and reverse');
    const reduced = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const still = await open(reduced);
    assert((await still.evaluate(() => window.__riftDirector.getState())).paused);
    assert.equal(await still.locator('.intro').evaluate(node => node.offsetHeight), 900);
    await still.locator('.hero-action').click();
    assert.equal(await still.locator('.project-card:visible').count(), 6);
    await still.screenshot({ path: path.join(out, 'reduced-work.png') });
    await reduced.close();
    const staticContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const staticPage = await open(staticContext, '/?motion=off');
    assert((await staticPage.evaluate(() => window.__riftDirector.getState())).paused);
    assert.equal(await staticPage.locator('.intro').evaluate(node => node.offsetHeight), 844);
    await staticPage.locator('.hero-action').click();
    await staticPage.waitForTimeout(800);
    assert.equal(await staticPage.locator('#work').evaluate(node => getComputedStyle(node).opacity), '1');
    await staticContext.close();
    const fallback = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const cssPage = await fallback.newPage();
    await cssPage.route('**/*three*', route => route.abort());
    await cssPage.goto(url);
    await cssPage.waitForFunction(() => !!window.__riftDirector);
    assert(!(await cssPage.evaluate(() => window.__riftDirector.getState())).webglReady);
    await cssPage.locator('.hero-action').click();
    await cssPage.waitForTimeout(800);
    assert(Number(await cssPage.locator('#work').evaluate(node => getComputedStyle(node).opacity)) > .99);
    await fallback.close();
    report.checks.push('Reduced motion and WebGL-unavailable access to actual work');
    // The shared renderer still supports the standalone lab's original handoff.
    const lab = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const preview = await open(lab, '/labs/rift-directors-cut.html');
    await preview.evaluate(() => scrollTo({ top: document.querySelector('.intro').offsetHeight - innerHeight, behavior: 'instant' }));
    await preview.waitForTimeout(200);
    assert(Number(await preview.locator('.rift-handoff').evaluate(node => getComputedStyle(node).opacity)) > .95);
    await lab.close();
    report.checks.push('Standalone Director’s Cut lab');
    assert.deepEqual(report.errors, []);
  } finally {
    await browser.close();
  }
})().catch(error => { report.errors.push(error.stack); process.exitCode = 1; }).finally(() => {
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ checks: report.checks, errors: report.errors, output: out }, null, 2));
});
