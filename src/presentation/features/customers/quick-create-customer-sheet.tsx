import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  UserPlus,
  MapPin,
  CheckCircle2,
  Phone,
  CreditCard,
  Building,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import {
  quickCreateCustomerSchema,
  type QuickCreateCustomerFormData,
} from '@/application/schemas/task.schema';
import { useCreateCustomer } from '@/application/hooks/customers';
import type { TaskCustomerSummary } from '@/core/types/task.types';
import { Button } from '@/presentation/components/ui/button';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';

export interface QuickCreateCustomerSheetProps {
  visible: boolean;
  onClose: () => void;
  onCustomerCreated: (customer: TaskCustomerSummary) => void;
}

export function QuickCreateCustomerSheet({
  visible,
  onClose,
  onCustomerCreated,
}: QuickCreateCustomerSheetProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'capturing' | 'success' | 'failed'>('idle');

  const { mutateAsync: createCustomer, isPending } = useCreateCustomer();

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<QuickCreateCustomerFormData>({
    resolver: zodResolver(quickCreateCustomerSchema),
    defaultValues: {
      identification: '',
      firstName: '',
      lastName: '',
      phone: '',
      address: '',
    },
  });

  // Auto-capture GPS coordinates on open
  useEffect(() => {
    if (!visible) return;

    let isMounted = true;
    const fetchLocation = async () => {
      setGpsStatus('capturing');
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) setGpsStatus('failed');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.LocationAccuracy.Balanced,
        });

        if (isMounted) {
          setCoords({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
          setValue('latitude', loc.coords.latitude);
          setValue('longitude', loc.coords.longitude);
          setGpsStatus('success');
        }
      } catch {
        if (isMounted) setGpsStatus('failed');
      }
    };

    fetchLocation();
    return () => {
      isMounted = false;
    };
  }, [visible, setValue]);

  const onFormSubmit = async (data: QuickCreateCustomerFormData) => {
    try {
      const created = await createCustomer({
        ...data,
        latitude: coords?.latitude ?? undefined,
        longitude: coords?.longitude ?? undefined,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      reset();
      onCustomerCreated(created);
    } catch {
      Alert.alert('Error', 'No se pudo registrar el cliente. Intenta nuevamente.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/60"
      >
        <Pressable className="flex-1" onPress={onClose} />

        <View
          className="rounded-t-3xl border-t border-border bg-card px-5 pt-4 pb-8 max-h-[90%]"
          style={{ backgroundColor: scheme === 'dark' ? '#171717' : '#ffffff' }}
        >
          {/* Handle */}
          <View className="items-center mb-3">
            <View className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-border">
            <View className="flex-row items-center">
              <View className="p-2 rounded-xl bg-primary/10 mr-2.5">
                <UserPlus size={20} color={activeColors.primary} />
              </View>
              <Text className="text-lg font-bold text-foreground">
                {es.tasks.quickCustomer.title}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="p-2 rounded-full bg-muted"
            >
              <X size={18} color={activeColors.foreground} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
            className="gap-y-4"
          >
            {/* GPS Indicator */}
            <View className="flex-row items-center justify-between p-2.5 rounded-xl bg-muted/60 border border-border">
              <View className="flex-row items-center">
                <MapPin
                  size={16}
                  color={gpsStatus === 'success' ? '#10b981' : activeColors.mutedForeground}
                  className="mr-2"
                />
                <Text className="text-xs text-foreground">
                  {gpsStatus === 'success' && coords
                    ? `GPS capturado: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
                    : gpsStatus === 'capturing'
                      ? 'Obteniendo GPS...'
                      : 'GPS no disponible'}
                </Text>
              </View>
              {gpsStatus === 'success' ? <CheckCircle2 size={16} color="#10b981" /> : null}
            </View>

            {/* Identification (DNI / RUC) */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-1.5">
                {es.tasks.quickCustomer.identificationLabel} *
              </Text>
              <View className="flex-row items-center border border-input rounded-xl bg-card px-3.5 h-12">
                <CreditCard size={18} color={activeColors.mutedForeground} className="mr-2.5" />
                <Controller
                  control={control}
                  name="identification"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      testID="customer-identification-input"
                      placeholder="1723456789 o RUC"
                      placeholderTextColor={activeColors.mutedForeground}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="numeric"
                      className="flex-1 text-foreground text-base py-0"
                    />
                  )}
                />
              </View>
              {errors.identification ? (
                <Text className="text-xs text-destructive mt-1 font-medium pl-0.5">
                  {errors.identification.message}
                </Text>
              ) : null}
            </View>

            {/* Names row */}
            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground mb-1.5">
                  {es.tasks.quickCustomer.firstNameLabel} *
                </Text>
                <View className="flex-row items-center border border-input rounded-xl bg-card px-3.5 h-12">
                  <Controller
                    control={control}
                    name="firstName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        testID="customer-firstname-input"
                        placeholder="Nombres"
                        placeholderTextColor={activeColors.mutedForeground}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        className="flex-1 text-foreground text-base py-0"
                      />
                    )}
                  />
                </View>
                {errors.firstName ? (
                  <Text className="text-xs text-destructive mt-1 font-medium pl-0.5">
                    {errors.firstName.message}
                  </Text>
                ) : null}
              </View>

              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground mb-1.5">
                  {es.tasks.quickCustomer.lastNameLabel} *
                </Text>
                <View className="flex-row items-center border border-input rounded-xl bg-card px-3.5 h-12">
                  <Controller
                    control={control}
                    name="lastName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        testID="customer-lastname-input"
                        placeholder="Apellidos"
                        placeholderTextColor={activeColors.mutedForeground}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        className="flex-1 text-foreground text-base py-0"
                      />
                    )}
                  />
                </View>
                {errors.lastName ? (
                  <Text className="text-xs text-destructive mt-1 font-medium pl-0.5">
                    {errors.lastName.message}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Phone */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-1.5">
                {es.tasks.quickCustomer.phoneLabel} *
              </Text>
              <View className="flex-row items-center border border-input rounded-xl bg-card px-3.5 h-12">
                <Phone size={18} color={activeColors.mutedForeground} className="mr-2.5" />
                <Controller
                  control={control}
                  name="phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      testID="customer-phone-input"
                      placeholder="0991234567"
                      placeholderTextColor={activeColors.mutedForeground}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="phone-pad"
                      className="flex-1 text-foreground text-base py-0"
                    />
                  )}
                />
              </View>
              {errors.phone ? (
                <Text className="text-xs text-destructive mt-1 font-medium pl-0.5">
                  {errors.phone.message}
                </Text>
              ) : null}
            </View>

            {/* Address */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-1.5">
                {es.tasks.quickCustomer.addressLabel}
              </Text>
              <View className="flex-row items-center border border-input rounded-xl bg-card px-3.5 h-12">
                <Building size={18} color={activeColors.mutedForeground} className="mr-2.5" />
                <Controller
                  control={control}
                  name="address"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      testID="customer-address-input"
                      placeholder="Dirección o local comercial"
                      placeholderTextColor={activeColors.mutedForeground}
                      value={value ?? ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      className="flex-1 text-foreground text-base py-0"
                    />
                  )}
                />
              </View>
            </View>

            {/* Submit button */}
            <View className="pt-2">
              <Button
                testID="submit-quick-customer-btn"
                onPress={handleSubmit(onFormSubmit)}
                isLoading={isPending}
                disabled={isPending}
                variant="default"
                size="lg"
              >
                {es.tasks.quickCustomer.saveButton}
              </Button>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
