const POSTS_URL = '/data/posts.json';
const POSTS_DIR = '/blog/posts/';

const BLOG_LABELS = {
  en: 'Blog',
  ru: 'Блог'
};

const NOT_FOUND_TEXT = 'Post not found';

const articleEl = document.querySelector('#blog-article');
const listEl = document.querySelector('#post-list');

if (articleEl && listEl) {
  initBlog();
}

async function initBlog() {
  const posts = await loadPosts();
  if (!posts.length) {
    renderNotFound();
    return;
  }

  const sortedPosts = sortPosts(posts);
  const requestedSlug = getRequestedSlug();

  const render = async () => {
    const currentLang = getCurrentLang();
    const visiblePosts = sortedPosts.filter(
      (post) => !post.draft && matchesLang(post, currentLang)
    );

    let activePost = null;
    if (requestedSlug) {
      activePost = sortedPosts.find((post) => post.slug === requestedSlug) || null;
    } else {
      activePost = visiblePosts[0] || null;
    }

    buildList(visiblePosts, activePost, currentLang);

    if (!activePost) {
      renderNotFound();
      return;
    }

    await loadPostContent(activePost);
    updateTitle(activePost, currentLang);
  };

  const langObserver = new MutationObserver(() => {
    render();
  });

  langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  await render();
}

async function loadPosts() {
  try {
    const response = await fetch(POSTS_URL);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to load posts.json', error);
    return [];
  }
}

function sortPosts(posts) {
  return [...posts].sort((a, b) => {
    const aTime = Date.parse(a.date) || 0;
    const bTime = Date.parse(b.date) || 0;
    return bTime - aTime;
  });
}

function getRequestedSlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get('post');
}

function getCurrentLang() {
  return document.documentElement.lang || localStorage.getItem('site-lang') || 'en';
}

function getPostLang(slug) {
  if (!slug) return null;
  if (slug.endsWith('_ru')) return 'ru';
  if (slug.endsWith('_en')) return 'en';
  return null;
}

function matchesLang(post, lang) {
  const postLang = getPostLang(post.slug);
  if (!postLang) return true;
  return postLang === lang;
}

function getTitle(post, lang) {
  if (!post?.title) return post.slug || '';
  if (typeof post.title === 'string') return post.title;
  return post.title[lang] || post.title.en || post.title.ru || post.slug || '';
}

async function loadPostContent(post) {
  try {
    const response = await fetch(`${POSTS_DIR}${post.slug}.html`);
    if (!response.ok) {
      renderNotFound();
      return;
    }
    const html = await response.text();
    articleEl.innerHTML = html;

    const postLang = getPostLang(post.slug);
    if (postLang) {
      articleEl.setAttribute('lang', postLang);
    } else {
      articleEl.removeAttribute('lang');
    }
  } catch (error) {
    console.error('Failed to load post', error);
    renderNotFound();
  }
}

function buildList(posts, activePost, lang) {
  listEl.innerHTML = '';
  posts.forEach((post) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = `/blog/?post=${encodeURIComponent(post.slug)}`;
    link.textContent = getTitle(post, lang);
    if (activePost && post.slug === activePost.slug) {
      link.classList.add('is-active');
    }
    li.appendChild(link);
    listEl.appendChild(li);
  });
}

function updateTitle(post, lang) {
  const label = BLOG_LABELS[lang] || BLOG_LABELS.en;
  const title = getTitle(post, lang);
  document.title = title ? `${title} — ${label}` : label;
}

function renderNotFound() {
  articleEl.innerHTML = `<p>${NOT_FOUND_TEXT}</p>`;
  document.title = `${NOT_FOUND_TEXT} — ${BLOG_LABELS[getCurrentLang()] || BLOG_LABELS.en}`;
}
