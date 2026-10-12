# Prompt — Vende Más Mobile App Architecture & Structure Setup

Use this prompt to set up the architecture foundation, configuration files, theming system, and core infrastructure for the Vende Más mobile application. The Expo project has already been created and all dependencies are already installed.

---

## 1. Mandatory Project Context

Before doing anything, read and follow:

- `SKILL_VENDE_MAS_MOBILE_DEVELOPMENT.md` — This file contains the complete architectural rules, technology stack, conventions, theming system, language policy, error handling patterns, testing strategy, and quality standards. Treat it as the source of truth.
- Inspect the current state of the project: check `package.json`, existing files, and the installed dependencies to understand what is already in place.

This prompt creates the **initial architecture only**. Subsequent features and screens will be built incrementally using separate prompts that reference the SKILL file.

---

## 2. Goal — Architecture & Project Structure

Set up the complete foundational architecture for the **Vende Más** mobile application. The project already exists as a **React Native + Expo (SDK 57)** project (created via `create-expo-app`), but no dependencies have been installed and no configuration has been done yet.

Do NOT create the project. It is already created. Everything else needs to be done.

This setup must include:

1. Installation of all required dependencies.
2. Complete directory structure following Hexagonal Architecture.
3. Full TypeScript strict configuration.
4. ESLint flat config and Prettier matching the backend conventions.
5. NativeWind v4 configuration with Metro and Babel integration.
6. Complete theming system (global colors, dark/light/system mode, CSS variables).
7. Zustand stores (auth, theme, app) with MMKV persistence adapter.
8. TanStack Query provider configuration.
9. API client foundation with interceptor stubs.
10. Domain error base class.
11. i18n Spanish translations foundation.
12. Expo Router layout structure with auth guards.
13. Core shared utilities and constants.
14. Provider composition in the root layout.
15. Documentation foundation.

Do NOT implement any business features, screens, or API integrations beyond the structural foundation.

---

## 3. First: Inspect, Do Not Change Yet

Before modifying anything:

1. Inspect `package.json` to see what the base project includes.
2. Inspect the current project structure and identify existing files from the template.
3. Identify what configuration files already exist and what needs to be created or updated.
4. Verify the Expo SDK version and React Native version.
5. Check if any initial configuration (babel, metro, tsconfig) already exists from `create-expo-app`.

Then briefly state:

- What already exists and should be preserved.
- What dependencies need to be installed.
- What needs to be created.
- What existing files need to be updated.

Do not perform unrelated cleanup.

---

## 4. Language Requirement — Mandatory

### Code — English Only

The entire technical implementation MUST be written in English.

This includes:

- code
- file and folder names
- classes, interfaces, types, enums
- variables, functions, constants
- hooks, stores, schemas
- comments, JSDoc
- test names
- documentation
- error codes, log messages
- git commit messages

### User-Facing Content — Spanish Only

All strings displayed to the user must be in Spanish and centralized in `src/shared/i18n/es.ts`.

This includes:

- screen titles, labels, descriptions, placeholders
- button text, menu items, tab labels
- error messages shown to users
- toast notifications, alerts, confirmations
- empty state messages, loading messages

Do NOT mix languages. Requirements may be in Spanish, but implementation is English-only.

---

## 5. Step-by-Step Implementation Order

### Step 1 — Install Dependencies

Install ALL required dependencies in the correct order. Use `npx expo install` for Expo-compatible packages to ensure version compatibility with the current SDK.

**Core Navigation:**
```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar
```

**UI & Styling:**
```bash
npm install nativewind@^4
npm install --save-dev tailwindcss
npx expo install react-native-safe-area-context react-native-screens
npx @react-native-reusables/cli@latest init
npm install lucide-react-native react-native-svg
```

**Animations & Gestures:**
```bash
npx expo install react-native-reanimated react-native-gesture-handler
npm install @gorhom/bottom-sheet
```

**Media & Effects:**
```bash
npx expo install expo-image expo-haptics expo-blur
```

**Lists:**
```bash
npm install @shopify/flash-list
```

**State & Server:**
```bash
npm install @tanstack/react-query zustand
```

**Forms & Validation:**
```bash
npm install react-hook-form @hookform/resolvers zod
```

**Storage & Security:**
```bash
npm install react-native-mmkv
npx expo install expo-secure-store
```

**Dev Tooling:**
```bash
npm install --save-dev eslint @eslint/js typescript-eslint eslint-plugin-prettier eslint-config-prettier prettier globals eslint-plugin-react-native
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest @types/jest
```

After installation, verify no conflicts:

```bash
npx expo-doctor
```

### Step 2 — TypeScript Configuration

Create `tsconfig.json` with strict mode matching the backend's strictness:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/presentation/components/*"],
      "@/features/*": ["./src/presentation/features/*"],
      "@/hooks/*": ["./src/application/hooks/*"],
      "@/core/*": ["./src/core/*"],
      "@/infrastructure/*": ["./src/infrastructure/*"],
      "@/shared/*": ["./src/shared/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/theme/*": ["./src/theme/*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "nativewind-env.d.ts"
  ],
  "exclude": [
    "node_modules",
    "babel.config.js",
    "metro.config.js",
    "tailwind.config.js"
  ]
}
```

Create `nativewind-env.d.ts`:

```typescript
/// <reference types="nativewind/types" />
```

### Step 3 — ESLint Configuration

Create `eslint.config.mjs` mirroring the backend's flat config approach:

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', '.expo/**', 'android/**', 'ios/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          trailingComma: 'all',
          printWidth: 100,
          tabWidth: 2,
          semi: true,
        },
      ],
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
);
```

### Step 4 — Prettier Configuration

Create `.prettierrc`:

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "endOfLine": "auto"
}
```

### Step 5 — NativeWind & Tailwind Configuration

Create `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light theme semantic tokens (CSS variable references)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

Create `global.css` with complete light and dark theme variables:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ─── Light Theme — Elegant Navy & Gold ─── */
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    --primary: 221 83% 30%;
    --primary-foreground: 210 40% 98%;
    --secondary: 38 92% 50%;
    --secondary-foreground: 38 92% 10%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --accent: 210 40% 96%;
    --accent-foreground: 222 47% 11%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    --success: 142 71% 35%;
    --success-foreground: 0 0% 98%;
    --warning: 38 92% 50%;
    --warning-foreground: 38 92% 10%;
    --border: 214 32% 91%;
    --input: 214 32% 91%;
    --ring: 221 83% 30%;
  }

  .dark {
    /* ─── Dark Theme — Deep Charcoal & Gold ─── */
    --background: 222 47% 6%;
    --foreground: 210 40% 98%;
    --card: 222 47% 9%;
    --card-foreground: 210 40% 98%;
    --popover: 222 47% 9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217 91% 60%;
    --primary-foreground: 222 47% 6%;
    --secondary: 38 92% 55%;
    --secondary-foreground: 38 92% 10%;
    --muted: 217 33% 15%;
    --muted-foreground: 215 20% 65%;
    --accent: 217 33% 15%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 98%;
    --success: 142 71% 42%;
    --success-foreground: 0 0% 98%;
    --warning: 38 92% 55%;
    --warning-foreground: 38 92% 10%;
    --border: 217 33% 18%;
    --input: 217 33% 18%;
    --ring: 217 91% 60%;
  }
}
```

Update `metro.config.js`:

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
```

Update `babel.config.js`:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

### Step 6 — Directory Structure

Create the following directory structure. Create an `index.ts` barrel export file in each directory where indicated. Do NOT create placeholder files beyond what is listed — only create files with actual content.

```text
src/
├── core/
│   ├── entities/
│   │   └── index.ts
│   ├── value-objects/
│   │   └── index.ts
│   ├── errors/
│   │   ├── domain.error.ts
│   │   └── index.ts
│   ├── ports/
│   │   ├── storage.port.ts
│   │   ├── secure-storage.port.ts
│   │   └── index.ts
│   └── types/
│       ├── api.types.ts
│       ├── auth.types.ts
│       ├── role.enum.ts
│       └── index.ts
│
├── application/
│   ├── hooks/
│   │   └── index.ts
│   ├── schemas/
│   │   └── index.ts
│   └── mappers/
│       └── index.ts
│
├── infrastructure/
│   ├── api/
│   │   ├── client/
│   │   │   ├── api-client.ts
│   │   │   ├── interceptors.ts
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   └── index.ts
│   │   └── dto/
│   │       ├── pagination.dto.ts
│   │       └── index.ts
│   ├── storage/
│   │   ├── mmkv-storage.adapter.ts
│   │   ├── secure-storage.adapter.ts
│   │   └── index.ts
│   └── providers/
│       └── index.ts
│
├── presentation/
│   ├── components/
│   │   ├── ui/
│   │   │   └── index.ts
│   │   ├── common/
│   │   │   └── index.ts
│   │   └── feedback/
│   │       └── index.ts
│   ├── features/
│   │   └── auth/
│   │       └── index.ts
│   └── layouts/
│       ├── safe-area-layout.tsx
│       └── index.ts
│
├── shared/
│   ├── constants/
│   │   ├── api.constants.ts
│   │   ├── storage-keys.constants.ts
│   │   ├── query-keys.constants.ts
│   │   └── index.ts
│   ├── config/
│   │   ├── env.config.ts
│   │   └── index.ts
│   ├── hooks/
│   │   └── index.ts
│   ├── utils/
│   │   ├── format-date.ts
│   │   ├── format-currency.ts
│   │   └── index.ts
│   ├── i18n/
│   │   ├── es.ts
│   │   ├── types.ts
│   │   └── index.ts
│   └── providers/
│       ├── app-providers.tsx
│       ├── query-provider.tsx
│       ├── theme-provider.tsx
│       └── index.ts
│
├── stores/
│   ├── auth.store.ts
│   ├── theme.store.ts
│   ├── app.store.ts
│   └── index.ts
│
└── theme/
    ├── colors.ts
    ├── typography.ts
    ├── spacing.ts
    └── index.ts
```

### Step 7 — Core Domain Foundation

#### `src/core/errors/domain.error.ts`

```typescript
export abstract class DomainError extends Error {
  public abstract readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
```

#### `src/core/types/api.types.ts`

Define the shared API response types matching the backend's envelope:

```typescript
export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}
```

#### `src/core/types/role.enum.ts`

```typescript
export enum UserRole {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
}
```

#### `src/core/types/auth.types.ts`

```typescript
import { UserRole } from './role.enum';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

export interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
}
```

#### `src/core/ports/storage.port.ts`

```typescript
export interface IStoragePort {
  getString(key: string): string | undefined;
  setString(key: string, value: string): void;
  getBoolean(key: string): boolean | undefined;
  setBoolean(key: string, value: boolean): void;
  delete(key: string): void;
  clearAll(): void;
}
```

#### `src/core/ports/secure-storage.port.ts`

```typescript
export interface ISecureStoragePort {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
}
```

### Step 8 — Infrastructure Adapters

#### `src/infrastructure/storage/mmkv-storage.adapter.ts`

```typescript
import { MMKV } from 'react-native-mmkv';
import type { IStoragePort } from '@/core/ports/storage.port';

const mmkvInstance = new MMKV();

export const mmkvStorageAdapter: IStoragePort = {
  getString: (key: string) => mmkvInstance.getString(key),
  setString: (key: string, value: string) => mmkvInstance.set(key, value),
  getBoolean: (key: string) => mmkvInstance.getBoolean(key),
  setBoolean: (key: string, value: boolean) => mmkvInstance.set(key, value),
  delete: (key: string) => mmkvInstance.delete(key),
  clearAll: () => mmkvInstance.clearAll(),
};

// Zustand persist middleware adapter
export const zustandMmkvStorage = {
  setItem: (key: string, value: string) => mmkvInstance.set(key, value),
  getItem: (key: string) => mmkvInstance.getString(key) ?? null,
  removeItem: (key: string) => mmkvInstance.delete(key),
};
```

#### `src/infrastructure/storage/secure-storage.adapter.ts`

```typescript
import * as SecureStore from 'expo-secure-store';
import type { ISecureStoragePort } from '@/core/ports/secure-storage.port';

export const secureStorageAdapter: ISecureStoragePort = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  deleteItem: (key: string) => SecureStore.deleteItemAsync(key),
};
```

#### `src/infrastructure/api/client/api-client.ts`

Create a configured HTTP client instance with base URL from environment config, default headers, and timeout.

#### `src/infrastructure/api/client/interceptors.ts`

Create request/response interceptors:
- **Request**: Attach `Authorization: Bearer <token>` header from SecureStore.
- **Response**: Intercept 401 errors, attempt token refresh, retry original request. On refresh failure, clear session and redirect to login.

### Step 9 — Zustand Stores

#### `src/stores/auth.store.ts`

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMmkvStorage } from '@/infrastructure/storage/mmkv-storage.adapter';
import type { AuthUser } from '@/core/types/auth.types';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isHydrated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      clearSession: () => set({ user: null, isAuthenticated: false }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandMmkvStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
```

#### `src/stores/theme.store.ts`

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Appearance, type ColorSchemeName } from 'react-native';
import { zustandMmkvStorage } from '@/infrastructure/storage/mmkv-storage.adapter';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  isHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  setHydrated: (hydrated: boolean) => void;
  getEffectiveScheme: () => ColorSchemeName;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      isHydrated: false,
      setMode: (mode) => {
        set({ mode });
        if (mode === 'system') {
          Appearance.setColorScheme(null);
        } else {
          Appearance.setColorScheme(mode);
        }
      },
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      getEffectiveScheme: () => {
        const { mode } = get();
        if (mode === 'system') {
          return Appearance.getColorScheme();
        }
        return mode;
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => zustandMmkvStorage),
      partialize: (state) => ({ mode: state.mode }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        if (state?.mode && state.mode !== 'system') {
          Appearance.setColorScheme(state.mode);
        }
      },
    },
  ),
);
```

#### `src/stores/app.store.ts`

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMmkvStorage } from '@/infrastructure/storage/mmkv-storage.adapter';

interface AppState {
  hasCompletedOnboarding: boolean;
  setOnboardingCompleted: (completed: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      setOnboardingCompleted: (completed) => set({ hasCompletedOnboarding: completed }),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => zustandMmkvStorage),
    },
  ),
);
```

### Step 10 — Theme Module

#### `src/theme/colors.ts`

Export the color token definitions as JavaScript objects for use in programmatic contexts (Reanimated, StatusBar, etc.) where CSS variables are not accessible:

```typescript
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
```

### Step 11 — i18n Foundation

#### `src/shared/i18n/es.ts`

Create the base Spanish translations dictionary:

```typescript
export const es = {
  common: {
    loading: 'Cargando...',
    retry: 'Reintentar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    search: 'Buscar',
    back: 'Volver',
    next: 'Siguiente',
    done: 'Listo',
    yes: 'Sí',
    no: 'No',
    close: 'Cerrar',
    noResults: 'Sin resultados',
    pullToRefresh: 'Desliza para actualizar',
  },
  errors: {
    unexpected: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
    network: 'Error de conexión. Verifica tu conexión a internet.',
    timeout: 'La solicitud tardó demasiado. Intenta de nuevo.',
    sessionExpired: 'Tu sesión ha expirado. Inicia sesión nuevamente.',
    unauthorized: 'No tienes permisos para realizar esta acción.',
    notFound: 'El recurso solicitado no fue encontrado.',
    validation: 'Por favor, verifica los datos ingresados.',
    serverError: 'Error del servidor. Intenta más tarde.',
  },
  auth: {
    login: 'Iniciar Sesión',
    logout: 'Cerrar Sesión',
    email: 'Correo electrónico',
    password: 'Contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    welcomeBack: 'Bienvenido de vuelta',
    loginSubtitle: 'Ingresa tus credenciales para continuar',
    invalidCredentials: 'Correo o contraseña incorrectos.',
  },
  tabs: {
    home: 'Inicio',
    customers: 'Clientes',
    tasks: 'Tareas',
    sales: 'Ventas',
    profile: 'Perfil',
  },
  settings: {
    title: 'Configuración',
    theme: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    themeSystem: 'Sistema',
    language: 'Idioma',
    notifications: 'Notificaciones',
    about: 'Acerca de',
    version: 'Versión',
  },
} as const;

export type TranslationKey = typeof es;
```

#### `src/shared/i18n/index.ts`

```typescript
import { es, type TranslationKey } from './es';

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object
        ? `${K}.${NestedKeyOf<T[K]>}`
        : K;
    }[keyof T & string]
  : never;

type TranslationPath = NestedKeyOf<TranslationKey>;

export function t(path: TranslationPath): string {
  const keys = path.split('.');
  let result: unknown = es;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path; // Fallback to key if not found
    }
  }
  return typeof result === 'string' ? result : path;
}

export { es };
export type { TranslationKey };
```

### Step 12 — Providers

#### `src/shared/providers/query-provider.tsx`

Configure TanStack Query with sensible defaults:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (previously cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

#### `src/shared/providers/theme-provider.tsx`

Create a provider that applies the theme class and manages initialization:

```typescript
import { useEffect, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/stores/theme.store';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const colorScheme = useColorScheme();
  const { mode, setMode } = useThemeStore();

  useEffect(() => {
    // Re-apply saved mode on mount to ensure consistency
    if (mode !== 'system') {
      setMode(mode);
    }
  }, [mode, setMode]);

  return <>{children}</>;
}
```

#### `src/shared/providers/app-providers.tsx`

Compose all providers in the correct order:

```typescript
import type { ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <QueryProvider>
          {children}
        </QueryProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
```

### Step 13 — Expo Router Layouts

#### `app/_layout.tsx`

The root layout must:
1. Import `global.css`.
2. Load custom fonts (if any).
3. Wrap children in `AppProviders`.
4. Wait for stores to hydrate before rendering.
5. Redirect based on authentication state.

```typescript
import '../global.css';
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/shared/providers/app-providers';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';

function AuthGuard() {
  const segments = useSegments();
  const router = useRouter();
  const { isAuthenticated, isHydrated: authHydrated } = useAuthStore();
  const { isHydrated: themeHydrated, getEffectiveScheme } = useThemeStore();

  useEffect(() => {
    if (!authHydrated || !themeHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, authHydrated, themeHydrated, segments, router]);

  if (!authHydrated || !themeHydrated) {
    return null; // Or a splash screen
  }

  const scheme = getEffectiveScheme();

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Slot />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <AuthGuard />
    </AppProviders>
  );
}
```

#### `app/(auth)/_layout.tsx`

```typescript
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    />
  );
}
```

#### `app/(tabs)/_layout.tsx`

```typescript
import { Tabs } from 'expo-router';
import { t } from '@/shared/i18n';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: 'hsl(221, 83%, 30%)',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: t('tabs.customers'),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: t('tabs.tasks'),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: t('tabs.sales'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
        }}
      />
    </Tabs>
  );
}
```

### Step 14 — Shared Constants

#### `src/shared/constants/api.constants.ts`

```typescript
import { ENV } from '@/shared/config/env.config';

export const API_BASE_URL = ENV.API_BASE_URL;

export const API_TIMEOUT_MS = 15_000;

export const API_ENDPOINTS = {
  auth: {
    login: '/api/v1/auth/login',
    refreshToken: '/api/v1/auth/refresh-token',
    profile: '/api/v1/auth/profile',
  },
  customers: {
    list: '/api/v1/customers',
    detail: (id: string) => `/api/v1/customers/${id}`,
  },
  tasks: {
    list: '/api/v1/tasks',
    detail: (id: string) => `/api/v1/tasks/${id}`,
  },
  sales: {
    orders: '/api/v1/orders',
    orderDetail: (id: string) => `/api/v1/orders/${id}`,
  },
  notifications: {
    inbox: '/api/v1/notifications/inbox',
    unreadCount: '/api/v1/notifications/unread-count',
  },
} as const;
```

#### `src/shared/constants/storage-keys.constants.ts`

```typescript
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  THEME_MODE: 'theme_mode',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;
```

#### `src/shared/constants/query-keys.constants.ts`

```typescript
export const QUERY_KEYS = {
  auth: {
    profile: ['auth', 'profile'] as const,
  },
  customers: {
    all: ['customers'] as const,
    list: (params?: Record<string, unknown>) => ['customers', 'list', params] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    list: (params?: Record<string, unknown>) => ['tasks', 'list', params] as const,
    detail: (id: string) => ['tasks', 'detail', id] as const,
  },
  sales: {
    orders: ['sales', 'orders'] as const,
    orderDetail: (id: string) => ['sales', 'orders', id] as const,
  },
  notifications: {
    inbox: (params?: Record<string, unknown>) => ['notifications', 'inbox', params] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
} as const;
```

#### `src/shared/config/env.config.ts`

```typescript
interface EnvironmentConfig {
  API_BASE_URL: string;
  IS_DEVELOPMENT: boolean;
}

export const ENV: EnvironmentConfig = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
  IS_DEVELOPMENT: __DEV__,
};
```

### Step 15 — Environment Variables

Create `.env.example`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

### Step 16 — package.json Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "start": "expo start",
    "start:clear": "expo start -c",
    "android": "expo run:android",
    "ios": "expo run:ios",
    "lint": "eslint \"src/**/*.{ts,tsx}\" \"app/**/*.{ts,tsx}\"",
    "lint:fix": "eslint \"src/**/*.{ts,tsx}\" \"app/**/*.{ts,tsx}\" --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx}\" \"app/**/*.{ts,tsx}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx}\" \"app/**/*.{ts,tsx}\"",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Step 17 — Documentation Foundation

#### `docs/architecture.md`

Create the initial architecture documentation covering:

1. **Architecture Overview** — Hexagonal Architecture adapted for React Native.
2. **Layer Responsibilities** — Domain, Application, Infrastructure, Presentation.
3. **Dependency Direction** — Diagram showing inward dependency flow.
4. **Technology Stack** — Complete list with versions and purposes.
5. **Project Structure** — Directory tree with explanations.
6. **State Management** — TanStack Query vs. Zustand responsibilities.
7. **Theming** — Color token system, dark/light mode toggle.
8. **Error Handling** — Centralized strategy.
9. **Security** — Token storage, data sensitivity rules.
10. **Testing** — Strategy per architectural layer.

#### `docs/theming.md`

Create theming documentation covering:

1. **Color Token Catalog** — Complete list of semantic tokens with light/dark values.
2. **Adding New Colors** — Step-by-step guide for extending the palette.
3. **Theme Toggle** — How the light/dark/system mode works.
4. **Using Colors in Components** — NativeWind class examples.
5. **Programmatic Color Access** — For Reanimated and non-NativeWind contexts.

---

## 6. Architecture Rules — Non-Negotiable

### Rules

- Screens in `app/` must remain thin (orchestration only).
- Screens must NOT call API services directly.
- Screens must NOT access storage directly.
- All business logic lives in hooks (`src/application/hooks/`).
- Hooks depend on ports (interfaces), NOT concrete adapters.
- Domain entities must have ZERO React/Expo imports.
- Infrastructure adapters implement port interfaces.
- API DTOs must NOT be exposed to UI components.
- Mappers transform between DTOs and domain entities.
- Colors are NEVER hardcoded in components.
- All user-facing text comes from the i18n module.
- All technical code is in English.

---

## 7. Type Safety — Zero `any`

All inputs and outputs must be strongly typed.

Do not use:

- explicit `any`
- implicit `any`
- broad unsafe casts
- untyped API responses
- untyped component props
- untyped hook returns
- untyped store actions

For unknown values use `unknown` with proper narrowing.

---

## 8. Validation Commands

After the initial architecture setup is complete, run:

```bash
npx expo-doctor
npm run lint
npm run format:check
npm run typecheck
npx expo start
```

Verify ALL pass before declaring setup complete.

---

## 9. Do Not Expand the Scope

This prompt creates ONLY the project foundation and architecture.

Do NOT implement:

- Login screen UI or functionality
- Customer screens
- Task screens
- Sales screens
- API data fetching logic
- Complete UI component library
- Any business feature

Only create the structural files, configurations, and foundational code specified above.

---

## 10. Final Review

Before declaring completion, confirm:

- [ ] Existing project verified and running.
- [ ] All specified dependencies confirmed installed.
- [ ] Directory structure matches the canonical layout.
- [ ] TypeScript strict mode configured.
- [ ] ESLint flat config working (mirrors backend).
- [ ] Prettier config matching backend.
- [ ] NativeWind configured (metro, babel, tailwind, global.css).
- [ ] Light and dark theme CSS variables defined.
- [ ] Color tokens exported in `theme/colors.ts`.
- [ ] Zustand stores created (auth, theme, app) with MMKV persistence.
- [ ] TanStack Query provider configured.
- [ ] API client stub created with interceptor structure.
- [ ] Domain error base class implemented.
- [ ] Storage ports and adapters implemented.
- [ ] i18n Spanish dictionary created.
- [ ] Expo Router layouts created (root, auth, tabs).
- [ ] Auth guard implemented in root layout.
- [ ] Shared constants defined (API, storage keys, query keys).
- [ ] Environment config created.
- [ ] Documentation files created.
- [ ] No `any` in any file.
- [ ] All validation commands pass.
- [ ] App launches without crash.

---

## 11. Final Report

When finished, report:

### Implemented

Summarize the architecture and foundational pieces created.

### Files Created

List all files created.

### Configuration

List all configuration files and what they control.

### Validation

List the commands executed and whether they passed.

### Architectural Notes

Mention any important decisions made during setup.

### Next Steps

List the recommended first features to implement (e.g., Login screen, then Customer list).
