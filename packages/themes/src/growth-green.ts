import { ThemeTokens } from './tokens';

export const growthGreen: ThemeTokens = {
  colors: {
    primary: '#16a34a',
    secondary: '#0891b2',
    accent: '#22c55e',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    background: '#050f09',
    surface: 'rgba(5, 20, 10, 0.85)',
    card: 'rgba(10, 30, 18, 0.7)',
    text: '#f0fdf4',
    textMuted: '#86efac',
    border: 'rgba(34, 197, 94, 0.12)',
    glow: 'rgba(22, 163, 74, 0.25)',
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
