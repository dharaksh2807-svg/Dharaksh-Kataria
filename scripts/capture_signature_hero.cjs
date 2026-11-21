/* Isolated prototype acceptance. Uses only localhost assets.
   Run with node scripts/capture_signature_hero.cjs.
   Set HERO_HARDWARE=1 on macOS for a Chromium / Metal measurement. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const root = path.resolve(__dirname, '../site');
const output = path.resolve(__dirname, '../screenshots/signature-hero');
const hardware = process.env.HERO_HARDWARE === '1';
const results = { browser: 'Chromium', hardwareRequested: hardware, captures: [], checks: [] };
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const server = http.createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  fs.readFile(file, (error, body) => {
    if (error) { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    response.end(body);
  });
});

function distribution(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: sorted.length,
    median: sorted[Math.floor(sorted.length * .5)],
    p95: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))],
  };
}

async function measure(page) {
  return page.evaluate(async () => {
    const gl = document.querySelector('#sculpture').getContext('webgl2');
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    const timer = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    const queries = [];
    const originalDraw = gl.drawElements.bind(gl);
    if (timer) {
      gl.drawElements = (...args) => {
        const query = gl.createQuery();
        gl.beginQuery(timer.TIME_ELAPSED_EXT, query);
        originalDraw(...args);
        gl.endQuery(timer.TIME_ELAPSED_EXT);
        queries.push(query);
      };
    }
    const start = { time: performance.now(), renders: signatureHero.state.renderCount };
    const intervals = [];
    let previous = performance.now();
    await new Promise(resolve => {
      function tick(now) {
        intervals.push(now - previous);
        previous = now;
        if (now - start.time >= 5000) resolve();
        else requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
    const end = { time: performance.now(), renders: signatureHero.state.renderCount };
    gl.drawElements = originalDraw;
    // Timer results are asynchronous. Wait for completion without gl.finish().
    for (let attempt = 0; attempt < 100 && queries.some(query => !gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)); attempt++) {
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    const disjoint = timer ? gl.getParameter(timer.GPU_DISJOINT_EXT) : false;
    const gpuMilliseconds = [];
    for (const query of queries) {
      if (!disjoint && gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)) {
        gpuMilliseconds.push(gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6);
      }
      gl.deleteQuery(query);
    }
    return {
      renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      sampleMilliseconds: end.time - start.time,
      submittedFrames: end.renders - start.renders,
      submissionsPerSecond: (end.renders - start.renders) * 1000 / (end.time - start.time),
      rafIntervalsMilliseconds: intervals.slice(1),
      gpuTimerSupported: !!timer, gpuDisjoint: disjoint, gpuMilliseconds,
      state: signatureHero.state,
    };
  });
}

(async () => {
  fs.mkdirSync(output, { recursive: true });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({
    headless: true,
    args: hardware ? ['--use-angle=metal'] : [],
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  });
  results.browserVersion = browser.version();
  try {
    for (const spec of [
      { name: 'desktop-1440x900', width: 1440, height: 900, dpr: 1, motion: 'no-preference' },
      { name: 'mobile-390x844', width: 390, height: 844, dpr: 3, motion: 'no-preference' },
      { name: 'reduced-motion-1440x900', width: 1440, height: 900, dpr: 1, motion: 'reduce' },
      { name: 'reduced-motion-390x844', width: 390, height: 844, dpr: 3, motion: 'reduce' },
    ]) {
      const page = await browser.newPage({
        viewport: { width: spec.width, height: spec.height },
        deviceScaleFactor: spec.dpr, reducedMotion: spec.motion,
        isMobile: spec.width < 700, hasTouch: spec.width < 700,
      });
      const errors = [];
      const requests = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('request', request => requests.push(request.url()));
      await page.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
      const loadedAt = Date.now();
      await page.goto(origin + '/labs/signature-hero.html');
      await page.waitForFunction(() => window.signatureHero?.state.ready);
      const readyMilliseconds = Date.now() - loadedAt;
      await page.waitForTimeout(1200);
      const capture = { ...spec, readyMilliseconds, state: await page.evaluate(() => signatureHero.state) };
      results.captures.push(capture);
      await page.screenshot({ path: path.join(output, spec.name + '.png'), scale: 'css' });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);

      if (spec.motion === 'reduce') {
        const before = await page.evaluate(() => signatureHero.state);
        const imageBefore = await page.locator('#sculpture').screenshot({ scale: 'css' });
        await page.mouse.move(spec.width * .7, spec.height * .5);
        await page.waitForTimeout(1000);
        const after = await page.evaluate(() => signatureHero.state);
        assert.equal(after.renderCount, before.renderCount);
        assert.equal(after.elapsed, 0);
        assert.ok(imageBefore.equals(await page.locator('#sculpture').screenshot({ scale: 'css' })));
        assert.equal(await page.locator('#motion').isDisabled(), true);
        results.checks.push(`PASS ${spec.name} remains pixel-identical with zero further renders and pointer movement`);
        capture.idleRendersOverOneSecond = after.renderCount - before.renderCount;
      } else {
        const performance = await measure(page);
        capture.performance = {
          ...performance,
          rafIntervalsMilliseconds: distribution(performance.rafIntervalsMilliseconds),
          gpuMilliseconds: distribution(performance.gpuMilliseconds),
          note: 'Submission rate and GPU draw duration measured in Chromium. Mobile is viewport/DPR emulation on the same host GPU. GPU timing excludes startup and environment prefiltering.',
        };
        await page.getByRole('button', { name: 'Pause sculpture animation' }).click();
        const before = await page.evaluate(() => signatureHero.state.renderCount);
        await page.waitForTimeout(400);
        assert.equal(await page.evaluate(() => signatureHero.state.renderCount), before);
        await page.getByRole('button', { name: 'Resume sculpture animation' }).click();
        await page.waitForFunction(count => signatureHero.state.renderCount > count, before);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForFunction(() => document.querySelector('#motion').disabled);
        assert.equal(await page.evaluate(() => signatureHero.state.elapsed), 0);
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.waitForFunction(() => !document.querySelector('#motion').disabled);
        assert.equal(await page.evaluate(() => signatureHero.state.paused), false);
        results.checks.push(`PASS ${spec.name} pause, resume and live reduced-motion preference`);
      }
      assert.deepEqual(errors, []);
      assert.ok(requests.every(url => url.startsWith(origin)));
      capture.requestCount = requests.length;
      capture.assetBytes = await page.evaluate(() => performance.getEntriesByType('resource').reduce((total, entry) => total + entry.decodedBodySize, 0));
      capture.errors = errors;
      console.log('PASS', spec.name, capture.performance ? JSON.stringify(capture.performance) : 'static, zero idle renders');
      await page.close();
    }
    const forced = await browser.newPage();
    await forced.goto(origin + '/labs/signature-hero.html?motion=off');
    await forced.waitForFunction(() => window.signatureHero?.state.paused);
    assert.equal(await forced.locator('#motion').isDisabled(), true);
    await forced.close();
    results.checks.push('PASS explicit ?motion=off static URL');
  } catch (error) {
    results.failure = error.stack;
    throw error;
  } finally {
    fs.writeFileSync(path.join(output, 'measurements.json'), JSON.stringify(results, null, 2));
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
