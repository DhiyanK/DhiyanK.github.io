'use strict';
document.addEventListener('DOMContentLoaded',()=>{document.getElementById('terminal-input')?.setAttribute('aria-label','Terminal command');});

/* Scroll choreography follows native scrolling; content never depends on motion. */
document.addEventListener('DOMContentLoaded', () => {
  const lifecycle = new AbortController();
  const eventOptions = { passive: true, signal: lifecycle.signal };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 768px)');
  const selector = '.section-heading, .page-intro, main .terminal-window:not(.projects-window), main .skills-panel, .project-card, .credential-tile, .info-block, .tech-skill-box, .site-footer';
  const elements = [...document.querySelectorAll(selector)];
  const cards = document.querySelectorAll('.project-card, .credential-tile, .info-block, .tech-skill-box');
  cards.forEach(card => card.classList.add('motion-card'));
  let observer, frame = 0, heroAnimation;
  const pending = new Map();
  const active = new Set();
  const hero = document.querySelector('.mega-name');

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    observer?.disconnect();
    pending.forEach(animation => animation.cancel());
    pending.clear();
    active.clear();
    heroAnimation?.cancel();
    heroAnimation = null;
    document.body.classList.remove('scroll-choreography');
  }

  function schedule() {
    if (!frame && !reduced.matches && !document.hidden) frame = requestAnimationFrame(update);
  }

  function update() {
    frame = 0;
    const height = innerHeight;
    // Read all geometry before updating animations to avoid layout thrashing.
    const measurements = [...active].map(element => [element, element.getBoundingClientRect().top]);
    const heroTop = heroAnimation ? hero.getBoundingClientRect().top : 0;
    measurements.forEach(([element, top]) => {
      const animation = pending.get(element);
      if (!animation) return;
      const progress = Math.max(0, Math.min(1, (height * .96 - top) / (height * .34)));
      animation.currentTime = progress * 1000;
      if (element.contains(document.activeElement)) animation.currentTime = 1000;
    });
    if (heroAnimation) heroAnimation.currentTime = Math.max(0, Math.min(1000, -heroTop / height * 1000));
  }

  function start() {
    stop();
    if (reduced.matches || document.body.classList.contains('story-reduced') || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
    document.body.classList.add('scroll-choreography');
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) active.add(entry.target);
        else active.delete(entry.target);
      });
      schedule();
    }, { rootMargin: '100px 0px', threshold: 0 });
    elements.forEach(element => {
      // Nested text and skill boxes use less travel than large section panels.
      const small = element.matches('.info-block, .tech-skill-box');
      const distance = compact.matches ? (small ? 12 : 24) : (small ? 18 : 48);
      const animation = element.animate([
        { opacity: .28, translate: `0 ${distance}px`, scale: small ? '.99' : '.97' },
        { opacity: 1, translate: '0 0', scale: '1' }
      ], { duration: 1000, fill: 'both', easing: 'cubic-bezier(.2,.65,.3,1)' });
      animation.pause();
      animation.currentTime = 0;
      pending.set(element, animation);
      observer.observe(element);
    });
    if (hero && !compact.matches) {
      heroAnimation = hero.animate([
        { translate: '0 0', opacity: 1 },
        { translate: '0 -32px', opacity: .65 }
      ], { duration: 1000, fill: 'both', easing: 'linear' });
      heroAnimation.pause();
      heroAnimation.currentTime = 0;
    }
    schedule();
  }
  addEventListener('scroll', schedule, eventOptions);
  addEventListener('resize', schedule, eventOptions);
  document.addEventListener('focusin', schedule, eventOptions);
  document.addEventListener('visibilitychange', schedule, eventOptions);
  document.addEventListener('portfolio-motion-change', start, eventOptions);
  reduced.addEventListener('change', start, eventOptions);
  compact.addEventListener('change', start, eventOptions);
  addEventListener('pagehide', event => {
    stop();
    if (!event.persisted) lifecycle.abort();
  }, eventOptions);
  addEventListener('pageshow', event => { if (event.persisted) start(); }, eventOptions);
  start();
});
