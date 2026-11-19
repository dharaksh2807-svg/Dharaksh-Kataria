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
async function pageFor(width=1440) {
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:"reduce"});
  page.errors=[];
  page.on("pageerror",e=>page.errors.push(e.message));
  await page.route("**/*",route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  return page;
}
async function test(name,fn){
 try {await fn();tests.push({name,result:"PASS"});console.log("PASS",name)}
 catch(err){tests.push({name,result:"FAIL",error:err.message});failures.push(name+": "+err.message);console.error("FAIL",name,err.message)}
}
try {
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