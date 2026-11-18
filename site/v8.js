/* Shared motion policy and choreography for portfolio and case-study routes. */
(() => {
  "use strict";
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(hover:hover) and (pointer:fine)");
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
        document.querySelectorAll(".project-card").forEach(resetCard);
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
      navigate(url, id) {
        const card = document.querySelector(
          `[data-project="${CSS.escape(id)}"] .project-visual`,
        );
        if (card)
          try {
            sessionStorage.setItem("dk-return-project", id);
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
    function resetCard(card) {
      card.style.setProperty("--art-x", "0px");
      card.style.setProperty("--art-y", "0px");
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    }
    const grid = document.getElementById("projectsGrid");
    grid?.addEventListener(
      "pointermove",
      (event) => {
        if (disabled() || !fine.matches) return;
        const card = event.target.closest(".project-card");
        if (!card) return;
        const box = card.getBoundingClientRect(),
          x = (event.clientX - box.left) / box.width - 0.5,
          y = (event.clientY - box.top) / box.height - 0.5;
        card.style.setProperty("--tilt-x", -y * 3 + "deg");
        card.style.setProperty("--tilt-y", x * 3 + "deg");
        card.style.setProperty("--art-x", x * 7 + "px");
        card.style.setProperty("--art-y", y * 7 + "px");
      },
      { passive: true },
    );
    grid?.addEventListener("pointerout", (event) => {
      const card = event.target.closest(".project-card");
      if (card && !card.contains(event.relatedTarget)) resetCard(card);
    });
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
      if (card && !card.contains(event.relatedTarget))
        document.dispatchEvent(
          new CustomEvent("portfolio:project-hover", {
            detail: { id: card.dataset.project },
          }),
        );
    });
    window.addEventListener("pageshow", (event) => {
      document.body.classList.remove("v8-leaving");
      if (
        event.persisted ||
        performance.getEntriesByType("navigation")[0]?.type === "back_forward"
      ) {
        let id;
        try {
          id = sessionStorage.getItem("dk-return-project");
          sessionStorage.removeItem("dk-return-project");
        } catch {}
        if (id)
          document
            .querySelector(
              `[data-project="${CSS.escape(id)}"] .project-case-open`,
            )
            ?.focus({ preventScroll: true });
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
