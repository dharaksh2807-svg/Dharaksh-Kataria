/* Run with npm test after npx playwright install chromium. No public-site requests. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');

const site = path.resolve(__dirname, '../site');
const output = path.resolve(__dirname, '../test-results/cases');
fs.mkdirSync(output, { recursive: true });
const slugs = fs.readdirSync(path.join(site, 'projects')).filter(file => file.endsWith('.html')).map(file => file.slice(0, -5));
const publicSlugs = ['srmedu', 'projectmatch', 'oodp', 'revalue', 'postpro', 'micchami'];
const manifest = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(site, 'assets/media/manifest.js'), 'utf8'), manifest);
const media = manifest.window.V8_MEDIA_MAP;
const results = [];
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.mp4': 'video/mp4', '.svg': 'image/svg+xml' };
const server = http.createServer((request, response) => {
  const target = path.resolve(site, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
  if (!target.startsWith(site + path.sep)) { response.writeHead(403).end(); return; }
  fs.readFile(target, (error, data) => {
    if (error) { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream' });
    response.end(data);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
  async function pageFor(width = 1440, options = {}) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce', ...options });
    await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    return page;
  }
  async function test(name, run) {
    try { await run(); results.push({ name, status: 'passed' }); console.log('PASS', name); }
    catch (error) { results.push({ name, status: 'failed', error: error.message }); console.error('FAIL', name, error.message); }
  }
  try {
    assert.equal(slugs.length, 12);
    for (const width of [320, 390, 768, 1440]) for (const slug of slugs) {
      await test(`${slug} responsive ${width}`, async () => {
        const page = await pageFor(width);
        try {
          const errors = [];
          page.on('pageerror', error => errors.push(error.message));
          const response = await page.goto(`${origin}/projects/${slug}.html`);
          assert.equal(response.status(), 200);
          for (const heading of ['Problem', 'Solution', 'Implementation', 'Result', 'Engineering challenge', 'Trade-offs', 'Limitations & verification'])
            assert.equal(await page.getByRole('heading', { name: heading, exact: true }).count(), 1);
          assert.equal(await page.locator('.cp-architecture li').count(), 3);
          assert.equal(await page.locator('.cp-gallery-open').count(), (media[slug] || []).filter(item => item.type === 'image').length);
          await page.locator('#cpCaptures').scrollIntoViewIfNeeded();
          for (const image of await page.locator('.cp-gallery img').all()) {
            await image.scrollIntoViewIfNeeded();
            await image.evaluate(image => image.decode());
            assert.ok(await image.getAttribute('alt'));
            assert.equal(await image.getAttribute('loading'), 'lazy');
          }
          assert.equal(await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth)), 0);
          assert.deepEqual(errors, []);
          if (slug === 'metro') {
            assert.equal(await page.locator('a[href^="https://github.com"], .cp-load-video, video').count(), 0);
            assert.match(await page.locator('#cpMediaStatus').innerText(), /private paths, credentials and source details/);
          }
          if (['srmedu', 'metro'].includes(slug) && [390, 1440].includes(width)) {
            await page.locator('.cp-hero').screenshot({ path: path.join(output, `${slug}-hero-${width}.png`) });
            await page.locator('#cpCaptures').screenshot({ path: path.join(output, `${slug}-gallery-${width}.png`) });
          }
        } finally { await page.close(); }
      });
    }
    for (const slug of publicSlugs) await test(`${slug} keyboard lightbox`, async () => {
      const page = await pageFor(390);
      try {
        await page.goto(`${origin}/projects/${slug}.html`);
        const opener = page.locator('.cp-gallery-open').first();
        await opener.scrollIntoViewIfNeeded();
        await opener.focus();
        await page.keyboard.press('Enter');
        const dialog = page.getByRole('dialog', { name: 'Project screenshot viewer' });
        await dialog.waitFor({ state: 'visible' });
        assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Close screenshot viewer ×');
        for (const key of ['Shift+Tab', 'Tab', 'Tab', 'Tab', 'Tab']) {
          await page.keyboard.press(key);
          assert.ok(await page.evaluate(() => document.querySelector('dialog').contains(document.activeElement)));
        }
        const count = await page.locator('.cp-gallery-open').count();
        if (count > 1) {
          await page.keyboard.press('ArrowRight');
          assert.match(await page.locator('.cp-lightbox-count').innerText(), /Screenshot 2/);
          await page.keyboard.press('Home');
          assert.match(await page.locator('.cp-lightbox-count').innerText(), /Screenshot 1/);
          await page.keyboard.press('End');
          assert.match(await page.locator('.cp-lightbox-count').innerText(), new RegExp(`Screenshot ${count}`));
          await page.keyboard.press('ArrowLeft');
        }
        if (slug === 'srmedu') await dialog.screenshot({ path: path.join(output, 'lightbox-390.png') });
        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'hidden' });
        assert.ok(await opener.evaluate(node => node === document.activeElement));
        assert.ok(!await page.locator('html').evaluate(node => node.classList.contains('cp-viewing-image')));
      } finally { await page.close(); }
    });
    await test('optional videos load on request without autoplay', async () => {
      const page = await pageFor();
      try {
        const requests = [];
        page.on('request', request => { if (request.url().endsWith('.mp4')) requests.push(request.url()); });
        await page.goto(`${origin}/projects/srmedu.html`);
        await page.locator('#cpCaptures').scrollIntoViewIfNeeded();
        const video = page.locator('video');
        assert.equal(requests.length, 0);
        assert.equal(await video.getAttribute('preload'), 'none');
        assert.equal(await video.getAttribute('src'), null);
        await page.getByRole('button', { name: 'LOAD OPTIONAL VIDEO' }).click();
        await page.waitForFunction(() => document.querySelector('video').readyState >= 1);
        assert.ok(requests.length > 0);
        assert.ok(await video.evaluate(video => video.paused && !video.autoplay && video.controls));
        await video.evaluate(video => video.play());
        await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
        assert.ok(await video.evaluate(video => video.paused));
      } finally { await page.close(); }
    });
    await test('broken screenshots and video have visible fallbacks', async () => {
      const page = await pageFor();
      try {
        await page.route('**/assets/media/*.{webp,mp4}', route => route.abort());
        await page.goto(`${origin}/projects/srmedu.html`);
        await page.locator('.cp-gallery-open').first().scrollIntoViewIfNeeded();
        await page.waitForFunction(() => document.querySelector('.cp-gallery-open').disabled);
        assert.match(await page.locator('.cp-gallery-open').first().innerText(), /Screenshot unavailable/);
        await page.getByRole('button', { name: 'LOAD OPTIONAL VIDEO' }).click();
        await page.getByText('Video unavailable.', { exact: false }).waitFor();
      } finally { await page.close(); }
    });
    await test('gallery works when decorative canvas fails', async () => {
      const page = await pageFor();
      try {
        await page.addInitScript(() => HTMLCanvasElement.prototype.getContext = () => null);
        await page.goto(`${origin}/projects/srmedu.html`);
        await page.locator('.cp-gallery-open').first().click();
        assert.ok(await page.locator('dialog').isVisible());
      } finally { await page.close(); }
    });
    await test('content and missing-media explanation survive disabled JavaScript', async () => {
      const page = await pageFor(320, { javaScriptEnabled: false });
      try {
        await page.goto(`${origin}/projects/metro.html`);
        assert.equal(await page.locator('h1').innerText(), 'Metro Runner 3D');
        assert.match(await page.locator('#cpCaptures').innerText(), /Enable JavaScript/);
        assert.equal(await page.locator('.cp-architecture li').count(), 3);
      } finally { await page.close(); }
    });
    await test('opt-in live preview includes fallback and can be unloaded', async () => {
      const page = await pageFor();
      try {
        await page.addInitScript(() => HTMLCanvasElement.prototype.getContext = () => null);
        await page.goto(`${origin}/projects/srmedu.html`);
        assert.equal(await page.locator('iframe').count(), 0);
        await page.getByRole('button', { name: 'LOAD LIVE WEBSITE ↗' }).click();
        assert.equal(await page.locator('iframe').count(), 1);
        assert.equal(await page.getByRole('link', { name: 'open the public website in a new tab ↗' }).getAttribute('href'), 'https://www.srmedu.in/');
        await page.getByRole('button', { name: 'CLOSE LIVE PREVIEW' }).click();
        assert.equal(await page.locator('iframe').count(), 0);
        assert.ok(await page.locator('#cpLoadPreview').evaluate(node => node === document.activeElement));
      } finally { await page.close(); }
    });
    await test('normal-motion setting preserves optional playback', async () => {
      const page = await pageFor(768, { reducedMotion: 'no-preference' });
      try {
        await page.goto(`${origin}/projects/oodp.html`);
        assert.equal(await page.locator('video').getAttribute('src'), null);
        assert.ok(await page.locator('video').evaluate(video => !video.autoplay));
      } finally { await page.close(); }
    });
  } finally {
    await browser.close();
    server.close();
    const failed = results.filter(result => result.status === 'failed').length;
    const report = { browser: 'Chromium ' + browser.version(), total: results.length, passed: results.length - failed, failed, results };
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(`${report.passed}/${report.total} passed`);
    if (failed) process.exitCode = 1;
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
