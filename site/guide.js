/* KIO — a bespoke animated, deterministic portfolio companion. No AI claims, no tracking. */
(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const steps = [
    { id:'top', title:'The introduction', overline:'01 / WELCOME', text:'This is Dharaksh’s portfolio. I’m Kio, your little tour guide. You can explore freely—or follow the story one stop at a time.', hint:'Begin with the work behind the visuals.', button:'Start the tour' },
    { id:'universe', title:'Enter the engineering universe', overline:'02 / WORLD', text:'Orbit a live 3D environment made from code. Pick Learning, Collaboration, AI or Creation to navigate directly into a project.', hint:'Drag to orbit, and use district controls to focus.', button:'Explore the world' },
    { id:'journey', title:'See the systems move', overline:'02 / IMMERSION', text:'This section morphs from a knowledge network into KV-cache memory and then a moving metro world. Scroll through it, or select a chapter.', hint:'Three browser-rendered scenes. No video.', button:'Enter the journey' },
    { id:'work', title:'The selected work', overline:'03 / BUILD', text:'Six featured case studies, each with technical context. Use a project’s direct Website or Research link, or open Story to see how it was made.', hint:'Try the cards and their direct links.', button:'Explore projects' },
    { id:'prooflab', title:'Try a working model', overline:'04 / PROOF LAB', text:'Change semester counts, test hypothetical team-matching factors and explore documented KV-cache measurements. These are honest explainers, not screenshots or connected production services.', hint:'Adjust the controls and see the evidence.', button:'Try the proof lab' },
    { id:'dimensions', title:'Move in three dimensions', overline:'04 / SPATIAL LAB', text:'Drag the perspective sculpture, flip its core, then try Product, AI and Spatial modes. The object is made from code, not a screenshot.', hint:'Give the floating geometry a spin.', button:'Try the 3D lab' },
    { id:'archive', title:'The supporting builds', overline:'05 / ARCHIVE', text:'Explore the curated supporting work. Search by project or technology, and open a Story for context and project status.', hint:'Six intentionally selected archive entries.', button:'Browse archive' },
    { id:'recognition', title:'Beyond the projects', overline:'06 / PROOF', text:'Find certifications, hackathon participation, independent research and technical writing. The entries distinguish evidence from experimental work.', hint:'Credentials and competition history.', button:'View credentials' },
    { id:'about', title:'Meet the builder', overline:'07 / PERSON', text:'Dharaksh studies Computer Science at SRMIST and builds across full-stack products, applied AI and immersive interfaces.', hint:'Learn about the person behind the code.', button:'Meet Dharaksh' },
    { id:'contact', title:'Your next conversation', overline:'08 / CONNECT', text:'You can download the résumé or reach Dharaksh directly by email. That is the end of the tour—thanks for exploring.', hint:'Say hello, or restart the tour anytime.', button:'Get in touch' }
  ];
  const sections = [
    {id:'top', label:'Welcome'}, {id:'universe', label:'Engineering universe'}, {id:'journey', label:'3D story'},
    {id:'work', label:'Featured work'}, {id:'prooflab', label:'Technical demos'}, {id:'dimensions', label:'3D explorer'},
    {id:'archive', label:'Archive'}, {id:'recognition', label:'Credentials'},
    {id:'about',label:'About'}, {id:'contact',label:'Contact'}
  ];
  const host = document.createElement('aside');
  host.className = 'kio-shell kio-balanced';
  host.id = 'kioGuide';
  host.setAttribute('aria-label', 'Kio, interactive portfolio tour guide');
  host.dataset.state = 'resting';
  host.innerHTML = `
    <div class="kio-hint" id="kioHint" aria-hidden="true"><span class="kio-hint-star">✦</span><span id="kioHintText">Hi! Want a guided tour?</span></div>
    <section class="kio-panel" id="kioPanel" aria-labelledby="kioPanelTitle" hidden>
      <div class="kio-top"><span class="kio-kicker"><i aria-hidden="true"></i> KIO / YOUR GUIDE</span><button type="button" class="kio-dismiss" id="kioClose" aria-label="Close portfolio guide">✕</button></div>
      <div class="kio-progress-head"><span id="kioCounter">01 / 10</span><span>AN INTERACTIVE WALKTHROUGH</span></div>
      <div class="kio-progress" role="progressbar" aria-label="Portfolio tour progress" aria-valuemin="1" aria-valuemax="10" aria-valuenow="1"><span id="kioProgressFill"></span></div>
      <div class="kio-copy" aria-live="polite" aria-atomic="true"><span class="kio-overline" id="kioOverline">01 / WELCOME</span><h2 id="kioPanelTitle">The introduction</h2><p id="kioMessage">A thoughtful tour through the work.</p></div>
      <div class="kio-waypoint"><span aria-hidden="true">↗</span><span id="kioWaypoint">The next stop is one click away.</span></div>
      <div class="kio-tour-actions"><button id="kioPrev" type="button" class="kio-prev" aria-label="Previous stop">←</button><button id="kioGo" type="button" class="kio-primary">START THE TOUR <span aria-hidden="true">↗</span></button><button id="kioNext" type="button" class="kio-next" aria-label="Next stop">→</button></div>
      <div class="kio-shortcuts-title">OR JUMP STRAIGHT TO</div>
      <div class="kio-shortcuts">
        <button type="button" data-kio-jump="universe">3D world <span>↗</span></button>
        <button type="button" data-kio-jump="work">Projects <span>↗</span></button>
        <button type="button" data-kio-jump="prooflab">Proof lab <span>↗</span></button>
        <button type="button" data-kio-jump="dimensions">3D Lab <span>↗</span></button>
        <button type="button" data-kio-jump="recognition">Credentials <span>↗</span></button>
        <a href="assets/Dharaksh_Kataria_Resume.pdf" target="_blank" rel="noopener">Résumé <span>↗</span></a>
      </div>
      <div class="kio-preference-row"><button type="button" id="kioSize" aria-pressed="false" aria-label="Switch Kio between larger and compact sizes">SMALLER KIO</button><button type="button" id="kioHide">HIDE KIO</button><button type="button" id="kioReset">RESTART TOUR</button></div>
      <p class="kio-footer-note">Scripted guidance, no AI model or data collection. Preferences stay in this browser.</p>
    </section>
    <button id="kioLaunch" class="kio-launch" type="button" aria-label="Open Kio portfolio guide" aria-controls="kioPanel" aria-expanded="false" title="Open the guided tour">
      <span class="kio-aura" aria-hidden="true"></span>
      <svg class="kio-person" viewBox="0 0 240 284" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="kio-skin" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff4dc"/><stop offset=".58" stop-color="#e5af86"/><stop offset="1" stop-color="#c98260"/></linearGradient>
          <linearGradient id="kio-jacket" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#416a56"/><stop offset=".57" stop-color="#233b32"/><stop offset="1" stop-color="#122821"/></linearGradient>
          <linearGradient id="kio-hair" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4b3b33"/><stop offset=".55" stop-color="#282826"/><stop offset="1" stop-color="#181f1c"/></linearGradient>
          <linearGradient id="kio-pants" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#3f4b48"/><stop offset="1" stop-color="#1b2524"/></linearGradient>
          <radialGradient id="kio-glow"><stop stop-color="#fba778" stop-opacity=".5"/><stop offset="1" stop-color="#fba778" stop-opacity="0"/></radialGradient>
        </defs>
        <ellipse class="kio-ground" cx="122" cy="270" rx="64" ry="9" fill="#000" opacity=".17"/>
        <g class="kio-figure">
          <g class="kio-leg kio-leg-back">
            <path d="M109 205L103 251L83 253L82 244L88 200Z" fill="url(#kio-pants)" stroke="#1f302b" stroke-width="2.5"/>
            <path d="M79 248L103 247Q109 257 104 264H72Q65 259 72 253Z" fill="#1e2928" stroke="#131a18" stroke-width="2.5"/>
            <path d="M76 255H100" stroke="#c18e70" stroke-width="2" opacity=".7"/>
          </g>
          <g class="kio-leg kio-leg-front">
            <path d="M132 206L144 249L123 255L112 215Z" fill="url(#kio-pants)" stroke="#1f302b" stroke-width="2.5"/>
            <path d="M123 250L146 249Q157 254 157 263L120 264Q114 259 123 250Z" fill="#23302e" stroke="#131a18" stroke-width="2.5"/>
            <path d="M128 256H152" stroke="#c18e70" stroke-width="2" opacity=".7"/>
          </g>
          <g class="kio-arm kio-arm-left">
            <path d="M90 150Q70 163 67 191Q63 204 76 210Q86 214 92 202L105 181Z" fill="#2d4a3d" stroke="#19342c" stroke-width="3"/>
            <path d="M69 199Q63 208 70 214Q77 220 85 212L87 204Z" fill="url(#kio-skin)" stroke="#b47b5d" stroke-width="2"/>
          </g>
          <g class="kio-torso">
            <path d="M102 138Q113 132 133 136Q153 145 156 172L153 208Q119 225 86 207L84 168Q88 146 102 138Z" fill="url(#kio-jacket)" stroke="#142920" stroke-width="3.4"/>
            <path d="M108 142L119 160L132 141" stroke="#da9b71" stroke-width="9" fill="none" stroke-linejoin="round"/>
            <path d="M112 153L121 168L131 153" stroke="#f6d9ad" stroke-width="2.5" fill="none" stroke-linecap="round"/>
            <path d="M119 160V212" stroke="#091f18" stroke-width="2.5" opacity=".7"/>
            <path d="M92 193Q100 198 109 196" stroke="#547462" stroke-width="2.5" fill="none"/>
            <rect x="133" y="173" width="15" height="17" rx="3" fill="#172b24" stroke="#729784" stroke-width="1.2"/>
            <path d="M138 180H144M141 176V185" stroke="#e49e72" stroke-width="1.5" stroke-linecap="round"/>
            <path d="M87 206Q118 221 153 207" stroke="#d17755" stroke-width="5" stroke-linecap="round"/>
          </g>
          <g class="kio-arm kio-arm-right">
            <path d="M147 154Q166 157 171 183L178 198Q185 205 195 195" stroke="#1f382e" stroke-width="27" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <path d="M151 155Q170 157 175 186L180 197Q187 200 194 193" stroke="#527361" stroke-width="14" stroke-linecap="round" fill="none"/>
            <g class="kio-hand">
              <path d="M185 199Q178 193 181 187Q183 182 188 184L192 189L187 174Q187 169 191 168Q195 168 197 173L201 186L198 166Q198 161 202 162Q207 162 207 168L209 186L210 173Q212 168 216 172Q219 175 218 181L215 193Q224 185 227 190Q230 195 222 201L206 214Q194 211 185 199Z" fill="url(#kio-skin)" stroke="#a86c54" stroke-width="2.5" stroke-linejoin="round"/>
              <path d="M196 187L199 193M206 187L207 194M214 188L213 195" stroke="#9b6651" stroke-width="1.6" stroke-linecap="round"/>
            </g>
          </g>
          <g class="kio-neck"><path d="M111 132L111 151Q118 160 131 152L132 128" fill="url(#kio-skin)" stroke="#b98261" stroke-width="2.5"/></g>
          <g class="kio-head">
            <path d="M70 67Q66 26 107 22Q149 14 166 53Q180 91 160 123Q151 144 120 147Q81 143 69 115Z" fill="url(#kio-hair)" stroke="#202723" stroke-width="3"/>
            <ellipse cx="72" cy="96" rx="14" ry="19" fill="url(#kio-skin)" stroke="#b78060" stroke-width="2.5"/>
            <ellipse cx="170" cy="97" rx="12" ry="18" fill="url(#kio-skin)" stroke="#b78060" stroke-width="2.5"/>
            <path d="M72 86Q72 47 115 41Q159 41 169 83L164 118Q151 143 121 145Q88 145 75 115Z" fill="url(#kio-skin)" stroke="#b78060" stroke-width="2.7"/>
            <path d="M81 55Q104 19 143 35Q163 44 167 70Q155 65 143 53Q128 71 104 71Q86 70 77 81Z" fill="url(#kio-hair)"/>
            <path d="M83 49Q98 19 136 26Q169 31 175 62Q158 57 145 44Q125 68 92 65Z" fill="url(#kio-hair)"/>
            <path d="M100 38Q125 31 140 38" stroke="#6e665b" stroke-width="5" stroke-linecap="round" opacity=".3"/>
            <path d="M90 91Q101 86 110 90M133 91Q143 86 151 92" stroke="#4d3931" stroke-width="3.4" fill="none" stroke-linecap="round"/>
            <g class="kio-eyes">
              <ellipse cx="103" cy="101" rx="10" ry="13" fill="#fff8ef"/>
              <ellipse cx="142" cy="102" rx="10" ry="13" fill="#fff8ef"/>
              <g class="kio-pupils"><ellipse cx="104" cy="102" rx="5" ry="8" fill="#25332c"/><ellipse cx="143" cy="103" rx="5" ry="8" fill="#25332c"/><circle cx="105" cy="98" r="2" fill="#fff"/><circle cx="144" cy="99" r="2" fill="#fff"/></g>
            </g>
            <ellipse cx="89" cy="117" rx="12" ry="6" fill="#d97c69" opacity=".38"/>
            <ellipse cx="155" cy="117" rx="11" ry="6" fill="#d97c69" opacity=".38"/>
            <path d="M122 105Q115 117 124 118" stroke="#b57b61" stroke-width="2.3" stroke-linecap="round" fill="none"/>
            <path class="kio-mouth" d="M110 127Q122 138 136 126" stroke="#703e38" stroke-width="3" stroke-linecap="round" fill="none"/>
            <path d="M73 89Q69 64 81 50" stroke="#151e1c" stroke-width="5" fill="none" opacity=".6"/>
            <path d="M164 77L175 85L171 100" stroke="#151e1c" stroke-width="5" fill="none" opacity=".6"/>
          </g>
          <g class="kio-device"><rect x="93" y="158" width="11" height="13" rx="4" fill="#e7a177" stroke="#774f42" stroke-width="1.5"/><circle cx="98.5" cy="164.5" r="2.4" fill="#1e3f36"/></g>
        </g>
        <g class="kio-sparkles" fill="none" stroke="#eaa17b" stroke-width="2.2" stroke-linecap="round"><path d="M185 64V47M176 55H194"/><path d="M45 107V94M39 100H51"/><circle cx="198" cy="115" r="2.5" fill="#eaa17b" stroke="none"/></g>
      </svg>
      <span class="kio-launch-label"><strong>MEET KIO</strong><small>YOUR SITE GUIDE <span aria-hidden="true">↗</span></small></span>
      <span class="kio-online-dot" aria-hidden="true"></span>
    </button>`;
  document.body.append(host);

  const $ = (q) => host.querySelector(q);
  const panel=$('#kioPanel'), launcher=$('#kioLaunch'), hint=$('#kioHint');
  const title=$('#kioPanelTitle'), copy=$('#kioMessage'), counter=$('#kioCounter'), progress=$('#kioProgressFill');
  const overline=$('#kioOverline'), waypoint=$('#kioWaypoint'), go=$('#kioGo'), prev=$('#kioPrev'), next=$('#kioNext');
  const prefKey='dk-kio-preferences-v6';
  const readPrefs=()=>{try{return JSON.parse(localStorage.getItem(prefKey)||'{}')}catch{return {}}};
  let prefs=readPrefs();
  if(!prefs || typeof prefs!=='object' || Array.isArray(prefs))prefs={};
  const savePrefs=()=>{try{localStorage.setItem(prefKey,JSON.stringify(prefs))}catch{}};
  // Medium-size guide is the readable default. Compact remains an optional preference.
  function renderSize(){
    const compact=prefs.size==='compact';
    host.classList.toggle('kio-compact',compact);
    host.classList.toggle('kio-balanced',!compact);
    const toggle=host.querySelector('#kioSize');
    if(toggle){toggle.textContent=compact?'LARGER KIO':'SMALLER KIO';toggle.setAttribute('aria-pressed',String(compact));}
  }
  let index=Math.max(0,Math.min(steps.length-1,Number(prefs.lastStep)||0)), opened=false, tourActive=false, lock=false, lastFocused=null;
  const toggleButton=document.getElementById('v6GuideToggle');
  function refreshPref(){host.classList.toggle('kio-suppressed',!!prefs.hidden);if(toggleButton){toggleButton.setAttribute('aria-pressed',String(opened));toggleButton.title=prefs.hidden?'Show Kio guide':(opened?'Close guide panel':'Open Kio guide');toggleButton.querySelector('span').textContent=prefs.hidden?'○':'✳'}}
  function setHidden(value){prefs.hidden=!!value;savePrefs();if(value&&opened)setOpen(false);refreshPref()}
  toggleButton?.addEventListener('click',()=>{if(prefs.hidden){setHidden(false);setOpen(true);}else setOpen(!opened)});
  let currentSection='top', hintTimer=0, scrollTimer=0, tourTimer=0, gestureTimer=0;
  const still=()=>reduced.matches||root.classList.contains('motion-off');
  function position(){
    const s=steps[index];
    title.textContent=s.title;copy.textContent=s.text;counter.textContent=String(index+1).padStart(2,'0')+' / '+String(steps.length).padStart(2,'0');
    overline.textContent=s.overline;waypoint.textContent=s.hint;
    go.querySelector('span').textContent='↗';go.firstChild.textContent=s.button.toUpperCase()+' ';
    progress.style.width=String((index+1)/steps.length*100)+'%';
    $('.kio-progress').setAttribute('aria-valuenow',String(index+1));
    prev.disabled=index===0;next.disabled=index===steps.length-1;
    next.setAttribute('aria-label', index===steps.length-1?'End of tour':'Next stop: '+steps[index+1]?.title);
    if(tourActive) host.dataset.mood=index===steps.length-1?'celebrate':'speaking';
    prefs.lastStep=index;if(index===steps.length-1 && tourActive){prefs.completed=true;}savePrefs();
  }
  const hideIfModal = ()=>{
    const modalVisible = ['caseOverlay','commandPalette'].some(id=>{
      const el=document.getElementById(id);return el&&!el.hidden;
    });
    host.classList.toggle('kio-behind-modal',modalVisible);
  };
  function setOpen(value){
    opened=!!value;
    prefs.minimized=!opened;savePrefs();
    if(opened) {
      if(!tourActive)index=Math.max(0,steps.findIndex(step=>step.id===currentSection));
      const destination=document.getElementById(steps[index].id);
      destination?.prepend(host);
    }
    panel.hidden=!opened;
    launcher.setAttribute('aria-expanded',String(opened));
    launcher.setAttribute('aria-label',opened?'Close Kio portfolio guide':'Open Kio portfolio guide');
    host.classList.toggle('kio-open',opened);
    host.dataset.state=opened?'talking':'resting';
    host.dataset.mood=opened?'speaking':'idle';
    hint.classList.remove('kio-hint-visible');clearTimeout(hintTimer);refreshPref();
    if(opened){lastFocused=document.activeElement;position();$('#kioClose').focus({preventScroll:true});}
    else {
      tourActive=false;lock=false;clearTimeout(tourTimer);clearTimeout(gestureTimer);
      document.querySelectorAll('.kio-target').forEach(node=>node.classList.remove('kio-target'));
      host.dataset.mood='idle';
      const restore=lastFocused?.isConnected && !host.contains(lastFocused)?lastFocused:toggleButton;
      restore?.focus({preventScroll:true});
    }
  }
  function moveTo(step,{navigate=true}={}){
    index=Math.min(steps.length-1,Math.max(0,step));
    tourActive=true;position();
    if(!navigate)return;
    const destination=document.getElementById(steps[index].id);
    if(!destination)return;
    clearTimeout(tourTimer);
    destination.prepend(host);
    lock=true;
    destination.scrollIntoView({behavior:still()?'instant':'smooth',block:'start'});
    document.querySelectorAll('.kio-target').forEach(el=>el.classList.remove('kio-target'));
    destination.classList.add('kio-target');
    tourTimer=window.setTimeout(()=>{destination.classList.remove('kio-target');lock=false},still()?0:650);
    if(index===steps.length-1)host.dataset.mood='celebrate';
  }
  launcher.addEventListener('click',()=>{if(prefs.hidden)setHidden(false);setOpen(!opened)});
  $('#kioClose').addEventListener('click',()=>setOpen(false));
  $('#kioSize').addEventListener('click',()=>{prefs.size=prefs.size==='compact'?'balanced':'compact';savePrefs();renderSize();});
  $('#kioHide').addEventListener('click',()=>setHidden(true));
  $('#kioReset').addEventListener('click',()=>{prefs.completed=false;prefs.lastStep=0;savePrefs();moveTo(0)});
  prev.addEventListener('click',()=>moveTo(index-1));
  next.addEventListener('click',()=>moveTo(index+1));
  go.addEventListener('click',()=>moveTo(index===0?1:index));
  host.querySelectorAll('[data-kio-jump]').forEach(btn=>btn.addEventListener('click',()=>{
    const idx=steps.findIndex(s=>s.id===btn.dataset.kioJump);
    if(idx!==-1)moveTo(idx);
  }));
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&opened){setOpen(false);return;}
    if(e.altKey&&e.key.toLowerCase()==='g'&&!e.repeat){e.preventDefault();setOpen(!opened);}
  });
  // Eyes follow the visitor's pointer without an unbounded animation loop.
  if(window.matchMedia('(pointer:fine)').matches){
    let req=0,px=0,py=0;
    window.addEventListener('pointermove',e=>{
      if(still()||document.hidden)return;
      const r=launcher.getBoundingClientRect();
      const x=r.left+r.width*.5,y=r.top+r.height*.45;
      px=Math.max(-2.5,Math.min(2.5,(e.clientX-x)/155));
      py=Math.max(-1.7,Math.min(1.7,(e.clientY-y)/195));
      if(!req)req=requestAnimationFrame(()=>{req=0;host.style.setProperty('--kio-eye-x',px.toFixed(2)+'px');host.style.setProperty('--kio-eye-y',py.toFixed(2)+'px')});
    },{passive:true});
  }
  launcher.addEventListener('pointerenter',()=>{if(!still()&&!opened)host.dataset.mood='wave';});
  launcher.addEventListener('pointerleave',()=>{if(!opened)host.dataset.mood='idle';});
  // Change the unobtrusive prompt to match the section. Never take over scrolling.
  function onScroll(){
    if(lock||tourActive)return;
    let closest='top', best=Infinity;
    for(const section of sections){
      const el=document.getElementById(section.id);if(!el)continue;
      const r=el.getBoundingClientRect();
      if(r.bottom<120)continue;
      const d=Math.abs(r.top-window.innerHeight*.32);if(d<best){best=d;closest=section.id;}
    }
    if(closest!==currentSection){
      currentSection=closest;
      const label=sections.find(s=>s.id===closest)?.label;
      host.dataset.section=closest;
      if(opened){index=Math.max(0,steps.findIndex(step=>step.id===closest));position();}
      if(!hint.classList.contains('kio-hint-visible'))$('#kioHintText').textContent='Exploring: '+label;
    }
  }
  window.addEventListener('scroll',()=>{if(scrollTimer)return;scrollTimer=requestAnimationFrame(()=>{scrollTimer=0;onScroll();});},{passive:true});
  const mo=new MutationObserver(hideIfModal);
  for(const id of ['caseOverlay','commandPalette']){
    const node=document.getElementById(id);if(node)mo.observe(node,{attributes:true,attributeFilter:['hidden']});
  }
  reduced.addEventListener?.('change',()=>host.classList.toggle('kio-reduced',still()));
  document.addEventListener('portfolio:motion',()=>host.classList.toggle('kio-reduced',still()));
  host.classList.toggle('kio-reduced',still());
  renderSize();position();onScroll();hideIfModal();refreshPref();
  // No automatic promotional bubble: a deliberate click opens the guide.
  document.addEventListener('portfolio:case-open',()=>{host.dataset.mood='attentive'});
  document.addEventListener('portfolio:case-close',()=>{host.dataset.mood='idle'});
  function gesture(message,target){
    clearTimeout(gestureTimer);
    host.dataset.mood='pointing';
    if(opened){copy.textContent=message;
      const from=launcher.getBoundingClientRect(),to=target?.getBoundingClientRect();
      if(to)host.style.setProperty('--kio-point-angle',Math.max(-35,Math.min(25,(to.left-from.left)*.03))+'deg');
    }
    gestureTimer=setTimeout(()=>{host.dataset.mood=opened?'speaking':'idle';},900);
  }
  document.addEventListener('portfolio:world-focus',event=>{
    gesture('Exploring '+event.detail.label+'. Use the district interaction, then open its project story.',document.getElementById('worldInspectorLink'));
  });
  document.addEventListener('portfolio:project-hover',event=>{
    const project=window.PORTFOLIO?.projects.find(item=>item.id===event.detail.id);
    if(project)gesture(project.title+'. '+project.short,document.querySelector('[data-project="'+project.id+'"]'));
  });
  function interruptTour(){
    clearTimeout(tourTimer);lock=false;tourActive=false;
    document.querySelectorAll('.kio-target').forEach(node=>node.classList.remove('kio-target'));
  }
  for(const event of ['wheel','touchstart'])window.addEventListener(event,interruptTour,{passive:true});
  document.addEventListener('keydown',event=>{if(['PageDown','PageUp','Home','End'].includes(event.key))interruptTour();});
  document.addEventListener('portfolio:motion',()=>{if(still()){clearTimeout(gestureTimer);host.dataset.mood='idle';}});
  // Public, read-only interface for browser test automation or accessibility controls.
  window.portfolioGuide={open:()=>{setHidden(false);setOpen(true)},close:()=>setOpen(false),hide:()=>setHidden(true),show:()=>setHidden(false),goTo:(id)=>{const n=steps.findIndex(s=>s.id===id);if(n!==-1){setHidden(false);setOpen(true);moveTo(n);}},get state(){return {opened,index,step:steps[index].id,tourActive,hidden:!!prefs.hidden,completed:!!prefs.completed}}};
})();
