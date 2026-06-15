import { ThemeTokens } from './tokens';

export const executiveGlass: ThemeTokens = {
  colors: {
    primary: '#c5a880',
    secondary: '#6366f1',
    accent: '#c5a880',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    background: '#090d16',
    surface: 'rgba(10, 15, 26, 0.85)',
    card: 'rgba(17, 24, 39, 0.7)',
    text: '#f3f4f6',
    textMuted: '#9ca3af',
    border: 'rgba(255, 255, 255, 0.08)',
    glow: 'rgba(197, 168, 128, 0.25)',
  },
  effects: {
    glassmorphism: true,
    shadows: true,
    gradients: true,
    blur: '16px',
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    headingFamily: 'Inter, system-ui, sans-serif',
  },
  spacing: {
    sidebarWidth: '280px',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
};
