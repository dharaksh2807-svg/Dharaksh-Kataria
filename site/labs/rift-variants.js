/* V9.1 Rift variants — deterministic scroll choreography, isolated from production. */
(()=>{'use strict';
 const root=document.documentElement,stage=document.querySelector('.stage'),intro=document.querySelector('.intro'),canvas=document.querySelector('.stage-canvas');
 if(!root.dataset.variant||!stage||!intro||!canvas)return;
 const variant=root.dataset.variant;
 const variants=['kinetic','fracture','infinite','ascension'],mode=variants.indexOf(variant);
 const params=new URLSearchParams(location.search);
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 let reduced=media.matches,paused=reduced||params.get('motion')==='off',visible=true,raf=0,lastTime=0,elapsed=0,scroll=0;
 let mouseX=0,mouseY=0,targetX=0,targetY=0,gl=null,program=null,vao=null,uniforms=null,frameDeltas=[],frames=0;
 let contextAvailable=false;
 const portal=stage.querySelector('.rift-portal'),core=portal?.querySelector('.rift-core'),scene=stage.querySelector('.scene-art');
 const button=stage.querySelector('.motion-button');
 const rings=[];
 const smooth=x=>x*x*(3-2*x),clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
 const easeOut=x=>1-Math.pow(1-clamp(x),3);
 const set=(key,value)=>root.style.setProperty(key,String(value));
 const fmt=v=>Number(v).toFixed(3);
 if(paused)root.classList.add('motion-off');
 function updateButton(){if(button){button.textContent=paused?'Enable motion':'Pause motion';button.setAttribute('aria-pressed',String(paused));}}
 updateButton();
 button?.addEventListener('click',()=>{if(reduced)return;paused=!paused;root.classList.toggle('motion-off',paused);updateButton();lastTime=0;schedule();});
 if(reduced&&button){button.disabled=true;button.textContent='Reduced motion enabled';}
 const updateReduced=e=>{reduced=e.matches;paused=reduced||params.get('motion')==='off';root.classList.toggle('motion-off',paused);if(button){button.disabled=reduced;}updateButton();schedule();};
 if(media.addEventListener)media.addEventListener('change',updateReduced);else media.addListener(updateReduced);
 // Each ring is one independent architectural layer, rendered via perspective transforms.
 if(portal){
  portal.querySelectorAll('.gate').forEach(g=>g.remove());
  for(let i=0;i<9;i++){
   const g=document.createElement('div');g.className='gate';
   g.setAttribute('aria-hidden','true');
   g.style.setProperty('--gate-light',(1.14-i*.042).toFixed(2));
   portal.appendChild(g);rings.push(g);
  }
 }
 const pieces=[];
 if(mode===1&&scene){
  const assembly=document.createElement('div');assembly.className='fracture-assembly';
  for(let i=0;i<4;i++){const el=document.createElement('div');el.className='fracture-piece';assembly.appendChild(el);pieces.push(el);}
  scene.appendChild(assembly);
 }
 const strokes=stage.querySelectorAll('.depth-strokes i');
 strokes.forEach((n,i)=>n.style.setProperty('--i',i));
 function readScroll(){
  const distance=Math.max(1,intro.offsetHeight-innerHeight);
  scroll=clamp(-intro.getBoundingClientRect().top/distance);
 }
 function viewport(){
  if(!gl)return;
  const rect=canvas.getBoundingClientRect();
  if(rect.width<=0||rect.height<=0)return;
  const limit=innerWidth<680?1:1.35;
  let scale=Math.min(devicePixelRatio||1,limit);
  if(rect.width*rect.height*scale*scale>2300000)scale=Math.sqrt(2300000/(rect.width*rect.height));
  const w=Math.max(1,Math.round(rect.width*scale)),h=Math.max(1,Math.round(rect.height*scale));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
 }
 function animationState(){
  const p=paused?0:scroll,t=paused?0:elapsed/1000;
  const entry=paused?1:easeOut(elapsed/1480);
  // No cumulative transforms: all motion derives from elapsed time and normalized scroll.
  const ambient=paused?0:Math.sin(t*.45)*.85;
  const scrollPhase=smooth(clamp((p-.09)/.75));
  const fracture=mode===1?Math.pow(Math.sin(Math.PI*clamp((p-.04)/.82)),2):0;
  let artScale=1+p*.47,artRotate=0,offsetX=-mouseX*8,offsetY=-mouseY*6;
  let ghost=.025,slit=-140,coreBrightness=1.0,orbital=0,bladeL=-p*180,bladeR=p*180;
  if(mode===0){
   artScale=1+p*.52;
   artRotate=(p*7+ambient*.4);
   orbital=p*35+ambient;
   ghost=.018+p*.045;
   coreBrightness=1+p*.24;
  }else if(mode===1){
   artScale=1+p*.32-fracture*.065;
   artRotate=p*8+fracture*1.5;
   orbital=p*11;
   ghost=.025+fracture*.048;
   coreBrightness=1+fracture*.7;
   bladeL=-p*125-fracture*60;bladeR=p*130+fracture*70;
   slit=-140+260*clamp((p-.14)/.65);
  }else if(mode===2){
   artScale=1+p*2.5;
   artRotate=p*13;
   orbital=p*32;
   ghost=0;
   coreBrightness=1+p*.5;
   offsetX*=.4;offsetY*=.4;
  }else{
   artScale=1+p*.8;
   artRotate=p*10+ambient*.7;
   orbital=p*27+ambient*1.3;
   ghost=.07+Math.sin(Math.PI*clamp(p))*.085;
   slit=-140+270*clamp((p-.05)/.85);
   coreBrightness=1+Math.sin(p*Math.PI)*.67;
   bladeL=-p*125;bladeR=p*130;
  }
  // Cinematic entrance passes through the same deterministic state as scrolling.
  artScale*=.89+.11*entry;
  offsetY+=(1-entry)*27;
  const titleOut=1-smooth(clamp((p-.28)/.53));
  const titleOpacity=clamp(entry*titleOut);
  set('--entry',fmt(entry));set('--stage-progress',fmt(p));set('--scroll',fmt(p));
  set('--camera-x',fmt(offsetX)+'px');set('--camera-y',fmt(offsetY)+'px');
  set('--art-scale',fmt(artScale));set('--art-rotate',fmt(artRotate)+'deg');
  set('--orbital-rotation',fmt(orbital)+'deg');set('--core-brightness',fmt(coreBrightness));
  set('--blade-l',fmt(bladeL)+'px');set('--blade-r',fmt(bladeR)+'px');
  set('--ghost-opacity',fmt(ghost*entry));set('--ghost-x',fmt(-p*100)+'px');
  set('--ghost-y',fmt((1-entry)*40-p*32)+'px');set('--ghost-scale',fmt(1+p*.31));
  set('--slit-x',fmt(slit)+'%');set('--light-shift',fmt(Math.sin(t*.4)*10+p*45)+'px');
  set('--shine',fmt(clamp(.13+p*.9)*100)+'%');
  set('--title-y',fmt(-p*(innerWidth<680?90:125)+(1-entry)*44)+'px');
  set('--title-x',fmt(-mouseX*2.5)+'px');
  set('--title-scale',fmt(1-p*.045));set('--title-opacity',fmt(titleOpacity));
  rings.forEach((g,i)=>{
   const s=1-i*.095,z=-i*21;
   let rotation=(-3+i*.7)+(1-entry)*(-18-i*2.5)+ambient*(.5+i*.10);
   if(mode===0)rotation+=p*(26+i*5.7);
   else if(mode===1)rotation+=p*(10+i*1.5)+fracture*((i%2?1:-1)*(5+i));
   else if(mode===2)rotation+=p*(28+i*8);
   else rotation+=p*(16+i*3.3)+Math.sin(p*Math.PI)*i*1.3;
   let shiftX=0,shiftY=0,scale=s;
   if(mode===1){shiftX=fracture*((i%2?1:-1)*(i*2.8));shiftY=fracture*((i%3?-1:1)*(i*2.1));scale=s*(1-fracture*.06);}
   if(mode===2)scale=s*(1+p*1.75);
   g.style.transform='translate3d('+fmt(shiftX)+'px,'+fmt(shiftY)+'px,'+z+'px) scale('+fmt(scale)+') rotateZ('+fmt(rotation)+'deg)';
   g.style.opacity=fmt((1-i*.055)*(mode===2?1-p*.75:1));
  });
  pieces.forEach((piece,i)=>{
   const sx=i%2===0?-1:1,sy=i<2?-1:1;
   const x=fracture*sx*(47+i*6),y=fracture*sy*(38+i*4),r=fracture*(i%2?11:-11)+p*9;
   piece.style.transform='translate3d('+fmt(x)+'px,'+fmt(y)+'px,'+fmt(fracture*(i%2?80:-70))+'px) rotateZ('+fmt(r)+'deg) scale('+fmt(1-fracture*.035)+')';
  });
  return {progress:p,entry,fracture,ambient,t};
 }
 // Shader: real perspective intersections with a sequence of z-displaced portal planes.
 // It is not a Three.js mesh. This is a native WebGL2 perspective shader, with CSS architecture in front.
 const vertex=String.raw\`#version 300 es
 precision highp float;
 void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.-1.,0.,1.);}\`;
 const fragment=String.raw\`#version 300 es
 precision highp float;
 uniform vec2 uRes;uniform vec2 uMouse;uniform float uTime;uniform float uScroll;uniform int uMode;
 out vec4 fragColor;
 mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
 float octagon(vec2 p,vec2 ext){vec2 a=abs(p);return max(max(a.x-ext.x,a.y-ext.y),(a.x+a.y)*.70-(ext.x+ext.y)*.80);}
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){
  vec2 uv=(gl_FragCoord.xy-uRes*.5)/uRes.y;
  uv.x-=.265;
  vec3 col=vec3(.009,.012,.013),bronze=vec3(.92,.50,.27),silver=vec3(.78,.71,.61);
  float travel=uScroll*(uMode==2?16.:5.);
  vec2 origin=uMouse*.017;
  vec2 direction=uv/1.12;
  for(int i=27;i>=0;i--){
    float fi=float(i);
    float z=1.5+mod(fi*.54-travel+25.2,14.0);
    vec2 point=origin+direction*z;
    float spin=(uMode==0?uScroll*(.12+fi*.014):uMode==1?uScroll*.17:uMode==2?uScroll*(.2+fi*.008):uScroll*.27)+sin(uTime*.31+fi*.32)*.009;
    point=rot(spin)*point;
    float d=abs(octagon(point,vec2(.75,.61)));
    float thickness=.013+z*.0012;
    float rim=1.-smoothstep(thickness,thickness+.012,d);
    float scatter=exp(-d*30.)*.028;
    float fade=1./(1.+z*.27);
    float light=smoothstep(.12,.95,fract(fi*.27+uTime*.035+uScroll*.25));
    vec3 metal=mix(bronze,silver,.35+.29*sin(fi*.8));
    col+=metal*(rim*(.18+light*.21)+scatter)*fade;
    col+=bronze*exp(-d*110.)*.028*fade;
  }
  float depth=exp(-length(uv-vec2(.07,0.))*3.9);
  col+=bronze*depth*(.015+.029*uScroll);
  if(uMode==1){
   float flare=exp(-abs(uv.x-(uScroll-.5)*1.8)*27.)*exp(-abs(uv.y)*.55);
   col+=silver*flare*.042;
  }
  if(uMode==3){
   float slit=exp(-abs(uv.x-(-1.2+uScroll*2.4))*42.);
   col+=bronze*slit*.095;
  }
  float vignette=1.-smoothstep(.48,1.28,length(uv));
  col*=.62+.38*vignette;
  col+=(hash(gl_FragCoord.xy+uTime*17.)-.5)*.0035;
  fragColor=vec4(pow(max(col,vec3(0.)),vec3(.92)),1.);
 }\`;
 function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const e=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(e);}return shader;}
 function initialize(){
  try{
   gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'high-performance'});
   if(!gl)throw Error('WebGL2 unsupported');
   const vert=compile(gl.VERTEX_SHADER,vertex),frag=compile(gl.FRAGMENT_SHADER,fragment);
   program=gl.createProgram();gl.attachShader(program,vert);gl.attachShader(program,frag);gl.linkProgram(program);
   gl.deleteShader(vert);gl.deleteShader(frag);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
   vao=gl.createVertexArray();gl.bindVertexArray(vao);gl.useProgram(program);
   uniforms={res:gl.getUniformLocation(program,'uRes'),mouse:gl.getUniformLocation(program,'uMouse'),time:gl.getUniformLocation(program,'uTime'),scroll:gl.getUniformLocation(program,'uScroll'),mode:gl.getUniformLocation(program,'uMode')};
   gl.uniform1i(uniforms.mode,mode);contextAvailable=true;canvas.hidden=false;viewport();
  }catch(err){contextAvailable=false;canvas.style.display='none';console.warn('Rift shader unavailable, CSS study remains usable:',err.message);}
 }
 function renderGL(state){
  if(!contextAvailable||!gl)return;
  viewport();gl.useProgram(program);
  gl.uniform2f(uniforms.res,canvas.width,canvas.height);
  gl.uniform2f(uniforms.mouse,mouseX,mouseY);
  gl.uniform1f(uniforms.time,state.t);gl.uniform1f(uniforms.scroll,state.progress);
  gl.drawArrays(gl.TRIANGLES,0,3);
 }
 function tick(now){
  raf=0;if(!visible||document.hidden)return;
  if(lastTime&&now-lastTime<120)frameDeltas.push(now-lastTime);
  if(frameDeltas.length>150)frameDeltas.shift();
  const delta=lastTime?Math.min(50,now-lastTime):16;
  lastTime=now;
  if(!paused)elapsed+=delta;
  mouseX+=(targetX-mouseX)*.085;mouseY+=(targetY-mouseY)*.085;
  const state=animationState();
  renderGL(state);frames++;
  if(!paused&&scroll<.999)schedule();
 }
 function schedule(){if(raf||!visible||document.hidden)return;raf=requestAnimationFrame(tick);}
 function wake(){lastTime=0;schedule();}
 addEventListener('scroll',()=>{readScroll();schedule();},{passive:true});
 addEventListener('resize',()=>{readScroll();viewport();schedule();},{passive:true});
 addEventListener('pointermove',event=>{
  if(paused||event.pointerType==='touch')return;
  targetX=clamp((event.clientX/innerWidth-.5)*2,-1,1);
  targetY=clamp((event.clientY/innerHeight-.5)*2,-1,1);
 },{passive:true});
 stage.addEventListener('pointerleave',()=>{targetX=0;targetY=0;});
 stage.querySelectorAll('.hero-action').forEach(link=>{
  link.addEventListener('pointermove',e=>{
   if(paused||e.pointerType==='touch')return;
   const r=link.getBoundingClientRect();
   const x=clamp((e.clientX-r.left-r.width/2)*.1,-5,5);
   const y=clamp((e.clientY-r.top-r.height/2)*.16,-3,3);
   link.style.transform='translate3d('+x+'px,'+y+'px,0)';
  });
  link.addEventListener('pointerleave',()=>{link.style.transform='';});
 });
 if('IntersectionObserver' in window){
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else{cancelAnimationFrame(raf);raf=0;}},{threshold:.01}).observe(stage);
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();contextAvailable=false;gl=null;cancelAnimationFrame(raf);raf=0;canvas.style.display='none';});
 canvas.addEventListener('webglcontextrestored',()=>{canvas.style.display='';initialize();wake();});
 addEventListener('pagehide',()=>{cancelAnimationFrame(raf);raf=0;if(gl&&contextAvailable){gl.deleteVertexArray(vao);gl.deleteProgram(program);program=null;vao=null;contextAvailable=false;}},{once:true});
 function metrics(){
  const sorted=frameDeltas.slice().sort((a,b)=>a-b);
  const median=sorted.length?sorted[Math.floor(sorted.length*.5)]:null;
  const p95=sorted.length?sorted[Math.min(sorted.length-1,Math.ceil(sorted.length*.95)-1)]:null;
  return {sampleCount:sorted.length,medianFrameIntervalMs:median,p95FrameIntervalMs:p95,approxRafFps:median?1000/median:null,NOTE:'Browser requestAnimationFrame intervals, not GPU time, and not a physical mobile measurement'};
 }
 window.__riftLab={
  variant,hasWebGL:()=>contextAvailable,isReduced:()=>reduced,isPaused:()=>paused,
  scrollProgress:()=>scroll,animationElapsedMs:()=>elapsed,frameMetrics:metrics,
  snapshot:()=>({variant,progress:scroll,elapsedMs:elapsed,reduced,paused,hasWebGL:contextAvailable,frames}),
  renderOnce:()=>{animationState();renderGL(animationState());},
 };
 readScroll();initialize();schedule();
})();
