/**
 * THE single source of truth for every color in the app.
 *
 * Values are HSL triplets (`'H S% L%'`) so they work both as CSS variables
 * (`hsl(var(--primary) / <alpha-value>)` in tailwind.config.js, applied at runtime by
 * `ThemeProvider` through NativeWind `vars()`) and as plain JS colors (`useThemeColors()`).
 *
 * To change a color, edit it here only. To add a token, add it to both schemes and
 * register its name in `tailwind.config.js` (a test checks both lists match).
 */
export type ColorSchemeName = 'light' | 'dark';

export interface ThemePalette {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  info: string;
  infoForeground: string;
  border: string;
  input: string;
  ring: string;
  /** Backdrop behind sheets and dialogs (use with alpha). */
  overlay: string;
  /** Visit types. */
  visitOpportunity: string;
  visitOrder: string;
  visitCollection: string;
  /** Visit statuses. */
  statusScheduled: string;
  statusInProgress: string;
  statusCompleted: string;
  statusCancelled: string;
}

export type ThemeToken = keyof ThemePalette;

export const palette: Readonly<Record<ColorSchemeName, Readonly<ThemePalette>>> = {
  // Crisp White, Carbon Black & Carmine Red
  light: {
    background: '0 0% 100%',
    foreground: '0 0% 9%',
    card: '0 0% 100%',
    cardForeground: '0 0% 9%',
    popover: '0 0% 100%',
    popoverForeground: '0 0% 9%',
    primary: '0 84% 50%',
    primaryForeground: '0 0% 100%',
    secondary: '0 0% 12%',
    secondaryForeground: '0 0% 98%',
    muted: '0 0% 96%',
    mutedForeground: '0 0% 45%',
    accent: '0 85% 97%',
    accentForeground: '0 84% 45%',
    destructive: '0 84% 55%',
    destructiveForeground: '0 0% 98%',
    success: '142 71% 38%',
    successForeground: '0 0% 98%',
    warning: '38 92% 50%',
    warningForeground: '0 0% 10%',
    info: '199 89% 42%',
    infoForeground: '0 0% 98%',
    border: '0 0% 89%',
    input: '0 0% 89%',
    ring: '0 84% 50%',
    overlay: '0 0% 0%',
    visitOpportunity: '262 83% 58%',
    visitOrder: '160 84% 34%',
    visitCollection: '32 95% 44%',
    statusScheduled: '217 91% 53%',
    statusInProgress: '38 92% 50%',
    statusCompleted: '142 71% 38%',
    statusCancelled: '0 0% 45%',
  },
  // Jet Black, Pure White & Electric Carmine Red
  dark: {
    background: '0 0% 4%',
    foreground: '0 0% 98%',
    card: '0 0% 8%',
    cardForeground: '0 0% 98%',
    popover: '0 0% 8%',
    popoverForeground: '0 0% 98%',
    primary: '0 85% 58%',
    primaryForeground: '0 0% 100%',
    secondary: '0 0% 92%',
    secondaryForeground: '0 0% 9%',
    muted: '0 0% 14%',
    mutedForeground: '0 0% 65%',
    accent: '0 50% 15%',
    accentForeground: '0 85% 65%',
    destructive: '0 84% 55%',
    destructiveForeground: '0 0% 98%',
    success: '142 71% 42%',
    successForeground: '0 0% 98%',
    warning: '38 92% 55%',
    warningForeground: '0 0% 10%',
    info: '199 89% 55%',
    infoForeground: '0 0% 10%',
    border: '0 0% 18%',
    input: '0 0% 18%',
    ring: '0 85% 58%',
    overlay: '0 0% 0%',
    visitOpportunity: '258 90% 70%',
    visitOrder: '158 64% 52%',
    visitCollection: '38 92% 60%',
    statusScheduled: '213 94% 68%',
    statusInProgress: '38 92% 60%',
    statusCompleted: '142 69% 58%',
    statusCancelled: '0 0% 60%',
  },
};
