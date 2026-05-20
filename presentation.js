/* =============================================================
   Presentation Mode — Keyboard & Touch Controls
   ============================================================= */
(function () {
  'use strict';

  const overlay = document.getElementById('pres-overlay');
  if (!overlay) return;

  const slides = overlay.querySelectorAll('.pres-slide');
  const progress = overlay.querySelector('.pres-progress');
  const pageInfo = overlay.querySelector('.pres-page-info');
  const totalSlides = slides.length;
  let current = 0;
  let isActive = false;

  /* ---------- Open / Close ---------- */
  function open() {
    isActive = true;
    overlay.classList.add('active');
    document.body.classList.add('pres-active');
    goTo(0);
  }

  function close() {
    isActive = false;
    overlay.classList.remove('active');
    document.body.classList.remove('pres-active');
    slides.forEach((s) => s.classList.remove('active', 'prev'));
  }

  /* ---------- Navigation ---------- */
  function goTo(index) {
    if (index < 0 || index >= totalSlides) return;

    slides.forEach((s, i) => {
      s.classList.remove('active', 'prev');
      if (i < index) s.classList.add('prev');
    });
    slides[index].classList.add('active');
    current = index;

    // Update UI
    if (progress) {
      progress.style.width = ((current + 1) / totalSlides * 100) + '%';
    }
    if (pageInfo) {
      pageInfo.textContent = (current + 1) + ' / ' + totalSlides;
    }
  }

  function next() {
    if (current < totalSlides - 1) goTo(current + 1);
  }

  function prev() {
    if (current > 0) goTo(current - 1);
  }

  /* ---------- Keyboard ---------- */
  document.addEventListener('keydown', function (e) {
    if (!isActive) return;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
      case 'PageDown':
        e.preventDefault();
        next();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        prev();
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      case 'Home':
        e.preventDefault();
        goTo(0);
        break;
      case 'End':
        e.preventDefault();
        goTo(totalSlides - 1);
        break;
    }
  });

  /* ---------- Touch / Swipe ---------- */
  let touchStartX = 0;
  let touchStartY = 0;

  overlay.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  overlay.addEventListener('touchend', function (e) {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
  }, { passive: true });

  /* ---------- Click to advance ---------- */
  overlay.querySelector('.pres-viewport').addEventListener('click', function (e) {
    // Don't advance if clicking on interactive elements
    if (e.target.closest('.pres-bar, .pres-close, button, a')) return;
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x > rect.width * 0.3) {
      next();
    } else {
      prev();
    }
  });

  /* ---------- Button bindings ---------- */
  const closeBtn = overlay.querySelector('.pres-close');
  if (closeBtn) closeBtn.addEventListener('click', close);

  const prevBtn = overlay.querySelector('[data-pres-prev]');
  if (prevBtn) prevBtn.addEventListener('click', prev);

  const nextBtn = overlay.querySelector('[data-pres-next]');
  if (nextBtn) nextBtn.addEventListener('click', next);

  /* ---------- Open triggers ---------- */
  document.querySelectorAll('[data-open-pres]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      open();
    });
  });

  /* ---------- Fullscreen API ---------- */
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      overlay.requestFullscreen().catch(function () {});
    } else {
      document.exitFullscreen();
    }
  }

  const fsBtn = overlay.querySelector('[data-pres-fs]');
  if (fsBtn) fsBtn.addEventListener('click', toggleFullscreen);

})();
