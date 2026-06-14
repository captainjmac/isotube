import {useCallback, useEffect, useState} from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'isotube-theme';

/**
 * Reads the theme that the no-flash script in index.html already applied to
 * <html> before first paint. Falls back to the stored value, then to dark
 * (Iso-Tube's historical default).
 */
function getInitialTheme(): Theme {
    if (typeof document !== 'undefined') {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'dark' || stored === 'light') return stored;
    } catch {
        /* localStorage unavailable */
    }
    return 'dark';
}

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            /* ignore persistence failures */
        }
    }, [theme]);

    const toggle = useCallback(() => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    return {theme, toggle, setTheme};
}
