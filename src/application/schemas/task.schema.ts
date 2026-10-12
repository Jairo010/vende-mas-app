import { z } from 'zod';
import type { TaskCategory, TaskStatus, TaskType } from '@/core/types/task.types';
import { es } from '@/shared/i18n/es';

export const taskTypeEnum = z.enum([
  'OPPORTUNITY',
  'VISIT',
  'SALE',
  'COLLECTION',
] as const satisfies readonly [TaskType, ...TaskType[]]);

export const taskCategoryEnum = z.enum([
  'OPPORTUNITY',
  'VISIT',
  'SALE',
  'COLLECTION',
  'NEW_CUSTOMER',
  'GENERAL',
] as const satisfies readonly [TaskCategory, ...TaskCategory[]]);

export const taskStatusEnum = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'LOST',
  'COLLECTED',
  'CANCELLED',
] as const satisfies readonly [TaskStatus, ...TaskStatus[]]);

export const createTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, es.tasks.errors.titleRequired)
      .min(2, es.tasks.errors.titleMinLength)
      .max(200, 'El título no puede exceder 200 caracteres'),
    description: z
      .string()
      .trim()
      .max(1000, 'La descripción no puede exceder 1000 caracteres')
      .optional()
      .nullable(),
    type: taskTypeEnum.optional(),
    category: taskCategoryEnum.optional(),
    dueDate: z.string().optional().nullable(),
    dueTime: z.string().optional().nullable(),
    customerId: z.string().optional().nullable(),
    estimatedValue: z.union([z.number(), z.string()]).optional().nullable(),
    photoUrl: z.string().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    orderId: z.string().optional().nullable(),
    userId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const effectiveType = data.type || (data.category as TaskType | undefined);
    if ((effectiveType === 'SALE' || effectiveType === 'COLLECTION') && !data.customerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: es.tasks.errors.customerRequiredForSale,
        path: ['customerId'],
      });
    }
  });

export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, es.tasks.errors.titleMinLength)
    .max(200, 'El título no puede exceder 200 caracteres')
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional()
    .nullable(),
  type: taskTypeEnum.optional(),
  category: taskCategoryEnum.optional(),
  status: taskStatusEnum.optional(),
  dueDate: z.string().optional().nullable(),
  dueTime: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  estimatedValue: z.union([z.number(), z.string()]).optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  orderId: z.string().optional().nullable(),
  userId: z.string().optional(),
});

export const transitionTaskSchema = z
  .object({
    targetType: taskTypeEnum,
    targetStatus: taskStatusEnum.optional(),
    customerId: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    orderId: z.string().optional().nullable(),
    photoUrl: z.string().optional().nullable(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if ((data.targetType === 'SALE' || data.targetType === 'COLLECTION') && !data.customerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: es.tasks.errors.customerRequiredForSale,
        path: ['customerId'],
      });
    }
  });

export const updateTaskStatusSchema = z.object({
  status: taskStatusEnum,
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const quickCreateCustomerSchema = z.object({
  identification: z
    .string()
    .trim()
    .min(10, 'La identificación debe tener al menos 10 caracteres')
    .max(13, 'La identificación no puede superar 13 caracteres'),
  firstName: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().trim().min(2, 'El apellido debe tener al menos 2 caracteres'),
  phone: z.string().trim().min(7, 'El teléfono celular es obligatorio'),
  address: z.string().trim().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export type CreateTaskFormData = z.infer<typeof createTaskSchema>;
export type UpdateTaskFormData = z.infer<typeof updateTaskSchema>;
export type TransitionTaskFormData = z.infer<typeof transitionTaskSchema>;
export type UpdateTaskStatusFormData = z.infer<typeof updateTaskStatusSchema>;
export type QuickCreateCustomerFormData = z.infer<typeof quickCreateCustomerSchema>;
