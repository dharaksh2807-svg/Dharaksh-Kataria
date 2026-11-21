/* KIO — a bespoke animated, deterministic portfolio companion. No AI claims, no tracking. */
(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const steps = [
    { id:'top', label:'THE INTRODUCTION', title:'Meet the Rift.', text:'Choose a motion style, or let’s explore the projects together.', instruction:'Choose a style to change the portal. Scroll to travel through it, or use Explore the work to skip ahead.', target:'.rift-mode-switcher', pausedText:'Motion is paused. Let’s head straight to the projects.', pausedInstruction:'Motion controls are hidden while motion is paused. Choose Explore the work to reach the projects.' },
    { id:'universe', label:'3D WORLD', title:'Take another way in.', text:'A spatial atlas connects the projects by discipline. You can explore it with a pointer, touch or keyboard.', instruction:'Drag to orbit, or focus the scene and press 1–4 to choose a district. Select a project object, then open its story.', target:'#worldShell' },
    { id:'journey', label:'ENGINEERING STUDIES', title:'See the idea move.', text:'Three conceptual studies explore learning, memory and procedural worlds. The case studies hold the implementation evidence.', instruction:'Scroll through the three studies, or choose a numbered chapter. Each scene explains a different engineering idea.', target:'#journeyScroll' },
    { id:'work', label:'SELECTED WORK', title:'Look inside the work.', text:'Six projects, with the decisions and evidence behind each build. Point to one and I’ll introduce it.', instruction:'Filter by discipline, then open a case study for architecture, decisions and evidence.', target:'#projectFilters' },
    { id:'prooflab', label:'PROOF LAB', title:'Try the mechanism.', text:'Change an input and inspect the response. Study and Match are illustrative models, while Memory uses recorded experiments.', instruction:'Choose Study, Match or Memory. Adjust the semester, matching sliders or cache budget to inspect the result.', target:'#proofFrame' },
    { id:'dimensions', label:'SPATIAL STUDY', title:'Give it a turn.', text:'This CSS sculpture is a small hands-on study in perspective and interaction.', instruction:'Drag the sculpture, flip its core, then compare Product, AI and Spatial modes.', target:'#dimensions' },
    { id:'archive', label:'SUPPORTING WORK', title:'Follow a side path.', text:'Supporting builds and prototypes live here, each with its own context and status.', instruction:'Search by project or technology. Open a Story for the context and status of a supporting build.', target:'#archiveSearch' },
    { id:'recognition', label:'CREDENTIALS', title:'Check the record.', text:'Public issuer records are linked where available. Owner-reported credentials and participation are labeled.', instruction:'Open an issuer record to verify a credential. For engineering evidence, follow the research and project links.', target:'#credentialGrid' },
    { id:'about', label:'ABOUT DHARAKSH', title:'Meet the builder.', text:'Dharaksh studies Computer Science at SRMIST and builds across products, applied AI and interactive graphics.', instruction:'Read the background, download the résumé, or follow the GitHub and LinkedIn links.', target:'#about' },
    { id:'motion-lab', label:'CANVAS STUDIES', title:'Compare the renders.', text:'Three small rendering studies explore networks, memory and procedural motion.', instruction:'Choose Network, Memory or Worlds, then move your pointer across the field to explore the parallax.', target:'#signalStage' },
    { id:'timeline', label:'PROJECT TIMELINE', title:'Trace the builds.', text:'The timeline follows the work as it developed through 2026.', instruction:'Drag or scroll the timeline horizontally, or use its arrow buttons. A milestone opens its case study.', target:'#timelineRail' },
    { id:'lab', label:'HOW I BUILD', title:'Look at the approach.', text:'These four disciplines connect product work, applied AI, real-time graphics and validation.', instruction:'Open a discipline to see its approach and tools. The project case studies show how those choices were applied.', target:'#labAccordion' },
    { id:'capabilities', label:'ENGINEERING ATLAS', title:'Connect tools to work.', text:'The atlas links each engineering discipline to technologies and actual projects.', instruction:'Choose a discipline to update the tools and project examples, then open the related case study.', target:'#atlasTabs' },
    { id:'contact', label:'GET IN TOUCH', title:'Start a conversation.', text:'Have a project in mind? The email and résumé links are right here.', instruction:'Choose the email link, or Copy address to use another mail app. Include your scope, timeline and relevant links.', target:'#contact' }
  ];
  const legacyOrder=['top','universe','journey','work','prooflab','dimensions','archive','recognition','about','contact'];
  steps.sort((a,b)=>document.getElementById(a.id).compareDocumentPosition(document.getElementById(b.id)) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
  const host = document.createElement('aside');
  host.className = 'kio-shell';
  host.id = 'kioGuide';
  host.setAttribute('aria-label', 'Kio, interactive portfolio companion');
  host.dataset.state = 'idle';
  host.innerHTML = `
    <section class="kio-panel" id="kioPanel" role="dialog" aria-modal="false" aria-labelledby="kioPanelTitle" aria-describedby="kioMessage" tabindex="-1" hidden>
      <div class="kio-top"><span class="kio-kicker">KIO / YOUR SITE GUIDE</span><div class="kio-window-actions"><button type="button" id="kioExpand" aria-label="Expand guide details">Expand</button><button type="button" id="kioHide" title="Hide Kio. Reopen with GUIDE.">Hide</button><button type="button" class="kio-dismiss" id="kioClose" aria-label="Minimize Kio companion" title="Minimize Kio">−</button></div></div>
      <div class="kio-progress"><span id="kioProgressLabel">Choose your way in</span><span id="kioStepCount"></span><progress id="kioProgress" max="${steps.length}" value="1" aria-label="Tour position"></progress></div>
      <div class="kio-panel-scroll">
        <div class="kio-character-hero">
          <div class="kio-character-slot" id="kioCharacterSlot"></div>
          <div class="kio-character-note"><p class="kio-character-title">Kio<em>.</em></p><p class="kio-character-caption">A little company.<br>A clearer way around.</p><div class="kio-play-actions"><button id="kioHello" type="button">Say hello</button><button id="kioGreet" type="button" aria-label="High five with Kio">High five <span aria-hidden="true">✦</span></button></div></div>
        </div>
        <div class="kio-copy" aria-live="polite" aria-atomic="true"><span class="kio-overline" id="kioOverline">THE INTRODUCTION</span><h2 id="kioPanelTitle">Meet the Rift.</h2><p id="kioMessage">Choose a direction and I’ll point it out.</p></div>
        <nav class="kio-shortcuts" aria-label="Quick portfolio routes"><button type="button" data-kio-jump="work">See the work</button><button type="button" data-kio-jump="about">Meet Dharaksh</button><button type="button" data-kio-jump="contact">Get in touch</button></nav>
        <details class="kio-options" id="kioOptions"><summary>All tour stops <span aria-hidden="true">＋</span></summary><div class="kio-options-body"><label for="kioJump">Where would you like to go?</label><select id="kioJump">${steps.map(step=>`<option value="${step.id}">${step.label}</option>`).join('')}</select><div class="kio-route-actions"><button type="button" id="kioPrev">Previous stop</button><button type="button" id="kioReset">Restart tour</button></div><p class="kio-footer-note">A handcrafted tour. Your place stays in this browser. Reopen anytime with GUIDE.</p></div></details>
      </div>
      <div class="kio-tour-actions"><a id="kioGo" class="kio-primary" href="#top"><span id="kioActionLabel">Explore projects</span><span aria-hidden="true">✦</span></a><div class="kio-secondary-actions"><button id="kioAbout" type="button">How to explore</button><button id="kioNext" type="button">Next stop</button></div><button type="button" id="kioLater" class="kio-later">Continue later <span>Your place is saved</span></button></div>
    </section>
    <button id="kioLaunch" class="kio-launch" type="button" aria-label="Open Kio portfolio guide" aria-controls="kioPanel" aria-expanded="false" title="Open the guided tour">
      <svg class="kio-person" viewBox="0 0 240 284" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="kio-skin" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff4dc"/><stop offset=".58" stop-color="#e5af86"/><stop offset="1" stop-color="#c98260"/></linearGradient>
          <linearGradient id="kio-jacket" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#416a56"/><stop offset=".57" stop-color="#233b32"/><stop offset="1" stop-color="#122821"/></linearGradient>
          <linearGradient id="kio-hair" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#4b3b33"/><stop offset=".55" stop-color="#282826"/><stop offset="1" stop-color="#181f1c"/></linearGradient>
          <linearGradient id="kio-pants" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#3f4b48"/><stop offset="1" stop-color="#1b2524"/></linearGradient>
          <radialGradient id="kio-glow"><stop stop-color="#fba778" stop-opacity=".5"/><stop offset="1" stop-color="#fba778" stop-opacity="0"/></radialGradient>
        </defs>
        <ellipse class="kio-ground" cx="122" cy="270" rx="64" ry="9" fill="#000" opacity=".17"/>
        <g class="kio-figure"><g class="kio-pose">
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
            <g class="kio-hand-left"><path d="M69 199Q63 208 70 214Q77 220 85 212L87 204Z" fill="url(#kio-skin)" stroke="#b47b5d" stroke-width="2"/></g>
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
            <path d="M151 157Q167 160 173 184" stroke="#1f382e" stroke-width="27" stroke-linecap="round" fill="none"/>
            <path d="M151 157Q167 160 173 184" stroke="#527361" stroke-width="14" stroke-linecap="round" fill="none"/>
            <g class="kio-forearm-right">
              <path d="M173 184L180 197Q187 201 194 193" stroke="#1f382e" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <path d="M173 184L180 197Q187 201 194 193" stroke="#527361" stroke-width="12" stroke-linecap="round" fill="none"/>
            <g class="kio-hand">
              <path d="M185 199Q178 193 181 187Q183 182 188 184L192 189L187 174Q187 169 191 168Q195 168 197 173L201 186L198 166Q198 161 202 162Q207 162 207 168L209 186L210 173Q212 168 216 172Q219 175 218 181L215 193Q224 185 227 190Q230 195 222 201L206 214Q194 211 185 199Z" fill="url(#kio-skin)" stroke="#a86c54" stroke-width="2.5" stroke-linejoin="round"/>
              <path d="M196 187L199 193M206 187L207 194M214 188L213 195" stroke="#9b6651" stroke-width="1.6" stroke-linecap="round"/>
            </g>
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
            <g class="kio-brows" stroke="#4d3931" stroke-width="3.4" fill="none" stroke-linecap="round"><path class="kio-brow-left" d="M90 91Q101 86 110 90"/><path class="kio-brow-right" d="M133 91Q143 86 151 92"/></g>
            <g class="kio-eyes">
              <ellipse cx="103" cy="101" rx="10" ry="13" fill="#fff8ef"/>
              <ellipse cx="142" cy="102" rx="10" ry="13" fill="#fff8ef"/>
              <g class="kio-pupils"><ellipse cx="104" cy="102" rx="5" ry="8" fill="#25332c"/><ellipse cx="143" cy="103" rx="5" ry="8" fill="#25332c"/><circle cx="105" cy="98" r="2" fill="#fff"/><circle cx="144" cy="99" r="2" fill="#fff"/></g>
            </g>
            <ellipse cx="89" cy="117" rx="12" ry="6" fill="#d97c69" opacity=".38"/>
            <ellipse cx="155" cy="117" rx="11" ry="6" fill="#d97c69" opacity=".38"/>
            <path d="M122 105Q115 117 124 118" stroke="#b57b61" stroke-width="2.3" stroke-linecap="round" fill="none"/>
            <path class="kio-mouth kio-mouth-neutral" d="M110 127Q122 138 136 126" stroke="#703e38" stroke-width="3" stroke-linecap="round" fill="none"/>
            <g class="kio-mouth-expression kio-mouth-happy"><path d="M109 124Q123 132 137 123Q135 140 123 141Q112 138 109 124Z" fill="#754039"/><path d="M112 127Q123 133 134 126" stroke="#fff4df" stroke-width="3" fill="none" stroke-linecap="round"/></g>
            <path class="kio-mouth-expression kio-mouth-thought" d="M113 130Q123 126 134 129" stroke="#703e38" stroke-width="3" fill="none" stroke-linecap="round"/>
            <ellipse class="kio-mouth-expression kio-mouth-curious" cx="124" cy="130" rx="4" ry="5" fill="#754039"/>
            <path d="M73 89Q69 64 81 50" stroke="#151e1c" stroke-width="5" fill="none" opacity=".6"/>
            <path d="M164 77L175 85L171 100" stroke="#151e1c" stroke-width="5" fill="none" opacity=".6"/>
          </g>
          <g class="kio-device"><rect x="93" y="158" width="11" height="13" rx="4" fill="#e7a177" stroke="#774f42" stroke-width="1.5"/><circle cx="98.5" cy="164.5" r="2.4" fill="#1e3f36"/></g>
        </g>
        </g>
        <g class="kio-sparkles" fill="none" stroke="#eaa17b" stroke-width="2.2" stroke-linecap="round"><path d="M185 64V47M176 55H194"/><path d="M45 107V94M39 100H51"/><circle cx="198" cy="115" r="2.5" fill="#eaa17b" stroke="none"/></g>
      </svg>
      <span class="kio-launch-label"><strong>KIO</strong><small>SITE GUIDE <span aria-hidden="true">↗</span></small></span>
    </button>`;
  document.body.append(host);

  const $ = (q) => host.querySelector(q);
  const panel=$('#kioPanel'), launcher=$('#kioLaunch');
  const panelScroll=$('.kio-panel-scroll'), characterSlot=$('#kioCharacterSlot');
  const person=$('.kio-person'), options=$('#kioOptions');
  const title=$('#kioPanelTitle'), copy=$('#kioMessage');
  const overline=$('#kioOverline'), go=$('#kioGo'), prev=$('#kioPrev'), next=$('#kioNext'), jump=$('#kioJump');
  const prefKey='dk-kio-preferences-v6';
  const readPrefs=()=>{try{return JSON.parse(localStorage.getItem(prefKey)||'{}')}catch{return {}}};
  let prefs=readPrefs();
  if(!prefs || typeof prefs!=='object' || Array.isArray(prefs))prefs={};
  const savePrefs=()=>{try{localStorage.setItem(prefKey,JSON.stringify(prefs))}catch{}};
  // Honor the existing panel-size preference without another visible size control.
  host.classList.toggle('kio-compact',prefs.size!=='balanced');
  const savedStep=prefs.lastStepId||legacyOrder[Number(prefs.lastStep)||0];
  let index=Math.max(0,steps.findIndex(step=>step.id===savedStep)), opened=false, tourActive=false, lock=false, lastFocused=null;
  const toggleButton=document.getElementById('v6GuideToggle');
  function refreshPref(){
    host.classList.toggle('kio-suppressed',!!prefs.hidden);
    if(toggleButton){
      toggleButton.setAttribute('aria-pressed',String(opened));
      toggleButton.setAttribute('aria-expanded',String(opened));
      toggleButton.setAttribute('aria-label',opened?'Close Kio guide':'Open Kio guide');
      toggleButton.title=opened?'Close Kio guide':'Open Kio guide';
    }
  }
  function setHidden(value){prefs.hidden=!!value;savePrefs();if(value&&opened)setOpen(false);refreshPref();if(!value&&!opened)launcherSafety();syncCharacterMotion()}
  toggleButton?.addEventListener('click',()=>{if(prefs.hidden){setHidden(false);setOpen(true);}else setOpen(!opened)});
  let currentSection='top', scrollTimer=0, tourTimer=0, highlightTimer=0;
  let activeProject=null, panelMotion=null;
  const still=()=>reduced.matches||root.classList.contains('motion-off');
  const actionLabels={top:'Explore projects',work:'Explore the projects',universe:'Enter the 3D world',journey:'Explore the studies',prooflab:'Try the proof lab',dimensions:'Try the sculpture',archive:'Browse supporting work',recognition:'View credentials',about:'Meet Dharaksh','motion-lab':'Explore canvas studies',timeline:'Follow the timeline',lab:'Explore the approach',capabilities:'Explore the atlas',contact:'Find contact details'};
  const introPaused=()=>still()||root.classList.contains('rift-static');
  function guidance(step,detailed=false){
    if(step.id==='top'&&introPaused())return detailed?step.pausedInstruction:step.pausedText;
    return detailed?step.instruction:step.text;
  }
  // One finite gesture at a time. The SVG keeps its joints in local coordinates.
  const characterStates=new Set(['idle','curious','wave','happy','thinking','explaining','pointing','celebrating','sleeping']);
  const celebratedStops=new Set(), gestures=new Map();
  let gestureStarts=new Map();
  let stateTimer=0, sleepTimer=0, eyeFrame=0, flight=null, characterPaused=false;
  let hovering=false, greetingCount=0, inViewport=true;
  let lastHoverGreeting=-Infinity;
  const calmState=()=>opened?'explaining':hovering?'curious':'idle';
  function cancelGestures(){
    for(const animation of gestures.values())animation.cancel();
    gestures.clear();
  }
  function settleLater(){
    clearTimeout(sleepTimer);
    if(!opened&&!characterPaused&&!hovering){
      sleepTimer=setTimeout(()=>setCharacterState('sleeping'),28000);
    }
  }
  function animatePart(selector, poses, duration){
    const part=typeof selector==='string'?$(selector):selector;
    const start=gestureStarts.get(part)||getComputedStyle(part).transform;
    gestures.get(part)?.cancel();
    const finish=getComputedStyle(part).transform;
    const frames=[{transform:start},...poses.map(transform=>({transform})),{transform:finish}];
    const animation=part.animate(frames,{duration,easing:'cubic-bezier(.35,0,.2,1)'});
    gestures.set(part,animation);
    animation.finished.then(()=>{if(gestures.get(part)===animation)gestures.delete(part);}).catch(()=>{});
  }
  function setCharacterState(state,{duration=0,animate=true}={}){
    if(!characterStates.has(state))return;
    clearTimeout(stateTimer);clearTimeout(sleepTimer);
    gestureStarts=new Map([...gestures.keys()].map(part=>[part,getComputedStyle(part).transform]));
    host.dataset.state=state;
    cancelGestures();
    if(animate&&!characterPaused&&!still()){
      if(state==='wave'){
        animatePart('.kio-arm-right',['rotate(5deg)','rotate(-32deg)','rotate(-30deg)','rotate(-27deg)'],1100);
        animatePart('.kio-forearm-right',['rotate(8deg)','rotate(-42deg)','rotate(-32deg)','rotate(-38deg)'],1100);
        animatePart('.kio-hand',['rotate(-5deg)','rotate(65deg)','rotate(80deg)','rotate(58deg)'],1100);
      }else if(state==='happy'){
        animatePart('.kio-arm-right',['rotate(9deg)','rotate(-42deg)','rotate(-38deg)','rotate(-30deg)'],1050);
        animatePart('.kio-forearm-right',['rotate(12deg)','rotate(-44deg)','rotate(-35deg)','rotate(-26deg)'],1050);
        animatePart('.kio-hand',['rotate(-12deg)','rotate(86deg) scale(1.08)','rotate(73deg)','rotate(56deg)'],1050);
        animatePart('.kio-pose',['translateY(2px)','translateY(-3px)','translateY(-1px)'],1050);
      }else if(state==='explaining'){
        animatePart('.kio-arm-right',['rotate(4deg)','rotate(-16deg)','rotate(-10deg)'],950);
        animatePart('.kio-hand',['rotate(3deg)','rotate(-12deg)','rotate(-5deg)'],950);
      }else if(state==='pointing'){
        const left=host.dataset.direction!=='right';
        animatePart(left?'.kio-arm-left':'.kio-arm-right',left?['rotate(-5deg)','rotate(60deg)','rotate(55deg)']:['rotate(5deg)','rotate(-48deg)','rotate(-42deg)'],1100);
        if(!left)animatePart('.kio-forearm-right',['rotate(4deg)','rotate(-18deg)','rotate(-12deg)'],1100);
      }else if(state==='celebrating'){
        animatePart('.kio-arm-left',['rotate(-4deg)','rotate(118deg)','rotate(108deg)'],1400);
        animatePart('.kio-arm-right',['rotate(5deg)','rotate(-69deg)','rotate(-60deg)'],1400);
        animatePart('.kio-forearm-right',['rotate(8deg)','rotate(-20deg)','rotate(-14deg)'],1400);
        animatePart('.kio-hand',['rotate(-10deg)','rotate(86deg)','rotate(72deg)'],1400);
        animatePart('.kio-pose',['translateY(3px)','translateY(-5px)','translateY(-2px)'],1400);
      }
      // Let joints omitted by the next gesture settle from their current pose.
      for(const part of gestureStarts.keys()){
        if(!gestures.has(part))animatePart(part,[],180);
      }
    }
    if(duration)stateTimer=setTimeout(()=>setCharacterState(calmState(),{animate:false}),duration);
    else if(state==='idle')settleLater();
  }
  function syncCharacterMotion(){
    characterPaused=document.hidden||prefs.hidden||host.inert||(!opened&&!inViewport)||host.classList.contains('kio-obstructed');
    host.classList.toggle('kio-reduced',still());
    host.classList.toggle('kio-paused',characterPaused);
    if(characterPaused||still()){
      cancelGestures();flight?.cancel();flight=null;
      $('.kio-copy').getAnimations().forEach(animation=>animation.cancel());
      if(panelMotion){panelMotion.cancel();panelMotion=null;panel.hidden=!opened;clearPanelExit();}
      cancelAnimationFrame(eyeFrame);eyeFrame=0;
      host.style.setProperty('--kio-eye-x','0px');host.style.setProperty('--kio-eye-y','0px');
      clearTimeout(sleepTimer);clearTimeout(stateTimer);
      if(!['idle','sleeping','explaining'].includes(host.dataset.state))host.dataset.state=calmState();
    }else if(host.dataset.state==='idle')settleLater();
  }
  function moveCharacter(before){
    flight?.cancel();flight=null;
    const after=person.getBoundingClientRect();
    if(still()||characterPaused||!before.width||!after.width)return;
    if(Math.abs(before.left-after.left)<.5&&Math.abs(before.top-after.top)<.5&&Math.abs(before.width-after.width)<.5)return;
    const scale=before.width/after.width;
    const animation=person.animate([
      {transform:`translate(${before.left-after.left}px,${before.top-after.top}px) scale(${scale})`},
      {transform:'translate(0,0) scale(1)'}
    ],{duration:380,easing:'cubic-bezier(.22,.75,.2,1)'});
    flight=animation;
    animation.finished.then(()=>{if(flight===animation){flight=null;launcherSafety();}}).catch(()=>{});
  }
  function pointAt(target){
    if(!target)return;
    const destination=target.getBoundingClientRect(), avatar=person.getBoundingClientRect();
    host.dataset.direction=destination.left+destination.width/2<avatar.left+avatar.width/2?'left':'right';
  }
  function reply(heading,message,{view='context',action=null,project=null}={}){
    host.dataset.view=view;
    activeProject=project;
    title.textContent=heading;copy.textContent=message;
    const introduction=steps[index].id==='top'&&['context','hello','highfive'].includes(view);
    const destination=view==='complete'||introduction?'work':steps[index].id;
    go.dataset.destination=destination;
    $('#kioActionLabel').textContent=action||actionLabels[destination];
    go.href=project?'projects/'+encodeURIComponent(project.id)+'.html':'#'+destination;
    next.hidden=view==='complete';
    $('#kioProgressLabel').textContent=view==='complete'?'Thanks for exploring':view==='show'?'You’re here · explore at your pace':prefs.resumeStepId===steps[index].id?'Right where we left off':'Choose a stop, or follow along';
    $('#kioStepCount').textContent=view==='complete'?'Complete':`${index+1} / ${steps.length}`;
    $('#kioProgress').value=view==='complete'?steps.length:index+1;
    const copyBlock=$('.kio-copy');
    copyBlock.getAnimations().forEach(animation=>animation.cancel());
    if(opened&&!still()&&!characterPaused)copyBlock.animate([{opacity:.45,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'});
  }
  function expandCompanion(){
    const before=person.getBoundingClientRect();
    host.classList.remove('kio-peek');
    moveCharacter(before);
  }
  function sayHello(){
    expandCompanion();
    reply('Well, hello.','I’m Kio. I can show you what’s here, or we can just trade a high-five.',{view:'hello'});
    setCharacterState('wave',{duration:1150});
  }
  function greet(){
    expandCompanion();
    greetingCount++;
    const message=['A little teamwork. Nicely done.','Still got it. One more, or shall we explore?','Our timing is getting pretty good.'][Math.min(greetingCount-1,2)];
    reply('Up here!',message,{view:'highfive'});
    setCharacterState('happy',{duration:1150});
  }
  launcher.addEventListener('pointerenter',event=>{
    if(event.pointerType==='touch'||opened)return;
    hovering=true;
    if(host.dataset.state==='happy')return;
    const now=performance.now();
    if(now-lastHoverGreeting<8000){setCharacterState('curious');return;}
    lastHoverGreeting=now;
    setCharacterState('wave',{duration:1150});
  });
  launcher.addEventListener('pointerleave',()=>{
    hovering=false;
    if(['curious','sleeping'].includes(host.dataset.state))setCharacterState(calmState());
    else settleLater();
  });
  launcher.addEventListener('focus',()=>{if(!hovering)setCharacterState('curious');});
  launcher.addEventListener('blur',()=>{if(!hovering&&host.dataset.state==='curious')setCharacterState(calmState());});
  document.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch'||characterPaused||still()||eyeFrame)return;
    const x=event.clientX,y=event.clientY;
    eyeFrame=requestAnimationFrame(()=>{
      eyeFrame=0;
      const rect=person.getBoundingClientRect(), cx=rect.left+rect.width*.51,cy=rect.top+rect.height*.36;
      host.style.setProperty('--kio-eye-x',`${Math.max(-2.8,Math.min(2.8,(x-cx)/100))}px`);
      host.style.setProperty('--kio-eye-y',`${Math.max(-1.6,Math.min(1.6,(y-cy)/140))}px`);
      if(host.dataset.state==='sleeping'&&Math.hypot(x-cx,y-cy)<180)setCharacterState('curious',{duration:1400});
    });
  },{passive:true});
  document.addEventListener('visibilitychange',syncCharacterMotion);
  const characterObserver=new IntersectionObserver(entries=>{inViewport=entries[0].isIntersecting;syncCharacterMotion();});
  characterObserver.observe(host);
  function position(){
    const step=steps[index];
    overline.textContent=step.label;host.dataset.section=step.id;
    jump.value=step.id;
    prev.disabled=index===0;
    next.innerHTML=index===steps.length-1?'Finish tour <span aria-hidden="true">✓</span>':'Next stop <span aria-hidden="true">→</span>';
    next.setAttribute('aria-label',index===steps.length-1?'Finish the tour':'Next stop: '+steps[index+1].title);
    const showing=host.dataset.view==='show';
    reply(step.title,guidance(step,showing),{view:showing?'show':'context'});
    prefs.lastStep=index;prefs.lastStepId=step.id;savePrefs();
  }
  function clearPanelExit(){
    panel.classList.remove('kio-panel-exit');
    for(const property of ['width','height','right','bottom'])panel.style.removeProperty(property);
  }
  function animatePanel(wasVisible,box){
    panelMotion?.cancel();panelMotion=null;
    clearPanelExit();
    panel.inert=!opened;
    panel.setAttribute('aria-hidden',String(!opened));
    if(still()||characterPaused||prefs.hidden||document.hidden){panel.hidden=!opened;return;}
    if(!opened){
      if(!wasVisible){panel.hidden=true;return;}
      panel.classList.add('kio-panel-exit');
      panel.style.width=box.width+'px';panel.style.height=box.height+'px';
      panel.style.right=(innerWidth-box.right)+'px';panel.style.bottom=(innerHeight-box.bottom)+'px';
    }
    panel.hidden=false;
    const animation=panel.animate(opened?[
      {opacity:0,transform:'translateY(14px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}
    ]:[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(10px)'}],{
      duration:opened?380:220,easing:'cubic-bezier(.22,.75,.2,1)'
    });
    panelMotion=animation;
    animation.finished.then(()=>{
      if(panelMotion!==animation)return;
      panelMotion=null;
      panel.hidden=!opened;
      clearPanelExit();
    }).catch(()=>{});
  }
  const hideIfModal = ()=>{
    const modalVisible = ['caseOverlay','commandPalette','mobileMenu'].some(id=>{
      const el=document.getElementById(id);return el&&!el.hidden;
    });
    host.classList.toggle('kio-behind-modal',modalVisible);
    host.inert=modalVisible;
    syncCharacterMotion();
  };
  function setOpen(value){
    if(opened===!!value)return;
    if(value&&!tourActive)onScroll();
    const before=person.getBoundingClientRect(), panelBox=panel.getBoundingClientRect();
    const wasVisible=!panel.hidden;
    panelMotion?.cancel();panelMotion=null;clearPanelExit();
    flight?.cancel();flight=null;
    opened=!!value;
    prefs.minimized=!opened;
    if(opened){
      prefs.hidden=false;
      lastFocused=document.activeElement;
      savePrefs();
      if(!tourActive)index=Math.max(0,steps.findIndex(step=>step.id===(prefs.resumeStepId||currentSection)));
    }
    if(opened)characterSlot.append(launcher);
    else host.append(launcher);
    panel.hidden=!opened;panel.inert=!opened;
    panel.setAttribute('aria-hidden',String(!opened));
    launcher.setAttribute('aria-expanded',String(opened));
    launcher.setAttribute('aria-label',opened?'Close Kio portfolio guide':'Open Kio portfolio guide');
    launcher.title=opened?'Close the guided tour':'Open the guided tour';
    host.classList.toggle('kio-open',opened);
    if(opened)host.classList.remove('kio-yielding','kio-obstructed');
    host.style.setProperty('--kio-dock-lift','0px');
    refreshPref();
    if(!opened)launcherSafety();
    syncCharacterMotion();
    if(opened){host.classList.remove('kio-peek');host.dataset.view='context';position();panelScroll.scrollTop=0;$('#kioClose').focus({preventScroll:true});}
    setCharacterState(opened?'wave':'idle',{duration:opened?1100:0});
    animatePanel(wasVisible,panelBox);
    moveCharacter(before);
    if(!opened){
      savePrefs();
      tourActive=false;lock=false;clearTimeout(tourTimer);clearTimeout(highlightTimer);
      options.open=false;
      document.querySelectorAll('.kio-target').forEach(node=>node.classList.remove('kio-target'));
      const restore=!prefs.hidden&&lastFocused?.isConnected&&lastFocused!==document.body?lastFocused:toggleButton;
      restore?.focus({preventScroll:true});
    }
  }
  function moveTo(step){
    const action=document.activeElement;
    index=Math.min(steps.length-1,Math.max(0,step));
    prefs.resumeStepId=steps[index].id;
    tourActive=true;host.classList.add('kio-peek');position();options.open=false;
    const section=document.getElementById(steps[index].id);
    if(!section)return;
    section.querySelector('details.render-study')?.setAttribute('open','');
    currentSection=steps[index].id;
    const selector=steps[index].id==='top'&&introPaused()?'.hero-action[href="#work"]':steps[index].target;
    const target=section.querySelector(selector)||section;
    clearTimeout(tourTimer);clearTimeout(highlightTimer);
    panelScroll.scrollTop=0;lock=true;
    section.scrollIntoView({behavior:still()?'instant':'smooth',block:'start'});
    document.querySelectorAll('.kio-target').forEach(node=>node.classList.remove('kio-target'));
    target.classList.add('kio-target');pointAt(target);
    reply(steps[index].title,guidance(steps[index],true),{view:'show'});
    if(host.contains(action)&&!action.getClientRects().length)next.focus({preventScroll:true});
    const milestone=['universe','dimensions'].includes(steps[index].id)&&!celebratedStops.has(steps[index].id);
    setCharacterState('thinking');
    tourTimer=setTimeout(()=>{
      lock=false;
      if(host.dataset.state==='thinking'){
        if(milestone)celebratedStops.add(steps[index].id);
        setCharacterState(milestone?'celebrating':'pointing',{duration:milestone?1400:1100});
      }
    },still()?0:650);
    highlightTimer=setTimeout(()=>target.classList.remove('kio-target'),1900);
  }
  function completeTour(){
    const finishingWithNext=document.activeElement===next;
    expandCompanion();
    tourActive=false;prefs.completed=true;delete prefs.resumeStepId;savePrefs();
    reply('That’s our little tour.','Thanks for exploring with me. Want another look at the selected work?',{view:'complete',action:'Back to the work'});
    if(finishingWithNext)go.focus({preventScroll:true});
    setCharacterState('celebrating',{duration:1400});
  }
  launcher.addEventListener('click',()=>{if(prefs.hidden)setHidden(false);setOpen(!opened);});
  $('#kioHello').addEventListener('click',sayHello);
  $('#kioGreet').addEventListener('click',greet);
  $('#kioAbout').addEventListener('click',()=>{
    expandCompanion();
    reply(steps[index].title,guidance(steps[index],true),{view:'explain'});
    setCharacterState('explaining');
  });
  $('#kioClose').addEventListener('click',()=>setOpen(false));
  $('#kioLater').addEventListener('click',()=>{prefs.resumeStepId=steps[index].id;setOpen(false);});
  $('#kioExpand').addEventListener('click',()=>{expandCompanion();$('#kioClose').focus({preventScroll:true});});
  $('.kio-shortcuts').addEventListener('click',event=>{
    const button=event.target.closest('[data-kio-jump]');
    if(button)moveTo(steps.findIndex(step=>step.id===button.dataset.kioJump));
  });
  $('#kioHide').addEventListener('click',()=>setHidden(true));
  $('#kioReset').addEventListener('click',()=>{
    celebratedStops.clear();prefs.completed=false;savePrefs();moveTo(0);
  });
  prev.addEventListener('click',()=>moveTo(index-1));
  next.addEventListener('click',()=>index===steps.length-1?completeTour():moveTo(index+1));
  go.addEventListener('click',event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    // This action owns its scroll and focus, including shared #work destinations.
    event.stopImmediatePropagation();
    if(activeProject){
      if(window.portfolioMotion?.navigate){event.preventDefault();window.portfolioMotion.navigate(go.getAttribute('href'),activeProject.id);}
      return;
    }
    event.preventDefault();
    moveTo(steps.findIndex(step=>step.id===go.dataset.destination));
  });
  jump.addEventListener('change',()=>moveTo(steps.findIndex(step=>step.id===jump.value)));
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&opened&&!host.inert){e.preventDefault();e.stopPropagation();setOpen(false);return;}
    if(e.altKey&&e.key.toLowerCase()==='g'&&!e.repeat&&!host.inert){e.preventDefault();if(prefs.hidden)setHidden(false);setOpen(!opened);}
  },true);
  // A content collision yields to a recognizable face dock, then to the header
  // trigger if even the smaller dock would obstruct an essential target.
  function launcherSafety(){
    if(opened){
      host.classList.remove('kio-yielding','kio-obstructed');
      host.style.setProperty('--kio-dock-lift','0px');
      return;
    }
    if(host.contains(document.activeElement)||flight)return;
    const box=host.getBoundingClientRect(), style=getComputedStyle(host);
    const width=parseFloat(style.getPropertyValue('--kio-idle-width'));
    const height=parseFloat(style.getPropertyValue('--kio-idle-height'));
    const bottom=box.bottom+parseFloat(host.style.getPropertyValue('--kio-dock-lift')||0);
    const obstacles=[];
    for(const target of document.querySelectorAll('main :is(a,button,input,select,textarea,p,h1,h2,h3,h4,label,summary,figcaption,.project-visual,[tabindex="0"])')){
      const rect=target.getBoundingClientRect();
      if(!rect.width||!rect.height||rect.top>bottom||rect.bottom<innerHeight*.45||rect.right<=box.right-width||rect.left>=box.right)continue;
      const targetStyle=getComputedStyle(target);
      if(targetStyle.visibility==='hidden'||Number(targetStyle.opacity)===0)continue;
      if(target.matches('label')&&target.querySelector('input,select,textarea')){
        // Measure the label's ink, not an otherwise empty full-width wrapper.
        for(const text of target.childNodes){
          if(text.nodeType!==Node.TEXT_NODE||!text.textContent.trim())continue;
          const range=document.createRange();range.selectNodeContents(text);
          obstacles.push(...range.getClientRects());
        }
      }else obstacles.push(rect);
    }
    obstacles.sort((a,b)=>b.top-a.top);
    function availableDock(dockWidth,dockHeight){
      let edge=bottom;
      for(const obstacle of obstacles){
        if(obstacle.right<=box.right-dockWidth||obstacle.top>=edge||obstacle.bottom<=edge-dockHeight)continue;
        edge=obstacle.top-6;
      }
      return edge-dockHeight>=innerHeight*.45?edge:null;
    }
    const full=availableDock(width,height), peek=full===null?availableDock(64,72):null;
    const dockBottom=full??peek??bottom;
    host.style.setProperty('--kio-dock-lift',`${Math.max(0,bottom-dockBottom)}px`);
    host.classList.toggle('kio-yielding',full===null);
    host.classList.toggle('kio-obstructed',full===null&&peek===null);
    syncCharacterMotion();
  }
  function onScroll(){
    if(prefs.hidden||host.inert)return;
    launcherSafety();
    if(lock||tourActive)return;
    let closest='top', best=Infinity;
    for(const section of steps){
      const el=document.getElementById(section.id);if(!el)continue;
      const r=el.getBoundingClientRect();
      if(r.bottom<120)continue;
      const line=window.innerHeight*.32;const d=r.top<=line&&r.bottom>line?0:Math.abs(r.top-line);if(d<=best){best=d;closest=section.id;}
    }
    if(closest!==currentSection){
      currentSection=closest;
      host.dataset.section=closest;
      if(opened){index=Math.max(0,steps.findIndex(step=>step.id===closest));position();}
    }
  }
  window.addEventListener('scroll',()=>{if(prefs.hidden||host.inert||scrollTimer)return;scrollTimer=requestAnimationFrame(()=>{scrollTimer=0;onScroll();});},{passive:true});
  window.addEventListener('resize',onScroll,{passive:true});
  const mo=new MutationObserver(hideIfModal);
  for(const id of ['caseOverlay','commandPalette','mobileMenu']){
    const node=document.getElementById(id);if(node)mo.observe(node,{attributes:true,attributeFilter:['hidden']});
  }
  function motionChanged(){
    syncCharacterMotion();
    queueMicrotask(()=>{if(opened&&steps[index].id==='top')position();});
  }
  reduced.addEventListener?.('change',motionChanged);
  document.addEventListener('portfolio:motion',motionChanged);
  position();onScroll();hideIfModal();refreshPref();
  function gesture(heading,message,target,project=null){
    if(!opened||host.inert)return;
    reply(heading,message,{view:project?'project':'show',project,action:project?'Read case study':null});
    pointAt(target);setCharacterState('pointing',{duration:1100});
  }
  document.addEventListener('portfolio:world-focus',event=>{
    if(steps[index].id!=='universe')return;
    gesture(event.detail.label,'Try this district’s controls, then open its project story.',document.getElementById('worldInspectorLink'));
  });
  document.addEventListener('portfolio:project-hover',event=>{
    if(!opened||activeProject?.id===event.detail.id)return;
    const project=window.PORTFOLIO?.projects.find(item=>item.id===event.detail.id);
    if(project)gesture(project.title,project.short,document.querySelector('[data-project="'+project.id+'"]'),project);
  });
  function interruptTour(event){
    if(event?.target instanceof Node&&host.contains(event.target))return;
    clearTimeout(tourTimer);clearTimeout(highlightTimer);lock=false;tourActive=false;
    if(host.dataset.state==='thinking')setCharacterState(calmState());
    document.querySelectorAll('.kio-target').forEach(node=>node.classList.remove('kio-target'));
  }
  for(const event of ['wheel','touchstart'])window.addEventListener(event,interruptTour,{passive:true});
  document.addEventListener('keydown',event=>{if(['PageDown','PageUp','Home','End'].includes(event.key))interruptTour(event);});

  // Public, read-only interface for browser test automation or accessibility controls.
  window.portfolioGuide={open:()=>{setHidden(false);setOpen(true)},close:()=>setOpen(false),hide:()=>setHidden(true),show:()=>setHidden(false),goTo:(id)=>{const n=steps.findIndex(s=>s.id===id);if(n!==-1){setHidden(false);setOpen(true);moveTo(n);}},get state(){return {opened,index,step:steps[index].id,tourActive,hidden:!!prefs.hidden,completed:!!prefs.completed,character:host.dataset.state}}};
})();
