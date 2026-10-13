import { Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  promoteCustomerSchema,
  type PromoteCustomerFormData,
  type PromoteCustomerFormInput,
} from '@/application/schemas/customer.schema';
import type { CustomerEntity } from '@/core/entities/customer.entity';
import { IDENTIFICATION_TYPES, type IdentificationType } from '@/core/types/customer.types';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { SegmentedControl } from '@/presentation/components/ui/segmented-control';
import { es } from '@/shared/i18n/es';

const IDENTIFICATION_OPTIONS = IDENTIFICATION_TYPES.map((value) => ({
  value,
  label: es.customers.identificationTypes[value],
}));

const MAX_LENGTH: Readonly<Record<IdentificationType, number>> = {
  RUC: 13,
  CEDULA: 10,
  PASSPORT: 20,
};

export interface BillingDataFormProps {
  customer: CustomerEntity;
  onSubmit: (data: PromoteCustomerFormData) => Promise<void> | void;
  isSubmitting?: boolean;
}

/** Billing data that turns a prospect into an ACTIVE (invoiceable) customer. */
export function BillingDataForm({
  customer,
  onSubmit,
  isSubmitting = false,
}: BillingDataFormProps) {
  const p = es.customers.billing.placeholders;
  const {
    control,
    handleSubmit,
    watch,
    trigger,
    formState: { errors, isSubmitted },
  } = useForm<PromoteCustomerFormInput, unknown, PromoteCustomerFormData>({
    resolver: zodResolver(promoteCustomerSchema),
    defaultValues: {
      identificationType: customer.identificationType ?? 'RUC',
      identification: customer.identification ?? '',
      businessName: customer.businessName ?? '',
      address: customer.address ?? '',
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      contactName: customer.contactName ?? '',
    },
    mode: 'onTouched',
  });

  const identificationType = watch('identificationType');

  return (
    <View className="gap-4">
      <View>
        <Text className="mb-2 text-sm font-medium text-foreground">
          {es.customers.fields.identificationType}
        </Text>
        <Controller
          control={control}
          name="identificationType"
          render={({ field: { value, onChange } }) => (
            <SegmentedControl
              options={IDENTIFICATION_OPTIONS}
              value={value}
              onChange={(next) => {
                onChange(next);
                if (isSubmitted) void trigger('identification');
              }}
            />
          )}
        />
      </View>

      <Controller
        control={control}
        name="identification"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            testID="billing-identification"
            label={es.customers.fields.identification}
            placeholder={p.identification[identificationType]}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType={identificationType === 'PASSPORT' ? 'default' : 'number-pad'}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={MAX_LENGTH[identificationType]}
            error={errors.identification?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="businessName"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            testID="billing-business-name"
            label={es.customers.fields.businessName}
            placeholder={p.businessName}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            autoCapitalize="words"
            error={errors.businessName?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="address"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            testID="billing-address"
            label={es.customers.fields.address}
            placeholder={p.address}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.address?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            testID="billing-email"
            label={es.customers.fields.email}
            placeholder={p.email}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="phone"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            testID="billing-phone"
            label={`${es.customers.fields.phone} (${es.common.optional.toLowerCase()})`}
            placeholder={p.phone}
            value={value ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
            keyboardType="phone-pad"
            error={errors.phone?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="contactName"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            testID="billing-contact"
            label={`${es.customers.fields.contact} (${es.common.optional.toLowerCase()})`}
            placeholder={p.contactName}
            value={value ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
            autoCapitalize="words"
            error={errors.contactName?.message}
          />
        )}
      />

      <Button
        testID="billing-submit"
        className="mt-2"
        isLoading={isSubmitting}
        onPress={handleSubmit(onSubmit)}
      >
        {es.customers.billing.submit}
      </Button>
    </View>
  );
}
