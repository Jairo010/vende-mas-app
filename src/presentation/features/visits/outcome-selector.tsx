import type { VisitOutcome } from '@/core/types/visit.types';
import { es } from '@/shared/i18n/es';
import { ChoiceGroup } from './choice-group';

export interface OutcomeSelectorProps {
  outcomes: readonly VisitOutcome[];
  value: VisitOutcome | null;
  onChange: (outcome: VisitOutcome) => void;
  error?: string;
}

/** Outcome of the visit (only the ones that apply to its type). */
export function OutcomeSelector({ outcomes, value, onChange, error }: OutcomeSelectorProps) {
  return (
    <ChoiceGroup
      title={es.visits.outcome.title}
      options={outcomes}
      labelOf={(outcome) => es.visits.outcomes[outcome]}
      value={value}
      onChange={onChange}
      testIdPrefix="visit-outcome"
      error={error}
    />
  );
}
