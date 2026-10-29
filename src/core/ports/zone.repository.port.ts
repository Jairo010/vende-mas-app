import type { Zone } from '../types/customer.types';

/** Active zones of the company, downloaded by the sync (read only on the device). */
export interface IZoneRepositoryPort {
  /** By name. */
  findAll(): Promise<Zone[]>;
}
