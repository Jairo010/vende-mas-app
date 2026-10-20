import { z } from 'zod';
import {
  METHODS_REQUIRING_BANK,
  METHODS_REQUIRING_REFERENCE,
  PAYMENT_METHODS,
} from '@/core/types/collection.types';
import { isValidAmount, toCents } from '@/core/value-objects/payment-schedule';
import { es } from '@/shared/i18n/es';

const messages = es.collections.validation;

/** "12,50" or "12.50" → 12.5 (sellers type with either separator). */
export function parseAmount(text: string): number {
  const normalized = text.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return Number.NaN;
  return Number(normalized);
}

/** Payment form; `getMaxAmount` returns the balance of the receivable selected right now. */
export function createPaymentSchema(getMaxAmount: () => number) {
  return z
    .object({
      amount: z.string().trim().min(1, messages.amountRequired),
      method: z.enum(PAYMENT_METHODS),
      reference: z.string().trim().max(80, messages.tooLong),
      bankName: z.string().trim().max(80, messages.tooLong),
      /** Local day written on the check (YYYY-MM-DD). */
      checkDate: z.string().nullable(),
      notes: z.string().trim().max(1000, messages.tooLong),
    })
    .superRefine((data, context) => {
      const amount = parseAmount(data.amount);
      if (data.amount && !isValidAmount(amount)) {
        context.addIssue({ code: 'custom', path: ['amount'], message: messages.amountInvalid });
      } else if (toCents(amount) > toCents(getMaxAmount())) {
        context.addIssue({
          code: 'custom',
          path: ['amount'],
          message: messages.amountAboveBalance,
        });
      }
      if (METHODS_REQUIRING_REFERENCE.includes(data.method) && !data.reference) {
        context.addIssue({
          code: 'custom',
          path: ['reference'],
          message:
            messages.referenceRequired[data.method as 'TRANSFER' | 'DEPOSIT' | 'CHECK' | 'CARD'],
        });
      }
      if (METHODS_REQUIRING_BANK.includes(data.method) && !data.bankName) {
        context.addIssue({ code: 'custom', path: ['bankName'], message: messages.bankRequired });
      }
    });
}

export type PaymentFormData = z.infer<ReturnType<typeof createPaymentSchema>>;
