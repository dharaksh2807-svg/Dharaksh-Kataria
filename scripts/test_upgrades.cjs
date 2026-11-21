/* Scoped smoke/regression checks for progressive portfolio upgrades.
   Run via npm run test:upgrades; no network calls outside localhost. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const root = path.resolve(__dirname, "../site");
const failures = [];
const tests = [];
const mime = {".html":"text/html",".js":"application/javascript",".css":"text/css",".svg":"image/svg+xml",".png":"image/png",".webp":"image/webp",".mp4":"video/mp4"};
const server = http.createServer((request,response)=>{
  const target = path.resolve(root,"."+new URL(request.url,"http://localhost").pathname.replace(/\/$/,"/index.html"));
  if(!target.startsWith(root+path.sep)){response.writeHead(403).end();return}
  fs.readFile(target,(error,data)=>{
    if(error){response.writeHead(404).end();return}
    response.writeHead(200,{"Content-Type":mime[path.extname(target)]||"application/octet-stream"});response.end(data);
  });
});
(async()=>{
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const origin="http://127.0.0.1:"+server.address().port;
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined});
const slugs=["srmedu","projectmatch","kv","metro","oodp","fairshift","regula","alarm","toll","revalue","postpro","micchami"];
async function pageFor(width=1440, motion="reduce") {
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:motion});
  page.errors=[];
  page.on("pageerror",e=>page.errors.push(e.message));
  await page.route("**/*",route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  return page;
}
async function test(name,fn){
    if (process.env.PORTFOLIO_TEST_FILTER && !new RegExp(process.env.PORTFOLIO_TEST_FILTER).test(name)) return;
 try {await fn();tests.push({name,result:"PASS"});console.log("PASS",name)}
 catch(err){tests.push({name,result:"FAIL",error:err.message});failures.push(name+": "+err.message);console.error("FAIL",name,err.message)}
}
try {
  await test("Homepage displays full name and visible companion",async()=>{
    const page=await pageFor(1440);
    try{
      await page.goto(origin+"/");
      assert.match(await page.locator("#heroTitle").innerText(),/Dharaksh\s+Kataria\./);
      assert.equal(await page.locator("#kioLaunch").isVisible(),true);
      const layout=await page.locator("#kioGuide").evaluate(node=>({
        position:getComputedStyle(node).position,
        display:getComputedStyle(node).display
      }));
      assert.equal(layout.position,"fixed");
      assert.notEqual(layout.display,"none");
      assert.deepEqual(page.errors,[]);
    }finally{await page.close()}
  });
  await test("Kio blinks when enabled and respects reduced motion",async()=>{
    const normal=await pageFor(1440,"no-preference");
    try {
      await normal.goto(origin+"/");
      await normal.waitForSelector("#kioGuide");
      const live=await normal.locator("#kioGuide .kio-eyes").evaluate(
        node=>getComputedStyle(node).animationName
      );
      assert.match(live,/kio-blink/);
      assert.equal(await normal.locator("#kioLaunch").isVisible(),true);
    }finally{await normal.close()}
    const reduced=await pageFor(1440,"reduce");
    try{
      await reduced.goto(origin+"/");
      await reduced.waitForSelector("#kioGuide");
      const dormant=await reduced.locator("#kioGuide .kio-eyes").evaluate(
        node=>getComputedStyle(node).animationName
      );
      assert.equal(dormant,"none");
    }finally{await reduced.close()}
  });
  await test("World cards open their stories and keep focus controls independent",async()=>{
    const page=await pageFor(390);
    try{
      await page.goto(origin+"/");
      assert.equal(await page.locator("#worldProjects a").count(),4);
      await page.locator('[data-world-sector="1"]').click();
      assert.equal(await page.evaluate(()=>portfolioWorld.state.selected),1);
      await page.locator('#worldProjects .world-sector-story[href="projects/projectmatch.html"]').click();
      await page.waitForURL("**/projects/projectmatch.html");
      assert.equal(await page.locator(".cp-chapters-back").count(),1);
      assert.equal(await page.locator(".cp-chapters-back").getAttribute("href"),"../index.html#universe");
      assert.deepEqual(page.errors,[]);
    }finally{await page.close()}
  });
  for(const slug of slugs) {
    await test("Case chapters "+slug,async()=>{
      const page=await pageFor(390);
      try{
        await page.goto(origin+"/projects/"+slug+".html");
        await page.locator(".cp-chapters-link").first().waitFor();
        assert.equal(await page.locator(".cp-chapters-link").count(),7);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
        assert.deepEqual(page.errors,[]);
      }finally{await page.close()}
    });
  }
  for(const slug of ["srmedu","projectmatch"]){
    await test("Interactive architecture "+slug,async()=>{
      const page=await pageFor();
      try{
        await page.goto(origin+"/projects/"+slug+".html");
        const buttons=page.locator(".cp-explorer-node");
        assert.ok((await buttons.count())>=6);
        await buttons.nth(1).click();
        assert.equal(await buttons.nth(1).getAttribute("aria-pressed"),"true");
        assert.ok((await page.locator(".cp-explorer-inspector h4").textContent()).length>5);
        assert.deepEqual(page.errors,[]);
      }finally{await page.close()}
    });
  }
  await test("KV corrected benchmark selector",async()=>{
    const page=await pageFor(390);
    try{
      await page.goto(origin+"/projects/kv.html");
      assert.match(await page.locator(".cp-benchmark").innerText(),/42\.53 MiB/);
      await page.getByRole("button",{name:"Recall (%)"}).click();
      assert.match(await page.locator(".cp-benchmark").innerText(),/80\.0 %/);
      assert.match(await page.locator(".cp-benchmark").innerText(),/3\.3 percentage-point/);
      assert.deepEqual(page.errors,[]);
    }finally{await page.close()}
  });
  await test("World camera restore API",async()=>{
    const page=await pageFor();
    try {
      await page.goto(origin);
      await page.waitForFunction(()=>!!window.portfolioWorld?.restore);
      const answer=await page.evaluate(()=>{
        portfolioWorld.focus(2);
        const s=portfolioWorld.state;
        const sample={selected:2,objects:s.objects,camera:{target:[-4.092,1.1,3.906],yaw:.92,pitch:.65,radius:22}};
        const ok=portfolioWorld.restore(sample);
        const next=portfolioWorld.state;
        return {ok,selected:next.selected,radius:next.camera.radius,invalid:portfolioWorld.restore({selected:99})};
      });
      assert.equal(answer.ok,true); assert.equal(answer.selected,2);
      assert.equal(answer.radius,22); assert.equal(answer.invalid,false);
      assert.deepEqual(page.errors,[]);
    }finally{await page.close()}
  });
  await test("Rift covered renderer sleeps and resumes on reverse",async()=>{
    const page=await pageFor(1440,"no-preference");
    try{
      await page.goto(origin);
      await page.waitForFunction(()=>window.__riftDirector?.getState().webglReady);
      await page.evaluate(()=>scrollTo({top:document.querySelector('.intro').offsetHeight-innerHeight,behavior:'instant'}));
      await page.waitForFunction(()=>window.__riftDirector.getState().scroll>=.99);
      await page.waitForTimeout(100);
      const frames=await page.evaluate(()=>__riftDirector.getState().renderedFrames);
      await page.waitForTimeout(200);
      assert.ok((await page.evaluate(()=>__riftDirector.getState().renderedFrames))<=frames+1);
      await page.evaluate(()=>scrollTo({top:(document.querySelector('.intro').offsetHeight-innerHeight)*.75,behavior:'instant'}));
      await page.waitForFunction(before=>__riftDirector.getState().renderedFrames>before,frames);
      assert.deepEqual(page.errors,[]);
    }finally{await page.close()}
  });
  await test("Journey shared state and static portrait controls",async()=>{
    const page=await pageFor(1440,"no-preference");
    try{
      await page.goto(origin);
      await page.waitForFunction(()=>document.querySelector('#journeySticky').dataset.chapter!==undefined);
      for(const progress of [.1,.32,.34,.5,.65,.68,.9,.34,.32]){
        const expected=Math.min(2,Math.floor(progress*3));
        await page.evaluate(p=>{
          const story=document.getElementById('journeyScroll');
          scrollTo({top:scrollY+story.getBoundingClientRect().top+(story.offsetHeight-innerHeight)*p,behavior:'instant'});
        },progress);
        await page.waitForFunction(chapter=>document.querySelector('#journeySticky').dataset.chapter===String(chapter),expected);
        assert.equal(await page.locator('.journey-panel.is-current').count(),1);
        assert.equal(await page.locator('.journey-panel:not(.is-current)').evaluateAll(nodes=>nodes.every(node=>node.inert&&getComputedStyle(node).display==='none')),true);
      }
      await page.setViewportSize({width:390,height:844});
      await page.locator('#motionSwitch').click();
      await page.locator('[data-journey-jump="1"]').press('Enter');
      await page.waitForFunction(()=>document.querySelector('#journeySticky').dataset.chapter==='1');
      const layout=await page.evaluate(()=>{
        const art=document.querySelector('.journey-art').getBoundingClientRect();
        const text=document.querySelector('.journey-panel.is-current').getBoundingClientRect();
        return {separated:art.bottom<=text.top,overflow:document.documentElement.scrollWidth>innerWidth,position:getComputedStyle(document.querySelector('#journeySticky')).position};
      });
      assert.deepEqual(layout,{separated:true,overflow:false,position:'relative'});
      assert.deepEqual(page.errors,[]);
    }finally{await page.close()}
  });
  await test("Rendering disclosures, guided access and keyboard models",async()=>{
    const page=await pageFor(390);
    try{
      await page.goto(origin+'/#motion-lab');
      await page.waitForFunction(()=>document.querySelector('#motion-lab details').open);
      await page.locator('.signal-tab[data-scene="memory"]').click();
      assert.equal(await page.locator('#signalTitle').textContent(),'Selective memory.');
      await page.locator('#v6GuideToggle').click();
      await page.locator('[data-kio-jump="dimensions"]').click();
      assert.equal(await page.locator('#dimensions details').evaluate(node=>node.open),true);
      await page.keyboard.press('Escape');
      await page.locator('#dimensionFlip').click();
      assert.equal(await page.locator('#dimensionFlip').getAttribute('aria-pressed'),'true');
      await page.locator('#proofTabStudy').focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('#proofTabMatch').getAttribute('aria-selected'),'true');
      const score=await page.locator('#proofMatchScore').textContent();
      await page.locator('#proofMatch input[type="range"]').first().focus();
      await page.keyboard.press('End');
      assert.notEqual(await page.locator('#proofMatchScore').textContent(),score);
      await page.locator('#proofTabMatch').focus();
      await page.keyboard.press('End');
      await page.locator('[data-budget="1028"]').click();
      assert.equal(await page.locator('#proofKvValue').textContent(),'28.11');
      assert.deepEqual(page.errors,[]);
    }finally{await page.close()}
  });
  await test("Missing-route 404 content",async()=>{
    const page=await pageFor();
    try {
      await page.goto(origin+"/404.html");
      assert.ok(await page.getByRole("heading",{name:"Even good systems need a fallback."}).count());
      assert.ok(await page.getByRole("link",{name:"Explore projects"}).count());
    }finally{await page.close()}
  });
}finally{
await browser.close(); await new Promise(resolve=>server.close(resolve));
const output=path.resolve(__dirname,"../test-results/upgrades");
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,"results.json"),JSON.stringify({tests,passed:tests.length-failures.length,failed:failures.length},null,2));
}
if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
else console.log("Upgrades pass:",tests.length);
})().catch(err=>{console.error(err);server.close();process.exitCode=1});