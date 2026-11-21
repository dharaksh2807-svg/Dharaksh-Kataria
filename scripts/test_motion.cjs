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
  async function pageFor(width = 1440, motion = "no-preference", instrumentation) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      hasTouch: true,
      reducedMotion: motion,
    });
    if (instrumentation) await page.addInitScript(instrumentation);
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
  async function openKioOptions(page) {
    const options = page.locator("#kioOptions");
    if (!(await options.isVisible())) await page.locator("#kioAbout").click();
    if (!(await options.evaluate(node => node.open))) await options.locator("summary").click();
  }
  async function jumpKio(page, id) {
    await openKioOptions(page);
    await page.locator("#kioJump").selectOption(id);
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
    await test("Homepage finish keeps feedback finite and responsive", async () => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.route("**/*", route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
      try {
        await page.goto(origin);
        await page.waitForFunction(() => !!window.portfolioMotion);
        for (const [width, height] of [[1440, 900], [768, 1024], [390, 844], [320, 568]]) {
          await page.setViewportSize({ width, height });
          await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
          const layout = await page.locator(".hero-action").evaluate(node => ({
            action: node.getBoundingClientRect().toJSON(),
            header: document.querySelector("header").getBoundingClientRect().toJSON(),
            styles: document.querySelector(".rift-mode-switcher").getBoundingClientRect().toJSON(),
            overflow: document.documentElement.scrollWidth > innerWidth,
          }));
          assert.equal(layout.overflow, false, `${width}px has no horizontal overflow`);
          assert.ok(layout.action.top >= layout.header.bottom && layout.action.right <= width);
          assert.ok(layout.action.bottom <= layout.styles.top && layout.styles.bottom <= height - 30,
            `${width}px CTA and style controls fit without overlap`);
          if (process.env.PORTFOLIO_SCREENSHOTS !== "0") await page.screenshot({
            path: path.join(output, `homepage-finish-${width}.png`),
          });
        }
        await page.setViewportSize({ width: 1440, height: 900 });
        const action = page.locator(".hero-action");
        await action.hover({ position: { x: 20, y: 20 } });
        assert.notEqual(await action.evaluate(node => node.style.getPropertyValue("--cta-x")), "");
        assert.equal(await action.evaluate(node => getComputedStyle(node).translate), "none",
          "Pointer response keeps the CTA hit area stationary");
        await action.focus();
        assert.equal(await action.evaluate(node => node.style.getPropertyValue("--cta-x")), "",
          "Keyboard focus resets the CTA pointer offset");
        await page.keyboard.press("Enter");
        assert.equal(await page.evaluate(() => document.activeElement.id), "workTitle");
        assert.equal(new URL(page.url()).hash, "#work");
        const arrival = await page.locator("#work").evaluate(node => ({
          rect: node.getBoundingClientRect().toJSON(),
          filter: node.querySelector(".filter-row").getBoundingClientRect().toJSON(),
          inert: node.inert, visibility: getComputedStyle(node).visibility,
          progress: window.__riftDirector?.getState().scroll, scroll: scrollY,
        }));
        assert.equal(arrival.inert, false, JSON.stringify(arrival));
        await page.locator('[data-filter="research"]').click();
        assert.equal(await page.locator(".project-card:visible").count(), 1);
        await page.evaluate(() => {
          for (let click = 0; click < 6; click++) document.querySelector('[data-filter="all"]').click();
        });
        assert.equal(await page.locator('[data-filter="all"] .interaction-pulse').count(), 1);
        await page.waitForFunction(() => !document.querySelector(".interaction-pulse"), null, { timeout: 2000 });
        assert.equal(await page.locator(".interaction-pulse").count(), 0, "Completed pulses are removed");
        const visual = page.locator(".project-visual").first();
        await visual.hover();
        await page.waitForTimeout(40);
        assert.notEqual(await visual.evaluate(node => node.style.getPropertyValue("--light-x")), "");
        await visual.focus();
        assert.equal(await visual.evaluate(node => node.style.getPropertyValue("--light-x")), "",
          "Keyboard focus clears the project pointer light");
        await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.project-preview-hint')).opacity) > .95);
        if (process.env.PORTFOLIO_SCREENSHOTS !== "0") await page.screenshot({
          path: path.join(output, "homepage-finish-work.png"),
        });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.locator('[data-filter="research"]').click();
        assert.equal(await page.locator(".interaction-pulse").count(), 0, "Reduced motion suppresses click pulses");
        assert.equal(await page.locator(".project-media").evaluateAll(nodes =>
          nodes.flatMap(node => node.getAnimations()).filter(animation => animation.playState === "running").length), 0,
          "Reduced motion suppresses project media animation");
        await page.locator('[data-filter="all"]').click();
        for (const width of [390, 320]) {
          await page.setViewportSize({ width, height: 844 });
          await page.evaluate(() => document.getElementById("work").scrollIntoView({ behavior: "instant" }));
          const media = await page.locator(".project-screenshot").first().evaluate(node => ({
            rect: node.getBoundingClientRect().toJSON(),
            naturalRatio: node.naturalWidth / node.naturalHeight,
            overflow: document.documentElement.scrollWidth > innerWidth,
          }));
          assert.equal(media.overflow, false, `${width}px work layout has no overflow`);
          assert.ok(media.rect.left >= 0 && media.rect.right <= width);
          assert.ok(Math.abs(media.rect.width / media.rect.height - media.naturalRatio) < .02,
            `${width}px project screenshot keeps its proportions`);
          if (process.env.PORTFOLIO_SCREENSHOTS !== "0") await page.screenshot({
            path: path.join(output, `homepage-finish-work-${width}.png`),
          });
        }
        assert.deepEqual(errors, []);
      } finally {
        await page.close();
      }
    });
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
          await jumpKio(page, "work");
          await page.waitForTimeout(100);
          assert.equal(
            await page.evaluate(() => portfolioGuide.state.step),
            "work",
          );
          assert.equal(await guide.evaluate(node=>node.parentElement===document.body),true);
          const guideBox=await page.locator("#kioPanel").boundingBox();
          assert.ok(guideBox.x>=0 && guideBox.y>=69 && guideBox.x+guideBox.width<=width && guideBox.y+guideBox.height<=1000);
          const compact=await guide.evaluate(node=>node.classList.contains("kio-compact"));
          assert.equal(compact,true);
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
          await openKioOptions(page);
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
    await test("Kio quick routes, expansion and saved continuation", async () => {
      for (const width of [390, 1440]) {
        const page = await pageFor(width, "reduce");
        try {
          if (width === 390) await page.setViewportSize({ width, height: 844 });
          if (process.env.PORTFOLIO_SCREENSHOTS !== "0") await page.screenshot({
            path: path.join(output, `kio-guide-dock-${width}.png`),
          });
          await page.locator("#v6GuideToggle").click();
          assert.equal(await page.locator(".kio-shortcuts").evaluate(node => {
            const routes = node.getBoundingClientRect();
            const body = node.parentElement.getBoundingClientRect();
            return routes.top >= body.top && routes.bottom <= body.bottom;
          }), true, "Quick routes fit on the opening screen");
          if (process.env.PORTFOLIO_SCREENSHOTS !== "0") await page.screenshot({
            path: path.join(output, `kio-guide-open-${width}.png`),
          });
          await page.locator('[data-kio-jump="work"]').click();
          assert.equal(await page.evaluate(() => portfolioGuide.state.step), "work");
          assert.equal(await page.locator("#kioExpand").isVisible(), true);
          assert.match(await page.locator("#kioProgressLabel").innerText(), /You’re here/);
          const position = await page.locator("#kioJump").evaluate(node => node.selectedIndex + 1);
          assert.equal(await page.locator("#kioProgress").evaluate(node => node.value), position);
          const guidanceBounds = await page.locator(".kio-copy").evaluate(node => ({
            copy: node.getBoundingClientRect().toJSON(),
            body: node.parentElement.getBoundingClientRect().toJSON(),
          }));
          assert.ok(guidanceBounds.copy.top >= guidanceBounds.body.top &&
            guidanceBounds.copy.bottom <= guidanceBounds.body.bottom,
            `${width}px compact guidance fits without clipping ${JSON.stringify(guidanceBounds)}`);
          if (process.env.PORTFOLIO_SCREENSHOTS !== "0") await page.screenshot({
            path: path.join(output, `kio-guide-compact-${width}.png`),
          });
          await page.locator("#kioExpand").click();
          assert.equal(await page.locator(".kio-shortcuts").isVisible(), true);
          assert.equal(await page.evaluate(() => document.activeElement.id), "kioClose");
          await page.locator("#kioLater").click();
          await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
          await page.reload();
          assert.equal(await page.locator("#kioPanel").isVisible(), false);
          await page.locator("#v6GuideToggle").click();
          assert.equal(await page.evaluate(() => portfolioGuide.state.step), "work");
          assert.match(await page.locator("#kioProgressLabel").innerText(), /where we left off/);
          assert.equal(await page.locator("#kioActionLabel").innerText(), "Explore the projects");
          await page.locator("#kioHide").click();
          assert.equal(await page.locator("#kioLaunch").isVisible(), false);
          await page.locator("#v6GuideToggle").click();
          assert.equal(await page.locator("#kioPanel").isVisible(), true);
          assert.deepEqual(page.errors, []);
        } finally {
          await page.close();
        }
      }
    });
    await test("Kio articulated greetings, interruption and rest", async () => {
      const page = await pageFor();
      // Install before gestures so their timers share the controlled clock.
      await page.clock.install();
      try {
        const guide = page.locator("#kioGuide");
        const launcher = page.locator("#kioLaunch");
        await launcher.hover();
        await page.waitForTimeout(180);
        assert.equal(await guide.getAttribute("data-state"), "wave");
        assert.notEqual(await page.locator(".kio-arm-right").evaluate(node => getComputedStyle(node).transform), "none", "Hover must start an articulated wave");
        await launcher.dispatchEvent("pointerleave");
        await launcher.dispatchEvent("pointerenter", { pointerType: "mouse" });
        assert.equal(await guide.getAttribute("data-state"), "curious", "Repeat hover gives a calm acknowledgement");
        await launcher.click();
        await page.waitForTimeout(450);
        assert.equal(await guide.getAttribute("data-state"), "wave");
        for (let count = 0; count < 4; count++) await page.locator("#kioGreet").click();
        assert.equal(await guide.getAttribute("data-state"), "happy");
        await page.waitForTimeout(250);
        const articulation = await page.locator(".kio-person").evaluate(svg => {
          const arm = svg.querySelector(".kio-arm-right");
          const forearm = svg.querySelector(".kio-forearm-right");
          const hand = svg.querySelector(".kio-hand");
          const point = (node, x, y) => new DOMPoint(x, y).matrixTransform(node.getScreenCTM());
          const separation = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
          const box = svg.getBoundingClientRect();
          return { elbow: separation(point(arm, 173, 184), point(forearm, 173, 184)),
            wrist: separation(point(forearm, 194, 192), point(hand, 194, 192)),
            ratio: box.width / box.height,
            smile: Number(getComputedStyle(svg.querySelector(".kio-mouth-happy")).opacity),
            neutral: Number(getComputedStyle(svg.querySelector(".kio-mouth-neutral")).opacity) };
        });
        assert.ok(articulation.elbow < .1 && articulation.wrist < .1);
        assert.ok(Math.abs(articulation.ratio - 240 / 284) < .002);
        assert.ok(articulation.smile > .95 && articulation.neutral < .05);
        await page.mouse.move(1, 1);
        await page.waitForTimeout(30);
        const eyeLeft = await guide.evaluate(node => parseFloat(getComputedStyle(node).getPropertyValue("--kio-eye-x")));
        await page.mouse.move(1439, 999);
        await page.waitForTimeout(30);
        const eyes = await guide.evaluate(node => ({
          x: parseFloat(getComputedStyle(node).getPropertyValue("--kio-eye-x")),
          y: parseFloat(getComputedStyle(node).getPropertyValue("--kio-eye-y")) }));
        assert.ok(eyeLeft < 0 && eyes.x > 0 && Math.abs(eyes.x) <= 2.8 && Math.abs(eyes.y) <= 1.6);
        await page.waitForTimeout(1050);
        assert.equal(await guide.getAttribute("data-state"), "explaining");
        assert.equal(await page.locator(".kio-person").count(), 1);
        assert.equal(await launcher.evaluate(node => node.parentElement.id), "kioCharacterSlot");
        await jumpKio(page, "work");
        assert.equal(await guide.getAttribute("data-state"), "thinking");
        await page.waitForTimeout(750);
        assert.equal(await guide.getAttribute("data-state"), "pointing");
        await page.keyboard.press("Escape");
        await page.mouse.move(100, 100);
        await page.locator("#v6GuideToggle").focus();
        await page.waitForTimeout(450);
        await page.clock.fastForward(29000);
        assert.equal(await guide.getAttribute("data-state"), "sleeping");
        await page.locator("#v6GuideToggle").click();
        await page.locator("#searchTrigger").click();
        assert.equal(await guide.evaluate(node => node.inert), true);
        assert.equal(await guide.evaluate(node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === "running").length), 0);
        await page.keyboard.press("Escape");
        assert.equal(await guide.evaluate(node => node.inert), false);
        assert.equal(await page.locator("#kioPanel").isVisible(), true);
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.locator("#kioGreet").click();
        assert.equal(await guide.evaluate(node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === "running").length), 0);
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await page.waitForFunction(() => !matchMedia("(prefers-reduced-motion: reduce)").matches &&
          !document.documentElement.classList.contains("motion-off") &&
          !document.querySelector("#kioGuide").classList.contains("kio-reduced"));
        await openKioOptions(page);
        await page.locator("#kioHide").click();
        await page.locator("#v6GuideToggle").click();
        await page.locator("#kioGreet").click();
        await page.waitForTimeout(180);
        assert.notEqual(await page.locator(".kio-arm-right").evaluate(node => getComputedStyle(node).transform), "none", "Greetings must resume after motion and hide preferences change");
        assert.deepEqual(page.errors, []);
      } finally {
        await page.close();
      }
    });
    await test("Kio interruption recovery and mobile navigation priority", async () => {
      const page = await pageFor(390);
      try {
        const guide = page.locator("#kioGuide");
        await page.locator("#v6GuideToggle").click();
        await page.waitForTimeout(450);
        // Interrupt within one task so a slow browser cannot finish the gesture first.
        const recovery = await guide.evaluate(node => {
          node.querySelector("#kioGreet").click();
          node.querySelector("#kioClose").click();
          return {
            running: node.querySelector(".kio-arm-right").getAnimations()
              .some(animation => animation.playState === "running"),
            paused: node.classList.contains("kio-paused"),
          };
        });
        assert.equal(recovery.running, !recovery.paused, "Kio settles its gesture when the dock has room and pauses when it yields to content");
        await page.waitForTimeout(450);
        assert.equal(await page.locator(".kio-arm-right").evaluate(node => getComputedStyle(node).transform), "none");
        await page.locator("#v6GuideToggle").click();
        await page.locator("#menuToggle").click();
        assert.equal(await guide.evaluate(node => node.inert), true);
        assert.equal(await guide.isVisible(), false);
        await page.keyboard.press("Escape");
        assert.equal(await guide.evaluate(node => node.inert), false);
        assert.equal(await page.locator("#kioPanel").isVisible(), true);
        assert.deepEqual(page.errors, []);
      } finally {
        await page.close();
      }
    });
    await test("Kio routes, paused guidance and constrained viewports", async () => {
      const page = await pageFor(1440, "reduce");
      try {
        await page.locator("#v6GuideToggle").click();
        const stops = await page.locator("#kioJump option").evaluateAll(nodes => nodes.map(node => node.value));
        for (const id of stops) {
          await jumpKio(page, id);
          await page.waitForTimeout(50);
          assert.equal(await page.evaluate(() => portfolioGuide.state.step), id);
          const target = page.locator(".kio-target");
          assert.equal(await target.count(), 1);
          assert.equal(await target.isVisible(), true, id + " must highlight a visible feature");
          assert.equal(await target.evaluate((node, id) => document.getElementById(id).contains(node), id), true);
          if (id === "top") {
            assert.match(await page.locator("#kioMessage").innerText(), /hidden while motion is paused/);
            assert.equal(await target.getAttribute("href"), "#work");
          }
        }
        await page.keyboard.press("Escape");
        await page.locator("#v6GuideToggle").click();
        assert.equal(await page.evaluate(() => portfolioGuide.state.step), "contact");
        await page.locator("#kioNext").click();
        assert.equal(await page.locator("#kioGuide").getAttribute("data-view"), "complete");
        assert.equal(await page.locator("#kioGo").getAttribute("href"), "#work");
        assert.equal(await page.evaluate(() => portfolioGuide.state.completed), true);
        assert.equal(await page.evaluate(() => document.activeElement.id), "kioGo");
        await page.locator("#kioGo").click();
        await openKioOptions(page);
        await page.locator("#kioPrev").click();
        assert.equal(await page.evaluate(() => portfolioGuide.state.step), "top");
        await openKioOptions(page);
        await page.locator("#kioReset").click();
        assert.equal(await page.evaluate(() => portfolioGuide.state.completed), false);
        await page.keyboard.press("Escape");
        for (const [width, height] of [[1440, 900], [1024, 600], [390, 844], [320, 568], [844, 390], [568, 320]]) {
          await page.setViewportSize({ width, height });
          await page.locator("#v6GuideToggle").click();
          await page.locator("#kioAbout").click();
          const geometry = await page.locator("#kioPanel").evaluate(node => {
            const box = element => element.getBoundingClientRect().toJSON();
            return { panel: box(node), body: box(node.querySelector(".kio-panel-scroll")),
              title: box(node.querySelector("#kioPanelTitle")), avatar: box(node.querySelector("svg")),
              close: box(node.querySelector("#kioClose")), action: box(node.querySelector("#kioGo")),
              header: box(document.querySelector("header")) };
          });
          assert.ok(geometry.panel.top >= geometry.header.bottom, `${width}×${height} clears the header`);
          assert.ok(geometry.panel.left >= 0 && geometry.panel.right <= width && geometry.panel.bottom <= height);
          assert.ok(geometry.title.top >= geometry.body.top && geometry.title.bottom <= geometry.body.bottom,
            `${width}×${height} shows the response heading`);
          assert.ok(geometry.avatar.top >= geometry.body.top && geometry.avatar.bottom <= geometry.body.bottom,
            `${width}×${height} contains the character`);
          assert.ok(geometry.action.bottom <= height && geometry.close.top >= 0);
          await page.locator("#kioGo").click();
          if (width <= 760) assert.equal(await page.evaluate(() => document.activeElement.id), "kioNext");
          await page.keyboard.press("Escape");
        }
        assert.deepEqual(page.errors, []);
      } finally {
        await page.close();
      }
    });
    await test("Kio keeps one component lifecycle and no idle JavaScript animation", async () => {
      const page = await pageFor(1440, "no-preference", () => {
        window.__kioMetrics = { listeners: 0, observers: 0, frames: 0 };
        const fromGuide = () => /\/guide\.js/.test(new Error().stack);
        const addListener = EventTarget.prototype.addEventListener;
        EventTarget.prototype.addEventListener = function (...args) {
          if (fromGuide()) window.__kioMetrics.listeners++;
          return addListener.apply(this, args);
        };
        for (const name of ["IntersectionObserver", "MutationObserver"]) {
          window[name] = new Proxy(window[name], { construct(Target, args, NewTarget) {
            if (fromGuide()) window.__kioMetrics.observers++;
            return Reflect.construct(Target, args, NewTarget);
          } });
        }
        const frame = window.requestAnimationFrame;
        window.requestAnimationFrame = callback => {
          if (fromGuide()) window.__kioMetrics.frames++;
          return frame(callback);
        };
      });
      try {
        await page.waitForTimeout(700);
        const initial = await page.evaluate(() => ({ ...window.__kioMetrics }));
        for (let count = 0; count < 12; count++) await page.locator("#v6GuideToggle").click();
        await page.waitForTimeout(500);
        const final = await page.evaluate(() => ({ ...window.__kioMetrics }));
        assert.equal(final.listeners, initial.listeners);
        assert.equal(final.observers, 2);
        assert.equal(final.observers, initial.observers);
        assert.equal(await page.locator("#kioGuide").count(), 1);
        assert.equal(await page.locator(".kio-person").count(), 1);
        await page.waitForTimeout(250);
        assert.equal(await page.evaluate(() => window.__kioMetrics.frames), final.frames);
        await page.locator("#v6GuideToggle").click();
        await page.locator("#kioGreet").click();
        await page.evaluate(() => {
          Object.defineProperty(document, "hidden", { configurable: true, value: true });
          document.dispatchEvent(new Event("visibilitychange"));
        });
        assert.equal(await page.locator("#kioGuide").evaluate(node =>
          node.getAnimations({ subtree: true }).filter(animation => animation.playState === "running").length), 0);
        await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event("visibilitychange")); });
        await openKioOptions(page);
        await page.locator("#kioHide").click();
        await page.waitForTimeout(100);
        const hiddenFrames = await page.evaluate(() => window.__kioMetrics.frames);
        await page.mouse.move(200, 400);
        await page.mouse.wheel(0, 240);
        await page.waitForTimeout(150);
        assert.equal(await page.evaluate(() => window.__kioMetrics.frames), hiddenFrames);
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
        await jumpKio(page, "universe");
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
        await jumpKio(page, "work");
        await page.evaluate(() => window.dispatchEvent(new Event("wheel")));
        assert.equal(
          await page.evaluate(() => portfolioGuide.state.tourActive),
          false,
        );
        assert.equal(await page.locator(".kio-target").count(), 0);
        await page.locator('[data-project="kv"] .project-case-open').focus();
        assert.match(
          await page.locator("#kioPanelTitle").innerText(),
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
