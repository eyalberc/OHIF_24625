---
sidebar_position: 2
sidebar_label: Theming
title: Theming the OHIF Viewer
summary: Comprehensive documentation on customizing the visual appearance of the OHIF Viewer using the PRD color palette, Tailwind CSS theming, dark mode support, and medical imaging optimizations.
---

# Viewer: Theming

The OHIF Viewer v3 includes a comprehensive theming system that integrates the PRD (Product Requirements Document) color palette with Tailwind CSS and supports both light and dark themes optimized for medical imaging workflows.

## Color System Overview

The OHIF theme system is built on CSS custom properties and Tailwind CSS integration, providing:

- **PRD Color Palette Compliance**: Full implementation of specified design colors
- **Medical Imaging Optimization**: Dark themes optimized for radiology workflows
- **Accessibility Compliance**: WCAG AA/AAA standards for clinical environments
- **Theme Switching**: Seamless light/dark mode transitions
- **Developer-Friendly**: Semantic naming and comprehensive utility classes

## PRD Color Palette

### Core Colors

The following colors are implemented as CSS custom properties and available as Tailwind utility classes:

| Color Purpose | Light Value | Dark Value | CSS Variable | Usage |
|---------------|-------------|------------|--------------|--------|
| **Primary** | `#60A5FA` | `#60A5FA` | `--color-primary` | Interactive elements, brand colors |
| **Background** | `#FFFFFF` | `#111827` | `--color-background` | Main application background |
| **Panel** | `#F9FAFB` | `#1F2937` | `--color-panel` | Cards, panels, containers |
| **Text Primary** | `#111827` | `#F9FAFB` | `--color-text-primary` | Main text content |
| **Text Secondary** | `#6B7280` | `#9CA3AF` | `--color-text-secondary` | Supporting text, labels |
| **Border** | `#E5E7EB` | `#374151` | `--color-border` | Borders, dividers |

### Status Colors

| Status | Light Value | Dark Value | CSS Variable | Usage |
|--------|-------------|------------|--------------|--------|
| **Warning** | `#FACC15` | `#FACC15` | `--color-warning` | Caution states, alerts |
| **Success** | `#22C55E` | `#22C55E` | `--color-success` | Confirmation, completed states |
| **Error** | `#F87171` | `#F87171` | `--color-error` | Error states, critical alerts |
| **Info** | `#60A5FA` | `#60A5FA` | `--color-info` | Information, neutral states |

## CSS Custom Properties

### Using CSS Variables

All colors are available as CSS custom properties for direct use in stylesheets:

```css
/* Direct CSS usage */
.medical-panel {
  background-color: hsl(var(--color-panel));
  color: hsl(var(--color-text-primary));
  border: 1px solid hsl(var(--color-border));
}

/* Status indicators */
.warning-alert {
  background-color: hsl(var(--warning-bg));
  color: hsl(var(--warning-text));
  border-color: hsl(var(--warning-border));
}
```

### Theme-Aware Styling

Colors automatically adapt to light/dark themes:

```css
/* Automatically switches between light/dark variants */
.study-browser-item {
  background: hsl(var(--color-panel));
  color: hsl(var(--color-text-primary));
  transition: background-color 0.2s ease;
}

.study-browser-item:hover {
  background: hsl(var(--color-background));
}
```

## Tailwind CSS Integration

### Utility Classes

All PRD colors are available as Tailwind utility classes:

```html
<!-- Background colors -->
<div class="bg-prd-panel">Panel background</div>
<div class="bg-prd-background">App background</div>

<!-- Text colors -->
<p class="text-prd-text-primary">Primary text</p>
<p class="text-prd-text-secondary">Secondary text</p>

<!-- Border colors -->
<div class="border border-prd-border">Bordered element</div>

<!-- Status colors -->
<div class="bg-warning text-warning-text">Warning message</div>
<div class="bg-success text-success-text">Success message</div>
<div class="bg-error text-error-text">Error message</div>
```

### Semantic Color Classes

Use semantic classes for consistent theming:

```html
<!-- Button components -->
<button class="bg-primary text-primary-foreground hover:bg-primary/90">
  Primary Action
</button>

<button class="bg-secondary text-secondary-foreground hover:bg-secondary/80">
  Secondary Action
</button>

<!-- Status indicators with proper contrast -->
<div class="bg-warning-bg text-warning-text border-warning-border">
  Warning: Check study parameters
</div>

<div class="bg-error-bg text-error-text border-error-border">
  Error: Failed to load images
</div>
```

## Dark Theme Support

### Medical Imaging Optimization

The dark theme is specifically optimized for medical imaging workflows:

- **Ultra-dark backgrounds** (< 5% luminance) for optimal image contrast
- **High text contrast** (7:1 ratio preferred) for clinical readability
- **Status colors** that don't interfere with medical image interpretation
- **Accessibility compliance** with WCAG AA/AAA standards

### Theme Switching

Implement theme switching in your components:

```jsx
import { useTheme } from '@/hooks/useTheme';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="bg-prd-panel text-prd-text-primary hover:bg-prd-background p-2 rounded"
    >
      {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Light' : 'Dark'} Mode
    </button>
  );
}
```

## Component Standards

### Button Components

Standardized button color patterns:

```html
<!-- Primary buttons -->
<button class="bg-primary text-primary-foreground hover:bg-primary/90">
  Primary Action
</button>

<!-- Secondary buttons -->
<button class="bg-secondary text-secondary-foreground hover:bg-secondary/80">
  Secondary Action
</button>

<!-- Destructive buttons -->
<button class="bg-destructive text-destructive-foreground hover:bg-destructive/90">
  Delete Study
</button>
```

### Medical UI Components

Specialized medical interface patterns:

```html
<!-- Study browser panels -->
<div class="bg-prd-panel border border-prd-border rounded-lg p-4">
  <h3 class="text-prd-text-primary font-semibold">Study Information</h3>
  <p class="text-prd-text-secondary text-sm">Patient: John Doe</p>
</div>

<!-- Status indicators for medical workflows -->
<div class="bg-success-bg text-success-text border-success-border rounded px-3 py-1">
  ✓ Study Loaded Successfully
</div>

<div class="bg-warning-bg text-warning-text border-warning-border rounded px-3 py-1">
  ⚠ Large Study - May Take Time to Load
</div>

<div class="bg-error-bg text-error-text border-error-border rounded px-3 py-1">
  ✗ Failed to Connect to PACS
</div>
```

## Migration Guide

### Updating Existing Components

Replace hardcoded colors with theme variables:

```css
/* Before: Hardcoded colors */
.my-component {
  background-color: #1F2937;
  color: #F9FAFB;
  border: 1px solid #374151;
}

/* After: Theme variables */
.my-component {
  background-color: hsl(var(--color-panel));
  color: hsl(var(--color-text-primary));
  border: 1px solid hsl(var(--color-border));
}
```

### Tailwind Class Updates

Update Tailwind classes to use semantic colors:

```html
<!-- Before: Generic colors -->
<div class="bg-gray-800 text-white border-gray-600">

<!-- After: Semantic PRD colors -->
<div class="bg-prd-panel text-prd-text-primary border-prd-border">
```

## White Labeling

### Custom Logo Integration

Replace the OHIF logo with your organization's branding:

```js
window.config = {
  whiteLabeling: {
    createLogoComponentFn: function(React) {
      return React.createElement(
        'div',
        {
          className: 'flex items-center space-x-2',
        },
        React.createElement('img', {
          src: './custom-logo.svg',
          className: 'h-8 w-8',
          alt: 'Medical Center Logo'
        }),
        React.createElement(
          'span',
          {
            className: 'text-prd-text-primary font-semibold text-lg'
          },
          'Medical Center PACS'
        )
      );
    },
  },
};
```

## Development Tools

### Color Validation

Use built-in validation tools during development:

```javascript
// Browser console validation
validatePRDColors();        // Validate PRD color integration
validateDarkTheme();        // Validate dark theme compliance
validateComponentColors();  // Validate component color consistency
```

## Best Practices

### Medical Imaging Workflows

1. **Use dark themes** for radiology reading sessions
2. **Minimize eye strain** with appropriate contrast ratios
3. **Maintain consistency** across different study types
4. **Test with real data** to ensure color choices don't interfere with diagnosis

### Developer Guidelines

1. **Always use theme variables** instead of hardcoded colors
2. **Test both light and dark themes** during development
3. **Validate accessibility** before deployment
4. **Use semantic color names** for maintainability
5. **Follow component standards** for consistency

---

For additional information on OHIF customization, see:
- [Layout Templates](./extensions/modules/layout-template.md)
- [Extension Development](./extensions/README.md)
- [Configuration Guide](../configuration/README.md)
