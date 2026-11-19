/* Incremental enhancements for the existing V8 case studies.
   Read-only explanations: no fabricated application or benchmark behavior. */
(() => {
  "use strict";
  const main = document.getElementById("cpMain");
  const project = document.body.dataset.caseId;
  if (!main || !project) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const add = (parent, tag, cls, text) => {
    const node = el(tag, cls, text);
    parent.append(node);
    return node;
  };

  // Optional enhancement; original sections and anchor navigation remain intact.
  function chapters() {
    const defs = [
      [".cp-hero", "Overview"],
      [".cp-intro", "Challenge"],
      [".cp-engineering", "Architecture"],
      [".cp-function", "Systems"],
      [".cp-decisions", "Trade-offs"],
      [".cp-media", "Evidence gallery"],
      [".cp-results", "Results"]
    ];
    const sections = defs.map(([query, label]) => {
      const node = main.querySelector(query);
      if (!node) return null;
      if (!node.id) node.id = "cp-chapter-" + query.slice(1);
      return {node, label};
    }).filter(Boolean);
    if (sections.length < 3) return;
    const nav = el("nav", "cp-chapters");
    nav.setAttribute("aria-label", "Case study chapters");
    const inner = add(nav, "div", "cp-chapters-inner");
    add(inner, "span", "cp-chapters-kicker", "READING / " + project.toUpperCase());
    const scroller = add(inner, "div", "cp-chapters-links");
    const links = sections.map(({node,label}, i) => {
      const link = add(scroller, "a", "cp-chapters-link", (i + 1).toString().padStart(2, "0") + "  " + label);
      link.href = "#" + node.id;
      return link;
    });
    const track = add(nav, "div", "cp-chapters-track");
    const progress = add(track, "span", "cp-chapters-progress");
    track.setAttribute("aria-hidden","true");
    main.querySelector(".cp-hero").insertAdjacentElement("afterend",nav);
    let frame = 0;
    function update() {
      frame = 0;
      const y = 122;
      let active = 0;
      sections.forEach((part, index) => {
        if (part.node.getBoundingClientRect().top <= y) active = index;
      });
      links.forEach((link,index) => {
        const on = index === active;
        link.classList.toggle("is-current",on);
        if(on) link.setAttribute("aria-current","location");
        else link.removeAttribute("aria-current");
      });
      const scrollMax = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      progress.style.width = Math.min(100, Math.max(0, scrollY / scrollMax * 100)).toFixed(1) + "%";
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    addEventListener("scroll", schedule, {passive:true});
    addEventListener("resize", schedule);
    addEventListener("pageshow", schedule);
    schedule();
  }

  // Node details describe the documented systems. These are not live topology probes.
  const architectures = {
    srmedu: {
      title: "Explore the study platform architecture",
      summary: "Documented components and their responsibilities. Paths are illustrative; exact production network topology is not asserted.",
      nodes: [
        {id:"ui", name:"Study interface", group:"Client", role:"Subject catalogue, PYQ tools, practice and academic workflows.", connects:["pwa","auth","docs","ai"]},
        {id:"pwa", name:"Offline / PWA layer", group:"Client", role:"Service-worker caching provides an offline-first path for eligible study resources; online tools still require connectivity.", connects:["ui"]},
        {id:"auth", name:"Firebase authentication", group:"Identity", role:"Handles account and sign-in workflows for features that use cloud progress.", connects:["store"]},
        {id:"store", name:"Cloud Firestore", group:"Data", role:"Supports account-linked study progress and synchronization as documented by the project.", connects:["auth"]},
        {id:"docs", name:"Study documents", group:"Content", role:"Cloud document access makes notes and subject resources available through the platform.", connects:["ui"]},
        {id:"ai", name:"AI study assistance", group:"External provider", role:"Subject-aware tutor integrates supported model providers. Provider availability and key handling may vary by feature.", connects:["ui"]}
      ]
    },
    projectmatch: {
      title: "Explore the collaboration architecture",
      summary: "A conceptual dependency map grounded in the documented Next.js, authentication, matching and database stack.",
      nodes: [
        {id:"web", name:"Next.js / React UI", group:"Client", role:"Presents projects, skill profiles, role applications and messaging.", connects:["auth","match","api"]},
        {id:"auth", name:"NextAuth", group:"Identity", role:"Supports authenticated account/session flows for relevant collaboration features.", connects:["api"]},
        {id:"match", name:"Matching logic", group:"Application", role:"Weighted compatibility logic considers documented skill, experience and availability dimensions.", connects:["api"]},
        {id:"api", name:"Server/application routes", group:"Application", role:"Application-side flows coordinate recruitment, messages, AI provider calls and persistence.", connects:["orm","llm"]},
        {id:"orm", name:"Prisma ORM", group:"Data access", role:"Models relational entities for the documented project, recruitment, messaging and reputation features.", connects:["db"]},
        {id:"db", name:"PostgreSQL", group:"Database", role:"The project source documents 28 Prisma model declarations; this is not a claim of 28 deployed services.", connects:["orm"]},
        {id:"llm", name:"AI provider integrations", group:"External", role:"Documented configurable Gemini and Claude assistance. Provider keys and access are subject to project configuration.", connects:["api"]}
      ]
    }
  };
  function architectureExplorer() {
    const data = architectures[project];
    const target = main.querySelector(".cp-architecture-figure");
    if (!data || !target) return;
    const section = el("section", "cp-live-explorer");
    section.setAttribute("aria-label", data.title);
    add(section, "span", "cp-explorer-kicker", "INTERACTIVE / COMPONENT EXPLORER");
    add(section, "h3", "", data.title);
    add(section, "p", "cp-explorer-caption", data.summary);
    const nodes = add(section,"div","cp-explorer-nodes");
    const info = add(section,"div","cp-explorer-inspector");
    info.setAttribute("aria-live","polite");
    const infoType = add(info,"span","cp-explorer-type");
    const infoTitle = add(info,"h4");
    const infoBody = add(info,"p");
    const infoLinks = add(info,"p","cp-explorer-relationships");
    const buttons = data.nodes.map((item,index)=>{
      const b=add(nodes,"button","cp-explorer-node");
      b.type="button"; b.setAttribute("aria-pressed","false");
      add(b,"span","cp-explorer-number",String(index+1).padStart(2,"0"));
      add(b,"strong","",item.name);
      add(b,"small","",item.group);
      b.addEventListener("click",()=>select(item.id));
      return {b,item};
    });
    function select(id) {
      const selected = data.nodes.find(n=>n.id===id);
      if(!selected)return;
      buttons.forEach(({b,item})=>{
        b.setAttribute("aria-pressed",String(item.id===id));
        b.classList.toggle("is-linked",selected.connects.includes(item.id));
      });
      infoType.textContent=selected.group.toUpperCase();
      infoTitle.textContent=selected.name;
      infoBody.textContent=selected.role;
      const links=selected.connects.map(x=>data.nodes.find(n=>n.id===x)?.name).filter(Boolean);
      infoLinks.textContent=links.length ? "Documented relationships: "+links.join(" · ") : "No additional path asserted.";
    }
    select(data.nodes[0].id);
    target.insertAdjacentElement("afterend", section);
  }

  function benchmarkExplorer() {
    if(project!=="kv")return;
    const host=main.querySelector(".cp-metrics");
    if(!host)return;
    // A single corrected, reported held-out 60-question evaluation; NO interpolation.
    const metrics={
      memory:{title:"Retained KV memory",unit:"MiB",values:[42.53,7.11],max:42.53,precision:2,note:"83.3% lower retained KV memory in this reported experiment; not an equivalent peak-RAM claim."},
      recall:{title:"Held-out recall",unit:"%",values:[83.3,80.0],max:100,precision:1,note:"83.3% full-cache versus 80.0% compressed: a 3.3 percentage-point decrease on 60 questions."}
    };
    const panel=el("section","cp-benchmark");
    panel.setAttribute("aria-label","Interactive corrected KV-cache result comparison");
    add(panel,"span","cp-explorer-kicker","RESEARCH / MEASURED COMPARISON");
    add(panel,"h3","","Explore the retained-memory trade-off");
    add(panel,"p","cp-explorer-caption","One reported corrected held-out experiment, 60 questions, 260-token retained budget. No invented budget sweep or latency data.");
    const modes=add(panel,"div","cp-benchmark-modes");
    modes.setAttribute("role","group");modes.setAttribute("aria-label","Choose benchmark metric");
    const grid=add(panel,"div","cp-benchmark-bars");
    const bars=[0,1].map((_,i)=>{
      const row=add(grid,"div","cp-benchmark-row");
      const head=add(row,"div","cp-benchmark-head");
      add(head,"span","",i===0?"Full cache / baseline":"Compressed / reported");
      const value=add(head,"strong");
      const track=add(row,"div","cp-benchmark-track");
      const bar=add(track,"span",i===0?"cp-benchmark-bar baseline":"cp-benchmark-bar compressed");
      return {value,bar};
    });
    const foot=add(panel,"p","cp-benchmark-note");
    const reference=add(panel,"a","cp-benchmark-source","Research repository & methodology ↗");
    reference.href="https://github.com/dharaksh2807-svg/iitB";
    reference.target="_blank";reference.rel="noopener noreferrer";
    const buttons=Object.keys(metrics).map(key=>{
      const b=add(modes,"button","cp-benchmark-mode",key==="memory"?"Retained KV (MiB)":"Recall (%)");
      b.type="button";
      b.addEventListener("click",()=>render(key));
      return {b,key};
    });
    function render(key){
      const m=metrics[key];
      buttons.forEach(x=>x.b.setAttribute("aria-pressed",String(x.key===key)));
      bars.forEach((b,i)=>{
        b.value.textContent=m.values[i].toFixed(m.precision)+" "+m.unit;
        const amount=Math.min(100,100*m.values[i]/m.max);
        b.bar.style.width=amount.toFixed(2)+"%";
        b.bar.setAttribute("aria-label",(i===0?"Full cache ":"Compressed ")+b.value.textContent);
      });
      foot.textContent=m.note+" Values are project-reported, not independently reproduced by this portfolio.";
    }
    render("memory");
    host.insertAdjacentElement("beforebegin",panel);
  }

  // Mount real development artifacts only when explicitly supplied and reviewed.
  function processGallery() {
    const items=window.V8_PROCESS_MEDIA?.[project];
    if(!Array.isArray(items)||!items.length)return;
    const target=main.querySelector(".cp-decisions .cp-prose");
    if(!target)return;
    const section=add(target,"section","cp-process");
    add(section,"h3","","Inside the build / documented iterations");
    const gallery=add(section,"div","cp-process-gallery");
    items.filter(item=>item?.approved===true && typeof item.file==="string" && /^[-a-z0-9_/]+\.(webp|png|jpe?g)$/i.test(item.file) && typeof item.caption==="string").forEach(item=>{
      const figure=add(gallery,"figure","cp-process-item");
      const pic=add(figure,"img");
      pic.loading="lazy";pic.decoding="async";pic.src="../assets/media/"+item.file;
      pic.alt=item.alt||item.caption;
      add(figure,"figcaption","",item.caption);
    });
    if(!gallery.children.length)section.remove();
  }
  chapters();
  architectureExplorer();
  benchmarkExplorer();
  processGallery();
})();