/* V9.4 interaction finish — visual affordances, not a replacement cursor.
   Reuses existing ripple animations and the existing accessible Kio tour. */
(() => {
  'use strict';
  const root=document.documentElement;
  const halo=document.getElementById('cursorHalo');
  const fine=matchMedia('(hover:hover) and (pointer:fine)');
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const canAnimate=()=>fine.matches&&!reduced.matches&&!root.classList.contains('motion-off')&&!document.hidden;
  let x=-300,y=-300,tx=-300,ty=-300,raf=0,seen=false;
  const actionable='a,button,[role="button"],.project-visual,[tabindex="0"]';
  function stop(){
    if(raf)cancelAnimationFrame(raf);
    raf=0;
    if(halo){halo.style.opacity='0';halo.classList.remove('is-action','is-clicked');}
  }
  function draw(){
    raf=0;
    if(!halo||!canAnimate()){stop();return;}
    x+=(tx-x)*.24;y+=(ty-y)*.24;
    halo.style.transform='translate3d('+(x-140).toFixed(2)+'px,'+(y-140).toFixed(2)+'px,0)';
    if(Math.abs(x-tx)+Math.abs(y-ty)>.55)raf=requestAnimationFrame(draw);
  }
  document.addEventListener('pointermove',e=>{
    if(!halo||e.pointerType==='touch'||!canAnimate())return;
    tx=e.clientX;ty=e.clientY;
    if(!seen){x=tx;y=ty;seen=true;}
    halo.style.opacity='1';
    if(!raf)raf=requestAnimationFrame(draw);
  },{passive:true});
  document.addEventListener('pointerover',e=>{
    if(!halo||!canAnimate())return;
    halo.classList.toggle('is-action',!!e.target.closest?.(actionable));
  },{passive:true});
  document.addEventListener('pointerout',e=>{
    if(!halo||!canAnimate())return;
    const from=e.target.closest?.(actionable);
    if(from&&!from.contains(e.relatedTarget))halo.classList.remove('is-action');
  },{passive:true});
  document.addEventListener('pointerdown',e=>{
    if(!halo||!canAnimate()||e.pointerType==='touch')return;
    if(e.target.closest?.(actionable))halo.classList.add('is-clicked');
  },{passive:true});
  for(const event of ['pointerup','pointercancel'])document.addEventListener(event,()=>halo?.classList.remove('is-clicked'),{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  document.addEventListener('portfolio:motion',()=>{if(!canAnimate())stop();});
  reduced.addEventListener?.('change',()=>{if(!canAnimate())stop();});
  fine.addEventListener?.('change',()=>{if(!canAnimate())stop();});
  // An unobtrusive contextual compass only appears in sections with actual
  // interaction. It complements the opt-in Kio tour; it never traps focus.
  const sections=[
    ['riftProjects','Choose a project to open its complete case study.'],
    ['universe','Drag to orbit, then select a district or a project.'],
    ['journey','Scroll through the worlds or choose a chapter.'],
    ['motion-lab','Switch the network, memory and world visualizations.'],
    ['work','Open a case study or use the project filters.'],
    ['prooflab','Change a parameter and inspect what the model shows.'],
    ['dimensions','Drag the object, flip it and switch disciplines.'],
    ['archive','Search by project or technology to find more work.']
  ].map(([id,message])=>({node:document.getElementById(id),message})).filter(x=>x.node);
  let dismissed=false;
  try{dismissed=sessionStorage.getItem('dk-hide-explore-cue')==='true';}catch{}
  if(sections.length&&!dismissed){
    const cue=document.createElement('aside');
    cue.className='explore-compass';
    cue.setAttribute('aria-label','Contextual exploration help');
    cue.innerHTML='<span class="explore-compass-mark" aria-hidden="true">✳</span><div><strong>INTERACTIVE / EXPLORE</strong><p id="exploreCompassText"></p></div><button type="button" data-open-kio aria-label="Open the Kio guided tour">KIO ↗</button><button type="button" class="explore-compass-close" aria-label="Hide exploration tips">×</button>';
    document.body.append(cue);
    cue.querySelector('.explore-compass-close').addEventListener('click',()=>{
      dismissed=true;cue.remove();
      try{sessionStorage.setItem('dk-hide-explore-cue','true');}catch{}
    });
    let cueRaf=0,lastMessage='';
    function updateCue(){
      cueRaf=0;
      if(dismissed)return;
      const line=innerHeight*.56;
      const active=sections.find(x=>{
        const r=x.node.getBoundingClientRect();
        return r.top<=line&&r.bottom>=line;
      });
      const visible=!!active&&innerWidth>760;
      cue.classList.toggle('is-visible',visible);
      cue.setAttribute('aria-hidden',String(!visible));
      if(visible&&active.message!==lastMessage){
        cue.querySelector('#exploreCompassText').textContent=active.message;
        lastMessage=active.message;
      }
      cue.inert=!visible;
    }
    function scheduleCue(){if(!cueRaf)cueRaf=requestAnimationFrame(updateCue);}
    addEventListener('scroll',scheduleCue,{passive:true});
    addEventListener('resize',scheduleCue,{passive:true});
    updateCue();
  }
  document.addEventListener('click',e=>{
    const guide=e.target.closest?.('[data-open-kio]');
    if(!guide)return;
    e.preventDefault();
    const toggle=document.getElementById('v6GuideToggle');
    if(toggle)toggle.click();
    else document.getElementById('kioLaunch')?.click();
  });
})();