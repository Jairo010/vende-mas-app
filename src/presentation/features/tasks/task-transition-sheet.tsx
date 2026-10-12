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
  ArrowRight,
  TrendingUp,
  MapPin,
  ShoppingCart,
  HandCoins,
  Building2,
  AlertTriangle,
  Package,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import type { TaskEntity } from '@/core/entities/task.entity';
import type { TaskCustomerSummary, TaskType } from '@/core/types/task.types';
import {
  transitionTaskSchema,
  type TransitionTaskFormData,
} from '@/application/schemas/task.schema';
import { useTransitionTask } from '@/application/hooks/tasks';
import { Button, DatePickerField } from '@/presentation/components/ui';
import { CustomerPickerModal } from '@/presentation/features/customers';
import { SaleProductCartSheet, type CartItem } from '@/presentation/features/sales';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';

export interface TaskTransitionSheetProps {
  task: TaskEntity | null;
  visible: boolean;
  onClose: () => void;
  onSuccess: (updatedTask: TaskEntity) => void;
}

export function TaskTransitionSheet({
  task,
  visible,
  onClose,
  onSuccess,
}: TaskTransitionSheetProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'capturing' | 'success' | 'failed'>('idle');
  const [selectedType, setSelectedType] = useState<TaskType>('VISIT');
  const [selectedCustomer, setSelectedCustomer] = useState<TaskCustomerSummary | null>(
    task?.customer ?? null,
  );
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const [cart, setCart] = useState<{ items: CartItem[]; total: number }>({
    items: [],
    total: 0,
  });

  const { mutateAsync: transitionTask, isPending } = useTransitionTask();

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransitionTaskFormData>({
    resolver: zodResolver(transitionTaskSchema),
    defaultValues: {
      targetType: 'VISIT',
      customerId: task?.customerId ?? null,
      notes: '',
      dueDate: '',
    },
  });

  // Allowed transitions depending on current task type
  const allowedTypes: TaskType[] =
    task?.type === 'OPPORTUNITY'
      ? ['VISIT', 'SALE', 'COLLECTION']
      : task?.type === 'VISIT'
        ? ['SALE', 'COLLECTION']
        : task?.type === 'SALE'
          ? ['COLLECTION']
          : ['VISIT', 'SALE'];

  useEffect(() => {
    if (!visible || !task) return;

    const defaultNext = allowedTypes[0] || 'VISIT';
    setSelectedType(defaultNext);
    setValue('targetType', defaultNext);
    setSelectedCustomer(task.customer ?? null);
    setValue('customerId', task.customerId ?? null);

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
  }, [visible, task]);

  const handleSelectType = (t: TaskType) => {
    setSelectedType(t);
    setValue('targetType', t);
  };

  const handleSelectCustomer = (customer: TaskCustomerSummary) => {
    setSelectedCustomer(customer);
    setValue('customerId', customer.id);
  };

  const handleCartConfirmed = (newCart: { items: CartItem[]; total: number }) => {
    setCart(newCart);
  };

  const onFormSubmit = async (data: TransitionTaskFormData) => {
    if (!task) return;

    if ((selectedType === 'SALE' || selectedType === 'COLLECTION') && !selectedCustomer) {
      Alert.alert('Cliente Obligatorio', es.tasks.transitions.customerRequiredNotice);
      return;
    }

    try {
      const updated = await transitionTask({
        id: task.id,
        payload: {
          ...data,
          targetType: selectedType,
          customerId: selectedCustomer?.id ?? null,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
        },
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      reset();
      onSuccess(updated);
      onClose();
    } catch {
      Alert.alert('Error', es.tasks.errors.transitionFailed);
    }
  };

  if (!task) return null;

  return (
    <>
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
                <View className="p-2 rounded-xl bg-purple-500/10 mr-2.5">
                  <ArrowRight size={20} color="#8b5cf6" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-foreground">
                    {es.tasks.transitions.modalTitle}
                  </Text>
                  <Text className="text-xs text-muted-foreground">Etapa actual: {task.type}</Text>
                </View>
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
              {/* Target Type Selector Pills */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  {es.tasks.transitions.selectTargetType}
                </Text>
                <View className="flex-row space-x-2">
                  {allowedTypes.map((t) => {
                    const isSelected = selectedType === t;
                    const Icon =
                      t === 'OPPORTUNITY'
                        ? TrendingUp
                        : t === 'VISIT'
                          ? MapPin
                          : t === 'SALE'
                            ? ShoppingCart
                            : HandCoins;

                    const color =
                      t === 'OPPORTUNITY'
                        ? '#8b5cf6'
                        : t === 'VISIT'
                          ? '#0ea5e9'
                          : t === 'SALE'
                            ? '#10b981'
                            : '#f59e0b';

                    return (
                      <Pressable
                        key={t}
                        testID={`target-type-${t.toLowerCase()}`}
                        onPress={() => handleSelectType(t)}
                        className={`flex-1 p-3 rounded-xl border items-center justify-center ${
                          isSelected ? 'border-primary bg-primary/10' : 'border-border bg-muted/40'
                        }`}
                      >
                        <Icon size={18} color={isSelected ? activeColors.primary : color} />
                        <Text
                          className={`text-xs font-bold mt-1 ${
                            isSelected ? 'text-primary' : 'text-foreground'
                          }`}
                        >
                          {es.tasks.types[t]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Mandatory Customer Check for SALE or COLLECTION */}
              {(selectedType === 'SALE' || selectedType === 'COLLECTION') && (
                <View>
                  <Text className="text-sm font-medium text-foreground mb-1.5">
                    {es.tasks.forms.customerRequired} *
                  </Text>

                  {selectedCustomer ? (
                    <View className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1 mr-2">
                        <Building2 size={18} color="#10b981" className="mr-2.5" />
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
                      <View className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex-row items-center">
                        <AlertTriangle
                          size={18}
                          color={activeColors.destructive}
                          className="mr-2"
                        />
                        <Text className="text-xs text-destructive flex-1">
                          {es.tasks.transitions.customerRequiredNotice}
                        </Text>
                      </View>

                      <Pressable
                        testID="transition-select-customer-btn"
                        onPress={() => setIsCustomerPickerOpen(true)}
                        className="h-12 rounded-xl border border-primary/40 bg-primary/10 px-3.5 flex-row items-center justify-center"
                      >
                        <Building2 size={16} color={activeColors.primary} className="mr-2" />
                        <Text className="text-sm font-bold text-primary">
                          {es.tasks.transitions.selectCustomerBtn}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                  {errors.customerId ? (
                    <Text className="text-xs text-destructive mt-1 font-medium pl-0.5">
                      {errors.customerId.message}
                    </Text>
                  ) : null}
                </View>
              )}

              {/* If Transition to SALE: Product Catalog Shortcut */}
              {selectedType === 'SALE' && (
                <View>
                  <Text className="text-sm font-medium text-foreground mb-1.5">
                    Pedido con Catálogo
                  </Text>
                  <Pressable
                    testID="transition-open-cart-btn"
                    onPress={() => setIsCartSheetOpen(true)}
                    className="p-3.5 rounded-xl border border-border bg-card flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <Package size={18} color={activeColors.mutedForeground} className="mr-2.5" />
                      <View>
                        <Text className="text-sm font-bold text-foreground">
                          {cart.items.length > 0
                            ? `${cart.items.length} productos seleccionados`
                            : es.tasks.transitions.openCartBtn}
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                          {cart.total > 0
                            ? `Total: $${cart.total.toFixed(2)}`
                            : 'Toca para armar pedido con productos'}
                        </Text>
                      </View>
                    </View>
                    <View className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {cart.total > 0 ? `$${cart.total.toFixed(2)}` : 'Abrir'}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              )}

              {/* If Transition to VISIT or COLLECTION: Due date */}
              {(selectedType === 'VISIT' || selectedType === 'COLLECTION') && (
                <Controller
                  control={control}
                  name="dueDate"
                  render={({ field: { onChange, value } }) => (
                    <DatePickerField
                      testID="transition-date-input"
                      label={es.tasks.forms.dueDateLabel}
                      value={value ?? ''}
                      onChange={onChange}
                      placeholder="Seleccionar fecha"
                      error={errors.dueDate?.message}
                    />
                  )}
                />
              )}

              {/* Notes */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-1.5">
                  {es.tasks.transitions.notesLabel}
                </Text>
                <View className="border border-input rounded-xl bg-card px-3.5 py-2.5 min-h-[80px]">
                  <Controller
                    control={control}
                    name="notes"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        testID="transition-notes-input"
                        placeholder={es.tasks.transitions.notesPlaceholder}
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

              {/* GPS status */}
              <View className="flex-row items-center p-2.5 rounded-xl bg-muted/60 border border-border">
                <MapPin
                  size={14}
                  color={gpsStatus === 'success' ? '#10b981' : activeColors.mutedForeground}
                  className="mr-2"
                />
                <Text className="text-xs text-foreground font-medium">
                  {gpsStatus === 'success' && coords
                    ? `GPS anexado a la transición (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`
                    : 'Capturando coordenadas GPS...'}
                </Text>
              </View>

              {/* Submit button */}
              <View className="pt-2">
                <Button
                  testID="confirm-transition-btn"
                  onPress={handleSubmit(onFormSubmit)}
                  isLoading={isPending}
                  disabled={isPending}
                  variant="default"
                  size="lg"
                >
                  {es.tasks.transitions.confirmTransition}
                </Button>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Customer Picker */}
      <CustomerPickerModal
        visible={isCustomerPickerOpen}
        selectedCustomerId={selectedCustomer?.id}
        onClose={() => setIsCustomerPickerOpen(false)}
        onSelectCustomer={handleSelectCustomer}
      />

      {/* Cart Sheet */}
      <SaleProductCartSheet
        visible={isCartSheetOpen}
        initialItems={cart.items}
        onClose={() => setIsCartSheetOpen(false)}
        onConfirmCart={handleCartConfirmed}
      />
    </>
  );
}
