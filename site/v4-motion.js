/* V4 / Purposeful motion system: editorial entrances, interactive 3D, ripple and parallax.
   No third-party libraries; motion is optional and device aware. */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (selector, scope=document) => scope.querySelector(selector);
  const $$ = (selector, scope=document) => [...scope.querySelectorAll(selector)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  let paused = reduced.matches || root.classList.contains('motion-off');
  let visible = document.visibilityState === 'visible';
  const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));

  // Move in only after the document is ready; never leave content hidden when IO is unavailable.
  const groups = [
    ['.statement-grid .statement-title','slide-left'],
    ['.statement-footer','slide-right'],
    ['.section-heading','zoom'],
    ['.metrics-header','slide-left'],
    ['.metric-cell','zoom'],
    ['.project-card','slide-up'],
    ['.capabilities-header','zoom'],
    ['.archive-heading','slide-left'],
    ['.archive-card','slide-up'],
    ['.recognition-top','zoom'],
    ['.credentials-grid > *','slide-up'],
    ['.challenge-grid > *','slide-up'],
    ['.research-grid > *','slide-up'],
    ['.about-copy','slide-right'],
    ['.contact-section h2','blur'],
    ['.timeline-entry','slide-up'],
  ];
  for(const [selector, effect] of groups){
    $$(selector).forEach((el,i)=>{
      if(!el.dataset.v4)el.dataset.v4=effect;
      if(selector.includes('project-card'))el.style.setProperty('--v4-stagger',`${(i%3)*65}ms`);
    });
  }
  // Actual 3D object: pointer drag adjusts the parent 3D transform while the cube
  // and orbit rings animate on their own independent axes.
  const frame=$('#dimensionFrame'), viewport=$('#dimensionView'), object=$('#dimensionObject');
  const number=$('#dimensionNumber'), heading=$('#dimensionHeading'), description=$('#dimensionDescription');
  const readout=$('#dimensionPosition'), core=$('.dimension-cube-main');
  const flip=$('#dimensionFlip'), actions=$$('[data-dimension]');
  const modes={
    product:{number:'01 / 03 — PRODUCT SYSTEMS',heading:'Build for<br><em>actual people.</em>',description:'Data models, reliable interfaces and useful tools — engineering that holds up after the first impression.'},
    intelligence:{number:'02 / 03 — INTELLIGENCE',heading:'Make complexity<br><em>understandable.</em>',description:'LLM systems, experimental memory compression and retrieval flows — designed around evidence, not buzzwords.'},
    spatial:{number:'03 / 03 — SPATIAL ENGINEERING',heading:'Give systems<br><em>real depth.</em>',description:'WebGL, procedural worlds and interface physics — expressive experiences grounded in consistent interaction rules.'}
  };
  let pitch=14,yaw=-22,targetPitch=14,targetYaw=-22,dragging=false,originX=0,originY=0,dragX=0,dragY=0;
  let objectActive=false,lastFrame=0,raf=0;
  function updateSpatial(){
    if(!object)return;
    pitch += (targetPitch-pitch)*.11; yaw+=(targetYaw-yaw)*.11;
    object.style.setProperty('--rotate-x',`${pitch.toFixed(2)}deg`);
    object.style.setProperty('--rotate-y',`${yaw.toFixed(2)}deg`);
    if(readout)readout.textContent=`ROT X ${Math.round(pitch)}° / Y ${Math.round(yaw)}°`;
  }
  function tick(now){raf=0;
    if(!visible||!objectActive||paused)return;
    if(now-lastFrame>25){lastFrame=now;updateSpatial()}
    raf=requestAnimationFrame(tick);
  }
  function play(){if(!raf&&!paused&&visible&&objectActive)raf=requestAnimationFrame(tick)}
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0;updateSpatial()}
  if(frame && viewport && object){
    const observer=new IntersectionObserver(entries=>{
      objectActive=entries[0]?.isIntersecting||false;
      frame.classList.toggle('v4-inview',objectActive);
      if(objectActive)play();else stop();
    },{threshold:.12});observer.observe(frame);
    viewport.addEventListener('pointerdown',e=>{
      if(paused)return;
      dragging=true;originX=e.clientX;originY=e.clientY;dragX=targetYaw;dragY=targetPitch;
      viewport.setPointerCapture?.(e.pointerId);
    });
    viewport.addEventListener('pointermove',e=>{
      if(paused)return;
      if(dragging){
        targetYaw=clamp(dragX+(e.clientX-originX)*.3,-75,75);
        targetPitch=clamp(dragY-(e.clientY-originY)*.24,-43,45);
      }else if(!coarse.matches){
        const r=viewport.getBoundingClientRect();
        const x=(e.clientX-r.left)/Math.max(1,r.width)-.5;
        const y=(e.clientY-r.top)/Math.max(1,r.height)-.5;
        targetYaw=clamp(-22+x*34,-55,20);
        targetPitch=clamp(14-y*25,-20,37);
      }
    },{passive:true});
    for(const t of ['pointerup','pointercancel','lostpointercapture']) viewport.addEventListener(t,()=>dragging=false);
    viewport.addEventListener('pointerleave',()=>{if(!dragging){targetYaw=-22;targetPitch=14}});
    actions.forEach(button=>button.addEventListener('click',()=>{
      const key=button.dataset.dimension,m=modes[key];if(!m)return;
      frame.dataset.dimensionMode=key;
      if(number)number.textContent=m.number;
      if(heading){heading.innerHTML=m.heading;if(!paused)heading.animate?.([{opacity:.35,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'cubic-bezier(.19,1,.22,1)'})}
      if(description){description.textContent=m.description;if(!paused)description.animate?.([{opacity:.2},{opacity:1}],{duration:220})}
      actions.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      targetYaw=key==='product'?-22:key==='intelligence'?24:-40;
      targetPitch=key==='product'?14:key==='intelligence'?-10:31;
    }));
    flip?.addEventListener('click',()=>{
      const flipped=core?.classList.toggle('is-flipped');
      flip.setAttribute('aria-pressed',String(Boolean(flipped)));
      flip.innerHTML=flipped?'RESET THE CORE <span aria-hidden="true">↶</span>':'FLIP THE CORE <span aria-hidden="true">↻</span>';
    });
  }

  // Small opt-in movement on decorative hero elements; never scroll-reposition text.
  let pendingScroll=false;
  const halo=$('.hero-aurora'), heroArt=$('#heroArt');
  const onScroll=()=>{
    if(pendingScroll)return;pendingScroll=true;
    requestAnimationFrame(()=>{
      pendingScroll=false;
      const offset=clamp(window.scrollY,0,900);
      if(!paused && !coarse.matches){
        if(halo)halo.style.setProperty('--v4-parallax',`${(offset*.12).toFixed(0)}px`);
        if(heroArt)heroArt.style.setProperty('--v4-art-lift',`${(-offset*.035).toFixed(0)}px`);
      }
    });
  };
  addEventListener('scroll',onScroll,{passive:true});onScroll();

  document.addEventListener('portfolio:motion',e=>{
    paused=reduced.matches||Boolean(e.detail?.muted);
    if(paused){stop();targetPitch=14;targetYaw=-22;updateSpatial()}
    else play();
  });
  document.addEventListener('visibilitychange',()=>{visible=document.visibilityState==='visible';if(visible)play();else stop()});
})();
