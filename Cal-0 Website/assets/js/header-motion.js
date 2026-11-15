/* Announcement pause fallback; shared rebuild.js owns the scrollable menu. */
(() => {
  'use strict';
  const toggle = document.querySelector('.header-motion-toggle');
  if (!toggle || toggle.dataset.cal0MotionBound === 'true') return;
  toggle.dataset.cal0MotionBound = 'true';
  toggle.addEventListener('click', () => {
    const paused = document.body.classList.toggle('header-motion-paused');
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Resume header motion' : 'Pause header motion');
    toggle.textContent = paused ? '▶' : 'Ⅱ';
    document.dispatchEvent(new Event('cal0-header-motion-change'));
  });
})();
