import { Text, View } from 'react-native';
import { FileText } from 'lucide-react-native';
import { VisitEntity } from '@/core/entities/visit.entity';
import type { OrderEntity } from '@/core/entities/order.entity';
import type { PaymentEntity } from '@/core/entities/payment.entity';
import type { ReceivableEntity } from '@/core/entities/receivable.entity';
import type { VisitFailureReason, VisitOutcome } from '@/core/types/visit.types';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import type { VisitDraft } from '@/stores/visit-draft.store';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';
import { CollectionPanel } from '../collections/collection-panel';
import { FailureReasonSelector } from './failure-reason-selector';
import { OutcomeSelector } from './outcome-selector';
import { StorePhotoField } from './store-photo-field';
import { VisitOrdersCard } from './visit-orders-card';

const MAX_NOTES_LENGTH = 2000;

export interface VisitWorkErrors {
  outcome?: string;
  failureReason?: string;
  notes?: string;
  photo?: string;
}

export interface VisitWorkPanelProps {
  visit: VisitEntity;
  draft: VisitDraft;
  customerIsActive: boolean;
  /** Store photo the customer already has (local or API path). */
  currentStorePhotoUrl: string | null;
  photoRequired: boolean;
  orders: readonly OrderEntity[];
  errors: VisitWorkErrors;
  isCapturingPhoto: boolean;
  onChangeOutcome: (outcome: VisitOutcome) => void;
  onChangeFailureReason: (reason: VisitFailureReason) => void;
  onChangeNotes: (notes: string) => void;
  onTakePhoto: () => void;
  onCompleteBilling: () => void;
  onTakeOrder: () => void;
  /** Collection visits: register a payment (optionally for one document). */
  onCollect: (receivable?: ReceivableEntity) => void;
  onOpenPayment: (payment: PaymentEntity) => void;
}

/** Step 2 of a visit: what the seller does in the store, by visit type. */
export function VisitWorkPanel({
  visit,
  draft,
  customerIsActive,
  currentStorePhotoUrl,
  photoRequired,
  orders,
  errors,
  isCapturingPhoto,
  onChangeOutcome,
  onChangeFailureReason,
  onChangeNotes,
  onTakePhoto,
  onCompleteBilling,
  onTakeOrder,
  onCollect,
  onOpenPayment,
}: VisitWorkPanelProps) {
  const colors = useThemeColors();
  const closingSale =
    draft.outcome !== null && VisitEntity.outcomeRequiresActiveCustomer(draft.outcome);
  const failureReasons = draft.outcome ? VisitEntity.failureReasonsFor(draft.outcome) : null;

  return (
    <View className="gap-4">
      {visit.type === 'OPPORTUNITY' ? (
        <Card className="p-4">
          <StorePhotoField
            photoUri={draft.photoUri}
            currentPhotoUrl={currentStorePhotoUrl}
            required={photoRequired}
            onTakePhoto={onTakePhoto}
            isCapturing={isCapturingPhoto}
            error={errors.photo}
          />
        </Card>
      ) : null}

      {visit.type === 'COLLECTION' ? (
        <CollectionPanel
          customerId={visit.customerId}
          visitId={visit.id}
          onCollect={onCollect}
          onOpenPayment={onOpenPayment}
        />
      ) : null}

      {/* A collection is also a chance to sell: one stop for both jobs. */}
      {visit.type === 'ORDER' || visit.type === 'COLLECTION' ? (
        <VisitOrdersCard
          orders={orders}
          onTakeOrder={onTakeOrder}
          description={es.visits.order.description}
        />
      ) : null}

      <Card className="p-4">
        <OutcomeSelector
          outcomes={visit.allowedOutcomes()}
          value={draft.outcome}
          onChange={onChangeOutcome}
          error={errors.outcome}
        />
      </Card>

      {failureReasons ? (
        <Card className="p-4">
          <FailureReasonSelector
            reasons={failureReasons}
            value={draft.failureReason}
            onChange={onChangeFailureReason}
            error={errors.failureReason}
          />
        </Card>
      ) : null}

      {closingSale && !customerIsActive ? (
        <Card className="gap-3 border-warning/40 p-4">
          <Text className="text-base font-semibold text-foreground">
            {es.visits.sale.prospectTitle}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {es.visits.sale.prospectDescription}
          </Text>
          <Button
            testID="visit-complete-billing"
            leftIcon={<FileText size={16} color={colors.primaryForeground} />}
            onPress={onCompleteBilling}
          >
            {es.visits.actions.completeBilling}
          </Button>
        </Card>
      ) : null}

      {closingSale && customerIsActive && visit.type === 'OPPORTUNITY' ? (
        <VisitOrdersCard
          orders={orders}
          onTakeOrder={onTakeOrder}
          description={es.visits.sale.readyDescription}
        />
      ) : null}

      <Card className="p-4">
        <Input
          testID="visit-notes"
          label={es.visits.notesRequiredLabel}
          placeholder={es.visits.notesPlaceholder}
          error={errors.notes}
          value={draft.notes}
          onChangeText={onChangeNotes}
          maxLength={MAX_NOTES_LENGTH}
          multiline
          textAlignVertical="top"
          inputClassName="min-h-[96px]"
        />
      </Card>
    </View>
  );
}
