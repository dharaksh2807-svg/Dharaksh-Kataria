#!/usr/bin/env node
/* Rift V9.1: capture on the user's own Chromium. Run: node scripts/capture_rift_variants.cjs */
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const site=path.resolve(__dirname,'../site'),out=path.resolve(__dirname,'../screenshots/rift-v91');
const variants=['kinetic','fracture','infinite','ascension'];
fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer((req,res)=>{try{const p=path.resolve(site,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(site+path.sep))throw Error('Unsafe');res.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream'});fs.createReadStream(p).on('error',()=>res.destroy()).pipe(res);}catch(e){res.writeHead(404);res.end('Missing');}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const result={date:new Date().toISOString(),method:'local Playwright Chromium',notes:'Mobile is viewport emulation; rAF intervals are not GPU frame times.',variants:{}};
async function goto(ctx,url,errors){
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator('.stage').waitFor();
 return page;
}
async function seek(page,p){
 await page.evaluate(v=>{document.documentElement.style.scrollBehavior='auto';const i=document.querySelector('.intro');scrollTo({top:(i.offsetHeight-innerHeight)*v,behavior:'instant'});},p);
 await page.waitForTimeout(280);
}
async function state(page){return page.evaluate(()=>window.__riftLab?.snapshot());}
async function recording(browser,url,dir,type,errors){
 const ctx=await browser.newContext({viewport:{width:1440,height:900},recordVideo:{dir,size:{width:1280,height:800}}});
 let file=null;try{
  const page=await goto(ctx,url,errors);
  if(type==='entrance'){await page.waitForTimeout(2600);await page.mouse.move(940,410);await page.waitForTimeout(450);}
  else{await page.waitForTimeout(1250);for(const p of [.15,.35,.60,.86,.52,.22,0])await seek(page,p);}
  const video=page.video();await ctx.close();file=path.join(dir,type+'.webm');await video.saveAs(file);
 }catch(e){errors.push(type+' video: '+e.message);await ctx.close().catch(()=>{});}
 return file;
}
(async()=>{
 let browser;
 try{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const host='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({headless:true});
  for(const v of variants){
   const dir=path.join(out,v);fs.mkdirSync(dir,{recursive:true});
   const errors=[],report={errors};result.variants[v]=report;
   const url=host+'/labs/rift-'+v+'.html';
   const desktop=await browser.newContext({viewport:{width:1440,height:900}});
   try{
    const page=await goto(desktop,url,errors);await page.waitForTimeout(1800);
    await page.screenshot({path:path.join(dir,'desktop-1440x900.png')});
    report.desktop=await state(page);
    report.rafIntervals=await page.evaluate(()=>window.__riftLab?.frameMetrics());
    assert(report.desktop?.variant===v,'Missing variant runtime');
    assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'Desktop overflow');
    await seek(page,.7);const high=(await state(page)).progress;
    await page.screenshot({path:path.join(dir,'scroll-transition.png')});
    await seek(page,.2);const low=(await state(page)).progress;
    report.scrollReversible=high>low;assert(report.scrollReversible,'Nonreversible scroll');
    await page.locator('.motion-button').click();
    const before=(await state(page)).elapsedMs;await sleep(230);
    report.pauseStable=(await state(page)).elapsedMs===before;
    assert(report.pauseStable,'Pause changed timeline');
    await page.locator('.motion-button').click();await sleep(190);
    report.resumeWorks=(await state(page)).elapsedMs>before;assert(report.resumeWorks,'Resume failed');
    await page.setViewportSize({width:1000,height:740});
    report.resizeNoOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
   }finally{await desktop.close();}
   const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
   try{
    const page=await goto(mobile,url,errors);await page.waitForTimeout(1000);
    await page.screenshot({path:path.join(dir,'mobile-390x844.png')});
    report.mobile=await state(page);
    report.mobileNoOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
    assert(report.mobileNoOverflow,'Mobile overflow');
   }finally{await mobile.close();}
   const reduce=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
   try{
    const page=await goto(reduce,url,errors);await page.waitForTimeout(250);
    await page.screenshot({path:path.join(dir,'reduced-motion.png')});
    report.reduced=await state(page);
    assert(report.reduced?.reduced&&report.reduced?.paused,'Reduced-motion failure');
   }finally{await reduce.close();}
   report.entranceVideo=await recording(browser,url,dir,'entrance',errors);
   report.scrollVideo=await recording(browser,url,dir,'scroll',errors);
   console.log(v+': WebGL2='+(report.desktop?.hasWebGL?'yes':'no')+' | errors='+errors.length);
  }
 }catch(e){result.fatal=String(e.stack||e);process.exitCode=1;console.error(result.fatal);}
 finally{if(browser)await browser.close().catch(()=>{});await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'measurements.json'),JSON.stringify(result,null,2));console.log('Evidence folder: '+out);}
})();