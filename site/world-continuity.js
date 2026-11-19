/* Preserve the explored district/camera when visiting and returning from a case study.
   Navigation remains ordinary links even if storage or this enhancement fails. */
(() => {
 "use strict";
 const world=window.portfolioWorld;
 if(!world?.restore)return;
 const KEY="dk-universe-return-v1";
 const worldArea=document.getElementById("worldShell");
 const worldLinks=document.getElementById("worldProjects");
 if(!worldArea)return;
 function save(event){
   const link=event.target.closest?.("a[href]");
   if(!link)return;
   if(!worldArea.contains(link)&&!worldLinks?.contains(link))return;
   let url;
   try{url=new URL(link.href,location.href)}catch{return}
   if(url.origin!==location.origin || !/\/projects\/(?:srmedu|projectmatch|kv|metro)\.html$/.test(url.pathname))return;
   const state=world.state;
   try{sessionStorage.setItem(KEY,JSON.stringify({at:Date.now(),route:url.pathname,selected:state.selected,objects:state.objects,camera:state.camera}));}catch{}
 }
 document.addEventListener("click",save,{capture:true});
 // On Back or the case-study's explicit 3D WORLD anchor, restore the selected
 // district and orientation, without interfering with unrelated homepage visits.
 function restore(){
   let payload;
   try{payload=JSON.parse(sessionStorage.getItem(KEY)||"null")}catch{return}
   if(!payload)return;
   const isBack=performance.getEntriesByType("navigation")[0]?.type==="back_forward";
   const isWorldReturn=location.hash==="#universe";
   if(!isBack && !isWorldReturn)return;
   if(Date.now()-payload.at>1800000){try{sessionStorage.removeItem(KEY)}catch{}return}
   const restored=world.restore(payload);
   if(restored){
     try{sessionStorage.removeItem(KEY)}catch{}
     if(isWorldReturn){
       const anchor=document.getElementById("universe");
       // Existing anchor navigation owns the scroll; do not force an animation.
       if(anchor && Math.abs(anchor.getBoundingClientRect().top)>innerHeight) anchor.scrollIntoView({behavior:"instant",block:"start"});
     }
     // Preserve the focus return behavior for users of the canvas controls.
     if(isBack && document.activeElement===document.body){
       document.getElementById("worldCanvasWrap")?.focus({preventScroll:true});
     }
   }
 }
 addEventListener("pageshow",restore);
 if(document.readyState==="complete")restore();
})();