import { VisitEntity } from '@/core/entities/visit.entity';
import {
  VISIT_OUTCOMES,
  VISIT_STATUSES,
  VISIT_TYPES,
  type VisitCheckpoint,
  type VisitOutcome,
} from '@/core/types/visit.types';
import type { VisitCheckpointDto, VisitResponseDto } from '@/infrastructure/api/dto/visit.dto';
import { pickEnum } from './enum.mapper';

function toCheckpoint(dto: VisitCheckpointDto | null): VisitCheckpoint | null {
  if (!dto) return null;
  const hasLocation = dto.latitude !== null && dto.longitude !== null;
  return {
    at: dto.at,
    location: hasLocation
      ? {
          latitude: dto.latitude as number,
          longitude: dto.longitude as number,
          ...(dto.accuracyMeters !== null && { accuracyMeters: dto.accuracyMeters }),
        }
      : null,
  };
}

export class VisitMapper {
  /** Server visit (as delivered by `GET /sync/pull`). */
  static toDomain(dto: VisitResponseDto): VisitEntity {
    return VisitEntity.create({
      id: dto.id,
      type: pickEnum(dto.type, VISIT_TYPES, 'OPPORTUNITY'),
      status: pickEnum(dto.status, VISIT_STATUSES, 'SCHEDULED'),
      outcome: dto.outcome
        ? pickEnum<VisitOutcome | null>(dto.outcome, VISIT_OUTCOMES, null)
        : null,
      scheduledAt: dto.scheduledAt,
      notes: dto.notes,
      start: toCheckpoint(dto.start),
      end: toCheckpoint(dto.end),
      distanceToCustomerMeters: dto.distanceToCustomerMeters,
      durationMinutes: dto.durationMinutes,
      photoUrl: dto.photoUrl,
      photoLocalUri: null,
      cancellationReason: dto.cancellationReason,
      sellerId: dto.sellerId,
      sellerName: dto.seller?.name ?? null,
      createdById: dto.createdById,
      customerId: dto.customerId,
      parentVisitId: dto.parentVisitId,
      customer: dto.customer
        ? {
            id: dto.customer.id,
            tradeName: dto.customer.tradeName,
            status: dto.customer.status === 'ACTIVE' ? 'ACTIVE' : 'PROSPECT',
            contactName: dto.customer.contactName,
            phone: dto.customer.phone,
            address: dto.customer.address,
            latitude: dto.customer.latitude,
            longitude: dto.customer.longitude,
            storePhotoUrl: dto.customer.storePhotoUrl,
          }
        : null,
      syncStatus: 'SYNCED',
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}
