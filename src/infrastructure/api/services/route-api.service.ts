import type { AxiosInstance } from 'axios';
import { DomainError, NetworkError } from '@/core/errors/domain.error';
import type { IRouteOptimizerPort } from '@/core/ports/route-optimizer.port';
import type { GeoPoint } from '@/core/types/geo.types';
import type { RoutePlan, RouteStop } from '@/core/types/route.types';
import { estimateRoute, solveOpenRoute } from '@/core/value-objects/open-route-heuristic';
import { apiClient } from '@/infrastructure/api/client/api-client';
import { unwrapApiData } from '@/infrastructure/api/client/unwrap-response';
import type {
  OptimizeRouteRequestDto,
  RoutePlanResponseDto,
} from '@/infrastructure/api/dto/route.dto';
import { API_ENDPOINTS } from '@/shared/constants/api.constants';

/**
 * No connection, a server without the endpoint yet, or a server failure: the seller still
 * gets an order (estimated on the device). Other errors are real bugs and are surfaced.
 */
function canEstimateLocally(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  if (!(error instanceof DomainError)) return false;
  return error.statusCode === 404 || error.statusCode === 429 || error.statusCode >= 500;
}

/**
 * Optimal route of the day from the API (Google Routes behind a cost guard, or the server's
 * estimate once the free monthly calls are spent). Offline it estimates on the device with
 * the same algorithm.
 */
export class RouteApiService implements IRouteOptimizerPort {
  constructor(private readonly client: AxiosInstance = apiClient) {}

  public async optimize(origin: GeoPoint, stops: readonly RouteStop[]): Promise<RoutePlan> {
    const body: OptimizeRouteRequestDto = {
      origin: { latitude: origin.latitude, longitude: origin.longitude },
      stops: stops.map((stop) => ({
        id: stop.id,
        latitude: stop.point.latitude,
        longitude: stop.point.longitude,
      })),
    };

    try {
      const response = await this.client.post<unknown>(API_ENDPOINTS.routes.optimize, body);
      return this.toPlan(origin, stops, unwrapApiData<RoutePlanResponseDto>(response.data));
    } catch (error) {
      if (!canEstimateLocally(error)) throw error;
      return estimateRoute(origin, solveOpenRoute(origin, stops));
    }
  }

  private toPlan(
    origin: GeoPoint,
    stops: readonly RouteStop[],
    dto: RoutePlanResponseDto,
  ): RoutePlan {
    const byId = new Map(stops.map((stop) => [stop.id, stop]));
    const legs = dto.legs.flatMap((leg) => {
      const stop = byId.get(leg.stopId);
      return stop
        ? [
            {
              stopId: leg.stopId,
              point: stop.point,
              distanceMeters: leg.distanceMeters,
              durationSeconds: leg.durationSeconds,
            },
          ]
        : [];
    });
    // The server orders exactly the stops it was sent; anything else is not trusted.
    if (legs.length !== stops.length) return estimateRoute(origin, solveOpenRoute(origin, stops));

    return {
      provider: dto.provider === 'GOOGLE' ? 'GOOGLE' : 'ESTIMATE',
      origin,
      legs,
      totalDistanceMeters: dto.totalDistanceMeters,
      totalDurationSeconds: dto.totalDurationSeconds,
      encodedPolyline: dto.encodedPolyline,
      computedAt: dto.computedAt,
    };
  }
}

export const routeApiService = new RouteApiService();
