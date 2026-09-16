export const lightColors = {
  background: 'hsl(0, 0%, 100%)',
  foreground: 'hsl(0, 0%, 9%)',
  primary: 'hsl(0, 84%, 50%)',
  primaryForeground: 'hsl(0, 0%, 100%)',
  secondary: 'hsl(0, 0%, 12%)',
  secondaryForeground: 'hsl(0, 0%, 98%)',
  muted: 'hsl(0, 0%, 96%)',
  mutedForeground: 'hsl(0, 0%, 45%)',
  accent: 'hsl(0, 85%, 97%)',
  accentForeground: 'hsl(0, 84%, 45%)',
  destructive: 'hsl(0, 84%, 55%)',
  success: 'hsl(142, 71%, 38%)',
  warning: 'hsl(38, 92%, 50%)',
  border: 'hsl(0, 0%, 89%)',
  card: 'hsl(0, 0%, 100%)',
  ring: 'hsl(0, 84%, 50%)',
} as const;

export const darkColors = {
  background: 'hsl(0, 0%, 4%)',
  foreground: 'hsl(0, 0%, 98%)',
  primary: 'hsl(0, 85%, 58%)',
  primaryForeground: 'hsl(0, 0%, 100%)',
  secondary: 'hsl(0, 0%, 92%)',
  secondaryForeground: 'hsl(0, 0%, 9%)',
  muted: 'hsl(0, 0%, 14%)',
  mutedForeground: 'hsl(0, 0%, 65%)',
  accent: 'hsl(0, 50%, 15%)',
  accentForeground: 'hsl(0, 85%, 65%)',
  destructive: 'hsl(0, 84%, 55%)',
  success: 'hsl(142, 71%, 42%)',
  warning: 'hsl(38, 92%, 55%)',
  border: 'hsl(0, 0%, 18%)',
  card: 'hsl(0, 0%, 8%)',
  ring: 'hsl(0, 85%, 58%)',
} as const;

export type SemanticColor = keyof typeof lightColors;
