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
  ShoppingCart,
  Building2,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Package,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { createTaskSchema, type CreateTaskFormData } from '@/application/schemas/task.schema';
import type { TaskCustomerSummary } from '@/core/types/task.types';
import { Button } from '@/presentation/components/ui/button';
import { CustomerPickerModal } from '@/presentation/features/customers';
import { SaleProductCartSheet, type CartItem } from '@/presentation/features/sales';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';

export interface SaleFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function SaleFormSheet({
  visible,
  onClose,
  onSubmit,
  isSubmitting = false,
}: SaleFormSheetProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'capturing' | 'success' | 'failed'>('idle');
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<TaskCustomerSummary | null>(null);
  const [cart, setCart] = useState<{ items: CartItem[]; total: number }>({
    items: [],
    total: 0,
  });

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      type: 'SALE',
      category: 'SALE',
      title: '',
      description: '',
      customerId: null,
      estimatedValue: 0,
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

  const handleCartConfirmed = (newCart: { items: CartItem[]; total: number }) => {
    setCart(newCart);
    setValue('estimatedValue', newCart.total);
  };

  const handleClose = () => {
    reset();
    setSelectedCustomer(null);
    setCart({ items: [], total: 0 });
    onClose();
  };

  const onFormSubmit = async (data: CreateTaskFormData) => {
    if (!selectedCustomer) {
      Alert.alert(
        'Cliente Obligatorio',
        'Para registrar una venta directa es obligatorio asignar un cliente para facturación.',
      );
      return;
    }

    const itemsSummary =
      cart.items.length > 0
        ? `\nProductos: ${cart.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}`
        : '';

    await onSubmit({
      ...data,
      type: 'SALE',
      category: 'SALE',
      customerId: selectedCustomer.id,
      estimatedValue: cart.total > 0 ? cart.total : data.estimatedValue,
      description: `${data.description || ''}${itemsSummary}`.trim(),
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
                <View className="p-2 rounded-xl bg-emerald-500/10 mr-2.5">
                  <ShoppingCart size={20} color="#10b981" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-foreground">
                    {es.tasks.selector.saleTitle}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Cierre de pedido con productos para facturación
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
                        testID="sale-title-input"
                        placeholder="Ej. Pedido de abarrotes semanal"
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
                    <Pressable
                      testID="sale-select-customer-btn"
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
                    <Text className="text-[11px] text-muted-foreground pl-1">
                      Una venta requiere un cliente válido para emisión de comprobante.
                    </Text>
                  </View>
                )}
                {errors.customerId ? (
                  <Text className="text-xs text-destructive mt-1 font-medium pl-0.5">
                    {errors.customerId.message}
                  </Text>
                ) : null}
              </View>

              {/* Products & Cart Section */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-1.5">
                  Productos del Pedido
                </Text>

                <Pressable
                  testID="open-cart-btn"
                  onPress={() => setIsCartSheetOpen(true)}
                  className="p-3.5 rounded-xl border border-border bg-card flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <Package size={18} color={activeColors.mutedForeground} className="mr-2.5" />
                    <View>
                      <Text className="text-sm font-bold text-foreground">
                        {cart.items.length > 0
                          ? `${cart.items.length} productos seleccionados`
                          : 'Armar Pedido con Catálogo'}
                      </Text>
                      <Text className="text-xs text-muted-foreground">
                        {cart.total > 0
                          ? `Total estimado: $${cart.total.toFixed(2)} (IVA incl.)`
                          : 'Toca para agregar ítems y cantidades'}
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
                        testID="sale-desc-input"
                        placeholder="Condiciones de pago, entrega o notas..."
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
                  testID="submit-sale-btn"
                  onPress={handleSubmit(onFormSubmit)}
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  variant="default"
                  size="lg"
                >
                  Registrar Venta
                </Button>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Customer Picker Modal */}
      <CustomerPickerModal
        visible={isCustomerPickerOpen}
        selectedCustomerId={selectedCustomer?.id}
        onClose={() => setIsCustomerPickerOpen(false)}
        onSelectCustomer={handleSelectCustomer}
      />

      {/* Product Cart Sheet */}
      <SaleProductCartSheet
        visible={isCartSheetOpen}
        initialItems={cart.items}
        onClose={() => setIsCartSheetOpen(false)}
        onConfirmCart={handleCartConfirmed}
      />
    </>
  );
}
