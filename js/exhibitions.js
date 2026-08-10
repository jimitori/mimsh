// Читает тот же /data/lectures.json, что и страница расписания, и показывает только выставки.
// Один источник данных на оба места — выставка не может разойтись сама с собой.

const EVENTS_URL = '/data/lectures.json';
const LANGS = ['ru', 'en'];

const rootEl = document.querySelector('#exhibitions');

if (rootEl) {
  initExhibitions();
}

async function initExhibitions() {
  const events = await loadEvents();
  const exhibitions = events
    .filter((item) => item.type === 'exhibition')
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  if (!exhibitions.length) return;

  rootEl.innerHTML = '';
  exhibitions.forEach((item) => rootEl.append(...render(item)));
}

async function loadEvents() {
  try {
    const response = await fetch(EVENTS_URL);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to load lectures.json', error);
    return [];
  }
}

function pick(value, lang) {
  if (!value) return '';
  return typeof value === 'string' ? value : value[lang] || value.en || value.ru || '';
}

// Название берём из отдельного поля `name`, а не режем из `title`: в самих названиях
// встречается тире («Я — Яблоко»), и любой парсер на нём спотыкается.
function exhibitionName(item, lang) {
  return pick(item.name, lang) || pick(item.title, lang);
}

function render(item) {
  return LANGS.map((lang) => {
    const section = document.createElement('section');
    section.setAttribute('lang', lang);

    const h2 = document.createElement('h2');
    const name = exhibitionName(item, lang);
    if (item.url) {
      const a = document.createElement('a');
      a.href = item.url;
      a.textContent = name;
      h2.appendChild(a);
    } else {
      h2.textContent = name;
    }
    section.appendChild(h2);

    const meta = document.createElement('p');
    meta.textContent = [String(item.date).slice(0, 4), pick(item.venue, lang)]
      .filter(Boolean)
      .join(' · ');
    section.appendChild(meta);

    const description = pick(item.description, lang);
    if (description) {
      const p = document.createElement('p');
      p.textContent = description;
      section.appendChild(p);
    }

    if (item.image) {
      const img = document.createElement('img');
      img.src = item.image;
      img.alt = name;
      img.loading = 'lazy';
      section.appendChild(img);
    }

    return section;
  });
}
