import { asc } from 'drizzle-orm';
import type { IZoneRepositoryPort } from '@/core/ports/zone.repository.port';
import type { Zone } from '@/core/types/customer.types';
import { zones } from '../schema';
import { defaultRepositoryContext, type RepositoryContext } from './repository.context';

export class SqliteZoneRepository implements IZoneRepositoryPort {
  constructor(private readonly ctx: RepositoryContext = defaultRepositoryContext) {}

  public async findAll(): Promise<Zone[]> {
    return this.ctx.db().select().from(zones).orderBy(asc(zones.name)).all();
  }
}

export const sqliteZoneRepository = new SqliteZoneRepository();
