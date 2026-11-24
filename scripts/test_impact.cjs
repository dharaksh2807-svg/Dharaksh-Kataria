/* Run against the local site/ HTTP preview. Source mappings live in projects.js. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { chromium } = require('playwright');
const origin = process.env.IMPACT_URL || 'http://127.0.0.1:4173/';
const output = path.resolve(__dirname, '../test-results/impact');
fs.mkdirSync(output, { recursive: true });
const data = { window: {} };
vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../site/projects.js'), 'utf8'), data);
vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../site/content-extra.js'), 'utf8'), data);
const projects = data.window.PORTFOLIO.projects;
const expected = {
  srmedu: { values: ['802', '7,853'], period: '2 Oct–10 Nov 2026', kind: 'owner-analytics' },
  oodp: { values: ['2,765', '71,726'], period: '1–28 May 2026', kind: 'owner-analytics' },
  kv: { values: ['42.53 → 7.11 MiB', '83.3% → 80.0%'], period: 'Report dated 31 Oct 2026', kind: 'experimental' },
  projectmatch: { values: ['28'], period: 'Repository revision · 24 Oct 2026 UTC', kind: 'repository-structure' },
  fairshift: { values: ['62 passed · 1 skipped'], period: 'Audit dated 27 Oct 2026', kind: 'repository-audit' }
};
const checks = [];
const errors = [];
(async () => {
  for (const [id, record] of Object.entries(expected)) {
    const project = projects.find(project => project.id === id);
    assert.deepEqual(Array.from(project.impact.metrics, metric => metric.value), record.values);
    assert.equal(project.impact.period, record.period);
    assert.equal(project.impact.kind, record.kind);
    assert.equal(project.metrics.length, record.values.length);
    assert(project.impact.limitation && project.impact.scope && project.impact.source.href);
    for (const [value, label] of project.metrics) {
      assert(record.values.includes(value));
      assert(label.includes(record.period.toUpperCase()));
    }
    // Legacy proof consumers must resolve current structured values.
    const value = project.impact.metrics[0].value;
    project.impact.metrics[0].value = 'TEST_VALUE';
    assert(project.proof.includes('TEST_VALUE'));
    project.impact.metrics[0].value = value;
  }
  assert.equal(projects.find(project => project.id === 'metro').impact, undefined);
  const research = projects.find(project => project.id === 'kv').impact;
  assert.match(research.scope, /60 synthetic held-out questions.*Qwen2\.5-1\.5B-Instruct.*1K\/2K.*B=260/);
  assert.match(research.limitation, /consistency criterion failed.*Peak-memory.*reliability/);
  checks.push('Structured figures, periods, evidence classes, scope and legacy consumers');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => route.request().url().startsWith(new URL(origin).origin) ? route.continue() : route.abort());
    await page.goto(new URL('#work', origin).href);
    await page.waitForSelector('.impact-snapshot');
    assert.equal(await page.locator('#work .impact-snapshot').count(), 5);
    assert.equal(await page.locator('[data-project="metro"] .impact-snapshot').count(), 0);
    assert.equal(await page.locator('.project-result').count(), 0, 'Old featured proof duplicates the snapshot');
    for (const [id, record] of Object.entries(expected)) {
      const snapshot = page.locator(`[data-project="${id}"] .impact-snapshot`);
      assert.equal(await snapshot.getAttribute('data-evidence-kind'), record.kind);
      const text = await snapshot.innerText();
      for (const value of record.values) assert(text.includes(value));
      assert(text.includes(record.period));
      const source = snapshot.locator('.impact-source');
      await source.focus();
      assert.equal(await source.evaluate(node => node === document.activeElement), true);
      const href = await source.getAttribute('href');
      if (href.startsWith('assets/')) assert.equal((await page.request.get(new URL(href, origin).href)).status(), 200);
    }
    checks.push('Five card snapshots and keyboard-accessible source links');
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const id of Object.keys(expected)) {
        const snapshot = page.locator(`[data-project="${id}"] .impact-snapshot`);
        await snapshot.scrollIntoViewIfNeeded();
        assert.equal(await snapshot.evaluate(node => node.scrollWidth > node.clientWidth), false, `${id} overflow at ${width}`);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `Page overflow ${width}`);
      await page.locator('[data-project="kv"] .impact-snapshot').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(output, `research-card-${width}.png`) });
      if (width <= 760) {
        await page.locator('#menuToggle').click();
        await page.locator('#mobileMenu [data-quick-view]').click();
      } else await page.locator('#quickViewTrigger').click();
      assert.equal(await page.locator('#quickView .impact-snapshot').count(), 3);
      const brief = page.locator('#quickView [data-evidence-kind="experimental"]');
      const text = await brief.innerText();
      for (const value of expected.kv.values) assert(text.includes(value));
      assert(text.includes(research.scope));
      assert(text.includes(research.limitation));
      assert.equal(await brief.evaluate(node => node.scrollWidth > node.clientWidth), false);
      await brief.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(output, `research-quick-${width}.png`) });
      const ownerBrief = page.locator('#quickView [data-evidence-kind="owner-analytics"]');
      assert.equal(await ownerBrief.locator('dd').count(), 1, 'Quick View repeats all product analytics');
      assert((await ownerBrief.innerText()).includes(expected.srmedu.period));
      for (const link of await page.locator('.quick-view-case').all()) {
        const href = await link.getAttribute('href');
        const response = await page.request.get(new URL(href, origin).href);
        assert.equal(response.status(), 200);
        assert((await response.text()).includes('id="cp-chapter-cp-results"'));
      }
      await page.keyboard.press('Escape');
    }
    checks.push('Cards and Quick View at five desktop/mobile widths with retained research trade-off');
    checks.push('All Quick View evidence anchors resolve to existing case-study sections');
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(output, 'test-report.json'), JSON.stringify({ origin, checks, errors, limitation: 'Mobile layout uses Chromium viewport emulation.' }, null, 2));
    console.log(checks.map(check => 'PASS ' + check).join('\n'));
    console.log(`${checks.length}/${checks.length} impact groups passed`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
