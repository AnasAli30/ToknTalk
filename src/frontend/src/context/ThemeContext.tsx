import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('dark', 'light');
    
    // Add new theme class
    root.classList.add(theme);
    
    // Update CSS custom properties for smooth transitions
    if (theme === 'dark') {
      root.style.setProperty('--transition-duration', '0.3s');
    } else {
      root.style.setProperty('--transition-duration', '0.3s');
    }
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const value = {
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// CSS variables for themes using the design system colors
export const themeVars = `
  :root {
    /* Base Colors */
    --primary: 0 0% 0%;         /* #000000 */
    --secondary: 0 0% 100%;    /* #FFFFFF */
    --accent: 265 100% 69%;    /* #A259FF */
    
    /* Light Theme */
    --background: 0 0% 100%;
    --background-secondary: 0 0% 98%;
    --background-accent: 0 0% 96%;
    --foreground: 0 0% 0%;
    --foreground-secondary: 0 0% 30%;
    --foreground-muted: 0 0% 60%;
    --border: 0 0% 90%;
    --input: 0 0% 95%;
    --ring: 265 100% 69%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 0%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 100%;
    --success: 142 72% 45%;
    --warning: 38 92% 50%;
    --info: 217 91% 60%;
    
    /* Spacing */
    --radius: 0.5rem;
    --spacing-1: 0.25rem;
    --spacing-2: 0.5rem;
    --spacing-3: 0.75rem;
    --spacing-4: 1rem;
    --spacing-5: 1.25rem;
    
    /* Typography */
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    --font-heading: 'Space Grotesk', var(--font-sans);
    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  }
  
  .dark {
    --background: 0 0% 4%;
    --background-secondary: 0 0% 8%;
    --background-accent: 0 0% 12%;
    --foreground: 0 0% 100%;
    --foreground-secondary: 0 0% 80%;
    --foreground-muted: 0 0% 60%;
    --border: 0 0% 15%;
    --input: 0 0% 20%;
    --ring: 265 100% 69%;
    --card: 0 0% 8%;
    --card-foreground: 0 0% 100%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;
    --success: 142 72% 45%;
    --warning: 38 92% 50%;
    --info: 217 91% 60%;
  }
`;
