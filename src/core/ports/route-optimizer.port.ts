import type { GeoPoint } from '../types/geo.types';
import type { RoutePlan, RouteStop } from '../types/route.types';

/**
 * Orders today's visits as an open route from the seller's position. Online it asks the API
 * (Google Routes behind a cost guard); offline it falls back to the local estimate, so it
 * always returns a plan.
 */
export interface IRouteOptimizerPort {
  optimize(origin: GeoPoint, stops: readonly RouteStop[]): Promise<RoutePlan>;
}
