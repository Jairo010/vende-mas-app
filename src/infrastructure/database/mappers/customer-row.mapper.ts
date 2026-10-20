import { CustomerEntity } from '@/core/entities/customer.entity';
import type {
  BillingSyncStatus,
  CustomerStatus,
  IdentificationType,
} from '@/core/types/customer.types';
import type { LocalSyncStatus } from '@/core/types/visit.types';
import type { customers } from '../schema';

export type CustomerRow = typeof customers.$inferSelect;
export type CustomerInsert = typeof customers.$inferInsert;

export class CustomerRowMapper {
  static toDomain(row: CustomerRow): CustomerEntity {
    return CustomerEntity.create({
      id: row.id,
      status: row.status as CustomerStatus,
      tradeName: row.tradeName,
      businessName: row.businessName,
      identificationType: row.identificationType as IdentificationType | null,
      identification: row.identification,
      contactName: row.contactName,
      phone: row.phone,
      email: row.email,
      address: row.address,
      addressReference: row.addressReference,
      latitude: row.latitude,
      longitude: row.longitude,
      storePhotoUrl: row.storePhotoUrl,
      storePhotoLocalUri: row.storePhotoLocalUri,
      assignedSellerId: row.assignedSellerId,
      createdById: row.createdById,
      externalId: row.externalId,
      billingSyncStatus: row.billingSyncStatus as BillingSyncStatus,
      isActive: row.isActive,
      syncStatus: row.syncStatus as LocalSyncStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /** Server columns only: local-only columns (photo URI, sync status) are left untouched. */
  static toServerColumns(entity: CustomerEntity): CustomerInsert {
    return {
      id: entity.id,
      status: entity.status,
      tradeName: entity.tradeName,
      businessName: entity.businessName,
      identificationType: entity.identificationType,
      identification: entity.identification,
      contactName: entity.contactName,
      phone: entity.phone,
      email: entity.email,
      address: entity.address,
      addressReference: entity.addressReference,
      latitude: entity.latitude,
      longitude: entity.longitude,
      storePhotoUrl: entity.storePhotoUrl,
      assignedSellerId: entity.assignedSellerId,
      createdById: entity.createdById,
      externalId: entity.externalId,
      billingSyncStatus: entity.billingSyncStatus,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
