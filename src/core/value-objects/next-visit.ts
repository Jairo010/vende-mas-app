import type { Installment } from '../types/collection.types';
import type { VisitOutcome, VisitType } from '../types/visit.types';
import { toCents } from './payment-schedule';

export interface FinishedVisitFacts {
  type: VisitType;
  outcome: VisitOutcome | null;
  /** The customer's installments still owing something, after the visit. */
  pendingInstallments: readonly Pick<Installment, 'dueDate' | 'amount' | 'paidAmount'>[];
}

export interface NextVisitSuggestion {
  type: VisitType;
  /** ISO instant of the next installment due after `now`, when there is one to go for. */
  dueDate: string | null;
}

/**
 * What the mandatory next visit opens with (app ADR 0015, API ADR 0044):
 * - after a collection the customer still owes → another collection, on the next installment
 *   due after today (the wizard snaps it to a route day; one week when none is ahead);
 * - after a collection that left nothing owed → an order visit;
 * - a closed sale → an order visit; otherwise the same type.
 */
export function suggestNextVisit(facts: FinishedVisitFacts, now: Date): NextVisitSuggestion {
  const owing = facts.pendingInstallments.filter(
    (installment) => toCents(installment.amount) > toCents(installment.paidAmount),
  );
  if (facts.type === 'COLLECTION') {
    if (owing.length === 0) return { type: 'ORDER', dueDate: null };
    const ahead = owing
      .map((installment) => installment.dueDate)
      .filter((dueDate) => new Date(dueDate).getTime() > now.getTime())
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return { type: 'COLLECTION', dueDate: ahead[0] ?? null };
  }
  return { type: facts.outcome === 'SALE_CLOSED' ? 'ORDER' : facts.type, dueDate: null };
}
