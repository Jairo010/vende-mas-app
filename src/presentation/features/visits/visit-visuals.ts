import {
  CheckCircle2,
  Clock,
  HandCoins,
  PlayCircle,
  ShoppingCart,
  TrendingUp,
  XCircle,
} from 'lucide-react-native';
import type { VisitStatus, VisitType } from '@/core/types/visit.types';
import type { BadgeProps } from '@/presentation/components/ui/badge';
import { es } from '@/shared/i18n/es';
import type { ThemeToken } from '@/theme';

export interface VisitTypeVisual {
  label: string;
  icon: typeof TrendingUp;
  /** Palette token: the color lives in src/theme/palette.ts. */
  token: ThemeToken;
  badgeVariant: NonNullable<BadgeProps['variant']>;
  /** Left accent of cards. */
  borderClass: string;
}

export interface VisitStatusVisual {
  label: string;
  icon: typeof Clock;
  token: ThemeToken;
  badgeVariant: NonNullable<BadgeProps['variant']>;
}

export const VISIT_TYPE_VISUALS: Readonly<Record<VisitType, VisitTypeVisual>> = {
  OPPORTUNITY: {
    label: es.visits.types.OPPORTUNITY,
    icon: TrendingUp,
    token: 'visitOpportunity',
    badgeVariant: 'opportunity',
    borderClass: 'border-l-visit-opportunity',
  },
  ORDER: {
    label: es.visits.types.ORDER,
    icon: ShoppingCart,
    token: 'visitOrder',
    badgeVariant: 'order',
    borderClass: 'border-l-visit-order',
  },
  COLLECTION: {
    label: es.visits.types.COLLECTION,
    icon: HandCoins,
    token: 'visitCollection',
    badgeVariant: 'collection',
    borderClass: 'border-l-visit-collection',
  },
};

export const VISIT_STATUS_VISUALS: Readonly<Record<VisitStatus, VisitStatusVisual>> = {
  SCHEDULED: {
    label: es.visits.statuses.SCHEDULED,
    icon: Clock,
    token: 'statusScheduled',
    badgeVariant: 'info',
  },
  IN_PROGRESS: {
    label: es.visits.statuses.IN_PROGRESS,
    icon: PlayCircle,
    token: 'statusInProgress',
    badgeVariant: 'warning',
  },
  COMPLETED: {
    label: es.visits.statuses.COMPLETED,
    icon: CheckCircle2,
    token: 'statusCompleted',
    badgeVariant: 'success',
  },
  CANCELLED: {
    label: es.visits.statuses.CANCELLED,
    icon: XCircle,
    token: 'statusCancelled',
    badgeVariant: 'default',
  },
};
