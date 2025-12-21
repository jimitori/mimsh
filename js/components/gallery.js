export async function initGallery(root) {
    // 1. Determine data source
    // Priority: data-gallery attribute > parent directory name > page filename
    let galleryName = root.dataset.gallery;

    if (!galleryName) {
        const pathParts = window.location.pathname.split('/').filter(p => p);
        const pageName = pathParts[pathParts.length - 1]?.replace('.html', '');

        // If on index.html, use parent directory name
        if (!pageName || pageName === 'index') {
            galleryName = pathParts[pathParts.length - 2] || 'index';
        } else {
            galleryName = pageName;
        }
    }

    const src = `/data/galleries/${galleryName}.json`;

    // 2. Fetch data
    try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`Failed to load gallery data from ${src}`);
        const data = await response.json();
        renderGallery(root, data);
    } catch (err) {
        console.error('Gallery error:', err);
        root.innerHTML = `<p class="error">Could not load gallery: ${err.message}</p>`;
    }
}

function renderGallery(root, items) {
    root.classList.add('gallery-wrapper');

    const grid = document.createElement('div');
    grid.className = 'gallery-grid';

    items.forEach((item, index) => {
        const thumbContainer = document.createElement('button');
        thumbContainer.type = 'button';
        thumbContainer.className = 'gallery-thumb';
        thumbContainer.ariaLabel = `View image ${index + 1}: ${item.alt || 'Untitled'}`;

        // Thumbnail image
        const img = document.createElement('img');
        img.src = item.preview || item.full; // fallback to full if no preview
        img.alt = item.alt || '';
        img.loading = 'lazy';

        thumbContainer.appendChild(img);

        // Click handler -> Open Lightbox
        thumbContainer.addEventListener('click', () => openLightbox(item));

        grid.appendChild(thumbContainer);
    });

    root.appendChild(grid);
}

// Lightbox Singleton Logic
let lightboxEl = null;
let lightboxImg = null;
let lightboxCaption = null;

function createLightbox() {
    if (lightboxEl) return;

    lightboxEl = document.createElement('div');
    lightboxEl.className = 'gallery-lightbox';
    lightboxEl.ariaHidden = 'true';

    const content = document.createElement('div');
    content.className = 'gallery-lightbox-content';

    lightboxImg = document.createElement('img');

    lightboxCaption = document.createElement('p');
    lightboxCaption.className = 'gallery-caption';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'gallery-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.ariaLabel = 'Close gallery overlay';

    content.appendChild(lightboxImg);
    content.appendChild(lightboxCaption);
    lightboxEl.appendChild(closeBtn);
    lightboxEl.appendChild(content);

    // Close handlers
    closeBtn.addEventListener('click', closeLightbox);
    lightboxEl.addEventListener('click', (e) => {
        if (e.target === lightboxEl) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightboxEl.classList.contains('is-visible')) {
            closeLightbox();
        }
    });

    document.body.appendChild(lightboxEl);
}

function openLightbox(item) {
    createLightbox(); // ensure exists

    lightboxImg.src = item.full;
    lightboxImg.alt = item.alt || '';

    if (item.caption) {
        lightboxCaption.textContent = item.caption;
        lightboxCaption.style.display = 'block';
    } else {
        lightboxCaption.style.display = 'none';
    }

    lightboxEl.classList.add('is-visible');
    lightboxEl.ariaHidden = 'false';
    document.body.style.overflow = 'hidden'; // prevent scrolling bg
}

function closeLightbox() {
    if (!lightboxEl) return;
    lightboxEl.classList.remove('is-visible');
    lightboxEl.ariaHidden = 'true';
    document.body.style.overflow = '';
}
