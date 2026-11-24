/* Signature Break — a reversible, event-scheduled render of native scroll. */
(() => {
  'use strict';
  const root = document.documentElement;
  const hero = document.getElementById('nameOpening');
  const work = document.getElementById('work');
  if (!hero || !work) return;

  const surname = hero.querySelector('.name-opening-line:nth-child(2) > span');
  const period = hero.querySelector('.name-opening-period');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const short = matchMedia('(max-height:500px)');
  const urlMotionOff = new URLSearchParams(location.search).get('motion') === 'off';
  const art = document.createElement('div');
  art.className = 'hero-exit-art';
  art.setAttribute('aria-hidden', 'true');
  art.inert = true;
  art.hidden = true;
  const echo = document.createElement('div');
  echo.className = 'hero-exit-echo';
  echo.append(surname.cloneNode(true));
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('hero-exit-thread');
  const thread = document.createElementNS(svg.namespaceURI, 'path');
  thread.setAttribute('pathLength', '1');
  thread.style.strokeDasharray = '1';
  svg.append(thread);
  const blade = document.createElement('div');
  blade.className = 'hero-exit-blade';
  art.append(echo, svg, blade);
  hero.parentElement.append(art);

  const clamp = value => Math.max(0, Math.min(1, value));
  const smooth = value => { const x = clamp(value); return x * x * (3 - 2 * x); };
  const stage = (progress, from, to) => smooth((progress - from) / (to - from));
  const measureContext = document.createElement('canvas').getContext('2d');
  let geometry = null;
  let dirty = true;
  let frame = 0;
  let active = false;
  let progress = 0;
  let renders = 0;
  let measurements = 0;
  let navigation = Boolean(location.hash && !['#top', '#nameOpening'].includes(location.hash)) ||
    performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
  let enteredRift = window.__portfolioOpening?.pending;

  function clear() {
    root.classList.remove('hero-exit-active');
    art.hidden = true;
    if (!active) return;
    active = false;
    for (const property of [...hero.style]) {
      if (property.startsWith('--exit-')) hero.style.removeProperty(property);
    }
    for (const property of [...work.style]) {
      if (property.startsWith('--exit-')) work.style.removeProperty(property);
    }
  }

  function measure() {
    clear();
    const heroBox = hero.getBoundingClientRect();
    const workBox = work.getBoundingClientRect();
    const surnameBox = surname.getBoundingClientRect();
    const dot = period.getBoundingClientRect();
    const type = getComputedStyle(surname);
    const punctuation = getComputedStyle(period);
    for (const property of ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textTransform', 'textAlign']) {
      echo.style[property] = type[property];
    }
    echo.style.width = `${surnameBox.width}px`;
    echo.style.left = `${surnameBox.left}px`;
    echo.style.top = `${surnameBox.top - heroBox.top}px`;
    // Inline rectangles describe the font box. Canvas ink metrics locate the
    // actual period inside that box, including its italic side bearings.
    measureContext.font = `${punctuation.fontStyle} ${punctuation.fontWeight} ${punctuation.fontSize} ${punctuation.fontFamily}`;
    const ink = measureContext.measureText(period.textContent);
    const baseline = dot.top - heroBox.top +
      (dot.height - ink.fontBoundingBoxAscent - ink.fontBoundingBoxDescent) / 2 + ink.fontBoundingBoxAscent;
    const width = document.documentElement.clientWidth;
    const height = innerHeight;
    geometry = {
      start: scrollY + heroBox.top,
      end: scrollY + workBox.top,
      width, height,
      dotX: dot.left + (ink.actualBoundingBoxRight - ink.actualBoundingBoxLeft) / 2,
      dotY: baseline + (ink.actualBoundingBoxDescent - ink.actualBoundingBoxAscent) / 2,
      slant: Math.tan(24 * Math.PI / 180) * height / 2,
      bladeWidth: Math.max(28, Math.min(54, width * .038)),
    };
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    art.style.setProperty('--exit-blade-width', `${geometry.bladeWidth}px`);
    art.style.setProperty('--exit-blade-height', `${height / Math.cos(24 * Math.PI / 180) + width}px`);
    dirty = false;
    measurements++;
  }

  function allowed() {
    const opening = window.__portfolioOpening;
    const rift = window.__riftDirector?.getState();
    return opening?.ready && !opening.active && !navigation && !urlMotionOff &&
      !reduced.matches && !short.matches && !window.portfolioMotion?.disabled &&
      !root.matches('.motion-off,.rift-static,.name-intro-active') &&
      !rift?.contextLost && !(enteredRift && rift && !rift.webglReady);
  }

  function render(value) {
    progress = value;
    renders++;
    if (value <= 0 || value >= 1 || !allowed()) { clear(); return; }
    const { width, height, start, end, dotX, dotY, slant, bladeWidth } = geometry;
    active = true;
    root.classList.add('hero-exit-active');
    art.hidden = false;
    const firstX = -width * .21 * stage(value, 0, .66);
    const surnameX = width * .055 * stage(value, 0, .62);
    const bladeX = width + slant + bladeWidth -
      (width + 2 * slant + 2 * bladeWidth) * stage(value, .55, .90);
    const topX = bladeX + slant;
    const bottomX = bladeX - slant;
    hero.style.setProperty('--exit-pin', `${scrollY - start}px`);
    hero.style.setProperty('--exit-first-x', `${firstX}px`);
    hero.style.setProperty('--exit-surname-x', `${surnameX}px`);
    hero.style.setProperty('--exit-caption-alpha', 1 - stage(value, .12, .40));
    hero.style.setProperty('--exit-actions-pointer', value < .40 ? 'auto' : 'none');
    const ignition = stage(value, .30, .38) * (1 - stage(value, .53, .67));
    hero.style.setProperty('--exit-ignition', ignition > 0 ? `0 0 ${ignition * 14}px #efc58f,0 0 ${ignition * 2}px #fff0d0` : 'none');
    work.style.setProperty('--exit-work-y', `${scrollY - end}px`);
    work.style.setProperty('--exit-work-clip', `polygon(${topX}px 0,100% 0,100% 100%,0 100%,0 ${height}px,${bottomX}px ${height}px)`);
    const echoAlpha = .45 * stage(value, .18, .29) * (1 - stage(value, .38, .55));
    echo.style.opacity = echoAlpha;
    echo.style.transform = `translate3d(${surnameX - width * .016 * stage(value, .18, .55)}px,${height * .004 * stage(value, .18, .55)}px,0)`;
    const originX = dotX + surnameX;
    const targetY = height * .30;
    const targetX = bladeX + slant * (1 - 2 * targetY / height);
    thread.setAttribute('d', `M ${originX} ${dotY} C ${originX - width * .18} ${dotY - height * .035},${targetX - width * .28} ${targetY - height * .12},${targetX} ${targetY}`);
    thread.style.strokeDashoffset = 1 - stage(value, .30, .58);
    svg.style.opacity = stage(value, .30, .36) * (1 - stage(value, .58, .67));
    blade.style.setProperty('--exit-blade-x', `${bladeX}px`);
    blade.style.opacity = stage(value, .53, .57) * (1 - stage(value, .89, .93));
  }

  function update() {
    frame = 0;
    if (!window.__portfolioOpening?.ready) { clear(); return; }
    // A scroll during the existing entrance stays native. Only a subsequent
    // deliberate gesture can start the exit after that entrance has settled.
    if (window.__portfolioOpening.active) { navigation = true; clear(); return; }
    if (dirty || !geometry) measure();
    const value = clamp((scrollY - geometry.start) / Math.max(1, geometry.end - geometry.start));
    render(value);
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }
  function invalidate() { dirty = true; schedule(); }
  function bypass() { navigation = true; clear(); schedule(); }
  function resume(event) {
    if (event.type === 'keydown' && !['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) return;
    if (event.target.closest?.('input,textarea,select,[contenteditable],[role="dialog"],dialog,#kioGuide')) return;
    navigation = false;
    schedule();
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', invalidate, { passive: true });
  window.addEventListener('orientationchange', invalidate, { passive: true });
  window.addEventListener('pageshow', invalidate);
  window.addEventListener('pagehide', clear);
  window.addEventListener('hashchange', bypass);
  window.addEventListener('popstate', bypass);
  for (const type of ['wheel', 'touchstart', 'keydown']) window.addEventListener(type, resume, { passive: true });
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href^="#"]');
    if (link && !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) bypass();
  }, true);
  document.addEventListener('focusin', event => {
    if (active && (hero.contains(event.target) || work.contains(event.target))) bypass();
  });
  document.addEventListener('portfolio:name-end', invalidate);
  document.addEventListener('portfolio:rift-return', () => { enteredRift = true; clear(); invalidate(); });
  document.addEventListener('portfolio:motion', invalidate);
  reduced.addEventListener('change', invalidate);
  short.addEventListener('change', invalidate);
  // Opening owns its ready/intro classes. Observe them without changing its
  // lifecycle or requiring another event or a frame loop in the Rift renderer.
  let lifecycle = '';
  new MutationObserver(() => {
    const next = ['name-hero-ready', 'name-intro-active', 'motion-off', 'rift-static']
      .map(name => root.classList.contains(name)).join();
    if (next !== lifecycle) { lifecycle = next; invalidate(); }
  }).observe(root, { attributes: true, attributeFilter: ['class'] });
  new ResizeObserver(invalidate).observe(hero);
  document.fonts.ready.then(invalidate);
  document.fonts.addEventListener('loadingdone', invalidate);
  window.__portfolioHeroExit = {
    getState: () => ({ active, progress, renders, measurements, start: geometry?.start, end: geometry?.end, navigation }),
  };
  schedule();
})();
