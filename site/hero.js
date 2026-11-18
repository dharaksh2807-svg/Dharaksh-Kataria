/* Lightweight WebGL2 sculpture, handcrafted geometry + shaders; no WebGL framework / fetched assets. */
(() => {
  'use strict';
  const canvas=document.getElementById('sculptureCanvas');
  const container=document.getElementById('heroArt');
  if(!canvas||!container)return;
  const motionReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let motionPaused=document.documentElement.classList.contains('motion-off');
  const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,depth:true,premultipliedAlpha:false,powerPreference:'high-performance'});
  if(!gl){
    const ctx=canvas.getContext('2d');
    if(!ctx)return;
    let fallbackVisible=true,fallbackRaf=0,tw=0,th=0,dx=0,dy=0;
    const resize2D=()=>{let r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const d=Math.min(devicePixelRatio||1,1.5);let w=Math.round(r.width*d),h=Math.round(r.height*d);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;tw=r.width;th=r.height;ctx.setTransform(d,0,0,d,0,0)}};
    function draw2D(time){resize2D();if(!tw)return;const t=(motionReduced||motionPaused)?0:time*.0003;ctx.clearRect(0,0,tw,th);ctx.save();ctx.translate(tw*.50+dx*16,th*.52+dy*18);const k=Math.min(tw,th)*.29;
      for(let i=0;i<9;i++){const a=i*Math.PI/9+t*(i%2===0?1:-.65);const depth=Math.sin(a)*.5+.5;ctx.save();ctx.rotate(a);ctx.beginPath();ctx.ellipse(0,0,k*(.93+.13*Math.cos(t+i)),k*(.45+.10*depth),0,0,Math.PI*2);ctx.strokeStyle=`rgba(${190+Math.round(depth*45)},${96+Math.round(depth*65)},${65+Math.round(depth*60)},${.18+depth*.58})`;ctx.lineWidth=3+depth*11;ctx.stroke();ctx.restore()}
      ctx.restore();
    }
    function fallbackFrame(time){fallbackRaf=0;if(!fallbackVisible||document.hidden)return;draw2D(time);if(!motionReduced&&!motionPaused)fallbackRaf=requestAnimationFrame(fallbackFrame)}
    function start2D(){if(!fallbackRaf){fallbackRaf=requestAnimationFrame(fallbackFrame)}}
    new ResizeObserver(()=>{resize2D();draw2D(performance.now())}).observe(container);
    new IntersectionObserver(e=>{fallbackVisible=!!e[0]?.isIntersecting;if(fallbackVisible)start2D();else if(fallbackRaf){cancelAnimationFrame(fallbackRaf);fallbackRaf=0}},{threshold:0}).observe(container);
    container.addEventListener('pointermove',e=>{if(motionReduced||motionPaused)return;const r=container.getBoundingClientRect();dx=(e.clientX-r.left)/r.width-.5;dy=(e.clientY-r.top)/r.height-.5},{passive:true});
    document.addEventListener('portfolio:motion',e=>{motionPaused=e.detail.muted;start2D()});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)start2D()});
    resize2D();start2D();return;
  }
  const vert=`#version 300 es
    precision highp float;
    layout(location=0) in vec3 aPosition;
    layout(location=1) in vec3 aNormal;
    layout(location=2) in vec2 aUv;
    uniform vec2 uRotation;
    uniform float uTime;
    uniform float uAspect;
    out vec3 vNormal;
    out vec3 vPosition;
    out vec2 vUv;
    void main(){
      float cy=cos(uRotation.y),sy=sin(uRotation.y),cx=cos(uRotation.x),sx=sin(uRotation.x);
      mat3 rotateY=mat3(cy,0.,-sy, 0.,1.,0., sy,0.,cy);
      mat3 rotateX=mat3(1.,0.,0., 0.,cx,sx, 0.,-sx,cx);
      mat3 rot=rotateY*rotateX;
      vec3 p=rot*aPosition;
      vPosition=p;
      vNormal=normalize(rot*aNormal);
      vUv=aUv;
      float persp=3.75/(5.25-p.z);
      float aspectFit=max(.75,uAspect);
      gl_Position=vec4(p.x*persp*.72/aspectFit,p.y*persp*.72,p.z*.15,1.);
    }
  `;
  const frag=`#version 300 es
    precision highp float;
    in vec3 vNormal;
    in vec3 vPosition;
    in vec2 vUv;
    uniform float uTime;
    out vec4 outColor;
    void main(){
      vec3 n=normalize(vNormal);
      vec3 light=normalize(vec3(-.48,.80,1.2));
      vec3 fillLight=normalize(vec3(.78,-.4,-.2));
      float lambert=max(dot(n,light),0.);
      float secondary=max(dot(n,fillLight),0.);
      float fresnel=pow(1.-abs(dot(n,vec3(0.,0.,1.))),2.1);
      float fine=sin(vUv.y*30.0 + sin(vUv.x*35.)*.75)*.028;
      vec3 deep=vec3(.39,.20,.15);
      vec3 mid=vec3(.79,.37,.25);
      vec3 bright=vec3(1.0,.73,.51);
      vec3 color=mix(deep,mid,clamp(.22+lambert*.84,0.,1.));
      color=mix(color,bright,clamp(pow(lambert,3.4)*.66+secondary*.12,0.,1.));
      color+=fresnel*vec3(.16,.13,.12);
      color+=fine;
      color*=.94 + .055*sin(vUv.x*18.);
      outColor=vec4(pow(color,vec3(.9)),1.);
    }
  `;
  function compile(type,source){let sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){console.warn('Sculpture shader unavailable:',gl.getShaderInfoLog(sh));gl.deleteShader(sh);return null}return sh}
  const v=compile(gl.VERTEX_SHADER,vert),f=compile(gl.FRAGMENT_SHADER,frag);
  if(!v||!f)return;
  const program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS)){console.warn('Sculpture unavailable:',gl.getProgramInfoLog(program));return}
  gl.deleteShader(v);gl.deleteShader(f);
  const locRot=gl.getUniformLocation(program,'uRotation'),locTime=gl.getUniformLocation(program,'uTime'),locAspect=gl.getUniformLocation(program,'uAspect');
  const vec=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const normalize=v=>{let d=Math.hypot(...v)||1;return v.map(n=>n/d)};
  const center=t=>[(1.85+.58*Math.cos(3*t))*Math.cos(2*t)*.63,(1.85+.58*Math.cos(3*t))*Math.sin(2*t)*.63,.85*Math.sin(3*t)*.75];
  const around=28,length=360,position=[],normal=[],uv=[],index=[];
  for(let i=0;i<=length;i++){
    let t=i/length*Math.PI*2;
    const c=center(t),tangent=normalize(vec(center(t+.0004),center(t-.0004)));
    const reference=Math.abs(tangent[2])>.94?[0,1,0]:[0,0,1];
    const n=normalize(cross(tangent,reference)),b=normalize(cross(tangent,n));
    for(let j=0;j<=around;j++){
      const a=j/around*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a);
      const direction=normalize([n[0]*ca+b[0]*sa,n[1]*ca+b[1]*sa,n[2]*ca+b[2]*sa]);
      const r=.235 + .026*Math.sin(t*7.0);
      position.push(c[0]+direction[0]*r,c[1]+direction[1]*r,c[2]+direction[2]*r);
      normal.push(...direction);uv.push(i/length,j/around);
      if(i<length && j<around){const base=i*(around+1)+j;index.push(base,base+1,base+around+1,base+1,base+around+2,base+around+1)}
    }
  }
  const vao=gl.createVertexArray();gl.bindVertexArray(vao);
  function attribute(slot,array,size){let buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(array),gl.STATIC_DRAW);gl.enableVertexAttribArray(slot);gl.vertexAttribPointer(slot,size,gl.FLOAT,false,0,0)}
  attribute(0,position,3);attribute(1,normal,3);attribute(2,uv,2);
  let elementBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,elementBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(index),gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
  let width=0,height=0,visible=true,rotX=-.44,rotY=.32,targetX=-.44,targetY=.32;
  function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const dpr=Math.min(devicePixelRatio||1,1.65);const w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);if(w!==width||h!==height){width=w;height=h;canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);resize();
  let scheduled=false;
  document.addEventListener('portfolio:motion',event=>{motionPaused=event.detail.muted;scheduleFrame()});
  function scheduleFrame(){if(!scheduled && visible && !document.hidden){scheduled=true;requestAnimationFrame(render)}}
  const visibility=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true;if(visible)scheduleFrame()},{threshold:0});visibility.observe(container);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleFrame()});
  container.addEventListener('pointermove',(event)=>{if(motionReduced||motionPaused)return;const r=container.getBoundingClientRect();const px=(event.clientX-r.left)/r.width-.5,py=(event.clientY-r.top)/r.height-.5;targetY=.32+px*.60;targetX=-.44-py*.48},{passive:true});
  container.addEventListener('pointerleave',()=>{targetX=-.44;targetY=.32});
  function render(now){scheduled=false;if(!visible||document.hidden)return;resize();if(!width)return;
    const time=now*.001;
    rotX+=(targetX-rotX)*.024;
    rotY+=(targetY-rotY)*.024;
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);gl.uniform2f(locRot,rotX+(motionReduced||motionPaused?0:Math.sin(time*.15)*.05),rotY+(motionReduced||motionPaused?0:time*.07));gl.uniform1f(locTime,time);gl.uniform1f(locAspect,width/height);
    gl.bindVertexArray(vao);gl.drawElements(gl.TRIANGLES,index.length,gl.UNSIGNED_SHORT,0);
    gl.bindVertexArray(null);
    if(!motionReduced&&!motionPaused)scheduleFrame();
  }
  scheduleFrame();
})();
