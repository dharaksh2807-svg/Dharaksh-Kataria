const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const site = path.resolve(__dirname, "../site"),
  output = path.resolve(__dirname, "../test-results/motion");
fs.mkdirSync(output, { recursive: true });
const results = [],
  transitionCancellations = [],
  transitionObservations = [];
const server = http.createServer((req, res) => {
  const relative = new URL(req.url, "http://localhost").pathname;
  const file = path.resolve(
    site,
    "." + (relative === "/" ? "/index.html" : relative),
  );
  if (!file.startsWith(site + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(404).end();
      return;
    }
    res.setHeader(
      "Content-Type",
      {
        ".js": "application/javascript",
        ".html": "text/html",
        ".css": "text/css",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
      }[path.extname(file)] || "application/octet-stream",
    );
    res.end(data);
  });
});
(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  });
  async function pageFor(width = 1440, motion = "no-preference") {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      hasTouch: true,
      reducedMotion: motion,
    });
    page.errors = [];
    page.on("pageerror", (error) => page.errors.push(error.message));
    await page.route("**/*", (route) =>
      route.request().url().startsWith(origin)
        ? route.continue()
        : route.abort(),
    );
    await page.goto(origin);
    await page.waitForFunction(() => !!window.portfolioMotion);
    return page;
  }
  async function test(name, run) {
    if (process.env.PORTFOLIO_TEST_FILTER && !new RegExp(process.env.PORTFOLIO_TEST_FILTER).test(name)) return;
    try {
      await run();
      results.push({ name, status: "passed" });
      console.log("PASS", name);
    } catch (error) {
      results.push({ name, status: "failed", error: error.message });
      console.error("FAIL", name, error.message);
    }
  }
  try {
    await test("horizontal, zoom and blur entrances reverse when scrolled away", async () => {
      const page = await pageFor();
      try {
        const target = page.locator(".section-heading").first();
        await target.scrollIntoViewIfNeeded();
        await page.waitForTimeout(650);
        assert.ok(
          await target.evaluate((node) =>
            node.classList.contains("motion-visible"),
          ),
        );
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
        await page.waitForTimeout(100);
        assert.equal(
          await target.evaluate((node) =>
            node.classList.contains("motion-visible"),
          ),
          false,
        );
        await target.scrollIntoViewIfNeeded();
        await page.waitForTimeout(650);
        assert.equal(
          await target.evaluate((node) => getComputedStyle(node).opacity),
          "1",
        );
        assert.equal(await page.locator("#introCurtain").isVisible(), false);
        assert.deepEqual(page.errors, []);
      } finally {
        await page.close();
      }
    });
    await test("project navigation uses shared names and restores keyboard focus on Back", async () => {
      const page = await pageFor();
      try {
        await page.addInitScript(() => {
          window.nativeTransition = "not-observed";
          window.addEventListener("pagereveal", (event) => {
            if (!event.viewTransition) {
              window.nativeTransition = "not-available";
              return;
            }
            window.nativeTransition = "pending";
            event.viewTransition.ready.then(
              () => { window.nativeTransition = "ready"; },
              () => { window.nativeTransition = "skipped"; },
            );
          });
        });
        const card = page.locator('[data-project="srmedu"]');
        await card.scrollIntoViewIfNeeded();
        const name = await card.locator(".project-visual").evaluate(
          (node) => getComputedStyle(node).viewTransitionName
        );
        assert.equal(name, "project-srmedu");
        await card.locator(".project-case-open").click();
        await page.waitForURL("**/projects/srmedu.html");

        // Navigation and the matching names are required on every browser,
        // regardless of whether it exposes or plays a native transition.
        assert.equal(
          await page.locator("#cpHeroArt").evaluate(
            (node) => getComputedStyle(node).viewTransitionName
          ), name
        );
        assert.equal(
          await page.locator(".cp-hero h1").evaluate(
            (node) => getComputedStyle(node).viewTransitionName
          ), "project-title-srmedu"
        );

        // Native cross-document transitions are progressive enhancement.
        // Report an observed/aborted/absent transition honestly instead of
        // treating an unsupported/headless animation as a navigation failure.
        await page.waitForFunction(
          () => ["ready", "skipped", "not-available"].includes(window.nativeTransition),
          null, {timeout: 1500}
        ).catch(() => {});
        const observed = await page.evaluate(
          () => window.nativeTransition || "not-observed"
        );
        transitionObservations.push({
          test: "card to SRMedu case study",
          result: observed,
          status: observed === "ready" ? "NATIVE_CONFIRMED" : "NATIVE_UNVERIFIED",
        });

        await page.goBack();
        await page.waitForFunction(
          () => document.activeElement?.classList.contains("project-case-open"),
          null, {timeout: 5000}
        );
        assert.equal(await page.locator(".v8-leaving").count(), 0);
        const skipped =
          "Transition was aborted because of invalid state. ViewTransition opt-in disabled";
        transitionCancellations.push(
          ...page.errors.filter((message) => message === skipped)
        );
        assert.deepEqual(
          page.errors.filter((message) => message !== skipped),
          []
        );
      } finally {
        await page.close();
      }
    });
    await test("project media links restore keyboard focus on Back", async () => {
      const page=await pageFor();
      try {
        await page.locator('.hero-action').click();
        const visual=page.locator('[data-project="srmedu"] .project-visual');
        await visual.focus();
        await page.keyboard.press('Enter');
        await page.waitForURL('**/projects/srmedu.html');
        await page.goBack();
        await page.waitForFunction(()=>document.activeElement?.classList.contains('project-visual'));
        assert.equal(await visual.evaluate(node=>node===document.activeElement),true);
        const skipped='Transition was aborted because of invalid state. ViewTransition opt-in disabled';
        transitionCancellations.push(...page.errors.filter(message=>message===skipped));
        assert.deepEqual(page.errors.filter(message=>message!==skipped),[]);
      } finally {await page.close();}
    });
    await test("motion preference persists through case navigation and reload", async () => {
      const page = await pageFor();
      try {
        await page.locator("#motionSwitch").click();
        assert.equal(await page.evaluate(() => portfolioMotion.disabled), true);
        await page.goto(origin + "/projects/kv.html");
        assert.equal(await page.evaluate(() => portfolioMotion.disabled), true);
        assert.equal(await page.locator("#cpPauseArt").isDisabled(), true);
        await page.reload();
        assert.equal(await page.evaluate(() => portfolioMotion.disabled), true);
      } finally {
        await page.close();
      }
    });
    await test("reduced motion shows content and disables scene choreography", async () => {
      const page = await pageFor(390, "reduce");
      try {
        await page.goto(origin + "/#universe");
        assert.equal(await page.evaluate(() => portfolioMotion.disabled), true);
        assert.equal(await page.locator("#worldTour").isDisabled(), true);
        assert.equal(await page.locator("#introCurtain").isVisible(), false);
        await page.goto(origin + "/projects/metro.html");
        assert.equal(await page.locator("#cpPauseArt").isDisabled(), true);
        assert.equal(
          await page.locator('a[href*="dharaksh2807-svg/ss"]').count(),
          0,
        );
        assert.deepEqual(page.errors, []);
      } finally {
        await page.close();
      }
    });
    await test("Legacy project artwork still draws SVG paths with scroll progress", async () => {
      const page = await pageFor();
      try {
        // Project records predating screenshot metadata retain the system artwork.
        await page.route("**/projects.js", async route => {
          const response = await route.fetch();
          const body = (await response.text()).replace(/preview: \{[^}]+\}, /g, "");
          await route.fulfill({ response, body });
        });
        await page.reload();
        const svg = page.locator(".match-edges path");
        await svg.scrollIntoViewIfNeeded();
        await page.waitForTimeout(250);
        const drawn = Number(
          await svg.evaluate((node) =>
            node.style.getPropertyValue("--path-progress"),
          ),
        );
        assert.ok(drawn > 0);
        await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
        await page.waitForTimeout(100);
        assert.equal(
          Number(
            await svg.evaluate((node) =>
              node.style.getPropertyValue("--path-progress"),
            ),
          ),
          0,
        );
      } finally {
        await page.close();
      }
    });
    for (const width of [390, 1440])
      await test(`Kio pop-out, focus and persistence ${width}`, async () => {
        const page = await pageFor(width, "reduce");
        try {
          const toggle = page.locator("#v6GuideToggle");
          await toggle.click();
          assert.equal(await page.locator("#kioPanel").isVisible(), true);
          const guide = page.locator("#kioGuide");
          assert.equal(
            await guide.evaluate((node) => getComputedStyle(node).position),
            "fixed",
          );
          await page.locator('[data-kio-jump="work"]').click();
          await page.waitForTimeout(100);
          assert.equal(
            await page.evaluate(() => portfolioGuide.state.step),
            "work",
          );
          assert.equal(await guide.evaluate(node=>node.parentElement===document.body),true);
          const guideBox=await page.locator("#kioPanel").boundingBox();
          assert.ok(guideBox.x>=0 && guideBox.y>=69 && guideBox.x+guideBox.width<=width && guideBox.y+guideBox.height<=1000);
          const initiallyCompact=await guide.evaluate(node=>node.classList.contains("kio-compact"));
          await page.locator("#kioSize").click();
          const compact=await guide.evaluate(node=>node.classList.contains("kio-compact"));
          assert.equal(compact,!initiallyCompact);
          if (process.env.PORTFOLIO_SCREENSHOTS !== "0") await guide.screenshot({
            path: path.join(output, `kio-${width}.png`),
          });
          await page.keyboard.press("Escape");
          assert.equal(await page.locator("#kioPanel").isVisible(), false);
          assert.ok(
            await toggle.evaluate((node) => node === document.activeElement),
          );
          assert.equal(
            await page.evaluate(() => JSON.parse(localStorage.getItem('dk-kio-preferences-v6')).minimized),
            true,
          );
          await page.reload();
          assert.equal(await page.locator('#kioPanel').isVisible(), false);
          await toggle.click();
          await page.locator("#kioHide").click();
          await page.reload();
          assert.equal(
            await page.evaluate(() => portfolioGuide.state.hidden),
            true,
          );
          assert.equal(await guide.evaluate(node=>node.classList.contains("kio-compact")),compact);
          assert.deepEqual(page.errors, []);
        } finally {
          await page.close();
        }
      });
    await test("touch guide navigation and section deep links", async () => {
      const page = await pageFor(390, "reduce");
      try {
        await page.goto(origin + "/#recognition");
        await page.locator("#v6GuideToggle").tap();
        await page.waitForTimeout(100);
        assert.equal(
          await page.evaluate(() => portfolioGuide.state.step),
          "recognition",
        );
        await page.locator('[data-kio-jump="universe"]').tap();
        assert.equal(
          await page.evaluate(() => portfolioGuide.state.step),
          "universe",
        );
        await page.locator("#kioClose").tap();
        await page.locator("#worldCanvasWrap").focus();
        await page.keyboard.press("4");
        assert.equal(
          await page.evaluate(() => portfolioWorld.state.selected),
          3,
        );
        assert.deepEqual(page.errors, []);
      } finally {
        await page.close();
      }
    });
    await test("tour interruption clears target feedback and contextual gestures explain the project", async () => {
      const page = await pageFor(1440, "reduce");
      try {
        await page.locator("#v6GuideToggle").click();
        await page.locator('[data-kio-jump="work"]').click();
        await page.evaluate(() => window.dispatchEvent(new Event("wheel")));
        assert.equal(
          await page.evaluate(() => portfolioGuide.state.tourActive),
          false,
        );
        assert.equal(await page.locator(".kio-target").count(), 0);
        await page.locator('[data-project="kv"] .project-case-open').focus();
        assert.match(
          await page.locator("#kioMessage").innerText(),
          /Less memory/,
        );
        assert.equal(
          await page.evaluate(() =>
            Math.max(0, document.documentElement.scrollWidth - innerWidth),
          ),
          0,
        );
        assert.deepEqual(page.errors, []);
      } finally {
        await page.close();
      }
    });
    await test("all twelve project routes retain content and valid shared element names", async () => {
      const page = await pageFor(390, "reduce");
      try {
        for (const file of fs
          .readdirSync(path.join(site, "projects"))
          .filter((file) => file.endsWith(".html"))) {
          const response = await page.goto(origin + "/projects/" + file);
          assert.equal(response.status(), 200);
          assert.equal(await page.locator("h1").count(), 1);
          assert.equal(await page.locator(".cp-results").count(), 1);
          assert.equal(
            await page.evaluate(() =>
              Math.max(0, document.documentElement.scrollWidth - innerWidth),
            ),
            0,
          );
        }
        assert.deepEqual(page.errors, []);
      } finally {
        await page.close();
      }
    });
  } finally {
    const report = {
      browser: browser.version(),
      total: results.length,
      passed: results.filter((result) => result.status === "passed").length,
      failed: results.filter((result) => result.status === "failed").length,
      results,
      transitionCancellations,
      transitionObservations,
    };
    fs.writeFileSync(
      path.join(output, "results.json"),
      JSON.stringify(report, null, 2),
    );
    console.log(`${report.passed}/${report.total} passed`);
    await browser.close();
    server.close();
    if (report.failed) process.exitCode = 1;
  }
})().catch((error) => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});
