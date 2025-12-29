export function initNotes(root) {
  const article = document.querySelector('.content-article');
  if (!article) return;

  // We no longer need the separate .notes-list container for logic,
  // but we might want to clear it if it exists to avoid confusion
  const notesContainer = root.querySelector('.notes-list');
  if (notesContainer) notesContainer.innerHTML = '';

  const paragraphs = article.querySelectorAll('p, li, h2, h3');
  let noteCounter = 0;

  paragraphs.forEach((p) => {
    // Only process if it has the marker
    if (p.innerHTML.includes('¹')) {
      const noteBlock = p.nextElementSibling;

      // Check if the next element is actually a note block
      if (noteBlock && noteBlock.classList.contains('note')) {
        noteCounter++;

        const noteId = `note-${noteCounter}`;

        // 1. Replace symbol with number
        // We use a simpler markup since we aren't jumping across the page
        p.innerHTML = p.innerHTML.replace('¹',
          `<sup class="note-ref">${noteCounter}</sup>`
        );

        // Prepend note number to content inside note block
        const noteItems = noteBlock.children;
        for (let item of noteItems) {
          item.innerHTML = `<sup>${noteCounter}</sup> ` + item.innerHTML;
        }

        // 2. Structural adjustment
        if (p.tagName === 'LI') {
          // For List Items, append directly to preserve OL/UL validity
          p.appendChild(noteBlock);
          p.classList.add('note-wrapper');
        } else {
          // For Paragraphs etc, wrap together
          const wrapper = document.createElement('div');
          wrapper.className = 'note-wrapper';
          p.parentNode.insertBefore(wrapper, p);
          wrapper.appendChild(p);
          wrapper.appendChild(noteBlock);
        }

        // 3. Activate the note
        noteBlock.classList.add('is-placed');
        noteBlock.dataset.id = noteId;
      }
    }
  });

  // No need for complex resize listeners anymore!
  // CSS handles the positioning relative to the wrapper.
}