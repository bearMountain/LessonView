export interface Theme {
  name: string;
  displayName: string;
  
  // Background colors
  bg: {
    primary: string;
    secondary: string;
    workspace: string;
    elevated: string;
  };
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  
  // Note visualization
  notes: {
    filled: {
      fill: string;
      stroke: string;
      text: string;
    };
    open: {
      fill: string;
      stroke: string;
      text: string;
    };
    selected: {
      fill: string;
      stroke: string;
      text: string;
    };
  };
  
  // Tab elements
  tab: {
    stringLine: string;
    stringLabel: string;
    measureLine: string;
    cursor: string;
    playhead: string;
    selection: string;
  };
  
  // UI elements
  ui: {
    border: string;
    borderLight: string;
    borderFocus: string;
    hover: string;
    active: string;
  };
}

// Dark theme (default)
export const darkTheme: Theme = {
  name: 'dark',
  displayName: 'Dark',
  
  bg: {
    primary: '#1e1e1e',
    secondary: '#2d2d30',
    workspace: '#1e1e1e',
    elevated: '#3c3c3c',
  },
  
  text: {
    primary: '#ffffff',
    secondary: '#cccccc',
    tertiary: '#969696',
    inverse: '#000000',
  },
  
  notes: {
    filled: {
      fill: '#ffffff',
      stroke: '#ffffff',
      text: '#000000',
    },
    open: {
      fill: 'transparent',
      stroke: '#ffffff',
      text: '#ffffff',
    },
    selected: {
      fill: '#3b82f6',
      stroke: '#1d4ed8',
      text: '#ffffff',
    },
  },
  
  tab: {
    stringLine: '#cccccc',
    stringLabel: '#ffffff',
    measureLine: '#969696',
    cursor: '#ef4444',
    playhead: '#10b981',
    selection: '#3b82f6',
  },
  
  ui: {
    border: '#3e3e42',
    borderLight: '#4d4d52',
    borderFocus: '#2563eb',
    hover: 'rgba(255, 255, 255, 0.1)',
    active: 'rgba(255, 255, 255, 0.15)',
  },
};

// Light theme
export const lightTheme: Theme = {
  name: 'light',
  displayName: 'Light',
  
  bg: {
    primary: '#ffffff',
    secondary: '#f3f4f6',
    workspace: '#ffffff',
    elevated: '#ffffff',
  },
  
  text: {
    primary: '#111827',
    secondary: '#374151',
    tertiary: '#6b7280',
    inverse: '#ffffff',
  },
  
  notes: {
    filled: {
      fill: '#000000',
      stroke: '#000000',
      text: '#ffffff',
    },
    open: {
      fill: 'transparent',
      stroke: '#000000',
      text: '#000000',
    },
    selected: {
      fill: '#3b82f6',
      stroke: '#1d4ed8',
      text: '#ffffff',
    },
  },
  
  tab: {
    stringLine: '#374151',
    stringLabel: '#111827',
    measureLine: '#6b7280',
    cursor: '#ef4444',
    playhead: '#10b981',
    selection: '#3b82f6',
  },
  
  ui: {
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    borderFocus: '#2563eb',
    hover: 'rgba(0, 0, 0, 0.05)',
    active: 'rgba(0, 0, 0, 0.1)',
  },
};

// High contrast theme for accessibility
export const highContrastTheme: Theme = {
  name: 'high-contrast',
  displayName: 'High Contrast',
  
  bg: {
    primary: '#000000',
    secondary: '#1a1a1a',
    workspace: '#000000',
    elevated: '#2a2a2a',
  },
  
  text: {
    primary: '#ffffff',
    secondary: '#ffffff',
    tertiary: '#cccccc',
    inverse: '#000000',
  },
  
  notes: {
    filled: {
      fill: '#ffff00',
      stroke: '#ffffff',
      text: '#000000',
    },
    open: {
      fill: 'transparent',
      stroke: '#ffff00',
      text: '#ffff00',
    },
    selected: {
      fill: '#00ff00',
      stroke: '#ffffff',
      text: '#000000',
    },
  },
  
  tab: {
    stringLine: '#ffffff',
    stringLabel: '#ffffff',
    measureLine: '#cccccc',
    cursor: '#ff0000',
    playhead: '#00ff00',
    selection: '#00ff00',
  },
  
  ui: {
    border: '#ffffff',
    borderLight: '#cccccc',
    borderFocus: '#00ff00',
    hover: 'rgba(255, 255, 255, 0.2)',
    active: 'rgba(255, 255, 255, 0.3)',
  },
};

// Export all available themes
export const availableThemes = [darkTheme, lightTheme, highContrastTheme];

// Helper to get theme by name
export const getThemeByName = (themeName: string): Theme => {
  const theme = availableThemes.find(t => t.name === themeName);
  return theme || darkTheme;
};

// Theme utility functions
export const applyThemeToCSSVars = (theme: Theme): void => {
  const root = document.documentElement;
  
  // Apply CSS custom properties
  root.style.setProperty('--color-bg-primary', theme.bg.primary);
  root.style.setProperty('--color-bg-secondary', theme.bg.secondary);
  root.style.setProperty('--color-bg-workspace', theme.bg.workspace);
  root.style.setProperty('--color-bg-elevated', theme.bg.elevated);
  
  root.style.setProperty('--color-text-primary', theme.text.primary);
  root.style.setProperty('--color-text-secondary', theme.text.secondary);
  root.style.setProperty('--color-text-tertiary', theme.text.tertiary);
  root.style.setProperty('--color-text-inverse', theme.text.inverse);
  
  root.style.setProperty('--color-border', theme.ui.border);
  root.style.setProperty('--color-border-light', theme.ui.borderLight);
  root.style.setProperty('--color-border-focus', theme.ui.borderFocus);
  root.style.setProperty('--color-hover-bg', theme.ui.hover);
  root.style.setProperty('--color-active-bg', theme.ui.active);
  
  // Tab-specific properties
  root.style.setProperty('--color-string-line', theme.tab.stringLine);
  root.style.setProperty('--color-string-label', theme.tab.stringLabel);
  root.style.setProperty('--color-measure-line', theme.tab.measureLine);
  root.style.setProperty('--color-cursor', theme.tab.cursor);
  root.style.setProperty('--color-playhead', theme.tab.playhead);
  root.style.setProperty('--color-selection', theme.tab.selection);
}; 