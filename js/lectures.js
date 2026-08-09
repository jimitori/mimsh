const LECTURES_URL = '/data/lectures.json';

const LANGS = ['ru', 'en'];

const LABELS = {
  past: { ru: 'Прошедшие события', en: 'Past events' },
  venue: { ru: 'Место', en: 'Venue' },
  language: { ru: 'Язык', en: 'Language' },
  cost: { ru: 'Стоимость', en: 'Cost' }
};

// A full YYYY-MM-DD date that hasn't arrived yet. Year-only entries are always past —
// nothing is ever announced with year precision. Deriving this from the date is the whole
// point: an announcement can't go stale because no one remembered to move it.
const FULL_DATE = /^\d{4}-\d{2}-\d{2}$/;

const rootEl = document.querySelector('#schedule');

if (rootEl) {
  initSchedule();
}

async function initSchedule() {
  const lectures = await loadLectures();
  if (!lectures.length) return;

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = lectures
    .filter((item) => isUpcoming(item, today))
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = lectures
    .filter((item) => !isUpcoming(item, today))
    .sort((a, b) => b.date.localeCompare(a.date));

  rootEl.innerHTML = '';
  upcoming.forEach((item) => rootEl.append(...renderUpcoming(item)));
  if (past.length) rootEl.append(...renderPast(past));
}

async function loadLectures() {
  try {
    const response = await fetch(LECTURES_URL);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to load lectures.json', error);
    return [];
  }
}

function isUpcoming(item, today) {
  return FULL_DATE.test(item.date || '') && item.date >= today;
}

function pick(value, lang) {
  if (!value) return '';
  return typeof value === 'string' ? value : value[lang] || value.en || value.ru || '';
}

function renderUpcoming(item) {
  return LANGS.map((lang) => {
    const p = document.createElement('p');
    p.setAttribute('lang', lang);

    const strong = document.createElement('strong');
    strong.appendChild(linkOrText(item, lang));
    p.appendChild(strong);
    p.appendChild(document.createElement('br'));

    const lines = [
      [formatDate(item.date, lang), item.time].filter(Boolean).join(', '),
      row(LABELS.venue[lang], pick(item.venue, lang)),
      row(LABELS.language[lang], pick(item.language, lang)),
      row(LABELS.cost[lang], pick(item.cost, lang))
    ].filter(Boolean);

    lines.forEach((line) => {
      p.appendChild(document.createTextNode(line));
      p.appendChild(document.createElement('br'));
    });

    const description = pick(item.description, lang);
    if (description) {
      p.appendChild(document.createElement('br'));
      p.appendChild(document.createTextNode(description));
    }

    return p;
  });
}

function renderPast(past) {
  const nodes = LANGS.map((lang) => {
    const h2 = document.createElement('h2');
    h2.setAttribute('lang', lang);
    h2.textContent = LABELS.past[lang];
    return h2;
  });

  const years = [...new Set(past.map((item) => String(item.date).slice(0, 4)))];

  years.forEach((year) => {
    const h3 = document.createElement('h3');
    h3.textContent = year;
    nodes.push(h3);

    const ul = document.createElement('ul');
    past
      .filter((item) => String(item.date).slice(0, 4) === year)
      .forEach((item) => {
        LANGS.forEach((lang) => {
          const li = document.createElement('li');
          li.setAttribute('lang', lang);
          li.appendChild(linkOrText(item, lang));
          ul.appendChild(li);
        });
      });
    nodes.push(ul);
  });

  return nodes;
}

function linkOrText(item, lang) {
  const title = pick(item.title, lang);
  if (!item.url) return document.createTextNode(title);

  const a = document.createElement('a');
  a.href = item.url;
  a.textContent = title;
  return a;
}

function row(label, value) {
  return value ? `${label}: ${value}` : '';
}

function formatDate(value, lang) {
  if (!FULL_DATE.test(value || '')) return value || '';
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;

  const formatted = new Date(parsed).toLocaleDateString(lang === 'ru' ? 'ru' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // ru locale appends " г." — the rest of the site doesn't use it.
  return formatted.replace(/\s*г\.$/, '');
}
