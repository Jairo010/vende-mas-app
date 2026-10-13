import { toast } from 'sonner-native';
import { DomainError } from '@/core/errors/domain.error';
import { es } from '@/shared/i18n/es';

/** Message a seller can act on: domain errors are already written in Spanish. */
export function toUserMessage(error: unknown): string {
  if (error instanceof DomainError) return error.message;
  return es.errors.unexpected;
}

export const notify = {
  success: (title: string, description?: string) => toast.success(title, { description }),
  warning: (title: string, description?: string) => toast.warning(title, { description }),
  error: (error: unknown) => toast.error(toUserMessage(error)),
};
