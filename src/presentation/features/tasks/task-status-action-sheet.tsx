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
import { X, CheckCircle2, XCircle, Play, RotateCw, MapPin, HandCoins } from 'lucide-react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import type { TaskEntity } from '@/core/entities/task.entity';
import type { TaskStatus } from '@/core/types/task.types';
import { useUpdateTaskStatus } from '@/application/hooks/tasks';
import { Button } from '@/presentation/components/ui/button';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';

export interface TaskStatusActionSheetProps {
  task: TaskEntity | null;
  visible: boolean;
  onClose: () => void;
  onSuccess: (updatedTask: TaskEntity) => void;
}

interface StatusOptionItem {
  status: TaskStatus;
  label: string;
  description: string;
  icon: typeof CheckCircle2;
  color: string;
  bgTint: string;
}

export function TaskStatusActionSheet({
  task,
  visible,
  onClose,
  onSuccess,
}: TaskStatusActionSheetProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'capturing' | 'success' | 'failed'>('idle');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>('COMPLETED');
  const [notes, setNotes] = useState('');

  const { mutateAsync: updateStatus, isPending } = useUpdateTaskStatus();

  useEffect(() => {
    if (!visible || !task) return;

    // Default status option depending on type
    if (task.type === 'COLLECTION') {
      setSelectedStatus('COLLECTED');
    } else {
      setSelectedStatus('COMPLETED');
    }
    setNotes('');

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

  const statusOptions: StatusOptionItem[] = [
    {
      status: 'COMPLETED',
      label: es.tasks.statusModal.markCompleted,
      description: 'Cerrar la tarea como completada satisfactoriamente',
      icon: CheckCircle2,
      color: '#10b981',
      bgTint: 'rgba(16, 185, 129, 0.08)',
    },
    {
      status: 'LOST',
      label: es.tasks.statusModal.markLost,
      description: 'El cliente no aceptó la propuesta o no se concretó',
      icon: XCircle,
      color: '#e11d48',
      bgTint: 'rgba(225, 29, 72, 0.08)',
    },
    {
      status: 'COLLECTED',
      label: es.tasks.statusModal.markCollected,
      description: 'Pago recibido y cobro finalizado',
      icon: HandCoins,
      color: '#0d9488',
      bgTint: 'rgba(13, 148, 136, 0.08)',
    },
    {
      status: 'IN_PROGRESS',
      label: es.tasks.statusModal.markInProgress,
      description: 'Actividad en curso o negociación activa',
      icon: Play,
      color: '#3b82f6',
      bgTint: 'rgba(59, 130, 246, 0.08)',
    },
    {
      status: 'CANCELLED',
      label: es.tasks.statusModal.markCancelled,
      description: 'Anular esta actividad',
      icon: XCircle,
      color: '#6b7280',
      bgTint: 'rgba(107, 114, 128, 0.08)',
    },
  ];

  const handleSelectStatus = async (s: TaskStatus) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
    setSelectedStatus(s);
  };

  const handleSubmit = async () => {
    if (!task) return;

    if (selectedStatus === 'LOST' && !notes.trim()) {
      Alert.alert(
        'Motivo Requerido',
        'Por favor ingresa el motivo por el cual la venta se consideró perdida.',
      );
      return;
    }

    try {
      const updated = await updateStatus({
        id: task.id,
        payload: {
          status: selectedStatus,
          latitude: coords?.latitude ?? null,
          longitude: coords?.longitude ?? null,
          notes: notes.trim() || null,
        },
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess(updated);
      onClose();
    } catch {
      Alert.alert('Error', es.tasks.errors.statusUpdateFailed);
    }
  };

  if (!task) return null;

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
          className="rounded-t-3xl border-t border-border bg-card px-5 pt-4 pb-8 max-h-[85%]"
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
                <RotateCw size={20} color={activeColors.primary} />
              </View>
              <View>
                <Text className="text-lg font-bold text-foreground">
                  {es.tasks.statusModal.title}
                </Text>
                <Text className="text-xs text-muted-foreground">Estado actual: {task.status}</Text>
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
            className="gap-y-3"
          >
            {/* Status Options */}
            {statusOptions.map((opt) => {
              const isSelected = selectedStatus === opt.status;
              const Icon = opt.icon;

              return (
                <Pressable
                  key={opt.status}
                  testID={`status-option-${opt.status.toLowerCase()}`}
                  onPress={() => handleSelectStatus(opt.status)}
                  className={`p-3.5 rounded-2xl border flex-row items-center justify-between ${
                    isSelected ? 'border-primary bg-primary/10' : 'border-border bg-card'
                  }`}
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <View
                      className="h-10 w-10 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: opt.color }}
                    >
                      <Icon size={20} color="#ffffff" />
                    </View>

                    <View className="flex-1">
                      <Text
                        className="text-sm font-bold"
                        style={{
                          color: isSelected ? activeColors.primary : activeColors.foreground,
                        }}
                      >
                        {opt.label}
                      </Text>
                      <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
                        {opt.description}
                      </Text>
                    </View>
                  </View>

                  <View
                    className={`h-5 w-5 rounded-full border items-center justify-center ${
                      isSelected ? 'border-primary bg-primary' : 'border-border'
                    }`}
                  >
                    {isSelected ? (
                      <View className="h-2 w-2 rounded-full bg-primary-foreground" />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}

            {/* Reason Notes */}
            <View className="pt-2">
              <Text className="text-sm font-medium text-foreground mb-1.5">
                {selectedStatus === 'LOST'
                  ? 'Motivo de Venta Perdida *'
                  : es.tasks.statusModal.reasonLabel}
              </Text>
              <View className="border border-input rounded-xl bg-card px-3.5 py-2.5 min-h-[70px]">
                <TextInput
                  testID="status-notes-input"
                  placeholder={
                    selectedStatus === 'LOST'
                      ? 'Ej. Cliente indica que no cuenta con presupuesto este mes...'
                      : es.tasks.statusModal.reasonPlaceholder
                  }
                  placeholderTextColor={activeColors.mutedForeground}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  textAlignVertical="top"
                  className="text-foreground text-sm"
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
                  ? `GPS anexado: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
                  : 'Capturando GPS...'}
              </Text>
            </View>

            {/* Submit button */}
            <View className="pt-2">
              <Button
                testID="submit-status-btn"
                onPress={handleSubmit}
                isLoading={isPending}
                disabled={isPending}
                variant="default"
                size="lg"
              >
                {es.tasks.statusModal.confirmButton}
              </Button>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
