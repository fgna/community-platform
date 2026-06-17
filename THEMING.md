# Theming Guide

## Overview

Community Platform uses a runtime CSS variable-based theme system. Themes switch instantly without page reload. Theme preference is persisted to localStorage.

## Available Themes

| Theme | Key | Description |
|-------|-----|-------------|
| Executive Glass | `executive-glass` | Dark luxury with gold accents and glassmorphism (default) |
| Corporate Light | `corporate-light` | Clean professional light theme |
| High Contrast | `high-contrast` | Maximum accessibility, stark contrast |

## CSS Variables

All theme values are applied as CSS custom properties on `:root`:

```css
:root {
  --theme-primary: #c5a880;       /* Main accent color */
  --theme-secondary: #6366f1;    /* Secondary accent */
  --theme-accent: #c5a880;       /* Highlight color */
  --theme-success: #22c55e;
  --theme-warning: #f59e0b;
  --theme-danger: #ef4444;
  --theme-background: #090d16;   /* Page background */
  --theme-surface: rgba(10,15,26,0.85);  /* Sidebar, overlays */
  --theme-card: rgba(17,24,39,0.7);      /* Card backgrounds */
  --theme-text: #f3f4f6;
  --theme-text-muted: #9ca3af;
  --theme-border: rgba(255,255,255,0.08);
  --theme-glow: rgba(197,168,128,0.25);
  --theme-blur: 16px;            /* Backdrop blur amount */
  --sidebar-width: 280px;
}
```

## Using Theme Variables in Components

Use CSS variables directly in inline styles for dynamic theming:

```tsx
// Good — responds to theme changes
<div style={{ background: 'var(--theme-card)', color: 'var(--theme-text)' }}>

// Avoid — hardcoded colors don't respond to theme changes  
<div style={{ background: '#111827', color: '#f3f4f6' }}>
```

For Tailwind classes that map to CSS variables (via `tailwind.config.ts`):
```tsx
<div className="bg-card text-foreground border">
```

## Glassmorphism Utilities

Two utility classes are defined in `globals.css`:

```css
.glass {
  background: var(--theme-surface);
  backdrop-filter: blur(var(--theme-blur));
  border: 1px solid var(--theme-border);
}

.glass-card {
  background: var(--theme-card);
  backdrop-filter: blur(var(--theme-blur));
  border: 1px solid var(--theme-border);
}
```

Note: Themes with `glassmorphism: false` (Corporate Light, High Contrast) set `--theme-blur: 0px`, effectively disabling the effect without requiring conditional code.

## Switching Themes

### Programmatic (in components)
```tsx
import { useTheme } from '@/lib/theme-provider';

function MyComponent() {
  const { theme, setTheme, themes } = useTheme();
  
  return (
    <button onClick={() => setTheme('corporate-light')}>
      Switch to Corporate Light
    </button>
  );
}
```

### Via UI
Use the palette icon in the topbar to access the theme switcher dropdown, or go to Settings → Appearance.

## Adding a Custom Theme

1. Add token definition in `packages/themes/src/`:

```typescript
// packages/themes/src/ocean-blue.ts
import { ThemeTokens } from './tokens';

export const oceanBlue: ThemeTokens = {
  colors: {
    primary: '#0ea5e9',
    secondary: '#6366f1',
    accent: '#0ea5e9',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    background: '#040d1a',
    surface: 'rgba(4, 20, 40, 0.85)',
    card: 'rgba(8, 30, 55, 0.7)',
    text: '#f0f9ff',
    textMuted: '#7dd3fc',
    border: 'rgba(14, 165, 233, 0.12)',
    glow: 'rgba(14, 165, 233, 0.25)',
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
  spacing: { sidebarWidth: '280px' },
  radius: { sm: '4px', md: '8px', lg: '12px', xl: '16px' },
};
```

2. Export from `packages/themes/src/index.ts`

3. Add to the themes array in `apps/web/src/lib/themes.ts`:

```typescript
{
  name: 'ocean-blue',
  displayName: 'Ocean Blue',
  description: 'Deep ocean-inspired dark theme',
  colors: { /* ... */ },
  effects: { /* ... */ },
  sidebarWidth: '280px',
}
```

The theme will automatically appear in the theme switcher.

## Theme Testing

When adding or modifying themes, verify:
- [ ] All text is readable against its background
- [ ] Interactive states (hover, focus, active) are visible
- [ ] Form inputs are distinguishable
- [ ] Error/success states are clear
- [ ] WCAG AA contrast ratio (4.5:1 for text) for Corporate Light and High Contrast themes
