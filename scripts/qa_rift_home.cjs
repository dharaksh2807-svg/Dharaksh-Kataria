#!/usr/bin/env node
/* Integrated Rift V9.4 acceptance capture. Run on the actual Mac.
   Local server: python3 -m http.server 4173 --directory site
   Install Playwright only if missing: npm install && npx playwright install chromium
   Run: node scripts/qa_rift_home.cjs
   Captures are evidence, not an automatic aesthetic certification.
*/
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const url=process.env.RIFT_HOME_URL||'http://127.0.0.1:4173/index.html';
const out=path.resolve(__dirname,'../screenshots/rift-home');
fs.mkdirSync(out,{recursive:true});
const report={url,date:new Date().toISOString(),checks:{},warnings:[],errors:[],limitations:[
  'Browser viewport emulation is not a physical mobile-device test.',
  'RAF timing is not a GPU frame-time measurement.',
  'Visual and animation quality require human review of the images and recordings.'
]};
function check(condition,message){if(!condition)throw new Error(message)}
async function seek(page,p){
  await page.evaluate(p=>{
    const intro=document.querySelector('.rift-home .intro');
    window.scrollTo({top:Math.max(0,intro.offsetHeight-innerHeight)*p,behavior:'instant'});
  },p);
  await page.waitForTimeout(280);
}
async function openPage(context){
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push('Page error: '+(e.stack||e.message)));
  page.on('response',r=>{
    if(r.url().startsWith('http://127.0.0.1:4173/')&&r.status()>=400)
      report.errors.push('HTTP '+r.status()+': '+r.url());
  });
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:20000});
  assert.equal(response.status(),200,'Homepage not served');
  await page.waitForFunction(()=>!!window.__riftDirector,{timeout:12000});
  await page.waitForTimeout(1600);
  return page;
}
async function withVideo(browser,name,options,run){
  const context=await browser.newContext({...options,recordVideo:{dir:out,size:{width:1280,height:800}}});
  let page;
  try{
    page=await openPage(context);
    const result=await run(page);
    const video=page.video();
    await context.close();
    if(video)await video.saveAs(path.join(out,name+'.webm'));
    return result;
  }finally{await context.close().catch(()=>{});}
}
async function main(){
  const browser=await chromium.launch({headless:true});
  try{
    report.checks.desktop=await withVideo(browser,'desktop-journey',{viewport:{width:1440,height:900},deviceScaleFactor:1},async page=>{
      const title=page.locator('#heroTitle');
      check((await title.innerText()).replace(/\s+/g,' ').includes('Dharaksh Kataria.'),'Full name missing');
      const bounds=await title.boundingBox();
      check(bounds&&bounds.x>=0&&bounds.x+bounds.width<=1440,'Desktop name clipped');
      await page.screenshot({path:path.join(out,'desktop-opening.png')});
      const kio=await page.locator('#kioGuide').boundingBox();
      check(kio&&kio.width>=150,'Kio is unexpectedly small on desktop');
      // All five motion systems must be selectable in the actual homepage.
      const modes=['director','kinetic','fracture','infinite','ascension'];
      const modeResults=[];
      for(const mode of modes){
        const button=page.locator('.rift-mode[data-rift-mode="'+mode+'"]');
        check(await button.count()===1,'Missing '+mode+' mode control');
        await button.click();
        const state=await page.evaluate(()=>window.__riftDirector.getState());
        check(state.mode===mode,'Mode '+mode+' did not activate');
        check((await button.getAttribute('aria-pressed'))==='true','Mode '+mode+' missing pressed status');
        modeResults.push({mode,webgl:state.webglReady});
        await page.waitForTimeout(170);
        await page.screenshot({path:path.join(out,'mode-'+mode+'.png')});
      }
      await page.locator('.rift-mode[data-rift-mode="director"]').click();
      const stages=[];
      for(const p of [0,.35,.53,.70,.82,.93,.99]){
        await seek(page,p);
        const state=await page.evaluate(()=>{
          const title=getComputedStyle(document.querySelector('.rift-home .title-wrap'));
          const handoff=document.querySelector('.rift-home .rift-handoff');
          return {motion:window.__riftDirector.getState(),titleOpacity:Number(title.opacity),handoffOpacity:Number(getComputedStyle(handoff).opacity),handoffHidden:handoff.inert};
        });
        stages.push({p,...state});
        if([.35,.53,.82,.93,.99].includes(p))await page.screenshot({path:path.join(out,'scroll-'+Math.round(p*100)+'.png')});
      }
      check(stages[2].titleOpacity>.90,'Name faded too early during the fracture');
      check(stages[3].titleOpacity>.90,'Name should remain readable until late transition');
      check(stages[4].titleOpacity>.90,'Name disappears before the final 18% of scroll');
      check(stages[5].handoffOpacity>.80&&!stages[5].handoffHidden,'Final handoff not visible');
      const finalControlsHidden=await page.evaluate(()=>{
        const el=document.querySelector('.rift-home .rift-mode-switcher');
        return el&&getComputedStyle(el).visibility==='hidden';
      });
      check(finalControlsHidden,'Motion controls overlap the final project handoff');
      const links=await page.locator('#riftProjects .bridge-card').count();
      check(links===3,'Expected three real project case-study links');
      await page.evaluate(()=>document.getElementById('riftProjects').scrollIntoView({behavior:'instant',block:'start'}));
      await page.waitForTimeout(350);
      await page.screenshot({path:path.join(out,'project-handoff.png')});
      const card=await page.locator('#riftProjects .bridge-card').first().boundingBox();
      check(card&&card.height>100,'No actual project cards at transition destination');
      await seek(page,.30);await seek(page,0);
      const reverse=await page.evaluate(()=>Number(getComputedStyle(document.querySelector('.rift-home .title-wrap')).opacity));
      check(reverse>.9,'Reverse scrolling did not restore the name');
      const motion=page.locator('#motionSwitch');
      if((await motion.getAttribute('aria-pressed'))==='false')await motion.click();
      await motion.click();
      await page.waitForTimeout(100);
      check((await page.evaluate(()=>window.__riftDirector.getState())).paused,'Global motion OFF did not pause portal');
      await motion.click();
      const stats=await page.evaluate(()=>window.__riftDirector.getFrameStats());
      return {titleVisible:true,modeResults,kioWidth:kio.width,stages,projectLinks:links,reverseRestoresTitle:true,globalMotionControl:true,frameStats:stats};
    });
    report.checks.mobile=await withVideo(browser,'mobile-journey',{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true},async page=>{
      const picker=page.locator('#riftModeSelect');
      check(await picker.isVisible(),'Mobile style switcher not visible');
      await picker.selectOption('ascension');
      check((await page.evaluate(()=>window.__riftDirector.getState())).mode==='ascension','Mobile style selection failed');
      await picker.selectOption('director');
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
      check(!overflow,'Mobile horizontal overflow');
      await page.screenshot({path:path.join(out,'mobile-opening.png')});
      const title=await page.locator('#heroTitle').boundingBox();
      check(title&&title.x>=0&&title.x+title.width<=390,'Mobile title is clipped');
      await seek(page,.53);
      await page.screenshot({path:path.join(out,'mobile-transition.png')});
      await page.locator('#riftProjects').scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(out,'mobile-projects.png')});
      const kio=await page.locator('#kioGuide').boundingBox();
      return {overflow:false,titleBounds:title,kioWidth:kio?.width,webgl:(await page.evaluate(()=>window.__riftDirector.getState())).webglReady};
    });
    const reduced=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    try{
      const page=await openPage(reduced);
      await page.screenshot({path:path.join(out,'reduced-motion.png')});
      const state=await page.evaluate(()=>({
        engine:window.__riftDirector.getState(),
        introHeight:document.querySelector('.rift-home .intro').offsetHeight,
        viewport:innerHeight,
        titleOpacity:Number(getComputedStyle(document.querySelector('.rift-home .title-wrap')).opacity)
      }));
      check(state.engine.reduced&&state.engine.paused,'Reduced motion is not honored');
      check(state.introHeight<=state.viewport*1.5,'Reduced-motion user faces excessive empty scroll');
      check(state.titleOpacity>.99,'Reduced-motion title invisible');
      report.checks.reduced=state;
    }finally{await reduced.close();}
    // Standalone Director's Cut must not terminate on an empty cream frame.
    const labContext=await browser.newContext({viewport:{width:1440,height:900}});
    try{
      const lab=await labContext.newPage();
      const labUrl=new URL('labs/rift-directors-cut.html',url).href;
      const response=await lab.goto(labUrl,{waitUntil:'domcontentloaded',timeout:20000});
      check(response?.status()===200,'Director Cut lab unavailable');
      await lab.waitForFunction(()=>!!window.__riftDirector,{timeout:15000});
      await lab.waitForTimeout(1200);
      await lab.evaluate(()=>{
        const intro=document.querySelector('.intro');
        window.scrollTo({top:intro.offsetHeight-innerHeight,behavior:'instant'});
      });
      await lab.waitForTimeout(320);
      const labResult=await lab.evaluate(()=>{
        const stage=document.querySelector('.stage'),handoff=stage.querySelector('.rift-handoff');
        const heading=handoff.querySelector('h2');
        const r=heading.getBoundingClientRect();
        const h=stage.getBoundingClientRect();
        return {scroll:window.__riftDirector.getState().scroll,
          opacity:Number(getComputedStyle(handoff).opacity),
          titleOpacity:Number(getComputedStyle(stage.querySelector('.title-wrap')).opacity),
          active:!handoff.inert,
          headingVisible:r.bottom>0&&r.top<innerHeight&&r.width>50,
          sticky:getComputedStyle(stage).position,
          stageVisible:h.bottom>0&&h.top<innerHeight,
          shortcuts:handoff.querySelectorAll('.rift-handoff-links a').length};
      });
      await lab.screenshot({path:path.join(out,'standalone-final-handoff.png')});
      check(labResult.scroll>.97,'Standalone scroll never reached the final transition');
      check(labResult.stageVisible&&labResult.sticky==='sticky','Standalone portal is not pinned through transition');
      check(labResult.opacity>.95&&labResult.active&&labResult.headingVisible,'Standalone handoff is missing: empty cream frame regression');
      check(labResult.shortcuts===3,'Standalone final frame must have real project shortcuts');
      report.checks.standaloneHandoff=labResult;
      await lab.locator('#discover').scrollIntoViewIfNeeded();
      await lab.screenshot({path:path.join(out,'standalone-projects.png')});
    }finally{await labContext.close();}
    if(!report.checks.desktop.stages[0].motion.webglReady)
      report.warnings.push('WebGL did not initialize: visual review must use the CSS fallback, not claim 3D success.');
  }finally{await browser.close();}
}
main().catch(e=>{report.errors.push(e.stack||String(e));process.exitCode=1}).finally(()=>{
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  console.log('Rift home QA:',out);
  console.log('Errors:',report.errors.length,'Warnings:',report.warnings.length);
  if(report.errors.length)process.exitCode=1;
});
