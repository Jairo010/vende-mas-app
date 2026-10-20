import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { PaymentPlanType } from '@/core/types/collection.types';
import type { DateKey } from '@/shared/utils/date';
import { zustandMmkvStorage } from '@/infrastructure/storage/mmkv-storage.adapter';

/** Cart being built for a customer (optionally inside a visit). */
export interface OrderDraft {
  customerId: string;
  visitId: string | null;
  /** productId → quantity. */
  quantities: Record<string, number>;
  notes: string;
  /** Local delivery day; null = server default (one week). */
  deliveryDate: DateKey | null;
  /** How the customer pays; null = once, on the delivery day. */
  paymentPlan: { type: PaymentPlanType; installments: number; firstDueDate: DateKey } | null;
}

/** One draft per visit, or per customer when the order is taken outside a visit. */
export function orderDraftKey(customerId: string, visitId?: string | null): string {
  return visitId ? `visit:${visitId}` : `customer:${customerId}`;
}

interface OrderDraftState {
  drafts: Record<string, OrderDraft>;
  setQuantity: (
    key: string,
    base: Omit<OrderDraft, 'quantities' | 'notes' | 'deliveryDate' | 'paymentPlan'>,
    productId: string,
    quantity: number,
  ) => void;
  updateDraft: (
    key: string,
    patch: Partial<Pick<OrderDraft, 'notes' | 'deliveryDate' | 'paymentPlan'>>,
  ) => void;
  clearDraft: (key: string) => void;
  clearAll: () => void;
}

function emptyDraft(base: Pick<OrderDraft, 'customerId' | 'visitId'>): OrderDraft {
  return { ...base, quantities: {}, notes: '', deliveryDate: null, paymentPlan: null };
}

/**
 * Persisted carts: a seller can leave the catalog (a call, the camera, another app) and
 * come back to the same order.
 */
export const useOrderDraftStore = create<OrderDraftState>()(
  persist(
    (set) => ({
      drafts: {},
      setQuantity: (key, base, productId, quantity) =>
        set((state) => {
          const draft = state.drafts[key] ?? emptyDraft(base);
          const quantities = { ...draft.quantities };
          if (quantity > 0) quantities[productId] = quantity;
          else delete quantities[productId];
          return { drafts: { ...state.drafts, [key]: { ...draft, quantities } } };
        }),
      updateDraft: (key, patch) =>
        set((state) => {
          const draft = state.drafts[key];
          if (!draft) return state;
          return { drafts: { ...state.drafts, [key]: { ...draft, ...patch } } };
        }),
      clearDraft: (key) =>
        set((state) => {
          if (!(key in state.drafts)) return state;
          const { [key]: _removed, ...rest } = state.drafts;
          return { drafts: rest };
        }),
      clearAll: () => set({ drafts: {} }),
    }),
    {
      name: 'order-drafts',
      storage: createJSONStorage(() => zustandMmkvStorage),
      partialize: (state) => ({ drafts: state.drafts }),
    },
  ),
);
