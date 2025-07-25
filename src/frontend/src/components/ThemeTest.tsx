import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeTest: React.FC = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className="p-6 rounded-lg bg-background border border-gray-200 dark:border-gray-800 shadow-sm">
      <h2 className="text-2xl font-bold mb-4">Theme Test Component</h2>
      
      <div className="space-y-4">
        <div className="p-4 rounded bg-background-secondary">
          <h3 className="font-semibold mb-2">Current Theme: {theme}</h3>
          <p className="text-foreground-secondary">
            This is a test component to verify the theme system is working correctly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Color Swatches */}
          <div className="p-4 rounded border border-gray-200 dark:border-gray-800">
            <h4 className="font-medium mb-2">Primary</h4>
            <div className="h-12 rounded bg-primary"></div>
            <div className="mt-2 text-xs text-foreground-muted">
              hsl(var(--primary))
            </div>
          </div>

          <div className="p-4 rounded border border-gray-200 dark:border-gray-800">
            <h4 className="font-medium mb-2">Secondary</h4>
            <div className="h-12 rounded bg-secondary border border-gray-200 dark:border-gray-800"></div>
            <div className="mt-2 text-xs text-foreground-muted">
              hsl(var(--secondary))
            </div>
          </div>

          <div className="p-4 rounded border border-gray-200 dark:border-gray-800">
            <h4 className="font-medium mb-2">Accent</h4>
            <div className="h-12 rounded bg-accent"></div>
            <div className="mt-2 text-xs text-foreground-muted">
              hsl(var(--accent))
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-md bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            Toggle to {isDark ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeTest;
