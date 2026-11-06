import type { IRouteDayRepositoryPort } from '@/core/ports/route-day.repository.port';
import type { RouteDay } from '@/core/types/route.types';
import { routeDays } from '../schema';
import { defaultRepositoryContext, type RepositoryContext } from './repository.context';

export class SqliteRouteDayRepository implements IRouteDayRepositoryPort {
  constructor(private readonly ctx: RepositoryContext = defaultRepositoryContext) {}

  public async findAll(): Promise<RouteDay[]> {
    return this.ctx.db().select().from(routeDays).all();
  }
}

export const sqliteRouteDayRepository = new SqliteRouteDayRepository();
