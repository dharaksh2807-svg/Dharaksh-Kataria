#!/usr/bin/env node
/* Rift Director's Cut: local browser evidence.
 * Requires a running http.server on port 4173, playwright, and installed Chromium.
 * No remote deployment, no production homepage changes.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.RIFT_URL||'http://127.0.0.1:4173/labs/rift-directors-cut.html';
const dest=path.resolve(__dirname,'../screenshots/rift-directors-cut');
fs.mkdirSync(dest,{recursive:true});
const report={date:new Date().toISOString(),url:base,notes:[
 'Viewport emulation is NOT a physical mobile device.',
 'requestAnimationFrame timing is NOT GPU execution timing.',
 'WebGL2 status is logged. A CSS fallback screenshot is not a 3D validation.',
 'Human visual review of entrance, fracture, text reveal and camera travel is required.'
],checks:{},issues:[]};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function openPage(ctx){
  const page=await ctx.newPage();
  page.on('pageerror',e=>report.issues.push('PAGE ERROR: '+e.message));
  page.on('console',m=>{if(m.type()==='error')report.issues.push('CONSOLE ERROR: '+m.text());});
  const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:20000});
  assert.equal(response.status(),200,'Preview server failed');
  await page.waitForFunction(()=>!!window.__riftDirector,{timeout:10000});
  await page.waitForFunction(()=>document.getElementById('cameraState').textContent.includes('THREE.JS')||document.getElementById('cameraState').textContent.includes('FALLBACK'),{timeout:9000}).catch(()=>{});
  return page;
}
async function seek(page,fraction){
  await page.evaluate(p=>{
    document.documentElement.style.scrollBehavior='auto';
    const intro=document.querySelector('.intro');
    scrollTo({top:(intro.offsetHeight-innerHeight)*p,behavior:'instant'});
  },fraction);
  await page.waitForTimeout(380);
}
async function capture(browser,name,options,body){
  const ctx=await browser.newContext({...options,recordVideo:{dir:dest,size:{width:1280,height:800}}});
  let page;
  try{
    page=await openPage(ctx);
    const res=await body(page);
    const video=page.video();
    await ctx.close();
    await video.saveAs(path.join(dest,name+'.webm'));
    return res;
  }catch(e){report.issues.push(name+': '+(e.stack||e));await ctx.close().catch(()=>{});return null;}
}
(async()=>{
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  report.checks.desktop=await capture(browser,'desktop-entrance',{viewport:{width:1440,height:900},deviceScaleFactor:1},async page=>{
    await page.waitForTimeout(1550);
    await page.screenshot({path:path.join(dest,'desktop-1440x900.png')});
    const state=await page.evaluate(()=>window.__riftDirector.getState());
    const intervals=await page.evaluate(()=>window.__riftDirector.getFrameStats());
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    if(overflow)throw Error('Desktop horizontal overflow');
    const btn=page.locator('.motion-button');
    await btn.click();
    const frozen=(await page.evaluate(()=>window.__riftDirector.getState())).elapsedMs;
    await wait(280);
    const frozenAfter=(await page.evaluate(()=>window.__riftDirector.getState())).elapsedMs;
    if(frozenAfter!==frozen)throw Error('Pause did not freeze elapsed motion');
    await btn.click();
    await page.waitForTimeout(250);
    const resumed=(await page.evaluate(()=>window.__riftDirector.getState())).elapsedMs;
    if(resumed<=frozen)throw Error('Resume did not advance motion');
    return {state,frameIntervals:intervals,noHorizontalOverflow:!overflow,pauseWorks:true,resumeWorks:true};
  });
  report.checks.scroll=await capture(browser,'desktop-scroll',{viewport:{width:1440,height:900},deviceScaleFactor:1},async page=>{
    await page.waitForTimeout(1000);
    const frames=[0,.29,.43,.53,.68,.81,.94,.61,.25,0];
    const states=[];
    for(const p of frames){
      await seek(page,p);
      states.push(await page.evaluate(()=>window.__riftDirector.getState()));
      if(p===.43||p===.53||p===.81||p===.94)await page.screenshot({path:path.join(dest,'scroll-'+Math.round(p*100)+'.png')});
    }
    const reverse=states[9].scroll<states[6].scroll;
    if(!reverse)throw Error('Reverse scroll failed');
    return {reverse,states,hasWebGL:states[0].webglReady};
  });
  report.checks.mobile=await capture(browser,'mobile-entrance',{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},async page=>{
    await page.waitForTimeout(1400);
    await page.screenshot({path:path.join(dest,'mobile-390x844.png')});
    const state=await page.evaluate(()=>window.__riftDirector.getState());
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    if(overflow)throw Error('Mobile horizontal overflow');
    await seek(page,.53);
    await page.screenshot({path:path.join(dest,'mobile-scroll-53.png')});
    return {state,noHorizontalOverflow:!overflow};
  });
  const reduced=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  try{
    const page=await openPage(reduced);
    await page.screenshot({path:path.join(dest,'reduced-motion.png')});
    const st=await page.evaluate(()=>window.__riftDirector.getState());
    if(!st.reduced||!st.paused)throw Error('Reduced-motion mode did not pause');
    report.checks.reduced=st;
  }finally{await reduced.close();}
 }catch(e){report.issues.push('Fatal: '+(e.stack||e));process.exitCode=1;}
 finally{
  if(browser)await browser.close().catch(()=>{});
  fs.writeFileSync(path.join(dest,'report.json'),JSON.stringify(report,null,2));
  console.log('Rift evidence:',dest);
  console.log('WebGL2:',report.checks.desktop?.state?.webglReady,'issues:',report.issues.length);
  if(report.issues.length)process.exitCode=1;
 }
})();