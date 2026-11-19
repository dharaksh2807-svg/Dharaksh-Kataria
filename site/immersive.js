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
  let motionOff = reduced.matches || document.documentElement.classList.contains('motion-off');
  const curtain = $('#introCurtain'), meter = $('#introMeter');
  if(curtain)curtain.hidden=true;
  document.addEventListener('portfolio:motion',(e)=>{
    motionOff=Boolean(e.detail?.muted);
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
  let w=0,h=0,dpr=1,prog=0,active=0,inView=false,frame=0,raf=0,lastDraw=0;
  let pointerX=0,pointerY=0,tarX=0,tarY=0,visibility=false;
  let reducedChapter=null;
  const mobile=()=>w<760;
  const DPR=()=>Math.min(1.65,window.devicePixelRatio||1);
  const r=(seed)=>{const x=Math.sin(seed*182.753+71.9)*43758.545;return x-Math.floor(x)};
  const points=[];
  for(let a=0;a<15;a++)for(let b=0;b<17;b++){
    const theta=(a/15)*Math.PI*2,phi=(b/17)*Math.PI;
    points.push({theta,phi,s:r(a*23+b*7),label:a*17+b});
  }
  function resize(){
    const rect=sticky.getBoundingClientRect();w=Math.max(100,rect.width);h=Math.max(100,rect.height);dpr=DPR();
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    if(!inView)drawOnce();
  }
  const bg=()=>{
    ctx.fillStyle='#0e1916';ctx.fillRect(0,0,w,h);
    const grd=ctx.createRadialGradient(w*(mobile()?.67:.72),h*.48,25,w*(mobile()?.67:.72),h*.48,Math.max(w,h)*.65);
    grd.addColorStop(0,'#283d32');grd.addColorStop(.32,'#172c24');grd.addColorStop(1,'#0d1714');ctx.fillStyle=grd;ctx.fillRect(0,0,w,h);
    ctx.globalAlpha=.13;ctx.strokeStyle='#aec4a4';ctx.lineWidth=.7;
    const step=Math.max(48,Math.round(w/22));
    for(let x=0;x<w;x+=step){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
    for(let y=0;y<h;y+=step){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
    ctx.globalAlpha=1;
  };
  function glow(x,y,rad,color,alpha=1){
    const grd=ctx.createRadialGradient(x,y,0,x,y,rad);
    grd.addColorStop(0,color);grd.addColorStop(.4,color.replace(/\.[0-9]+\)$/,'.05)'));grd.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=alpha;ctx.fillStyle=grd;ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  }
  function line(x,y,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke()}
  function circ(x,y,rr,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,rr,0,Math.PI*2);ctx.fill()}
  function project(x,y,z,rx=0){
    const cy=Math.cos(rx),sy=Math.sin(rx), zz=z*cy-x*sy,xx=x*cy+z*sy;
    const f=690,scale=f/(f+zz+500);
    return {x:w*(mobile()?.67:.73)+xx*scale,y:h*(mobile()?.36:.5)+y*scale,s:scale,z:zz};
  }

  // Six semester clusters, 67 deliberately illustrative nodes. The links are
  // conceptual, not assertions about a production database relationship.
  function sceneKnowledge(t,alpha){
    if(alpha<=.004)return;
    ctx.save();ctx.globalAlpha=alpha;
    const cx=w*(mobile()?.70:.735),cy=h*(mobile()?.37:.49);
    const spread=Math.min(w*(mobile()?.78:.46),650),height=Math.min(h*.57,490);
    const parallaxX=pointerX*(mobile()?5:15),parallaxY=pointerY*(mobile()?4:12);
    const groupR=Math.min(spread*.125,mobile()?24:65);
    const clusters=Array.from({length:6},(_,i)=>({
      x:cx+(i%3-1)*spread*.32+parallaxX*(i%2?.6:1.1),
      y:cy+(Math.floor(i/3)-.5)*height*.67+parallaxY*(i%3?.6:1),
      depth:.85+.07*(i%3),count:i===5?12:11
    }));
    // Deliberate backplate and six radial depth cues.
    const aura=ctx.createRadialGradient(cx,cy,10,cx,cy,spread*.78);
    aura.addColorStop(0,'rgba(83,132,105,.16)');
    aura.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=aura;ctx.fillRect(cx-spread*.8,cy-height*.8,spread*1.6,height*1.6);
    ctx.strokeStyle='rgba(170,205,174,.12)';ctx.lineWidth=1;
    ctx.strokeRect(cx-spread*.53,cy-height*.51,spread*1.06,height*1.02);
    // Multiple semantically illustrative information pathways; trace with moving light.
    const links=[[0,1],[1,2],[3,4],[4,5],[0,3],[1,4],[2,5],[0,4],[1,5]];
    links.forEach(([a,b],i)=>{
      const u=clusters[a],v=clusters[b],bend=((i%3)-1)*28;
      ctx.strokeStyle='rgba(155,188,156,.23)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(u.x,u.y);
      ctx.bezierCurveTo(u.x+(v.x-u.x)*.40,u.y+bend,v.x-(v.x-u.x)*.4,v.y-bend,v.x,v.y);
      ctx.stroke();
      const speed=(t*.11+i*.09)%1;
      const point=1-speed,dx=v.x-u.x,dy=v.y-u.y;
      const bx=u.x+dx*point,by=u.y+dy*point+Math.sin(point*Math.PI)*bend*.40;
      const beat=ctx.createRadialGradient(bx,by,0,bx,by,10);
      beat.addColorStop(0,'rgba(243,183,130,.68)');
      beat.addColorStop(1,'rgba(243,183,130,0)');
      ctx.fillStyle=beat;ctx.fillRect(bx-10,by-10,20,20);
    });
    clusters.forEach((g,i)=>{
      const radius=groupR*(.92+.08*g.depth),ringStart=-Math.PI/2;
      const glowRing=ctx.createRadialGradient(g.x,g.y,3,g.x,g.y,radius*1.6);
      glowRing.addColorStop(0,'rgba(141,187,152,.18)');
      glowRing.addColorStop(1,'rgba(141,187,152,0)');
      ctx.fillStyle=glowRing;ctx.beginPath();ctx.arc(g.x,g.y,radius*1.6,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(175,212,184,.35)';ctx.lineWidth=1.3;
      ctx.beginPath();ctx.arc(g.x,g.y,radius,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='rgba(203,156,118,.42)';
      ctx.beginPath();ctx.arc(g.x,g.y,radius+5,ringStart+t*.14+i*.5,ringStart+t*.14+i*.5+Math.PI*.44);ctx.stroke();
      const base=g.count;
      for(let j=0;j<base;j++){
        const band=j%3===0?.64:1.0;
        const angle=ringStart+j*Math.PI*2/base+(t*.025)*(i%2?-1:1);
        const x=g.x+Math.cos(angle)*radius*band,y=g.y+Math.sin(angle)*radius*.73*band;
        const lit=(Math.floor(t*.72+i*2)%base)===j;
        const scale=lit?2.75:Math.max(1.3,radius*.033);
        circ(x,y,scale,lit?'#f4ba8f':'#9ebfab');
        if(lit){ctx.strokeStyle='rgba(244,186,143,.52)';ctx.beginPath();ctx.arc(x,y,scale*2.9,0,Math.PI*2);ctx.stroke();}
      }
      ctx.fillStyle='#d6dfd0';ctx.font=(mobile()?'10':'12')+'px monospace';ctx.textAlign='center';
      ctx.fillText('S'+String(i+1).padStart(2,'0'),g.x,g.y+4);
      ctx.textAlign='start';
    });
    ctx.fillStyle='#c5d3c3';ctx.font=(mobile()?'8':'10')+'px monospace';
    ctx.fillText('06 SEMESTERS / 67 SUBJECTS',cx-spread*.52,cy-height*.54);
    ctx.fillStyle='#d9a889';
    ctx.fillText('CONCEPTUAL NETWORK · ILLUSTRATIVE LINKS',cx-spread*.52,cy+height*.57);
    ctx.restore();
  }
  function sceneMemory(t,alpha){
    if(alpha<=.004)return;ctx.save();ctx.globalAlpha=alpha;
    const sc=mobile()?.65:1, cx=w*(mobile()?.66:.73),cy=h*(mobile()?.31:.48);
    glow(cx,cy,Math.min(w,h)*.65,'rgba(95,159,133,.25)',alpha);
    const cols=25,rows=8,dx=25*sc,dy=24*sc;
    const local=clamp(prog*3-1);const compress=smooth(local*.8+.15);
    ctx.save();ctx.translate(cx-(cols*dx)/2,cy-(rows*dy)/2);
    const boxes=[];
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const keep=(col<2 || col>20 || (col>=10 && col<=12 && row%2===0));
      const nx=col*dx+row*4+Math.sin(t*.5+row)*5;
      const ny=row*dy+(col%2)*4;
      const squeeze=keep?lerp(1,.78,compress):1;
      const moved=keep?(col<2?-8:col>20?20:-2)*compress*sc:(row%2?9:-9)*compress*sc;
      const opacity=keep?lerp(.75,1,compress):lerp(.45,.035,compress);
      boxes.push({x:nx+moved,y:ny+Math.sin(t*.6+col*.2)*2*sc,o:opacity,keep,w:19*sc*squeeze,h:16*sc});
    }
    boxes.forEach((b,i)=>{
      const phase=Math.sin(t*1.8+i*.2);
      ctx.globalAlpha=alpha*b.o;
      ctx.fillStyle=b.keep?(phase>.8?'#eab08b':'#8fbea0'):'#526d5d';
      ctx.fillRect(b.x,b.y,b.w,b.h);
      if(b.keep){ctx.fillStyle='rgba(246,240,206,.32)';ctx.fillRect(b.x,b.y,b.w,2*sc)}
    });
    ctx.globalAlpha=alpha;
    ctx.strokeStyle='rgba(143,195,156,.38)';ctx.strokeRect(-16,-26,cols*dx+32,rows*dy+52);
    ctx.fillStyle='#b7cbb9';ctx.font='10px monospace';
    if(w>760){ctx.fillText('FULL CONTEXT',0,-38);ctx.fillText('RETENTION / BUDGETED',cols*dx-160,rows*dy+48)}
    ctx.restore();
    // Curve traces move dynamically across the data field.
    ctx.strokeStyle='rgba(232,156,108,.45)';ctx.lineWidth=1.5;ctx.beginPath();
    for(let x=0;x<320*sc;x+=4){const y=Math.sin(x*.028+t*1.2)*23*sc+Math.sin(x*.065-t*.5)*10*sc;const xx=cx-160*sc+x,yy=cy+155*sc+y;if(x===0)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy)}ctx.stroke();
    ctx.restore();
  }
  function sceneMetro(t,alpha){
    if(alpha<=.004)return;ctx.save();ctx.globalAlpha=alpha;
    const cx=w*(mobile()?.67:.73), horizon=h*(mobile()?.28:.42), base=h*(mobile()?.92:1.04);
    glow(cx,horizon+90,Math.min(w,h)*.6,'rgba(214,122,84,.27)',alpha);
    // Forward motion: rails and track ties converge to a shared vanishing point.
    const drift=pointerX*18;
    ctx.strokeStyle='rgba(224,156,113,.8)';ctx.lineWidth=2.5;
    for(const x of [-2.2,-1,-.25,.25,1,2.2]){
      line(cx+drift+x*5,horizon,cx+x*w*.20,base,'rgba(223,153,111,'+(Math.abs(x)===.25?.8:.28)+')',Math.abs(x)===.25?2:1);
    }
    for(let i=1;i<30;i++){
      const z=((i/30+(t*.36)%1)%1);
      const depth=Math.pow(z,2.5),y=lerp(horizon,base,depth);
      const width=lerp(6,w*.37,depth);
      line(cx-width,y,cx+width,y,`rgba(155,181,159,${.08+depth*.62})`,.5+depth*1.8);
    }
    // Light tunnels, repeated concentric perspective portals.
    for(let i=1;i<15;i++){
      const z=((i/15+(t*.17)%1)%1),depth=Math.pow(z,1.8);
      const size=25+depth*Math.min(w,h)*.54;
      ctx.strokeStyle=`rgba(212,149,107,${.04+depth*.21})`;ctx.lineWidth=1+depth*1.8;
      const yy=horizon+(base-horizon)*depth*.23;
      ctx.beginPath();ctx.moveTo(cx-size,yy+size*.35);ctx.lineTo(cx-size,yy-size*.55);ctx.lineTo(cx-size*.73,yy-size*.8);ctx.lineTo(cx+size*.73,yy-size*.8);ctx.lineTo(cx+size,yy-size*.55);ctx.lineTo(cx+size,yy+size*.35);ctx.stroke();
    }
    // Stylized approaching train: accurate concept art, not playable footage.
    const zz=(.12+((t*.075)%1)*.88);const depth=Math.pow(zz,1.6);
    const trainW=(18+180*depth)*(mobile()?.6:1),trainH=(30+155*depth)*(mobile()?.6:1);
    const tx=cx+trainW*.57,ty=horizon+depth*(base-horizon)*.37;
    ctx.fillStyle='#192b28';ctx.strokeStyle='rgba(233,168,124,.75)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(tx-trainW*.5,ty-trainH*.65);ctx.lineTo(tx+trainW*.45,ty-trainH*.65);ctx.lineTo(tx+trainW*.55,ty+trainH*.35);ctx.lineTo(tx-trainW*.57,ty+trainH*.35);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(122,166,147,.30)';ctx.fillRect(tx-trainW*.39,ty-trainH*.48,trainW*.73,trainH*.48);
    for(let j=0;j<3;j++){const lx=tx-trainW*.31+(j*trainW*.29);ctx.fillStyle='#e7ab85';ctx.fillRect(lx,ty+trainH*.16,Math.max(2,trainW*.065),Math.max(3,trainH*.043));glow(lx,ty+trainH*.16,12+10*depth,'rgba(238,157,102,.32)',alpha)}
    ctx.fillStyle='rgba(177,209,180,.75)';ctx.font='10px monospace';
    if(w>760){ctx.fillText('PROCEDURAL / INFINITE TRACK',cx-140,horizon-110);ctx.fillText('THREE.JS / WORLD SYSTEMS',cx+90,base-50)}
    ctx.restore();
  }
  function paint(now){
    frame=now*.001;pointerX+=(tarX-pointerX)*.08;pointerY+=(tarY-pointerY)*.08;
    ctx.setTransform(dpr,0,0,dpr,0,0);bg();
    const raw=prog*2;const seg=Math.floor(raw),frac=raw-seg;
    const mix=smooth(frac);
    if(seg<=0){sceneKnowledge(frame,1-mix);sceneMemory(frame,mix)}
    else if(seg===1){sceneMemory(frame,1-mix);sceneMetro(frame,mix)}
    else sceneMetro(frame,1);
    // Orbiting scan line: avoid screen-wide paint storm, just one stroked path.
    ctx.save();ctx.strokeStyle='rgba(202,160,122,.08)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,h*.67+Math.sin(frame*.23)*h*.06);ctx.lineTo(w,h*.67+Math.sin(frame*.23)*h*.06);ctx.stroke();ctx.restore();
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
    prog=(reduced.matches&&reducedChapter!==null)?reducedChapter/2:next;
    const chapter=(reduced.matches&&reducedChapter!==null)?reducedChapter:Math.min(2,Math.floor(next*3+1e-5));
    if(chapter!==active){active=chapter;panels.forEach((p,i)=>{p.classList.toggle('is-current',i===active);p.setAttribute('aria-hidden',String(i!==active));p.inert=i!==active});jumpButtons.forEach((b,i)=>{b.classList.toggle('is-active',i===active);if(i===active)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')});if(status)status.textContent=`SYSTEM 0${active+1} / ONLINE`}
    if(readout)readout.textContent=String(Math.round(prog*100)).padStart(3,'0')+'%';
    if(progressBar)progressBar.style.width=`${prog*100}%`;
    if(motionOff && inView)drawOnce();
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
  sticky.addEventListener('pointermove',e=>{const r=sticky.getBoundingClientRect();tarX=clamp((e.clientX-r.left)/r.width)*2-1;tarY=clamp((e.clientY-r.top)/r.height)*2-1},{passive:true});
  sticky.addEventListener('pointerleave',()=>{tarX=tarY=0},{passive:true});
  jumpButtons.forEach((b,i)=>b.addEventListener('click',()=>{
    if(reduced.matches){reducedChapter=i;updateJourney();drawOnce();return}
    const scrollTop=window.scrollY+story.getBoundingClientRect().top;
    const length=Math.max(1,story.getBoundingClientRect().height-innerHeight);
    const target=scrollTop+length*([.04,.50,.96][i]);
    window.scrollTo({top:target,behavior:motionOff?'instant':'smooth'});
  }));
  resize();updateJourney();panels.slice(1).forEach(p=>p.inert=true);

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
