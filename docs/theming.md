# Theming System & Design Tokens — Vende Más Mobile App

## 1. Overview

The styling system combines **NativeWind v4** with CSS Custom Properties and semantic color tokens.

### Theme Palette Concept:
- **Light Theme**: Crisp White, Carbon Black & Carmine Red (`hsl(0, 0%, 100%)` / `hsl(0, 0%, 9%)` / `hsl(0, 84%, 50%)`).
- **Dark Theme**: Jet Black, Pure White & Electric Carmine Red (`hsl(0, 0%, 4%)` / `hsl(0, 0%, 98%)` / `hsl(0, 85%, 58%)`).

---

## 2. Color Token Catalog

| Token | Purpose | Light Value (HSL) | Dark Value (HSL) |
| :--- | :--- | :--- | :--- |
| `background` | Screen background | `0 0% 100%` | `0 0% 4%` |
| `foreground` | Primary text and icons | `0 0% 9%` | `0 0% 98%` |
| `primary` | Brand action color (Carmine Red) | `0 84% 50%` | `0 85% 58%` |
| `primary-foreground` | Text on primary | `0 0% 100%` | `0 0% 100%` |
| `secondary` | Secondary tone (Graphite / Frost) | `0 0% 12%` | `0 0% 92%` |
| `secondary-foreground` | Text on secondary | `0 0% 98%` | `0 0% 9%` |
| `card` | Card surface | `0 0% 100%` | `0 0% 8%` |
| `card-foreground` | Text on card | `0 0% 9%` | `0 0% 98%` |
| `muted` | Muted backgrounds | `0 0% 96%` | `0 0% 14%` |
| `muted-foreground` | Subdued text | `0 0% 45%` | `0 0% 65%` |
| `accent` | Subtle accent wash | `0 85% 97%` | `0 50% 15%` |
| `accent-foreground` | Text on accent | `0 84% 45%` | `0 85% 65%` |
| `destructive` | Danger / Error states | `0 84% 55%` | `0 84% 55%` |
| `success` | Positive confirmation | `142 71% 38%` | `142 71% 42%` |
| `warning` | Caution / Alerts | `38 92% 50%` | `38 92% 55%` |
| `border` | Borders and dividers | `0 0% 89%` | `0 0% 18%` |
| `ring` | Focus indicator | `0 84% 50%` | `0 85% 58%` |

---

## 3. Theme Toggle Modes

The app supports 3 theme settings via `useThemeStore`:
- `'system'`: Automatically follows the operating system mode.
- `'light'`: Forces light mode.
- `'dark'`: Forces dark mode.

Persistence is handled synchronously with MMKV, preventing theme flickering on app boot.

---

## 4. Usage in Components

### Tailwind / NativeWind Classes
Always use semantic utility classes:

```tsx
// ✅ Correct
<View className="bg-background border border-border p-4">
  <Text className="text-foreground font-semibold">Título</Text>
  <Text className="text-muted-foreground text-sm">Subtítulo</Text>
</View>

// ❌ Prohibited (hardcoded colors)
<View style={{ backgroundColor: '#ffffff' }}>
  <Text style={{ color: '#1a1a1a' }}>Título</Text>
</View>
```

### Programmatic Access (Reanimated & Native Modules)
When CSS classes cannot be used directly (e.g. `useAnimatedStyle`, `StatusBar`):

```tsx
import { lightColors, darkColors } from '@/theme/colors';
import { useThemeStore } from '@/stores/theme.store';

const scheme = useThemeStore((state) => state.getEffectiveScheme());
const activeColors = scheme === 'dark' ? darkColors : lightColors;
```
