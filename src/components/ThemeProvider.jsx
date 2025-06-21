import React, { createContext, useContext, useState, useEffect } from 'react';

// Create Theme Context
const ThemeContext = createContext();

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to 'light'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('clinfinesse-theme');
    return savedTheme || 'light';
  });

  // Toggle between dark and light themes
  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('clinfinesse-theme', newTheme);
      return newTheme;
    });
  };

  // Apply theme to document body for global styling
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    document.body.style.backgroundColor = themeConfig.colors[theme].background;
    document.body.style.color = themeConfig.colors[theme].text;
  }, [theme]);

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme configuration object for easy access
export const themeConfig = {
  colors: {
    primary: '#57c1ef',
    secondary: '#ee3739',
    dark: {
      background: '#1a1a1a',
      surface: '#2d2d2d',
      input: '#3a3a3a',
      border: '#404040',
      text: '#ffffff',
      textSecondary: '#94a3b8',
      hover: '#404040'
    },
    light: {
      background: '#f8fafc',
      surface: '#ffffff',
      input: '#f1f5f9',
      border: '#e2e8f0',
      text: '#1e293b',
      textSecondary: '#64748b',
      hover: '#f1f5f9'
    }
  },
  dark: {
    body: 'bg-gray-900 text-gray-100',
    container: 'bg-gray-800 border-gray-600',
    input: 'bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500',
    button: 'bg-blue-600 hover:bg-blue-700',
    label: 'text-gray-300',
    themeToggle: 'bg-gray-700 hover:bg-gray-600',
    card: 'bg-gray-800 border-gray-700',
    text: {
      primary: 'text-gray-100',
      secondary: 'text-gray-300',
      muted: 'text-gray-400'
    }
  },
  light: {
    body: 'bg-gray-50 text-gray-900',
    container: 'bg-white border-gray-200',
    input: 'bg-white border-gray-300 text-gray-900 focus:border-blue-500',
    button: 'bg-blue-600 hover:bg-blue-700',
    label: 'text-gray-600',
    themeToggle: 'bg-gray-200 hover:bg-gray-300',
    card: 'bg-white border-gray-200',
    text: {
      primary: 'text-gray-900',
      secondary: 'text-gray-600',
      muted: 'text-gray-500'
    }
  }
};