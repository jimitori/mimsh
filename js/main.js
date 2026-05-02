import { initSidebar } from './components/sidebar.js';
import { initNotes } from './components/notes.js';
import { initContent } from './components/content.js';
import { initGallery, initZoomableImages } from './components/gallery.js';
import { initThemeSwitcher } from './components/theme.js';

document.addEventListener('DOMContentLoaded', async () => {
  const sidebarEl = document.querySelector('[data-component="sidebar"]');
  const notesEl = document.querySelector('[data-component="notes"]');
  const contentEl = document.querySelector('[data-component="content"]');

  if (sidebarEl) await initSidebar(sidebarEl);
  if (notesEl) initNotes(notesEl);
  if (contentEl) initContent(contentEl);

  const galleryEl = document.querySelector('[data-component="gallery"]');
  if (galleryEl) initGallery(galleryEl);

  initZoomableImages();
  initThemeSwitcher();
});
