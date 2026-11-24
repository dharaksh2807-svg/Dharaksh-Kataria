/* Event-driven input accents. Existing controls retain ownership of gestures. */
(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const urlMotionOff = new URLSearchParams(location.search).get('motion') === 'off';
  const excluded = '.intro,#nameOpening,#journeySticky,#universe,#dimensions,#signalStage,canvas,#kioGuide,.project-xray,dialog,[role="dialog"],input,textarea,select,[contenteditable],summary,iframe,video,audio';
  const controls = 'a[href],button,[role="button"],.project-visual';
  const existingPulse = '.hero-action,.rift-mode,.filter-button,.project-case-open,.nav-availability,.copy-button';
  const modal = 'dialog[open],#caseOverlay:not([hidden]),#commandPalette:not([hidden]),#mobileMenu:not([hidden])';
  const cursor = document.createElement('div');
  cursor.className = 'signature-pointer';
  cursor.setAttribute('aria-hidden', 'true');
  cursor.hidden = true;
  const ring = document.createElement('span');
  ring.className = 'signature-pointer-ring';
  const position = document.createElement('span');
  position.className = 'signature-pointer-position';
  const label = document.createElement('span');
  label.className = 'signature-pointer-label';
  ring.append(label);
  position.append(ring);
  cursor.append(position);
  document.body.append(cursor);

  // These surfaces move only a decorative inset or rule, preserving hitboxes.
  const surfaces = new Map();
  document.querySelectorAll('#about .button-light,.contact-resume,#allProjectsButton,#about .about-social,.contact-links .email-link').forEach(node => {
    const accent = document.createElement('span');
    accent.className = 'signature-accent';
    accent.setAttribute('aria-hidden', 'true');
    node.classList.add('signature-surface');
    node.classList.toggle('signature-directional', node.matches('.about-social,.email-link'));
    node.append(accent);
    surfaces.set(node, accent);
  });
  const circle = document.querySelector('#about .about-circle');
  circle?.classList.add('signature-scroll-accent');
  let circleVisible = false;
  if (circle) new IntersectionObserver(entries => {
    circleVisible = entries[0].isIntersecting;
    if (!circleVisible) resetDrift();
  }).observe(circle.closest('.about-visual'));

  let frame = 0;
  let renders = 0;
  let x = 0;
  let y = 0;
  let mouse = false;
  let target = null;
  let surface = null;
  let bounds = null;
  let press = null;
  let tap = null;
  let tapAnimation = null;
  let ringAnimation = null;
  let driftTimer = 0;
  let scrollTimer = 0;
  let previousScroll = scrollY;
  let previousTime = performance.now();
  const disabled = () => urlMotionOff || reduced.matches || root.classList.contains('motion-off') || window.portfolioMotion?.disabled;
  const blocked = () => disabled() || root.matches('.hero-exit-active,.name-intro-active,.name-hero-pending') || !!document.querySelector(modal);
  const eligible = node => node instanceof Element && !node.closest(excluded) && !node.closest('[inert],[aria-disabled="true"],:disabled');

  function resetSurface() {
    surface?.classList.remove('signature-hover');
    surface?.style.removeProperty('--signature-x');
    surface?.style.removeProperty('--signature-y');
    surface = null;
    bounds = null;
  }
  function cancelTap() {
    tapAnimation?.cancel();
    tapAnimation = null;
    tap?.remove();
    tap = null;
    press = null;
  }
  function resetDrift() {
    clearTimeout(driftTimer);
    circle?.style.removeProperty('--signature-drift');
  }
  function reset() {
    clearTimeout(scrollTimer);
    cursor.hidden = true;
    ringAnimation?.cancel();
    cancelTap();
    resetSurface();
    resetDrift();
    target = null;
    mouse = false;
    cancelAnimationFrame(frame);
    frame = 0;
  }
  function render() {
    frame = 0;
    renders++;
    const selection = getSelection();
    if (blocked() || !mouse || !eligible(target) || (selection && !selection.isCollapsed)) {
      cursor.hidden = true;
      resetSurface();
      return;
    }
    const control = target.closest(controls);
    const rail = target.closest('.timeline-rail');
    const draggable = rail && rail.scrollWidth > rail.clientWidth;
    // Keep the native I-beam and text selection free of a decorative ring.
    const text = !control && !draggable && target.closest('p,h1,h2,h3,h4,li,dt,dd,span');
    cursor.hidden = !!text;
    if (text) return;
    position.style.transform = `translate3d(${x}px,${y}px,0)`;
    const mode = control?.matches('.project-visual') ? 'view' : draggable && !control ? 'drag' : control ? 'control' : 'point';
    cursor.dataset.mode = mode;
    label.textContent = mode === 'view' ? 'VIEW' : mode === 'drag' ? 'DRAG' : '';
    if (surface && bounds) {
      const dx = Math.max(-1, Math.min(1, (x - bounds.left) / bounds.width * 2 - 1));
      const dy = Math.max(-1, Math.min(1, (y - bounds.top) / bounds.height * 2 - 1));
      surface.style.setProperty('--signature-x', `${dx * 3}px`);
      surface.style.setProperty('--signature-y', `${dy * 2}px`);
      surface.classList.add('signature-hover');
    }
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(render);
  }
  function move(event) {
    clearTimeout(scrollTimer);
    if (press && (event.pointerId !== press.id || Math.hypot(event.clientX - press.x, event.clientY - press.y) > 8)) cancelTap();
    // Actual pointer type handles a mouse attached to a primarily touch device.
    // Touch compatibility MouseEvents never enter these PointerEvent handlers.
    mouse = event.pointerType === 'mouse';
    target = event.target;
    x = event.clientX;
    y = event.clientY;
    if (!mouse || blocked() || !eligible(target) || event.buttons && !target.closest('.timeline-rail')) {
      cursor.hidden = true;
      resetSurface();
      return;
    }
    const next = eligible(target) ? target.closest('.signature-surface') : null;
    if (next !== surface) {
      resetSurface();
      if (surfaces.has(next)) { surface = next; bounds = next.getBoundingClientRect(); }
    }
    schedule();
  }
  document.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('pointerover', move, { passive: true });
  document.addEventListener('pointerdown', event => {
    cancelTap();
    if (event.pointerType !== 'mouse') { mouse = false; cursor.hidden = true; resetSurface(); }
    if (blocked() || event.button !== 0 || !event.isPrimary || !eligible(event.target)) return;
    if (event.pointerType === 'mouse') {
      if (!event.target.closest(controls + ',.timeline-rail')) { cursor.hidden = true; return; }
      ringAnimation?.cancel();
      ringAnimation = ring.animate([{ scale: 1 }, { scale: .82 }], { duration: 100, fill: 'forwards' });
      return;
    }
    const control = event.target.closest(controls);
    if (!control || control.matches(existingPulse)) return;
    press = { id: event.pointerId, x: event.clientX, y: event.clientY };
    tap = document.createElement('span');
    tap.className = 'signature-tap';
    tap.setAttribute('aria-hidden', 'true');
    tap.style.left = `${event.clientX}px`;
    tap.style.top = `${event.clientY}px`;
    document.body.append(tap);
  }, { passive: true });
  document.addEventListener('pointerup', event => {
    if (event.pointerType === 'mouse') {
      ringAnimation?.cancel();
      if (!blocked()) ringAnimation = ring.animate([{ scale: .82 }, { scale: 1 }], { duration: 220, easing: 'cubic-bezier(.2,.7,.2,1)' });
    }
    if (!press || event.pointerId !== press.id || !tap) return;
    const node = tap;
    press = null;
    tapAnimation = node.animate([{ opacity: .5, scale: .8 }, { opacity: 0, scale: 1.35 }], { duration: 320, easing: 'ease-out' });
    tapAnimation.finished.then(() => { if (tap === node) cancelTap(); }, () => {});
  }, { passive: true });
  document.addEventListener('pointercancel', reset, { passive: true });
  document.addEventListener('selectstart', reset);
  document.addEventListener('keydown', reset);
  document.addEventListener('focusin', () => {
    if (blocked()) reset();
    else if (!mouse) { cursor.hidden = true; resetSurface(); }
  });
  document.addEventListener('pointerout', event => { if (!event.relatedTarget) reset(); }, { passive: true });
  window.addEventListener('blur', reset);
  window.addEventListener('pagehide', reset);
  window.addEventListener('resize', reset, { passive: true });
  document.addEventListener('visibilitychange', reset);
  document.addEventListener('portfolio:motion', reset);
  reduced.addEventListener('change', reset);
  window.addEventListener('scroll', () => {
    cancelTap();
    cancelAnimationFrame(frame);
    frame = 0;
    cursor.hidden = true;
    resetSurface();
    clearTimeout(scrollTimer);
    if (mouse && !blocked()) scrollTimer = setTimeout(() => {
      target = document.elementFromPoint(x, y);
      if (!eligible(target)) return;
      const next = eligible(target) ? target.closest('.signature-surface') : null;
      if (surfaces.has(next)) { surface = next; bounds = next.getBoundingClientRect(); }
      schedule();
    }, 120);
    const now = performance.now();
    const velocity = (scrollY - previousScroll) / Math.max(16, now - previousTime);
    previousScroll = scrollY;
    previousTime = now;
    if (!circleVisible || blocked() || !mouse) { resetDrift(); return; }
    circle.style.setProperty('--signature-drift', `${Math.max(-3, Math.min(3, velocity * 1.5))}px`);
    clearTimeout(driftTimer);
    driftTimer = setTimeout(resetDrift, 120);
  }, { passive: true });
  const observer = new MutationObserver(() => { if (blocked()) reset(); });
  observer.observe(root, { attributes: true, attributeFilter: ['class'] });
  document.querySelectorAll('dialog,#caseOverlay,#commandPalette,#mobileMenu').forEach(node => {
    observer.observe(node, { attributes: true, attributeFilter: ['hidden', 'open'] });
  });
  window.__portfolioInteractions = {
    getState: () => ({ renders, visible: !cursor.hidden, tap: !!tap, pressed: !!press, mode: cursor.dataset.mode, pending: !!frame }),
  };
})();
