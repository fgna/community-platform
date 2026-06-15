import { ThemeTokens } from './tokens';

export const executiveRed: ThemeTokens = {
  colors: {
    primary: '#dc2626',
    secondary: '#7c3aed',
    accent: '#dc2626',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#dc2626',
    background: '#0f0509',
    surface: 'rgba(20, 5, 10, 0.85)',
    card: 'rgba(30, 10, 15, 0.7)',
    text: '#f3f4f6',
    textMuted: '#9ca3af',
    border: 'rgba(220, 38, 38, 0.15)',
    glow: 'rgba(220, 38, 38, 0.25)',
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
