import { TaskMapper } from '@/application/mappers/task.mapper';
import type { TaskResponseDto } from '@/infrastructure/api/dto/task.dto';

describe('TaskMapper', () => {
  describe('toDomainType', () => {
    it('should map valid task types accurately', () => {
      expect(TaskMapper.toDomainType('OPPORTUNITY')).toBe('OPPORTUNITY');
      expect(TaskMapper.toDomainType('visit')).toBe('VISIT');
      expect(TaskMapper.toDomainType('SALE')).toBe('SALE');
      expect(TaskMapper.toDomainType('collection')).toBe('COLLECTION');
    });

    it('should fallback to OPPORTUNITY for unknown types', () => {
      expect(TaskMapper.toDomainType(undefined)).toBe('OPPORTUNITY');
      expect(TaskMapper.toDomainType('UNKNOWN')).toBe('OPPORTUNITY');
    });
  });

  describe('toDomainStatus', () => {
    it('should map valid statuses accurately including LOST and COLLECTED', () => {
      expect(TaskMapper.toDomainStatus('PENDING')).toBe('PENDING');
      expect(TaskMapper.toDomainStatus('in_progress')).toBe('IN_PROGRESS');
      expect(TaskMapper.toDomainStatus('COMPLETED')).toBe('COMPLETED');
      expect(TaskMapper.toDomainStatus('lost')).toBe('LOST');
      expect(TaskMapper.toDomainStatus('collected')).toBe('COLLECTED');
      expect(TaskMapper.toDomainStatus('cancelled')).toBe('CANCELLED');
    });

    it('should fallback to PENDING for unknown status', () => {
      expect(TaskMapper.toDomainStatus(undefined)).toBe('PENDING');
      expect(TaskMapper.toDomainStatus('UNKNOWN_STATUS')).toBe('PENDING');
    });
  });

  describe('toDomain', () => {
    it('should transform a full TaskResponseDto with history into a TaskEntity', () => {
      const dto: TaskResponseDto = {
        id: 'task-100',
        type: 'SALE',
        category: 'SALE',
        title: 'Cierre de negocio',
        description: 'Firma de contrato comercial',
        status: 'IN_PROGRESS',
        dueDate: '2026-11-20T15:00:00Z',
        photoUrl: 'https://cdn.vendemas.com/photo.jpg',
        latitude: -0.1806,
        longitude: -78.4678,
        estimatedValue: 500,
        userId: 'usr-seller-1',
        customerId: 'cust-99',
        customer: {
          id: 'cust-99',
          name: 'Corporación Alfa',
          phone: '099000111',
          address: 'Av. Principal 123',
        },
        user: {
          id: 'usr-seller-1',
          name: 'Juan Perez',
          email: 'juan@vendemas.com',
        },
        history: [
          {
            id: 'hist-1',
            taskId: 'task-100',
            fromType: 'OPPORTUNITY',
            toType: 'SALE',
            fromStatus: 'PENDING',
            toStatus: 'IN_PROGRESS',
            userId: 'usr-seller-1',
            latitude: -0.1806,
            longitude: -78.4678,
            photoUrl: 'https://cdn.vendemas.com/photo.jpg',
            notes: 'Cliente firmó cotización',
            createdAt: '2026-09-02T10:00:00Z',
            user: {
              id: 'usr-seller-1',
              name: 'Juan Perez',
              email: 'juan@vendemas.com',
            },
          },
        ],
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-02T10:00:00Z',
      };

      const entity = TaskMapper.toDomain(dto);

      expect(entity.id).toBe('task-100');
      expect(entity.type).toBe('SALE');
      expect(entity.title).toBe('Cierre de negocio');
      expect(entity.latitude).toBe(-0.1806);
      expect(entity.photoUrl).toBe('https://cdn.vendemas.com/photo.jpg');
      expect(entity.estimatedValue).toBe(500);
      expect(entity.history.length).toBe(1);
      expect(entity.history[0]?.fromType).toBe('OPPORTUNITY');
      expect(entity.history[0]?.notes).toBe('Cliente firmó cotización');
      expect(entity.customer?.name).toBe('Corporación Alfa');
    });
  });

  describe('toCreateDto and toUpdateDto', () => {
    it('should convert CreateTaskPayload to CreateTaskRequestDto', () => {
      const dto = TaskMapper.toCreateDto({
        title: ' Visita semanal ',
        description: ' Revisar inventario ',
        type: 'COLLECTION',
        category: 'COLLECTION',
        estimatedValue: 200,
        userId: 'usr-1',
      });

      expect(dto.title).toBe('Visita semanal');
      expect(dto.description).toBe('Revisar inventario');
      expect(dto.type).toBe('COLLECTION');
      expect(dto.estimatedValue).toBe(200);
      expect(dto.userId).toBe('usr-1');
    });

    it('should convert TransitionTaskPayload to TransitionTaskRequestDto', () => {
      const dto = TaskMapper.toTransitionDto({
        targetType: 'SALE',
        customerId: 'cust-1',
        notes: ' Propuesta aceptada ',
        latitude: -0.18,
        longitude: -78.46,
      });

      expect(dto.targetType).toBe('SALE');
      expect(dto.customerId).toBe('cust-1');
      expect(dto.notes).toBe('Propuesta aceptada');
      expect(dto.latitude).toBe(-0.18);
    });

    it('should convert UpdateTaskStatusPayload to UpdateTaskStatusRequestDto', () => {
      const dto = TaskMapper.toUpdateStatusDto({
        status: 'LOST',
        notes: ' Presupuesto insuficiente ',
      });

      expect(dto.status).toBe('LOST');
      expect(dto.notes).toBe('Presupuesto insuficiente');
    });
  });
});
