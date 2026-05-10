/* DAMK · shared site behaviors
   - expandable nav
   - monkey easter egg (preserved)
   - reveal-on-scroll
   - lazy image fade-in
   - signature stamp oracle (cycles quiet phrases on click)
   - cinematic page fade-in
   - theme switcher (01 · night / 02 · day)
*/

(function () {
  'use strict';

  /* page fade is now CSS-driven — no JS toggle needed */

  /* ---------- theme switcher (01 · 02) ----------
     Dark is the primary identity. Light is the editorial counterpart.
     The transition runs through a brief tonal "curtain" — like
     dimming the lights in an exhibition space — never a flash. */
  const THEME_KEY = 'damk-theme';
  const THEME_COLOR = { dark: '#0a0a0a', light: '#e8e2d4' };

  function readTheme() {
    try {
      const v = localStorage.getItem(THEME_KEY);
      return v === 'light' ? 'light' : 'dark';
    } catch (_) { return 'dark'; }
  }

  function applyTheme(theme, opts) {
    const next = theme === 'light' ? 'light' : 'dark';
    if (next === 'light') document.documentElement.dataset.theme = 'light';
    else delete document.documentElement.dataset.theme;

    // meta theme-color for mobile chrome / standalone
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLOR[next]);

    // switcher aria-label only — visual active state is driven by CSS
    // off [data-theme] on <html> (no flicker from a JS post-paint update)
    document.querySelectorAll('.theme-switch').forEach((sw) => {
      sw.setAttribute('aria-label',
        next === 'light' ? 'Switch to night mode (01)' : 'Switch to gallery mode (02)');
    });

    if (opts && opts.persist) {
      try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
    }
  }

  function runCurtainAndSwap(nextTheme) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      applyTheme(nextTheme, { persist: true });
      return;
    }
    let curtain = document.querySelector('.theme-curtain');
    if (!curtain) {
      curtain = document.createElement('div');
      curtain.className = 'theme-curtain';
      document.body.appendChild(curtain);
    }
    // tint with the *current* ink so the swap reads as a held breath
    curtain.style.background = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
    requestAnimationFrame(() => {
      curtain.classList.add('is-on');
      setTimeout(() => {
        applyTheme(nextTheme, { persist: true });
        // small delay so transitions on body/header start under the curtain
        setTimeout(() => {
          curtain.classList.remove('is-on');
        }, 80);
      }, 320);
    });
  }

  // Apply persisted theme up front (the inline head script already
  // set the attribute pre-paint; this call only refreshes UI state)
  applyTheme(readTheme(), { persist: false });

  document.querySelectorAll('.theme-switch').forEach((sw) => {
    sw.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
      runCurtainAndSwap(current === 'light' ? 'dark' : 'light');
    });
  });

  /* ---------- expandable nav ---------- */
  document.querySelectorAll('.has-sub').forEach((li) => {
    const btn = li.querySelector('.nav-trigger');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = li.getAttribute('data-open') === 'true';
      document.querySelectorAll('.has-sub[data-open="true"]').forEach(o => o.setAttribute('data-open', 'false'));
      li.setAttribute('data-open', open ? 'false' : 'true');
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.has-sub[data-open="true"]').forEach((o) => {
      o.setAttribute('data-open', 'false');
      const b = o.querySelector('.nav-trigger');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- monkey easter egg (preserved soul) ---------- */
  const monkey = document.getElementById('monkey');
  if (monkey) {
    const images = ['monkey1.png', 'monkey2.png', 'monkey3.png', 'monkey4.png'];
    let clickable = true;
    monkey.addEventListener('click', () => {
      if (!clickable) return;
      const current = monkey.getAttribute('src').split('/').pop();
      const others = images.filter(img => img !== current);
      const next = others[Math.floor(Math.random() * others.length)];
      const tempImg = new Image();
      tempImg.onload = () => {
        monkey.setAttribute('src', '/assets/' + next);
        if (next === 'monkey3.png') {
          clickable = false;
          monkey.style.transition = 'none';
          monkey.style.transform = 'rotate(0deg) scale(1)';
          void monkey.offsetWidth;
          monkey.style.transition = 'transform 1.8s ease-in-out';
          monkey.style.transform = 'rotate(1440deg) scale(2.5)';
          setTimeout(() => {
            monkey.style.transform = 'rotate(0deg) scale(1)';
            clickable = true;
          }, 2000);
        }
      };
      tempImg.src = '/assets/' + next;
    });
  }

  /* ---------- reveal-on-scroll ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  function revealNow(el) { el.classList.add('in'); }

  if (revealEls.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // reveal if visible OR already scrolled past (scroll restoration on reload)
        if (entry.isIntersecting || entry.boundingClientRect.bottom <= 0) {
          revealNow(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    revealEls.forEach((el) => io.observe(el));

    // safety net: anything still hidden after 2.5s (IO never fired) — reveal it
    setTimeout(() => {
      revealEls.forEach((el) => {
        if (!el.classList.contains('in')) revealNow(el);
      });
    }, 2500);
  } else {
    revealEls.forEach(revealNow);
  }

  /* ---------- lazy image fade-in ---------- */
  function markLoaded(img) { img.classList.add('loaded'); }
  document.querySelectorAll('img[loading="lazy"], img[data-fade]').forEach((img) => {
    if (img.complete && img.naturalWidth > 0) markLoaded(img);
    else img.addEventListener('load', () => markLoaded(img), { once: true });
  });
  // also catch dynamically-inserted images (archive lazy gallery)
  if ('MutationObserver' in window) {
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          const imgs = node.matches && node.matches('img') ? [node]
                     : (node.querySelectorAll ? node.querySelectorAll('img[loading="lazy"], img[data-fade]') : []);
          imgs.forEach((img) => {
            if (img.complete && img.naturalWidth > 0) markLoaded(img);
            else img.addEventListener('load', () => markLoaded(img), { once: true });
          });
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  /* ---------- signature stamp oracle ---------- */
  const stamp = document.querySelector('.stamp');
  if (stamp) {
    const phrases = [
      ['DAMK', 'LISBON · 38.7°N'],
      ['QUIET THINGS', 'FROM LOUD CITIES'],
      ['OBJECTS FROM', 'FORGOTTEN PLACES'],
      ['URBAN MEMORY', 'ARTIFACTS'],
      ['FRAGMENTS OF', 'DISAPPEARING ENVIRONMENTS'],
      ['BETWEEN STREET', 'AND SOFT SADNESS']
    ];
    let i = 0;
    const left = stamp.querySelector('[data-stamp-left]');
    const right = stamp.querySelector('[data-stamp-right]');
    stamp.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      i = (i + 1) % phrases.length;
      stamp.style.transition = 'opacity 0.25s';
      stamp.style.opacity = '0';
      setTimeout(() => {
        if (left) left.textContent = phrases[i][0];
        if (right) right.textContent = phrases[i][1];
        stamp.style.opacity = '0.55';
      }, 250);
    });
  }
})();
