/* Targeted visual captures for four signature visual systems.
   Local-only browser navigation; no repository-wide scan. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const root=path.resolve(__dirname,'../site');
const output=path.resolve(__dirname,'../test-results/visuals');
fs.mkdirSync(output,{recursive:true});
const mime={'.js':'application/javascript','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.mp4':'video/mp4'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(data)});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined});
 const findings=[],failures=[];
 async function capture(name,width,motion,chapter,forceFallback=false){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:motion,deviceScaleFactor:1});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));

  await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
  if(forceFallback){await page.addInitScript(()=>{const orig=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...rest){if(this.id==='riftCanvas'&&type.startsWith('webgl'))return null;return orig.call(this,type,...rest)}})}
  try{
   await page.goto(origin,{waitUntil:'domcontentloaded'});
   await page.locator('#introCurtain').waitFor({state:'hidden',timeout:8000}).catch(()=>{});
   await page.evaluate(()=>window.portfolioGuide?.hide());
   if(chapter===undefined){
    await page.waitForFunction(()=>!!window.__riftDirector);
    if(!forceFallback)await page.waitForFunction(()=>window.__riftDirector.getState().webglReady);
    await page.locator('.rift-home .stage').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.locator('.rift-home .stage').screenshot({path:path.join(output,name+'.png')});
    const state=await page.evaluate(()=>window.__riftDirector.getState());
    assert.equal(state.webglReady,!forceFallback);
    assert.equal(state.reduced,motion==='reduce');
    findings.push({name,chapter:'hero',state,errors});
   }else{
    await page.locator('#journeySticky').scrollIntoViewIfNeeded();
    await page.locator('[data-journey-jump="'+chapter+'"]').click();
    await page.waitForTimeout(motion==='reduce'?250:1600);
    await page.locator('#journeySticky').screenshot({path:path.join(output,name+'.png')});
    const state=await page.evaluate(()=>({
      chapter:[...document.querySelectorAll('[data-journey-panel]')].findIndex(el=>el.classList.contains('is-current')),
      visible:!!document.querySelector('#journeyCanvas'),
      width:document.querySelector('#journeyCanvas').width,
      height:document.querySelector('#journeyCanvas').height
    }));
    assert.equal(state.chapter,chapter);
    findings.push({name,chapter,state,errors});
   }
   assert.deepEqual(errors,[]);
   console.log('CAPTURED',name);
  }catch(error){failures.push({name,message:error.message});console.error('FAILED',name,error.message)}
  finally{await page.close()}
 }
 try{
  await capture('hero-desktop',1440,'no-preference');
  await capture('hero-mobile',390,'no-preference');
  for(let i=0;i<3;i++)await capture('journey-'+['knowledge','memory','metro'][i],1440,'reduce',i);
  await capture('journey-metro-mobile',390,'reduce',2);
  await capture('hero-reduced-motion',1440,'reduce');
  await capture('hero-2d-fallback',1440,'reduce',undefined,true);
  await capture('journey-knowledge-mobile',390,'reduce',0);
 }finally{
  await browser.close();await new Promise(resolve=>server.close(resolve));
  fs.writeFileSync(path.join(output,'manifest.json'),JSON.stringify({captures:findings,failures,browser:'Chromium via Playwright',performance:'Not measured: no FPS inference from screenshot timing'},null,2));
 }
 if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});