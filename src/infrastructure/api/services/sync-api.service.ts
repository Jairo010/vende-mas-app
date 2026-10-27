import { CompanyMapper } from '@/application/mappers/company.mapper';
import type { AxiosInstance } from 'axios';
import { CatalogMapper } from '@/application/mappers/catalog.mapper';
import { CollectionMapper } from '@/application/mappers/collection.mapper';
import { CustomerMapper } from '@/application/mappers/customer.mapper';
import { pickEnum } from '@/application/mappers/enum.mapper';
import { OrderMapper } from '@/application/mappers/order.mapper';
import { VisitMapper } from '@/application/mappers/visit.mapper';
import type { ISyncRemotePort, SyncChangeSet } from '@/core/ports/sync.ports';
import type {
  SyncAction,
  SyncEntityType,
  SyncPushOperation,
  SyncPushResult,
  SyncResultStatus,
} from '@/core/types/sync.types';
import { apiClient } from '@/infrastructure/api/client/api-client';
import { unwrapApiData } from '@/infrastructure/api/client/unwrap-response';
import type {
  SyncPullResponseDto,
  SyncPushRequestDto,
  SyncPushResponseDto,
  UploadPhotoResponseDto,
} from '@/infrastructure/api/dto/sync.dto';
import { API_ENDPOINTS } from '@/shared/constants/api.constants';

const RESULT_STATUSES: readonly SyncResultStatus[] = [
  'APPLIED',
  'DUPLICATE',
  'REJECTED',
  'RETRY',
  'SKIPPED',
];

function photoMimeType(uri: string): string {
  const extension = uri.split('?')[0].split('.').pop()?.toLowerCase();
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return 'image/jpeg';
}

/**
 * Remote side of the offline protocol. Only the sync engine uses it: screens read and
 * write the local database through the SQLite repositories.
 */
export class SyncApiService implements ISyncRemotePort {
  constructor(private readonly client: AxiosInstance = apiClient) {}

  public async push(operations: SyncPushOperation[]): Promise<SyncPushResult[]> {
    const body: SyncPushRequestDto = { operations };
    const response = await this.client.post<unknown>(API_ENDPOINTS.sync.push, body);
    const data = unwrapApiData<SyncPushResponseDto>(response.data);

    return data.results.map((item) => ({
      idempotencyKey: item.idempotencyKey,
      entityType: item.entityType as SyncEntityType,
      entityId: item.entityId,
      action: item.action as SyncAction,
      // An unknown verdict is treated as transient so nothing is lost.
      status: pickEnum<SyncResultStatus>(item.status, RESULT_STATUSES, 'RETRY'),
      ...(item.data !== undefined && { data: item.data }),
      ...(item.error && { error: { code: item.error.code, message: item.error.message } }),
    }));
  }

  public async pull(cursor: string | null): Promise<SyncChangeSet> {
    const response = await this.client.get<unknown>(API_ENDPOINTS.sync.pull, {
      params: cursor ? { cursor } : undefined,
    });
    const data = unwrapApiData<SyncPullResponseDto>(response.data);

    return {
      serverTime: data.serverTime,
      cursor: data.cursor,
      hasMore: data.hasMore,
      visits: data.visits.map(VisitMapper.toDomain),
      customers: data.customers.filter((c) => !c.deletedAt).map(CustomerMapper.toDomain),
      deletedCustomerIds: data.customers.filter((c) => c.deletedAt).map((c) => c.id),
      orders: data.orders.map(OrderMapper.toDomain),
      products: data.products.map(CatalogMapper.toProduct),
      categories: data.categories.map(CatalogMapper.toCategory),
      promotions: data.promotions.filter((p) => p.isActive).map(CatalogMapper.toPromotion),
      receivables: (data.receivables ?? []).map(CollectionMapper.toReceivable),
      payments: (data.payments ?? []).map(CollectionMapper.toPayment),
      settings: CollectionMapper.toSettings(data.settings),
      company: CompanyMapper.toProfile(data.company),
    };
  }

  public async uploadPhoto(photoId: string, localUri: string): Promise<string> {
    const form = new FormData();
    const type = photoMimeType(localUri);
    // React Native FormData accepts a { uri, name, type } file descriptor.
    form.append('photo', {
      uri: localUri,
      name: `${photoId}.${type.split('/')[1]}`,
      type,
    } as unknown as Blob);
    form.append('photoId', photoId);

    const response = await this.client.post<unknown>(API_ENDPOINTS.files.photos, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
    });
    return unwrapApiData<UploadPhotoResponseDto>(response.data).url;
  }
}

export const syncApiService = new SyncApiService();
