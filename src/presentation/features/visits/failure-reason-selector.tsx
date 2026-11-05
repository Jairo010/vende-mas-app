import type { VisitFailureReason } from '@/core/types/visit.types';
import { es } from '@/shared/i18n/es';
import { ChoiceGroup } from './choice-group';

export interface FailureReasonSelectorProps {
  reasons: readonly VisitFailureReason[];
  value: VisitFailureReason | null;
  onChange: (reason: VisitFailureReason) => void;
  error?: string;
}

/** Why the visit failed, from the fixed list (only the reasons that apply to the situation). */
export function FailureReasonSelector({
  reasons,
  value,
  onChange,
  error,
}: FailureReasonSelectorProps) {
  return (
    <ChoiceGroup
      title={es.visits.failureReason.title}
      options={reasons}
      labelOf={(reason) => es.visits.failureReasons[reason]}
      value={value}
      onChange={onChange}
      testIdPrefix="visit-failure-reason"
      error={error}
    />
  );
}
