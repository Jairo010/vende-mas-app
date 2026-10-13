import { ArrowLeftRight, Banknote, CreditCard, FileCheck, Landmark } from 'lucide-react-native';
import type { PaymentMethod } from '@/core/types/collection.types';
import { es } from '@/shared/i18n/es';

export interface PaymentMethodVisual {
  label: string;
  icon: typeof Banknote;
}

export const PAYMENT_METHOD_VISUALS: Readonly<Record<PaymentMethod, PaymentMethodVisual>> = {
  CASH: { label: es.collections.methods.CASH, icon: Banknote },
  TRANSFER: { label: es.collections.methods.TRANSFER, icon: ArrowLeftRight },
  DEPOSIT: { label: es.collections.methods.DEPOSIT, icon: Landmark },
  CHECK: { label: es.collections.methods.CHECK, icon: FileCheck },
  CARD: { label: es.collections.methods.CARD, icon: CreditCard },
};
