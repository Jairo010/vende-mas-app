import type { AxiosInstance } from 'axios';
import { SyncApiService } from '@/infrastructure/api/services/sync-api.service';
import type { SyncPullResponseDto } from '@/infrastructure/api/dto/sync.dto';

function envelope<T>(data: T) {
  return { data: { success: true, data, meta: { requestId: 'r', timestamp: 't' } } };
}

const customer = {
  id: 'customer-1',
  status: 'ACTIVE',
  tradeName: 'Lubricadora El Pana',
  businessName: null,
  identificationType: 'RUC',
  identification: '1712345675001',
  contactName: null,
  phone: null,
  email: null,
  address: null,
  addressReference: null,
  latitude: null,
  longitude: null,
  storePhotoUrl: null,
  storePhotoUpdatedAt: null,
  assignedSellerId: 'seller-1',
  createdById: null,
  externalId: null,
  billingSyncStatus: 'EXPORTED',
  source: 'LOCAL',
  isActive: true,
  deletedAt: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

describe('SyncApiService', () => {
  let client: jest.Mocked<Pick<AxiosInstance, 'get' | 'post'>>;
  let service: SyncApiService;

  beforeEach(() => {
    client = { get: jest.fn(), post: jest.fn() };
    service = new SyncApiService(client as unknown as AxiosInstance);
  });

  it('pushes operations and maps the per-operation verdicts', async () => {
    client.post.mockResolvedValue(
      envelope({
        results: [
          {
            idempotencyKey: 'k1',
            entityType: 'VISIT',
            entityId: 'v1',
            action: 'START',
            status: 'APPLIED',
            serverTimestamp: 't',
            data: { status: 'IN_PROGRESS' },
          },
          {
            idempotencyKey: 'k2',
            entityType: 'VISIT',
            entityId: 'v1',
            action: 'COMPLETE',
            status: 'REJECTED',
            serverTimestamp: 't',
            error: { code: 'VISIT_STORE_PHOTO_REQUIRED', message: 'Foto requerida' },
          },
          {
            idempotencyKey: 'k3',
            entityType: 'VISIT',
            entityId: 'v1',
            action: 'CANCEL',
            status: 'SOMETHING_NEW',
            serverTimestamp: 't',
          },
        ],
        summary: { total: 3, applied: 1, duplicates: 0, rejected: 1, retry: 0, skipped: 0 },
      }),
    );

    const results = await service.push([
      {
        idempotencyKey: 'k1',
        entityType: 'VISIT',
        entityId: 'v1',
        action: 'START',
        clientTimestamp: 't',
        payload: {},
      },
    ]);

    expect(client.post).toHaveBeenCalledWith('/api/v1/sync/push', {
      operations: [expect.objectContaining({ idempotencyKey: 'k1' })],
    });
    expect(results.map((r) => r.status)).toEqual(['APPLIED', 'REJECTED', 'RETRY']);
    expect(results[1].error).toEqual({
      code: 'VISIT_STORE_PHOTO_REQUIRED',
      message: 'Foto requerida',
    });
  });

  it('pulls with the cursor and splits customer tombstones and inactive promotions', async () => {
    const response: SyncPullResponseDto = {
      serverTime: '2026-10-14T15:00:00.000Z',
      cursor: 'next',
      hasMore: true,
      visits: [],
      customers: [customer, { ...customer, id: 'gone', deletedAt: '2026-10-13T00:00:00.000Z' }],
      orders: [],
      products: [],
      categories: [],
      promotions: [
        {
          id: 'p1',
          name: 'A',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          targetType: 'GLOBAL',
          targetProductIds: [],
          minQuantity: 1,
          startsAt: 's',
          endsAt: 'e',
          isActive: true,
          createdAt: 'c',
          updatedAt: 'u',
        },
        {
          id: 'p2',
          name: 'B',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          targetType: 'GLOBAL',
          targetProductIds: [],
          minQuantity: 1,
          startsAt: 's',
          endsAt: 'e',
          isActive: false,
          createdAt: 'c',
          updatedAt: 'u',
        },
      ],
    };
    client.get.mockResolvedValue(envelope(response));

    const changes = await service.pull('cursor-1');

    expect(client.get).toHaveBeenCalledWith('/api/v1/sync/pull', {
      params: { cursor: 'cursor-1' },
    });
    expect(changes.cursor).toBe('next');
    expect(changes.hasMore).toBe(true);
    expect(changes.customers.map((c) => c.id)).toEqual(['customer-1']);
    expect(changes.customers[0].identificationType).toBe('RUC');
    expect(changes.deletedCustomerIds).toEqual(['gone']);
    expect(changes.promotions.map((p) => p.id)).toEqual(['p1']);
  });

  it('omits the cursor on the first download', async () => {
    client.get.mockResolvedValue(
      envelope({
        serverTime: 't',
        cursor: 'c',
        hasMore: false,
        visits: [],
        customers: [],
        orders: [],
        products: [],
        categories: [],
        promotions: [],
      }),
    );

    await service.pull(null);

    expect(client.get).toHaveBeenCalledWith('/api/v1/sync/pull', { params: undefined });
  });

  it('uploads a photo as multipart with the client photoId', async () => {
    client.post.mockResolvedValue(
      envelope({
        url: '/api/v1/files/photos/photo-1.jpg',
        filename: 'photo-1.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1,
        alreadyExisted: false,
      }),
    );

    const url = await service.uploadPhoto(
      'photo-1',
      'file:///documents/pending-photos/photo-1.jpg',
    );

    expect(url).toBe('/api/v1/files/photos/photo-1.jpg');
    const [endpoint, body, config] = client.post.mock.calls[0];
    expect(endpoint).toBe('/api/v1/files/photos');
    expect(body).toBeInstanceOf(FormData);
    expect(config).toMatchObject({ headers: { 'Content-Type': 'multipart/form-data' } });
  });
});
