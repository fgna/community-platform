import { ThemeTokens } from './tokens';

export const corporateLight: ThemeTokens = {
  colors: {
    primary: '#2563eb',
    secondary: '#7c3aed',
    accent: '#2563eb',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
    background: '#f8fafc',
    surface: 'rgba(255, 255, 255, 0.95)',
    card: 'rgba(255, 255, 255, 0.9)',
    text: '#0f172a',
    textMuted: '#64748b',
    border: 'rgba(0, 0, 0, 0.08)',
    glow: 'rgba(37, 99, 235, 0.15)',
  },
  effects: {
    glassmorphism: false,
    shadows: true,
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
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
};
