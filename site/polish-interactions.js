/* Contextual help for the interactive technical sections and the Kio tour. */
(() => {
  'use strict';
  // An unobtrusive contextual compass only appears in sections with actual
  // interaction. It complements the opt-in Kio tour; it never traps focus.
  const sections=[
    ['universe','Drag to orbit, then select a district or a project.'],
    ['journey','Scroll through the worlds or choose a chapter.'],
    ['motion-lab','Switch the network, memory and world visualizations.'],
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