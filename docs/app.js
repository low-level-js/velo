/* app.js — Velo Docs interactive enhancements */

(function () {
  'use strict';

  /* ── Mobile menu ── */
  const menuBtn = document.querySelector('.menu-btn');
  const sidebar = document.querySelector('.sidebar');

  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) &&
          !menuBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  /* ── Active topbar nav link ── */
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.topbar-nav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  /* ── Active sidebar link via scrollspy ── */
  const sections = document.querySelectorAll('section[id], div[id].section');
  const sidebarLinks = document.querySelectorAll('.sidebar-link[href^="#"]');

  if (sections.length && sidebarLinks.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          sidebarLinks.forEach(link => {
            const target = link.getAttribute('href').slice(1);
            link.classList.toggle('active', target === id);
          });
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

    sections.forEach(s => observer.observe(s));
  }

  /* ── Close sidebar on sidebar link click (mobile) ── */
  sidebarLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (sidebar) sidebar.classList.remove('open');
    });
  });

  /* ── Copy-to-clipboard for code blocks ── */
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const pre = btn.closest('.code-block')?.querySelector('pre');
      if (!pre) return;

      const text = pre.innerText;
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = 'Copiado!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copiar';
          btn.classList.remove('copied');
        }, 2000);
      } catch {
        btn.textContent = 'Error';
      }
    });
  });

  /* ── Add copy button to all code-blocks that don't have one ── */
  document.querySelectorAll('.code-block').forEach(block => {
    if (!block.querySelector('.copy-btn')) {
      const header = block.querySelector('.code-block-header');
      if (header) {
        const btn = document.createElement('button');
        btn.className = 'copy-btn';
        btn.textContent = 'Copiar';
        btn.addEventListener('click', async () => {
          const pre = block.querySelector('pre');
          if (!pre) return;
          try {
            await navigator.clipboard.writeText(pre.innerText);
            btn.textContent = 'Copiado!';
            btn.classList.add('copied');
            setTimeout(() => { btn.textContent = 'Copiar'; btn.classList.remove('copied'); }, 2000);
          } catch { btn.textContent = 'Error'; }
        });
        header.appendChild(btn);
      }
    }
  });

  /* ── Smooth page transitions ── */
  document.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('mailto')) {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.15s';
        setTimeout(() => { location.href = href; }, 150);
      });
    }
  });

  document.body.style.opacity = '1';
  document.body.style.transition = 'opacity 0.2s';

})();
