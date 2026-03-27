import { useEffect } from 'react';

/**
 * Syncs the app's color scheme with the OS dark/light mode preference.
 * Adds/removes the `dark` class on <html> automatically.
 */
export default function ThemeProvider({ children }) {
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (isDark) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    applyTheme(mq.matches);

    const handler = (e) => applyTheme(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return children;
}