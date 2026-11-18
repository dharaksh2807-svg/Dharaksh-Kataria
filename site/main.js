(() => {
  'use strict';
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const data = window.PORTFOLIO;
  if (!data) return;
  const escape = (str) => String(str ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const external = (url) => url && /^https:\/\//.test(url) ? url : null;
  let lastFocus = null;
  let openUI = null;
  let toastTimeout = null;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function artFor(type) {
    switch (type) {
      case 'study': return `<div class="visual-content"><div class="study-dashboard" aria-hidden="true"><aside class="study-sidebar"><div class="study-side-logo">SMART / STUDY</div><div class="study-side-item active">⌑ OVERVIEW</div><div class="study-side-item">≋ SUBJECTS</div><div class="study-side-item">⌗ PYQ ANALYTICS</div><div class="study-side-item">⌁ FORMULAS</div></aside><div class="study-main"><div class="study-header"><span>ACADEMIC INTELLIGENCE / 2026</span><i></i></div><h4>Know what matters.</h4><div class="study-sub">TOPIC FREQUENCY — CONCEPT DIAGRAM</div><div class="study-chart">${[44,72,90,56,84,68,97,50].map((h,i)=>`<span style="height:${h}%;animation-delay:${i*.08}s"></span>`).join('')}</div><div class="study-stats"><div><strong>67</strong>SUBJECTS</div><div><strong>06</strong>SEMESTERS</div><div><strong>AI</strong>STUDY TOOLS</div></div></div></div><div class="study-floating">STUDY SIGNAL<strong>↑</strong></div></div>`;
      case 'kv': return `<div class="visual-content"><div class="kv-art"><div class="kv-title">Context has<br><i>a memory cost.</i></div><div class="kv-labels"><span>FULL CONTEXT</span><span>MORE RETAINED STATE</span></div><div class="kv-cells">${Array.from({length:20},(_,i)=>`<span class="${i%7===0?'warm':''}"></span>`).join('')}</div><div class="kv-divider"></div><div class="kv-labels"><span>SELECTIVE RETENTION</span><strong>260-TOKEN BUDGET</strong></div><div class="kv-cells">${Array.from({length:20},(_,i)=>`<span class="${[0,1,9,10,18,19].includes(i)?'warm':'dim'}"></span>`).join('')}</div><div class="kv-result"><strong>7.11 MiB</strong> RETAINED KV / STUDY</div></div></div>`;
      case 'match': return `<div class="visual-content"><div class="match-graphic"><div class="match-grid"></div><svg viewBox="0 0 600 370" role="presentation"><g class="match-edges"><path d="M300 180 L118 85 L184 273 L300 180 L450 90 L500 251 L300 180 M118 85 L450 90 M184 273 L500 251"/></g><g class="node"><circle cx="118" cy="85" r="27"/><text x="118" y="88" text-anchor="middle">DEV</text></g><g class="node"><circle cx="184" cy="273" r="32"/><text x="184" y="277" text-anchor="middle">UX</text></g><g class="node central"><circle cx="300" cy="180" r="50"/><text x="300" y="184" text-anchor="middle">MATCH</text></g><g class="node"><circle cx="450" cy="90" r="31"/><text x="450" y="94" text-anchor="middle">AI</text></g><g class="node"><circle cx="500" cy="251" r="28"/><text x="500" y="255" text-anchor="middle">OPS</text></g></svg><div class="match-bubble">SKILLS <span>↗</span> TEAMS</div><div class="match-annotation">CONNECTED BY CAPABILITY / NOT PROXIMITY</div></div></div>`;
      case 'metro': return `<div class="visual-content"><svg class="metro-svg" viewBox="0 0 960 470" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="metSky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#203a3c"/><stop offset="1" stop-color="#50746b"/></linearGradient><linearGradient id="metRail" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stop-color="#111e1d"/><stop offset="1" stop-color="#566a61"/></linearGradient><linearGradient id="metTrain" x1="0" x2="1"><stop offset="0" stop-color="#e4b28d"/><stop offset=".55" stop-color="#d47f62"/><stop offset="1" stop-color="#b65d4d"/></linearGradient></defs><rect width="960" height="470" fill="url(#metSky)"/><circle cx="710" cy="105" r="62" fill="#e2a77d" opacity=".5"/><g fill="#254542"><rect x="0" y="104" width="92" height="246"/><rect x="88" y="70" width="81" height="276"/><rect x="166" y="130" width="66" height="206"/><rect x="735" y="100" width="55" height="255"/><rect x="785" y="45" width="89" height="300"/><rect x="875" y="85" width="85" height="290"/></g><g stroke="#77a0a0" opacity=".36"><path d="M0 350 H960 M0 320 H960 M0 295 H960"/><path d="M0 0V335 M85 0V340 M165 0V340 M785 0V340 M880 0V340"/></g><path d="M385 235 L575 235 L1020 470 H-55Z" fill="url(#metRail)"/><path d="M421 235 L336 470 M539 235 L635 470" stroke="#a7ada0" stroke-width="8"/><path d="M456 235 L445 470 M503 235 L520 470" stroke="#7c847b" stroke-width="6"/><g class="metro-track" stroke="#b1a896" opacity=".6" stroke-width="5"><path d="M365 247 H600 M350 271 H623 M330 301 H654 M295 343 H704 M250 408 H793"/></g><path d="M505 260 L615 268 L766 470 H512Z" fill="url(#metTrain)" stroke="#f3c39b" stroke-width="2"/><path d="M525 275 L600 279 L628 336 L532 328Z" fill="#23373b"/><path d="M540 283 L570 286 L583 317 L541 313Z" fill="#719c9c"/><path d="M581 287 L597 289 L614 318 L593 315Z" fill="#719c9c"/><path d="M546 351 L672 365" stroke="#8c4c46" stroke-width="7"/><path d="M513 283 L524 287 L535 324 L523 321Z" fill="#ffd5a2"/><g transform="translate(421 316)"><ellipse cx="26" cy="115" rx="46" ry="12" fill="#0c1e21" opacity=".4"/><circle cx="24" cy="2" r="16" fill="#f0c59d"/><path d="M10 18 Q24 10 40 20 L46 71 L5 70Z" fill="#e97650"/><path d="M12 69 L5 114 M40 70 L49 114" fill="none" stroke="#1a2527" stroke-width="12" stroke-linecap="round"/><path d="M7 30 L-8 57 M43 28 L56 53" stroke="#eab38e" stroke-width="10" stroke-linecap="round"/></g><path d="M0 395 L230 286 M960 411 L745 284" stroke="#a1baab" stroke-width="9" opacity=".55"/></svg><div class="metro-title-card">BUILT TO<br><span>keep moving.</span></div><div class="metro-overlay"><span class="metro-square"></span>PROCEDURAL WORLD / IN DEVELOPMENT</div></div>`;
      case 'oodp': return `<div class="visual-content"><div class="code-window"><div class="code-top"><i></i><i></i><i></i><span>main.cpp — UNDERSTANDING OVER MEMORIZATION</span></div><div class="code-body"><div><span class="ln">01</span><span class="keyword">class</span> <span class="type">Idea</span> {</div><div><span class="ln">02</span>  <span class="keyword">public:</span></div><div><span class="ln">03</span>  <span class="keyword">virtual</span> <span class="type">void</span> build() {</div><div><span class="ln">04</span>    understand();</div><div><span class="ln">05</span>    experiment();</div><div><span class="ln">06</span>  }</div><div><span class="ln">07</span>};</div><div><span class="ln">08</span><span class="type">Idea</span>* learning = <span class="keyword">new</span> <span class="type">Practice</span>();</div><div><span class="ln">09</span>learning-&gt;build(); <span class="string">// actually understand</span></div></div><div class="code-foot">5 UNITS &nbsp;·&nbsp; 100+ EXAMPLES &nbsp;·&nbsp; C++</div></div></div>`;
      case 'fair': return `<div class="visual-content"><div class="fair-dashboard"><div class="fair-head"><strong>FAIR / SHIFT</strong><span>PAY TRANSPARENCY</span></div><div class="fair-dash-title">A clearer workday.</div><div class="fair-subtitle">EXAMPLE WORKFLOW · NO REAL PAYROLL DATA</div><div class="fair-table"><div class="fair-row"><span>Hours recorded</span><strong>CHECKED</strong></div><div class="fair-row"><span>Breaks & overtime</span><strong>CALCULATED</strong></div><div class="fair-row"><span>Wage discrepancy</span><strong>REVIEWABLE</strong></div><div class="fair-row"><span>Dispute status</span><strong>TRACKABLE</strong></div></div><div class="fair-total"><span>YOUR WORK, EXPLAINED.</span><strong>↗</strong></div></div><div class="fair-stamp">WORK / WAGES / TRUST</div></div>`;
      default: return '<div class="visual-content"></div>';
    }
  }
  const projects = data.projects;
  const detailUrl=(p)=>`projects/${encodeURIComponent(p.id)}.html`;
  const navigateToDetail = project => { if (project) window.portfolioMotion.navigate(detailUrl(project), project.id); };
  const grid = $('#projectsGrid');
  const cards = projects.map((p) => {
    const card = document.createElement('article');
    card.className = `project-card ${p.size === 'wide' ? 'is-wide' : ''} reveal`;
    card.dataset.category = p.category;
    card.dataset.project = p.id;
    const live = external(p.link);
    const source = external(p.source);
    const same = live && live === source;
    const linkHtml = live ? `<a class="project-direct project-live" href="${escape(live)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escape(p.title)} external website">${p.category === 'research' ? 'RESEARCH' : 'LIVE WEBSITE'} <span>↗</span></a>` : '';
    const sourceHtml = source && !same ? `<a class="project-direct project-source" href="${escape(source)}" target="_blank" rel="noopener noreferrer" aria-label="View ${escape(p.title)} source code">GITHUB <span>↗</span></a>` : '';
    card.style.setProperty('--v8-vt-name',`project-${p.id}`);
    card.style.setProperty('--project-title-name',`project-title-${p.id}`);
    card.innerHTML = `<div class="project-visual visual-${escape(p.theme)}"><span class="project-kicker">${escape(p.categories.join(' / '))}</span>${artFor(p.theme)}<span class="project-visual-tag">ORIGINAL SYSTEM VISUAL / ${escape(p.num)}</span></div><div class="project-info"><div class="project-info-left"><div class="project-num">${escape(p.num)} — ${escape(p.status)}</div><h3 class="project-title">${escape(p.title)}</h3><p class="project-summary">${escape(p.short)}</p></div><div class="project-arrow-wrap"><span class="project-open" aria-hidden="true">↗</span></div></div><div class="project-linkbar"><button type="button" class="project-case-open" aria-label="Read ${escape(p.title)} case study">CASE STUDY <span>→</span></button>${linkHtml}${sourceHtml}${!live&&!source?'<span class="private-pill">NO PUBLIC DEMO</span>':''}</div>`;
    $('.project-case-open',card).addEventListener('click', () => navigateToDetail(p));
    $('.project-visual',card).addEventListener('click', () => navigateToDetail(p));
    $('.project-visual',card).setAttribute('role','button');
    $('.project-visual',card).setAttribute('tabindex','0');
    $('.project-visual',card).setAttribute('aria-label',`Open ${p.title} case study`);
    $('.project-visual',card).addEventListener('keydown',(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();navigateToDetail(p)}});
    grid.appendChild(card);
    return card;
  });

  function applyFilter(filter) {
    let visible = 0;
    cards.forEach((card) => { const show = filter === 'all' || card.dataset.category === filter; card.hidden = !show; if (show) { visible++; card.classList.add('in-view'); } });
    $$('.filter-button').forEach((b) => { const active = b.dataset.filter === filter; b.classList.toggle('is-active', active); b.setAttribute('aria-pressed', String(active)); });
    $('#filterCount').textContent = `SHOWING ${String(visible).padStart(2,'0')} / 06`;
  }
  $$('.filter-button').forEach((btn) => btn.addEventListener('click', () => applyFilter(btn.dataset.filter)));
  $('#allProjectsButton').addEventListener('click', () => $('#archive').scrollIntoView({behavior: reduceMotion ? 'instant' : 'smooth'}));

  const archive = $('#archiveList');
  const archiveCards = data.archive.map((a, i) => {
    const live=external(a.live),source=external(a.source);
    const node=document.createElement('article');
    node.className='archive-row reveal archive-card';
    node.dataset.search=`${a.name} ${a.kind} ${a.stack} ${a.status} ${a.technologies.join(' ')}`.toLowerCase();
    node.innerHTML=`<span class="archive-index">${escape(a.num||String(i+7).padStart(2,'0'))}</span><div class="archive-main"><span class="archive-kind">${escape(a.kind)}</span><h3 class="archive-name">${escape(a.name)}</h3><p class="archive-summary">${escape(a.lead)}</p><span class="archive-status">${escape(a.status)}</span></div><span class="archive-stack">${escape(a.stack)}</span><div class="archive-actions"><button type="button" class="archive-open">STORY ↗</button>${live?`<a href="${escape(live)}" target="_blank" rel="noopener noreferrer">WEBSITE ↗</a>`:''}${source?`<a href="${escape(source)}" target="_blank" rel="noopener noreferrer">SOURCE ↗</a>`:''}${!live&&!source?'<span>PRIVATE / CONCEPT</span>':''}</div>`;
    $('.archive-open',node).addEventListener('click',()=>navigateToDetail(a));
    archive.appendChild(node);
    return node;
  });
  function filterArchive(q){let count=0;const query=q.trim().toLowerCase();archiveCards.forEach(n=>{let show=n.dataset.search.includes(query);n.hidden=!show;if(show){count++;n.classList.add('in-view')}});$('#archiveCount').textContent=`${count} / ${archiveCards.length} PROJECTS`}
  $('#archiveSearch').addEventListener('input',e=>filterArchive(e.target.value));
  filterArchive('');
  const credentials=$('#credentialGrid');
  data.credentials.forEach((c,i)=>{const el=document.createElement('article');el.className='credential-card reveal';el.innerHTML=`<span class="credential-motif" aria-hidden="true"><span>${escape(c.code)}</span><i>✳</i></span><div class="credential-copy"><span>${escape(c.issuer)} · ${escape(c.date)}</span><h3>${escape(c.name)}</h3></div>${external(c.url)?`<a href="${escape(c.url)}" target="_blank" rel="noopener noreferrer" class="credential-link">VERIFY CREDENTIAL ↗</a>`:'<span class="credential-unlinked">CERTIFICATE LINK NOT AVAILABLE</span>'}`;credentials.appendChild(el)});
  const challenges=$('#challengeGrid');
  data.hackathons.forEach((c,i)=>{const el=document.createElement('article');el.className='challenge-card reveal';el.innerHTML=`<span class="challenge-index mono">${escape(c.num||String(i+1).padStart(2,'0'))}</span><div><strong>${escape(c.name)}</strong><p>${escape(c.detail)}</p></div><span class="challenge-status">${escape(c.status)}</span>`;challenges.appendChild(el)});
  const research=$('#researchGrid');
  data.research.forEach((c,i)=>{const el=document.createElement('article');el.className='research-card reveal';el.innerHTML=`<span class="mono">RESEARCH / ${String(i+1).padStart(2,'0')}</span><h3>${escape(c.name)}</h3><p>${escape(c.detail)}</p>${external(c.url)?`<a href="${escape(c.url)}" target="_blank" rel="noopener noreferrer">VIEW RESEARCH ↗</a>`:'<span class="research-private">ACADEMIC WORK / NO PUBLIC LINK</span>'}`;research.appendChild(el)});
  const atlasTabs=$('#atlasTabs'),atlasDetail=$('#atlasDetail');
  const atlasCats=data.capabilities;
  atlasTabs.innerHTML=atlasCats.map((c,i)=>`<button class="atlas-tab ${i===0?'is-active':''}" data-index="${i}" type="button" aria-pressed="${i===0}"><span>0${i+1}</span>${escape(c.label)}<span aria-hidden="true">↗</span></button>`).join('');
  function showAtlas(i){const c=atlasCats[i];$$('.atlas-tab',atlasTabs).forEach((b,j)=>{b.classList.toggle('is-active',i===j);b.setAttribute('aria-pressed',String(i===j))});$('#atlasVisual').dataset.active=c.id;
    atlasDetail.innerHTML=`<span class="atlas-detail-index mono">ACTIVE DISCIPLINE / 0${i+1}</span><h3>${escape(c.label)}</h3><p>${escape(c.summary)}</p><div class="atlas-skill-tags">${c.tools.map(t=>`<span>${escape(t)}</span>`).join('')}</div><div class="atlas-proof"><span>APPLIED IN</span><p>${escape(c.proof)}</p></div><button type="button" id="atlasExplore">EXPLORE RELATED CASE STUDY ↗</button>`;
    $('#atlasExplore').addEventListener('click',()=>navigateToDetail(projects.find(p=>p.id===c.project)));
  }
  $$('.atlas-tab',atlasTabs).forEach(b=>b.addEventListener('click',()=>showAtlas(Number(b.dataset.index))));showAtlas(0);

  const timelineRail=$('#timelineRail');
  data.timeline.forEach((e,i)=>{
    const el=document.createElement('article');el.className='timeline-event';
    el.innerHTML=`<span class="timeline-dot" aria-hidden="true"></span><span class="timeline-date mono">${escape(e.date)}</span><div class="timeline-feature"><span>${escape(e.tag)}</span><h3>${escape(e.title)}</h3><p>${escape(e.detail)}</p><button type="button">OPEN THE CASE STUDY ↗</button></div>`;
    $('button',el).addEventListener('click',()=>navigateToDetail(projects.find(p=>p.id===e.id)));
    timelineRail.appendChild(el);
  });
  $('#timelinePrev').addEventListener('click',()=>timelineRail.scrollBy({left:-340,behavior:reduceMotion?'instant':'smooth'}));
  $('#timelineNext').addEventListener('click',()=>timelineRail.scrollBy({left:340,behavior:reduceMotion?'instant':'smooth'}));
  const overlay = $('#caseOverlay');
  const caseDialog = $('.case-dialog');
  function openCase(p, { updateUrl = true } = {}) {
    if (!p) return;
    if (!overlay.hidden) closeCase({ updateUrl: false });
    lastFocus = document.activeElement;
    openUI = 'case';
    $('#caseNumber').textContent = p.num;
    const projectLink = external(p.link||p.live);
    const sourceLink = external(p.source);
    const links=`${projectLink?`<a class="case-button" href="${escape(projectLink)}" target="_blank" rel="noopener noreferrer">${p.category==='research'?'VIEW RESEARCH':'OPEN LIVE WEBSITE'} <span>↗</span></a>`:''}${sourceLink && sourceLink!==projectLink?`<a class="case-button secondary" href="${escape(sourceLink)}" target="_blank" rel="noopener noreferrer">SOURCE CODE / DOCUMENTATION <span>↗</span></a>`:''}${!projectLink && !sourceLink?'<span class="mono">PRIVATE DEVELOPMENT · NO PUBLIC LINKS</span>':''}`;
    const features=(p.features||p.concepts||[]);
    $('#caseContent').dataset.id=p.id;
    $('#caseContent').innerHTML = `<div class="case-overline"><span>${escape((p.categories||[p.kind]).join(' / '))}</span><span>${escape(p.period||p.year)}</span></div><h2 class="case-heading" id="caseTitle">${escape(p.title).replace(/[.!?]+$/,'')}<em>.</em></h2><p class="case-lead">${escape(p.lead)}</p><div class="case-quicklinks">${links}</div><div class="case-hero-art visual-${escape(p.theme)}">${p.theme==='archive'?`<div class="case-archive-art"><span>ENGINEERING / ARCHIVE</span><strong>${escape(p.name||p.title)}</strong><div class="archive-art-rings"><i></i><i></i><i></i></div></div>`:artFor(p.theme)}</div>${p.metrics?.length?`<div class="case-data-grid">${p.metrics.map(x=>`<div><strong>${escape(x[0])}</strong><span>${escape(x[1])}</span></div>`).join('')}</div>`:''}<div class="case-meta"><span>STATUS <strong>${escape(p.status)}</strong></span><span>ROLE <strong>${escape(p.role)}</strong></span></div><div class="case-body-grid"><span class="case-label">01 / CONTEXT</span><div><h3>The problem</h3><p>${escape(p.problem)}</p></div></div><div class="case-body-grid"><span class="case-label">02 / APPROACH</span><div><h3>What I built</h3><p>${escape(p.solution)}</p></div></div><div class="case-body-grid"><span class="case-label">03 / ENGINEERING</span><div><h3>Under the hood</h3><p>${escape(p.architecture)}</p></div></div><div class="case-body-grid"><span class="case-label">04 / FEATURES</span><div><h3>Systems & modules</h3><ul class="case-features">${features.map(x=>`<li>${escape(x)}</li>`).join('')}</ul></div></div><div class="case-body-grid"><span class="case-label">05 / EVIDENCE</span><div><h3>What the record supports</h3><p>${escape(p.proof)}</p></div></div><div class="case-tech">${(p.technologies||[]).map((t)=>`<span>${escape(t)}</span>`).join('')}</div><p class="case-disclaimer">NOTE / ${escape(p.note)}</p><div class="case-buttons">${links}</div>`;

    overlay.hidden = false; document.body.style.overflow = 'hidden';
    document.querySelector('main').inert = true; document.querySelector('header').inert = true;
    caseDialog.scrollTop = 0; caseDialog.focus();
    document.dispatchEvent(new CustomEvent('portfolio:case-open', {detail:{id:p.id,title:p.title}}));
    if (updateUrl) {const url=new URL(location.href);url.searchParams.set('project',p.id);history.pushState({project:p.id},'',url);}
    const share = document.createElement('button');
    share.type='button'; share.className='case-share-action'; share.textContent='COPY CASE STUDY LINK ↗';
    share.addEventListener('click',async()=>{const url=new URL(location.href);url.searchParams.set('project',p.id);try{await navigator.clipboard.writeText(url.toString());share.textContent='LINK COPIED ✓';}catch{window.prompt('Copy the project link:',url.toString())}});
    $('#caseContent').querySelector('.case-quicklinks').append(share);
  }
  function closeCase({ updateUrl = true } = {}) { overlay.hidden = true; openUI = null; document.body.style.overflow = ''; document.querySelector('main').inert = false; document.querySelector('header').inert = false; $('#caseContent').innerHTML = ''; document.dispatchEvent(new CustomEvent('portfolio:case-close')); if(updateUrl && new URL(location.href).searchParams.has('project')){const url=new URL(location.href);url.searchParams.delete('project');history.replaceState({},'',url);} lastFocus?.focus?.(); }
  $('#caseClose').addEventListener('click', closeCase);
  $('.case-backdrop').addEventListener('click', closeCase);
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


  // Search command palette, with keyboard-friendly project and section navigation.
  const palette = $('#commandPalette');
  const paletteInput = $('#paletteInput');
  const paletteItems = [
    ...projects.map((p) => ({ label: p.title, description: p.categories.join(' / '), run: () => openCase(p) })),
    ...data.archive.map((a)=>({label:a.name,description:a.kind,run:()=>openCase(a)})),
    {label:'All projects',description:'JUMP TO SELECTED WORK',run:()=>$('#work').scrollIntoView()},
    {label:'Technical approach',description:'JUMP TO CAPABILITIES',run:()=>$('#lab').scrollIntoView()},
    {label:'Project archive',description:'JUMP TO MORE WORK',run:()=>$('#archive').scrollIntoView()},
    {label:'Live visualization',description:'INTERACTIVE SYSTEM EXPLORER',run:()=>$('#motion-lab').scrollIntoView()},
    {label:'Project timeline',description:'2026 BUILD CHRONOLOGY',run:()=>$('#timeline').scrollIntoView()},
    {label:'Engineering atlas',description:'INTERACTIVE SKILLS MAP',run:()=>$('#capabilities').scrollIntoView()},
    {label:'Recognition & credentials',description:'JUMP TO HACKATHONS AND COURSES',run:()=>$('#recognition').scrollIntoView()},
    {label:'About Dharaksh',description:'JUMP TO ABOUT',run:()=>$('#about').scrollIntoView()},
    {label:'Contact',description:'JUMP TO CONTACT',run:()=>$('#contact').scrollIntoView()}
  ];
  let selected = 0;
  let filteredItems = [];
  function drawPalette() {
    const q = paletteInput.value.trim().toLowerCase();
    filteredItems = paletteItems.filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(q)).slice(0,9);
    selected = Math.min(selected, Math.max(0,filteredItems.length - 1));
    $('#paletteResults').innerHTML = filteredItems.length ? filteredItems.map((x,i)=>`<button class="palette-result" type="button" role="option" aria-selected="${i === selected}" data-index="${i}"><span><strong>${escape(x.label)}</strong><br><small>${escape(x.description)}</small></span><span aria-hidden="true">↗</span></button>`).join('') : '<div class="palette-empty">No matching projects or sections.</div>';
    $$('.palette-result').forEach((el)=>el.addEventListener('click',()=>activatePalette(Number(el.dataset.index))));
  }
  function openPalette() { if(openUI==='case') closeCase(); lastFocus = document.activeElement; openUI='palette'; palette.hidden=false; document.body.style.overflow='hidden'; document.querySelector('main').inert = true; document.querySelector('header').inert = true; paletteInput.value=''; selected=0; drawPalette(); setTimeout(()=>paletteInput.focus(),0); }
  function closePalette() { palette.hidden=true; openUI=null; document.body.style.overflow=''; document.querySelector('main').inert = false; document.querySelector('header').inert = false; lastFocus?.focus?.(); }
  function activatePalette(i) { const item=filteredItems[i]; if(!item)return; closePalette(); item.run(); }
  $('#searchTrigger').addEventListener('click',openPalette);
  $('#paletteBackdrop').addEventListener('click',closePalette);
  $('#paletteClose').addEventListener('click',closePalette);
  paletteInput.addEventListener('input',()=>{selected=0;drawPalette()});
  paletteInput.addEventListener('keydown',(event)=>{
    if(event.key==='ArrowDown'){event.preventDefault();selected=(selected+1)%Math.max(1,filteredItems.length);drawPalette()}
    if(event.key==='ArrowUp'){event.preventDefault();selected=(selected+Math.max(1,filteredItems.length)-1)%Math.max(1,filteredItems.length);drawPalette()}
    if(event.key==='Enter'){event.preventDefault();activatePalette(selected)}
  });
  function focusTrap(e, element) { const focusables=$$('a[href],button:not([disabled]),input:not([disabled]),[tabindex="0"]',element).filter(x=>getComputedStyle(x).display!=='none'); if(!focusables.length)return; const first=focusables[0],last=focusables[focusables.length-1]; if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()} }
  document.addEventListener('keydown',(e)=>{
    if ((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault(); if(openUI==='palette')closePalette();else openPalette();return}
    if(e.key==='Escape'){if(openUI==='palette')closePalette();else if(openUI==='case')closeCase();else closeMobile();return}
    if(e.key==='Tab'&&openUI==='palette')focusTrap(e,$('.palette-dialog'));
    else if(e.key==='Tab'&&openUI==='case')focusTrap(e,caseDialog);
  });

  // Mobile menu
  const menuToggle=$('#menuToggle'), mobileMenu=$('#mobileMenu');
  const closeMobile=()=>{mobileMenu.hidden=true;menuToggle.setAttribute('aria-expanded','false');menuToggle.setAttribute('aria-label','Open navigation menu')};
  menuToggle.addEventListener('click',()=>{const shouldOpen=mobileMenu.hidden;mobileMenu.hidden=!shouldOpen;menuToggle.setAttribute('aria-expanded',String(shouldOpen));menuToggle.setAttribute('aria-label',shouldOpen?'Close navigation menu':'Open navigation menu')});
  $$('#mobileMenu a').forEach((a)=>a.addEventListener('click',closeMobile));

  // Expanded area: one at a time, with actual content toggled.
  $$('.discipline button').forEach((button)=>button.addEventListener('click',()=>{
    const parent=button.closest('.discipline');const wasOpen=parent.classList.contains('is-open');
    $$('.discipline').forEach((d)=>{d.classList.remove('is-open');$('button',d).setAttribute('aria-expanded','false');$('.disc-toggle',d).textContent='+'});
    if(!wasOpen){parent.classList.add('is-open');button.setAttribute('aria-expanded','true');$('.disc-toggle',parent).textContent='−'}
  }));

  // Scroll states, low-cost rAF updates.
  const header=$('#siteHeader'),indicator=$('#scrollIndicator');let ticking=false;
  function renderScroll(){const scroll=Math.max(0,window.scrollY),total=Math.max(1,document.documentElement.scrollHeight-innerHeight);indicator.style.width=`${Math.min(100,scroll/total*100)}%`;header.classList.toggle('scrolled',scroll>40);ticking=false}
  window.addEventListener('scroll',()=>{if(!ticking){requestAnimationFrame(renderScroll);ticking=true}},{passive:true});renderScroll();
  function updateIST(){try{$('#liveTime').textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date())+' IST'}catch{$('#liveTime').textContent='INDIA / IST'}}
  updateIST();setInterval(updateIST,60000);
  $('#year').textContent=new Date().getFullYear();
  function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),2300)}
  $('#copyEmail').addEventListener('click',async()=>{
    const email='dharaksh2807@gmail.com';let copied=false;
    try { if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(email);copied=true} } catch {}
    if(!copied){const field=document.createElement('textarea');field.value=email;field.style.cssText='position:fixed;left:-10000px;top:0';document.body.appendChild(field);field.select();try{copied=document.execCommand('copy')}catch{}field.remove()}
    toast(copied?'EMAIL ADDRESS COPIED':`EMAIL: ${email}`);
  });
})();
