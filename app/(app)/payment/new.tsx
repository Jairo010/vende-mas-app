import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { HandCoins } from 'lucide-react-native';
import { useCollectionsSettings } from '@/application/hooks/collections/use-collections-settings';
import { useReceivables } from '@/application/hooks/collections/use-receivables';
import { useRegisterPayment } from '@/application/hooks/collections/use-register-payment';
import { useCustomer } from '@/application/hooks/customers/use-customer';
import { useStorePhotoCapture } from '@/application/hooks/device/use-store-photo-capture';
import { useVisit } from '@/application/hooks/visits/use-visit';
import type { PaymentFormData } from '@/application/schemas/payment.schema';
import type { ReceivableEntity } from '@/core/entities/receivable.entity';
import { fromCents, toCents } from '@/core/value-objects/payment-schedule';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { notify } from '@/presentation/components/feedback/toast';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { PaymentForm } from '@/presentation/features/collections/payment-form';
import { es } from '@/shared/i18n/es';
import { zonedInstant } from '@/shared/utils/date';
import { useVisitDraftStore } from '@/stores/visit-draft.store';
import { useThemeColors } from '@/theme';

type NewPaymentParams = {
  customerId: string;
  visitId?: string;
  receivableId?: string;
};

/** Local time stored for a check date (only the day matters). */
const CHECK_DATE_TIME = '12:00';

/**
 * Registers money collected from a customer (offline): choose the document, the amount and
 * the method. Inside a collection visit it also suggests the visit outcome.
 */
export default function NewPaymentScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams<NewPaymentParams>();
  const { customer } = useCustomer(params.customerId);
  const { visit } = useVisit(params.visitId);
  const { settings } = useCollectionsSettings();
  const filter = useMemo(
    () => ({ customerId: params.customerId, onlyOpen: true }),
    [params.customerId],
  );
  const { receivables, isLoading } = useReceivables(filter, Boolean(params.customerId));
  const { registerPayment, isPending } = useRegisterPayment();
  const photo = useStorePhotoCapture();
  const updateVisitDraft = useVisitDraftStore((state) => state.updateDraft);

  const [selectedId, setSelectedId] = useState<string | null>(params.receivableId ?? null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const photoRef = useRef<string | null>(null);
  const savedRef = useRef(false);

  const overdueOf = useCallback(
    (receivable: ReceivableEntity) =>
      receivable.overdueAmount(new Date(), settings.overdueGraceDays),
    [settings.overdueGraceDays],
  );

  // By default the oldest overdue document, otherwise the oldest open one.
  const receivableId =
    selectedId && receivables.some((item) => item.id === selectedId)
      ? selectedId
      : ((receivables.find((item) => overdueOf(item) > 0) ?? receivables[0])?.id ?? '');

  // A receipt photo that was never saved with a payment is deleted when leaving.
  const { discard } = photo;
  useEffect(() => {
    photoRef.current = photoUri;
  }, [photoUri]);
  useEffect(
    () => () => {
      if (!savedRef.current && photoRef.current) discard(photoRef.current);
    },
    [discard],
  );

  const takePhoto = async () => {
    try {
      const uri = await photo.capture();
      if (!uri) return;
      if (photoUri) photo.discard(photoUri);
      setPhotoUri(uri);
    } catch (error) {
      notify.error(error);
    }
  };

  /** Outcome of a collection visit from what is still overdue after this payment. */
  const suggestVisitOutcome = (amount: number) => {
    if (!visit || visit.type !== 'COLLECTION' || !visit.canComplete()) return;
    if (useVisitDraftStore.getState().drafts[visit.id]?.outcome) return;
    const selected = receivables.find((item) => item.id === receivableId);
    const overdueBefore = receivables.reduce((sum, item) => sum + toCents(overdueOf(item)), 0);
    const covered = Math.min(toCents(amount), selected ? toCents(overdueOf(selected)) : 0);
    updateVisitDraft(visit.id, {
      outcome: fromCents(overdueBefore - covered) <= 0 ? 'COLLECTED' : 'PARTIALLY_COLLECTED',
    });
  };

  const submit = async (data: PaymentFormData & { amountValue: number }) => {
    try {
      const payment = await registerPayment({
        receivableId,
        amount: data.amountValue,
        method: data.method,
        reference: data.reference || undefined,
        bankName: data.bankName || undefined,
        checkDate: data.checkDate
          ? zonedInstant(data.checkDate, CHECK_DATE_TIME).toISOString()
          : undefined,
        photoLocalUri: photoUri ?? undefined,
        notes: data.notes || undefined,
        visitId: params.visitId,
      });
      savedRef.current = true;
      suggestVisitOutcome(data.amountValue);
      notify.success(es.collections.registered, es.visits.toasts.queued);
      router.replace({ pathname: '/(app)/payment/[id]', params: { id: payment.id } });
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={es.collections.register}
        subtitle={customer?.tradeName}
        onBack={() => router.back()}
      />
      {isLoading ? (
        <View className="gap-3 p-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </View>
      ) : receivables.length === 0 ? (
        <EmptyState
          icon={<HandCoins size={32} color={colors.mutedForeground} />}
          title={es.collections.noDebt}
          description={es.collections.noReceivables}
        />
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            <PaymentForm
              receivables={receivables}
              receivableId={receivableId}
              onChangeReceivable={setSelectedId}
              overdueOf={overdueOf}
              photoUri={photoUri}
              onTakePhoto={() => void takePhoto()}
              isCapturingPhoto={photo.isCapturing}
              onSubmit={submit}
              isSubmitting={isPending}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
