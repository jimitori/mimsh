export function initNotes(root) {
  const notesContainer = root.querySelector('.notes-list');
  const article = document.querySelector('.content-article');
  if (!notesContainer || !article) return;

  // Cleanup in case of reload
  notesContainer.innerHTML = '';

  const paragraphs = article.querySelectorAll('p, li, h2, h3');
  let noteCounter = 0;

  paragraphs.forEach((p) => {
    if (p.innerHTML.includes('¹')) {
      const noteBlock = p.nextElementSibling;

      if (noteBlock && noteBlock.classList.contains('note')) {
        noteCounter++;

        const anchorId = `anchor-${noteCounter}`;
        const noteId = `note-${noteCounter}`;

        // 1. Replace symbol with sequential number link
        p.innerHTML = p.innerHTML.replace('¹',
          `<sup><a href="#${noteId}" id="${anchorId}" class="note-ref">${noteCounter}</a></sup>`
        );

        // Prepend note number to each element inside the note block (for language switching)
        const noteItems = noteBlock.children;
        for (let item of noteItems) {
          item.innerHTML = `<sup>${noteCounter}</sup> ` + item.innerHTML;
        }

        // 2. Create list item for sidebar
        const li = document.createElement('li');
        li.id = noteId;
        li.dataset.anchor = anchorId;
        li.innerHTML = `
          <div class="note-content">${noteBlock.innerHTML}</div>
          <a href="#${anchorId}" class="note-back">↩</a>
        `;

        notesContainer.appendChild(li);

        // 3. Remove original block from text
        noteBlock.remove();
      }
    }
  });

  const updateLayout = () => layoutNotes(notesContainer);

  // Recalculate positions on image load and resize
  window.addEventListener('load', updateLayout);
  window.addEventListener('resize', updateLayout);
  updateLayout();
}

function layoutNotes(list) {
  const notes = Array.from(list.querySelectorAll('li'));
  const pageOffset = window.scrollY || window.pageYOffset;
  const listRect = list.getBoundingClientRect();
  const listTop = listRect.top + pageOffset;
  let lastBottom = 0;

  notes.forEach(note => {
    const anchor = document.getElementById(note.dataset.anchor);
    if (!anchor) return;

    const anchorRect = anchor.getBoundingClientRect();
    const anchorTop = anchorRect.top + pageOffset;

    let top = anchorTop - listTop;

    // Prevent notes from overlapping
    const minTop = lastBottom + 20;
    if (top < minTop) top = minTop;

    note.style.position = 'absolute';
    note.style.top = top + 'px';
    lastBottom = top + note.offsetHeight;
  });

  list.style.height = lastBottom + 'px';
}