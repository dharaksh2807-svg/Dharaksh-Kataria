/* Only registered, reviewed captures are rendered. Decorative art stays separate. */
(() => {
  'use strict';
  const mount = document.getElementById('cpCaptures');
  if (!mount) return;
  const id = document.body.dataset.caseId;
  const items = window.V8_MEDIA_MAP?.[id] || [];
  const status = document.getElementById('cpMediaStatus');
  const images = items.filter(item => item.type === 'image');
  const videos = items.filter(item => item.type === 'video');
  status.textContent = items.length
    ? 'Genuine public-interface captures. Each caption records the source and capture date. Authenticated workflows require approved owner media.'
    : 'Approved screenshots and demonstration video are pending owner delivery. The documented implementation and conceptual artwork are available above.';
  if (id === 'metro') status.textContent = 'Approved owner-recorded gameplay and screenshots are pending. Captures require review for private paths, credentials and source details before publication.';

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function mediaURL(file) {
    // All media stays in the reviewed local asset directory.
    return /^[a-zA-Z0-9_-]+\.(png|webp|jpe?g|mp4|webm|vtt)$/.test(file || '')
      ? '../assets/media/' + file : '';
  }
  function provenance(item, parent) {
    parent.append(element('p', 'cp-capture-caption', item.caption || item.alt));
    const meta = element('p', 'cp-capture-provenance', 'Captured ' + (item.captured || 'date unrecorded') + ' · ');
    if (item.source?.startsWith('https://')) {
      const link = element('a', '', 'Public source ↗');
      link.href = item.source;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      meta.append(link);
    } else meta.append('Owner-supplied capture');
    parent.append(meta);
  }

  const previewButton = document.getElementById('cpLoadPreview');
  if (previewButton) previewButton.addEventListener('click', () => {
    const url = previewButton.dataset.url;
    if (!url?.startsWith('https://')) return;
    const area = document.getElementById('cpIframeMount');
    const frame = element('iframe');
    frame.title = 'Live website preview — ' + document.title;
    frame.loading = 'lazy';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.src = url;
    const fallback = element('p', 'cp-media-status', 'If the application blocks embedding, ');
    const link = element('a', '', 'open the public website in a new tab ↗');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    fallback.append(link);
    const unload = element('button', 'cp-action', 'CLOSE LIVE PREVIEW');
    unload.type = 'button';
    unload.addEventListener('click', () => {
      area.replaceChildren();
      document.getElementById('cpPrompt').hidden = false;
      previewButton.focus();
    });
    area.replaceChildren(frame, fallback, unload);
    document.getElementById('cpPrompt').hidden = true;
    unload.focus();
  });

  let dialog, largeImage, caption, counter, previous, next, opener, selected = 0;
  if (images.length) {
    dialog = element('dialog', 'cp-lightbox');
    dialog.setAttribute('aria-label', 'Project screenshot viewer');
    const close = element('button', '', 'Close screenshot viewer ×');
    close.type = 'button';
    function closeViewer() {
      dialog.close();
      document.documentElement.classList.remove('cp-viewing-image');
      opener?.focus({preventScroll: true});
    }
    close.addEventListener('click', closeViewer);
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      closeViewer();
    });
    largeImage = element('img', 'cp-lightbox-image');
    largeImage.addEventListener('error', () => {
      largeImage.hidden = true;
      caption.textContent = 'This screenshot could not be loaded. Close the viewer and try again.';
    });
    caption = element('p');
    caption.id = 'cpLightboxCaption';
    dialog.setAttribute('aria-describedby', caption.id);
    counter = element('p', 'cp-lightbox-count');
    counter.setAttribute('aria-live', 'polite');
    const controls = element('div', 'cp-lightbox-controls');
    previous = element('button', '', '← Previous screenshot');
    next = element('button', '', 'Next screenshot →');
    [previous, next].forEach(button => button.type = 'button');
    controls.append(previous, next);
    dialog.append(close, largeImage, caption, counter, controls);
    document.body.append(dialog);
    function show(index) {
      selected = (index + images.length) % images.length;
      const item = images[selected];
      largeImage.hidden = false;
      largeImage.alt = item.alt;
      largeImage.src = mediaURL(item.file);
      caption.textContent = item.caption || item.alt;
      counter.textContent = `Screenshot ${selected + 1} of ${images.length}`;
      previous.disabled = next.disabled = images.length < 2;
    }
    previous.addEventListener('click', () => show(selected - 1));
    next.addEventListener('click', () => show(selected + 1));
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Tab') {
        const buttons = [...dialog.querySelectorAll('button:not(:disabled)')];
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      }
      const keys = {ArrowLeft: selected - 1, ArrowRight: selected + 1, Home: 0, End: images.length - 1};
      if (event.key in keys) {
        event.preventDefault();
        show(keys[event.key]);
      }
    });
    dialog.addEventListener('click', event => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) closeViewer();
    });
    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('cp-viewing-image');
      largeImage.removeAttribute('src');
      opener?.focus({preventScroll: true});
    });
    const gallery = element('div', 'cp-gallery');
    images.forEach((item, index) => {
      const figure = element('figure', 'cp-capture');
      const button = element('button', 'cp-gallery-open');
      button.type = 'button';
      button.setAttribute('aria-label', 'Enlarge screenshot. ' + item.alt);
      button.setAttribute('aria-haspopup', 'dialog');
      const image = element('img');
      image.alt = item.alt;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.width = item.width || 1280;
      image.height = item.height || 800;
      image.src = mediaURL(item.file);
      image.addEventListener('error', () => {
        button.disabled = true;
        button.replaceChildren(element('span', 'cp-media-error', 'Screenshot unavailable. Please try again later.'));
      });
      button.append(image, element('span', 'cp-enlarge-label', 'ENLARGE ↗'));
      button.addEventListener('click', () => {
        opener = button;
        show(index);
        dialog.showModal();
        close.focus();
        document.documentElement.classList.add('cp-viewing-image');
      });
      figure.append(button);
      const description = element('figcaption');
      provenance(item, description);
      figure.append(description);
      gallery.append(figure);
    });
    mount.append(gallery);
  }

  if (!videos.length) mount.append(element('p', 'cp-media-status', 'Optional demonstration video pending approved recording.'));
  videos.forEach(item => {
    const figure = element('figure', 'cp-demonstration');
    const load = element('button', 'cp-action cp-action-primary', 'LOAD OPTIONAL VIDEO');
    load.type = 'button';
    const video = element('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'none';
    video.hidden = true;
    video.width = item.width || 1280;
    video.height = item.height || 800;
    video.setAttribute('aria-label', item.caption || 'Project interface walkthrough');
    video.addEventListener('error', () => {
      video.hidden = true;
      figure.append(element('p', 'cp-media-error', 'Video unavailable. The screenshots and public source remain available.'));
    }, {once: true});
    load.addEventListener('click', () => {
      video.src = mediaURL(item.file);
      video.hidden = false;
      load.hidden = true;
      video.load();
      video.focus();
    });
    const description = element('figcaption');
    provenance(item, description);
    figure.append(load, video, description);
    mount.append(figure);
  });
  function pauseVideos() { mount.querySelectorAll('video').forEach(video => video.pause()); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseVideos(); });
  window.addEventListener('pagehide', pauseVideos);
})();
