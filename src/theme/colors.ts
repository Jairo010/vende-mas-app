export const lightColors = {
  background: 'hsl(0, 0%, 100%)',
  foreground: 'hsl(222, 47%, 11%)',
  primary: 'hsl(221, 83%, 30%)',
  primaryForeground: 'hsl(210, 40%, 98%)',
  secondary: 'hsl(38, 92%, 50%)',
  secondaryForeground: 'hsl(38, 92%, 10%)',
  muted: 'hsl(210, 40%, 96%)',
  mutedForeground: 'hsl(215, 16%, 47%)',
  destructive: 'hsl(0, 84%, 60%)',
  success: 'hsl(142, 71%, 35%)',
  warning: 'hsl(38, 92%, 50%)',
  border: 'hsl(214, 32%, 91%)',
  card: 'hsl(0, 0%, 100%)',
  ring: 'hsl(221, 83%, 30%)',
} as const;

export const darkColors = {
  background: 'hsl(222, 47%, 6%)',
  foreground: 'hsl(210, 40%, 98%)',
  primary: 'hsl(217, 91%, 60%)',
  primaryForeground: 'hsl(222, 47%, 6%)',
  secondary: 'hsl(38, 92%, 55%)',
  secondaryForeground: 'hsl(38, 92%, 10%)',
  muted: 'hsl(217, 33%, 15%)',
  mutedForeground: 'hsl(215, 20%, 65%)',
  destructive: 'hsl(0, 72%, 51%)',
  success: 'hsl(142, 71%, 42%)',
  warning: 'hsl(38, 92%, 55%)',
  border: 'hsl(217, 33%, 18%)',
  card: 'hsl(222, 47%, 9%)',
  ring: 'hsl(217, 91%, 60%)',
} as const;

export type SemanticColor = keyof typeof lightColors;
