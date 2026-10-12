import {
  createTaskSchema,
  updateTaskSchema,
  transitionTaskSchema,
  updateTaskStatusSchema,
  quickCreateCustomerSchema,
} from '@/application/schemas/task.schema';

describe('Task Schemas', () => {
  describe('createTaskSchema', () => {
    it('should validate a valid sale payload with customer', () => {
      const validData = {
        title: 'Pedido de abarrotes',
        type: 'SALE' as const,
        customerId: 'cust-123',
        dueDate: '2026-10-15',
        dueTime: '14:30',
      };

      const result = createTaskSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail if sale type has no customerId', () => {
      const invalidData = {
        title: 'Pedido sin cliente',
        type: 'SALE' as const,
      };

      const result = createTaskSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should succeed for opportunity without customerId', () => {
      const validOpp = {
        title: 'Prospecto nuevo Don Carlos',
        type: 'OPPORTUNITY' as const,
      };

      const result = createTaskSchema.safeParse(validOpp);
      expect(result.success).toBe(true);
    });

    it('should fail if title is missing or less than 2 chars', () => {
      expect(createTaskSchema.safeParse({ title: '' }).success).toBe(false);
      expect(createTaskSchema.safeParse({ title: 'A' }).success).toBe(false);
    });
  });

  describe('transitionTaskSchema', () => {
    it('should require customerId when transitioning to SALE', () => {
      const resultNoCust = transitionTaskSchema.safeParse({
        targetType: 'SALE' as const,
        notes: 'Cliente aceptó propuesta',
      });
      expect(resultNoCust.success).toBe(false);

      const resultWithCust = transitionTaskSchema.safeParse({
        targetType: 'SALE' as const,
        customerId: 'cust-999',
        notes: 'Cliente aceptó propuesta',
      });
      expect(resultWithCust.success).toBe(true);
    });

    it('should allow transition to VISIT without customerId', () => {
      const result = transitionTaskSchema.safeParse({
        targetType: 'VISIT' as const,
        dueDate: '2026-11-01',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('updateTaskStatusSchema', () => {
    it('should validate status change with GPS and notes', () => {
      const result = updateTaskStatusSchema.safeParse({
        status: 'LOST' as const,
        latitude: -0.1806,
        longitude: -78.4678,
        notes: 'Cliente compró a la competencia',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('quickCreateCustomerSchema', () => {
    it('should validate valid customer data', () => {
      const result = quickCreateCustomerSchema.safeParse({
        identification: '1723456789',
        firstName: 'Carlos',
        lastName: 'Mendoza',
        phone: '0991234567',
        address: 'Av. Colón 123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject identification with fewer than 10 characters', () => {
      const result = quickCreateCustomerSchema.safeParse({
        identification: '12345',
        firstName: 'Carlos',
        lastName: 'Mendoza',
        phone: '0991234567',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateTaskSchema', () => {
    it('should validate partial updates', () => {
      const updateData = {
        status: 'COMPLETED' as const,
      };

      const result = updateTaskSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });
  });
});
