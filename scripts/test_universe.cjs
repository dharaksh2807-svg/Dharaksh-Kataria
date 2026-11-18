/* Real entry-point tests with external requests blocked. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const site=path.resolve(__dirname,'../site');
const output=path.resolve(__dirname,'../test-results/universe');
fs.mkdirSync(output,{recursive:true});
const results=[],measurements=[];
const types={'.js':'application/javascript','.html':'text/html','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  const file=path.resolve(site,'.'+new URL(req.url,'http://localhost').pathname.replace(/\/$/,'/index.html'));
  if(!file.startsWith(site+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404).end();return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);});
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined});
  async function pageFor({mode='native',width=1440,height=1000,motion='no-preference',javaScriptEnabled=true,slow=false}={}){
    const page=await browser.newPage({viewport:{width,height},hasTouch:true,reducedMotion:motion,deviceScaleFactor:slow?2:1,javaScriptEnabled});
    await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
    await page.addInitScript(({mode,slow})=>{
      const original=HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext=function(type,...args){
        if(this.id==='worldCanvas'){
          if((mode==='software' && type==='webgl2') || mode==='unavailable')return null;
          const context=original.call(this,type,...args);
          if(context && type==='webgl2'){
            if(mode==='shader-failure')context.getShaderParameter=()=>false;
            if(slow){const draw=context.drawArrays.bind(context);context.drawArrays=(...args)=>{const end=performance.now()+26;while(performance.now()<end){};draw(...args);};}
          }
          return context;
        }
        return original.call(this,type,...args);
      };
    },{mode,slow});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.testErrors=errors;
    await page.goto(origin,{waitUntil:'domcontentloaded'});
    if(javaScriptEnabled){
      await page.waitForFunction(()=>!!window.portfolioWorld);
      await page.locator('#introCurtain').waitFor({state:'hidden'});
      await page.evaluate(()=>window.portfolioGuide?.hide());
      await page.locator('#worldCanvasWrap').scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>portfolioWorld.state.inView && (portfolioWorld.state.performance.frames>0 || portfolioWorld.state.performance.renderer==='unavailable'));
    }
    return page;
  }
  async function test(name,fn){try{await fn();results.push({name,status:'passed'});console.log('PASS',name);}catch(error){results.push({name,status:'failed',error:error.message});console.error('FAIL',name,error.message);}}
  async function state(page){return page.evaluate(()=>portfolioWorld.state);}
  try{
    for(const mode of ['native','software'])for(const width of [320,390,768,1440])await test(`${mode} responsive ${width}`,async()=>{
      const page=await pageFor({mode,width});
      try{
        assert.equal((await state(page)).gl,mode==='native');
        assert.equal(await page.locator('.world-sector').count(),4);
        assert.equal(await page.locator('#worldProjects a').count(),4);
        assert.equal(await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-innerWidth)),0);
        assert.deepEqual(page.testErrors,[]);
        if([390,1440].includes(width)){
          await page.waitForTimeout(1100);
          await page.locator('#worldShell').screenshot({path:path.join(output,`${mode}-${width}.png`)});
        }
      }finally{await page.close();}
    });
    await test('district selection transitions smoothly to the requested camera',async()=>{
      const page=await pageFor();
      try{
        const before=await state(page);
        await page.locator('[data-world-sector="1"]').click();
        const during=await state(page);
        assert.equal(during.selected,1);assert.equal(during.tour,false);
        assert.ok(Math.abs(during.camera.target[0]-during.camera.goal[0])>.1);
        await page.waitForTimeout(1400);
        const after=await state(page);
        assert.ok(Math.abs(after.camera.target[0]-after.camera.goal[0])<.03);
        assert.ok(after.camera.target[0]>before.camera.target[0]);
        assert.equal(await page.locator('#worldInspectorLink').getAttribute('href'),'projects/projectmatch.html');
      }finally{await page.close();}
    });
    await test('scroll tour continuously visits all four districts',async()=>{
      const page=await pageFor();
      try{
        for(const [index,progress] of [0,1/3,2/3,1].entries()){
          await page.evaluate(progress=>{const track=document.querySelector('#worldScrollTrack'),shell=document.querySelector('#worldShell');window.scrollTo(0,track.getBoundingClientRect().top+scrollY-90+progress*(track.offsetHeight-shell.offsetHeight));},progress);
          await page.waitForTimeout(900);
          const current=await state(page);
          assert.equal(current.selected,index);assert.equal(current.tour,true);
          assert.ok(current.camera.target.every(Number.isFinite));
        }
      }finally{await page.close();}
    });
    for(const mode of ['native','software'])await test(`${mode} all project objects respond to controls`,async()=>{
      const page=await pageFor({mode,motion:'reduce'});
      try{
        for(let index=0;index<4;index++){
          await page.locator(`[data-world-sector="${index}"]`).click();
          const before=await state(page);
          await page.locator('#worldObjectAction').click();
          const after=await state(page);
          assert.notEqual(after.objects[index],before.objects[index]);
          assert.ok((await page.locator('#worldObjectState').innerText()).length>30);
          assert.ok(after.performance.vertices>9000);
        }
        assert.equal(await page.locator('#worldInspectorLink').getAttribute('href'),'projects/metro.html');
        assert.match(await page.locator('#worldObjectState').innerText(),/Conceptual track interaction/);
        assert.equal(await page.locator('a[href*="dharaksh2807-svg/ss"]').count(),0);
      }finally{await page.close();}
    });
    await test('pointer orbit cancels scroll ownership and releases capture',async()=>{
      const page=await pageFor();
      try{
        const box=await page.locator('#worldCanvasWrap').boundingBox(),before=await state(page);
        await page.mouse.move(box.x+box.width*.5,box.y+box.height*.7);
        await page.mouse.down();await page.mouse.move(box.x+box.width*.5+100,box.y+box.height*.7+20,{steps:10});await page.mouse.up();
        await page.waitForTimeout(300);
        const after=await state(page);
        assert.ok(Math.abs(after.camera.yaw-before.camera.yaw)>.2);assert.equal(after.tour,false);assert.equal(after.dragging,false);
        await page.locator('#worldTour').click();assert.equal((await state(page)).tour,true);
      }finally{await page.close();}
    });
    await test('touch orbit and touch cancellation release controls',async()=>{
      const page=await pageFor({width:390});
      try{
        const cdp=await page.context().newCDPSession(page),box=await page.locator('#worldCanvasWrap').boundingBox();
        const x=box.x+box.width*.5,y=box.y+box.height*.65,before=await state(page);
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+75,y:y+20,id:1}]});
        await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
        await page.waitForTimeout(300);
        const after=await state(page);
        assert.ok(Math.abs(after.camera.yaw-before.camera.yaw)>.1);assert.equal(after.dragging,false);
      }finally{await page.close();}
    });
    await test('keyboard controls and static bypass links work',async()=>{
      const page=await pageFor({motion:'reduce'});
      try{
        const host=page.locator('#worldCanvasWrap');await host.focus();
        await page.keyboard.press('3');assert.equal((await state(page)).label,'Research');
        const before=await state(page);await page.keyboard.press('Enter');assert.notEqual((await state(page)).objects[2],before.objects[2]);
        await page.keyboard.press('4');const lane=(await state(page)).objects[3];await page.keyboard.press('a');assert.notEqual((await state(page)).objects[3],lane);
        const radius=(await state(page)).camera.radius;await page.keyboard.press('ArrowUp');assert.ok((await state(page)).camera.radius<radius);
        await page.getByRole('link',{name:'Browse the four project stories ↓'}).click();
        assert.equal(await page.evaluate(()=>location.hash),'#worldProjects');
        assert.equal(await page.locator('#worldProjects a').nth(3).getAttribute('href'),'projects/metro.html');
      }finally{await page.close();}
    });
    await test('ordinary wheel scrolls the document and Alt-wheel zooms',async()=>{
      const page=await pageFor();
      try{
        const box=await page.locator('#worldCanvasWrap').boundingBox();await page.mouse.move(box.x+box.width*.4,box.y+box.height*.5);
        const y=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,160);await page.waitForTimeout(300);assert.ok(await page.evaluate(y=>scrollY>y,y));
        const before=(await state(page)).camera.radiusGoal;await page.keyboard.down('Alt');await page.mouse.wheel(0,-100);await page.keyboard.up('Alt');await page.waitForTimeout(200);
        assert.ok((await state(page)).camera.radiusGoal<before);
      }finally{await page.close();}
    });
    await test('reduced motion renders on demand and responds to live preference changes',async()=>{
      const page=await pageFor({motion:'reduce'});
      try{
        await page.waitForTimeout(300);const before=await state(page);await page.waitForTimeout(450);
        assert.equal((await state(page)).performance.frames,before.performance.frames);assert.equal(before.motion,false);assert.equal(before.tour,false);
        assert.equal(await page.locator('#worldTour').isDisabled(),true);
        await page.emulateMedia({reducedMotion:'no-preference'});
        // The site-wide manual motion setting stays authoritative.
        await page.locator('#motionSwitch').click();
        await page.waitForTimeout(250);assert.equal((await state(page)).motion,true);
        await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(200);
        assert.equal((await state(page)).motion,false);
      }finally{await page.close();}
    });
    await test('offscreen renderer stops and resumes on return',async()=>{
      const page=await pageFor();
      try{
        await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(300);const before=await state(page);
        await page.waitForTimeout(500);assert.equal((await state(page)).performance.frames,before.performance.frames);
        await page.locator('#worldCanvasWrap').scrollIntoViewIfNeeded();await page.waitForTimeout(300);assert.ok((await state(page)).performance.frames>before.performance.frames);
      }finally{await page.close();}
    });
    await test('visibility lifecycle handler suspends and resumes rendering',async()=>{
      const page=await pageFor();
      try{
        await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
        const before=(await state(page)).performance.frames;await page.waitForTimeout(350);assert.equal((await state(page)).performance.frames,before);
        await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(250);assert.ok((await state(page)).performance.frames>before);
      }finally{await page.close();}
    });
    await test('real WebGL context loss uses software and restores three times',async()=>{
      const page=await pageFor();
      try{
        await page.locator('[data-world-sector="3"]').click();await page.locator('#worldObjectAction').click();
        const before=await state(page);
        for(let count=0;count<3;count++){
          await page.evaluate(()=>{window.lossExtension=document.querySelector('#worldCanvas').getContext('webgl2').getExtension('WEBGL_lose_context');lossExtension.loseContext();});
          await page.waitForFunction(()=>portfolioWorld.state.contextLost && !portfolioWorld.state.gl);
          assert.equal(await page.locator('#worldShell').getAttribute('data-renderer'),'software');
          await page.waitForTimeout(250);await page.evaluate(()=>lossExtension.restoreContext());
          await page.waitForFunction(()=>portfolioWorld.state.gl);
          assert.deepEqual((await state(page)).objects,before.objects);
          assert.equal((await state(page)).performance.vertices,before.performance.vertices);
        }
        const glError=await page.evaluate(()=>document.querySelector('#worldCanvas').getContext('webgl2').getError());assert.equal(glError,0);assert.deepEqual(page.testErrors,[]);
      }finally{await page.close();}
    });
    for(const mode of ['shader-failure','unavailable'])await test(`${mode} preserves navigation and controls`,async()=>{
      const page=await pageFor({mode,motion:'reduce'});
      try{
        assert.equal((await state(page)).gl,false);
        assert.equal(await page.locator('#worldShell').getAttribute('data-renderer'),mode==='shader-failure'?'software':'unavailable');
        assert.equal(await page.locator('#worldFallback').isVisible(),mode==='unavailable');
        await page.locator('[data-world-sector="2"]').click();
        assert.equal(await page.locator('#worldInspectorLink').getAttribute('href'),'projects/kv.html');assert.deepEqual(page.testErrors,[]);
      }finally{await page.close();}
    });
    await test('all four bypass links work without JavaScript',async()=>{
      const page=await pageFor({javaScriptEnabled:false,width:390});
      try{
        assert.equal(await page.locator('#worldProjects a').count(),4);
        await page.locator('#worldProjects a').nth(2).click();assert.ok(page.url().endsWith('/projects/kv.html'));
      }finally{await page.close();}
    });
    await test('unavailable rendering stays idle with motion enabled',async()=>{
      const page=await pageFor({mode:'unavailable'});
      try{
        assert.equal((await state(page)).motion,true);
        const before=(await state(page)).performance.frames;
        await page.waitForTimeout(400);
        assert.equal((await state(page)).performance.frames,before);
        assert.equal(await page.locator('.world-marker:visible').count(),0);
        await page.locator('[data-world-sector="3"]').click();
        assert.equal(await page.locator('#worldInspectorLink').getAttribute('href'),'projects/metro.html');
        assert.equal((await state(page)).performance.frames,before);
        assert.deepEqual(page.testErrors,[]);
      }finally{await page.close();}
    });
    await test('camera movement preserves focused district navigation',async()=>{
      const page=await pageFor({motion:'reduce'});
      try{
        await page.locator('#worldReset').click();
        await page.locator('#worldCanvasWrap').scrollIntoViewIfNeeded();
        const marker=page.getByRole('button',{name:'Focus Creation district'});
        await marker.focus();
        await page.evaluate(()=>portfolioWorld.focus(0));
        await page.locator('#worldZoomIn').evaluate(button=>{for(let i=0;i<8;i++)button.click();});
        await page.waitForTimeout(100);
        assert.ok(await marker.isVisible());
        assert.ok(await marker.evaluate(node=>node===document.activeElement));
        await page.keyboard.press('Enter');
        assert.equal((await state(page)).selected,3);
        assert.equal(await page.locator('#worldInspectorLink').getAttribute('href'),'projects/metro.html');
      }finally{await page.close();}
    });
    await test('clicking the Learning object changes its selected semester',async()=>{
      const page=await pageFor({motion:'reduce'});
      try{
        await page.locator('[data-world-sector="0"]').click();
        await page.locator('#worldCanvasWrap').scrollIntoViewIfNeeded();
        const before=await state(page),box=await page.locator('#worldCanvasWrap').boundingBox();
        const c=before.camera,eye=[c.target[0]+c.radius*Math.cos(c.pitch)*Math.sin(c.yaw),c.target[1]+c.radius*Math.sin(c.pitch),c.target[2]+c.radius*Math.cos(c.pitch)*Math.cos(c.yaw)];
        const normalize=v=>{const length=Math.hypot(...v);return v.map(x=>x/length);};
        const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
        const dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0);
        const forward=normalize(c.target.map((x,i)=>x-eye[i])),right=normalize(cross(forward,[0,1,0])),up=cross(right,forward);
        const offset=[-6.6,1,-5.6].map((x,i)=>x-eye[i]),depth=dot(offset,forward),scale=Math.tan(.78/2);
        const x=box.x+box.width*(.5+.5*dot(offset,right)/(depth*scale*box.width/box.height));
        const y=box.y+box.height*(.5-.5*dot(offset,up)/(depth*scale));
        await page.mouse.click(x,y);assert.notEqual((await state(page)).objects[0],before.objects[0]);
      }finally{await page.close();}
    });
    await test('Kio preferences and opt-in audio survive scene interactions',async()=>{
      const page=await pageFor();
      try{
        const prefs=JSON.stringify({hidden:true,size:'compact',completed:true,lastStep:0});
        await page.evaluate(prefs=>localStorage.setItem('dk-kio-preferences-v6',prefs),prefs);
        await page.reload();await page.locator('#worldCanvasWrap').scrollIntoViewIfNeeded();
        await page.locator('[data-world-sector="3"]').click();await page.locator('#worldObjectAction').click();
        assert.equal(await page.evaluate(()=>localStorage.getItem('dk-kio-preferences-v6')),prefs);
        assert.equal(await page.locator('#kioGuide').evaluate(node=>node.classList.contains('kio-compact')),true);
        assert.equal((await state(page)).audio,false);assert.equal((await state(page)).haptic,false);
      }finally{await page.close();}
    });
    await test('quality adapts under controlled heavy draw submission',async()=>{
      const page=await pageFor({slow:true});
      try{
        await page.waitForFunction(()=>portfolioWorld.state.performance.adaptiveChanges>0,{},{timeout:15000});
        const current=await state(page);assert.ok(current.performance.quality<1.65);assert.ok(current.performance.dpr<1.65);
        measurements.push({kind:'controlled 26ms CPU draw delay',performance:current.performance});
      }finally{await page.close();}
    });
    for(const config of [{mode:'native',width:1440},{mode:'software',width:1440},{mode:'native',width:390}])await test(`${config.mode} measured rendering ${config.width}`,async()=>{
      const page=await pageFor(config);
      try{
        await page.locator('#worldReset').click();await page.locator('#worldCanvasWrap').scrollIntoViewIfNeeded();
        await page.waitForTimeout(6500);
        const current=await state(page);
        const gpu=await page.evaluate(()=>{const gl=document.querySelector('#worldCanvas').getContext('webgl2');if(!gl)return null;const ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);});
        measurements.push({...config,gpu,performance:current.performance});
        assert.ok(current.performance.fps>=(config.mode==='software'?20:30));
        assert.ok(current.performance.frames>60);assert.deepEqual(page.testErrors,[]);
        await page.locator('#worldShell').screenshot({path:path.join(output,`measured-${config.mode}-${config.width}.png`)});
      }finally{await page.close();}
    });
  }finally{
    const report={browser:browser.version(),total:results.length,passed:results.filter(r=>r.status==='passed').length,failed:results.filter(r=>r.status==='failed').length,results,measurements};
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(report,null,2)+'\n');
    console.log(`${report.passed}/${report.total} passed`);console.log(JSON.stringify(measurements,null,2));
    await browser.close();server.close();if(report.failed)process.exitCode=1;
  }
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
