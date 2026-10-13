# Theming System & Design Tokens — Vende Más Mobile App

## 1. One place for colors

**Every color value lives in `src/theme/palette.ts`.** Change a value there and the whole app
(classes, icons, tab bar, headers, status bar, sheets, toasts) updates in light and dark mode.

```text
src/theme/palette.ts   (HSL triplets, light + dark)
   ├─► ThemeProvider: NativeWind vars() on the root view → CSS variables (--primary, ...)
   │      └─► tailwind.config.js: bg-primary = hsl(var(--primary) / <alpha-value>)
   └─► useThemeColors(): resolved colors for icons, RefreshControl, navigation, sheets
```

- `global.css` has **no** color values.
- `tailwind.config.js` lists only token **names**.
- `__tests__/theme/palette.test.ts` fails if light and dark differ in tokens or if
  `tailwind.config.js` does not reference exactly the palette tokens.
- ESLint forbids hex / `rgb()` / `hsl()` literals in `app/` and `src/presentation/`.

### Adding a token
1. Add it to `ThemePalette` and to both schemes in `palette.ts` (camelCase, e.g. `visitOrder`).
2. Register its kebab-case name in `tailwind.config.js` (`visit.order: token('visit-order')`).
3. Use it: `bg-visit-order`, `text-visit-order`, or `useThemeColors().visitOrder`.

## 2. Token catalog

| Token | Purpose |
| :--- | :--- |
| `background` / `foreground` | Screen background / primary text and icons |
| `card`, `popover` (+ `-foreground`) | Surfaces |
| `primary` (+ `-foreground`) | Brand action color (carmine red) |
| `secondary`, `muted`, `accent` (+ `-foreground`) | Secondary surfaces and subdued text |
| `destructive`, `success`, `warning`, `info` (+ `-foreground`) | Feedback states |
| `border`, `input`, `ring` | Dividers, inputs, focus |
| `overlay` | Backdrop of sheets and dialogs (use with alpha, e.g. `bg-overlay/60`) |
| `visit-opportunity`, `visit-order`, `visit-collection` | Visit types (agenda dots, card accents) |
| `status-scheduled`, `status-in-progress`, `status-completed`, `status-cancelled` | Visit statuses |

Opacity modifiers work on every token (`bg-primary/10`, `border-success/30`) because the
config uses `<alpha-value>`.

## 3. Light / Dark / System

- `useThemeStore` stores only the preference (`light | dark | system`, persisted in MMKV)
  and applies it with NativeWind `colorScheme.set()`.
- The effective scheme is read **reactively** with `useAppColorScheme()` (NativeWind
  `useColorScheme`). Never use `Appearance.getColorScheme()` in render: it does not re-render
  when the OS theme changes, which caused mixed light/dark screens before.
- `ThemeProvider` also sets the native root background (`expo-system-ui`, no white flash),
  the React Navigation theme (`NAVIGATION_THEMES`) and the `StatusBar` style.
- The selector lives in **Más → Apariencia** (`ThemeSelector`).

## 4. Usage

```tsx
// ✅ Classes for views and text
<View className="bg-card border border-border p-4">
  <Text className="text-foreground font-semibold">Título</Text>
  <Text className="text-muted-foreground">Subtítulo</Text>
</View>

// ✅ Resolved colors where classes are not accepted
const colors = useThemeColors();
<MapPin size={16} color={colors.mutedForeground} />
<RefreshControl tintColor={colors.primary} />
const tint = useThemeColorWithAlpha('primary', 0.1);

// ❌ Never
<View style={{ backgroundColor: '#ffffff' }} />
```

Components rendered in a native overlay outside the root view (e.g. the sonner-native
`AppToaster`) receive resolved colors from `useThemeColors()` instead of classes.

## 5. Typography

Inter is embedded natively by the `expo-font` config plugin (`app.json`) as one family with
four weights (400/500/600/700), so `font-medium`, `font-semibold` and `font-bold` pick the
right file on Android and iOS. A development build is required after changing fonts.
