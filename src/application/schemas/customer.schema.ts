import { z } from 'zod';
import { IDENTIFICATION_TYPES } from '@/core/types/customer.types';
import { isValidIdentification } from '@/core/value-objects/ecuador-identification';
import { es } from '@/shared/i18n/es';

const messages = es.customers.validation;

const optionalText = z
  .string()
  .trim()
  .max(120, messages.tooLong)
  .transform((value) => value || undefined)
  .optional();

const phone = z
  .string()
  .trim()
  .refine((value) => value === '' || /^\+?\d{7,15}$/.test(value.replace(/[\s-]/g, '')), {
    message: messages.phoneInvalid,
  })
  .transform((value) => value.replace(/[\s-]/g, '') || undefined)
  .optional();

/** Billing data required to turn a prospect into an ACTIVE customer (close a sale). */
export const promoteCustomerSchema = z
  .object({
    identificationType: z.enum(IDENTIFICATION_TYPES),
    identification: z.string().trim().min(1, messages.identificationRequired),
    businessName: z
      .string()
      .trim()
      .min(3, messages.businessNameRequired)
      .max(200, messages.tooLong),
    address: z.string().trim().min(5, messages.addressRequired).max(250, messages.tooLong),
    email: z.string().trim().min(1, messages.emailRequired).email(messages.emailInvalid),
    phone,
    contactName: optionalText,
  })
  .superRefine((data, context) => {
    if (
      data.identification &&
      !isValidIdentification(data.identificationType, data.identification)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['identification'],
        message: messages.identificationInvalid[data.identificationType],
      });
    }
  });

export type PromoteCustomerFormInput = z.input<typeof promoteCustomerSchema>;
export type PromoteCustomerFormData = z.output<typeof promoteCustomerSchema>;

/**
 * Prospect created from the new-visit wizard. Only the trade name (or a reference when the
 * owner shares nothing, e.g. "Taller esquina azul") is required.
 */
export const quickProspectSchema = z.object({
  tradeName: z.string().trim().min(2, messages.tradeNameRequired).max(120, messages.tooLong),
  contactName: optionalText,
  phone,
  addressReference: z
    .string()
    .trim()
    .max(250, messages.tooLong)
    .transform((value) => value || undefined)
    .optional(),
});

export type QuickProspectFormInput = z.input<typeof quickProspectSchema>;
export type QuickProspectFormData = z.output<typeof quickProspectSchema>;
