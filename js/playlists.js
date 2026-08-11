// Месячные плейлисты со Spotify. В данных лежат только год, месяц и id —
// название («July'24») и группировка по годам выводятся отсюда, как и на странице лекций.

const PLAYLISTS_URL = '/data/playlists.json';

const MONTHS = {
  en: ['January', 'February', 'March', 'April', 'May', 'June',
       'July', 'August', 'September', 'October', 'November', 'December'],
  ru: ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
       'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
};

const rootEl = document.querySelector('#playlists');

if (rootEl) {
  initPlaylists();
}

async function initPlaylists() {
  const items = await loadPlaylists();
  if (!items.length) return;

  items.sort((a, b) => (b.year - a.year) || (b.month - a.month));

  rootEl.innerHTML = '';
  let currentYear = null;

  items.forEach((item) => {
    if (item.year !== currentYear) {
      currentYear = item.year;
      const h2 = document.createElement('h2');
      h2.textContent = currentYear;
      rootEl.appendChild(h2);
    }
    rootEl.append(...renderPlaylist(item));
  });
}

async function loadPlaylists() {
  try {
    const response = await fetch(PLAYLISTS_URL);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data.filter(isValid) : [];
  } catch (error) {
    console.error('Failed to load playlists.json', error);
    return [];
  }
}

function isValid(item) {
  return item && item.id && item.year && item.month >= 1 && item.month <= 12;
}

// «July'24» — так они и называются в Spotify.
function playlistName(item) {
  return `${MONTHS.en[item.month - 1]}'${String(item.year).slice(2)}`;
}

function renderPlaylist(item) {
  const heading = document.createElement('h3');
  heading.textContent = playlistName(item);

  const caption = document.createElement('p');
  caption.setAttribute('lang', 'ru');
  caption.textContent = `${MONTHS.ru[item.month - 1]} ${item.year}`;

  const frame = document.createElement('iframe');
  frame.src = `https://open.spotify.com/embed/playlist/${item.id}`;
  frame.width = '100%';
  frame.height = '152';
  frame.title = playlistName(item);
  frame.loading = 'lazy';
  frame.frameBorder = '0';
  frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
  frame.setAttribute('style', 'border-radius:12px; max-width:100%;');

  return [heading, caption, frame];
}
