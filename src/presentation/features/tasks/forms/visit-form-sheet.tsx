import { useEffect, useState } from 'react';
import {
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
import { X, MapPin, Building2, CheckCircle2 } from 'lucide-react-native';
import * as Location from 'expo-location';
import type { TaskCustomerSummary } from '@/core/types/task.types';
import { createTaskSchema, type CreateTaskFormData } from '@/application/schemas/task.schema';
import { Button, DatePickerField, TimePickerField } from '@/presentation/components/ui';
import { CustomerPickerModal } from '@/presentation/features/customers';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';

export interface VisitFormSheetProps {
  visible: boolean;
  initialDate?: string | null;
  onClose: () => void;
  onSubmit: (data: CreateTaskFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function VisitFormSheet({
  visible,
  initialDate,
  onClose,
  onSubmit,
  isSubmitting = false,
}: VisitFormSheetProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'capturing' | 'success' | 'failed'>('idle');
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<TaskCustomerSummary | null>(null);

  const todayStr = initialDate || new Date().toISOString().split('T')[0] || '';

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      type: 'VISIT',
      category: 'VISIT',
      title: '',
      description: '',
      dueDate: todayStr,
      dueTime: '10:00',
      customerId: null,
    },
  });

  useEffect(() => {
    if (!visible) return;

    let isMounted = true;
    const fetchGps = async () => {
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

    fetchGps();
    return () => {
      isMounted = false;
    };
  }, [visible, setValue]);

  const handleSelectCustomer = (customer: TaskCustomerSummary) => {
    setSelectedCustomer(customer);
    setValue('customerId', customer.id);
  };

  const handleRemoveCustomer = () => {
    setSelectedCustomer(null);
    setValue('customerId', null);
  };

  const handleClose = () => {
    reset();
    setSelectedCustomer(null);
    onClose();
  };

  const onFormSubmit = async (data: CreateTaskFormData) => {
    let combinedDueDate: string | null = data.dueDate || null;
    if (data.dueDate && data.dueTime) {
      combinedDueDate = `${data.dueDate}T${data.dueTime}:00`;
    }

    await onSubmit({
      ...data,
      type: 'VISIT',
      category: 'VISIT',
      dueDate: combinedDueDate,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      customerId: selectedCustomer?.id ?? null,
    });
    handleClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/60"
        >
          <Pressable className="flex-1" onPress={handleClose} />

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
                <View className="p-2 rounded-xl bg-sky-500/10 mr-2.5">
                  <MapPin size={20} color="#0ea5e9" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-foreground">
                    {es.tasks.selector.visitTitle}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Cita o reunión programada con fecha y hora
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={handleClose}
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
              {/* GPS status */}
              <View className="flex-row items-center justify-between p-2.5 rounded-xl bg-muted/60 border border-border">
                <View className="flex-row items-center">
                  <MapPin
                    size={16}
                    color={gpsStatus === 'success' ? '#10b981' : activeColors.mutedForeground}
                    className="mr-2"
                  />
                  <Text className="text-xs text-foreground font-medium">
                    {gpsStatus === 'success' && coords
                      ? `${es.tasks.forms.gpsCaptured} (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`
                      : 'Capturando GPS...'}
                  </Text>
                </View>
                {gpsStatus === 'success' ? <CheckCircle2 size={16} color="#10b981" /> : null}
              </View>

              {/* Title input */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-1.5">
                  {es.tasks.forms.titleLabel} *
                </Text>
                <View className="flex-row items-center border border-input rounded-xl bg-card px-3.5 h-12">
                  <Controller
                    control={control}
                    name="title"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        testID="visit-title-input"
                        placeholder="Ej. Visita técnica y presentación de catálogo"
                        placeholderTextColor={activeColors.mutedForeground}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        className="flex-1 text-foreground text-base py-0"
                      />
                    )}
                  />
                </View>
                {errors.title ? (
                  <Text className="text-xs text-destructive mt-1 font-medium pl-0.5">
                    {errors.title.message}
                  </Text>
                ) : null}
              </View>

              {/* Date & Time row */}
              <View className="flex-row space-x-3">
                <View className="flex-1 mr-2">
                  <Controller
                    control={control}
                    name="dueDate"
                    render={({ field: { onChange, value } }) => (
                      <DatePickerField
                        testID="visit-date-input"
                        label={`${es.tasks.forms.dueDateLabel} *`}
                        value={value ?? ''}
                        onChange={onChange}
                        placeholder="Seleccionar fecha"
                        error={errors.dueDate?.message}
                      />
                    )}
                  />
                </View>

                <View className="flex-1">
                  <Controller
                    control={control}
                    name="dueTime"
                    render={({ field: { onChange, value } }) => (
                      <TimePickerField
                        testID="visit-time-input"
                        label="Hora programada"
                        value={value ?? ''}
                        onChange={onChange}
                        placeholder="Seleccionar hora"
                        error={errors.dueTime?.message}
                      />
                    )}
                  />
                </View>
              </View>

              {/* Customer Selector */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-1.5">
                  {es.tasks.forms.customerLabel}
                </Text>
                {selectedCustomer ? (
                  <View className="p-3 rounded-xl border border-sky-500/40 bg-sky-500/10 flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 mr-2">
                      <Building2 size={16} color="#0ea5e9" className="mr-2" />
                      <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                        {selectedCustomer.name}
                      </Text>
                    </View>
                    <Pressable onPress={handleRemoveCustomer} className="p-1 rounded-full bg-muted">
                      <X size={14} color={activeColors.foreground} />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    testID="visit-select-customer-btn"
                    onPress={() => setIsCustomerPickerOpen(true)}
                    className="h-12 rounded-xl border border-input bg-card px-3.5 flex-row items-center justify-between"
                  >
                    <Text className="text-sm text-muted-foreground">
                      {es.tasks.forms.customerPlaceholder}
                    </Text>
                    <Building2 size={18} color={activeColors.mutedForeground} />
                  </Pressable>
                )}
              </View>

              {/* Notes / Description */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-1.5">
                  {es.tasks.forms.descriptionLabel}
                </Text>
                <View className="border border-input rounded-xl bg-card px-3.5 py-2.5 min-h-[80px]">
                  <Controller
                    control={control}
                    name="description"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        testID="visit-desc-input"
                        placeholder="Puntos a tratar en la reunión..."
                        placeholderTextColor={activeColors.mutedForeground}
                        value={value ?? ''}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        multiline
                        textAlignVertical="top"
                        className="text-foreground text-sm"
                      />
                    )}
                  />
                </View>
              </View>

              {/* Submit button */}
              <View className="pt-2">
                <Button
                  testID="submit-visit-btn"
                  onPress={handleSubmit(onFormSubmit)}
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  variant="default"
                  size="lg"
                >
                  Agendar Visita
                </Button>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CustomerPickerModal
        visible={isCustomerPickerOpen}
        selectedCustomerId={selectedCustomer?.id}
        onClose={() => setIsCustomerPickerOpen(false)}
        onSelectCustomer={handleSelectCustomer}
      />
    </>
  );
}
