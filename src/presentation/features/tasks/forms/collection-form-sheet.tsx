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
  HandCoins,
  Building2,
  DollarSign,
  AlertTriangle,
  MapPin,
  CheckCircle2,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import type { TaskCustomerSummary } from '@/core/types/task.types';
import { createTaskSchema, type CreateTaskFormData } from '@/application/schemas/task.schema';
import { Button, DatePickerField } from '@/presentation/components/ui';
import { CustomerPickerModal } from '@/presentation/features/customers';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';

export interface CollectionFormSheetProps {
  visible: boolean;
  initialDate?: string | null;
  onClose: () => void;
  onSubmit: (data: CreateTaskFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function CollectionFormSheet({
  visible,
  initialDate,
  onClose,
  onSubmit,
  isSubmitting = false,
}: CollectionFormSheetProps) {
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
      type: 'COLLECTION',
      category: 'COLLECTION',
      title: '',
      description: '',
      dueDate: todayStr,
      customerId: null,
      estimatedValue: undefined,
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

  const handleClose = () => {
    reset();
    setSelectedCustomer(null);
    onClose();
  };

  const onFormSubmit = async (data: CreateTaskFormData) => {
    if (!selectedCustomer) {
      Alert.alert(
        'Cliente Obligatorio',
        'Para registrar una tarea de cobranza es obligatorio asignar el cliente deudor.',
      );
      return;
    }

    await onSubmit({
      ...data,
      type: 'COLLECTION',
      category: 'COLLECTION',
      customerId: selectedCustomer.id,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
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
                <View className="p-2 rounded-xl bg-amber-500/10 mr-2.5">
                  <HandCoins size={20} color="#f59e0b" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-foreground">
                    {es.tasks.selector.collectionTitle}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Gestión y cobro de factura o saldo pendiente
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
                        testID="collection-title-input"
                        placeholder="Ej. Cobro de Factura #001-020"
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

              {/* Mandatory Customer Section */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-1.5">
                  {es.tasks.forms.customerRequired} *
                </Text>

                {selectedCustomer ? (
                  <View className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 mr-2">
                      <Building2 size={18} color="#f59e0b" className="mr-2.5" />
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                          {selectedCustomer.name}
                        </Text>
                        {selectedCustomer.identification ? (
                          <Text className="text-[11px] text-muted-foreground font-mono">
                            RUC/C.I.: {selectedCustomer.identification}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    <Pressable
                      onPress={() => setSelectedCustomer(null)}
                      className="p-1 rounded-full bg-muted"
                    >
                      <X size={14} color={activeColors.foreground} />
                    </Pressable>
                  </View>
                ) : (
                  <View className="gap-y-2">
                    <Pressable
                      testID="collection-select-customer-btn"
                      onPress={() => setIsCustomerPickerOpen(true)}
                      className="h-12 rounded-xl border border-destructive/50 bg-destructive/5 px-3.5 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center">
                        <AlertTriangle
                          size={16}
                          color={activeColors.destructive}
                          className="mr-2"
                        />
                        <Text className="text-sm font-medium text-destructive">
                          Seleccionar Cliente (Obligatorio)
                        </Text>
                      </View>
                      <Building2 size={18} color={activeColors.destructive} />
                    </Pressable>
                  </View>
                )}
                {errors.customerId ? (
                  <Text className="text-xs text-destructive mt-1 font-medium pl-0.5">
                    {errors.customerId.message}
                  </Text>
                ) : null}
              </View>

              {/* Amount to collect ($) */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-1.5">
                  Monto a Cobrar ($) *
                </Text>
                <View className="flex-row items-center border border-input rounded-xl bg-card px-3.5 h-12">
                  <DollarSign size={18} color={activeColors.mutedForeground} className="mr-2" />
                  <Controller
                    control={control}
                    name="estimatedValue"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        testID="collection-amount-input"
                        placeholder="180.00"
                        placeholderTextColor={activeColors.mutedForeground}
                        value={value !== undefined && value !== null ? String(value) : ''}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        keyboardType="decimal-pad"
                        className="flex-1 text-foreground text-base py-0"
                      />
                    )}
                  />
                </View>
              </View>

              {/* Date */}
              <Controller
                control={control}
                name="dueDate"
                render={({ field: { onChange, value } }) => (
                  <DatePickerField
                    testID="collection-date-input"
                    label={es.tasks.forms.dueDateLabel}
                    value={value ?? ''}
                    onChange={onChange}
                    placeholder="Seleccionar fecha"
                    error={errors.dueDate?.message}
                  />
                )}
              />

              {/* Notes */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-1.5">
                  {es.tasks.forms.descriptionLabel}
                </Text>
                <View className="border border-input rounded-xl bg-card px-3.5 py-2.5 min-h-[70px]">
                  <Controller
                    control={control}
                    name="description"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        testID="collection-desc-input"
                        placeholder="Nro. de factura, cheque o acuerdos de cobro..."
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
                  testID="submit-collection-btn"
                  onPress={handleSubmit(onFormSubmit)}
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  variant="default"
                  size="lg"
                >
                  Crear Cobranza
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
