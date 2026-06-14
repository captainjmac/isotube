import {Moon, Sun} from 'lucide-react';
import {useTheme} from '@/hooks/useTheme';

export function ThemeToggle() {
    const {theme, toggle} = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
            {isDark
                ? <Sun className="w-5 h-5"/>
                : <Moon className="w-5 h-5"/>}
        </button>
    );
}
