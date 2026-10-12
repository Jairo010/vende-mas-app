import { useState } from 'react';
import { Alert, Image, Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import {
  X,
  Clock,
  Building2,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  AlertTriangle,
  ArrowRight,
  RotateCw,
  ExternalLink,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { TaskEntity } from '@/core/entities/task.entity';
import type { TaskStatus } from '@/core/types/task.types';
import { Badge } from '@/presentation/components/ui/badge';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';
import { getStatusVisual, getTypeVisual } from './task-visuals';
import { TaskHistoryTimeline } from './task-history-timeline';
import { TaskTransitionSheet } from './task-transition-sheet';
import { TaskStatusActionSheet } from './task-status-action-sheet';

export interface TaskDetailSheetProps {
  task: TaskEntity | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (task: TaskEntity) => void;
  onDelete: (id: string) => Promise<void>;
  onUpdateStatus?: (id: string, nextStatus: TaskStatus) => Promise<void>;
  onTaskUpdated?: (updatedTask: TaskEntity) => void;
  isDeleting?: boolean;
}

export function TaskDetailSheet({
  task,
  visible,
  onClose,
  onEdit,
  onDelete,
  onTaskUpdated,
  isDeleting = false,
}: TaskDetailSheetProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  const [isTransitionOpen, setIsTransitionOpen] = useState(false);
  const [isStatusActionOpen, setIsStatusActionOpen] = useState(false);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

  if (!task) return null;

  const typeVisual = getTypeVisual(task.type || task.category);
  const statusVisual = getStatusVisual(task.status);
  const isCompleted = task.isCompleted();
  const isOverdue = task.isOverdue();

  const formatDueDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Sin fecha límite';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString([], {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleCallCustomer = () => {
    if (task.customer?.phone) {
      Linking.openURL(`tel:${task.customer.phone}`);
    }
  };

  const handleOpenCustomerMap = () => {
    if (task.customer?.latitude && task.customer?.longitude) {
      Linking.openURL(
        `https://maps.google.com/?q=${task.customer.latitude},${task.customer.longitude}`,
      );
    } else if (task.customer?.address) {
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(task.customer.address)}`);
    }
  };

  const handleOpenTaskGps = () => {
    if (task.latitude !== null && task.longitude !== null) {
      Linking.openURL(`https://maps.google.com/?q=${task.latitude},${task.longitude}`);
    }
  };

  const handleDeleteConfirm = () => {
    Alert.alert(es.tasks.dialogs.deleteConfirmTitle, es.tasks.dialogs.deleteConfirmMessage, [
      { text: es.tasks.actions.cancel, style: 'cancel' },
      {
        text: es.tasks.actions.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          } catch {
            // Ignore
          }
          await onDelete(task.id);
          onClose();
        },
      },
    ]);
  };

  const handleTransitionSuccess = (updated: TaskEntity) => {
    onTaskUpdated?.(updated);
  };

  const handleStatusSuccess = (updated: TaskEntity) => {
    onTaskUpdated?.(updated);
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View className="flex-1 justify-end bg-black/60">
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
              <View className="flex-row items-center space-x-2">
                <Badge variant={typeVisual.badgeVariant} size="sm" label={typeVisual.label} />
                <Badge variant={statusVisual.badgeVariant} size="sm" label={statusVisual.label} />
              </View>

              <View className="flex-row items-center space-x-2">
                <Pressable
                  testID="edit-task-btn"
                  onPress={() => {
                    onClose();
                    onEdit(task);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="p-2 rounded-full bg-muted mr-1"
                >
                  <Edit2 size={16} color={activeColors.foreground} />
                </Pressable>

                <Pressable
                  testID="delete-task-btn"
                  onPress={handleDeleteConfirm}
                  disabled={isDeleting}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="p-2 rounded-full bg-destructive/10 mr-1"
                >
                  <Trash2 size={16} color={activeColors.destructive} />
                </Pressable>

                <Pressable
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="p-2 rounded-full bg-muted"
                >
                  <X size={18} color={activeColors.foreground} />
                </Pressable>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
              className="gap-y-4"
            >
              {/* Overdue Warning */}
              {isOverdue && !isCompleted ? (
                <View className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 flex-row items-center">
                  <AlertTriangle size={18} color={activeColors.destructive} className="mr-2.5" />
                  <Text className="text-xs font-semibold text-destructive flex-1">
                    Esta actividad se encuentra vencida. Te sugerimos actualizar su estado o
                    reprogramarla.
                  </Text>
                </View>
              ) : null}

              {/* Title & Date */}
              <View>
                <Text className="text-xl font-bold text-foreground mb-1">{task.title}</Text>

                <View className="flex-row items-center mt-1">
                  <Clock size={14} color={activeColors.mutedForeground} className="mr-1.5" />
                  <Text className="text-xs text-muted-foreground font-medium">
                    {formatDueDate(task.dueDate)}
                  </Text>
                </View>
              </View>

              {/* Field Verification Badges (GPS & Photo) */}
              <View className="flex-row space-x-3">
                {/* GPS Badge */}
                {task.latitude !== null && task.longitude !== null ? (
                  <Pressable
                    testID="open-gps-btn"
                    onPress={handleOpenTaskGps}
                    className="flex-1 p-3 rounded-2xl bg-muted/50 border border-border flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <MapPin size={16} color={activeColors.primary} className="mr-2" />
                      <View className="flex-1">
                        <Text className="text-[11px] font-bold text-foreground">
                          {es.tasks.forms.gpsCaptured}
                        </Text>
                        <Text
                          className="text-[10px] text-muted-foreground font-mono"
                          numberOfLines={1}
                        >
                          {task.latitude.toFixed(4)}, {task.longitude.toFixed(4)}
                        </Text>
                      </View>
                    </View>
                    <ExternalLink size={14} color={activeColors.mutedForeground} />
                  </Pressable>
                ) : null}

                {/* Photo Thumbnail */}
                {task.photoUrl ? (
                  <Pressable
                    testID="view-task-photo-btn"
                    onPress={() => setViewingPhotoUrl(task.photoUrl!)}
                    className="flex-1 p-2 rounded-2xl bg-muted/50 border border-border flex-row items-center"
                  >
                    <Image
                      source={{ uri: task.photoUrl }}
                      className="w-10 h-10 rounded-xl mr-2.5 bg-muted"
                      resizeMode="cover"
                    />
                    <View className="flex-1">
                      <Text className="text-[11px] font-bold text-foreground">Foto Anexada</Text>
                      <Text className="text-[10px] text-primary">Toca para ver</Text>
                    </View>
                  </Pressable>
                ) : null}
              </View>

              {/* Description */}
              {task.description ? (
                <View className="p-3.5 rounded-2xl bg-card border border-border">
                  <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Descripción / Observaciones
                  </Text>
                  <Text className="text-sm text-foreground leading-5">{task.description}</Text>
                </View>
              ) : null}

              {/* Customer Information Card */}
              {task.customer ? (
                <View className="p-4 rounded-2xl bg-card border border-border">
                  <View className="flex-row items-center justify-between mb-2 pb-2 border-b border-border">
                    <View className="flex-row items-center">
                      <Building2 size={16} color={activeColors.mutedForeground} className="mr-2" />
                      <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Cliente Asociado
                      </Text>
                    </View>
                    {task.customer.identification ? (
                      <Text className="text-xs font-mono text-muted-foreground">
                        {task.customer.identification}
                      </Text>
                    ) : null}
                  </View>

                  <Text className="text-base font-bold text-foreground mb-1">
                    {task.customer.name}
                  </Text>

                  {task.customer.address ? (
                    <Text className="text-xs text-muted-foreground mb-3">
                      {task.customer.address}
                    </Text>
                  ) : null}

                  {/* Customer action buttons */}
                  <View className="flex-row space-x-2 pt-1">
                    {task.customer.phone ? (
                      <Pressable
                        testID="call-customer-btn"
                        onPress={handleCallCustomer}
                        className="flex-1 flex-row items-center justify-center p-2.5 rounded-xl bg-primary/10 border border-primary/20"
                      >
                        <Phone size={14} color={activeColors.primary} className="mr-1.5" />
                        <Text className="text-xs font-bold text-primary">
                          {es.tasks.detail.callCustomer}
                        </Text>
                      </Pressable>
                    ) : null}

                    <Pressable
                      testID="route-customer-btn"
                      onPress={handleOpenCustomerMap}
                      className="flex-1 flex-row items-center justify-center p-2.5 rounded-xl bg-muted border border-border"
                    >
                      <MapPin size={14} color={activeColors.foreground} className="mr-1.5" />
                      <Text className="text-xs font-bold text-foreground">
                        {es.tasks.detail.navigateRoute}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

              {/* Action Buttons Row ("Transicionar Etapa" & "Actualizar Estado") */}
              <View className="flex-row space-x-3 pt-1">
                <Pressable
                  testID="open-transition-btn"
                  onPress={() => setIsTransitionOpen(true)}
                  className="flex-1 flex-row items-center justify-center p-3.5 rounded-2xl bg-purple-600 shadow-sm"
                >
                  <ArrowRight size={16} color="#ffffff" className="mr-2" />
                  <Text className="text-sm font-bold text-white">
                    {es.tasks.detail.transitionStageButton}
                  </Text>
                </Pressable>

                <Pressable
                  testID="open-status-btn"
                  onPress={() => setIsStatusActionOpen(true)}
                  className="flex-1 flex-row items-center justify-center p-3.5 rounded-2xl bg-muted border border-border"
                >
                  <RotateCw size={16} color={activeColors.foreground} className="mr-2" />
                  <Text className="text-sm font-bold text-foreground">
                    {es.tasks.detail.updateStatusButton}
                  </Text>
                </Pressable>
              </View>

              {/* Audit Timeline Section */}
              <View className="pt-2">
                <Text className="text-sm font-bold text-foreground mb-3">
                  {es.tasks.detail.timelineTitle}
                </Text>
                <TaskHistoryTimeline
                  history={task.history}
                  onPhotoPress={(url) => setViewingPhotoUrl(url)}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Stage Transition Sheet */}
      <TaskTransitionSheet
        task={task}
        visible={isTransitionOpen}
        onClose={() => setIsTransitionOpen(false)}
        onSuccess={handleTransitionSuccess}
      />

      {/* Status Action Sheet */}
      <TaskStatusActionSheet
        task={task}
        visible={isStatusActionOpen}
        onClose={() => setIsStatusActionOpen(false)}
        onSuccess={handleStatusSuccess}
      />

      {/* Photo Viewer Modal */}
      {viewingPhotoUrl ? (
        <Modal
          visible={Boolean(viewingPhotoUrl)}
          transparent
          animationType="fade"
          onRequestClose={() => setViewingPhotoUrl(null)}
        >
          <View className="flex-1 bg-black/95 items-center justify-center p-4">
            <Pressable
              onPress={() => setViewingPhotoUrl(null)}
              className="absolute top-12 right-6 p-3 rounded-full bg-white/20 z-10"
            >
              <X size={24} color="#ffffff" />
            </Pressable>
            <Image
              source={{ uri: viewingPhotoUrl }}
              className="w-full h-4/5 rounded-2xl"
              resizeMode="contain"
            />
          </View>
        </Modal>
      ) : null}
    </>
  );
}
