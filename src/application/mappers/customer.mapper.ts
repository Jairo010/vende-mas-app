import { CustomerEntity } from '@/core/entities/customer.entity';
import {
  CUSTOMER_STATUSES,
  IDENTIFICATION_TYPES,
  type BillingSyncStatus,
  type IdentificationType,
} from '@/core/types/customer.types';
import type { CustomerResponseDto } from '@/infrastructure/api/dto/customer.dto';
import { pickEnum } from './enum.mapper';

const BILLING_SYNC_STATUSES = ['NOT_REQUIRED', 'PENDING', 'EXPORTED', 'FAILED'] as const;

export class CustomerMapper {
  static toDomain(dto: CustomerResponseDto): CustomerEntity {
    return CustomerEntity.create({
      id: dto.id,
      status: pickEnum(dto.status, CUSTOMER_STATUSES, 'PROSPECT'),
      tradeName: dto.tradeName,
      businessName: dto.businessName,
      identificationType: dto.identificationType
        ? pickEnum<IdentificationType | null>(dto.identificationType, IDENTIFICATION_TYPES, null)
        : null,
      identification: dto.identification,
      contactName: dto.contactName,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      addressReference: dto.addressReference,
      latitude: dto.latitude,
      longitude: dto.longitude,
      storePhotoUrl: dto.storePhotoUrl,
      storePhotoLocalUri: null,
      assignedSellerId: dto.assignedSellerId,
      createdById: dto.createdById,
      externalId: dto.externalId,
      billingSyncStatus: pickEnum<BillingSyncStatus>(
        dto.billingSyncStatus,
        BILLING_SYNC_STATUSES,
        'NOT_REQUIRED',
      ),
      isActive: dto.isActive,
      syncStatus: 'SYNCED',
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }
}
