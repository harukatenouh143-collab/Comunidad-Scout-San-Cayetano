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
        lbImage.src = src;
        lbImage.alt = alt || '';
        lbImage.classList.toggle('is-circle', shape === 'circle');
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lightbox-open');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
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
        img.addEventListener('touchstart', (event) => handleGalleryOpen(event, img), { passive: true });
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