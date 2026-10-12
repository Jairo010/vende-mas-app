import { TaskEntity } from '@/core/entities/task.entity';
import { TaskValidationError } from '@/core/errors/task.errors';
import { UserRole } from '@/core/types/role.enum';

describe('TaskEntity', () => {
  it('should instantiate a task with valid props', () => {
    const task = new TaskEntity({
      id: 'task-1',
      type: 'SALE',
      category: 'SALE',
      title: 'Llamar a distribuidora Norte',
      description: 'Ofrecer nueva línea de productos',
      status: 'PENDING',
      dueDate: '2026-10-01T10:00:00Z',
      userId: 'usr-seller-1',
      customerId: 'cust-1',
      customer: {
        id: 'cust-1',
        name: 'Distribuidora Norte',
        phone: '099123456',
      },
    });

    expect(task.id).toBe('task-1');
    expect(task.type).toBe('SALE');
    expect(task.title).toBe('Llamar a distribuidora Norte');
    expect(task.category).toBe('SALE');
    expect(task.status).toBe('PENDING');
    expect(task.isSale()).toBe(true);
    expect(task.isPending()).toBe(true);
    expect(task.isCompleted()).toBe(false);
    expect(task.isInProgress()).toBe(false);
    expect(task.isCancelled()).toBe(false);
    expect(task.customer?.name).toBe('Distribuidora Norte');
  });

  it('should enforce mandatory customer invariant for SALE and COLLECTION', () => {
    expect(
      () =>
        new TaskEntity({
          id: 'task-sale-no-cust',
          type: 'SALE',
          title: 'Venta sin cliente',
          userId: 'usr-1',
        }),
    ).toThrow(TaskValidationError);

    expect(
      () =>
        new TaskEntity({
          id: 'task-coll-no-cust',
          type: 'COLLECTION',
          title: 'Cobranza sin cliente',
          userId: 'usr-1',
        }),
    ).toThrow(TaskValidationError);

    // OPPORTUNITY and VISIT allow null customerId
    expect(
      () =>
        new TaskEntity({
          id: 'task-opp-no-cust',
          type: 'OPPORTUNITY',
          title: 'Oportunidad de campo',
          userId: 'usr-1',
        }),
    ).not.toThrow();
  });

  it('should throw TaskValidationError if id is missing', () => {
    expect(
      () =>
        new TaskEntity({
          id: '',
          title: 'Valid title',
          type: 'OPPORTUNITY',
          status: 'PENDING',
          userId: 'usr-1',
        }),
    ).toThrow(TaskValidationError);
  });

  it('should throw TaskValidationError if title is shorter than 2 chars', () => {
    expect(
      () =>
        new TaskEntity({
          id: 'task-1',
          title: 'A',
          type: 'OPPORTUNITY',
          status: 'PENDING',
          userId: 'usr-1',
        }),
    ).toThrow(TaskValidationError);
  });

  it('should throw TaskValidationError if userId is missing', () => {
    expect(
      () =>
        new TaskEntity({
          id: 'task-1',
          title: 'Valid title',
          type: 'OPPORTUNITY',
          status: 'PENDING',
          userId: '',
        }),
    ).toThrow(TaskValidationError);
  });

  it('should calculate isOverdue correctly', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const futureDate = new Date(Date.now() + 86400000).toISOString();

    const overdueTask = new TaskEntity({
      id: 'task-overdue',
      title: 'Cobranza vencida',
      type: 'COLLECTION',
      status: 'PENDING',
      dueDate: pastDate,
      customerId: 'cust-1',
      userId: 'usr-1',
    });
    expect(overdueTask.isOverdue()).toBe(true);

    const pendingFutureTask = new TaskEntity({
      id: 'task-future',
      title: 'Cobranza futura',
      type: 'COLLECTION',
      status: 'PENDING',
      dueDate: futureDate,
      customerId: 'cust-1',
      userId: 'usr-1',
    });
    expect(pendingFutureTask.isOverdue()).toBe(false);

    const completedOverdueTask = new TaskEntity({
      id: 'task-completed',
      title: 'Cobranza pagada',
      type: 'COLLECTION',
      status: 'COMPLETED',
      dueDate: pastDate,
      customerId: 'cust-1',
      userId: 'usr-1',
    });
    expect(completedOverdueTask.isOverdue()).toBe(false);
  });

  it('should transition stage with transitionType and update history', () => {
    const task = new TaskEntity({
      id: 'task-transition-test',
      type: 'OPPORTUNITY',
      title: 'Prospección en campo',
      userId: 'usr-1',
    });

    expect(task.type).toBe('OPPORTUNITY');
    expect(task.history.length).toBe(0);

    // Transitioning to SALE without customer throws
    expect(() => task.transitionType('SALE')).toThrow(TaskValidationError);

    // Transitioning to SALE with customer succeeds
    task.transitionType('SALE', {
      customerId: 'cust-202',
      notes: 'Cliente aceptó propuesta en la visita',
      latitude: -0.1806,
      longitude: -78.4678,
    });

    expect(task.type).toBe('SALE');
    expect(task.customerId).toBe('cust-202');
    expect(task.latitude).toBe(-0.1806);
    expect(task.history.length).toBe(1);
    expect(task.history[0]?.fromType).toBe('OPPORTUNITY');
    expect(task.history[0]?.toType).toBe('SALE');
    expect(task.history[0]?.notes).toBe('Cliente aceptó propuesta en la visita');
  });

  it('should change status to LOST, COLLECTED, and COMPLETED and record history', () => {
    const task = new TaskEntity({
      id: 'task-status-test',
      type: 'OPPORTUNITY',
      title: 'Visita de cierre',
      userId: 'usr-1',
    });

    task.changeStatus('LOST', { notes: 'Cliente compró a la competencia' });
    expect(task.status).toBe('LOST');
    expect(task.isLost()).toBe(true);
    expect(task.history.length).toBe(1);
    expect(task.history[0]?.toStatus).toBe('LOST');

    task.changeStatus('COMPLETED');
    expect(task.status).toBe('COMPLETED');
    expect(task.isCompleted()).toBe(true);
  });

  it('should enforce role permissions on canBeModifiedBy and canBeDeletedBy', () => {
    const task = new TaskEntity({
      id: 'task-1',
      title: 'Tarea del vendedor',
      type: 'OPPORTUNITY',
      status: 'PENDING',
      userId: 'usr-seller-1',
    });

    // Owner seller
    expect(task.canBeModifiedBy('usr-seller-1', UserRole.SELLER)).toBe(true);
    expect(task.canBeDeletedBy('usr-seller-1', UserRole.SELLER)).toBe(true);

    // Other seller
    expect(task.canBeModifiedBy('usr-seller-2', UserRole.SELLER)).toBe(false);
    expect(task.canBeDeletedBy('usr-seller-2', UserRole.SELLER)).toBe(false);

    // Admin can modify and delete any task
    expect(task.canBeModifiedBy('usr-admin-99', UserRole.ADMIN)).toBe(true);
    expect(task.canBeDeletedBy('usr-admin-99', UserRole.ADMIN)).toBe(true);
  });
});
