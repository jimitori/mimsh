export function initThemeSwitcher() {
  const STORAGE_KEY = 'theme-preference';
  const html = document.documentElement;
  
  // 1. Create the button
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'theme-toggle';
  button.ariaLabel = 'Toggle color theme';
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
    <svg xmlns="http://www.w3.org/2000/svg" class="moon" viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
  `;
  
  document.body.appendChild(button);

  // 2. Theme Logic
  const getTheme = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const setTheme = (theme) => {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  };

  // Initial set
  const currentTheme = localStorage.getItem(STORAGE_KEY);
  if (currentTheme) {
    html.setAttribute('data-theme', currentTheme);
  }

  // Toggle handler
  button.addEventListener('click', () => {
    const isDark = html.getAttribute('data-theme') === 'dark' || 
                   (!html.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setTheme(isDark ? 'light' : 'dark');
  });
}
