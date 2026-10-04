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

    document.querySelectorAll('.whatsapp-link').forEach((link) => {
        const href = link.getAttribute('href');
        if (!href || link.dataset.whatsappWebAdded === 'true') return;

        const phoneMatch = href.match(/(?:wa\.me\/|phone=|tel:)(\d+)/i) || href.match(/(\d{10,15})/);
        if (!phoneMatch || !phoneMatch[1]) return;

        const webLink = document.createElement('a');
        webLink.href = `https://web.whatsapp.com/send?phone=${phoneMatch[1]}`;
        webLink.target = '_blank';
        webLink.rel = 'noopener noreferrer';
        webLink.className = 'whatsapp-link whatsapp-link--web';
        webLink.setAttribute('aria-label', 'Abrir WhatsApp Web');
        webLink.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.52 3.48A11.87 11.87 0 0 0 12.06 0C5.46 0 .1 5.36.1 11.96c0 2.11.55 4.17 1.6 5.98L0 24l6.2-1.62a11.92 11.92 0 0 0 5.86 1.78h.01c6.6 0 11.96-5.36 11.96-11.96 0-3.2-1.25-6.22-3.48-8.46Zm-8.46 18.4h-.01a9.9 9.9 0 0 1-5.03-1.38l-.36-.21-3.68.96.98-3.58-.24-.37A9.85 9.85 0 0 1 2.1 11.96a9.86 9.86 0 1 1 17.24 6.98 9.85 9.85 0 0 1-7.28 3.94Zm5.41-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.08-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.68-2.08-.18-.3-.02-.46.13-.61.14-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.21-.24-.57-.49-.49-.67-.5l-.57-.01c-.2 0-.52.07-.8.37-.28.3-1.07 1.04-1.07 2.54 0 1.49 1.09 2.95 1.24 3.15.15.2 2.15 3.28 5.2 4.59.73.31 1.3.5 1.74.64.73.23 1.4.2 1.93.12.59-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.08-.12-.28-.2-.58-.35Z"/></svg>WhatsApp Web';
        link.insertAdjacentElement('afterend', webLink);
        link.dataset.whatsappWebAdded = 'true';
    });

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
