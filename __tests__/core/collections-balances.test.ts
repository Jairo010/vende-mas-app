import { suggestNextVisit } from '@/core/value-objects/next-visit';
import { allocatePayment } from '@/core/value-objects/payment-schedule';
import type { Installment } from '@/core/types/collection.types';

const installment = (number: number, dueDate: string, paidAmount = 0): Installment => ({
  id: `installment-${number}`,
  number,
  dueDate,
  amount: 50,
  paidAmount,
  status: paidAmount === 0 ? 'PENDING' : paidAmount >= 50 ? 'PAID' : 'PARTIAL',
});

describe('payment balances (API ADR 0044)', () => {
  it('applies $20 then $50 oldest first and keeps what each installment owed', () => {
    const start = [
      installment(1, '2026-11-20T17:00:00.000Z'),
      installment(2, '2026-11-27T17:00:00.000Z'),
    ];

    const first = allocatePayment(start, 20);
    expect(first.allocations).toEqual([
      { installmentId: 'installment-1', installmentNumber: 1, amount: 20, balanceBefore: 50 },
    ]);

    const second = allocatePayment(first.installments, 50);
    expect(second.allocations).toEqual([
      { installmentId: 'installment-1', installmentNumber: 1, amount: 30, balanceBefore: 30 },
      { installmentId: 'installment-2', installmentNumber: 2, amount: 20, balanceBefore: 50 },
    ]);
    expect(second.installments.map((item) => item.status)).toEqual(['PAID', 'PARTIAL']);
  });
});

describe('suggestNextVisit', () => {
  const now = new Date('2026-11-16T15:00:00.000Z');

  it('goes back to collect on the next installment still owed', () => {
    expect(
      suggestNextVisit(
        {
          type: 'COLLECTION',
          outcome: 'PARTIALLY_COLLECTED',
          pendingInstallments: [
            installment(1, '2026-11-10T17:00:00.000Z', 50),
            installment(2, '2026-11-27T17:00:00.000Z', 20),
            installment(3, '2026-12-04T17:00:00.000Z'),
          ],
        },
        now,
      ),
    ).toEqual({ type: 'COLLECTION', dueDate: '2026-11-27T17:00:00.000Z' });
  });

  it('still collects when only overdue installments are left (the wizard proposes a week)', () => {
    expect(
      suggestNextVisit(
        {
          type: 'COLLECTION',
          outcome: null,
          pendingInstallments: [installment(1, '2026-11-10T17:00:00.000Z')],
        },
        now,
      ),
    ).toEqual({ type: 'COLLECTION', dueDate: null });
  });

  it('takes an order next when the collection left nothing owed', () => {
    expect(
      suggestNextVisit(
        {
          type: 'COLLECTION',
          outcome: null,
          pendingInstallments: [installment(1, '2026-11-27T17:00:00.000Z', 50)],
        },
        now,
      ),
    ).toEqual({ type: 'ORDER', dueDate: null });
  });

  it('keeps the old rule for other visits', () => {
    expect(
      suggestNextVisit(
        { type: 'OPPORTUNITY', outcome: 'SALE_CLOSED', pendingInstallments: [] },
        now,
      ),
    ).toEqual({ type: 'ORDER', dueDate: null });
    expect(
      suggestNextVisit({ type: 'OPPORTUNITY', outcome: null, pendingInstallments: [] }, now),
    ).toEqual({ type: 'OPPORTUNITY', dueDate: null });
  });
});
