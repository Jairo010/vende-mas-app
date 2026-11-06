import type { RouteDay } from '../types/route.types';

/** The seller's weekly route, downloaded by the sync (read only on the device). */
export interface IRouteDayRepositoryPort {
  findAll(): Promise<RouteDay[]>;
}
