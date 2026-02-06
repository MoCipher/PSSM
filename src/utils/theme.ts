export type Theme = 'light' | 'dark';

const THEME_KEY = 'password_manager_theme_v1';

// Status bar / theme-color values for each screen context
const STATUS_BAR_COLORS = {
  // Loading & login screens share the gradient – use the dominant top color
  login: {
    light: '#667eea',
    dark: '#667eea',
  },
  // Main app screen – match the navbar / top background
  app: {
    light: '#ffffff',   // card-bg / navbar in light mode
    dark: '#0f172a',    // navbar in dark mode
  },
} as const;

export type ScreenContext = keyof typeof STATUS_BAR_COLORS;

/**
 * Update the `<meta name="theme-color">` tag so the browser / OS status bar
 * adapts to the current screen background.
 */
export const setStatusBarColor = (screen: ScreenContext, theme?: Theme) => {
  try {
    if (typeof document === 'undefined') return;
    const isDark = theme === 'dark' ||
      document.documentElement.getAttribute('data-theme') === 'dark';
    const color = STATUS_BAR_COLORS[screen][isDark ? 'dark' : 'light'];
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', color);
  } catch {}
};

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
