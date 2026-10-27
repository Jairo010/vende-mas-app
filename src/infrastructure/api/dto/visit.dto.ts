/** Wire format of the API visits module (`/api/v1/visits`, also used by sync). */

export interface CheckpointLocationDto {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
}

export interface VisitCheckpointDto {
  at: string;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
}

export interface VisitCustomerSummaryDto {
  id: string;
  tradeName: string;
  status: string;
  contactName: string | null;
  phone: string | null;
  address: string | null;
  addressReference: string | null;
  latitude: number | null;
  longitude: number | null;
  storePhotoUrl: string | null;
}

export interface VisitSellerSummaryDto {
  id: string;
  name: string;
}

export interface VisitResponseDto {
  id: string;
  type: string;
  status: string;
  outcome: string | null;
  scheduledAt: string;
  /** Missing on servers that predate the optional time (always timed there). */
  hasScheduledTime?: boolean;
  notes: string | null;
  start: VisitCheckpointDto | null;
  end: VisitCheckpointDto | null;
  distanceToCustomerMeters: number | null;
  durationMinutes: number | null;
  photoUrl: string | null;
  cancellationReason: string | null;
  sellerId: string;
  createdById: string;
  customerId: string;
  parentVisitId: string | null;
  customer: VisitCustomerSummaryDto | null;
  seller: VisitSellerSummaryDto | null;
  createdAt: string;
  updatedAt: string;
}

/** `POST /visits` (sync: VISIT SCHEDULE). */
export interface ScheduleVisitRequestDto {
  id: string;
  type: string;
  customerId: string;
  scheduledAt: string;
  hasScheduledTime: boolean;
  notes?: string;
  sellerId?: string;
  parentVisitId?: string;
}

/** `POST /visits/:id/start` (sync: VISIT START). */
export interface StartVisitRequestDto {
  startedAt?: string;
  location?: CheckpointLocationDto;
}

/** `POST /visits/:id/complete` (sync: VISIT COMPLETE). */
export interface CompleteVisitRequestDto {
  outcome: string;
  endedAt?: string;
  location?: CheckpointLocationDto;
  notes?: string;
  photoUrl?: string;
}

/** `PATCH /visits/:id/reschedule` (sync: VISIT RESCHEDULE). */
export interface RescheduleVisitRequestDto {
  scheduledAt: string;
  hasScheduledTime: boolean;
  notes?: string;
}

/** `POST /visits/:id/cancel` (sync: VISIT CANCEL). */
export interface CancelVisitRequestDto {
  reason?: string;
  cancelledAt?: string;
}
