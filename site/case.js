/* Original scene-based case study illustrations. They are NOT real app screenshots. */
(()=>{
'use strict';
const c=document.getElementById('cpArt'),stage=document.getElementById('cpHeroArt');if(!c||!stage)return;
const ctx=c.getContext('2d',{alpha:true});if(!ctx)return;
const id=document.body.dataset.caseId||'srmedu';const reduced=matchMedia('(prefers-reduced-motion: reduce)');let visible=true,paused=reduced.matches,drag=false,px=0,ay=.7,ax=.21,clock=0,last=0,raf=0,W=0,H=0,dpr=1;
const palette={srmedu:['#d5ab8a','#6ca395'],kv:['#c7afe0','#83b9ab'],projectmatch:['#a2d1b2','#e2a583'],metro:['#e5b48d','#78a295'],oodp:['#dbabcf','#b1c6ac'],fairshift:['#b6d2a6','#dd9b7d'],regula:['#93c4a9','#caa0da'],revalue:['#a6bf8b','#e1ad83'],postpro:['#c9b8e4','#dbad94'],micchami:['#e3c386','#8cc5ad'],alarm:['#cda8cf','#a4cdbf'],toll:['#b6d0a5','#e2b189']}[id]||['#dca48a','#9cbcaf'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function project(v){let [x,y,z]=v,cy=Math.cos(ay),sy=Math.sin(ay),cx=Math.cos(ax),sx=Math.sin(ax);let xx=x*cy+z*sy,zz=z*cy-x*sy,yy=y*cx-zz*sx;zz=y*sx+zz*cx;let f=Math.min(W,H)*1.12/(12.2+zz);return [W*.53+xx*f,H*.54-yy*f,zz,f]}
function box(x,y,z,w,h,d,c,animated=false){if(animated)y+=Math.sin(clock*.8+x+z)*.13;const a=x-w/2,b=x+w/2,l=y-h/2,r=y+h/2,q=z-d/2,s=z+d/2;const vertices=[[a,l,q],[b,l,q],[b,r,q],[a,r,q],[a,l,s],[b,l,s],[b,r,s],[a,r,s]];const faceIdx=[[0,1,2,3],[4,5,6,7],[0,4,7,3],[1,5,6,2],[3,2,6,7]];const shades=[.65,.75,.76,.88,1];return faceIdx.map((f,i)=>({poly:f.map(k=>project(vertices[k])),color:c,shade:shades[i]}))}
function hexCol(h,s){const x=parseInt(h.slice(1),16),rgb=[(x>>16)&255,(x>>8)&255,x&255];return `rgb(${rgb.map(v=>Math.round(v*s)).join(',')})`}
function build(){const p=[];p.push(...box(0,-2,0,9,.27,9,'#315448'));
 if(id==='srmedu'||id==='oodp'){
   const n=id==='srmedu'?[20,10,16,14,4,3]:[6,7,9,6,8,4];
   n.forEach((v,i)=>{const x=(i-2.5)*1.22,h=v*.18+.8; p.push(...box(x,-.9+h/2,0,.92,h,1.7,i%2?palette[1]:palette[0],i%2===0));p.push(...box(x,.05+h-.9,0,1.02,.11,1.8,'#edf0cb'))});
   for(let a=0;a<24;a++){let t=a/24*Math.PI*2;p.push(...box(Math.cos(t)*3.2,.5+Math.sin(t+clock)*.1,Math.sin(t)*3.1,.12,.22,.12,'#e9c3a1',true));}
 }else if(id==='kv'||id==='regula'){
   for(let x=0;x<9;x++)for(let z=0;z<8;z++){const keep=(x<2||x>6||(x===4&&z%2===0));const h=(keep?1.65:.49)+Math.sin((x+z)*1.1)*.25;p.push(...box((x-4)*.68,-1.43+h/2,(z-3.5)*.74,.51,h,.51,keep?palette[0]:'#547468',keep))}
 }else if(id==='projectmatch'){
   p.push(...box(0,.4,0,1.3,3.7,1.3,'#e5bc95',true));for(let i=0;i<8;i++){let a=i*Math.PI/4;let h=1.1+(i%3)*.45;p.push(...box(Math.cos(a)*3,-1+h/2,Math.sin(a)*3,.6,h,.65,i%2?palette[0]:palette[1],true));}
 }else if(id==='metro'){
   for(let z=-4;z<=4;z+=.8){p.push(...box(-1.6,-1.65,z,.15,.15,.3,'#c4a78d'));p.push(...box(1.6,-1.65,z,.15,.15,.3,'#c4a78d'));p.push(...box(0,-1.75,z,3.5,.1,.14,'#648d79'))}
   p.push(...box(-.45,.10,-1.9,1.9,2.5,2.8,palette[0],true));p.push(...box(-.45,.65,-.45,1.6,1.0,.15,'#243d38'));p.push(...box(2,.20,1.1,1.3,3.2,1.3,palette[1]));
 }else if(id==='fairshift'){
   for(let j=0;j<2;j++)for(let z=0;z<5;z++){const hh=.48+z*.05;p.push(...box(j?1.6:-1.6,-1.2+z*.62,0,2.0,hh,1.6,z%2?palette[1]:palette[0],true))}
   p.push(...box(0,1,0,1.4,1.9,1.4,'#e3c4a9',true));
 }else{
   for(let i=0;i<12;i++){let a=i/12*Math.PI*2;let h=1+(i%4)*.55;p.push(...box(Math.cos(a)*2.8,-1.6+h/2,Math.sin(a)*2.7,.6,h,.6,i%2?palette[0]:palette[1],true))}
   p.push(...box(0,.3,0,1.25,3.7,1.25,'#d8ac8d',true));
 }
 return p.sort((a,b)=>b.poly.reduce((s,v)=>s+v[2],0)/a.poly.length-a.poly.reduce((s,v)=>s+v[2],0)/a.poly.length);
}
function draw(time){raf=0;if(!visible)return;let dt=Math.min(.04,(time-last)/1000||.016);last=time;if(!paused)clock+=dt;
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
 // subtle technical stars and floor grid
 const grad=ctx.createRadialGradient(W*.52,H*.42,5,W*.5,H*.5,Math.max(W,H)*.7);grad.addColorStop(0,'rgba(82,123,98,.14)');grad.addColorStop(1,'rgba(10,33,24,0)');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
 for(let x=-7;x<=7;x++){const a=project([x,-1.95,-7]),b=project([x,-1.95,7]);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle='rgba(181,203,173,.14)';ctx.stroke()}
 for(let z=-7;z<=7;z++){const a=project([-7,-1.95,z]),b=project([7,-1.95,z]);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke()}
 build().forEach(f=>{ctx.beginPath();f.poly.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=hexCol(f.color,f.shade);ctx.fill();ctx.strokeStyle='rgba(250,250,223,.19)';ctx.lineWidth=.7;ctx.stroke()});
 if(!paused){ay+=dt*.09;raf=requestAnimationFrame(draw)}
}
function resize(){const r=stage.getBoundingClientRect();W=Math.max(100,r.width);H=Math.max(100,r.height);dpr=Math.min(1.6,devicePixelRatio||1);c.width=Math.round(W*dpr);c.height=Math.round(H*dpr);request()}
function request(){if(!raf&&visible)raf=requestAnimationFrame(draw)}
c.addEventListener('pointerdown',e=>{drag=true;px=e.clientX;c.setPointerCapture(e.pointerId)});c.addEventListener('pointermove',e=>{if(!drag)return;ay+=(e.clientX-px)*.009;px=e.clientX;request()});['pointerup','pointercancel'].forEach(name=>c.addEventListener(name,()=>drag=false));
const btn=document.getElementById('cpPauseArt');btn.addEventListener('click',()=>{paused=!paused;btn.textContent=paused?'RESUME MOTION':'PAUSE MOTION';btn.setAttribute('aria-pressed',String(paused));request()});

function synchronizeMotion(){paused=reduced.matches||document.documentElement.classList.contains('motion-off');btn.disabled=paused;btn.textContent=paused?'RESUME MOTION':'PAUSE MOTION';btn.setAttribute('aria-pressed',String(paused));if(raf){cancelAnimationFrame(raf);raf=0}request()}
reduced.addEventListener('change',synchronizeMotion);
document.addEventListener('portfolio:motion',synchronizeMotion);
const io=new IntersectionObserver(e=>{visible=e[0].isIntersecting;if(visible)request();else if(raf){cancelAnimationFrame(raf);raf=0}},{threshold:.05});io.observe(stage);new ResizeObserver(resize).observe(stage);resize();
})();
