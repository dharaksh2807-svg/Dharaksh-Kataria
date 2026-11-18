/* V6: deterministic, interactive project explainers. No production data or API access. */
(() => {
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  if(!$('#proofFrame'))return;
  const tabOrder=['study','match','kv'];
  let active='study';
  const tabs=$$('[data-proof]');
  const stage=$('#proofStage');
  function select(id,focus=false){
    if(!tabOrder.includes(id))return;
    active=id;
    tabs.forEach(b=>{const on=b.dataset.proof===id;b.classList.toggle('is-selected',on);b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;if(on&&focus)b.focus();});
    tabOrder.forEach(x=>{const el=$('#proof'+x[0].toUpperCase()+x.slice(1));el.hidden=x!==id;});
    stage.dataset.active=id;
    $('#proofCurrentLabel').textContent=({study:'SRMEDU / SEMESTER DISTRIBUTION',match:'PROJECTMATCH / COMPATIBILITY STUDY',kv:'IITB / CACHE RETENTION MODEL'})[id];
  }
  tabs.forEach(b=>b.addEventListener('click',()=>select(b.dataset.proof)));
  const tabbar=$('.proof-tabbar');
  tabbar.addEventListener('keydown',e=>{
    const i=tabOrder.indexOf(active);
    if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();select(tabOrder[(i+(e.key==='ArrowRight'?1:-1)+3)%3],true)}
    else if(e.key==='Home'){e.preventDefault();select('study',true)}
    else if(e.key==='End'){e.preventDefault();select('kv',true)}
  });
  const semesters=[20,10,16,14,4,3];
  const grid=$('#proofSubjectGrid'), bars=$('#proofSubjectBars'), choices=$('#proofSemesterChoices');
  semesters.forEach((n,i)=>{
    const btn=document.createElement('button');btn.type='button';btn.textContent=String(i+1).padStart(2,'0');btn.setAttribute('aria-label',`Semester ${i+1}: ${n} subjects`);btn.dataset.semester=String(i);choices.append(btn);
    const bar=document.createElement('span');bar.dataset.sem=String(i+1);bar.style.height=`${Math.round(n/20*100)}%`;bars.append(bar);
  });
  for(let i=0;i<67;i++){const span=document.createElement('i');span.dataset.semester=String(semesters.findIndex((_,j)=>i<semesters.slice(0,j+1).reduce((a,b)=>a+b,0)));grid.append(span)}
  function renderSem(sem){const s=semesters[sem];$('#proofSubjectCount').textContent=s;$('#proofSubjectLabel').textContent=`listed subjects in semester ${sem+1}`;$$('[data-semester]',choices).forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.semester===sem)));$$('i',grid).forEach(el=>el.classList.toggle('active',Number(el.dataset.semester)===sem));$$('span',bars).forEach((b,i)=>b.classList.toggle('active',i===sem));}
  choices.addEventListener('click',e=>{const button=e.target.closest('button[data-semester]');if(button)renderSem(Number(button.dataset.semester))});renderSem(0);
  const factors=[['Skill overlap',40,80],['Availability',20,70],['Interests',15,60],['Experience fit',15,90],['Reputation',10,75]];
  const holder=$('#proofMatchSliders');
  const inputs=[];
  factors.forEach(([name,weight,initial],i)=>{
    const group=document.createElement('div');
    group.innerHTML=`<label class="proof-factor-label" for="proofFactor${i}"><span>${name}</span><span>${weight}% WEIGHT · <output id="proofOut${i}">${initial}</output>/100</span></label><input type="range" id="proofFactor${i}" min="0" max="100" step="5" value="${initial}" aria-label="${name} hypothetical match factor" />`;
    holder.append(group);const inp=$('input',group);inputs.push(inp);
    inp.addEventListener('input',()=>{ $(`#proofOut${i}`).textContent=inp.value;renderMatch(); });
  });
  function renderMatch(){const score=factors.reduce((sum,f,i)=>sum+(f[1]/100)*Number(inputs[i].value),0);$('#proofMatchScore').textContent=score.toFixed(1)}renderMatch();
  // The linked research states 7.1094/14.1094/28.1094 MiB under B=260/516/1028.
  const kv={260:7.1094,516:14.1094,1028:28.1094};
  const cache=$('#proofCacheCells');for(let i=0;i<80;i++)cache.append(document.createElement('i'));
  function renderBudget(budget){
    if(!kv[budget])return;
    const value=kv[budget];
    $$('#proofBudgetChoices button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.budget)===budget)));
    $('#proofKvValue').textContent=value.toFixed(2);$('#proofBudgetLabel').textContent=`B = ${budget} TOKENS`;
    $('#proofKvBarLabel').textContent=`${value.toFixed(2)} MiB`;
    $('#proofKvBar').style.setProperty('--bar-size',`${(value/105.6243*100).toFixed(1)}%`);
    const count=Math.round(budget/1028*80);
    $$('#proofCacheCells i').forEach((cell,i)=>cell.classList.toggle('retained',i<count));
  }
  $('#proofBudgetChoices').addEventListener('click',e=>{const b=e.target.closest('button[data-budget]');if(b)renderBudget(Number(b.dataset.budget))});renderBudget(260);
  select('study');
  // For reproducible browser QA; no analytics or network calls.
  window.portfolioProof={select, get state(){return{active,semester:$$('#proofSemesterChoices button').findIndex(b=>b.getAttribute('aria-pressed')==='true')+1,matchScore:$('#proofMatchScore').textContent,kvMiB:$('#proofKvValue').textContent}}};
})();
