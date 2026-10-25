/* Decorative header motion keeps checkout fixed and every menu link usable. */
(() => {
  'use strict';
  const nav = document.querySelector('.site-header .main-nav');
  const toggle = document.querySelector('.header-motion-toggle');
  if (nav && !nav.classList.contains('nav-motion-ready')) {
    const links = Array.from(nav.children).filter(node => node.tagName === 'A');
    if (links.length) {
      const track = document.createElement('div');
      track.className = 'nav-motion-track';
      const group = document.createElement('div');
      group.className = 'nav-motion-group';
      links.forEach(link => group.append(link));
      const duplicate = group.cloneNode(true);
      duplicate.classList.add('nav-motion-clone');
      duplicate.setAttribute('aria-hidden', 'true');
      duplicate.querySelectorAll('a').forEach(link => link.tabIndex = -1);
      track.append(group, duplicate);
      nav.replaceChildren(track);
      nav.classList.add('nav-motion-ready');
      nav.addEventListener('focusout', event => {
        if (!nav.contains(event.relatedTarget)) nav.scrollLeft = 0;
      });
    }
  }
  if (toggle) {
    toggle.addEventListener('click', () => {
      const paused = document.body.classList.toggle('header-motion-paused');
      if (nav) nav.scrollLeft = 0;
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused ? 'Resume header motion' : 'Pause header motion');
      toggle.textContent = paused ? '▶' : 'Ⅱ';
    });
  }
})();
