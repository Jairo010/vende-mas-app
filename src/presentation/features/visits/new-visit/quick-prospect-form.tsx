import { useState } from 'react';
import { Text, View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheck, Crosshair } from 'lucide-react-native';
import { useAuthSession } from '@/application/hooks/auth/use-auth-session';
import { useCurrentLocation } from '@/application/hooks/device/use-current-location';
import {
  quickProspectSchema,
  type QuickProspectFormData,
  type QuickProspectFormInput,
} from '@/application/schemas/customer.schema';
import type { GeoPoint } from '@/core/types/geo.types';
import { notify } from '@/presentation/components/feedback/toast';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

export interface QuickProspect {
  data: QuickProspectFormData;
  location: GeoPoint | null;
}

export interface QuickProspectFormProps {
  initialValue?: QuickProspect | null;
  onSubmit: (prospect: QuickProspect) => void;
  onCancel: () => void;
}

/**
 * Prospect created on the spot. When the owner shares nothing, a reference of the store
 * and the seller's current position are enough.
 */
export function QuickProspectForm({ initialValue, onSubmit, onCancel }: QuickProspectFormProps) {
  const colors = useThemeColors();
  const f = es.newVisit.prospectFields;
  const [location, setLocation] = useState<GeoPoint | null>(initialValue?.location ?? null);
  const { capture, isCapturing } = useCurrentLocation();
  const { canSeeLocationTracking } = useAuthSession();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<QuickProspectFormInput, unknown, QuickProspectFormData>({
    resolver: zodResolver(quickProspectSchema),
    defaultValues: {
      tradeName: initialValue?.data.tradeName ?? '',
      contactName: initialValue?.data.contactName ?? '',
      phone: initialValue?.data.phone ?? '',
      addressReference: initialValue?.data.addressReference ?? '',
    },
    mode: 'onTouched',
  });

  const captureLocation = async () => {
    const reading = await capture();
    if (reading.ok) setLocation(reading.point);
    else notify.warning(es.visits.gps.failures[reading.reason]);
  };

  return (
    <View className="gap-4">
      <Text className="text-sm leading-5 text-muted-foreground">
        {es.newVisit.newProspectDescription}
      </Text>

      <Controller
        control={control}
        name="tradeName"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            testID="prospect-trade-name"
            label={f.tradeName}
            placeholder={f.tradeNamePlaceholder}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            autoCapitalize="words"
            error={errors.tradeName?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="contactName"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            testID="prospect-contact"
            label={`${f.contactName} (${es.common.optional.toLowerCase()})`}
            placeholder={f.contactNamePlaceholder}
            value={value ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
            autoCapitalize="words"
            error={errors.contactName?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            testID="prospect-phone"
            label={`${f.phone} (${es.common.optional.toLowerCase()})`}
            placeholder={f.phonePlaceholder}
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
        name="addressReference"
        render={({ field: { value, onChange, onBlur } }) => (
          <Input
            testID="prospect-reference"
            label={`${f.addressReference} (${es.common.optional.toLowerCase()})`}
            placeholder={f.addressReferencePlaceholder}
            value={value ?? ''}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.addressReference?.message}
          />
        )}
      />

      {canSeeLocationTracking ? (
        <Button
          testID="prospect-capture-location"
          variant="outline"
          isLoading={isCapturing}
          leftIcon={
            location ? (
              <CircleCheck size={16} color={colors.success} />
            ) : (
              <Crosshair size={16} color={colors.foreground} />
            )
          }
          onPress={() => void captureLocation()}
        >
          {location ? es.newVisit.locationSaved : es.newVisit.captureLocation}
        </Button>
      ) : null}

      <View className="flex-row gap-2">
        <Button variant="ghost" className="flex-1" onPress={onCancel}>
          {es.common.cancel}
        </Button>
        <Button
          testID="prospect-submit"
          className="flex-1"
          onPress={handleSubmit((data) => onSubmit({ data, location }))}
        >
          {es.newVisit.useProspect}
        </Button>
      </View>
    </View>
  );
}
