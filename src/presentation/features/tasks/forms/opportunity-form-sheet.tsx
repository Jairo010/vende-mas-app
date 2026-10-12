import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
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
  TrendingUp,
  MapPin,
  Camera,
  Image as ImageIcon,
  DollarSign,
  Building2,
  CheckCircle2,
  RotateCw,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { createTaskSchema, type CreateTaskFormData } from '@/application/schemas/task.schema';
import { useUploadTaskPhoto } from '@/application/hooks/tasks';
import type { TaskCustomerSummary } from '@/core/types/task.types';
import { Button } from '@/presentation/components/ui/button';
import { CustomerPickerModal } from '@/presentation/features/customers';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';

export interface OpportunityFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function OpportunityFormSheet({
  visible,
  onClose,
  onSubmit,
  isSubmitting = false,
}: OpportunityFormSheetProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'capturing' | 'success' | 'failed'>('idle');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<TaskCustomerSummary | null>(null);

  const { mutateAsync: uploadPhoto, isPending: isUploadingPhoto } = useUploadTaskPhoto();

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      type: 'OPPORTUNITY',
      category: 'OPPORTUNITY',
      title: '',
      description: '',
      estimatedValue: undefined,
      photoUrl: null,
      customerId: null,
    },
  });

  const requestGps = async () => {
    setGpsStatus('capturing');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsStatus('failed');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.LocationAccuracy.Balanced,
      });

      setCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setValue('latitude', loc.coords.latitude);
      setValue('longitude', loc.coords.longitude);
      setGpsStatus('success');
    } catch {
      setGpsStatus('failed');
    }
  };

  useEffect(() => {
    if (!visible) return;
    requestGps();
  }, [visible]);

  const handlePickPhoto = async (fromCamera: boolean) => {
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      };

      const result = fromCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setPhotoUri(asset.uri);

        try {
          const uploadRes = await uploadPhoto({
            file: {
              uri: asset.uri,
              name: asset.fileName || 'opportunity_photo.jpg',
              type: asset.mimeType || 'image/jpeg',
            },
          });
          setValue('photoUrl', uploadRes.photoUrl);
        } catch {
          // Keep local uri
          setValue('photoUrl', asset.uri);
        }
      }
    } catch {
      Alert.alert('Error', 'No se pudo capturar la foto.');
    }
  };

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
    setPhotoUri(null);
    setSelectedCustomer(null);
    onClose();
  };

  const onFormSubmit = async (data: CreateTaskFormData) => {
    await onSubmit({
      ...data,
      type: 'OPPORTUNITY',
      category: 'OPPORTUNITY',
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      photoUrl: photoUri ?? data.photoUrl ?? null,
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
                <View className="p-2 rounded-xl bg-purple-500/10 mr-2.5">
                  <TrendingUp size={20} color="#8b5cf6" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-foreground">
                    {es.tasks.selector.opportunityTitle}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    Registro rápido de prospecto en campo
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
              {/* GPS Status Badge */}
              <View className="flex-row items-center justify-between p-3 rounded-xl bg-muted/60 border border-border">
                <View className="flex-row items-center flex-1 mr-2">
                  <MapPin
                    size={16}
                    color={gpsStatus === 'success' ? '#10b981' : activeColors.mutedForeground}
                    className="mr-2"
                  />
                  <Text className="text-xs text-foreground font-medium" numberOfLines={1}>
                    {gpsStatus === 'success' && coords
                      ? `${es.tasks.forms.gpsCaptured} (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`
                      : gpsStatus === 'capturing'
                        ? 'Obteniendo GPS...'
                        : es.tasks.forms.gpsFailed}
                  </Text>
                </View>

                {gpsStatus === 'success' ? (
                  <CheckCircle2 size={16} color="#10b981" />
                ) : (
                  <Pressable
                    onPress={requestGps}
                    className="flex-row items-center px-2 py-1 rounded-lg bg-card border border-border"
                  >
                    <RotateCw size={12} color={activeColors.foreground} className="mr-1" />
                    <Text className="text-[11px] text-foreground font-medium">Reintentar</Text>
                  </Pressable>
                )}
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
                        testID="opportunity-title-input"
                        placeholder="Ej. Negociación de insumos con Don Carlos"
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

              {/* Photo capture & preview */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-1.5">
                  {es.tasks.forms.photoLabel}
                </Text>

                {photoUri ? (
                  <View className="relative rounded-2xl overflow-hidden border border-border h-36 bg-muted items-center justify-center">
                    <Image
                      source={{ uri: photoUri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    <Pressable
                      onPress={() => setPhotoUri(null)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70"
                    >
                      <X size={16} color="#ffffff" />
                    </Pressable>
                  </View>
                ) : (
                  <View className="flex-row space-x-3">
                    <Pressable
                      testID="take-photo-btn"
                      onPress={() => handlePickPhoto(true)}
                      className="flex-1 h-12 rounded-xl border border-border bg-muted/50 flex-row items-center justify-center"
                    >
                      <Camera size={16} color={activeColors.foreground} className="mr-2" />
                      <Text className="text-xs font-semibold text-foreground">
                        {es.tasks.forms.takePhoto}
                      </Text>
                    </Pressable>

                    <Pressable
                      testID="choose-photo-btn"
                      onPress={() => handlePickPhoto(false)}
                      className="flex-1 h-12 rounded-xl border border-border bg-muted/50 flex-row items-center justify-center"
                    >
                      <ImageIcon size={16} color={activeColors.foreground} className="mr-2" />
                      <Text className="text-xs font-semibold text-foreground">
                        {es.tasks.forms.choosePhoto}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* Estimated Value ($) */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-1.5">
                  {es.tasks.forms.estimatedValueLabel}
                </Text>
                <View className="flex-row items-center border border-input rounded-xl bg-card px-3.5 h-12">
                  <DollarSign size={18} color={activeColors.mutedForeground} className="mr-2" />
                  <Controller
                    control={control}
                    name="estimatedValue"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        testID="opportunity-value-input"
                        placeholder="250.00"
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

              {/* Optional Customer */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-1.5">
                  {es.tasks.forms.customerOptional}
                </Text>
                {selectedCustomer ? (
                  <View className="p-3 rounded-xl border border-purple-500/40 bg-purple-500/10 flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 mr-2">
                      <Building2 size={16} color="#8b5cf6" className="mr-2" />
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
                    testID="select-customer-btn"
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

              {/* Description / Notes */}
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
                        testID="opportunity-desc-input"
                        placeholder={es.tasks.forms.descriptionPlaceholder}
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
                  testID="submit-opportunity-btn"
                  onPress={handleSubmit(onFormSubmit)}
                  isLoading={isSubmitting || isUploadingPhoto}
                  disabled={isSubmitting || isUploadingPhoto}
                  variant="default"
                  size="lg"
                >
                  {es.tasks.forms.saveButton}
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
    </>
  );
}
