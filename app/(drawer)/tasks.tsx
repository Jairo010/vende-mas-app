import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TaskEntity } from '@/core/entities/task.entity';
import type { TaskFilterParams, TaskType, TaskStatus } from '@/core/types/task.types';
import { ScreenHeader } from '@/presentation/components/common';
import { Toast, type ToastType } from '@/presentation/components/feedback';
import {
  TasksAgendaList,
  TasksCalendarStrip,
  TaskDetailSheet,
  TaskFormSheet,
  TaskTypeSelectorSheet,
  OpportunityFormSheet,
  VisitFormSheet,
  SaleFormSheet,
  CollectionFormSheet,
} from '@/presentation/features/tasks';
import {
  useCreateTask,
  useDeleteTask,
  useTasks,
  useTaskStatusToggle,
  useUpdateTask,
} from '@/application/hooks/tasks';
import type { CreateTaskFormData } from '@/application/schemas/task.schema';
import { es } from '@/shared/i18n/es';

export default function TasksScreen() {
  const insets = useSafeAreaInsets();

  // Selected date state
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    return new Date().toISOString().split('T')[0] || null;
  });

  // Sheet States
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<TaskEntity | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<TaskEntity | null>(null);
  const [isTypeSelectorVisible, setIsTypeSelectorVisible] = useState(false);
  const [activeFormType, setActiveFormType] = useState<TaskType | null>(null);
  const [isLegacyFormVisible, setIsLegacyFormVisible] = useState(false);

  // Toast Feedback State
  const [toast, setToast] = useState<{
    visible: boolean;
    type: ToastType;
    message: string;
  }>({
    visible: false,
    type: 'info',
    message: '',
  });

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ visible: true, type, message });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  // Build query filters (date only)
  const filterParams = useMemo<TaskFilterParams>(() => {
    const params: TaskFilterParams = {};
    if (selectedDate) {
      params.startDate = `${selectedDate}T00:00:00`;
      params.endDate = `${selectedDate}T23:59:59`;
    }
    return params;
  }, [selectedDate]);

  // Query and Mutation Hooks
  const { tasks, isLoading, isFetching, refetch } = useTasks(filterParams);
  const { createTask, isCreating } = useCreateTask();
  const { updateTask, isUpdating } = useUpdateTask();
  const { deleteTask, isDeleting } = useDeleteTask();
  const { toggleStatus } = useTaskStatusToggle();

  // Client-side date filter fallback
  const filteredTasks = useMemo(() => {
    if (!selectedDate) return tasks;
    return tasks.filter((task) => {
      if (task.dueDate) {
        const taskDate = task.dueDate.split('T')[0];
        return taskDate === selectedDate;
      }
      return false;
    });
  }, [tasks, selectedDate]);

  // Tasks count per date for calendar strip indicators
  const tasksCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      if (t.dueDate) {
        const d = t.dueDate.split('T')[0];
        if (d) {
          counts[d] = (counts[d] || 0) + 1;
        }
      }
    });
    return counts;
  }, [tasks]);

  // FAB / + Button opens Step 1: Type Selector
  const handleOpenCreateFlow = () => {
    setTaskToEdit(null);
    setIsTypeSelectorVisible(true);
  };

  // Step 1 -> Step 2: Open specific form sheet
  const handleSelectTypeFromSelector = (type: TaskType) => {
    setIsTypeSelectorVisible(false);
    setActiveFormType(type);
  };

  const handleOpenEditForm = (task: TaskEntity) => {
    setSelectedTaskForDetail(null);
    setTaskToEdit(task);
    setIsLegacyFormVisible(true);
  };

  const handleCreateTaskSubmit = async (formData: CreateTaskFormData) => {
    try {
      await createTask({
        title: formData.title,
        description: formData.description,
        type: formData.type || activeFormType || 'OPPORTUNITY',
        category: formData.category || formData.type || activeFormType || 'OPPORTUNITY',
        dueDate: formData.dueDate,
        customerId: formData.customerId,
        estimatedValue:
          formData.estimatedValue !== undefined && formData.estimatedValue !== null
            ? Number(formData.estimatedValue)
            : undefined,
        photoUrl: formData.photoUrl,
        latitude: formData.latitude,
        longitude: formData.longitude,
        orderId: formData.orderId,
        userId: formData.userId,
      });

      showToast(es.tasks.toasts.createdSuccess, 'success');
      setActiveFormType(null);
    } catch {
      showToast(es.tasks.toasts.errorSave, 'error');
    }
  };

  const handleLegacyFormSubmit = async (formData: CreateTaskFormData) => {
    try {
      if (taskToEdit) {
        await updateTask({
          id: taskToEdit.id,
          payload: {
            title: formData.title,
            description: formData.description,
            type: formData.type || (formData.category as TaskType),
            category: formData.category,
            dueDate: formData.dueDate,
            customerId: formData.customerId,
            estimatedValue:
              formData.estimatedValue !== undefined && formData.estimatedValue !== null
                ? Number(formData.estimatedValue)
                : undefined,
            photoUrl: formData.photoUrl,
            latitude: formData.latitude,
            longitude: formData.longitude,
            userId: formData.userId,
          },
        });
        showToast(es.tasks.toasts.updateSuccess, 'success');
      } else {
        await handleCreateTaskSubmit(formData);
      }
      setIsLegacyFormVisible(false);
      setTaskToEdit(null);
    } catch {
      showToast(es.tasks.toasts.errorSave, 'error');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
      showToast(es.tasks.toasts.deletedSuccess, 'success');
    } catch {
      showToast(es.tasks.toasts.errorDelete, 'error');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: TaskStatus) => {
    try {
      await toggleStatus({ id, currentStatus });
      const nextStatusMsg =
        currentStatus === 'COMPLETED'
          ? es.tasks.toasts.statusPending
          : es.tasks.toasts.statusCompleted;
      showToast(nextStatusMsg, 'success');
    } catch {
      showToast(es.tasks.toasts.errorToggle, 'error');
    }
  };

  const handleTaskUpdatedFromDetail = (updatedTask: TaskEntity) => {
    setSelectedTaskForDetail(updatedTask);
    showToast(es.tasks.toasts.statusUpdatedSuccess, 'success');
  };

  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: insets.top,
      }}
    >
      {/* Toast Feedback Notification */}
      <Toast
        visible={toast.visible}
        type={toast.type}
        message={toast.message}
        onDismiss={hideToast}
      />

      {/* Screen Header with Drawer Menu Button */}
      <ScreenHeader title={es.tasks.title} subtitle={es.tasks.subtitle} showMenuButton={true} />

      {/* Horizontal Calendar Strip (expandable) */}
      <TasksCalendarStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        tasksCountByDate={tasksCountByDate}
      />

      {/* Tasks Timeline List */}
      <TasksAgendaList
        tasks={filteredTasks}
        isLoading={isLoading}
        isRefreshing={isFetching}
        onRefresh={refetch}
        onTaskPress={setSelectedTaskForDetail}
        onToggleStatus={handleToggleStatus}
        onCreateTask={handleOpenCreateFlow}
      />

      {/* Task Detail Modal Sheet with Audit Timeline */}
      <TaskDetailSheet
        task={selectedTaskForDetail}
        visible={Boolean(selectedTaskForDetail)}
        onClose={() => setSelectedTaskForDetail(null)}
        onEdit={handleOpenEditForm}
        onDelete={handleDeleteTask}
        onTaskUpdated={handleTaskUpdatedFromDetail}
        isDeleting={isDeleting}
      />

      {/* Step 1: Type Selector Bottom Sheet */}
      <TaskTypeSelectorSheet
        visible={isTypeSelectorVisible}
        onClose={() => setIsTypeSelectorVisible(false)}
        onSelectType={handleSelectTypeFromSelector}
      />

      {/* Step 2A: Opportunity Form Sheet */}
      <OpportunityFormSheet
        visible={activeFormType === 'OPPORTUNITY'}
        onClose={() => setActiveFormType(null)}
        onSubmit={handleCreateTaskSubmit}
        isSubmitting={isCreating}
      />

      {/* Step 2B: Visit Form Sheet */}
      <VisitFormSheet
        visible={activeFormType === 'VISIT'}
        initialDate={selectedDate}
        onClose={() => setActiveFormType(null)}
        onSubmit={handleCreateTaskSubmit}
        isSubmitting={isCreating}
      />

      {/* Step 2C: Sale Form Sheet */}
      <SaleFormSheet
        visible={activeFormType === 'SALE'}
        onClose={() => setActiveFormType(null)}
        onSubmit={handleCreateTaskSubmit}
        isSubmitting={isCreating}
      />

      {/* Step 2D: Collection Form Sheet */}
      <CollectionFormSheet
        visible={activeFormType === 'COLLECTION'}
        initialDate={selectedDate}
        onClose={() => setActiveFormType(null)}
        onSubmit={handleCreateTaskSubmit}
        isSubmitting={isCreating}
      />

      {/* Legacy / Direct Edit Modal Form */}
      <TaskFormSheet
        visible={isLegacyFormVisible}
        taskToEdit={taskToEdit}
        initialDueDate={selectedDate}
        onClose={() => {
          setIsLegacyFormVisible(false);
          setTaskToEdit(null);
        }}
        onSubmit={handleLegacyFormSubmit}
        isSubmitting={isCreating || isUpdating}
      />
    </View>
  );
}
