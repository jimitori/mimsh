export async function initSidebar(root) {
  const navEl = root.querySelector('#main-nav');
  if (!navEl) return;

  // load nav.json
  const response = await fetch('/data/nav.json');
  const navData = await response.json();

  // Language Logic
  const supportedLangs = navData.languages || [];
  let currentLang = localStorage.getItem('site-lang') || 'en';

  // Ensure valid lang
  if (!supportedLangs.find(l => l.code === currentLang)) {
    currentLang = supportedLangs[0]?.code || 'en';
  }

  // Apply immediately
  document.documentElement.lang = currentLang;

  // Helper to get text
  const getLocalized = (item) => {
    if (typeof item.title === 'object') {
      return item.title[currentLang] || item.title['en'] || '?';
    }
    return item.title;
  };

  // Helper to update page title
  const updatePageTitle = () => {
    // 1. Try DOM (for pages with explicit lang titles like index.html)
    const titleEl = document.head.querySelector(`title[lang="${currentLang}"]`);
    if (titleEl && titleEl.innerText) {
      document.title = titleEl.innerText;
      return;
    }

    // 2. Try Nav Data (for pages found in nav.json)
    const currentPath = normalisePath(window.location.pathname);
    const page = navData.pages.find(p => {
      // Handle external URLs vs internal paths
      try {
        const pageUrl = new URL(p.url, window.location.origin);
        if (pageUrl.origin !== window.location.origin) return false;
        return normalisePath(pageUrl.pathname) === currentPath;
      } catch (e) {
        return false;
      }
    });

    if (page) {
      document.title = getLocalized(page);
    }
  };

  // Render Function
  const renderNav = () => {
    // Look for existing container or create one
    let navGroupsContainer = navEl.querySelector('.nav-groups-container');
    if (!navGroupsContainer) {
      navGroupsContainer = document.createElement('div');
      navGroupsContainer.className = 'nav-groups-container';
      navEl.appendChild(navGroupsContainer);
    } else {
      navGroupsContainer.innerHTML = '';
    }

    const currentPath = normalisePath(window.location.pathname);
    const groups = [...navData.groups].sort((a, b) => (a.order || 0) - (b.order || 0));
    const pages = navData.pages || [];

    groups.forEach(group => {
      const groupEl = buildGroup(group, pages, currentPath, getLocalized);
      if (groupEl) navGroupsContainer.appendChild(groupEl);
    });
  };

  // Initialize Switcher
  if (supportedLangs.length > 0) {
    const langSwitcher = document.createElement('div');
    langSwitcher.className = 'lang-switcher';

    supportedLangs.forEach(lang => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-btn';
      btn.textContent = lang.label;
      if (lang.code === currentLang) btn.classList.add('is-active');

      btn.addEventListener('click', () => {
        // Update State
        currentLang = lang.code;
        localStorage.setItem('site-lang', currentLang);
        document.documentElement.lang = currentLang;

        // Update Switcher UI
        langSwitcher.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        // Update Title
        updatePageTitle();

        // Re-render Nav
        renderNav();
      });

      langSwitcher.appendChild(btn);
    });

    // Check/Create Icon first if missing
    if (!navEl.querySelector('.nav-icon')) {
      const iconLink = document.createElement('a');
      iconLink.href = '/';
      iconLink.className = 'nav-icon';
      const iconImg = document.createElement('img');
      iconImg.src = '/img/icon.png';
      iconImg.alt = 'Home';
      iconLink.appendChild(iconImg);
      navEl.prepend(iconLink);
    }

    // Random Icon Hover Effect
    const randomIcons = [
      '/img/icon-random/img - 0.svg',
      '/img/icon-random/img - 1.svg',
      '/img/icon-random/img - 2.svg',
      '/img/icon-random/img - 3.svg',
      '/img/icon-random/img - 4.svg',
      '/img/icon-random/img - 5.png',
      '/img/icon-random/img - 6.png',
      '/img/icon-random/img - 7.png',
      '/img/icon-random/img - 8.png'
    ];

    const iconImg = navEl.querySelector('.nav-icon img');
    if (iconImg) {
      const originalSrc = iconImg.src;

      iconImg.addEventListener('mouseenter', () => {
        const randomIndex = Math.floor(Math.random() * randomIcons.length);
        iconImg.src = randomIcons[randomIndex];
      });

      iconImg.addEventListener('mouseleave', () => {
        iconImg.src = originalSrc;
      });
    }

    const icon = navEl.querySelector('.nav-icon');
    if (icon) {
      icon.after(langSwitcher);
    } else {
      navEl.prepend(langSwitcher);
    }
  }

  // Initial Render
  renderNav();
  updatePageTitle();

  // Mobile Menu Logic
  if (!document.querySelector('.mobile-nav-toggle')) {
    const mobileToggle = document.createElement('button');
    mobileToggle.className = 'mobile-nav-toggle';
    mobileToggle.ariaLabel = 'Toggle navigation';
    mobileToggle.innerHTML = '<span class="bar"></span><span class="bar"></span><span class="bar"></span>';

    mobileToggle.addEventListener('click', () => {
      document.body.classList.toggle('is-mobile-nav-open');
      mobileToggle.classList.toggle('is-active');
    });

    document.body.appendChild(mobileToggle);
  }
}

function normalisePath(path) {
  if (!path.endsWith('/')) return path;
  return path.replace(/\/+$/, '/') || '/';
}

function buildGroup(group, pages, currentPath, getLocalized) {
  const relatedPages = pages
    .filter(p => (p.groups || []).includes(group.id))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const groupWrapper = document.createElement('section');
  groupWrapper.className = 'nav-group';

  const header = document.createElement('div');
  header.className = 'nav-group-header';

  const groupLink = document.createElement('a');
  groupLink.className = 'nav-group-link';
  const groupUrl = group.url || `/${group.id}/`;
  groupLink.href = groupUrl;
  groupLink.textContent = getLocalized(group);

  // Check if external group link
  const isExternalGroup = groupUrl.startsWith('http://') || groupUrl.startsWith('https://');
  if (isExternalGroup) {
    groupLink.target = '_blank';
    groupLink.rel = 'noopener noreferrer';
  }

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-group-toggle';
  toggle.setAttribute('aria-label', `Toggle ${getLocalized(group)}`);

  const list = document.createElement('ul');
  list.className = 'nav-group-list';

  let hasActive = false;

  relatedPages.forEach(page => {
    const li = document.createElement('li');
    li.className = 'nav-item';

    const a = document.createElement('a');
    a.href = page.url;
    a.textContent = getLocalized(page);

    // Check if external link
    const isExternal = page.url.startsWith('http://') || page.url.startsWith('https://');
    if (isExternal) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }

    // Check if Telegram link
    const isTelegram = page.url.includes('t.me');
    if (isTelegram) {
      const icon = document.createElement('img');
      icon.src = '/img/telegram_logo.svg';
      icon.alt = '';
      icon.className = 'telegram-icon';
      a.appendChild(document.createTextNode(' '));
      a.appendChild(icon);
    }

    const pagePath = normalisePath(new URL(a.href, window.location.origin).pathname);
    if (pagePath === currentPath) {
      a.classList.add('is-active');
      hasActive = true;
    }

    li.appendChild(a);
    list.appendChild(li);
  });

  const hasChildren = relatedPages.length > 0;

  if (!isExternalGroup) {
    const groupPath = normalisePath(new URL(groupLink.href, window.location.origin).pathname);
    if (groupPath === currentPath) {
      groupLink.classList.add('is-active');
      hasActive = true;
    }
  }

  // open state
  const isInitiallyOpen = hasActive;
  if (isInitiallyOpen) {
    groupWrapper.classList.add('is-open');
  }

  const setToggleState = (isOpen) => {
    toggle.textContent = isOpen ? '↑' : '↓';
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  };

  if (hasChildren) {
    setToggleState(isInitiallyOpen);

    toggle.addEventListener('click', () => {
      const isOpen = groupWrapper.classList.toggle('is-open');
      setToggleState(isOpen);
    });
  } else {
    toggle.classList.add('is-hidden');
    toggle.setAttribute('aria-hidden', 'true');
  }

  header.appendChild(groupLink);
  if (hasChildren) {
    header.appendChild(toggle);
  }
  groupWrapper.appendChild(header);
  if (hasChildren) {
    groupWrapper.appendChild(list);
  }
  return groupWrapper;
}
