import type { OrderEntity } from '../entities/order.entity';
import type { CreateOrderInput, OrderFilter } from '../types/order.types';
import type { ActorContext } from './visit.repository.port';

/** Local-first order store: orders are created offline and numbered by the server. */
export interface IOrderRepositoryPort {
  findAll(filter?: OrderFilter): Promise<OrderEntity[]>;
  findById(id: string): Promise<OrderEntity | null>;
  create(input: CreateOrderInput, actor: ActorContext): Promise<OrderEntity>;
}
