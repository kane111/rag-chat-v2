# Light & Dark Mode Theme Implementation

## Overview

The RAG Chat application now supports both light and dark themes with seamless switching. The theme preference is persisted to localStorage and respects the user's system preferences as a fallback.

## Features

✅ **Light Mode** - Clean, bright interface optimized for daytime viewing
✅ **Dark Mode** - Easy on the eyes for low-light environments  
✅ **Theme Toggle** - Fixed button in top-right corner for instant switching
✅ **Persistent State** - Theme preference saved to localStorage
✅ **System Preference Detection** - Respects OS dark/light mode setting
✅ **Smooth Transitions** - All color changes animate smoothly
✅ **Complete Coverage** - All components support both themes

## Technical Architecture

### Theme Provider (`app/components/ThemeProvider.tsx`)

The `ThemeProvider` is a React Context-based component that manages the theme state:

- Initializes theme from localStorage or system preference
- Applies theme via `data-theme` attribute and `dark` class on `<html>`
- Provides `useTheme()` hook for accessing theme state
- Handles theme persistence automatically

```tsx
const { theme, toggleTheme } = useTheme();
```

### Theme Toggle Button (`app/components/ThemeToggle.tsx`)

A fixed-position button in the top-right corner that:
- Shows sun icon in light mode
- Shows moon icon in dark mode
- Toggles theme on click
- Uses semantic colors and proper aria-labels

### CSS Variables (`app/globals.css`)

Define base colors for both modes:

```css
:root {
  /* Light mode */
  --background: #ffffff;
  --foreground: #171717;
  /* ... other variables */
}

html[data-theme="dark"],
.dark {
  /* Dark mode overrides */
  --background: #0a0a0a;
  --foreground: #ededed;
}
```

### Tailwind Configuration (`tailwind.config.ts`)

Configured to support dark mode via both:
- CSS class strategy: `class` selector on html element
- Custom data attribute: `[data-theme="dark"]`

```ts
darkMode: ['class', '[data-theme="dark"]'],
```

## Component Updates

All components have been updated with dark mode support using Tailwind's `dark:` prefix:

```tsx
// Example: Light bg with dark mode override
className="bg-white dark:bg-slate-900"

// Example: Light text with dark mode override
className="text-slate-900 dark:text-slate-50"
```

### Components Updated:
- `FileUploadZone.tsx` - Upload area styling
- `FileListItem.tsx` - File list items
- `Modal.tsx` - Dialog boxes
- `Toast.tsx` - Toast notifications
- `ConversationHistory.tsx` - Sidebar history
- `ContextChunks.tsx` - Context display
- `page.tsx` - Main page layout

## Color Palette

### Light Mode
- **Background**: White (#ffffff)
- **Text**: Dark gray (#171717)
- **Cards**: Light backgrounds with subtle borders
- **Accents**: Emerald (#10b981), Sky (#0ea5e9), Purple (#a855f7)

### Dark Mode  
- **Background**: Near-black (#0a0a0a)
- **Text**: Light gray (#ededed)
- **Cards**: Dark slate with transparent overlays
- **Accents**: Same accent colors (maintained)

## Usage

### Basic Usage
Simply wrap your app with the provider in `layout.tsx`:

```tsx
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeToggle } from "./components/ThemeToggle";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <ThemeToggle />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Using the Theme Hook
In any client component:

```tsx
"use client";

import { useTheme } from "./components/ThemeProvider";

export function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Switch from {theme} mode
    </button>
  );
}
```

### Adding Dark Mode to New Components
Use Tailwind's `dark:` prefix:

```tsx
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50">
  Content
</div>
```

## Browser Support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- Respects `prefers-color-scheme` media query
- Graceful degradation for older browsers

## Accessibility

- Proper semantic HTML with role attributes
- ARIA labels on theme toggle
- Sufficient color contrast in both modes
- No reliance on color alone for information

## Testing

To test the implementation:

1. **Toggle Theme**: Click the button in top-right corner
2. **Persistence**: Refresh page - theme preference is saved
3. **System Preference**: Change OS theme setting, clear localStorage, reload
4. **Transitions**: Verify smooth color transitions (200ms)

## Performance

- No layout shift on theme change
- CSS custom properties for efficient updates
- LocalStorage is synchronous (< 1ms)
- No flickering or FOUC (Flash of Unstyled Content)

## Future Enhancements

Potential improvements:
- System time-based automatic theme switching
- Theme selection in user preferences/settings
- Additional theme variants (high contrast, etc.)
- Per-component theme overrides

## Troubleshooting

**Theme not persisting?**
- Check localStorage is enabled in browser
- Clear browser cache and try again
- Check browser console for errors

**Flickering on load?**
- Ensure ThemeProvider wraps all content
- Check script execution order

**Wrong colors showing?**
- Clear browser cache
- Verify Tailwind CSS is compiled correctly
- Check data-theme attribute is set on html element
