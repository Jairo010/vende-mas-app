import type { Installment, InstallmentStatus, PaymentPlanType } from '../types/collection.types';

/**
 * Same arithmetic as the API collections module: money is handled in integer cents so
 * installments always add up to the total and allocations never leave a cent behind.
 */
export const toCents = (amount: number): number => Math.round(amount * 100);
export const fromCents = (cents: number): number => cents / 100;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface ScheduledInstallment {
  number: number;
  dueDate: string;
  amount: number;
}

/** Equal installments every 7 days; the cents that do not divide go to the last one. */
export function buildSchedule(
  total: number,
  type: PaymentPlanType,
  installments: number,
  firstDueDate: Date,
): ScheduledInstallment[] {
  const count = type === 'SINGLE' ? 1 : installments;
  const totalCents = toCents(total);
  const baseCents = Math.floor(totalCents / count);
  return Array.from({ length: count }, (_, index) => ({
    number: index + 1,
    dueDate: new Date(firstDueDate.getTime() + index * WEEK_MS).toISOString(),
    amount: fromCents(index === count - 1 ? totalCents - baseCents * (count - 1) : baseCents),
  }));
}

export interface InstallmentAllocation {
  installmentId: string;
  installmentNumber: number;
  amount: number;
}

const statusOf = (amountCents: number, paidCents: number): InstallmentStatus =>
  paidCents >= amountCents ? 'PAID' : paidCents > 0 ? 'PARTIAL' : 'PENDING';

/** Applies an amount to the installments, oldest due date first (the API's rule). */
export function allocatePayment(
  installments: readonly Installment[],
  amount: number,
): { installments: Installment[]; allocations: InstallmentAllocation[] } {
  let remaining = toCents(amount);
  const allocations: InstallmentAllocation[] = [];
  const updated = installments.map((installment) => ({ ...installment }));
  const ordered = [...updated].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime() || a.number - b.number,
  );

  for (const installment of ordered) {
    if (remaining <= 0) break;
    const due = toCents(installment.amount) - toCents(installment.paidAmount);
    if (due <= 0) continue;
    const applied = Math.min(due, remaining);
    const paid = toCents(installment.paidAmount) + applied;
    installment.paidAmount = fromCents(paid);
    installment.status = statusOf(toCents(installment.amount), paid);
    allocations.push({
      installmentId: installment.id,
      installmentNumber: installment.number,
      amount: fromCents(applied),
    });
    remaining -= applied;
  }

  return { installments: updated, allocations };
}

/** Unpaid amount of the installments due before `asOf` minus `graceDays`. */
export function overdueAmountOf(
  installments: readonly Installment[],
  asOf: Date,
  graceDays: number,
): number {
  const limit = asOf.getTime() - graceDays * DAY_MS;
  const cents = installments
    .filter((installment) => new Date(installment.dueDate).getTime() < limit)
    .reduce(
      (sum, installment) =>
        sum + Math.max(0, toCents(installment.amount) - toCents(installment.paidAmount)),
      0,
    );
  return fromCents(cents);
}

/** Positive, at most two decimals. */
export function isValidAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0 && Math.abs(toCents(amount) - amount * 100) < 1e-6;
}
