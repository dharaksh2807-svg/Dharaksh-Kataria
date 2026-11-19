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

    function draw2D(time){
      resize2D();if(!tw)return;
      const t=(motionReduced||motionPaused)?0:time*.001;
      ctx.clearRect(0,0,tw,th);ctx.save();
      ctx.translate(tw*.5+dx*12,th*.51+dy*12);
      const size=Math.min(tw*.24,th*.30);
      ctx.scale(size,size);ctx.rotate(Math.sin(t*.21)*.035);
      const metal=ctx.createLinearGradient(-1.9,-1.8,2.2,1.6);
      metal.addColorStop(0,'#382b29');metal.addColorStop(.27,'#b57965');
      metal.addColorStop(.49,'#efd0a4');metal.addColorStop(.72,'#c28b6d');
      metal.addColorStop(1,'#4a3029');
      ctx.lineWidth=.23;ctx.lineJoin='round';ctx.lineCap='round';
      ctx.strokeStyle=metal;ctx.shadowColor='rgba(219,140,103,.35)';ctx.shadowBlur=.21;
      ctx.beginPath();ctx.moveTo(-1.65,-1.6);ctx.lineTo(-1.65,1.6);
      ctx.moveTo(-1.65,-1.6);ctx.bezierCurveTo(.06,-1.72,.44,-.64,.05,.04);
      ctx.bezierCurveTo(.46,.94,-.45,1.86,-1.65,1.6);
      ctx.moveTo(.57,-1.65);ctx.lineTo(.57,1.65);
      ctx.moveTo(1.95,-1.65);ctx.lineTo(.57,-.05);ctx.lineTo(1.95,1.65);
      ctx.stroke();ctx.shadowBlur=0;
      const shine=ctx.createLinearGradient(-1.6,-1.6,1.7,1.6);
      shine.addColorStop(0,'rgba(255,228,186,0)');
      shine.addColorStop(.48,'rgba(255,232,206,.6)');
      shine.addColorStop(.65,'rgba(255,232,206,0)');
      ctx.strokeStyle=shine;ctx.lineWidth=.045;
      ctx.stroke();ctx.restore();
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
      float aspectFit=max(.95,uAspect);
      gl_Position=vec4(p.x*persp*.67/aspectFit,p.y*persp*.67,p.z*.15,1.);
    }
  `;
  const frag=`#version 300 es
    precision highp float;
    in vec3 vNormal; in vec3 vPosition; in vec2 vUv;
    uniform float uTime;
    out vec4 outColor;
    void main(){
     vec3 n=normalize(vNormal);
     vec3 key=normalize(vec3(-.48,.76,1.0));
     vec3 rim=normalize(vec3(.82,-.32,.47));
     vec3 view=vec3(0.,0.,1.);
     float diffuse=max(dot(n,key),0.);
     float opposite=max(dot(n,rim),0.);
     float edge=pow(1.-abs(dot(n,view)),2.5);
     float spec=pow(max(dot(n,normalize(key+view)),0.),72.);
     float coolSpec=pow(max(dot(n,normalize(rim+view)),0.),42.);
     float sweep=pow(max(0.,cos(vUv.x*6.28318*1.7-uTime*.48)),24.)*.24;
     float micro=sin(vUv.x*1250.0+vUv.y*16.)*.009;
     vec3 umber=vec3(.16,.095,.09); vec3 copper=vec3(.59,.27,.20);
     vec3 champagne=vec3(.95,.72,.51);
     vec3 metal=mix(umber,copper,clamp(.28+diffuse*.83,0.,1.));
     metal=mix(metal,champagne,clamp(spec*.72+coolSpec*.27+sweep*.33,0.,.86));
     metal+=edge*vec3(.25,.17,.12)+opposite*vec3(.10,.13,.11);
     metal+=micro;
     outColor=vec4(pow(clamp(metal,0.,1.),vec3(.92)),1.);
    }`;
  function compile(type,source){let sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){console.warn('Sculpture shader unavailable:',gl.getShaderInfoLog(sh));gl.deleteShader(sh);return null}return sh}
  const v=compile(gl.VERTEX_SHADER,vert),f=compile(gl.FRAGMENT_SHADER,frag);
  if(!v||!f)return;
  const program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS)){console.warn('Sculpture unavailable:',gl.getProgramInfoLog(program));return}
  gl.deleteShader(v);gl.deleteShader(f);
  const locRot=gl.getUniformLocation(program,'uRotation'),locTime=gl.getUniformLocation(program,'uTime'),locAspect=gl.getUniformLocation(program,'uAspect');

  // Distinctive D/K monogram built as five beveled metallic ribbon strokes.
  const subtract=(a,b)=>a.map((v,i)=>v-b[i]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const normalize=v=>{const d=Math.hypot(...v)||1;return v.map(x=>x/d)};
  const bez=(a,b,c,d,t)=>{const q=1-t;return a.map((v,i)=>q*q*q*v+3*q*q*t*b[i]+3*q*t*t*c[i]+t*t*t*d[i])};
  const A=[-1.65,1.6,.16],B=[-1.65,-1.6,.16];
  const strokes=[
    {curves:[[A,[-1.8,.6,.18],[-1.8,-.6,.18],B]],width:.15},
    {curves:[[A,[-.7,1.99,.3],[.17,1.18,.55],[.05,0,.49]],
             [[.05,0,.49],[.10,-1.15,.55],[-.75,-1.98,.3],B]],width:.17},
    {curves:[[[.55,1.65,-.04],[.52,.55,-.04],[.52,-.65,-.04],[.55,-1.65,-.04]]],width:.155},
    {curves:[[[1.94,1.64,-.04],[1.53,1.12,.03],[1.10,.48,.08],[.56,-.04,.12]]],width:.15},
    {curves:[[[.56,-.04,.12],[1.02,-.52,.05],[1.52,-1.17,-.04],[1.99,-1.65,-.04]]],width:.15}
  ];
  const position=[],normal=[],uv=[],index=[],ring=14;
  for(const stroke of strokes){
    const start=position.length/3,samples=stroke.curves.length*72;
    const path=t=>{
      const segment=Math.min(stroke.curves.length-1,Math.floor(t*stroke.curves.length));
      const u=t>=1?1:t*stroke.curves.length-segment;
      return bez(...stroke.curves[segment],u);
    };
    for(let i=0;i<=samples;i++){
      const t=i/samples,c=path(t),ahead=path(Math.min(1,t+.0007)),behind=path(Math.max(0,t-.0007));
      const tangent=normalize(subtract(ahead,behind));
      const side=normalize([-tangent[1],tangent[0],0]);
      const depth=normalize(cross(tangent,side));
      const cap=Math.min(1,.65+Math.min(t,1-t)*15);
      const radius=stroke.width*cap;
      for(let j=0;j<=ring;j++){
        const a=j/ring*Math.PI*2,cs=Math.cos(a),sn=Math.sin(a);
        const n=normalize([side[0]*cs+depth[0]*sn*.7,side[1]*cs+depth[1]*sn*.7,side[2]*cs+depth[2]*sn*.7]);
        position.push(c[0]+side[0]*radius*cs+depth[0]*radius*.52*sn,
                      c[1]+side[1]*radius*cs+depth[1]*radius*.52*sn,
                      c[2]+side[2]*radius*cs+depth[2]*radius*.52*sn);
        normal.push(...n);uv.push(t,j/ring);
        if(i<samples&&j<ring){const p=start+i*(ring+1)+j;index.push(p,p+1,p+ring+1,p+1,p+ring+2,p+ring+1)}
      }
    }
  }
  if(position.length/3>65535)throw new Error('Sculpture index limit exceeded');
  const vao=gl.createVertexArray();gl.bindVertexArray(vao);
  function attribute(slot,array,size){let buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(array),gl.STATIC_DRAW);gl.enableVertexAttribArray(slot);gl.vertexAttribPointer(slot,size,gl.FLOAT,false,0,0)}
  attribute(0,position,3);attribute(1,normal,3);attribute(2,uv,2);
  let elementBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,elementBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(index),gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
  let width=0,height=0,visible=true,rotX=-.11,rotY=.10,targetX=-.11,targetY=.10;
  function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const dpr=Math.min(devicePixelRatio||1,1.65);const w=Math.round(r.width*dpr),h=Math.round(r.height*dpr);if(w!==width||h!==height){width=w;height=h;canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);resize();
  let scheduled=false;
  document.addEventListener('portfolio:motion',event=>{motionPaused=event.detail.muted;scheduleFrame()});
  function scheduleFrame(){if(!scheduled && visible && !document.hidden){scheduled=true;requestAnimationFrame(render)}}
  const visibility=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true;if(visible)scheduleFrame()},{threshold:0});visibility.observe(container);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)scheduleFrame()});
  container.addEventListener('pointermove',(event)=>{if(motionReduced||motionPaused)return;const r=container.getBoundingClientRect();const px=(event.clientX-r.left)/r.width-.5,py=(event.clientY-r.top)/r.height-.5;targetY=.10+px*.34;targetX=-.11-py*.27},{passive:true});
  container.addEventListener('pointerleave',()=>{targetX=-.11;targetY=.10});
  function render(now){scheduled=false;if(!visible||document.hidden)return;resize();if(!width)return;
    const time=now*.001;
    rotX+=(targetX-rotX)*.024;
    rotY+=(targetY-rotY)*.024;
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);gl.uniform2f(locRot,rotX+(motionReduced||motionPaused?0:Math.sin(time*.19)*.065),rotY+(motionReduced||motionPaused?0:Math.sin(time*.23)*.18));gl.uniform1f(locTime,time);gl.uniform1f(locAspect,width/height);
    gl.bindVertexArray(vao);gl.drawElements(gl.TRIANGLES,index.length,gl.UNSIGNED_SHORT,0);
    gl.bindVertexArray(null);
    if(!motionReduced&&!motionPaused)scheduleFrame();
  }
  scheduleFrame();
})();
