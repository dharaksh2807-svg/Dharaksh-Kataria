/* Engineering Universe. Extends the V8 geometry and self-contained renderer. */
(() => {
'use strict';
const shell = document.getElementById('worldShell');
const host = document.getElementById('worldCanvasWrap');
const canvas = document.getElementById('worldCanvas');
if (!shell || !host || !canvas) return;
const $ = selector => document.querySelector(selector);
const sectors = [
  {label:'Learning', title:'Learning as a system.', text:'Structured curriculum, retrieval, analytics and accessible study workflows.', slug:'srmedu', pos:[-6.6,1,-5.6], color:'#e8a57f'},
  {label:'Collaboration', title:'Find your people.', text:'Projects, collaboration and skill-based compatibility become connected networks.', slug:'projectmatch', pos:[6.8,1,-5.6], color:'#a2c4b0'},
  {label:'Research', title:'Remember efficiently.', text:'Token selection, retention budgets and measured recall trade-offs in LLM inference.', slug:'kv', pos:[-6.6,1,6.3], color:'#b3a2dc'},
  {label:'Creation', title:'Make movement tangible.', text:'Procedural geometry, track planning and 3D game mechanics. Development remains private.', slug:'metro', pos:[6.8,1,6.3], color:'#e5be89'}
];
const safe = matchMedia('(prefers-reduced-motion: reduce)');
const opts = {audio:false, haptic:false, motion:!safe.matches && !document.documentElement.classList.contains('motion-off')};
const objects = [0,0,0,1];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const hex = color => {const n=parseInt(color.slice(1),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]};
const narrow = () => matchMedia('(max-width:650px)').matches;
let focused=0, yaw=.77, pitch=.65, radius=narrow()?36:28;
let target=[0,1,0], goal=[0,1,0], yawGoal=yaw, pitchGoal=pitch, radiusGoal=radius;
let inView=false, raf=0, last=0, time=0, lastDraw=0, overview=true;
let tour=opts.motion, scrollDirty=true, pointer=null, moved=false;
let w=0, h=0, dpr=1, quality=Math.min(1.65,devicePixelRatio||1), vertices=[], verts=[];
let gl=null, useGL=false, prog=null, va=null, buffer=null, uniforms={};
let contextLost=false, softwareCanvas=canvas, ctx=null, fallbackFaces=[];
let timerExtension=null, timerQuery=null, timerPending=false;
const metrics={frames:0, adaptiveChanges:0, samples:[], gpu:[], qualityHistory:[]};
let windowSamples=[], fastWindows=0, lastMetricStamp=0;
try {gl=canvas.getContext('webgl2',{alpha:false,antialias:true,powerPreference:'low-power',depth:true,stencil:false});} catch {}
function face(points,n,color,motion){const c=hex(color); for(const k of [0,1,2,0,2,3]){verts.push(...points[k],...n,...c,motion)}}
function box(x,y,z,sx,sy,sz,color,m=0){const a=x-sx/2,b=x+sx/2,c=y-sy/2,d=y+sy/2,e=z-sz/2,f=z+sz/2;
 face([[a,c,f],[b,c,f],[b,d,f],[a,d,f]],[0,0,1],color,m);face([[b,c,e],[a,c,e],[a,d,e],[b,d,e]],[0,0,-1],color,m);
 face([[b,c,f],[b,c,e],[b,d,e],[b,d,f]],[1,0,0],color,m);face([[a,c,e],[a,c,f],[a,d,f],[a,d,e]],[-1,0,0],color,m);
 face([[a,d,f],[b,d,f],[b,d,e],[a,d,e]],[0,1,0],color,m);face([[a,c,e],[b,c,e],[b,c,f],[a,c,f]],[0,-1,0],color,m);
}
function ring(x,z,y,r,clr,n=20){for(let i=0;i<n;i++){const ang=i*Math.PI*2/n;box(x+Math.cos(ang)*r,y+.12*Math.sin(ang*3),z+Math.sin(ang)*r,.20,.21,.20,clr,.5)}}
function buildWorld(){
  verts=[];
  // Four materialized, architecturally distinct islands + connective spine.
  box(0,-1.6,.35,18,.55,18,'#1d3530');box(0,-1.18,.35,17.2,.16,17.2,'#355a4c');
  for(let i=0;i<35;i++){const x=(i%7-3)*2.35,z=(Math.floor(i/7)-2)*3.45;box(x,-1.076,z,.055,.035,.055,'#6e9180');}
  box(0,-.6,.2,2.4,1.15,2.4,'#c47d63'); box(0,.2,.2,.72,.65,.72,'#efbb88',.5);
  ring(0,.2,.5,2.3,'#8caf9c');ring(0,.2,1,3.4,'#d9a68e');
  for(const s of sectors){const [x,y,z]=s.pos;box(x,-.66,z,6.2,1.3,6.5,'#233f37');box(x,-.01,z,5.8,.16,6.1,'#678d78');
    box(x,0.13,z,5.0,.13,5.2,'#1a322c');
    for(let j=0;j<4;j++){const dx=((j%2)*2-1)*2.4,dz=(Math.floor(j/2)*2-1)*2.2;box(x+dx,.4,z+dz,.4,.9,.4,'#b9a587')}
  }
  // LEARNING: rising atlas volumes, a circular library of knowledge.
  {const [x,,z]=sectors[0].pos;for(let j=0;j<6;j++){let xx=x-2+j*.8,h=[20,10,16,14,4,3][j]*.12+.6;box(xx,.2+h/2,z,.65,h,2.1,j===objects[0]?'#efbb88':'#679e91',j===objects[0]?.5:0)}
   for(let k=0;k<3;k++)box(x,1.15+k*.9,z-2.15,4.7,.11,.13,k===1?'#e6a984':'#a1c6b0');ring(x,z,3.3,1.8,'#dcaa83');}
  // COLLAB: towers and bridge lattice, interconnected nodes.
  {const [x,,z]=sectors[1].pos;for(let j=0;j<7;j++){let a=j*2.399,xx=x+Math.cos(a)*1.88,zz=z+Math.sin(a)*1.85;box(xx,1.18+(j%3)*.28,zz,.55,2.4+(j%3)*.5,.55,j%3?'#9db4a6':'#e8b08b',.7);box(xx,2.65+(j%3)*.52,zz,.94,.20,.94,'#b2d5ba',1)}
   const a=objects[1]*2.399,xx=x+Math.cos(a)*1.88,zz=z+Math.sin(a)*1.85;
   box((x+xx)/2,2.1,z,Math.abs(xx-x)+.15,.1,.12,'#e8b08b');box(xx,2.1,(z+zz)/2,.12,.1,Math.abs(zz-z)+.15,'#e8b08b');
   box(x,1.9,z,.9,3.4,.9,'#e8c5a1',.7);ring(x,z,3.7,1.55,'#95bfaa');}
  // AI: tall, uneven memory columns and retained bright tokens.
  {const [x,,z]=sectors[2].pos;for(let j=0;j<6;j++)for(let k=0;k<5;k++){let h=.55+((j*11+k*7)%9)*.31;let keep=((j*5+k)%30)<[6,12,20][objects[2]];let xx=x+(j-2.5)*.76,zz=z+(k-2)*.87;box(xx,.28+h/2,zz,.49,h,.57,keep?'#b9a5de':'#47675b',keep?.8:0);if(keep)box(xx,.31+h,zz,.53,.13,.59,'#ebd5b1',1)}ring(x,z,3.5,2.28,'#ab9fcc');}
  // CREATION: moving-track metaphor, stacked train cars, tunnel volumes.
  {const [x,,z]=sectors[3].pos;for(let a=-2;a<=2;a++){box(x+a*.8,.38,z,.075,.10,5.0,'#c5bdac');for(let k=-2;k<=2;k++)box(x+a*.8,.22,z+k,.8,.14,.16,'#5e7f6e')}
   box(x+(objects[3]-1)*1.4,1.5,z-1.9,1.1,2.3,1.1,'#b87660',.65);box(x+(objects[3]-1)*1.4,2.6,z-1.9,.95,.2,1.15,'#eab38a',.5);
   box(x-2.4,1.3,z+1.9,.15,2.5,.15,'#c4a98d');box(x+2.4,1.3,z+1.9,.15,2.5,.15,'#c4a98d');box(x,2.57,z+1.9,4.95,.15,.15,'#dba783');}
  // Paths = literal geometry connecting ideas.
  for(const x of [-6.6,6.8])box(x/2,-.82,.25,Math.abs(x)+1,.13,.35,'#638977');
  for(const z of [-5.6,6.3])box(0,-.86,z/2+.2,.3,.13,Math.abs(z)+1,'#709281');
  for(let j=0;j<4;j++){const a=j*Math.PI/2;box(Math.cos(a)*8,-.95,Math.sin(a)*8,.6,.12,.6,'#d5b18d')}
}

const vsub=(a,b)=>a.map((v,i)=>v-b[i]),vdot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),vcross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],vnorm=v=>{let d=Math.hypot(...v)||1;return v.map(a=>a/d)};
function lookAt(eye,tar){const z=vnorm(vsub(eye,tar)),x=vnorm(vcross([0,1,0],z)),y=vcross(z,x);return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-vdot(x,eye),-vdot(y,eye),-vdot(z,eye),1]}
function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]}
function mul(a,b){const out=Array(16).fill(0);for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let k=0;k<4;k++)out[j*4+i]+=a[k*4+i]*b[j*4+k];return out}
function project(point, matrix, width, height) {
  const [x,y,z]=point;
  const depth=matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15];
  if(depth<=.01)return null;
  const px=(matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12])/depth;
  const py=(matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13])/depth;
  return {x:(px*.5+.5)*width,y:(-.5*py+.5)*height,visible:Math.abs(px)<1.1 && Math.abs(py)<1.05,depth};
}
function getMatrix(w,h){const eye=[target[0]+radius*Math.cos(pitch)*Math.sin(yaw),target[1]+radius*Math.sin(pitch),target[2]+radius*Math.cos(pitch)*Math.cos(yaw)];return mul(perspective(narrow()?.91:.78,w/h,.1,120),lookAt(eye,target));}

function shader(type, source) {
  const value=gl.createShader(type);
  gl.shaderSource(value, source);
  gl.compileShader(value);
  if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) {
    const message=gl.getShaderInfoLog(value);
    gl.deleteShader(value);
    throw Error(message);
  }
  return value;
}
function uploadGeometry() {
  buildWorld();
  vertices=new Float32Array(verts);
  fallbackFaces=[];
  for (let i=0; i<vertices.length; i+=60) {
    const point=j=>[vertices[i+j*10], vertices[i+j*10+1], vertices[i+j*10+2]];
    const normal=[vertices[i+3],vertices[i+4],vertices[i+5]];
    const light=.48+.52*Math.max(0,vdot(normal,vnorm([-.36,.85,.48])));
    fallbackFaces.push({points:[point(0),point(1),point(2),point(5)], color:[vertices[i+6],vertices[i+7],vertices[i+8]], light, motion:vertices[i+9]});
  }
  verts=[];
  if (useGL) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
  }
}
function disposeGL() {
  if (!gl || contextLost) return;
  if (timerQuery) gl.deleteQuery(timerQuery);
  if (buffer) gl.deleteBuffer(buffer);
  if (va) gl.deleteVertexArray(va);
  if (prog) gl.deleteProgram(prog);
  timerQuery=buffer=va=prog=null;
  timerPending=false;
}
function initGL() {
  if (!gl || contextLost) return false;
  const shaders=[];
  try {
    disposeGL();
    shaders.push(shader(gl.VERTEX_SHADER, `#version 300 es
precision highp float;
in vec3 aPos; in vec3 aNormal; in vec3 aColor; in float aMotion;
uniform mat4 uMatrix; uniform float uTime; uniform vec3 uFocus;
out vec3 color; out float dist;
void main(){
 vec3 p=aPos; p.y+=aMotion*.067*sin(uTime*1.6+aPos.x*2.+aPos.z*.8);
 gl_Position=uMatrix*vec4(p,1.);
 float lit=.48+.52*max(dot(normalize(aNormal),normalize(vec3(-.36,.85,.48))),0.);
 float focus=1.-smoothstep(2.,5.,distance(aPos.xz,uFocus.xz));
 color=aColor*lit + aColor*.12*focus;
 dist=gl_Position.w;
}`));
    shaders.push(shader(gl.FRAGMENT_SHADER, `#version 300 es
precision highp float; in vec3 color; in float dist; out vec4 frag;
void main(){float fog=smoothstep(19.,51.,dist)*.65;vec3 col=mix(color,vec3(.051,.098,.084),fog);frag=vec4(pow(col,vec3(.83)),1.);}`));
    prog=gl.createProgram();
    shaders.forEach(value=>gl.attachShader(prog,value));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog,gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(prog));
    va=gl.createVertexArray();
    buffer=gl.createBuffer();
    gl.bindVertexArray(va);
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    [['aPos',3,0],['aNormal',3,12],['aColor',3,24],['aMotion',1,36]].forEach(([key,size,offset])=>{
      const location=gl.getAttribLocation(prog,key);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location,size,gl.FLOAT,false,40,offset);
    });
    uniforms={matrix:gl.getUniformLocation(prog,'uMatrix'),time:gl.getUniformLocation(prog,'uTime'),focus:gl.getUniformLocation(prog,'uFocus')};
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(.054,.098,.085,1);
    gl.disable(gl.BLEND);
    timerExtension=gl.getExtension('EXT_disjoint_timer_query_webgl2');
    timerQuery=timerExtension?gl.createQuery():null;
    return true;
  } catch (error) {
    console.warn('Engineering Universe using software rendering.', error.message);
    disposeGL();
    return false;
  } finally {shaders.forEach(value=>gl.deleteShader(value));}
}
function showRenderer() {
  metrics.samples=[];metrics.gpu=[];windowSamples=[];lastMetricStamp=0;
  if (!useGL) {
    if (gl && softwareCanvas===canvas) {
      softwareCanvas=document.createElement('canvas');
      softwareCanvas.className='world-software-canvas';
      softwareCanvas.setAttribute('aria-hidden','true');
      canvas.insertAdjacentElement('afterend',softwareCanvas);
    }
    try {ctx=softwareCanvas.getContext('2d',{alpha:false});} catch {ctx=null;}
  }
  canvas.hidden=!useGL && softwareCanvas!==canvas;
  if (softwareCanvas!==canvas) softwareCanvas.hidden=useGL;
  $('#worldFallback').hidden=useGL || !!ctx;
  $('#worldRenderer').textContent=useGL?'LIVE 3D / WEBGL2':ctx?'INTERACTIVE / SOFTWARE 3D':'PROJECT NAVIGATION';
  shell.dataset.renderer=useGL?'webgl2':ctx?'software':'unavailable';
  resize();
}
useGL=initGL();
uploadGeometry();

const markers=[];
const sectorEls=[...document.querySelectorAll('.world-sector')];
sectors.forEach((sector,index)=>{
  const button=document.createElement('button');
  button.type='button';
  button.className='world-marker';
  button.innerHTML=`<i></i><span>0${index+1} ${sector.label.toUpperCase()}</span>`;
  button.setAttribute('aria-label','Focus '+sector.label+' district');
  button.addEventListener('click',()=>select(index));
  button.addEventListener('focus',()=>setTour(false));
  button.addEventListener('blur',()=>requestFrame());
  $('#worldLabels').append(button);
  markers.push(button);
});
let audio;
function updateSound() {
  $('#worldSound').setAttribute('aria-pressed',String(opts.audio));
  $('#worldSound').textContent=opts.audio?'SOUND ON ◌':'SOUND OFF ◌';
}
function chime(index) {
  if (!opts.audio) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const now=audio.currentTime, oscillator=audio.createOscillator(), gain=audio.createGain(), pan=audio.createStereoPanner();
    oscillator.frequency.setValueAtTime([264,330,392,528][index],now);
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(.028,now+.035);
    gain.gain.exponentialRampToValueAtTime(.0001,now+.6);
    pan.pan.value=[-.65,.65,-.35,.35][index];
    oscillator.connect(gain); gain.connect(pan); pan.connect(audio.destination);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();pan.disconnect();};
    oscillator.start(now); oscillator.stop(now+.65);
  } catch {opts.audio=false;updateSound();}
}
function updateObject() {
  const descriptions=[
    `Semester ${objects[0]+1} · ${[20,10,16,14,4,3][objects[0]]} listed subjects. Highlighted atlas volume.`,
    `Role connection ${objects[1]+1} of 7. Trace the highlighted bridge to the team hub. Illustrative matching network.`,
    `Budget ${[260,516,1028][objects[2]]} tokens. ${[6,12,20][objects[2]]} of 30 illustrative columns retained. Diagram scale only; measured research results are in the case study.`,
    `${['Left','Center','Right'][objects[3]]} lane selected. Move the train model across three lanes. Conceptual track interaction; approved gameplay remains pending.`
  ];
  $('#worldObjectState').textContent=descriptions[focused];
  $('#worldObjectAction').textContent=['NEXT SEMESTER →','CONNECT NEXT ROLE →','CYCLE KV BUDGET →','SWITCH LANE →'][focused];
}
function announceDistrict(index) {
  const sector=sectors[index];
  focused=index;
  sectorEls.forEach((button,i)=>{
    button.classList.toggle('is-active',i===index);
    button.setAttribute('aria-pressed',String(i===index));
  });
  markers.forEach((button,i)=>{
    button.classList.toggle('is-active',i===index);
    button.setAttribute('aria-pressed',String(i===index));
  });
  $('#worldInspectorTitle').textContent=sector.title;
  $('#worldInspectorText').textContent=sector.text;
  $('#worldInspectorCategory').textContent='DISTRICT / 0'+(index+1);
  $('#worldInspectorLink').href='projects/'+sector.slug+'.html';
  $('#worldState').textContent='FOCUS / '+sector.label.toUpperCase();
  updateObject();
  document.dispatchEvent(new CustomEvent('portfolio:world-focus',{detail:{index,label:sector.label,id:sector.slug}}));
}
function setTour(enabled) {
  tour=enabled && opts.motion;
  $('#worldTour').setAttribute('aria-pressed',String(tour));
  $('#worldTour').textContent=tour?'SCROLL TOUR ON':'SCROLL TOUR OFF';
  scrollDirty=tour;
}
function pose(index) {
  const position=sectors[index].pos;
  return {target:[position[0]*.62,1.1,position[2]*.62], yaw:[.77,.48,.98,.65][index], pitch:[.65,.71,.74,.60][index], radius:narrow()?26:21.5};
}
function setPose(value) {
  goal=[...value.target];
  yawGoal=value.yaw; pitchGoal=value.pitch; radiusGoal=value.radius;
  if (!opts.motion) {target=[...goal];yaw=yawGoal;pitch=pitchGoal;radius=radiusGoal;}
}
function select(index) {
  if (!Number.isInteger(index) || index<0 || index>3) return;
  setTour(false); overview=false;
  announceDistrict(index);
  setPose(pose(index));
  chime(index);
  if (opts.haptic) navigator.vibrate?.(12);
  requestFrame();
}
function activate(direction=1) {
  setTour(false);
  objects[focused]=(objects[focused]+direction+[6,7,3,3][focused])%[6,7,3,3][focused];
  uploadGeometry(); updateObject(); requestFrame();
}
sectorEls.forEach((button,index)=>button.addEventListener('click',()=>select(index)));
$('#worldObjectAction').addEventListener('click',()=>activate());
$('#worldSound').addEventListener('click',()=>{opts.audio=!opts.audio;updateSound();if(opts.audio)chime(focused);});
$('#worldHaptic').addEventListener('click',()=>{
  opts.haptic=!opts.haptic;
  $('#worldHaptic').setAttribute('aria-pressed',String(opts.haptic));
  $('#worldHaptic').textContent=opts.haptic?'HAPTICS ON':'HAPTICS OFF';
});
$('#worldHaptic').hidden=typeof navigator.vibrate!=='function';
$('#worldReset').addEventListener('click',()=>{
  setTour(false); overview=true;
  setPose({target:[0,1,0],yaw:.77,pitch:.65,radius:narrow()?36:28});
  $('#worldState').textContent='EXPLORING / FOUR DISTRICTS';
  requestFrame();
});
$('#worldTour').addEventListener('click',()=>{setTour(!tour);overview=false;requestFrame();});
function zoom(amount) {setTour(false);radiusGoal=clamp(radiusGoal+amount,14,43);if(!opts.motion)radius=radiusGoal;requestFrame();}
$('#worldZoomIn').addEventListener('click',()=>zoom(-2));
$('#worldZoomOut').addEventListener('click',()=>zoom(2));
function scrollCamera() {
  scrollDirty=false;
  if (!tour || !opts.motion || pointer) return;
  const track=$('#worldScrollTrack').getBoundingClientRect();
  const sticky=matchMedia('(min-width:851px) and (min-height:800px)').matches;
  const progress=sticky?clamp((90-track.top)/Math.max(1,track.height-shell.offsetHeight),0,1):clamp((innerHeight*.7-track.top)/Math.max(1,track.height),0,1);
  const position=progress*3, a=Math.min(2,Math.floor(position)), blend=position-a;
  const weight=blend*blend*(3-2*blend), start=pose(a), end=pose(a+1);
  setPose({target:start.target.map((v,i)=>v+(end.target[i]-v)*weight),yaw:start.yaw+(end.yaw-start.yaw)*weight,pitch:start.pitch+(end.pitch-start.pitch)*weight,radius:start.radius+(end.radius-start.radius)*weight});
  overview=false;
  const index=Math.round(position);
  if (focused!==index) announceDistrict(index);
}
function resize() {
  const bounds=host.getBoundingClientRect();
  w=Math.max(150,bounds.width);h=Math.max(180,bounds.height);
  dpr=Math.min(quality,devicePixelRatio||1);
  for (const surface of new Set([canvas,softwareCanvas])) {
    surface.width=Math.floor(w*dpr);surface.height=Math.floor(h*dpr);
  }
  if(useGL)gl.viewport(0,0,canvas.width,canvas.height);
  scrollDirty=true;
  requestFrame();
}
let lightingKey='';
function fallback(matrix) {
  if (!ctx) return;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle='#0c1b16';ctx.fillRect(0,0,w,h);
  const faces=[];
  const cameraKey=[...target,yaw,pitch,radius].map(value=>value.toFixed(3)).join(',');
  const repaint=cameraKey!==lightingKey;
  lightingKey=cameraKey;
  for(const face of fallbackFaces) {
    const coords=face.points.map(point=>project(face.motion?[point[0],point[1]+face.motion*.067*Math.sin(time*1.6+point[0]*2+point[2]*.8),point[2]]:point,matrix,w,h));
    if(coords.some(point=>!point))continue;
    const [a,b,c]=coords;
    if((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)>=0)continue;
    if(coords.every(p=>p.x<0)||coords.every(p=>p.x>w)||coords.every(p=>p.y<0)||coords.every(p=>p.y>h))continue;
    const depth=coords.reduce((sum,p)=>sum+p.depth,0)/4;
    if(repaint || !face.paint) {
      const point=face.points[0], focus=[target[0]/.62,1,target[2]/.62];
      const light=face.light+.12*(1-clamp((Math.hypot(point[0]-focus[0],point[2]-focus[2])-2)/3,0,1));
      const fog=clamp((depth-19)/32,0,1)*.65;
      const color=face.color.map((value,index)=>Math.round(Math.pow(value*light*(1-fog)+[.051,.098,.084][index]*fog,.83)*255));
      face.paint='rgb('+color.join(',')+')';
    }
    const highest=Math.max(...face.points.map(point=>point[1]));
    const layer=highest < -1 ? 0 : highest < .22 ? 1 : 2;
    faces.push({coords,depth,layer,color:face.paint});
  }
  faces.sort((a,b)=>a.layer-b.layer || b.depth-a.depth);
  for(const face of faces) {
    ctx.beginPath();face.coords.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath();ctx.fillStyle=face.color;ctx.fill();
  }
}
function percentile(values, fraction) {if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.floor(sorted.length*fraction))];}
function performanceState() {
  const samples=metrics.samples;
  const elapsed=samples.length>1?samples.at(-1).stamp-samples[0].stamp:0;
  return {renderer:shell.dataset.renderer,frames:metrics.frames,fps:elapsed?(samples.length-1)*1000/elapsed:0,cpuP95:percentile(samples.map(s=>s.cpu),.95),gpuP95:useGL?percentile(metrics.gpu,.95):null,dpr,quality,adaptiveChanges:metrics.adaptiveChanges,qualityHistory:[...metrics.qualityHistory],vertices:vertices.length/10,drawCalls:useGL?1:0};
}
function recordFrame(stamp, cpu) {
  const interval=lastMetricStamp?stamp-lastMetricStamp:0;
  lastMetricStamp=stamp;
  const sample={stamp,cpu,interval};
  metrics.frames++;metrics.samples.push(sample);
  if(metrics.samples.length>180)metrics.samples.shift();
  if(interval>0 && interval<200)windowSamples.push(sample);
  if(windowSamples.length<90)return;
  const budget=useGL?1000/60:1000/30;
  const slow=percentile(windowSamples.map(s=>s.interval),.75)>budget*1.35 || percentile(windowSamples.map(s=>s.cpu),.95)>budget*.7;
  const fast=percentile(windowSamples.map(s=>s.interval),.75)<budget*1.12 && percentile(windowSamples.map(s=>s.cpu),.95)<budget*.4;
  fastWindows=fast?fastWindows+1:0;
  const next=slow?Math.max(.65,quality-.25):fastWindows>=3?Math.min(1.65,devicePixelRatio||1,quality+.1):quality;
  windowSamples=[];
  if(next!==quality){quality=next;metrics.adaptiveChanges++;metrics.qualityHistory.push({frame:metrics.frames,quality});if(metrics.qualityHistory.length>20)metrics.qualityHistory.shift();resize();}
}
function drawGL(matrix) {
  if(timerPending && gl.getQueryParameter(timerQuery,gl.QUERY_RESULT_AVAILABLE)) {
    if(!gl.getParameter(timerExtension.GPU_DISJOINT_EXT)) {
      metrics.gpu.push(gl.getQueryParameter(timerQuery,gl.QUERY_RESULT)/1e6);
      if(metrics.gpu.length>180)metrics.gpu.shift();
    }
    timerPending=false;
  }
  const measure=timerQuery && !timerPending;
  if(measure)gl.beginQuery(timerExtension.TIME_ELAPSED_EXT,timerQuery);
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(prog);gl.bindVertexArray(va);
  gl.uniformMatrix4fv(uniforms.matrix,false,new Float32Array(matrix));
  gl.uniform1f(uniforms.time,time);gl.uniform3fv(uniforms.focus,[target[0]/.62,1,target[2]/.62]);
  gl.drawArrays(gl.TRIANGLES,0,vertices.length/10);
  if(measure){gl.endQuery(timerExtension.TIME_ELAPSED_EXT);timerPending=true;}
}
function unsettled() {return Math.abs(radiusGoal-radius)+Math.abs(yawGoal-yaw)+Math.abs(pitchGoal-pitch)+goal.reduce((sum,v,i)=>sum+Math.abs(v-target[i]),0)>.002;}
function render(stamp) {
  raf=0;
  if(!inView || document.hidden)return;
  if(!useGL && !ctx) {
    markers.forEach(marker=>{marker.hidden=true;});
    return;
  }
  // Software rendering runs at up to 30fps to leave time for page interaction.
  if(!useGL && stamp-lastDraw<31){requestFrame();return;}
  const start=performance.now();
  const dt=Math.min(.05,(stamp-last)/1000||.016);last=stamp;lastDraw=stamp;
  if(scrollDirty)scrollCamera();
  if(opts.motion)time+=dt;
  const amount=opts.motion?1-Math.exp(-dt*6):1;
  target=target.map((v,i)=>v+(goal[i]-v)*amount);
  yaw+=(yawGoal-yaw)*amount;pitch+=(pitchGoal-pitch)*amount;radius+=(radiusGoal-radius)*amount;
  const matrix=getMatrix(w,h);
  if(useGL)drawGL(matrix);else fallback(matrix);
  sectors.forEach((sector,index)=>{
    const position=project([sector.pos[0],4.45,sector.pos[2]],matrix,w,h), marker=markers[index];
    const keyboardFocused=marker===document.activeElement;
    marker.hidden=!position?.visible && !keyboardFocused;
    if(position && (position.visible || keyboardFocused)){marker.style.left=clamp(position.x,80,w-80)+'px';marker.style.top=clamp(position.y,70,h-28)+'px';}
  });
  $('#worldCoordinate').textContent=yaw.toFixed(2)+' : '+pitch.toFixed(2);
  recordFrame(stamp,performance.now()-start);
  if(opts.motion || unsettled())requestFrame();
}
function requestFrame() {if(!raf && inView && !document.hidden)raf=requestAnimationFrame(render);}
function stopFrames() {
  if(raf)cancelAnimationFrame(raf);
  raf=0;last=0;lastDraw=0;lastMetricStamp=0;
  metrics.samples=[];metrics.gpu=[];windowSamples=[];
}
// Dragging reserves the canvas surface. Ordinary wheel scrolling remains page navigation.
host.addEventListener('pointerdown',event=>{
  if(event.target.closest('button,a') || !event.isPrimary)return;
  setTour(false);
  pointer={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY};
  moved=false;host.setPointerCapture(event.pointerId);
});
host.addEventListener('pointermove',event=>{
  if(!pointer || event.pointerId!==pointer.id)return;
  const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
  moved ||= Math.hypot(event.clientX-pointer.startX,event.clientY-pointer.startY)>5;
  yawGoal-=dx*.006;pitchGoal=clamp(pitchGoal+dy*.0045,.27,1.28);
  if(!opts.motion){yaw=yawGoal;pitch=pitchGoal;}
  pointer.x=event.clientX;pointer.y=event.clientY;requestFrame();
});
function endPointer(event) {
  if(!pointer || event.pointerId!==pointer.id)return;
  if(!moved && event.type==='pointerup') {
    const bounds=host.getBoundingClientRect(), matrix=getMatrix(w,h);
    const hits=sectors.map((sector,index)=>{const p=project(sector.pos,matrix,w,h);return {index,distance:p?Math.hypot(p.x-event.clientX+bounds.left,p.y-event.clientY+bounds.top):Infinity};}).sort((a,b)=>a.distance-b.distance);
    if(hits[0].distance<95){if(focused===hits[0].index && !overview)activate();else select(hits[0].index);}
  }
  const id=pointer.id;pointer=null;
  if(host.hasPointerCapture(id))host.releasePointerCapture(id);
  requestFrame();
}
host.addEventListener('pointerup',endPointer);
host.addEventListener('pointercancel',endPointer);
host.addEventListener('lostpointercapture',()=>{pointer=null;});
host.addEventListener('wheel',event=>{if(!event.altKey)return;event.preventDefault();zoom(Math.sign(event.deltaY)*1.5);},{passive:false});
host.addEventListener('keydown',event=>{
  if(event.target!==host)return;
  if(['1','2','3','4'].includes(event.key)){event.preventDefault();select(Number(event.key)-1);return;}
  if(event.key==='Enter' || event.key===' '){event.preventDefault();activate();return;}
  if(focused===3 && ['a','d','A','D'].includes(event.key)){event.preventDefault();activate(event.key.toLowerCase()==='a'?-1:1);return;}
  if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(event.key))return;
  event.preventDefault();setTour(false);
  if(event.key==='ArrowLeft')yawGoal-=.15;
  if(event.key==='ArrowRight')yawGoal+=.15;
  if(event.key==='ArrowUp' || event.key==='+')zoom(-2);
  if(event.key==='ArrowDown' || event.key==='-')zoom(2);
  if(!opts.motion)yaw=yawGoal;
  requestFrame();
});
canvas.addEventListener('webglcontextlost',event=>{
  event.preventDefault();contextLost=true;useGL=false;timerPending=false;timerQuery=null;
  buffer=va=prog=null;uniforms={};timerExtension=null;
  showRenderer();requestFrame();
});
canvas.addEventListener('webglcontextrestored',()=>{
  contextLost=false;useGL=initGL();uploadGeometry();showRenderer();requestFrame();
});
new IntersectionObserver(entries=>{
  inView=entries[0].isIntersecting;
  if(inView){scrollDirty=true;last=0;requestFrame();}else stopFrames();
},{threshold:.01}).observe(host);
new ResizeObserver(resize).observe(host);
window.addEventListener('scroll',()=>{scrollDirty=true;if(inView && tour)requestFrame();},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopFrames();audio?.suspend();}else {last=0;requestFrame();}});
window.addEventListener('pagehide',()=>{stopFrames();audio?.suspend();});
window.addEventListener('pageshow',()=>requestFrame());
function updateMotion() {
  opts.motion=!safe.matches && !document.documentElement.classList.contains('motion-off');
  if(!opts.motion){setTour(false);setPose({target:goal,yaw:yawGoal,pitch:pitchGoal,radius:radiusGoal});}
  $('#worldTour').disabled=!opts.motion;
  stopFrames();requestFrame();
}
safe.addEventListener('change',updateMotion);
document.addEventListener('portfolio:motion',updateMotion);
announceDistrict(0);setTour(tour);showRenderer();updateMotion();
window.portfolioWorld={
  focus:select, reset:()=>$('#worldReset').click(),
  get state(){return {selected:focused,label:sectors[focused].label,gl:useGL,audio:opts.audio,haptic:opts.haptic,motion:opts.motion,tour,dragging:!!pointer,inView,contextLost,objects:[...objects],camera:{target:[...target],goal:[...goal],yaw,pitch,radius,yawGoal,radiusGoal},performance:performanceState()};}
};
})();
