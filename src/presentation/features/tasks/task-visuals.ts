import {
  TrendingUp,
  MapPin,
  ShoppingCart,
  HandCoins,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CheckSquare,
  UserPlus,
} from 'lucide-react-native';
import type { TaskCategory, TaskStatus, TaskType } from '@/core/types/task.types';
import { es } from '@/shared/i18n/es';
import type { BadgeProps } from '@/presentation/components/ui/badge';

export interface TypeVisualConfig {
  label: string;
  badgeVariant: BadgeProps['variant'];
  icon: typeof TrendingUp;
  color: string;
  borderColor: string;
  bgTint: string;
}

export interface StatusVisualConfig {
  label: string;
  badgeVariant: BadgeProps['variant'];
  icon: typeof Clock;
  color: string;
}

export const TYPE_VISUALS: Record<TaskType, TypeVisualConfig> = {
  OPPORTUNITY: {
    label: es.tasks.types.OPPORTUNITY,
    badgeVariant: 'followUp',
    icon: TrendingUp,
    color: '#8b5cf6',
    borderColor: '#8b5cf6',
    bgTint: 'rgba(139, 92, 246, 0.06)',
  },
  VISIT: {
    label: es.tasks.types.VISIT,
    badgeVariant: 'call',
    icon: MapPin,
    color: '#0ea5e9',
    borderColor: '#0ea5e9',
    bgTint: 'rgba(14, 165, 233, 0.06)',
  },
  SALE: {
    label: es.tasks.types.SALE,
    badgeVariant: 'success',
    icon: ShoppingCart,
    color: '#10b981',
    borderColor: '#10b981',
    bgTint: 'rgba(16, 185, 129, 0.06)',
  },
  COLLECTION: {
    label: es.tasks.types.COLLECTION,
    badgeVariant: 'warning',
    icon: HandCoins,
    color: '#f59e0b',
    borderColor: '#f59e0b',
    bgTint: 'rgba(245, 158, 11, 0.06)',
  },
};

export const CATEGORY_VISUALS: Record<TaskCategory, TypeVisualConfig> = {
  ...TYPE_VISUALS,
  NEW_CUSTOMER: {
    label: es.tasks.categories.NEW_CUSTOMER,
    badgeVariant: 'call',
    icon: UserPlus,
    color: '#3b82f6',
    borderColor: '#3b82f6',
    bgTint: 'rgba(59, 130, 246, 0.06)',
  },
  GENERAL: {
    label: es.tasks.categories.GENERAL,
    badgeVariant: 'default',
    icon: CheckSquare,
    color: '#64748b',
    borderColor: '#64748b',
    bgTint: 'rgba(100, 116, 139, 0.06)',
  },
};

export const STATUS_VISUALS: Record<TaskStatus, StatusVisualConfig> = {
  PENDING: {
    label: es.tasks.statuses.PENDING,
    badgeVariant: 'default',
    icon: Clock,
    color: '#64748b',
  },
  IN_PROGRESS: {
    label: es.tasks.statuses.IN_PROGRESS,
    badgeVariant: 'call',
    icon: AlertCircle,
    color: '#3b82f6',
  },
  COMPLETED: {
    label: es.tasks.statuses.COMPLETED,
    badgeVariant: 'success',
    icon: CheckCircle2,
    color: '#10b981',
  },
  LOST: {
    label: es.tasks.statuses.LOST,
    badgeVariant: 'primary',
    icon: XCircle,
    color: '#e11d48',
  },
  COLLECTED: {
    label: es.tasks.statuses.COLLECTED,
    badgeVariant: 'payment',
    icon: CheckCircle2,
    color: '#0d9488',
  },
  CANCELLED: {
    label: es.tasks.statuses.CANCELLED,
    badgeVariant: 'default',
    icon: XCircle,
    color: '#6b7280',
  },
};

export function getTypeVisual(type?: TaskType | TaskCategory): TypeVisualConfig {
  if (type && TYPE_VISUALS[type as TaskType]) {
    return TYPE_VISUALS[type as TaskType];
  }
  if (type && CATEGORY_VISUALS[type as TaskCategory]) {
    return CATEGORY_VISUALS[type as TaskCategory];
  }
  return TYPE_VISUALS.OPPORTUNITY;
}

export function getCategoryVisual(category?: TaskCategory): TypeVisualConfig {
  return getTypeVisual(category);
}

export function getStatusVisual(status?: TaskStatus): StatusVisualConfig {
  if (status && STATUS_VISUALS[status]) {
    return STATUS_VISUALS[status];
  }
  return STATUS_VISUALS.PENDING;
}
