/* THE RIFT — DIRECTOR'S CUT / isolated Three.js cinematic experiment.
 * Source of truth is scroll progress: no cumulative ring rotations or camera drift.
 * Offline-capable on a Mac with the previously vendored Three.js r182 files;
 * otherwise the pinned CDN is attempted. CSS Rift remains if WebGL is unavailable.
 */
(async () => {
  'use strict';

  const html = document.documentElement;
  const stage = document.querySelector('.stage');
  const intro = document.querySelector('.intro');
  const canvas = document.getElementById('riftCanvas');
  const motionButton = document.querySelector('.motion-button');
  const readout = document.getElementById('cameraState');
  if (!stage || !intro || !canvas) return;

  const motionPref = matchMedia('(prefers-reduced-motion: reduce)');
  const params = new URLSearchParams(location.search);
  const motionDisabledByUrl = params.get('motion') === 'off';
  let reduced = motionPref.matches;
  let paused = reduced || motionDisabledByUrl;
  let inView = true, raf = 0, disposed = false, lastFrame = 0, elapsed = 0;
  let progress = 0, pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
  let renderer = null, scene = null, camera = null, portal = null;
  let rings = [], fracturePieces = [], lights = {}, envRenderTarget = null;
  let materials = [], geometries = [], textures = [], frameIntervals = [], renderedFrames = 0;
  let webglReady = false;
  const clamp = (v, a=0, b=1) => Math.max(a, Math.min(b,v));
  const smooth = v => { const x=clamp(v); return x*x*(3-2*x); };
  const range = (v,a,b) => smooth((v-a)/(b-a));
  const pulse = (v,a,b,c) => range(v,a,b)*(1-range(v,b,c));
  const css = (key,val) => html.style.setProperty(key, String(val));
  const deg = Math.PI / 180;

  html.classList.add('js-active');
  function syncButton(){
    if (!motionButton) return;
    motionButton.disabled = reduced;
    motionButton.textContent = reduced ? 'Reduced motion on' : paused ? 'Resume motion' : 'Pause motion';
    motionButton.setAttribute('aria-pressed',String(paused));
    html.classList.toggle('motion-off',paused);
    html.classList.toggle('reduced-motion',reduced);
  }
  syncButton();

  async function loadThree(){
    try { return await import('./vendor/three.module.min.js'); }
    catch(localError){
      try { return await import('https://cdn.jsdelivr.net/npm/three@0.182.0/build/three.module.js'); }
      catch(cdnError){ throw new Error('Three.js could not load locally or from pinned CDN'); }
    }
  }

  function octagon(THREE,x,y,corner,clockwise=false){
    const p=[
      [-x+corner,y],[x-corner,y],[x,y-corner],[x,-y+corner],
      [x-corner,-y],[-x+corner,-y],[-x,-y+corner],[-x,y-corner]
    ];
    if(clockwise)p.reverse();
    const path = clockwise ? new THREE.Path() : new THREE.Shape();
    path.moveTo(p[0][0],p[0][1]);
    for(let i=1;i<p.length;i++)path.lineTo(p[i][0],p[i][1]);
    path.closePath();
    return path;
  }

  function makeFrameGeometry(THREE){
    const outer=octagon(THREE,2.1,2.47,.38);
    outer.holes.push(octagon(THREE,1.77,2.14,.29,true));
    const geometry=new THREE.ExtrudeGeometry(outer,{
      depth:.19,steps:1,bevelEnabled:true,bevelSize:.045,bevelThickness:.047,bevelSegments:3,curveSegments:1
    });
    geometry.translate(0,0,-.095);
    geometries.push(geometry);
    return geometry;
  }

  function studioEnvironment(THREE){
    const texCanvas=document.createElement('canvas');
    texCanvas.width=1024;texCanvas.height=512;
    const ctx=texCanvas.getContext('2d');
    const g=ctx.createLinearGradient(0,0,0,512);
    g.addColorStop(0,'#191b1c');g.addColorStop(.36,'#66574c');
    g.addColorStop(.55,'#a58b6e');g.addColorStop(.72,'#282d2a');g.addColorStop(1,'#101414');
    ctx.fillStyle=g;ctx.fillRect(0,0,1024,512);
    // Luminous studio strips are reflected by PBR metal rather than rendered as arbitrary glow.
    const panels=[
      [72,92,62,330,'rgba(255,247,222,.95)'],
      [180,60,125,250,'rgba(255,237,204,.8)'],
      [475,114,38,305,'rgba(250,202,154,.96)'],
      [650,90,168,200,'rgba(255,246,224,.87)'],
      [875,148,52,285,'rgba(255,208,170,.94)']
    ];
    for(const [x,y,w,h,color] of panels){
      const grad=ctx.createLinearGradient(x,0,x+w,0);
      grad.addColorStop(0,'rgba(255,243,213,0)');
      grad.addColorStop(.19,color);grad.addColorStop(.78,color);
      grad.addColorStop(1,'rgba(255,243,213,0)');
      ctx.fillStyle=grad;ctx.fillRect(x,y,w,h);
    }
    const texture=new THREE.CanvasTexture(texCanvas);
    texture.mapping=THREE.EquirectangularReflectionMapping;
    texture.colorSpace=THREE.SRGBColorSpace;
    textures.push(texture);
    const pmrem=new THREE.PMREMGenerator(renderer);
    envRenderTarget=pmrem.fromEquirectangular(texture);
    pmrem.dispose();
    return envRenderTarget.texture;
  }

  function buildScene(THREE){
    renderer=new THREE.WebGLRenderer({
      canvas,alpha:true,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:false
    });
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.13;
    renderer.setClearColor(0x000000,0);
    // Deliberately budget real shadow maps to desktop-quality renderers only.
    const shadowQuality=innerWidth>=960 && params.get('quality')!=='low';
    renderer.shadowMap.enabled=shadowQuality;
    if(shadowQuality)renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    scene=new THREE.Scene();
    scene.fog=new THREE.FogExp2(0x100e0c,.032);
    camera=new THREE.PerspectiveCamera(42,1,.07,100);
    camera.position.set(0,0,10.6);
    camera.lookAt(0,0,-10);

    scene.environment=studioEnvironment(THREE);
    scene.environmentIntensity=1.2;

    const bronze=new THREE.MeshPhysicalMaterial({
      color:0xa97650,metalness:.91,roughness:.23,
      clearcoat:.25,clearcoatRoughness:.2,envMapIntensity:1.7
    });
    const silver=new THREE.MeshPhysicalMaterial({
      color:0xd8c4ae,metalness:.89,roughness:.29,
      clearcoat:.18,clearcoatRoughness:.19,envMapIntensity:1.5
    });
    const dark=new THREE.MeshPhysicalMaterial({
      color:0x282522,metalness:.82,roughness:.34,envMapIntensity:1.15
    });
    const edgeMaterial=new THREE.LineBasicMaterial({
      color:0xffd4a2,transparent:true,opacity:.33,depthWrite:false
    });
    materials.push(bronze,silver,dark,edgeMaterial);
    const frameGeometry=makeFrameGeometry(THREE);
    const edgeGeometry=new THREE.EdgesGeometry(frameGeometry,23);
    geometries.push(edgeGeometry);

    portal=new THREE.Group();
    portal.position.set(2.25,.03,0);
    scene.add(portal);
    const group=new THREE.Group();
    group.rotation.y=-.11;
    portal.add(group);

    for(let i=0;i<11;i++){
      const layer=new THREE.Group();
      const s=Math.pow(.94,i);
      layer.position.z=-i*.72;
      layer.scale.setScalar(s);
      const original=(i%4===0?silver:i%3===0?bronze:dark);
      // Front layer uses its own material for the fracture crossfade.
      const frontMat=i===0?original.clone():original;
      if(i===0){frontMat.transparent=true;materials.push(frontMat);}
      const frame=new THREE.Mesh(frameGeometry,[frontMat,dark]);
      frame.castShadow=shadowQuality;
      frame.receiveShadow=shadowQuality;
      layer.add(frame);
      if(i<7){
        const edges=new THREE.LineSegments(edgeGeometry,edgeMaterial);
        edges.position.z=.015;edges.scale.setScalar(1.004);
        layer.add(edges);
      }
      group.add(layer);
      rings.push({group:layer,frame,baseScale:s,frontMat});
    }

    // Four real independent meshes make up the fracture moment.
    // The intact front frame crossfades out while these pieces separate in Z.
    function roundedBeamGeometry(width,height){
      const r=Math.min(height*.22,.12),x=width/2,y=height/2;
      const s=new THREE.Shape();
      s.moveTo(-x+r,-y);s.lineTo(x-r,-y);s.quadraticCurveTo(x,-y,x,-y+r);
      s.lineTo(x,y-r);s.quadraticCurveTo(x,y,x-r,y);
      s.lineTo(-x+r,y);s.quadraticCurveTo(-x,y,-x,y-r);
      s.lineTo(-x,-y+r);s.quadraticCurveTo(-x,-y,-x+r,-y);
      s.closePath();
      const g=new THREE.ExtrudeGeometry(s,{depth:.25,steps:1,bevelEnabled:true,bevelThickness:.045,bevelSize:.045,bevelSegments:3,curveSegments:2});
      g.translate(0,0,-.125);geometries.push(g);return g;
    }
    const horizontal=roundedBeamGeometry(3.55,.32);
    const vertical=roundedBeamGeometry(4.23,.32);
    const positions=[[0,2.3,0],[1.93,0,Math.PI/2],[0,-2.3,0],[-1.93,0,Math.PI/2]];
    for(let i=0;i<4;i++){
      const mat=bronze.clone();mat.transparent=true;mat.opacity=0;
      materials.push(mat);
      const piece=new THREE.Mesh(i%2?vertical:horizontal,mat);
      piece.position.set(positions[i][0],positions[i][1],.35);
      piece.rotation.z=positions[i][2];
      group.add(piece);
      fracturePieces.push({mesh:piece,base:positions[i],material:mat});
    }

    // The word also exists inside real scene depth, so the camera can pass its plane.
    // The HTML ghost version is an art-direction layer; this plane is depth-tested geometry.
    const wordCanvas=document.createElement('canvas');
    wordCanvas.width=2048;wordCanvas.height=256;
    const wordCtx=wordCanvas.getContext('2d');
    wordCtx.clearRect(0,0,2048,256);
    wordCtx.textAlign='center';wordCtx.textBaseline='middle';
    wordCtx.font='700 210px Arial, sans-serif';
    wordCtx.strokeStyle='rgba(255,235,204,.68)';wordCtx.lineWidth=3;
    wordCtx.shadowColor='rgba(234,147,84,.55)';wordCtx.shadowBlur=23;
    wordCtx.strokeText('SUBSTANCE',1024,136,1990);
    wordCtx.shadowBlur=0;
    wordCtx.fillStyle='rgba(245,201,163,.30)';
    wordCtx.fillText('SUBSTANCE',1024,136,1990);
    const wordTexture=new THREE.CanvasTexture(wordCanvas);
    wordTexture.colorSpace=THREE.SRGBColorSpace;textures.push(wordTexture);
    const wordMat=new THREE.MeshBasicMaterial({map:wordTexture,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
    materials.push(wordMat);
    const wordGeo=new THREE.PlaneGeometry(7.6,.97);geometries.push(wordGeo);
    const wordPlane=new THREE.Mesh(wordGeo,wordMat);
    wordPlane.position.set(0,0,-4.7);
    group.add(wordPlane);
    animObjects.wordMat=wordMat;
    // Atmosphere is physical scene light and a rear glow plane, not full-screen fake bloom.
    const glowCanvas=document.createElement('canvas');glowCanvas.width=256;glowCanvas.height=256;
    const ctx=glowCanvas.getContext('2d');
    const glow=ctx.createRadialGradient(128,128,3,128,128,128);
    glow.addColorStop(0,'rgba(255,216,161,.63)');
    glow.addColorStop(.22,'rgba(232,142,71,.26)');
    glow.addColorStop(.75,'rgba(133,81,51,.05)');
    glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,256,256);
    const glowTex=new THREE.CanvasTexture(glowCanvas);
    glowTex.colorSpace=THREE.SRGBColorSpace;textures.push(glowTex);
    const glowMat=new THREE.MeshBasicMaterial({
      map:glowTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.58
    });
    materials.push(glowMat);
    const glowGeo=new THREE.PlaneGeometry(7.2,7.2);geometries.push(glowGeo);
    const glowMesh=new THREE.Mesh(glowGeo,glowMat);
    glowMesh.position.set(0,0,-10.8);group.add(glowMesh);

    lights.ambient=new THREE.AmbientLight(0xb3ad9f,.25);scene.add(lights.ambient);
    lights.key=new THREE.DirectionalLight(0xffe1ba,3.4);
    lights.key.position.set(3.5,7,8);
    if(shadowQuality){
      lights.key.castShadow=true;
      lights.key.shadow.mapSize.set(1024,1024);
      Object.assign(lights.key.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:.8,far:37});
      lights.key.shadow.camera.updateProjectionMatrix();
      lights.key.shadow.normalBias=.025;
      lights.key.shadow.bias=-.0001;
    }
    scene.add(lights.key);
    lights.rim=new THREE.DirectionalLight(0xbcc8ce,2.4);
    lights.rim.position.set(-5,-1,5);scene.add(lights.rim);
    lights.sweep=new THREE.PointLight(0xffa267,45,28,2);
    lights.sweep.position.set(-1,1.5,6);scene.add(lights.sweep);
    lights.core=glowMat;

    // A few geometrical guide arcs, deliberately subordinate to the rings.
    const orbitPts=[];
    for(let i=0;i<=140;i++){
      const a=i/140*Math.PI*2;
      orbitPts.push(new THREE.Vector3(Math.cos(a)*3.8,Math.sin(a)*3.25,-1.2));
    }
    const orbitGeo=new THREE.BufferGeometry().setFromPoints(orbitPts);geometries.push(orbitGeo);
    const orbitMat=new THREE.LineBasicMaterial({color:0xd6aa7e,transparent:true,opacity:.13,depthWrite:false});
    materials.push(orbitMat);
    const orbit=new THREE.LineLoop(orbitGeo,orbitMat);
    orbit.position.x=2.25;orbit.rotation.z=-.24;scene.add(orbit);

    return {group,orbit,glowMesh};
  }

  const animObjects={};
  function prepareProjects(){
    const cards=Array.from(document.querySelectorAll('.bridge-card'));
    if(!('IntersectionObserver' in window)||reduced){
      cards.forEach(el=>el.classList.add('is-visible'));
      return;
    }
    const obs=new IntersectionObserver(entries=>{
      for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-visible');obs.unobserve(entry.target);}
    },{rootMargin:'0px 0px -35px 0px',threshold:.08});
    cards.forEach(el=>obs.observe(el));
  }

  function readProgress(){
    const max=Math.max(1,intro.offsetHeight-innerHeight);
    progress=clamp(-intro.getBoundingClientRect().top/max);
  }

  function updateText(p,entry){
    const transition=range(p,.73,.96);
    const vanish=1-range(p,.21,.49);
    const substanceIn=range(p,.24,.42);
    const substanceOut=1-range(p,.64,.85);
    const reveal=substanceIn*substanceOut;
    css('--rift-scroll',p.toFixed(4));
    css('--scroll',p.toFixed(4));
    css('--title-y',(-p*(innerWidth<680?95:135) + (1-entry)*35).toFixed(2)+'px');
    css('--title-opacity',clamp(vanish*entry).toFixed(3));
    css('--title-scale',(1-p*.07).toFixed(3));
    css('--substance-alpha',(.32*reveal).toFixed(3));
    css('--substance-scale',(1+p*2.85).toFixed(3));
    css('--substance-shift',(-p*185).toFixed(1)+'px');
    css('--beam-shift',((p-.3)*280 + Math.sin(elapsed*.0005)*9).toFixed(1)+'px');
    css('--wipe',(transition*164).toFixed(1)+'%');
    css('--wipe-opacity',clamp(range(p,.79,.92)).toFixed(3));
    css('--mx',pointerX.toFixed(3));css('--my',pointerY.toFixed(3));
    css('--portal-fallback-scale',(1+p*2).toFixed(3));
    css('--portal-fallback-spin',(p*12).toFixed(2)+'deg');
    // Prevent motion-reduced users from seeing transition-only invisible text.
    if(reduced){css('--title-opacity','1');css('--title-y','0px');css('--substance-alpha','0');css('--wipe','0%');css('--wipe-opacity','0');}
  }

  function animate3D(p,t){
    if(!webglReady||!scene||!camera||!portal)return;
    const twist=pulse(p,.14,.34,.56);
    const fracture=pulse(p,.37,.51,.65);
    const travel=range(p,.60,.96);
    const introEase=1-Math.pow(1-clamp(t/1.4),3);
    const drift=Math.sin(t*.34)*.009;
    const slowMove=paused||reduced?0:Math.sin(t*.28)*.035;

    for(let i=0;i<rings.length;i++){
      const node=rings[i],layer=node.group;
      const spinClockwise=(i*.035 + p*(.12+i*.07) + twist*(i*.082));
      layer.rotation.z=-spinClockwise + drift*.3;
      layer.rotation.y=-.035 + twist*(i%2?-.17:.13);
      layer.rotation.x=twist*(i*.014)+(i%2?1:-1)*slowMove*.25;
      const squeeze=1-twist*(.13+.02*i);
      const sc=node.baseScale*squeeze*(1+.028*Math.sin(t*.23+i*.62));
      layer.scale.set(sc,sc,sc);
      layer.position.z=-i*.72 - twist*(i*.13) - p*.32;
      if(i===0)node.frontMat.opacity=clamp(1-fracture*.94);
    }

    fracturePieces.forEach((part,i)=>{
      const {mesh,base,material}=part;
      const directionX=(i===1?1:i===3?-1:i===0?.28:-.28);
      const directionY=(i===0?1:i===2?-1:i===1?.18:-.18);
      mesh.position.set(
        base[0]+fracture*directionX*.64,
        base[1]+fracture*directionY*.59,
        .35 + fracture*(i%2===0?1.25:-.95)
      );
      mesh.rotation.z=base[2]+fracture*(i%2===0?-.23:.23);
      mesh.rotation.y=fracture*(i%2===0?.21:-.22);
      material.opacity=clamp(fracture*1.9);
      mesh.visible=fracture>.008;
    });
    const cx=2.25;
    const aimX=cx*travel;
    camera.position.set(
      cx*travel+pointerX*.06*(1-travel),
      -.05+pointerY*.05*(1-travel)+Math.sin(t*.32)*.018,
      10.6-travel*17.5 - (1-introEase)*.7
    );
    camera.lookAt(aimX,0,-13);
    camera.rotateZ(-travel*.105 - twist*.014);
    portal.rotation.y=-.05+pointerX*.042*(1-travel)+twist*.045;
    portal.rotation.x=pointerY*.026*(1-travel);
    portal.position.x=cx;
    const sweep=t*.34+p*7;
    lights.sweep.position.set(2.0+Math.sin(sweep)*4,1.5+Math.cos(sweep*.74)*2.5,6-p*3);
    lights.sweep.intensity=35+twist*22+fracture*15;
    lights.key.position.x=3.5+pointerX*.7+Math.sin(sweep*.3)*1.1;
    lights.core.opacity=.5+fracture*.26+travel*.25;
    if(animObjects.wordMat){
      animObjects.wordMat.opacity=.67*range(p,.31,.48)*(1-range(p,.91,.98));
    }
    renderer.toneMappingExposure=1.13+range(p,.80,.96)*.24;
  }

  function resize(){
    if(!webglReady||!renderer||!camera)return;
    const rect=stage.getBoundingClientRect();
    const width=Math.max(1,Math.round(rect.width));
    const height=Math.max(1,Math.round(rect.height));
    const low=params.get('quality')==='low';
    const maxDpr=low?1:innerWidth<700?1.25:1.5;
    const pixels=Math.min(devicePixelRatio||1,maxDpr,Math.sqrt(2500000/(width*height)));
    renderer.setPixelRatio(Math.max(.65,pixels));
    renderer.setSize(width,height,false);
    camera.aspect=width/height;
    camera.fov=innerWidth<700?51:42;
    camera.updateProjectionMatrix();
    // Bring the portal up and nearer the center on mobile to keep text clear.
    if(portal)portal.position.y=innerWidth<700?1.58:0.03;
    if(portal)portal.scale.setScalar(innerWidth<700?.69:1);
  }

  function frame(now){
    raf=0;
    if(disposed||document.hidden||!inView)return;
    const dt=lastFrame?Math.min(60,now-lastFrame):16;
    if(lastFrame&&dt>0&&dt<85){
      frameIntervals.push(dt);if(frameIntervals.length>180)frameIntervals.shift();
    }
    lastFrame=now;
    if(!paused&&!reduced)elapsed+=dt;
    pointerX+=(targetX-pointerX)*.075;
    pointerY+=(targetY-pointerY)*.075;
    const p=reduced?0:progress;
    const entry=reduced||paused?1:1-Math.pow(1-clamp(elapsed/1300),3);
    updateText(p,entry);
    if(webglReady){
      animate3D(p,reduced?0:elapsed/1000);
      renderer.render(scene,camera);
      renderedFrames++;
    }
    if(!paused&&!reduced)schedule();
  }

  function schedule(){
    if(disposed||raf||!inView||document.hidden)return;
    raf=requestAnimationFrame(frame);
  }

  function onScroll(){readProgress();schedule();}
  function onResize(){readProgress();resize();schedule();}
  function onPointer(e){
    if(paused||reduced||e.pointerType==='touch')return;
    targetX=clamp(e.clientX/innerWidth*2-1,-1,1);
    targetY=clamp(e.clientY/innerHeight*2-1,-1,1);
  }

  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onResize,{passive:true});
  stage.addEventListener('pointermove',onPointer,{passive:true});
  stage.addEventListener('pointerleave',()=>{targetX=0;targetY=0;});
  motionButton?.addEventListener('click',()=>{
    if(reduced)return;
    paused=!paused;syncButton();lastFrame=0;schedule();
  });
  function onMedia(e){
    reduced=e.matches;
    paused=reduced||motionDisabledByUrl;
    syncButton();lastFrame=0;schedule();
  }
  if(motionPref.addEventListener)motionPref.addEventListener('change',onMedia);
  else motionPref.addListener(onMedia);

  stage.querySelectorAll('.hero-action').forEach(el=>{
    el.addEventListener('pointermove',e=>{
      if(reduced||paused||e.pointerType==='touch')return;
      const r=el.getBoundingClientRect();
      const x=clamp((e.clientX-r.left-r.width*.5)*.09,-6,6);
      const y=clamp((e.clientY-r.top-r.height*.5)*.13,-4,4);
      el.style.transform='translate3d('+x+'px,'+y+'px,0)';
    });
    el.addEventListener('pointerleave',()=>el.style.transform='');
  });

  if('IntersectionObserver' in window){
    new IntersectionObserver(entries=>{
      inView=entries[0].isIntersecting;
      if(inView){lastFrame=0;schedule();}
      else{cancelAnimationFrame(raf);raf=0;}
    },{threshold:0}).observe(stage);
  }
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){cancelAnimationFrame(raf);raf=0;}
    else {lastFrame=0;schedule();}
  });

  window.__riftDirector={
    getState:()=>({webglReady,reduced,paused,scroll:progress,elapsedMs:elapsed,renderedFrames}),
    getFrameStats:()=>{
      const a=[...frameIntervals].sort((x,y)=>x-y),mid=a.length? a[Math.floor(a.length/2)]:null;
      return {count:a.length,medianRafMs:mid,p95RafMs:a.length?a[Math.ceil(a.length*.95)-1]:null,
        approximateRafFps:mid?1000/mid:null,
        note:'RAF delivery timing only, not GPU timing; device testing must be done separately'};
    }
  };

  prepareProjects();
  readProgress();
  updateText(0,1);
  try{
    // Import only when a browser can render a real WebGL environment.
    const THREE=await loadThree();
    if(disposed)return;
    animObjects.THREE=THREE;
    Object.assign(animObjects,buildScene(THREE));
    webglReady=true;
    resize();
    // First successful frame before retiring the approved CSS fallback.
    animate3D(reduced?0:progress,0);
    renderer.render(scene,camera);
    html.classList.add('webgl-ready');
    if(readout)readout.textContent='LIVE THREE.JS / PHYSICAL MATERIALS';
  }catch(error){
    if(readout)readout.textContent='CSS FALLBACK / WEBGL UNAVAILABLE';
    console.warn('Rift Director Cut: 3D layer unavailable; retaining approved CSS design.',error);
  }
  schedule();

  function dispose(){
    disposed=true;cancelAnimationFrame(raf);
    if(renderer){
      for(const g of geometries)g.dispose();
      for(const m of materials)m.dispose();
      for(const t of textures)t.dispose();
      if(envRenderTarget)envRenderTarget.dispose();
      renderer.dispose();
      renderer=null;
    }
  }
  window.addEventListener('pagehide',dispose,{once:true});
})();