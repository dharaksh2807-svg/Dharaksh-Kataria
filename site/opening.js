/* Reversible handoff between the live Rift and the permanent homepage hero. */
(() => {
  'use strict';
  const root = document.documentElement;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const params = new URLSearchParams(location.search);
  const sessionKey = 'dk-name-handoff-seen';
  let seen = false;
  let active = false;
  let ready = false;
  try { seen = sessionStorage.getItem(sessionKey) === 'true'; } catch {}
  if (params.get('intro') === 'replay') seen = false;
  const historyEntry = performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
  const directEntry = Boolean(location.hash) || historyEntry;
  const motionDisabled = () => preference.matches || root.classList.contains('motion-off') || params.get('motion') === 'off';
  root.classList.add('name-hero-pending');

  function finish() {
    const wasActive = active;
    active = false;
    root.classList.remove('name-intro-active');
    if (wasActive) document.dispatchEvent(new Event('portfolio:name-end'));
  }
  function reveal(animate) {
    const hero = document.getElementById('nameOpening');
    if (!hero) return false;
    if (ready) { finish(); return false; }
    // Read the reserved hero position before retiring the completed prelude.
    // Adjust in this same frame so neither the hero nor later anchors jump.
    const previousScroll = scrollY;
    const previousHeroTop = previousScroll + hero.getBoundingClientRect().top;
    const retiringFocus = document.querySelector('.rift-home > .intro')?.contains(document.activeElement) ||
      document.activeElement === document.getElementById('nameOpeningSkip') ||
      document.activeElement === document.getElementById('riftReturnToHero');
    ready = true;
    active = animate && !motionDisabled();
    root.classList.add('name-hero-ready');
    root.classList.remove('name-hero-pending');
    root.classList.toggle('name-intro-active', active);
    hero.inert = false;
    hero.removeAttribute('aria-hidden');
    document.getElementById('nameOpeningSkip').hidden = true;
    document.getElementById('riftReturnToHero').hidden = true;
    scrollTo({ top: Math.max(0, previousScroll - previousHeroTop), behavior: 'instant' });
    if (retiringFocus) document.getElementById('nameHeroTitle').focus({ preventScroll: true });
    seen = true;
    try { sessionStorage.setItem(sessionKey, 'true'); } catch {}
    return true;
  }
  function play() {
    if (ready || !document.querySelector('.rift-stage.rift-complete')) return false;
    return reveal(!seen);
  }
  function skip() { reveal(false); }
  function returnToRift({ progress = 0, focus = true } = {}) {
    if (!ready) return false;
    finish();
    ready = false;
    root.classList.add('name-hero-pending');
    root.classList.remove('name-hero-ready');
    const hero = document.getElementById('nameOpening');
    hero.inert = true;
    hero.setAttribute('aria-hidden', 'true');
    document.getElementById('nameOpeningSkip').hidden = false;
    document.getElementById('riftReturnToHero').hidden = false;
    document.dispatchEvent(new CustomEvent('portfolio:rift-return', { detail: { progress, focus } }));
    return true;
  }
  let reverseDistance = 0;
  let lastReverseInput = 0;
  let touchOrigin = null;
  const pageGesture = event => !event.target.closest?.('input,textarea,select,[contenteditable],#kioGuide,[role="dialog"]');
  // Only an outward gesture at the page's top boundary enters the prelude.
  // Native scrolling stays unblocked everywhere, including nested controls.
  window.addEventListener('wheel', event => {
    if (!ready || scrollY > 1 || event.deltaY >= 0 || event.ctrlKey || !pageGesture(event)) {
      reverseDistance = 0;
      return;
    }
    const now = performance.now();
    if (now - lastReverseInput > 300) reverseDistance = 0;
    lastReverseInput = now;
    reverseDistance -= event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    if (reverseDistance >= 48) {
      reverseDistance = 0;
      returnToRift({ progress: .86, focus: false });
    }
  }, { passive: true });
  window.addEventListener('touchstart', event => {
    touchOrigin = ready && scrollY <= 1 && event.touches.length === 1 && pageGesture(event) ? event.touches[0].clientY : null;
  }, { passive: true });
  window.addEventListener('touchmove', event => {
    if (touchOrigin !== null && ready && scrollY <= 1 && event.touches.length === 1 && event.touches[0].clientY - touchOrigin > 48) {
      touchOrigin = null;
      returnToRift({ progress: .86, focus: false });
    }
  }, { passive: true });
  document.addEventListener('DOMContentLoaded', () => {
    const hero = document.getElementById('nameOpening');
    if (directEntry || motionDisabled()) reveal(false);
    else {
      hero.inert = true;
      hero.setAttribute('aria-hidden', 'true');
      document.getElementById('nameOpeningSkip').hidden = false;
    }
    document.getElementById('nameBackToRift').addEventListener('click', () => returnToRift());
    hero.addEventListener('animationend', event => {
      if (event.animationName === 'name-opening-light') finish();
    });
  }, { once: true });
  // Interrupting an entrance settles the typography, never removes the hero.
  window.addEventListener('pagehide', finish);
  window.addEventListener('pageshow', async event => {
    if (event.persisted || historyEntry || !location.hash) return;
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    let interrupted = false;
    const interrupt = () => { interrupted = true; };
    const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
    inputs.forEach(type => window.addEventListener(type, interrupt, { passive: true, once: true }));
    await document.fonts.ready;
    requestAnimationFrame(() => {
      inputs.forEach(type => window.removeEventListener(type, interrupt));
      if (!interrupted) target.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
  }, { once: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finish(); });
  document.addEventListener('portfolio:motion', event => { if (event.detail?.muted) skip(); });
  preference.addEventListener('change', () => { if (preference.matches) skip(); });
  window.__portfolioOpening = {
    play, skip, returnToRift, cancel: finish,
    restart() {
      seen = false;
      try { sessionStorage.removeItem(sessionKey); } catch {}
      if (ready && !motionDisabled()) {
        finish();
        void document.getElementById('nameOpening').offsetWidth;
        active = true;
        root.classList.add('name-intro-active');
      }
    },
    get active() { return active; },
    get pending() { return !ready && !directEntry && !motionDisabled(); },
    get ready() { return ready; }
  };
})();
