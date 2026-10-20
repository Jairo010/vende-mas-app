import { VisitEntity, type VisitCustomerSummary } from '@/core/entities/visit.entity';
import type { GeoPoint } from '@/core/types/geo.types';
import type {
  LocalSyncStatus,
  VisitCheckpoint,
  VisitOutcome,
  VisitStatus,
  VisitType,
} from '@/core/types/visit.types';
import type { visits } from '../schema';
import type { CustomerRow } from './customer-row.mapper';

export type VisitRow = typeof visits.$inferSelect;
export type VisitInsert = typeof visits.$inferInsert;

function toCheckpoint(
  at: string | null,
  latitude: number | null,
  longitude: number | null,
  accuracyMeters: number | null,
): VisitCheckpoint | null {
  if (!at) return null;
  const location: GeoPoint | null =
    latitude !== null && longitude !== null
      ? { latitude, longitude, ...(accuracyMeters !== null && { accuracyMeters }) }
      : null;
  return { at, location };
}

function toCustomerSummary(row: CustomerRow | null): VisitCustomerSummary | null {
  if (!row) return null;
  return {
    id: row.id,
    tradeName: row.tradeName,
    status: row.status === 'ACTIVE' ? 'ACTIVE' : 'PROSPECT',
    contactName: row.contactName,
    phone: row.phone,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    storePhotoUrl: row.storePhotoUrl ?? row.storePhotoLocalUri,
  };
}

export class VisitRowMapper {
  static toDomain(row: VisitRow, customer: CustomerRow | null): VisitEntity {
    return VisitEntity.create({
      id: row.id,
      type: row.type as VisitType,
      status: row.status as VisitStatus,
      outcome: row.outcome as VisitOutcome | null,
      scheduledAt: row.scheduledAt,
      notes: row.notes,
      start: toCheckpoint(
        row.startedAt,
        row.startLatitude,
        row.startLongitude,
        row.startAccuracyMeters,
      ),
      end: toCheckpoint(row.endedAt, row.endLatitude, row.endLongitude, row.endAccuracyMeters),
      distanceToCustomerMeters: row.distanceToCustomerMeters,
      durationMinutes: row.durationMinutes,
      photoUrl: row.photoUrl,
      photoLocalUri: row.photoLocalUri,
      cancellationReason: row.cancellationReason,
      sellerId: row.sellerId,
      sellerName: row.sellerName,
      createdById: row.createdById,
      customerId: row.customerId,
      parentVisitId: row.parentVisitId,
      customer: toCustomerSummary(customer),
      syncStatus: row.syncStatus as LocalSyncStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /** Server columns only: local-only columns (photo URI, sync status) are left untouched. */
  static toServerColumns(entity: VisitEntity): VisitInsert {
    return {
      id: entity.id,
      type: entity.type,
      status: entity.status,
      outcome: entity.outcome,
      scheduledAt: entity.scheduledAt,
      notes: entity.notes,
      startedAt: entity.start?.at ?? null,
      startLatitude: entity.start?.location?.latitude ?? null,
      startLongitude: entity.start?.location?.longitude ?? null,
      startAccuracyMeters: entity.start?.location?.accuracyMeters ?? null,
      endedAt: entity.end?.at ?? null,
      endLatitude: entity.end?.location?.latitude ?? null,
      endLongitude: entity.end?.location?.longitude ?? null,
      endAccuracyMeters: entity.end?.location?.accuracyMeters ?? null,
      distanceToCustomerMeters: entity.distanceToCustomerMeters,
      durationMinutes: entity.durationMinutes,
      photoUrl: entity.photoUrl,
      cancellationReason: entity.cancellationReason,
      sellerId: entity.sellerId,
      sellerName: entity.sellerName,
      createdById: entity.createdById,
      customerId: entity.customerId,
      parentVisitId: entity.parentVisitId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
