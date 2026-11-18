from pathlib import Path
import re
root=Path('/mnt/data/dharaksh-portfolio-v6/site')
html=(root/'index.html').read_text()
html=html.replace('<meta property="og:image" content="assets/og-cover.svg">','<meta property="og:image" content="assets/og-cover.png">\n  <meta property="og:image:width" content="1200">\n  <meta property="og:image:height" content="630">\n  <meta name="twitter:image" content="assets/og-cover.png">')
html=html.replace('<link rel="stylesheet" href="guide.css">','<link rel="stylesheet" href="guide.css">\n  <link rel="stylesheet" href="v6.css">')
html=html.replace('<script defer src="guide.js"></script>','<script defer src="guide.js"></script>\n  <script defer src="v6.js"></script>')
html=html.replace('''      <button class="search-trigger" id="searchTrigger"''','''      <button class="v6-guide-toggle" id="v6GuideToggle" type="button" aria-label="Show or hide Kio guide" title="Toggle guide">GUIDE <span aria-hidden="true">✳</span></button>
      <button class="search-trigger" id="searchTrigger"''')
for a,b in [('04</span>Skills','05</span>Skills'),('05</span>Credentials','06</span>Credentials'),('04 — Skills','05 — Skills'),('05 — Credentials','06 — Credentials'),('06 — About','07 — About'),('07 — Contact','08 — Contact')]:html=html.replace(a,b)
# after projects before timeline, new interactive demonstration
mark='''    <section class="timeline-section" id="timeline"'''
assert mark in html
lab='''    <section class="proof-section" id="prooflab" aria-labelledby="proofTitle">
      <div class="wrap proof-intro" data-v4="slide-up">
        <span class="eyebrow">[ 02 / EXPLORE THE SYSTEMS ]</span>
        <div class="proof-headline-row"><h2 id="proofTitle">Don't take my<br><em>word for it.</em></h2><p>Three interactive technical studies derived from documented projects. Adjust parameters and inspect how the systems work. <strong>These are illustrative models, not live application screenshots or production data.</strong></p></div>
      </div>
      <div class="wrap proof-frame" id="proofFrame">
        <div class="proof-tabbar" role="tablist" aria-label="Choose an interactive technical study">
          <button type="button" class="proof-tab is-selected" id="proofTabStudy" role="tab" aria-controls="proofStudy" aria-selected="true" data-proof="study"><span>01</span> ACADEMIC ATLAS</button>
          <button type="button" class="proof-tab" id="proofTabMatch" role="tab" aria-controls="proofMatch" aria-selected="false" data-proof="match" tabindex="-1"><span>02</span> MATCH ENGINE</button>
          <button type="button" class="proof-tab" id="proofTabKv" role="tab" aria-controls="proofKv" aria-selected="false" data-proof="kv" tabindex="-1"><span>03</span> MEMORY LAB</button>
        </div>
        <div class="proof-stage" id="proofStage">
          <div class="proof-visual-decor" aria-hidden="true"><span></span><span></span><span></span></div>
          <section class="proof-view" id="proofStudy" role="tabpanel" aria-labelledby="proofTabStudy">
            <div class="proof-layout"><div class="proof-insight"><span class="mono proof-overline">ACADEMIC STRUCTURE / SRMEDU</span><h3>67 subjects.<br><em>One organized system.</em></h3><p>The listed SRMedu curriculum spans six semesters. Choose a semester to highlight its share of the catalogue.</p><div class="proof-study-choices" id="proofSemesterChoices" aria-label="Select a semester"></div><div class="proof-readout"><strong id="proofSubjectCount">20</strong><span id="proofSubjectLabel">listed subjects in semester 1</span></div><a href="https://www.srmedu.in/" target="_blank" rel="noopener noreferrer" class="proof-textlink">EXPLORE THE ACTUAL PLATFORM <span>↗</span></a></div><div class="proof-artboard"><div class="proof-artboard-head mono"><span>SUBJECT DISTRIBUTION</span><span>6 SEMESTERS / 67 LISTINGS</span></div><div class="proof-subject-grid" id="proofSubjectGrid" aria-hidden="true"></div><div class="proof-bar-chart" id="proofSubjectBars" aria-hidden="true"></div></div></div>
          </section>
          <section class="proof-view" id="proofMatch" role="tabpanel" aria-labelledby="proofTabMatch" hidden>
            <div class="proof-layout"><div class="proof-insight"><span class="mono proof-overline">ILLUSTRATIVE COMPATIBILITY / PROJECTMATCH</span><h3>Good teams are<br><em>designed.</em></h3><p>Explore a five-factor weighted compatibility model described in the ProjectMatch dossier. Adjust hypothetical candidate scores—no real user data is used.</p><div class="proof-match-score"><strong id="proofMatchScore">76.0</strong><span>/ 100 · DEMONSTRATION SCORE</span></div><a href="https://projectmatch-phi.vercel.app/" class="proof-textlink" target="_blank" rel="noopener noreferrer">VISIT PROJECTMATCH <span>↗</span></a></div><div class="proof-artboard proof-slider-board"><div class="proof-artboard-head mono"><span>WEIGHTED COMPATIBILITY</span><span>ADJUST THE INPUTS</span></div><div id="proofMatchSliders" class="proof-match-sliders"></div><p class="proof-footnote">Illustrative factor scores. This is an explainer, not the deployed matching service.</p></div></div>
          </section>
          <section class="proof-view" id="proofKv" role="tabpanel" aria-labelledby="proofTabKv" hidden>
            <div class="proof-layout"><div class="proof-insight"><span class="mono proof-overline">EXPERIMENTAL RETAINED CACHE / IITB</span><h3>Less memory.<br><em>Measured trade-offs.</em></h3><p>Compare retained KV tensor sizes reported for different token budgets. Reducing retained KV does <strong>not</strong> establish reduced peak process memory.</p><div class="proof-budget-control" id="proofBudgetChoices" aria-label="Select retained KV token budget"><button type="button" data-budget="260" aria-pressed="true">260</button><button type="button" data-budget="516" aria-pressed="false">516</button><button type="button" data-budget="1028" aria-pressed="false">1028</button></div><div class="proof-readout"><strong id="proofKvValue">7.11</strong><span>MiB retained KV</span></div><a href="https://github.com/dharaksh2807-svg/iitB/blob/main/PHASE3_RESEARCH_REPORT.md" class="proof-textlink" target="_blank" rel="noopener noreferrer">READ THE RESEARCH <span>↗</span></a></div><div class="proof-artboard"><div class="proof-artboard-head mono"><span>TOKEN RETENTION</span><span id="proofBudgetLabel">B = 260 TOKENS</span></div><div class="proof-cache-cells" id="proofCacheCells" aria-hidden="true"></div><div class="proof-memory-comparison"><div><span>FULL-CACHE REFERENCE *</span><i style="--bar-size:100%"></i><strong>105.62 MiB</strong></div><div><span>RETAINED KV *</span><i id="proofKvBar" style="--bar-size:6.73%"></i><strong id="proofKvBarLabel">7.11 MiB</strong></div></div><p class="proof-footnote">* Memory comparison shown from a separate 12-case long-context pilot; sizes vary with sequence length and budget. The 60-question B=260 study measured 83.3% full versus 80.0% compressed recall, without demonstrated peak-memory savings.</p></div></div>
          </section>
        </div>
        <div class="proof-footer"><span class="mono">LIVE CONTROLS / HONESTLY LABELED MODELS</span><span class="mono" id="proofCurrentLabel">SRMEDU / SEMESTER DISTRIBUTION</span></div>
      </div>
    </section>

'''
html=html.replace(mark,lab+mark)
html=html.replace('''<a href="#journey" class="nav-link">''','''<a href="#journey" class="nav-link">''')
html=html.replace('''<a href="#archive" class="nav-link"><span class="nav-index">03</span>Archive</a>''','''<a href="#prooflab" class="nav-link"><span class="nav-index">03</span>Proof Lab</a>''')
html=html.replace('''<a href="#archive">03 — Archive</a>''','''<a href="#prooflab">03 — Proof Lab</a><a href="#archive">Archive</a>''')
(root/'index.html').write_text(html)
# Alter main.js for per-project URL share and real URL navigation
f=root/'main.js';js=f.read_text();js=js.replace('''  function openCase(p) {
    if (!overlay.hidden) closeCase();''','''  function openCase(p, { updateUrl = true } = {}) {
    if (!p) return;
    if (!overlay.hidden) closeCase({ updateUrl: false });''')
js=js.replace('''    caseDialog.scrollTop = 0; caseDialog.focus();
  }
  function closeCase() { overlay.hidden = true;''','''    caseDialog.scrollTop = 0; caseDialog.focus();
    document.dispatchEvent(new CustomEvent('portfolio:case-open', {detail:{id:p.id,title:p.title}}));
    if (updateUrl) {const url=new URL(location.href);url.searchParams.set('project',p.id);history.pushState({project:p.id},'',url);}
    const share = document.createElement('button');
    share.type='button'; share.className='case-share-action'; share.textContent='COPY CASE STUDY LINK ↗';
    share.addEventListener('click',async()=>{const url=new URL(location.href);url.searchParams.set('project',p.id);try{await navigator.clipboard.writeText(url.toString());share.textContent='LINK COPIED ✓';}catch{window.prompt('Copy the project link:',url.toString())}});
    $('#caseContent').querySelector('.case-quicklinks').append(share);
  }
  function closeCase({ updateUrl = true } = {}) { overlay.hidden = true;''')
js=js.replace('''$('#caseContent').innerHTML = ''; lastFocus?.focus?.(); }''','''$('#caseContent').innerHTML = ''; document.dispatchEvent(new CustomEvent('portfolio:case-close')); if(updateUrl && new URL(location.href).searchParams.has('project')){const url=new URL(location.href);url.searchParams.delete('project');history.replaceState({},'',url);} lastFocus?.focus?.(); }''')
anchor='''  $('.case-backdrop').addEventListener('click', closeCase);'''
assert anchor in js
js=js.replace(anchor,anchor+'''
  // Shareable project URLs work on static hosts: ?project=project-id.
  // These are direct links to the case-study overlay, not separate HTML/SEO pages.
  const allCaseProjects=[...projects,...data.archive];
  function openFromUrl(){
    const id=new URL(location.href).searchParams.get('project');
    const target=allCaseProjects.find(p=>p.id===id);
    if(target){if(overlay.hidden || $('#caseContent').dataset.id!==id)openCase(target,{updateUrl:false});}
    else if(!overlay.hidden)closeCase({updateUrl:false});
  }
  window.addEventListener('popstate',openFromUrl);
  window.setTimeout(openFromUrl,0);
''')
js=js.replace('''    $('#caseContent').innerHTML = `<div class="case-overline">''','''    $('#caseContent').dataset.id=p.id;
    $('#caseContent').innerHTML = `<div class="case-overline">''')
(root/'main.js').write_text(js)
# preserve Kio and change persistent behavior
f=root/'guide.js';js=f.read_text()
js=js.replace("  host.className = 'kio-shell';","  host.className = 'kio-shell kio-compact';")
js=js.replace('''      <p class="kio-footer-note">An interactive site guide, not an AI chatbot. No data is collected.</p>''','''      <div class="kio-preference-row"><button type="button" id="kioHide">HIDE KIO ON THIS DEVICE</button><button type="button" id="kioReset">RESTART TOUR</button></div>
      <p class="kio-footer-note">Scripted guidance, no AI model or data collection. Preferences stay in this browser.</p>''')
js=js.replace('''  let index=0, opened=false, tourActive=false, lock=false, lastFocused=null;''','''  const prefKey='dk-kio-preferences-v6';
  const readPrefs=()=>{try{return JSON.parse(localStorage.getItem(prefKey)||'{}')}catch{return {}}};
  let prefs=readPrefs();
  const savePrefs=()=>{try{localStorage.setItem(prefKey,JSON.stringify(prefs))}catch{}};
  let index=Math.max(0,Math.min(steps.length-1,Number(prefs.lastStep)||0)), opened=false, tourActive=false, lock=false, lastFocused=null;
  const toggleButton=document.getElementById('v6GuideToggle');
  function refreshPref(){host.classList.toggle('kio-suppressed',!!prefs.hidden);if(toggleButton){toggleButton.setAttribute('aria-pressed',String(!prefs.hidden));toggleButton.title=prefs.hidden?'Show Kio guide':'Hide Kio guide';toggleButton.querySelector('span').textContent=prefs.hidden?'○':'✳'}}
  function setHidden(value){prefs.hidden=!!value;savePrefs();if(value&&opened)setOpen(false);refreshPref()}
  toggleButton?.addEventListener('click',()=>{setHidden(!prefs.hidden);if(!prefs.hidden)setOpen(true)});''')
js=js.replace('''    if(tourActive) host.dataset.mood=index===steps.length-1?'celebrate':'speaking';''','''    if(tourActive) host.dataset.mood=index===steps.length-1?'celebrate':'speaking';
    prefs.lastStep=index;if(index===steps.length-1 && tourActive){prefs.completed=true;}savePrefs();''')
js=js.replace("  launcher.addEventListener('click',()=>setOpen(!opened));","  launcher.addEventListener('click',()=>{if(prefs.hidden)setHidden(false);setOpen(!opened)});")
js=js.replace("  $('#kioClose').addEventListener('click',()=>setOpen(false));","  $('#kioClose').addEventListener('click',()=>setOpen(false));\n  $('#kioHide').addEventListener('click',()=>setHidden(true));\n  $('#kioReset').addEventListener('click',()=>{prefs.completed=false;prefs.lastStep=0;savePrefs();moveTo(0)});")
js=js.replace('''  position();onScroll();hideIfModal();
  window.setTimeout(()=>{if(!opened) say('Hello! I can guide you through the work.',6500);},1600);''','''  position();onScroll();hideIfModal();refreshPref();
  // No automatic promotional bubble: a deliberate click opens the guide.
  document.addEventListener('portfolio:case-open',()=>{host.dataset.mood='attentive'});
  document.addEventListener('portfolio:case-close',()=>{host.dataset.mood='idle'});''')
js=js.replace('''  window.portfolioGuide={open:()=>setOpen(true),close:()=>setOpen(false),goTo:(id)=>{const n=steps.findIndex(s=>s.id===id);if(n!==-1){setOpen(true);moveTo(n);}},get state(){return {opened,index,step:steps[index].id,tourActive}}};''','''  window.portfolioGuide={open:()=>{setHidden(false);setOpen(true)},close:()=>setOpen(false),hide:()=>setHidden(true),show:()=>setHidden(false),goTo:(id)=>{const n=steps.findIndex(s=>s.id===id);if(n!==-1){setHidden(false);setOpen(true);moveTo(n);}},get state(){return {opened,index,step:steps[index].id,tourActive,hidden:!!prefs.hidden,completed:!!prefs.completed}}};''')
(root/'guide.js').write_text(js)
print('Updated V6 HTML + JS files')
