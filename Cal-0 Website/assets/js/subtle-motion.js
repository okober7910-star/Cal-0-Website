/* Original layout and content stay intact; motion is progressive enhancement. */
(() => {
  'use strict';
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let dispose = () => {};

  function initialize() {
    dispose();
    const cleanups = [];
    dispose = () => cleanups.forEach(cleanup => cleanup());
    if (preference.matches) return;

    const facts = document.querySelector('#main-content .facts');
    if (facts) {
      const items = Array.from(facts.children);
      if (items.length === 4 && items.every(item => item.querySelector('strong'))) {
        const viewport = document.createElement('div');
        viewport.className = 'facts-motion-window';
        viewport.tabIndex = 0;
        viewport.setAttribute('aria-label', 'Product facts per pouch. Pause to browse at your own pace.');
        const track = document.createElement('div');
        track.className = 'facts-motion-track';
        const group = document.createElement('div');
        group.className = 'facts-motion-group';
        items.forEach(item => { item.classList.add('facts-motion-item'); group.append(item); });
        const duplicate = group.cloneNode(true);
        duplicate.setAttribute('aria-hidden', 'true');
        duplicate.setAttribute('inert', '');
        track.append(group, duplicate);
        viewport.append(track);
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'facts-motion-toggle';
        toggle.textContent = 'Ⅱ';
        toggle.title = 'Pause moving product facts';
        toggle.setAttribute('aria-label', 'Pause moving product facts');
        toggle.setAttribute('aria-pressed', 'false');
        toggle.addEventListener('click', () => {
          const paused = facts.classList.toggle('is-paused');
          toggle.textContent = paused ? '▶' : 'Ⅱ';
          toggle.title = paused ? 'Resume moving product facts' : 'Pause moving product facts';
          toggle.setAttribute('aria-label', toggle.title);
          toggle.setAttribute('aria-pressed', String(paused));
        });
        facts.append(viewport, toggle);
        facts.classList.add('facts-motion-enabled');
        const handleVisibility = () => facts.classList.toggle('is-page-hidden', document.hidden);
        document.addEventListener('visibilitychange', handleVisibility);
        handleVisibility();
        if ('IntersectionObserver' in window) {
          const observer = new IntersectionObserver(entries => {
            facts.classList.toggle('is-offscreen', !entries[0].isIntersecting);
          });
          observer.observe(facts);
          cleanups.push(() => observer.disconnect());
        }
        cleanups.push(() => {
          document.removeEventListener('visibilitychange', handleVisibility);
          items.forEach(item => item.classList.remove('facts-motion-item'));
          facts.replaceChildren(...items);
          facts.classList.remove('facts-motion-enabled', 'is-paused', 'is-offscreen', 'is-page-hidden');
        });
      }
    }

    if ('IntersectionObserver' in window) {
      const blocks = Array.from(document.querySelectorAll('#main-content > section:not(.hero) > .container'));
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.04, rootMargin: '0px 0px -24px 0px' });
      blocks.forEach(block => {
        // Never hide content that is already on screen, including anchor targets.
        if (block.getBoundingClientRect().top < window.innerHeight) return;
        block.classList.add('cal0-scroll-reveal');
        observer.observe(block);
      });
      // An in-page link or keyboard navigation must never land on hidden content.
      const revealTarget = event => {
        const focused = event.type === 'focusin' ? event.target : null;
        let target = focused;
        if (!target && location.hash) {
          try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (_) {}
        }
        if (!target) return;
        blocks.forEach(block => {
          if (block === target || block.contains(target) || target.contains(block)) {
            block.classList.add('is-revealed'); observer.unobserve(block);
          }
        });
      };
      window.addEventListener('hashchange', revealTarget);
      document.addEventListener('focusin', revealTarget);
      revealTarget({type:'hashchange'});
      cleanups.push(() => {
        observer.disconnect();
        window.removeEventListener('hashchange', revealTarget);
        document.removeEventListener('focusin', revealTarget);
        blocks.forEach(block => block.classList.remove('cal0-scroll-reveal', 'is-revealed'));
      });
    }
  }

  initialize();
  preference.addEventListener('change', initialize);
})();
