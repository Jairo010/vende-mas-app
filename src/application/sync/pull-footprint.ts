import type { SyncChangeSet } from '@/core/ports/sync.ports';

/**
 * Whether a pull page brings rows of the streams that only send what changed (visits,
 * customers, orders, catalog, collections).
 */
export function hasChangedRows(changes: SyncChangeSet): boolean {
  return (
    changes.visits.length > 0 ||
    changes.customers.length > 0 ||
    changes.deletedCustomerIds.length > 0 ||
    changes.orders.length > 0 ||
    changes.products.length > 0 ||
    changes.categories.length > 0 ||
    changes.receivables.length > 0 ||
    changes.payments.length > 0 ||
    changes.customerProducts.length > 0 ||
    changes.removedCustomerProductIds.length > 0
  );
}

/**
 * Text that identifies what a pull says about the streams that always come in full
 * (promotions, zones, route, rules, company): equal texts mean nothing changed there.
 */
export function fullListsFootprint(changes: SyncChangeSet): string {
  return JSON.stringify([
    changes.promotions,
    changes.zones,
    changes.routeDays,
    changes.settings,
    changes.company,
  ]);
}
