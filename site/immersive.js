/* PORTFOLIO V3 / Immersive direction system.
   No network, no dependencies, respects reduced motion and the existing motion switch.
   Procedural canvases are original illustration, never product screenshots. */
(() => {
  'use strict';
  const $ = (s,scope=document)=>scope.querySelector(s);
  const $$ = (s,scope=document)=>[...scope.querySelectorAll(s)];
  const clamp = (v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth = v => { v=clamp(v);return v*v*(3-2*v) };
  const lerp = (a,b,t)=>a+(b-a)*t;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const flowing = matchMedia('(max-height:740px)');
  let motionOff = reduced.matches || document.documentElement.classList.contains('motion-off');
  const curtain = $('#introCurtain'), meter = $('#introMeter');
  if(curtain)curtain.hidden=true;
  document.addEventListener('portfolio:motion',(e)=>{
    motionOff=reduced.matches||Boolean(e.detail?.muted);
    if(motionOff){staticChapter=Math.max(0,active);cancelAnimationFrame(raf);raf=0;}
    resize();updateJourney();
    if(curtain && motionOff)curtain.hidden=true;
    if(!motionOff)requestFrame(); else drawOnce();
  });

  // Main scroll-controlled project journey. Only renders while intersecting viewport.
  const story=$('#journeyScroll'), sticky=$('#journeySticky'), canvas=$('#journeyCanvas');
  const panels=$$('[data-journey-panel]'), jumpButtons=$$('[data-journey-jump]');
  const status=$('#journeySystemStatus'), progressBar=$('#journeyProgressBar'), readout=$('#journeyProgress');
  if(!story || !sticky || !canvas)return;
  const ctx=canvas.getContext('2d',{alpha:false,desynchronized:true});
  if(!ctx)return;
  let w=0,h=0,dpr=1,prog=0,active=-1,inView=false,frame=0,raf=0,lastDraw=0;
  let pointerX=0,pointerY=0,tarX=0,tarY=0,visibility=false;
  let staticChapter=0, chapterProgress=0;
  const art=canvas.parentElement;
  const mobile=()=>w<760||flowing.matches;
  const DPR=()=>Math.min(1.65,window.devicePixelRatio||1);
  const r=(seed)=>{const x=Math.sin(seed*182.753+71.9)*43758.545;return x-Math.floor(x)};
  // Three deterministic clusters and their local edges are built once.
  const points=Array.from({length:96},(_,i)=>{
    const cluster=Math.floor(i/32),angle=i*2.39996;
    const spread=i%32===0?0:.12+Math.sqrt(r(i+9))*.46;
    const center=[[-.53,-.32,.16],[.49,-.16,-.25],[.05,.54,.28]][cluster];
    return {x:center[0]+Math.cos(angle)*spread,y:center[1]+Math.sin(angle)*spread,z:center[2]+(r(i+53)-.5)*.6};
  });
  const networkEdges=[];
  points.forEach((point,i)=>{
    const neighbors=points.map((other,j)=>({j,d:Math.hypot(point.x-other.x,point.y-other.y,point.z-other.z)}))
      .filter(other=>other.j!==i).sort((a,b)=>a.d-b.d).slice(0,3);
    neighbors.forEach(({j})=>{if(j>i)networkEdges.push([i,j]);});
  });
  const retainedTokens=[0,1,6,12,18,24,30,36,42,48,54,55,56,57,58,59];
  function resize(){
    const rect=art.getBoundingClientRect();w=Math.max(100,rect.width);h=Math.max(100,rect.height);dpr=DPR();
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    if(!inView)drawOnce();
  }
  const bg=()=>{
    const palettes=[['#29241d','#141715','#090e0d'],['#262c29','#131c1b','#090e10'],['#33251b','#171613','#080b0c']];
    const colors=palettes[Math.max(0,active)];
    ctx.fillStyle=colors[2];ctx.fillRect(0,0,w,h);
    const grd=ctx.createRadialGradient(w*(mobile()?.5:.73),h*.46,0,w*(mobile()?.5:.73),h*.46,Math.max(w,h)*.63);
    grd.addColorStop(0,colors[0]);grd.addColorStop(.45,colors[1]);grd.addColorStop(1,colors[2]);
    ctx.fillStyle=grd;ctx.fillRect(0,0,w,h);
    // Dim registration points sit behind the foreground instruments.
    ctx.fillStyle='#c9c0a414';
    for(let x=24;x<w;x+=48)for(let y=24;y<h;y+=48)ctx.fillRect(x,y,1,1);
  };
  function glow(x,y,rad,color,alpha=1){
    ctx.save();
    const grd=ctx.createRadialGradient(x,y,0,x,y,rad);
    grd.addColorStop(0,color);grd.addColorStop(.4,color.replace(/\.[0-9]+\)$/,'.05)'));grd.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=alpha;ctx.fillStyle=grd;ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function line(x,y,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke()}
  function circ(x,y,rr,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,rr,0,Math.PI*2);ctx.fill()}
  function sceneKnowledge(t,alpha){
    if(alpha<=.004)return;
    ctx.save();
    const cx=w*(mobile()?.5:.73),cy=h*.49;
    const radius=Math.min(w*(mobile()?.36:.235),h*.35);
    const rotation=t*.07+pointerX*.16;
    const view=points.map(point=>{
      const x=point.x*Math.cos(rotation)+point.z*Math.sin(rotation);
      const z=point.z*Math.cos(rotation)-point.x*Math.sin(rotation);
      const perspective=2.8/(2.8+z);
      return {x:cx+(x+pointerX*z*.065)*radius*perspective,y:cy+(point.y+pointerY*z*.05)*radius*perspective,s:perspective,z};
    });
    glow(cx,cy,radius*1.5,'rgba(186,125,78,.18)',alpha);
    // Orbital planes sit behind the graph, leaving the relationships legible.
    for(let orbit=0;orbit<3;orbit++){
      ctx.save();ctx.translate(cx,cy);ctx.rotate(-.45+orbit*.65+t*.018);
      ctx.strokeStyle='#cba57b28';ctx.lineWidth=.7;
      ctx.beginPath();ctx.ellipse(0,0,radius*(1.1+orbit*.16),radius*.32,0,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
    for(const [a,b] of networkEdges){
      const p=view[a],q=view[b];
      const depth=clamp(1-(p.z+q.z)*.25,.2,1);
      line(p.x,p.y,q.x,q.y,`rgba(173,169,146,${.08+depth*.19})`,.5+depth*.4);
    }
    // A lit route traces a learning path through the connected field.
    const route=[4,0,32,39,64,71];
    for(let i=0;i<route.length-1;i++){
      const a=view[route[i]],b=view[route[i+1]];
      const phase=(t*.26+i*.19)%1;
      line(a.x,a.y,b.x,b.y,'#e4b17c80',1.1);
      circ(lerp(a.x,b.x,phase),lerp(a.y,b.y,phase),2.2,'#ffe2b5');
    }
    [...view.keys()].sort((a,b)=>view[b].z-view[a].z).forEach(i=>{
      const p=view[i],hub=i%32===0;
      circ(p.x,p.y,(hub?5.5:1.4)*p.s,hub?'#f0c493':`rgba(203,190,159,${clamp(.6-p.z*.3,.15,.9)})`);
      if(hub){
        glow(p.x,p.y,22*p.s,'rgba(230,170,103,.32)',alpha);
        ctx.strokeStyle='#e4b17c66';ctx.lineWidth=.7;ctx.beginPath();ctx.arc(p.x,p.y,(12+Math.sin(t+i)*2)*p.s,0,Math.PI*2);ctx.stroke();
      }
    });
    if(radius>100){
      ctx.font='11px monospace';
      ['FOUNDATIONS','RELATIONSHIPS','APPLICATION'].forEach((label,i)=>{
        const p=view[i*32];
        const side=i===1?-1:1;
        line(p.x,p.y,p.x+side*28,p.y-29,'#d2b38c80');
        ctx.textAlign=side<0?'right':'left';ctx.fillStyle='#d8c7ae';ctx.fillText(label,p.x+side*32,p.y-32);
      });
    }
    ctx.restore();
  }
  function sceneMemory(t,alpha){
    if(alpha<=.004)return;
    ctx.save();
    const cx=w*(mobile()?.5:.73),cy=h*.49;
    const width=Math.min(w*(mobile()?.88:.40),640),height=Math.min(h*.72,width*.8);
    const cell=width/14,sourceY=cy-height*.35,targetY=cy+height*.21,left=cx-width*.43;
    glow(cx,cy,width*.75,'rgba(150,155,144,.14)',alpha);
    // A stable source lattice makes selection and routed state distinguishable.
    ctx.fillStyle='#ffffff03';ctx.fillRect(left-cell*.6,sourceY-cell*.6,cell*12.2,cell*5.9);
    ctx.strokeStyle='#d6cbb125';ctx.strokeRect(left-cell*.6,sourceY-cell*.6,cell*12.2,cell*5.9);
    for(let i=0;i<60;i++){
      const x=left+i%12*cell,y=sourceY+Math.floor(i/12)*cell*.78;
      const retained=retainedTokens.includes(i);
      ctx.fillStyle=retained?'#c69d6e66':'#7a817a30';ctx.fillRect(x,y,cell*.72,cell*.48);
      ctx.fillStyle=retained?'#e5cda380':'#b5bbb519';ctx.fillRect(x,y,cell*.72,1);
    }
    const targetX=cx-width*.27;
    // Fine signal paths converge into the allocated memory bank.
    retainedTokens.forEach((index,i)=>{
      const sx=left+index%12*cell+cell*.36,sy=sourceY+Math.floor(index/12)*cell*.78+cell*.24;
      const tx=targetX+i%8*cell*1.05,ty=targetY+Math.floor(i/8)*cell*.82;
      const bend=cy+height*.02;
      ctx.beginPath();ctx.moveTo(sx,sy);ctx.bezierCurveTo(sx,bend,tx,bend,tx,ty);
      ctx.strokeStyle=i%3===0?'#c9ad7859':'#a5b1a41c';ctx.lineWidth=.7;ctx.stroke();
      const phase=(t*.16+i*.061+chapterProgress*.3)%1,eased=smooth(phase),inverse=1-eased;
      const x=inverse**3*sx+3*inverse**2*eased*sx+3*inverse*eased**2*tx+eased**3*tx;
      const y=inverse**3*sy+3*inverse**2*eased*bend+3*inverse*eased**2*bend+eased**3*ty;
      ctx.fillStyle='#edd3a5';ctx.fillRect(x-cell*.055,y-cell*.055,cell*.11,cell*.11);
      ctx.fillStyle='#a7b8a0';ctx.fillRect(tx-cell*.36,ty-cell*.24,cell*.72,cell*.48);
      line(tx-cell*.36,ty-cell*.24,tx+cell*.36,ty-cell*.24,'#e8dfc7a6');
    });
    const sweep=(t*.13+chapterProgress*.5)%1;
    const scan=left+sweep*cell*11.7;
    const beam=ctx.createLinearGradient(scan-cell,0,scan+cell,0);
    beam.addColorStop(0,'#e4c19100');beam.addColorStop(.5,'#e4c19122');beam.addColorStop(1,'#e4c19100');
    ctx.fillStyle=beam;ctx.fillRect(scan-cell,sourceY-cell*.5,cell*2,cell*4.8);
    if(width>260&&height>170){
      ctx.font='11px monospace';ctx.textAlign='left';ctx.fillStyle='#c5c8bb';
      ctx.fillText('CONTEXT STREAM',left,sourceY-cell);
      ctx.fillText('RETAINED STATE',targetX-cell*.36,targetY+cell*2.1);
      ctx.textAlign='right';ctx.fillStyle='#bfa27d';ctx.fillText(width<450?'SELECTION':'ILLUSTRATIVE BLOCK BUDGET',left+cell*11.4,sourceY-cell);
      ctx.textAlign='left';ctx.fillStyle='#565e55';ctx.fillRect(targetX-cell*.36,targetY+cell*2.55,cell*8.1,3);
      ctx.fillStyle='#d4bb90';ctx.fillRect(targetX-cell*.36,targetY+cell*2.55,cell*8.1*16/60,3);
    }
    ctx.restore();
  }
  function sceneMetro(t,alpha){
    if(alpha<=.004)return;
    ctx.save();
    const cx=w*(mobile()?.5:.73)+pointerX*9,horizon=h*.43+pointerY*5;
    const reach=Math.max(w*(mobile()?.6:.35),h*.59);
    glow(cx,horizon,reach*.8,'rgba(215,146,80,.22)',alpha);
    // Filled wall facets and ceiling ribs share one perspective projection.
    const frames=Array.from({length:19},(_,i)=>.035+((i/19+t*.095)%1)**2*1.45).sort((a,b)=>a-b);
    const shape=(depth)=>{
      const x=reach*depth,top=horizon-x*.66,bottom=horizon+x*.72;
      return [[cx-x,bottom],[cx-x,top+x*.18],[cx-x*.74,top],[cx+x*.74,top],[cx+x,top+x*.18],[cx+x,bottom]];
    };
    for(let i=0;i<frames.length;i++){
      const depth=frames[i],p=shape(depth);
      ctx.beginPath();p.forEach(([x,y],index)=>index?ctx.lineTo(x,y):ctx.moveTo(x,y));
      ctx.strokeStyle=`rgba(133,123,105,${.1+Math.min(depth,.9)*.36})`;ctx.lineWidth=2+depth*9;ctx.stroke();
      // Copper inner edges catch light as the repeated structures pass the camera.
      ctx.beginPath();p.slice(1,5).forEach(([x,y],index)=>index?ctx.lineTo(x,y):ctx.moveTo(x,y));
      ctx.strokeStyle=`rgba(232,174,112,${.12+Math.min(depth,.9)*.44})`;ctx.lineWidth=.5+depth*1.1;ctx.stroke();
      for(const side of [-1,1]){
        const x=cx+side*reach*depth*.94;
        line(x,horizon-reach*depth*.38,x,horizon+reach*depth*.30,`rgba(244,205,155,${.06+depth*.38})`,1+depth*2.5);
      }
    }
    // The track and sleepers accelerate outward from the illuminated horizon.
    for(const lane of [-.7,-.31,-.26,.26,.31,.7]){
      line(cx+lane*5,horizon,cx+lane*reach*2,h*1.12,lane===-.26||lane===.26?'#efbf83a6':'#a99a7b4d',Math.abs(lane)===.26?2:1);
    }
    for(let i=0;i<32;i++){
      const depth=((i/32+t*.19)%1)**2.6;
      const y=lerp(horizon,h*1.12,depth),half=depth*reach*.67;
      line(cx-half,y,cx+half,y,`rgba(192,166,127,${.08+depth*.5})`,.5+depth*4);
    }
    // Sparse long-exposure particles communicate forward travel without a strobe.
    for(let i=0;i<30;i++){
      const depth=((r(i+80)+t*.08)%1)**2;
      const angle=r(i+140)*Math.PI*2;
      const x=cx+Math.cos(angle)*reach*depth,y=horizon+Math.sin(angle)*reach*depth*.62;
      line(x,y,x+Math.cos(angle)*depth*24,y+Math.sin(angle)*depth*15,`rgba(230,188,136,${depth*.4})`,.8);
    }
    glow(cx,horizon,reach*.23,'rgba(238,187,119,.25)',alpha);
    ctx.restore();
  }
  function paint(now){
    frame=now*.001;pointerX+=(tarX-pointerX)*.08;pointerY+=(tarY-pointerY)*.08;
    ctx.setTransform(dpr,0,0,dpr,0,0);bg();
    // Text and canvas use the same chapter, with no overlapping systems.
    if(active===0)sceneKnowledge(frame,1);
    else if(active===1)sceneMemory(frame,1);
    else sceneMetro(frame,1);
  }
  function drawOnce(){if(ctx)paint(980)}
  function animate(now){raf=0;if(!inView||motionOff||document.hidden)return;
    // Target maximum ~40 fps: sophisticated visuals without unnecessary CPU heat.
    if(now-lastDraw>=25){lastDraw=now;paint(now)}
    requestFrame();
  }
  function requestFrame(){if(raf||!inView||motionOff||document.hidden)return;raf=requestAnimationFrame(animate)}
  function updateJourney(){
    if(!story)return;
    const bound=story.getBoundingClientRect(),length=Math.max(1,bound.height-innerHeight);
    const next=clamp(-bound.top/length);
    const manual=motionOff||flowing.matches;
    prog=manual?staticChapter/2:next;
    const chapter=manual?staticChapter:Math.min(2,Math.floor(next*3));
    chapterProgress=manual?.5:clamp(next*3-chapter);
    const changed=chapter!==active;
    if(changed){
      active=chapter;
      sticky.dataset.chapter=String(active);
      const caption=sticky.querySelector('.journey-scene-caption');
      if(caption)caption.textContent=['RESOURCES / RELATIONSHIPS / PATHWAYS','CONTEXT / SELECTION / RETAINED STATE','GEOMETRY / PERSPECTIVE / CONTINUITY'][active];
      panels.forEach((panel,i)=>{
        const current=i===active;
        panel.classList.toggle('is-current',current);
        panel.setAttribute('aria-hidden',String(!current));
        panel.inert=!current;
      });
      jumpButtons.forEach((button,i)=>{
        const current=i===active;
        button.classList.toggle('is-active',current);
        if(current)button.setAttribute('aria-current','true');
        else button.removeAttribute('aria-current');
      });
      if(status)status.textContent=['01 / LEARNING GRAPH','02 / MEMORY RETENTION','03 / PROCEDURAL TRACK'][active];
      resize();
    }
    if(readout)readout.textContent=String(Math.round(prog*100)).padStart(3,'0')+'%';
    if(progressBar)progressBar.style.width=`${prog*100}%`;
    // Paint chapter changes in this frame, before the updated text is displayed.
    if(changed || (motionOff && inView))paint(motionOff?980:performance.now());
  }
  let scrollScheduled=false;
  const requestScroll=()=>{if(!scrollScheduled){scrollScheduled=true;requestAnimationFrame(()=>{scrollScheduled=false;updateJourney()})}};
  window.addEventListener('scroll',requestScroll,{passive:true});
  window.addEventListener('resize',()=>{resize();requestScroll()},{passive:true});
  document.addEventListener('visibilitychange',()=>{visibility=document.hidden;if(!visibility)requestFrame()});
  const inViewObserver=new IntersectionObserver(entries=>{
    inView=entries[0].isIntersecting;
    if(inView){resize();requestScroll();requestFrame()}
    else if(raf){cancelAnimationFrame(raf);raf=0}
  },{threshold:0,rootMargin:'200px 0px'});inViewObserver.observe(sticky);
  sticky.addEventListener('pointermove',e=>{if(motionOff||e.pointerType==='touch')return;const r=sticky.getBoundingClientRect();tarX=clamp((e.clientX-r.left)/r.width)*2-1;tarY=clamp((e.clientY-r.top)/r.height)*2-1},{passive:true});
  sticky.addEventListener('pointerleave',()=>{tarX=tarY=0},{passive:true});
  jumpButtons.forEach((b,i)=>b.addEventListener('click',()=>{
    if(motionOff||flowing.matches){staticChapter=i;updateJourney();return}
    const scrollTop=window.scrollY+story.getBoundingClientRect().top;
    const length=Math.max(1,story.getBoundingClientRect().height-innerHeight);
    const target=scrollTop+length*([.04,.50,.96][i]);
    window.scrollTo({top:target,behavior:motionOff?'instant':'smooth'});
  }));
  resize();updateJourney();

  // Hero opacity / ink line only while in view (very inexpensive updates).
  const hero=$('.hero'),heroTitle=$('.hero-copy h1');let heroTick=false;
  function heroScroll(){if(!hero||!heroTitle||motionOff)return;const pos=clamp(window.scrollY/Math.max(400,hero.offsetHeight));heroTitle.style.setProperty('--v3-hero-offset',`${pos*37}px`);heroTitle.style.setProperty('--v3-line-scale',`${Math.max(.2,1-pos)} `)}
  window.addEventListener('scroll',()=>{if(heroTick)return;heroTick=true;requestAnimationFrame(()=>{heroTick=false;heroScroll()})},{passive:true});
  heroScroll();
  // Section marker and active nav are presentation only, the regular anchors remain native.
  const sections=[['top','STUDIO'],['journey','JOURNEY'],['work','PROJECTS'],['timeline','CHRONOLOGY'],['motion-lab','PLAYGROUND'],['capabilities','SKILLS'],['archive','ARCHIVE'],['recognition','CREDENTIALS'],['about','ABOUT'],['contact','CONTACT']];
  const chapterNum=$('#floatingChapterIndex'),chapterName=$('#floatingChapterName');
  const navs=$$('.nav-link');const activeSections=new Map();
  const chapterObserver=new IntersectionObserver(entries=>{
    entries.forEach(e=>activeSections.set(e.target.id,e.isIntersecting?e.intersectionRatio:0));
    const ranked=sections.map((s,i)=>({id:s[0],name:s[1],index:i,ratio:activeSections.get(s[0])||0})).sort((a,b)=>b.ratio-a.ratio);
    const chosen=ranked[0];if(!chosen||chosen.ratio<=0)return;
    if(chapterNum)chapterNum.textContent=String(chosen.index+1).padStart(2,'0');if(chapterName)chapterName.textContent=chosen.name;
    navs.forEach(a=>a.classList.toggle('is-current',a.hash==='#'+chosen.id));
  },{threshold:[0,.05,.15,.3,.5],rootMargin:'-20% 0px -35% 0px'});
  sections.forEach(([id])=>{const el=document.getElementById(id);if(el)chapterObserver.observe(el)});
  // Curtain for case studies uses a modest, accessible fade rather than hijacking navigation.
  const caseOverlay=$('#caseOverlay');
  const caseObserver=new MutationObserver(()=>{
    if(!caseOverlay)return;
    if(!caseOverlay.hidden){caseOverlay.classList.remove('case-closed');caseOverlay.classList.add('case-cinematic')}
    else caseOverlay.classList.remove('case-cinematic');
  });if(caseOverlay)caseObserver.observe(caseOverlay,{attributes:true,attributeFilter:['hidden']});
})();
