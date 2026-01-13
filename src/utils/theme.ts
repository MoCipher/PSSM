export type Theme = 'light' | 'dark';

const THEME_KEY = 'password_manager_theme_v1';

export const getSavedTheme = (): Theme | null => {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (!t) return null;
    return (t as Theme);
  } catch {
    return null;
  }
};

export const saveTheme = (theme: Theme) => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
};

export const applyTheme = (theme: Theme) => {
  try {
    if (typeof document !== 'undefined' && document.documentElement) {
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    }
  } catch {}
};
