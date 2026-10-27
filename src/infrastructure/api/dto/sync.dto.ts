import type { CompanyProfileDto } from './company.dto';
import type { CategoryResponseDto, ProductResponseDto, PromotionResponseDto } from './catalog.dto';
import type {
  CollectionPaymentResponseDto,
  ReceivableResponseDto,
  SyncSettingsDto,
} from './collection.dto';
import type { CustomerResponseDto } from './customer.dto';
import type { OrderResponseDto } from './order.dto';
import type { VisitResponseDto } from './visit.dto';

/** `POST /sync/push` (docs/sync-protocol.md in the API). */
export interface SyncPushOperationDto {
  idempotencyKey: string;
  entityType: string;
  entityId: string;
  action: string;
  clientTimestamp: string;
  payload: Record<string, unknown>;
}

export interface SyncPushRequestDto {
  operations: SyncPushOperationDto[];
}

export interface SyncPushResultItemDto {
  idempotencyKey: string;
  entityType: string;
  entityId: string;
  action: string;
  status: string;
  serverTimestamp: string;
  data?: unknown;
  error?: { code: string; message: string; details?: unknown };
}

export interface SyncPushResponseDto {
  results: SyncPushResultItemDto[];
  summary: {
    total: number;
    applied: number;
    duplicates: number;
    rejected: number;
    retry: number;
    skipped: number;
  };
}

/** `GET /sync/pull?cursor=` */
export interface SyncPullResponseDto {
  serverTime: string;
  cursor: string;
  hasMore: boolean;
  visits: VisitResponseDto[];
  customers: CustomerResponseDto[];
  orders: OrderResponseDto[];
  products: ProductResponseDto[];
  categories: CategoryResponseDto[];
  promotions: PromotionResponseDto[];
  /** Absent on servers without collections. */
  receivables?: ReceivableResponseDto[];
  payments?: CollectionPaymentResponseDto[];
  settings?: SyncSettingsDto;
  /** Absent on servers before multi-tenancy. */
  company?: CompanyProfileDto;
}

/** `POST /files/photos` */
export interface UploadPhotoResponseDto {
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  alreadyExisted: boolean;
}
