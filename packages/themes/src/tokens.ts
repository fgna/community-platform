export interface ThemeTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    background: string;
    surface: string;
    card: string;
    text: string;
    textMuted: string;
    border: string;
    glow: string;
  };
  effects: {
    glassmorphism: boolean;
    shadows: boolean;
    gradients: boolean;
    blur: string;
  };
  typography: {
    fontFamily: string;
    headingFamily: string;
  };
  spacing: {
    sidebarWidth: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}
