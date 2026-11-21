/* Shared motion policy and choreography for portfolio and case-study routes. */
(() => {
  "use strict";
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let savedMuted = false,
    frame = 0;
  try {
    savedMuted = localStorage.getItem("dk-motion-muted") === "true";
  } catch {}
  const disabled = () =>
    reduced.matches || savedMuted || root.classList.contains("motion-off");
  function handleTransition(event) {
    const transition = event.viewTransition;
    if (!transition) return;
    // Browsers may skip a transition during Back or interrupted navigation.
    transition.ready.catch(() => {});
    transition.finished.catch(() => {});
    transition.updateCallbackDone.catch(() => {});
    if (disabled()) transition.skipTransition();
  }
  window.addEventListener("pagereveal", handleTransition);
  window.addEventListener("pageswap", handleTransition);
  function initialize() {
    function synchronize() {
      root.classList.toggle("motion-off", reduced.matches || savedMuted);
      root.classList.add("motion-ready");
      if (disabled()) {
        document.getAnimations().forEach((animation) => animation.cancel());
        document
          .querySelectorAll("[data-motion]")
          .forEach((node) => node.classList.add("motion-visible"));
      }
      schedule();
    }
    document.addEventListener("portfolio:motion", (event) => {
      savedMuted = event.detail?.preference ?? !!event.detail?.muted;
      try {
        localStorage.setItem("dk-motion-muted", String(savedMuted));
      } catch {}
      synchronize();
    });
    reduced.addEventListener("change", () => {
      synchronize();
      document.dispatchEvent(
        new CustomEvent("portfolio:motion", {
          detail: { muted: disabled(), preference: savedMuted },
        }),
      );
    });
    window.portfolioMotion = {
      get disabled() {
        return disabled();
      },
      navigate(url, id, focusClass = "project-case-open") {
        const card = document.querySelector(
          `[data-project="${CSS.escape(id)}"] .project-visual`,
        );
        if (card)
          try {
            sessionStorage.setItem("dk-return-project", id);
            sessionStorage.setItem("dk-return-work", JSON.stringify({
              filter: document.querySelector("#projectFilters .is-active")?.dataset.filter || "all",
              expanded: [...document.querySelectorAll(".project-decisions[open]")]
                .map(details => details.closest(".project-card").dataset.project),
              focusClass,
            }));
          } catch {}
        location.assign(url);
      },
    };
    const nodes = [
      ...document.querySelectorAll(
        ".reveal,.v8-reveal,[data-v4],.cp-section,.cp-media-head",
      ),
    ];
    nodes.forEach((node, index) => {
      node.classList.add("in-view", "v4-visible");
      node.dataset.motion =
        node.dataset.v4 || ["slide-left", "slide-right", "zoom"][index % 3];
    });
    const paths = [
      ...document.querySelectorAll(
        ".match-edges path,.cp-architecture-figure svg path",
      ),
    ];
    paths.forEach((path) => {
      const length = path.getTotalLength();
      path.classList.add("motion-path");
      path.style.setProperty("--path-length", length);
    });
    function update() {
      frame = 0;
      const active = !disabled() && !document.hidden;
      nodes.forEach((node) => {
        const box = node.getBoundingClientRect();
        // Only reset after the element has left the viewport completely.
        if (!active || (box.top < innerHeight * 0.94 && box.bottom > 0))
          node.classList.add("motion-visible");
        else if (box.top > innerHeight + 50 || box.bottom < -50)
          node.classList.remove("motion-visible");
      });
      paths.forEach((path) => {
        const box = path.getBoundingClientRect();
        const progress = active
          ? Math.max(
              0,
              Math.min(
                1,
                (innerHeight * 0.9 - box.top) / Math.max(1, innerHeight * 0.6),
              ),
            )
          : 1;
        path.style.setProperty("--path-progress", progress);
      });
      const hero = document.getElementById("heroArt");
      if (hero)
        hero.style.setProperty(
          "--cinema-depth",
          active ? Math.min(32, scrollY * 0.035) + "px" : "0px",
        );
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", schedule);
    const grid = document.getElementById("projectsGrid");
    grid?.addEventListener("focusin", (event) => {
      const card = event.target.closest(".project-card");
      if (card)
        document.dispatchEvent(
          new CustomEvent("portfolio:project-hover", {
            detail: { id: card.dataset.project },
          }),
        );
    });
    grid?.addEventListener("pointerover", (event) => {
      const card = event.target.closest(".project-card");
      // Browser pointerover can fire when keyboard focus scrolls a different
      // card underneath the stationary cursor. Preserve the focused card's
      // explanation until the user intentionally moves the pointer.
      const focusedCard = document.activeElement?.closest?.(".project-card");
      if (focusedCard && focusedCard !== card) return;
      if (card && !card.contains(event.relatedTarget))
        document.dispatchEvent(
          new CustomEvent("portfolio:project-hover", {
            detail: { id: card.dataset.project },
          }),
        );
    });
    window.addEventListener("pageshow", (event) => {
      document.body.classList.remove("v8-leaving");
      if(grid){
        const returning=event.persisted || performance.getEntriesByType("navigation")[0]?.type === "back_forward";
        let id, work;
        try {
          id=sessionStorage.getItem("dk-return-project");
          work=JSON.parse(sessionStorage.getItem("dk-return-work") || "null");
          sessionStorage.removeItem("dk-return-project");
          sessionStorage.removeItem("dk-return-work");
        } catch {}
        if(returning && id){
          if(work){
            document.querySelector(`#projectFilters [data-filter="${CSS.escape(work.filter || 'all')}"]`)?.click();
            document.querySelectorAll(".project-decisions").forEach(details=>{
              details.open=Array.isArray(work.expanded) && work.expanded.includes(details.closest(".project-card").dataset.project);
            });
          }
          const focusTargets=["project-case-open","project-evidence-link","project-visual"];
          const focusClass=focusTargets.includes(work?.focusClass)?work.focusClass:"project-case-open";
          document.querySelector(`[data-project="${CSS.escape(id)}"] .${focusClass}`)?.focus({preventScroll:true});
        }
      }
      schedule();
    });
    const caseTitle = document.querySelector(".cp-hero h1");
    if (caseTitle)
      caseTitle.style.setProperty(
        "--project-title-name",
        "project-title-" + document.body.dataset.caseId,
      );
    synchronize();
    if (caseTitle)
      document.dispatchEvent(
        new CustomEvent("portfolio:motion", {
          detail: { muted: disabled(), preference: savedMuted },
        }),
      );
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
