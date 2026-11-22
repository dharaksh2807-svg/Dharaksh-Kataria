/* Three low-cost procedural visualization scenes. No framework, assets, or data collection. */
(() => {
  'use strict';
  const root=document.documentElement;
  const stage=document.getElementById('signalStage');
  const canvas=document.getElementById('signalCanvas');
  const ctx=canvas?.getContext('2d',{alpha:true});
  const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
  const reduce=motionPreference.matches;
  const toggle=document.getElementById('motionSwitch');
  const state=document.getElementById('motionState');
  let savedMuted=false;
  try { savedMuted=localStorage.getItem('dk-motion-muted')==='true'; } catch {}
  let muted=reduce||savedMuted;
  root.classList.toggle('motion-off',muted);
  const setMotion=(isMuted)=>{
    muted=motionPreference.matches||Boolean(isMuted);
    root.classList.toggle('motion-off',muted);
    if(state)state.textContent=muted?'OFF':'ON';
    if(toggle){toggle.setAttribute('aria-pressed',String(!muted));toggle.setAttribute('title',muted?'Resume ambient motion':'Pause ambient motion')}
    document.dispatchEvent(new CustomEvent('portfolio:motion',{detail:{muted}}));
    if(!muted)requestFrame();else if(ctx)draw(performance.now());
  };
  if(toggle)toggle.addEventListener('click',()=>setMotion(!muted));
  function openLinkedStudy(){
    const target=document.getElementById(location.hash.slice(1));
    const study=target?.closest('details.render-study')||target?.querySelector('details.render-study');
    if(study)study.open=true;
  }
  addEventListener('hashchange',openLinkedStudy);
  openLinkedStudy();
  if(!stage||!ctx)return;
  const $=(s)=>document.querySelector(s);
  const tabs=[...stage.querySelectorAll('.signal-tab')];
  const scenes={
    network:{number:'01 / 03',title:'Connected intelligence.',description:'Graph structure, relationships and moving signals. Collaboration becomes a living network.'},
    memory:{number:'02 / 03',title:'Selective memory.',description:'Visualizing the idea behind retaining useful context within a fixed cache budget.'},
    world:{number:'03 / 03',title:'Worlds in motion.',description:'Perspective, speed and repeated systems. A study in the geometry of an endless runner.'}
  };
  let current='network',visible=false,w=0,h=0,dpr=1,raf=0,frame=0;
  let pointer={x:0.5,y:0.5},smooth={x:0.5,y:0.5};
  let fade=1,sceneChange=0,lastTime=0;
  const points=Array.from({length:35},(_,i)=>{
    const a=i*2.399963229728653;
    const r=Math.sqrt((i+.65)/35)*.43;
    return {x:.52+Math.cos(a)*r,y:.49+Math.sin(a)*r*1.3,phase:(i*1.43)%6.28,radius:2+(i%4)*1.2}
  });
  function resize(){
    const r=stage.getBoundingClientRect();
    const width=Math.max(1,Math.floor(r.width)),height=Math.max(1,Math.floor(r.height));
    const density=Math.min(devicePixelRatio||1,1.5);
    if(width!==w||height!==h||dpr!==density){w=width;h=height;dpr=density;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
  }
  const line=(x1,y1,x2,y2,color,width=1)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()};
  const disk=(x,y,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()};
  const useTime=()=>muted?0:frame;
  function network(t){
    const pts=points.map((p,i)=>{
      let ph=p.phase+t*.00007;
      const x=(p.x+Math.sin(ph)*.025+(smooth.x-.5)*((i%3+1)*.018))*w;
      const y=(p.y+Math.cos(ph*1.1)*.025+(smooth.y-.5)*((i%4+1)*.012))*h;
      return {x,y,r:p.radius,phase:p.phase};
    });
    ctx.save();ctx.globalCompositeOperation='screen';
    for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){
      let a=pts[i],b=pts[j];const dist=Math.hypot(a.x-b.x,a.y-b.y);
      if(dist<w*.22){const opacity=.26*(1-dist/(w*.22));line(a.x,a.y,b.x,b.y,`rgba(153,195,166,${opacity})`,.8);
      if((i*7+j)%9===0){const f=((t*.00014+i*.13+j*.08)%1);disk(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,1.7,'rgba(255,173,125,.60)')}}
    }
    pts.forEach((p,i)=>{disk(p.x,p.y,p.r+5,'rgba(117,170,137,.038)');disk(p.x,p.y,p.r,i%7===0?'#f2a67c':'#9ac2aa');if(i%7===0){ctx.strokeStyle='rgba(244,165,115,.15)';ctx.beginPath();ctx.arc(p.x,p.y,11+3*Math.sin(t*.001+i),0,Math.PI*2);ctx.stroke()}});
    const cx=w*(.5+(smooth.x-.5)*.08),cy=h*(.51+(smooth.y-.5)*.08);disk(cx,cy,24,'rgba(220,126,86,.08)');disk(cx,cy,8,'#e5a486');
    ctx.restore();
  }
  function memory(t){
    ctx.save();const cols=22,rows=10;
    const cx=w*.57,cy=h*.45;const u=Math.min(w*.031,29),v=Math.min(h*.056,28);
    const offX=(smooth.x-.5)*24,offY=(smooth.y-.5)*16;
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      let xx=cx+(x-cols/2)*u*.9+(y-rows/2)*u*.27+offX;
      let yy=cy+(y-rows/2)*v*.9-(x-cols/2)*v*.16+offY;
      let retained=x<2||x>18||(x>=10&&x<13&&y>2&&y<8);
      let live=retained&&((x*3+y*7)%4!==0||Math.sin(t*.00085+x+y)>0);
      const height=retained?9+3*Math.sin(t*.00045+x*.5+y):2;
      ctx.fillStyle=retained?(live?'rgba(224,152,106,.82)':'rgba(130,177,148,.65)'):'rgba(132,162,145,.08)';
      ctx.fillRect(xx,yy-height,u*.67,v*.58);
      if(retained){line(xx,yy,xx+u*.67,yy,'rgba(252,220,192,.15)',.5);line(xx,yy-height,xx,yy,'rgba(215,150,108,.25)',.7)}
    }
    const startX=w*.21,startY=h*.21;
    ctx.font='10px monospace';ctx.textBaseline='middle';ctx.fillStyle='rgba(158,188,162,.65)';ctx.fillText('INPUT CONTEXT  →',startX,startY);
    line(startX,startY+20,w*.83,startY+20,'rgba(136,175,151,.3)');
    const dot=(t*.085)%(w*.60);disk(startX+dot,startY+20,3,'#e7a37e');
    ctx.fillStyle='rgba(222,162,128,.65)';ctx.fillText('RETAINED / CHUNKS',w*.6,h*.79);ctx.restore();
  }
  function world(t){
    ctx.save();
    const horizon=h*.22;
    const vx=w*(.53+(smooth.x-.5)*.065),vy=h*(.20+(smooth.y-.5)*.035);
    ctx.fillStyle='rgba(58,84,70,.12)';ctx.fillRect(0,horizon,w,h-horizon);
    for(let i=0;i<14;i++){
      let depth=i/14;let x=w*((i*29%103)/103),size=18+(i*41%95);
      let base=h*.69;
      ctx.fillStyle=i%2?'rgba(88,121,104,.22)':'rgba(54,85,68,.22)';ctx.fillRect(x,base-size*1.6,size*.75,size*1.6);
      for(let j=0;j<3;j++)line(x+j*size*.2,base-size*1.4,x+j*size*.2,base,'rgba(168,210,177,.09)',1);
    }
    const p=[[0,h],[w,h],[vx+130,vy],[vx-130,vy]];
    ctx.fillStyle='rgba(59,88,68,.31)';ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();
    for(let i=-3;i<=3;i++){
      let bx=vx+i*w*.19, tx=vx+i*12;
      line(tx,vy,bx,h,i%3===0?'rgba(238,170,128,.5)':'rgba(177,198,173,.29)',i%3===0?2:1);
    }
    for(let i=0;i<28;i++){
      let phase=((i/28+t*.00013)%1);
      let z=phase*phase;
      let yy=vy+(h-vy)*z;
      let half=12+z*w*.58;
      line(vx-half,yy,vx+half,yy,`rgba(164,196,165,${.09+.30*z})`,.5+z*2);
    }
    const pathPhase=(Math.sin(t*.00035)+1)*.5;
    const trainY=vy+((t*.000035)%1)*h*.62;
    const z=Math.min(1,(trainY-vy)/(h-vy));
    const trainX=vx+w*.095*z;
    const size=19+z*115;
    ctx.fillStyle='#db8766';ctx.beginPath();ctx.moveTo(trainX-size*.3,trainY);ctx.lineTo(trainX+size*.25,trainY);ctx.lineTo(trainX+size*.6,trainY+size*1.5);ctx.lineTo(trainX-size*.56,trainY+size*1.5);ctx.closePath();ctx.fill();
    ctx.fillStyle='#293d36';ctx.fillRect(trainX-size*.2,trainY+size*.1,size*.36,size*.33);
    ctx.fillStyle='#fbd3aa';disk(trainX-size*.27,trainY+size*1.19,Math.max(1,size*.035),'#fbd3aa');
    ctx.restore();
  }
  function draw(now){
    resize();ctx.clearRect(0,0,w,h);
    const grad=ctx.createRadialGradient(w*.58,h*.38,10,w*.56,h*.45,w*.6);
    grad.addColorStop(0,'rgba(47,92,70,.23)');grad.addColorStop(1,'rgba(13,22,17,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
    ctx.save();ctx.globalAlpha=Math.min(1,fade);
    if(current==='network')network(useTime());else if(current==='memory')memory(useTime());else world(useTime());
    ctx.restore();
  }
  function render(now){raf=0;if(!visible||document.hidden||muted)return;
    if(now-lastTime<32){requestFrame();return}lastTime=now;
    frame=now;
    smooth.x+=(pointer.x-smooth.x)*.055;smooth.y+=(pointer.y-smooth.y)*.055;
    fade=Math.min(1,fade+.065);draw(now);requestFrame();
  }
  function requestFrame(){if(!raf&&visible&&!document.hidden&&!muted)raf=requestAnimationFrame(render)}
  function setScene(next){
    if(!scenes[next])return;
    current=next;fade=muted?1:.05;
    tabs.forEach(b=>{let active=b.dataset.scene===next;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active))});
    $('#signalNumber').textContent=scenes[next].number;
    $('#signalTitle').textContent=scenes[next].title;
    $('#signalDescription').textContent=scenes[next].description;
    if(muted)draw(0);else requestFrame();
  }
  tabs.forEach(b=>b.addEventListener('click',()=>setScene(b.dataset.scene)));
  stage.addEventListener('pointermove',e=>{if(muted)return;const box=stage.getBoundingClientRect();pointer.x=Math.max(0,Math.min(1,(e.clientX-box.left)/box.width));pointer.y=Math.max(0,Math.min(1,(e.clientY-box.top)/box.height))},{passive:true});
  stage.addEventListener('pointerleave',()=>{pointer.x=.5;pointer.y=.5});
  new ResizeObserver(()=>{resize();draw(performance.now())}).observe(stage);
  new IntersectionObserver(es=>{visible=!!es[0]?.isIntersecting;if(visible){draw(performance.now());requestFrame()}else if(raf){cancelAnimationFrame(raf);raf=0}},{rootMargin:'100px 0px 100px'}).observe(stage);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)requestFrame()});
  let scrollTick=false;
  window.addEventListener('scroll',()=>{
    if(scrollTick)return;scrollTick=true;
    requestAnimationFrame(()=>{scrollTick=false;const all=Math.max(1,document.documentElement.scrollHeight-innerHeight),v=Math.round(Math.min(1,scrollY/all)*100);const meter=$('#viewPercent');if(meter)meter.textContent=String(v).padStart(2,'0')})
  },{passive:true});
  setMotion(muted);
})();
