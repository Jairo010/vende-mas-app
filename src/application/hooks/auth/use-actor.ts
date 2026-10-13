import { useMemo } from 'react';
import { UnauthorizedError } from '@/core/errors/domain.error';
import type { ActorContext } from '@/core/ports/visit.repository.port';
import { useAuthStore } from '@/stores/auth.store';

/** Who performs local writes (stamped on what is created offline). */
export function useActor(): ActorContext | null {
  const user = useAuthStore((state) => state.user);
  return useMemo(() => (user ? { userId: user.id, userName: user.name } : null), [user]);
}

export function requireActor(actor: ActorContext | null): ActorContext {
  if (!actor) throw new UnauthorizedError('Tu sesión expiró: vuelve a iniciar sesión');
  return actor;
}
