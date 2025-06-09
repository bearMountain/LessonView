import React, { createContext, useContext, useCallback, useReducer, useEffect } from 'react';
import type { Theme } from '../themes';
import { getThemeByName, applyThemeToCSSVars, darkTheme } from '../themes';

// Theme state interface
interface ThemeState {
  currentTheme: string;
}

// Theme actions
type ThemeAction = 
  | { type: 'SET_THEME'; payload: string };

// Theme context value
interface ThemeContextValue {
  currentTheme: string;
  theme: Theme;
  setTheme: (themeName: string) => void;
}

// Create context
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Theme reducer
const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  switch (action.type) {
    case 'SET_THEME':
      return {
        ...state,
        currentTheme: action.payload
      };
    default:
      return state;
  }
};

// Initial state
const initialState: ThemeState = {
  currentTheme: 'dark'
};

// Theme provider component
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'dark' 
}) => {
  const [state, dispatch] = useReducer(themeReducer, {
    ...initialState,
    currentTheme: defaultTheme
  });
  
  const theme = getThemeByName(state.currentTheme);
  
  // Apply theme to CSS variables whenever theme changes
  useEffect(() => {
    applyThemeToCSSVars(theme);
  }, [theme]);
  
  // Theme setter with localStorage persistence
  const setTheme = useCallback((themeName: string) => {
    dispatch({ type: 'SET_THEME', payload: themeName });
    
    // Persist theme preference
    try {
      localStorage.setItem('strumstick-theme', themeName);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }, []);
  
  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('strumstick-theme');
      if (savedTheme && savedTheme !== state.currentTheme) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
    }
  }, []);
  
  const contextValue: ThemeContextValue = {
    currentTheme: state.currentTheme,
    theme,
    setTheme
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Convenience hook for just the theme object
export const useThemeObject = (): Theme => {
  const { theme } = useTheme();
  return theme;
}; 