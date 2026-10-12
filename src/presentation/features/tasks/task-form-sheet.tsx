import { useEffect, useMemo } from 'react';
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
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { TaskEntity } from '@/core/entities/task.entity';
import type { TaskCategory } from '@/core/types/task.types';
import { createTaskSchema, type CreateTaskFormData } from '@/application/schemas/task.schema';
import { Button, DatePickerField, TimePickerField, Input } from '@/presentation/components/ui';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';
import { CATEGORY_VISUALS } from './task-visuals';

export interface TaskFormSheetProps {
  visible: boolean;
  taskToEdit?: TaskEntity | null;
  initialDueDate?: string | null;
  onClose: () => void;
  onSubmit: (data: CreateTaskFormData) => Promise<void>;
  isSubmitting?: boolean;
}

const CATEGORIES: TaskCategory[] = ['OPPORTUNITY', 'VISIT', 'SALE', 'COLLECTION', 'GENERAL'];

export function TaskFormSheet({
  visible,
  taskToEdit,
  initialDueDate,
  onClose,
  onSubmit,
  isSubmitting = false,
}: TaskFormSheetProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  const isEditMode = Boolean(taskToEdit);
  const titleText = isEditMode ? es.tasks.editTask : es.tasks.newTask;

  const defaultValues = useMemo<CreateTaskFormData>(() => {
    let datePart = initialDueDate || '';
    let timePart = '';

    if (taskToEdit?.dueDate) {
      try {
        const d = new Date(taskToEdit.dueDate);
        if (!isNaN(d.getTime())) {
          datePart = d.toISOString().split('T')[0] || '';
          timePart = d.toTimeString().substring(0, 5);
        }
      } catch {
        datePart = taskToEdit.dueDate;
      }
    }

    return {
      title: taskToEdit?.title || '',
      description: taskToEdit?.description || '',
      category: taskToEdit?.category || 'GENERAL',
      dueDate: datePart,
      dueTime: timePart,
      customerId: taskToEdit?.customerId || '',
      userId: taskToEdit?.userId || '',
    };
  }, [taskToEdit, initialDueDate]);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues,
  });

  const selectedCategory = watch('category');

  useEffect(() => {
    if (visible) {
      reset(defaultValues);
    }
  }, [visible, defaultValues, reset]);

  const handleFormSubmit = async (data: CreateTaskFormData) => {
    let combinedDueDate: string | null = null;
    if (data.dueDate) {
      if (data.dueTime) {
        combinedDueDate = `${data.dueDate}T${data.dueTime}:00`;
      } else {
        combinedDueDate = `${data.dueDate}T09:00:00`;
      }
    }

    const payload: CreateTaskFormData = {
      ...data,
      dueDate: combinedDueDate,
      customerId: data.customerId ? data.customerId.trim() : null,
      description: data.description ? data.description.trim() : null,
    };

    await onSubmit(payload);
  };

  const handleSelectCategory = (cat: TaskCategory) => {
    Haptics.selectionAsync().catch(() => {});
    setValue('category', cat);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/60"
      >
        <Pressable className="flex-1" onPress={onClose} />

        <View
          className="bg-card rounded-t-3xl border-t border-border max-h-[90%] overflow-hidden"
          style={{ elevation: 16 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
            <Text className="text-lg font-bold text-foreground">{titleText}</Text>

            <Pressable
              testID="task-form-close-button"
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="h-8 w-8 items-center justify-center rounded-full bg-muted active:opacity-70"
            >
              <X size={18} color={activeColors.foreground} />
            </Pressable>
          </View>

          {/* Form Fields */}
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
            {/* Title Field */}
            <View className="mb-4">
              <Controller
                control={control}
                name="title"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    testID="task-title-input"
                    label={es.tasks.fields.title}
                    placeholder={es.tasks.fields.titlePlaceholder}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.title?.message}
                    autoCapitalize="sentences"
                  />
                )}
              />
            </View>

            {/* Category Selector Chips */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-foreground mb-2">
                {es.tasks.fields.category}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 8 }}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  const visual = CATEGORY_VISUALS[cat];

                  return (
                    <Pressable
                      key={cat}
                      testID={`form-category-${cat}`}
                      onPress={() => handleSelectCategory(cat)}
                      className={`flex-row items-center rounded-xl px-3.5 py-2 mr-2 border ${
                        isSelected ? 'bg-primary border-primary' : 'bg-muted border-border'
                      }`}
                    >
                      <View
                        className="h-2.5 w-2.5 rounded-full mr-2"
                        style={{
                          backgroundColor: isSelected ? '#ffffff' : visual.color,
                        }}
                      />
                      <Text
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-primary-foreground' : 'text-foreground'
                        }`}
                      >
                        {visual.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Date & Time Row */}
            <View className="mb-4 flex-row items-center space-x-2">
              <View className="flex-1 mr-2">
                <Controller
                  control={control}
                  name="dueDate"
                  render={({ field: { onChange, value } }) => (
                    <DatePickerField
                      testID="task-due-date-input"
                      label={es.tasks.fields.dueDate}
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
                      testID="task-due-time-input"
                      label={es.tasks.fields.dueTime}
                      value={value ?? ''}
                      onChange={onChange}
                      placeholder="Seleccionar hora"
                      error={errors.dueTime?.message}
                    />
                  )}
                />
              </View>
            </View>

            {/* Customer ID / Selector Field */}
            <View className="mb-4">
              <Controller
                control={control}
                name="customerId"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    testID="task-customer-input"
                    label={es.tasks.fields.customer}
                    placeholder={es.tasks.fields.customerPlaceholder}
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
            </View>

            {/* Description Notes Multiline Field */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-foreground mb-1.5">
                {es.tasks.fields.description}
              </Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="rounded-xl border border-border bg-card px-3.5 py-3">
                    <TextInput
                      testID="task-description-input"
                      placeholder={es.tasks.fields.descriptionPlaceholder}
                      placeholderTextColor={activeColors.mutedForeground}
                      value={value ?? ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      multiline
                      numberOfLines={4}
                      className="text-sm text-foreground p-0 min-h-[80px]"
                      textAlignVertical="top"
                    />
                  </View>
                )}
              />
              {errors.description?.message ? (
                <Text className="text-xs text-destructive mt-1">{errors.description.message}</Text>
              ) : null}
            </View>

            {/* Action Buttons */}
            <View className="flex-row items-center space-x-3 pt-2">
              <View className="flex-1 mr-2">
                <Button
                  testID="task-form-cancel-button"
                  variant="outline"
                  size="default"
                  onPress={onClose}
                  disabled={isSubmitting}
                >
                  {es.common.cancel}
                </Button>
              </View>

              <View className="flex-1">
                <Button
                  testID="task-form-submit-button"
                  variant="default"
                  size="default"
                  onPress={handleSubmit(handleFormSubmit)}
                  isLoading={isSubmitting}
                >
                  {es.tasks.actions.save}
                </Button>
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
