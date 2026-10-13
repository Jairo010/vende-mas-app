import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CalendarClock,
  CalendarPlus,
  CalendarX,
  LogIn,
  LogOut,
  XCircle,
} from 'lucide-react-native';
import { useAuthSession } from '@/application/hooks/auth/use-auth-session';
import { useCustomer } from '@/application/hooks/customers/use-customer';
import { useStorePhotoCapture } from '@/application/hooks/device/use-store-photo-capture';
import { useOrders } from '@/application/hooks/orders/use-orders';
import { useCancelVisit } from '@/application/hooks/visits/use-cancel-visit';
import { useCheckInVisit } from '@/application/hooks/visits/use-check-in-visit';
import { useCheckOutVisit } from '@/application/hooks/visits/use-check-out-visit';
import { useRescheduleVisit } from '@/application/hooks/visits/use-reschedule-visit';
import { useVisit } from '@/application/hooks/visits/use-visit';
import { useVisitInProgress } from '@/application/hooks/visits/use-visit-in-progress';
import { VisitEntity } from '@/core/entities/visit.entity';
import { VisitAlreadyInProgressError } from '@/core/errors/visit.errors';
import type { VisitOutcome, VisitType } from '@/core/types/visit.types';
import { DetailRow } from '@/presentation/components/common/detail-row';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { AlertBanner } from '@/presentation/components/feedback/alert-banner';
import { notify } from '@/presentation/components/feedback/toast';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { StickyFooter } from '@/presentation/components/ui/sticky-footer';
import { CancelVisitSheet } from '@/presentation/features/visits/cancel-visit-sheet';
import { CheckpointCard } from '@/presentation/features/visits/checkpoint-card';
import { RescheduleVisitSheet } from '@/presentation/features/visits/reschedule-visit-sheet';
import { VisitHeaderCard } from '@/presentation/features/visits/visit-header-card';
import { VisitOrdersCard } from '@/presentation/features/visits/visit-orders-card';
import { VisitSteps } from '@/presentation/features/visits/visit-steps';
import {
  VisitWorkPanel,
  type VisitWorkErrors,
} from '@/presentation/features/visits/visit-work-panel';
import { useNow } from '@/shared/hooks/use-now';
import { es } from '@/shared/i18n/es';
import { EMPTY_VISIT_DRAFT, useVisitDraftStore } from '@/stores/visit-draft.store';
import { useThemeColors } from '@/theme';

type OpenSheet = 'reschedule' | 'cancel' | null;

/** Type of the follow-up visit: after closing a sale the next visit takes the order. */
function followUpType(visit: VisitEntity): VisitType {
  return visit.outcome === 'SALE_CLOSED' ? 'ORDER' : visit.type;
}

/**
 * The visit, step by step: check-in (GPS) → work by type (photo, outcome, order, notes) →
 * check-out (GPS) → schedule the next one. Everything is written locally (offline-first).
 */
export default function VisitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const now = useNow();
  const { user, isAdmin, isSupervisor } = useAuthSession();

  const { visit, isLoading } = useVisit(id);
  const { customer } = useCustomer(visit?.customerId);
  const { visit: inProgress } = useVisitInProgress();
  const ordersFilter = useMemo(() => ({ visitId: id }), [id]);
  const { orders } = useOrders(ordersFilter);

  const storedDraft = useVisitDraftStore((state) => (id ? state.drafts[id] : undefined));
  const draft = storedDraft ?? EMPTY_VISIT_DRAFT;
  const updateDraft = useVisitDraftStore((state) => state.updateDraft);
  const clearDraft = useVisitDraftStore((state) => state.clearDraft);

  const { checkIn, isPending: isCheckingIn, isLocating: isLocatingIn } = useCheckInVisit();
  const { checkOut, isPending: isCheckingOut, isLocating: isLocatingOut } = useCheckOutVisit();
  const { rescheduleVisit, isPending: isRescheduling } = useRescheduleVisit();
  const { cancelVisit, isPending: isCancelling } = useCancelVisit();
  const photo = useStorePhotoCapture();

  const [openSheet, setOpenSheet] = useState<OpenSheet>(null);
  const [showErrors, setShowErrors] = useState(false);

  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace('/(app)/(tabs)/agenda');

  if (isLoading || !visit) {
    return (
      <View className="flex-1 bg-background">
        <ScreenHeader title={es.visits.detailTitle} onBack={goBack} />
        {isLoading ? (
          <View className="gap-3 p-4">
            <Skeleton className="h-40" />
            <Skeleton className="h-24" />
            <Skeleton className="h-48" />
          </View>
        ) : (
          <EmptyState
            icon={<CalendarX size={32} color={colors.mutedForeground} />}
            title={es.visits.notFound}
          />
        )}
      </View>
    );
  }

  const isMine = visit.isAssignedTo(user?.id);
  const canManage = isMine || isAdmin || isSupervisor;
  const customerIsActive = (customer?.status ?? visit.customer?.status) === 'ACTIVE';
  const currentStorePhotoUrl =
    customer?.storePhotoUrl ??
    customer?.storePhotoLocalUri ??
    visit.customer?.storePhotoUrl ??
    null;
  const photoRequired = visit.needsStorePhoto(Boolean(currentStorePhotoUrl));

  const errors: VisitWorkErrors = {};
  if (!draft.outcome) errors.outcome = es.visits.validation.outcomeRequired;
  if (visit.type === 'OPPORTUNITY' && photoRequired && !draft.photoUri) {
    errors.photo = es.visits.validation.photoRequired;
  }
  const billingMissing =
    draft.outcome !== null &&
    VisitEntity.outcomeRequiresActiveCustomer(draft.outcome) &&
    !customerIsActive;

  const openBilling = () =>
    router.push({ pathname: '/(app)/customer/[id]/billing', params: { id: visit.customerId } });

  const openOrder = () =>
    router.push({
      pathname: '/(app)/order/new',
      params: { visitId: visit.id, customerId: visit.customerId },
    });

  const collect = (receivable?: { id: string }) =>
    router.push({
      pathname: '/(app)/payment/new',
      params: {
        customerId: visit.customerId,
        visitId: visit.id,
        ...(receivable && { receivableId: receivable.id }),
      },
    });

  const openPayment = (payment: { id: string }) =>
    router.push({ pathname: '/(app)/payment/[id]', params: { id: payment.id } });

  const scheduleNext = () =>
    router.push({
      pathname: '/(app)/visit/new',
      params: {
        customerId: visit.customerId,
        type: followUpType(visit),
        parentVisitId: visit.id,
      },
    });

  const start = async () => {
    if (inProgress && inProgress.id !== visit.id) {
      notify.error(new VisitAlreadyInProgressError(inProgress.id));
      return;
    }
    try {
      const { reading } = await checkIn(visit.id);
      if (reading.ok) notify.success(es.visits.toasts.started);
      else notify.warning(es.visits.toasts.started, es.visits.gps.failures[reading.reason]);
    } catch (error) {
      notify.error(error);
    }
  };

  const finish = async () => {
    setShowErrors(true);
    if (!draft.outcome || errors.photo) return;
    if (billingMissing) {
      notify.warning(es.visits.validation.billingRequired);
      return;
    }
    try {
      const { reading } = await checkOut(visit.id, {
        outcome: draft.outcome,
        notes: draft.notes.trim() || undefined,
        photoLocalUri: draft.photoUri ?? undefined,
      });
      clearDraft(visit.id);
      setShowErrors(false);
      if (reading.ok) notify.success(es.visits.toasts.completed, es.visits.toasts.queued);
      else notify.warning(es.visits.toasts.completed, es.visits.gps.failures[reading.reason]);
    } catch (error) {
      notify.error(error);
    }
  };

  const takePhoto = async () => {
    try {
      const uri = await photo.capture();
      if (!uri) return;
      if (draft.photoUri) photo.discard(draft.photoUri);
      updateDraft(visit.id, { photoUri: uri });
    } catch (error) {
      notify.error(error);
    }
  };

  const reschedule = async (scheduledAt: string) => {
    try {
      await rescheduleVisit({ id: visit.id, scheduledAt });
      setOpenSheet(null);
      notify.success(es.visits.toasts.rescheduled);
    } catch (error) {
      notify.error(error);
    }
  };

  const cancel = async (reason: string | undefined) => {
    try {
      await cancelVisit({ id: visit.id, reason });
      if (draft.photoUri) photo.discard(draft.photoUri);
      clearDraft(visit.id);
      setOpenSheet(null);
      notify.success(es.visits.toasts.cancelled);
    } catch (error) {
      notify.error(error);
    }
  };

  const footer = (() => {
    if (!isMine) return null;
    if (visit.canStart()) {
      return (
        <Button
          testID="visit-start"
          size="lg"
          isLoading={isCheckingIn}
          leftIcon={<LogIn size={18} color={colors.primaryForeground} />}
          onPress={() => void start()}
        >
          {isLocatingIn ? es.visits.gps.capturing : es.visits.actions.start}
        </Button>
      );
    }
    if (visit.canComplete()) {
      return (
        <Button
          testID="visit-finish"
          size="lg"
          isLoading={isCheckingOut}
          leftIcon={<LogOut size={18} color={colors.primaryForeground} />}
          onPress={() => void finish()}
        >
          {isLocatingOut ? es.visits.gps.capturing : es.visits.actions.finish}
        </Button>
      );
    }
    return null;
  })();

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={es.visits.detailTitle}
        subtitle={visit.customer?.tradeName}
        onBack={goBack}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {visit.status !== 'CANCELLED' ? (
            <Card className="px-4 py-3">
              <VisitSteps status={visit.status} />
            </Card>
          ) : null}

          <VisitHeaderCard visit={visit} showSeller={!isMine} />

          {!isMine && !visit.isClosed() ? (
            <AlertBanner variant="info" message={es.visits.readOnly} />
          ) : null}

          {visit.status === 'SCHEDULED' && visit.notes ? (
            <Card className="p-4">
              <Text className="mb-1 text-sm text-muted-foreground">{es.visits.fields.notes}</Text>
              <Text className="text-sm text-foreground">{visit.notes}</Text>
            </Card>
          ) : null}

          {visit.start ? (
            <CheckpointCard
              kind="checkIn"
              checkpoint={visit.start}
              distanceToCustomerMeters={visit.distanceToCustomerMeters}
              minutes={visit.status === 'IN_PROGRESS' ? visit.elapsedMinutes(now) : null}
            />
          ) : null}

          {visit.status === 'IN_PROGRESS' && isMine ? (
            <VisitWorkPanel
              visit={visit}
              draft={draft}
              customerIsActive={customerIsActive}
              currentStorePhotoUrl={currentStorePhotoUrl}
              photoRequired={photoRequired}
              orders={orders}
              errors={showErrors ? errors : {}}
              isCapturingPhoto={photo.isCapturing}
              onChangeOutcome={(outcome: VisitOutcome) => updateDraft(visit.id, { outcome })}
              onChangeNotes={(notes) => updateDraft(visit.id, { notes })}
              onTakePhoto={() => void takePhoto()}
              onCompleteBilling={openBilling}
              onTakeOrder={openOrder}
              onCollect={collect}
              onOpenPayment={openPayment}
            />
          ) : null}

          {visit.end ? (
            <CheckpointCard
              kind="checkOut"
              checkpoint={visit.end}
              minutes={visit.durationMinutes}
            />
          ) : null}

          {visit.status === 'COMPLETED' ? (
            <Card className="px-4 py-2">
              <DetailRow
                label={es.visits.fields.outcome}
                value={visit.outcome ? es.visits.outcomes[visit.outcome] : null}
              />
              <DetailRow label={es.visits.fields.notes} value={visit.notes} isLast />
            </Card>
          ) : null}

          {visit.status === 'COMPLETED' && orders.length > 0 ? (
            <VisitOrdersCard orders={orders} />
          ) : null}

          {visit.status === 'CANCELLED' ? (
            <AlertBanner
              variant="warning"
              title={es.visits.statuses.CANCELLED}
              message={
                visit.cancellationReason
                  ? `${es.visits.fields.cancellationReason}: ${visit.cancellationReason}`
                  : es.visits.toasts.cancelled
              }
            />
          ) : null}

          {visit.isClosed() && canManage ? (
            <Card className="gap-3 p-4">
              <View>
                <Text className="text-base font-semibold text-foreground">
                  {es.visits.followUp.title}
                </Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                  {es.visits.followUp.description}
                </Text>
              </View>
              <Button
                testID="visit-schedule-next"
                variant="secondary"
                leftIcon={<CalendarPlus size={16} color={colors.secondaryForeground} />}
                onPress={scheduleNext}
              >
                {es.visits.actions.scheduleNext}
              </Button>
            </Card>
          ) : null}

          {!visit.isClosed() && canManage ? (
            <View className="gap-2">
              {visit.canReschedule() ? (
                <Button
                  testID="visit-reschedule"
                  variant="outline"
                  leftIcon={<CalendarClock size={16} color={colors.foreground} />}
                  onPress={() => setOpenSheet('reschedule')}
                >
                  {es.visits.actions.reschedule}
                </Button>
              ) : null}
              <Button
                testID="visit-cancel"
                variant="ghost"
                leftIcon={<XCircle size={16} color={colors.destructive} />}
                textClassName="text-destructive"
                onPress={() => setOpenSheet('cancel')}
              >
                {es.visits.actions.cancel}
              </Button>
            </View>
          ) : null}
        </ScrollView>

        {footer ? <StickyFooter>{footer}</StickyFooter> : null}
      </KeyboardAvoidingView>

      <RescheduleVisitSheet
        visit={visit}
        open={openSheet === 'reschedule'}
        onClose={() => setOpenSheet(null)}
        onConfirm={reschedule}
        isSubmitting={isRescheduling}
      />
      <CancelVisitSheet
        open={openSheet === 'cancel'}
        onClose={() => setOpenSheet(null)}
        onConfirm={cancel}
        isSubmitting={isCancelling}
      />
    </View>
  );
}
