import { SyncEngine, MAX_PHOTO_ATTEMPTS } from '@/application/sync/sync-engine';
import { NetworkError, ValidationError } from '@/core/errors/domain.error';
import type {
  INetworkStatusPort,
  IOutboxPort,
  IPendingPhotoPort,
  ISyncLocalStorePort,
  ISyncRemotePort,
  SyncChangeSet,
} from '@/core/ports/sync.ports';
import type { OutboxOperation, PendingPhoto, SyncPushResult } from '@/core/types/sync.types';

function operation(seq: number, overrides: Partial<OutboxOperation> = {}): OutboxOperation {
  return {
    seq,
    idempotencyKey: `key-${seq}`,
    entityType: 'VISIT',
    entityId: `visit-${seq}`,
    action: 'START',
    payload: { startedAt: '2026-10-14T09:00:00-05:00' },
    clientTimestamp: '2026-10-14T09:00:00-05:00',
    photoId: null,
    photoField: null,
    status: 'PENDING',
    attempts: 0,
    lastError: null,
    createdAt: '2026-10-14T14:00:00.000Z',
    ...overrides,
  };
}

function changes(overrides: Partial<SyncChangeSet> = {}): SyncChangeSet {
  return {
    serverTime: '2026-10-14T15:00:00.000Z',
    cursor: 'cursor-1',
    hasMore: false,
    visits: [],
    customers: [],
    deletedCustomerIds: [],
    orders: [],
    products: [],
    categories: [],
    promotions: [],
    receivables: [],
    payments: [],
    settings: null,
    ...overrides,
  };
}

/** In-memory outbox that behaves like the SQLite one. */
class FakeOutbox implements IOutboxPort {
  public accepted: number[] = [];
  public rejected: number[] = [];
  public retried: number[] = [];
  constructor(public queue: OutboxOperation[]) {}
  async listPending(limit: number) {
    return this.queue.filter((op) => op.status === 'PENDING').slice(0, limit);
  }
  async listRejected() {
    return this.queue.filter((op) => op.status === 'REJECTED');
  }
  async countPending() {
    return this.queue.filter((op) => op.status === 'PENDING').length;
  }
  async markAccepted(seq: number) {
    this.accepted.push(seq);
    this.queue = this.queue.filter((op) => op.seq !== seq);
  }
  async markRejected(seq: number) {
    this.rejected.push(seq);
    this.queue = this.queue.map((op) => (op.seq === seq ? { ...op, status: 'REJECTED' } : op));
  }
  async markRetry(seq: number) {
    this.retried.push(seq);
  }
  async discard() {}
  async requeue() {}
}

class FakePhotos implements IPendingPhotoPort {
  public urls = new Map<string, string>();
  constructor(public photos: PendingPhoto[] = []) {}
  async listToUpload() {
    return this.photos.filter((p) => !this.urls.has(p.id));
  }
  async findRemoteUrl(id: string) {
    return this.urls.get(id) ?? null;
  }
  async markUploaded(id: string, url: string) {
    this.urls.set(id, url);
  }
  async markFailed(id: string) {
    const photo = this.photos.find((p) => p.id === id);
    if (photo) photo.attempts += 1;
  }
}

function accept(ops: { idempotencyKey: string }[]): SyncPushResult[] {
  return ops.map((op) => ({
    idempotencyKey: op.idempotencyKey,
    entityType: 'VISIT',
    entityId: 'x',
    action: 'START',
    status: 'APPLIED',
  }));
}

describe('SyncEngine', () => {
  let outbox: FakeOutbox;
  let photos: FakePhotos;
  let remote: jest.Mocked<ISyncRemotePort>;
  let localStore: jest.Mocked<ISyncLocalStorePort>;
  let network: jest.Mocked<INetworkStatusPort>;

  const engine = () =>
    new SyncEngine({
      outbox,
      photos,
      remote,
      localStore,
      network,
      now: () => new Date('2026-10-14T15:00:00.000Z'),
    });

  beforeEach(() => {
    outbox = new FakeOutbox([operation(1), operation(2)]);
    photos = new FakePhotos();
    remote = {
      push: jest.fn(async (ops) => accept(ops)),
      pull: jest.fn(async (_cursor: string | null) => changes()),
      uploadPhoto: jest.fn(async (id: string, _uri: string) => `/api/v1/files/photos/${id}.jpg`),
    };
    localStore = {
      applyPull: jest.fn(async (_changes: SyncChangeSet) => {}),
      getCursor: jest.fn(async (): Promise<string | null> => null),
      setCursor: jest.fn(async (_cursor: string | null) => {}),
      getLastSyncedAt: jest.fn(async (): Promise<string | null> => null),
      setLastSyncedAt: jest.fn(async (_at: string) => {}),
      clearAll: jest.fn(async () => {}),
    };
    network = {
      isOnline: jest.fn(async () => true),
      subscribe: jest.fn((_listener: (online: boolean) => void) => () => {}),
    };
  });

  it('pushes queued operations in order, then pulls and records the sync time', async () => {
    const summary = await engine().run();

    expect(remote.push).toHaveBeenCalledWith([
      expect.objectContaining({ idempotencyKey: 'key-1' }),
      expect.objectContaining({ idempotencyKey: 'key-2' }),
    ]);
    expect(outbox.accepted).toEqual([1, 2]);
    expect(remote.pull.mock.invocationCallOrder[0]).toBeGreaterThan(
      remote.push.mock.invocationCallOrder[0],
    );
    expect(localStore.setLastSyncedAt).toHaveBeenCalledWith('2026-10-14T15:00:00.000Z');
    expect(summary).toEqual({ pushed: 2, rejected: 0, pending: 0, pulled: true, error: null });
  });

  it('does nothing but report OFFLINE when there is no connection', async () => {
    network.isOnline.mockResolvedValue(false);

    const summary = await engine().run();

    expect(remote.push).not.toHaveBeenCalled();
    expect(remote.pull).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ error: 'OFFLINE', pending: 2, pulled: false });
  });

  it('uploads photos first and injects their server URL into the payload', async () => {
    photos = new FakePhotos([
      { id: 'photo-1', localUri: 'file:///p.jpg', remoteUrl: null, attempts: 0 },
    ]);
    outbox = new FakeOutbox([
      operation(1, {
        action: 'COMPLETE',
        photoId: 'photo-1',
        photoField: 'photoUrl',
        payload: { outcome: 'NO_ORDER' },
      }),
    ]);

    await engine().run();

    expect(remote.uploadPhoto).toHaveBeenCalledWith('photo-1', 'file:///p.jpg');
    expect(remote.push).toHaveBeenCalledWith([
      expect.objectContaining({
        payload: { outcome: 'NO_ORDER', photoUrl: '/api/v1/files/photos/photo-1.jpg' },
      }),
    ]);
  });

  it('holds operations behind a photo that could not be uploaded, keeping the order', async () => {
    photos = new FakePhotos([
      { id: 'photo-1', localUri: 'file:///p.jpg', remoteUrl: null, attempts: 0 },
    ]);
    remote.uploadPhoto.mockRejectedValue(new ValidationError('Unsupported format'));
    outbox = new FakeOutbox([
      operation(1),
      operation(2, { photoId: 'photo-1', photoField: 'photoUrl' }),
      operation(3),
    ]);

    const summary = await engine().run();

    expect(remote.push).toHaveBeenCalledWith([
      expect.objectContaining({ idempotencyKey: 'key-1' }),
    ]);
    expect(summary.pending).toBe(2);
    expect(summary.pulled).toBe(true);
  });

  it(`sends the operation without the photo after ${MAX_PHOTO_ATTEMPTS} failed uploads`, async () => {
    photos = new FakePhotos([
      {
        id: 'photo-1',
        localUri: 'file:///gone.jpg',
        remoteUrl: null,
        attempts: MAX_PHOTO_ATTEMPTS - 1,
      },
    ]);
    remote.uploadPhoto.mockRejectedValue(new ValidationError('File missing'));
    outbox = new FakeOutbox([operation(1, { photoId: 'photo-1', photoField: 'photoUrl' })]);

    await engine().run();

    expect(remote.push).toHaveBeenCalledWith([
      expect.objectContaining({
        idempotencyKey: 'key-1',
        payload: expect.not.objectContaining({ photoUrl: expect.anything() }),
      }),
    ]);
  });

  it('removes REJECTED operations from the queue and keeps RETRY / SKIPPED for later', async () => {
    outbox = new FakeOutbox([operation(1), operation(2), operation(3)]);
    remote.push.mockResolvedValue([
      {
        idempotencyKey: 'key-1',
        entityType: 'VISIT',
        entityId: 'v',
        action: 'START',
        status: 'REJECTED',
        error: { code: 'VISIT_INVALID_TRANSITION', message: 'x' },
      },
      {
        idempotencyKey: 'key-2',
        entityType: 'VISIT',
        entityId: 'v',
        action: 'START',
        status: 'RETRY',
      },
      {
        idempotencyKey: 'key-3',
        entityType: 'VISIT',
        entityId: 'v',
        action: 'START',
        status: 'SKIPPED',
      },
    ]);

    const summary = await engine().run();

    expect(outbox.rejected).toEqual([1]);
    expect(outbox.retried).toEqual([2]);
    expect(remote.push).toHaveBeenCalledTimes(1);
    expect(summary).toMatchObject({ pushed: 0, rejected: 1, pending: 2, pulled: true });
  });

  it('pushes in batches of 100 until the queue is empty', async () => {
    outbox = new FakeOutbox(Array.from({ length: 150 }, (_, i) => operation(i + 1)));

    await engine().run();

    expect(remote.push).toHaveBeenCalledTimes(2);
    expect(remote.push.mock.calls[0][0]).toHaveLength(100);
    expect(remote.push.mock.calls[1][0]).toHaveLength(50);
  });

  it('stops without pulling when the push fails for network reasons', async () => {
    remote.push.mockRejectedValue(new NetworkError());

    const summary = await engine().run();

    expect(remote.pull).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ error: 'OFFLINE', pending: 2 });
  });

  it('follows the pull cursor while the server has more pages', async () => {
    localStore.getCursor.mockResolvedValue('cursor-0');
    remote.pull
      .mockResolvedValueOnce(changes({ cursor: 'cursor-1', hasMore: true }))
      .mockResolvedValueOnce(changes({ cursor: 'cursor-2', hasMore: false }));

    await engine().run();

    expect(remote.pull.mock.calls.map(([cursor]) => cursor)).toEqual(['cursor-0', 'cursor-1']);
    expect(localStore.applyPull).toHaveBeenCalledTimes(2);
    expect(localStore.setCursor).toHaveBeenLastCalledWith('cursor-2');
  });

  it('downloads the working set again when the saved cursor is rejected', async () => {
    localStore.getCursor.mockResolvedValue('old-cursor');
    remote.pull
      .mockRejectedValueOnce(new ValidationError('Invalid cursor'))
      .mockResolvedValueOnce(changes({ cursor: 'fresh' }));

    await engine().run();

    expect(remote.pull.mock.calls.map(([cursor]) => cursor)).toEqual(['old-cursor', null]);
    expect(localStore.setCursor).toHaveBeenCalledWith(null);
    expect(localStore.setCursor).toHaveBeenLastCalledWith('fresh');
  });

  it('runs once at a time: concurrent calls share the same run', async () => {
    const instance = engine();
    const [a, b] = await Promise.all([instance.run(), instance.run()]);

    expect(a).toBe(b);
    expect(remote.pull).toHaveBeenCalledTimes(1);
    expect(instance.isRunning()).toBe(false);
  });
});
