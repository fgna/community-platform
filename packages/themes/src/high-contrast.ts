import { ThemeTokens } from './tokens';

export const highContrast: ThemeTokens = {
  colors: {
    primary: '#ffffff',
    secondary: '#ffff00',
    accent: '#00ffff',
    success: '#00ff00',
    warning: '#ffff00',
    danger: '#ff0000',
    background: '#000000',
    surface: '#0a0a0a',
    card: '#111111',
    text: '#ffffff',
    textMuted: '#cccccc',
    border: 'rgba(255, 255, 255, 0.3)',
    glow: 'rgba(255, 255, 255, 0.1)',
  },
  effects: {
    glassmorphism: false,
    shadows: false,
    gradients: false,
    blur: '0px',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    headingFamily: 'Inter, system-ui, sans-serif',
  },
  spacing: {
    sidebarWidth: '280px',
  },
  radius: {
    sm: '2px',
    md: '4px',
    lg: '6px',
    xl: '8px',
  },
};
