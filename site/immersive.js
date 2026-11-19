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
  function line(x,y,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke()}
  function circ(x,y,rr,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,rr,0,Math.PI*2);ctx.fill()}
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

  // A conceptual token lifecycle instrument. Selection is illustrative, never
  // a measured attention map or a benchmark performance visualization.
  function sceneMemory(t,alpha){
    if(alpha<=.004)return;
    ctx.save();ctx.globalAlpha=alpha;
    const cx=w*(mobile()?.69:.735),cy=h*(mobile()?.35:.485);
    const sc=mobile()?.51:Math.min(1.06,w/1350),cols=22,rows=8;
    const pitch=23*sc,vy=23*sc,width=cols*pitch,height=rows*vy;
    const left=cx-width*.5+pointerX*10*sc,top=cy-height*.55+pointerY*8*sc;
    const compress=smooth(clamp(prog*3-1.05));
    const boxPad=20*sc;
    // Deep glass backplate, highlighted edges and reference grid.
    const glass=ctx.createLinearGradient(left,top,left+width,top+height);
    glass.addColorStop(0,'rgba(31,63,51,.70)');
    glass.addColorStop(1,'rgba(13,29,25,.84)');
    ctx.fillStyle=glass;
    ctx.fillRect(left-boxPad,top-32*sc,width+boxPad*2,height+118*sc);
    ctx.strokeStyle='rgba(163,204,173,.42)';ctx.lineWidth=1.2;
    ctx.strokeRect(left-boxPad,top-32*sc,width+boxPad*2,height+118*sc);
    ctx.fillStyle='#b9d7c0';ctx.textAlign='left';ctx.font=(mobile()?'8':'11')+'px monospace';
    ctx.fillText('01 / INCOMING CONTEXT',left,top-50*sc);
    ctx.fillText('02 / RETAINED CACHE',left,top+height+48*sc);
    ctx.fillStyle='#c9a289';ctx.fillText('ILLUSTRATIVE TOKEN SELECTION',left,top+height+94*sc);
    // Three incoming token markers travel in staggered lanes into the cache.
    for(let lane=0;lane<3;lane++){
      const span=Math.max(1,width*.34),phase=(t*.33+lane*.29)%1;
      const bx=left+width*.10+phase*span+lane*7*sc;
      const by=top-25*sc+lane*4*sc;
      ctx.fillStyle='rgba(229,175,122,.65)';
      ctx.fillRect(bx,by,12*sc,3*sc);
    }
    const tileW=pitch*.70,tileH=vy*.64;
    const keepList=[];
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const i=row*cols+col;
      // Fixed synthetic rule: visual example, not a real attention/eviction score.
      const keep=col<2||col>19||((i*17+row*7)%13)<3;
      const x=left+col*pitch+(row%2)*2*sc,y=top+row*vy;
      const activation=.58+.42*Math.sin(t*1.3+col*.21+row*.65);
      const opacity=keep?.52+.35*activation:lerp(.42,.095,compress);
      const depth=keep?2.7*sc:0;
      if(!keep&&compress>.35){
        const displacement=compress*compress*(14+(i%4)*6)*sc;
        ctx.fillStyle='rgba(150,116,105,'+(.24*(1-compress))+')';
        ctx.fillRect(x+displacement,y+displacement*.3,tileW,tileH);
      }
      ctx.fillStyle=keep?'rgba(141,198,160,'+opacity+')':'rgba(96,126,113,'+opacity+')';
      ctx.fillRect(x,y,tileW,tileH);
      if(keep){
        ctx.fillStyle='rgba(245,194,151,'+(.35+.45*activation)+')';
        ctx.fillRect(x,y,tileW,Math.max(1,depth));
        keepList.push(i);
      }else if(compress>.18&&((i+Math.floor(t*3))%17===0)){
        ctx.strokeStyle='rgba(226,127,94,'+(.22+.45*compress)+')';
        ctx.strokeRect(x-1,y-1,tileW+2,tileH+2);
      }
    }
    // Memory lanes: compressed bank is a meaningful layout transformation.
    const bankTop=top+height+14*sc;
    const bankWidth=width*.91;
    ctx.fillStyle='rgba(9,27,22,.85)';
    ctx.fillRect(left,bankTop,width,22*sc);
    ctx.strokeStyle='rgba(143,197,160,.29)';
    ctx.strokeRect(left,bankTop,width,22*sc);
    const slots=Math.min(28,keepList.length);
    for(let i=0;i<slots;i++){
      const x=left+8*sc+i*(bankWidth/slots),wid=Math.max(2,bankWidth/slots-3*sc);
      const activated=(i+Math.floor(t*2.1))%9===0;
      ctx.fillStyle=activated?'rgba(246,183,130,.96)':'rgba(145,194,154,'+lerp(.22,.85,compress)+')';
      ctx.fillRect(x,bankTop+7*sc,wid,8*sc);
    }
    // Distinct lifecycle legend: every color has a documented visual meaning.
    if(!mobile()){
      const ly=top+height+68*sc;
      for(const [i,label,color] of [[0,'INCOMING','#e5af7a'],[1,'RETAINED','#9bcaa9'],[2,'EVICTED','#ad796d']]){
        const lx=left+i*width*.32;
        ctx.fillStyle=color;ctx.fillRect(lx,ly-8*sc,9*sc,9*sc);
        ctx.fillStyle='#bfcdc0';ctx.fillText(label,lx+15*sc,ly);
      }
    }
    // A small steady scan line suggests instrumentation without fake metrics.
    const scanY=top+((t*.07)%1)*height;
    ctx.strokeStyle='rgba(228,177,129,.14)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(left,scanY);ctx.lineTo(left+width,scanY);ctx.stroke();
    ctx.restore();
  }

  // Cinematic perspective railway: conceptual 2.5D geometry, never game footage.
  function sceneMetro(t,alpha){
    if(alpha<=.004)return;
    ctx.save();ctx.globalAlpha=alpha;
    const sc=mobile()?.72:1,cx=w*(mobile()?.68:.733)+pointerX*12*sc;
    const horizon=h*(mobile()?.27:.38)+pointerY*5*sc,base=h*1.08;
    const spread=Math.min(w*.36,h*.70,610)*sc;
    const road=z=>Math.pow(clamp(z),1.65);
    const xp=(lane,z)=>cx+lane*spread*road(z);
    const yp=z=>horizon+(base-horizon)*road(z);
    const halo=ctx.createRadialGradient(cx,horizon+90*sc,5,cx,horizon+90*sc,spread*1.5);
    halo.addColorStop(0,'rgba(202,139,94,.29)');
    halo.addColorStop(.45,'rgba(97,130,103,.12)');
    halo.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=halo;ctx.fillRect(cx-spread*1.6,horizon-spread,spread*3.2,spread*2.8);
    // A continuous tunnel volume, with inset portal geometry layered by depth.
    for(let i=0;i<16;i++){
      const z=((i/16+t*.13)%1),d=road(z),half=24*sc+spread*.90*d;
      const roof=horizon-(32*sc+spread*.85*d),floor=horizon+(base-horizon)*d*.68;
      const light=.05+d*.22;
      ctx.strokeStyle='rgba(221,161,113,'+light+')';ctx.lineWidth=.8+d*2.1;
      ctx.beginPath();ctx.moveTo(cx-half,floor);ctx.lineTo(cx-half,roof+half*.18);
      ctx.lineTo(cx-half*.74,roof);ctx.lineTo(cx+half*.74,roof);
      ctx.lineTo(cx+half,roof+half*.18);ctx.lineTo(cx+half,floor);ctx.stroke();
      if(i%3===0){
        const lx=cx+half*.79,ly=roof+half*.12;
        const ring=ctx.createRadialGradient(lx,ly,0,lx,ly,12+14*d);
        ring.addColorStop(0,'rgba(246,200,150,'+(.15+d*.55)+')');
        ring.addColorStop(1,'rgba(246,200,150,0)');
        ctx.fillStyle=ring;ctx.fillRect(lx-22,ly-22,44,44);
      }
    }
    // Longitudinal construction lines give the railway legible three-lane depth.
    const rails=[-1.0,-.82,-.38,-.22,.22,.38,.82,1.0];
    for(const lane of rails){
      const outside=Math.abs(lane)>.9,main=Math.abs(lane)>.75 || Math.abs(lane)<.25;
      ctx.strokeStyle=main?'rgba(232,171,119,.71)':'rgba(129,170,147,.30)';
      ctx.lineWidth=outside?2.3:1.7;
      ctx.beginPath();ctx.moveTo(cx+lane*6,horizon);ctx.lineTo(cx+lane*spread,base);ctx.stroke();
      ctx.strokeStyle='rgba(244,194,142,.12)';ctx.lineWidth=5;
      ctx.beginPath();ctx.moveTo(cx+lane*6,horizon);ctx.lineTo(cx+lane*spread,base);ctx.stroke();
    }
    // Moving sleepers accelerate perceptually as they approach the camera.
    for(let i=0;i<34;i++){
      const z=((i/34+t*.47)%1),d=road(z),y=yp(z),width=spread*.91*d;
      ctx.strokeStyle='rgba(165,204,169,'+(.07+d*.62)+')';ctx.lineWidth=.6+d*2.1;
      ctx.beginPath();ctx.moveTo(cx-width,y);ctx.lineTo(cx+width,y);ctx.stroke();
      if(d>.50){
        ctx.strokeStyle='rgba(247,183,126,'+(.1+d*.14)+')';ctx.lineWidth=.7;
        ctx.beginPath();ctx.moveTo(cx-width*.98,y+3*d);ctx.lineTo(cx+width*.98,y+3*d);ctx.stroke();
      }
    }
    // Subtle route dividers, with positive forward motion.
    for(const lane of [-.55,.55]){
      for(let j=0;j<15;j++){
        const start=(j/15+t*.42)%1,end=Math.min(1,start+.025);
        ctx.strokeStyle='rgba(221,158,110,'+(.07+road(start)*.42)+')';
        ctx.lineWidth=1+road(start)*2;
        ctx.beginPath();ctx.moveTo(xp(lane,start),yp(start));ctx.lineTo(xp(lane,end),yp(end));ctx.stroke();
      }
    }
    // Approaching train: side wall, front fascia, glass, destination and lights.
    // Slow push/pull avoids teleporting an obstacle into the foreground.
    const z=.60+.06*Math.sin(t*.33),d=road(z),tw=(140+spread*.22)*Math.sqrt(z)*sc,th=(190+spread*.32)*Math.sqrt(z)*sc;
    const tx=xp(.49,z),ty=yp(z)-th*.30;
    const side=tw*.20;
    ctx.fillStyle='#0d1e1a';
    ctx.beginPath();ctx.moveTo(tx-tw*.50,ty-th*.6);
    ctx.lineTo(tx-tw*.50+side,ty-th*.77);
    ctx.lineTo(tx+tw*.53+side,ty-th*.77);
    ctx.lineTo(tx+tw*.5,ty-th*.6);
    ctx.closePath();ctx.fill();
    ctx.fillStyle='#234138';
    ctx.beginPath();ctx.moveTo(tx+tw*.50,ty-th*.60);
    ctx.lineTo(tx+tw*.5+side,ty-th*.75);
    ctx.lineTo(tx+tw*.5+side,ty+th*.44);
    ctx.lineTo(tx+tw*.5,ty+th*.6);ctx.closePath();ctx.fill();
    const front=ctx.createLinearGradient(tx-tw*.5,ty,tx+tw*.5,ty);
    front.addColorStop(0,'#152c25');front.addColorStop(.55,'#325648');front.addColorStop(1,'#172e27');
    ctx.fillStyle=front;ctx.strokeStyle='rgba(216,163,114,.85)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(tx-tw*.5,ty-th*.6);
    ctx.lineTo(tx+tw*.5,ty-th*.6);ctx.lineTo(tx+tw*.5,ty+th*.55);
    ctx.lineTo(tx-tw*.5,ty+th*.55);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#0d2420';ctx.fillRect(tx-tw*.36,ty-th*.40,tw*.72,th*.46);
    const glass=ctx.createLinearGradient(tx-tw*.3,ty-th*.38,tx+tw*.3,ty);
    glass.addColorStop(0,'rgba(165,207,187,.40)');
    glass.addColorStop(.55,'rgba(55,111,101,.14)');
    glass.addColorStop(1,'rgba(19,43,38,.68)');
    ctx.fillStyle=glass;ctx.fillRect(tx-tw*.34,ty-th*.38,tw*.68,th*.42);
    ctx.strokeStyle='rgba(180,213,187,.55)';ctx.lineWidth=1;
    ctx.strokeRect(tx-tw*.34,ty-th*.38,tw*.68,th*.42);
    ctx.fillStyle='#d6ab7b';ctx.fillRect(tx-tw*.22,ty-th*.54,tw*.44,Math.max(3,th*.045));
    ctx.fillStyle='#17271f';ctx.fillRect(tx-tw*.31,ty+th*.19,tw*.62,th*.19);
    // Twin warm headlights; restrained glow, without flashing.
    for(const dir of [-1,1]){
      const lx=tx+dir*tw*.34,ly=ty+th*.39;
      ctx.fillStyle='#f4dcb2';ctx.fillRect(lx-tw*.052,ly-th*.025,tw*.104,th*.055);
      const beam=ctx.createRadialGradient(lx,ly,1,lx,ly,16*sc+tw*.16);
      beam.addColorStop(0,'rgba(249,213,158,.47)');
      beam.addColorStop(1,'rgba(249,213,158,0)');
      ctx.fillStyle=beam;ctx.beginPath();ctx.arc(lx,ly,16*sc+tw*.16,0,Math.PI*2);ctx.fill();
    }
    ctx.strokeStyle='rgba(234,177,133,.46)';
    for(let k=0;k<3;k++){const y=ty+th*(.10+k*.045);line(tx-tw*.26,y,tx+tw*.26,y,'rgba(228,183,147,.34)',.7)}
    // One small track-side signal establishes scale, not a fake game obstacle.
    const signalX=xp(-.85,.68),signalY=yp(.68)-34*sc;
    ctx.strokeStyle='rgba(166,200,169,.46)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(signalX,signalY+55*sc);ctx.lineTo(signalX,signalY);ctx.stroke();
    ctx.fillStyle='#1a302a';ctx.strokeStyle='rgba(215,157,108,.64)';
    ctx.fillRect(signalX-7*sc,signalY-11*sc,14*sc,25*sc);
    circ(signalX,signalY-2*sc,2.8*sc,'#e5a57b');
    ctx.textAlign='left';ctx.font=(mobile()?'8':'10')+'px monospace';
    ctx.fillStyle='#c7d3c5';
    ctx.fillText('THREE-LANE PROCEDURAL TRACK',cx-spread*.68,horizon-53*sc);
    ctx.fillStyle='#e1ab82';
    ctx.fillText('CONCEPTUAL WORLD · NOT GAMEPLAY FOOTAGE',cx-spread*.68,Math.min(h-44,base-67*sc));
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
