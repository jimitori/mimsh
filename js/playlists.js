// Месячные плейлисты со Spotify. В данных лежат только год, месяц и id —
// название («July'24») и группировка по годам выводятся отсюда, как и на странице лекций.

const PLAYLISTS_URL = '/data/playlists.json';

const LANGS = ['ru', 'en'];

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
  const { featured, months } = await loadPlaylists();
  if (!featured && !months.length) return;

  months.sort((a, b) => (b.year - a.year) || (b.month - a.month));

  rootEl.innerHTML = '';

  if (featured) rootEl.append(...renderFeatured(featured));

  let currentYear = null;
  months.forEach((item) => {
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
  const empty = { featured: null, months: [] };
  try {
    const response = await fetch(PLAYLISTS_URL);
    if (!response.ok) return empty;
    const data = await response.json();
    if (Array.isArray(data)) return { featured: null, months: data.filter(isValid) };
    return {
      featured: data.featured && data.featured.id ? data.featured : null,
      months: Array.isArray(data.months) ? data.months.filter(isValid) : []
    };
  } catch (error) {
    console.error('Failed to load playlists.json', error);
    return empty;
  }
}

function isValid(item) {
  return item && item.id && item.year && item.month >= 1 && item.month <= 12;
}

// «July'24» — так они и называются в Spotify.
function playlistName(item) {
  return `${MONTHS.en[item.month - 1]}'${String(item.year).slice(2)}`;
}

// Сводный плейлист идёт первым и заметно выше остальных — он витрина всей серии,
// а не ещё один месяц, поэтому в группировку по годам не попадает.
function renderFeatured(item) {
  const nodes = [];

  const heading = document.createElement('h2');
  heading.textContent = item.name || 'Every month';
  nodes.push(heading);

  if (item.note) {
    LANGS.forEach((lang) => {
      const text = item.note[lang];
      if (!text) return;
      const p = document.createElement('p');
      p.setAttribute('lang', lang);
      p.textContent = text;
      nodes.push(p);
    });
  }

  nodes.push(embed(item.id, item.name || 'Every month', 380));
  return nodes;
}

function renderPlaylist(item) {
  const heading = document.createElement('h3');
  heading.textContent = playlistName(item);

  const caption = document.createElement('p');
  caption.setAttribute('lang', 'ru');
  caption.textContent = `${MONTHS.ru[item.month - 1]} ${item.year}`;

  return [heading, caption, embed(item.id, playlistName(item), 152)];
}

function embed(id, title, height) {
  const frame = document.createElement('iframe');
  frame.src = `https://open.spotify.com/embed/playlist/${id}`;
  frame.width = '100%';
  frame.height = String(height);
  frame.title = title;
  frame.loading = 'lazy';
  frame.frameBorder = '0';
  frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
  frame.setAttribute('style', 'border-radius:12px; max-width:100%;');
  return frame;
}
