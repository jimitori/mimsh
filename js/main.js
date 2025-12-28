import { initSidebar } from './components/sidebar.js';
import { initNotes } from './components/notes.js';
import { initContent } from './components/content.js';
import { initGallery, initZoomableImages } from './components/gallery.js';

document.addEventListener('DOMContentLoaded', () => {
  const sidebarEl = document.querySelector('[data-component="sidebar"]');
  const notesEl = document.querySelector('[data-component="notes"]');
  const contentEl = document.querySelector('[data-component="content"]');

  if (sidebarEl) initSidebar(sidebarEl);
  if (notesEl) initNotes(notesEl);
  if (contentEl) initContent(contentEl);

  const galleryEl = document.querySelector('[data-component="gallery"]');
  if (galleryEl) initGallery(galleryEl);

  // Initialize standalone zoomable images (images with 'img-zoom' class)
  initZoomableImages();
});
