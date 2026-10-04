document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', String(!isExpanded));
            navMenu.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('active') && !navMenu.contains(e.target)) {
                navToggle.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('active');
            }
        });
    }

    const accordionGroups = document.querySelectorAll('.unit-item, .specialty-area');
    accordionGroups.forEach((targetDetail) => {
        targetDetail.addEventListener('toggle', () => {
            if (!targetDetail.open) return;
            accordionGroups.forEach((detail) => {
                if (detail !== targetDetail && detail.classList.contains('unit-item')) {
                    detail.removeAttribute('open');
                }
            });
        });
    });

    const lightbox = document.getElementById('lightbox');
    const lbImage = document.getElementById('lightboxImage');
    const lbClose = document.getElementById('lightboxClose');
    const lbOverlay = document.getElementById('lightboxOverlay');
    const lbPrev = document.getElementById('lightboxPrev');
    const lbNext = document.getElementById('lightboxNext');

    if (!lightbox || !lbImage || !lbClose || !lbOverlay || !lbPrev || !lbNext) {
        return;
    }

    let currentGallery = [];
    let currentIndex = -1;

    function setGallery(groupName) {
        currentGallery = [...document.querySelectorAll(`[data-lightbox="${groupName}"]`)];
        currentIndex = 0;
    }

    function openLightbox(src, alt, shape = 'full', index = 0, gallery = []) {
        currentGallery = gallery.length ? gallery : currentGallery;
        currentIndex = index;
        resetImageTransform();
        lbImage.src = src;
        lbImage.alt = alt || '';
        lbImage.classList.toggle('is-circle', shape === 'circle');
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lightbox-open');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        resetImageTransform();
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        lbImage.src = '';
        lbImage.classList.remove('is-circle');
        currentGallery = [];
        currentIndex = -1;
        document.body.classList.remove('lightbox-open');
        document.body.style.overflow = '';
    }

    function showNextImage(direction) {
        if (currentGallery.length === 0) return;
        currentIndex = (currentIndex + direction + currentGallery.length) % currentGallery.length;
        const nextImage = currentGallery[currentIndex];
        const shape = nextImage.dataset.lightboxShape === 'circle' ? 'circle' : 'full';
        openLightbox(nextImage.src, nextImage.alt, shape, currentIndex, currentGallery);
    }

    // --- Touch gestures: swipe left/right for navigation, double-tap to zoom, pan when zoomed ---
    let lastTouch = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    let isZoomed = false;
    let currentScale = 1;
    let lastPan = { x: 0, y: 0 };

    function resetImageTransform() {
        lbImage.style.transform = '';
        lbImage.classList.remove('zoomed');
        isZoomed = false;
        currentScale = 1;
        lastPan = { x: 0, y: 0 };
        document.body.classList.remove('zoomed');
    }

    // Double-tap to toggle zoom
    lbImage.addEventListener('touchend', (ev) => {
        const now = Date.now();
        if (now - lastTouch <= 300) {
            // double tap
            ev.preventDefault();
            isZoomed = !isZoomed;
            if (isZoomed) {
                currentScale = 2;
                lbImage.classList.add('zoomed');
                document.body.classList.add('zoomed');
                lbImage.style.transform = `scale(${currentScale}) translate3d(0,0,0)`;
            } else {
                resetImageTransform();
            }
        }
        lastTouch = now;
    }, { passive: false });

    // Swipe navigation and pan handling
    lbImage.addEventListener('touchstart', (ev) => {
        if (!ev.touches || ev.touches.length === 0) return;
        touchStartX = ev.touches[0].clientX;
        touchStartY = ev.touches[0].clientY;
    }, { passive: true });

    lbImage.addEventListener('touchmove', (ev) => {
        if (!ev.touches || ev.touches.length === 0) return;
        const dx = ev.touches[0].clientX - touchStartX;
        const dy = ev.touches[0].clientY - touchStartY;

        if (isZoomed) {
            ev.preventDefault();
            // apply pan
            const panX = lastPan.x + dx / currentScale;
            const panY = lastPan.y + dy / currentScale;
            lbImage.style.transform = `scale(${currentScale}) translate3d(${panX}px, ${panY}px, 0)`;
        }
    }, { passive: false });

    lbImage.addEventListener('touchend', (ev) => {
        if (isZoomed) {
            // store last pan offset
            const matrix = window.getComputedStyle(lbImage).transform;
            if (matrix && matrix !== 'none') {
                const values = matrix.match(/matrix\(([^)]+)\)/);
                if (values) {
                    const parts = values[1].split(',').map(Number);
                    // matrix(a, b, c, d, tx, ty)
                    lastPan.x = parts[4] || 0;
                    lastPan.y = parts[5] || 0;
                }
            }
            return;
        }

        // simple swipe detection for navigation when not zoomed
        const touch = ev.changedTouches && ev.changedTouches[0];
        if (!touch) return;
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        if (absX > 40 && absX > absY) {
            if (dx < 0) showNextImage(1); else showNextImage(-1);
        }
    }, { passive: true });

    // Reset transforms on close
    lightbox.addEventListener('transitionend', (ev) => {
        if (!lightbox.classList.contains('open')) resetImageTransform();
    });

    function handleGalleryOpen(event, img) {
        event.preventDefault();
        const groupName = img.dataset.lightbox;
        const gallery = [...document.querySelectorAll(`[data-lightbox="${groupName}"]`)];
        const index = gallery.indexOf(img);
        const shape = img.dataset.lightboxShape === 'circle' ? 'circle' : 'full';
        setGallery(groupName);
        openLightbox(img.src, img.alt, shape, index, gallery);
    }

    document.querySelectorAll('[data-lightbox]').forEach((img) => {
        img.addEventListener('click', (event) => handleGalleryOpen(event, img));
    });

    lbPrev.addEventListener('click', () => showNextImage(-1));
    lbNext.addEventListener('click', () => showNextImage(1));
    lbClose.addEventListener('click', closeLightbox);
    lbOverlay.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNextImage(1);
        if (e.key === 'ArrowLeft') showNextImage(-1);
    });
});
