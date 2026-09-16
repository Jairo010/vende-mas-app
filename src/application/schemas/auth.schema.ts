import { z } from 'zod';
import { es } from '@/shared/i18n/es';

export const loginSchema = z.object({
  email: z.string().min(1, es.auth.errors.emailRequired).email(es.auth.errors.emailInvalid),
  password: z
    .string()
    .min(1, es.auth.errors.passwordRequired)
    .min(6, es.auth.errors.passwordMinLength),
  rememberMe: z.boolean(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
