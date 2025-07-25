import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const isDark = theme === 'dark';

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (systemPrefersDark) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  // Apply theme class to document element
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove any existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add the current theme class
    root.classList.add(theme);
    
    // Set data-theme attribute for CSS variables
    root.setAttribute('data-theme', theme);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
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
