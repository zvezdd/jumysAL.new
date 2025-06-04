import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useThemeContext } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeContext();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-accent 
                hover:bg-gray-100 dark:hover:bg-dark-border transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-accent/20"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <SunIcon className="w-5 h-5 animate-fadeScale" />
      ) : (
        <MoonIcon className="w-5 h-5 animate-fadeScale" />
      )}
    </button>
  );
} 