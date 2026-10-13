import type { VisitEntity } from '../entities/visit.entity';
import type {
  CancelVisitInput,
  CompleteVisitInput,
  RescheduleVisitInput,
  ScheduleVisitInput,
  StartVisitInput,
  VisitFilter,
} from '../types/visit.types';

/** Who performs a local mutation (stamped on what gets created offline). */
export interface ActorContext {
  userId: string;
  userName?: string;
}

/**
 * Local-first visit store. Every write is applied to the device database and queued in
 * the outbox in the same transaction; the sync engine sends it to the API later.
 */
export interface IVisitRepositoryPort {
  findByRange(filter: VisitFilter): Promise<VisitEntity[]>;
  findById(id: string): Promise<VisitEntity | null>;
  /** The visit the seller is currently in (check-in done, no check-out yet). */
  findInProgress(sellerId: string): Promise<VisitEntity | null>;
  schedule(input: ScheduleVisitInput, actor: ActorContext): Promise<VisitEntity>;
  start(id: string, input: StartVisitInput): Promise<VisitEntity>;
  complete(id: string, input: CompleteVisitInput): Promise<VisitEntity>;
  reschedule(id: string, input: RescheduleVisitInput): Promise<VisitEntity>;
  cancel(id: string, input: CancelVisitInput): Promise<VisitEntity>;
}
