import type { AxiosInstance } from 'axios';
import { TaskApiService } from '@/infrastructure/api/services/task-api.service';
import {
  TaskNotFoundError,
  TaskUnauthorizedError,
  TaskValidationError,
} from '@/core/errors';

describe('TaskApiService', () => {
  let mockAxios: {
    get: jest.Mock;
    post: jest.Mock;
    patch: jest.Mock;
    delete: jest.Mock;
  };
  let service: TaskApiService;

  beforeEach(() => {
    mockAxios = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
    };
    service = new TaskApiService(mockAxios as unknown as AxiosInstance);
  });

  describe('findAll', () => {
    it('should query list endpoint and return mapped PaginatedTasksResult', async () => {
      mockAxios.get.mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 'task-1',
              title: 'Visita técnica',
              type: 'SALE',
              category: 'SALE',
              status: 'PENDING',
              userId: 'usr-1',
              customerId: 'cust-1',
            },
          ],
          meta: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
          },
        },
      });

      const result = await service.findAll({ search: 'técnica' });

      expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/tasks', {
        params: { search: 'técnica' },
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('task-1');
      expect(result.total).toBe(1);
    });

    it('should handle raw array response gracefully', async () => {
      mockAxios.get.mockResolvedValueOnce({
        data: [
          {
            id: 'task-1',
            title: 'Cobranza',
            type: 'COLLECTION',
            category: 'COLLECTION',
            status: 'PENDING',
            userId: 'usr-1',
            customerId: 'cust-1',
          },
        ],
      });

      const result = await service.findAll();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].title).toBe('Cobranza');
    });
  });

  describe('findById', () => {
    it('should query task detail and return mapped TaskEntity', async () => {
      mockAxios.get.mockResolvedValueOnce({
        data: {
          id: 'task-42',
          title: 'Prospectar cliente nuevo',
          type: 'OPPORTUNITY',
          category: 'OPPORTUNITY',
          status: 'PENDING',
          userId: 'usr-1',
        },
      });

      const task = await service.findById('task-42');
      expect(mockAxios.get).toHaveBeenCalledWith('/api/v1/tasks/task-42');
      expect(task.id).toBe('task-42');
      expect(task.type).toBe('OPPORTUNITY');
    });

    it('should throw TaskNotFoundError on 404', async () => {
      const error = {
        isAxiosError: true,
        response: { status: 404, data: { message: 'Not found' } },
      };
      mockAxios.get.mockRejectedValueOnce(error);

      await expect(service.findById('non-existent')).rejects.toThrow(
        TaskNotFoundError,
      );
    });
  });

  describe('create', () => {
    it('should post payload and return created TaskEntity', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: {
          id: 'task-new',
          title: 'Nueva oportunidad',
          type: 'OPPORTUNITY',
          category: 'OPPORTUNITY',
          status: 'PENDING',
          userId: 'usr-1',
        },
      });

      const task = await service.create({
        title: 'Nueva oportunidad',
        type: 'OPPORTUNITY',
        category: 'OPPORTUNITY',
        userId: 'usr-1',
      });

      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/tasks', {
        title: 'Nueva oportunidad',
        description: null,
        type: 'OPPORTUNITY',
        category: 'OPPORTUNITY',
        dueDate: null,
        customerId: null,
        estimatedValue: null,
        photoUrl: null,
        latitude: null,
        longitude: null,
        orderId: null,
        userId: 'usr-1',
      });
      expect(task.id).toBe('task-new');
    });

    it('should throw TaskValidationError on 400', async () => {
      const error = {
        isAxiosError: true,
        response: { status: 400, data: { message: 'Title is too short' } },
      };
      mockAxios.post.mockRejectedValueOnce(error);

      await expect(
        service.create({ title: 'A', userId: 'usr-1' }),
      ).rejects.toThrow(TaskValidationError);
    });
  });

  describe('transition', () => {
    it('should post to /api/v1/tasks/:id/transition', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: {
          id: 'task-1',
          title: 'Visita agendada',
          type: 'VISIT',
          status: 'PENDING',
          userId: 'usr-1',
        },
      });

      const result = await service.transition('task-1', {
        targetType: 'VISIT',
        notes: 'Agendado tras contacto',
      });

      expect(mockAxios.post).toHaveBeenCalledWith('/api/v1/tasks/task-1/transition', {
        targetType: 'VISIT',
        targetStatus: undefined,
        customerId: null,
        dueDate: null,
        orderId: null,
        photoUrl: null,
        latitude: null,
        longitude: null,
        notes: 'Agendado tras contacto',
      });
      expect(result.type).toBe('VISIT');
    });
  });

  describe('updateStatus', () => {
    it('should patch to /api/v1/tasks/:id/status', async () => {
      mockAxios.patch.mockResolvedValueOnce({
        data: {
          id: 'task-1',
          title: 'Venta perdida',
          type: 'OPPORTUNITY',
          status: 'LOST',
          userId: 'usr-1',
        },
      });

      const result = await service.updateStatus('task-1', {
        status: 'LOST',
        notes: 'Sin presupuesto',
      });

      expect(mockAxios.patch).toHaveBeenCalledWith('/api/v1/tasks/task-1/status', {
        status: 'LOST',
        latitude: null,
        longitude: null,
        photoUrl: null,
        notes: 'Sin presupuesto',
      });
      expect(result.status).toBe('LOST');
    });
  });

  describe('uploadPhoto', () => {
    it('should post multipart form-data to upload-photo endpoint', async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: {
          photoUrl: 'https://cdn.vendemas.com/test.jpg',
          originalName: 'photo.jpg',
          size: 1024,
          mimeType: 'image/jpeg',
        },
      });

      const res = await service.uploadPhoto({
        uri: 'file:///path/photo.jpg',
        name: 'photo.jpg',
        type: 'image/jpeg',
      });

      expect(mockAxios.post).toHaveBeenCalledWith(
        '/api/v1/tasks/upload-photo',
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      expect(res.photoUrl).toBe('https://cdn.vendemas.com/test.jpg');
    });
  });

  describe('update and delete', () => {
    it('should patch update and return updated TaskEntity', async () => {
      mockAxios.patch.mockResolvedValueOnce({
        data: {
          id: 'task-1',
          title: 'Título actualizado',
          type: 'OPPORTUNITY',
          status: 'COMPLETED',
          userId: 'usr-1',
        },
      });

      const task = await service.update('task-1', { status: 'COMPLETED' });
      expect(mockAxios.patch).toHaveBeenCalledWith('/api/v1/tasks/task-1', {
        status: 'COMPLETED',
      });
      expect(task.status).toBe('COMPLETED');
    });

    it('should call delete endpoint on delete', async () => {
      mockAxios.delete.mockResolvedValueOnce({ status: 204 });

      await service.delete('task-1');
      expect(mockAxios.delete).toHaveBeenCalledWith('/api/v1/tasks/task-1');
    });

    it('should throw TaskUnauthorizedError on 403', async () => {
      const error = {
        isAxiosError: true,
        response: { status: 403, data: { message: 'Forbidden' } },
      };
      mockAxios.delete.mockRejectedValueOnce(error);

      await expect(service.delete('task-1')).rejects.toThrow(
        TaskUnauthorizedError,
      );
    });
  });
});
