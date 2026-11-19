/* V9 exploratory lab — isolated, no production homepage hooks. */
(()=>{'use strict';
 const root=document.documentElement,stage=document.querySelector('.stage'),intro=document.querySelector('.intro'),canvas=document.querySelector('.stage-canvas');
 const params=new URLSearchParams(location.search),userReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let paused=userReduced||params.get('motion')==='off',visible=true,raf=0,gl=null,program=null,timeStart=performance.now(),mouseX=0,mouseY=0,scroll=0;
 const mode=root.dataset.concept==='gravity'?1:0;
 if(paused)root.classList.add('motion-off');
 const btn=document.querySelector('.motion-button');
 function updateButton(){if(btn){btn.textContent=paused?'Enable motion':'Pause motion';btn.setAttribute('aria-pressed',String(paused));}}
 updateButton();
 btn?.addEventListener('click',()=>{paused=!paused;root.classList.toggle('motion-off',paused);updateButton();if(!paused)requestFrame();else renderOnce();});
 window.addEventListener('pointermove',e=>{if(paused)return;mouseX=(e.clientX/innerWidth-.5)*2;mouseY=(e.clientY/innerHeight-.5)*2;root.style.setProperty('--mx',mouseX.toFixed(3));root.style.setProperty('--my',mouseY.toFixed(3));},{passive:true});
 function progress(){const max=Math.max(1,intro.offsetHeight-innerHeight);scroll=Math.max(0,Math.min(1,-intro.getBoundingClientRect().top/max));root.style.setProperty('--scroll',scroll.toFixed(4));}
 addEventListener('scroll',()=>{progress();if(paused)renderOnce();},{passive:true});addEventListener('resize',()=>{resize();progress();renderOnce();},{passive:true});progress();
 const vertex=`#version 300 es\nprecision highp float;out vec2 vUv;void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);vUv=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
 const fragment=`#version 300 es
 precision highp float;out vec4 outColor;uniform vec2 uResolution;uniform float uTime;uniform float uScroll;uniform vec2 uMouse;uniform float uMode;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
 vec3 glow(vec3 c,float v){return c*v;}
 void main(){
 vec2 p=(gl_FragCoord.xy-uResolution*.5)/uResolution.y;
 vec2 q=p;float time=uTime*.15;vec3 col=vec3(.015,.026,.027);
 vec3 warm=vec3(1.,.52,.24),silver=vec3(.77,.79,.72);
 if(uMode<.5){
  q.x-=.27+uMouse.x*.012;q.y+=.018+uMouse.y*.01;
  for(int i=15;i>=0;i--){
    float z=float(i),depth=1.+z*.32-uScroll*4.5;
    if(depth<.3)continue;
    vec2 at=q*depth;float wobble=sin(z*.8+time)*.018;at.x+=wobble;
    vec2 ext=vec2(.58,.55);float d=abs(max(abs(at.x)-ext.x,abs(at.y)-ext.y));
    float v=exp(-d*180.)*.41+exp(-d*25.)*.095;
    float fade=1./(1.+z*.27);
    col+=mix(warm,silver,mod(float(i),3.)*.25)*v*fade;
    float corner=length(max(abs(at)-ext,vec2(0.)));
    col+=warm*exp(-corner*19.)*.013*fade;
  }
  float shaft=exp(-abs(q.x-.26)*20.)*.032*max(0.,1.-abs(q.y)*.9);
  col+=warm*shaft;
 }else{
  q.x-=.30+uMouse.x*.012;
  float r=length(q);float a=atan(q.y,q.x);
  for(int i=0;i<11;i++){
    float k=float(i),rad=.19+k*.055+uScroll*.18;
    float bend=.018*sin(a*3.+k*.7+time);
    float d=abs(r-rad+bend);
    float gate=smoothstep(-.95,-.1,sin(a*6.+k*.22));
    col+=mix(warm,silver,mod(k,4.)*.19)*(exp(-d*200.)*.28+exp(-d*25.)*.019)*gate/(1.+k*.28);
  }
  float cut=abs(sin(a*9.+r*6.-time*.25));
  col+=warm*exp(-abs(r-.43)*80.)*.05*cut;
 }
 float vignette=1.-smoothstep(.35,1.2,length(p));
 col*=.56+.44*vignette;col+=(hash(gl_FragCoord.xy+uTime)-.5)*.009;
 outColor=vec4(pow(max(col,vec3(0.)),vec3(.85)),1.);
 }`;
 try{
  gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'high-performance'});
  if(!gl)throw Error('WebGL2 unavailable');
  function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  const uniforms={resolution:gl.getUniformLocation(program,'uResolution'),time:gl.getUniformLocation(program,'uTime'),scroll:gl.getUniformLocation(program,'uScroll'),mouse:gl.getUniformLocation(program,'uMouse'),mode:gl.getUniformLocation(program,'uMode')};
  gl.uniform1f(uniforms.mode,mode);
  function frame(t){raf=0;if(!visible)return;resize();gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(uniforms.resolution,canvas.width,canvas.height);gl.uniform1f(uniforms.time,paused?0:(t-timeStart)/1000);gl.uniform1f(uniforms.scroll,scroll);gl.uniform2f(uniforms.mouse,mouseX,mouseY);gl.drawArrays(gl.TRIANGLES,0,3);if(!paused)requestFrame();}
  window.renderOnce=()=>{if(gl&&visible){cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);}};
  window.requestFrame=()=>{if(!raf&&visible)raf=requestAnimationFrame(frame);};
  function resize(){if(!gl)return;const d=Math.min(devicePixelRatio||1,innerWidth<700?1.25:1.5);const w=Math.round(canvas.clientWidth*d),h=Math.round(canvas.clientHeight*d);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}}
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)requestFrame();else{cancelAnimationFrame(raf);raf=0;}},{threshold:0}).observe(stage);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){visible=false;cancelAnimationFrame(raf);raf=0;}else{visible=true;requestFrame();}});
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);if(gl){gl.deleteProgram(program);program=null;}},{once:true});
  resize();requestFrame();
 }catch(e){canvas.style.display='none';console.warn('V9 decorative WebGL layer unavailable; CSS composition remains.',e.message);}
 function resize(){};function renderOnce(){window.renderOnce?.()};function requestFrame(){window.requestFrame?.()};
 window.__v9Lab={concept:mode?'gravity':'rift',isReduced:()=>paused,hasWebGL:()=>!!gl,scrollProgress:()=>scroll};
})();