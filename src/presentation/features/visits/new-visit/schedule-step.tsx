import { ScrollView, Text, View } from 'react-native';
import { QUICK_VISIT_DATES, type QuickVisitDate } from '@/application/route/route-days';
import type { TeamMember } from '@/core/types/team.types';
import { AlertBanner } from '@/presentation/components/feedback/alert-banner';
import { Chip } from '@/presentation/components/ui/chip';
import { DatePickerField } from '@/presentation/components/ui/date-time-picker-field';
import { Input } from '@/presentation/components/ui/input';
import { es } from '@/shared/i18n/es';
import { formatShortDay, type DateKey } from '@/shared/utils/date';
import { OptionalTimeField } from '../optional-time-field';

const MAX_NOTES_LENGTH = 1000;

export interface ScheduleStepProps {
  date: DateKey;
  /** First day that can be chosen. */
  minDate: DateKey;
  /** In one week, two weeks or a month, already on route days (app ADR 0015). */
  quickDates: Readonly<Record<QuickVisitDate, DateKey>>;
  /** The customer's route days only; undefined: any day. */
  isDateEnabled?: (date: DateKey) => boolean;
  /** `null` = no agreed time (the visit is planned for the day). */
  time: string | null;
  /** Offered when the user adds a time. */
  suggestedTime: string;
  notes: string;
  onChangeDate: (date: DateKey) => void;
  onChangeTime: (time: string | null) => void;
  onChangeNotes: (notes: string) => void;
  error?: string | null;
  /** Supervisors pick the seller; `null` = the current user. */
  canAssignSeller: boolean;
  sellers: readonly TeamMember[];
  sellerId: string | null;
  onChangeSeller: (sellerId: string | null) => void;
  teamUnavailable: boolean;
}

/** Step 3: local date, optional time, assigned seller (supervisors) and notes. */
export function ScheduleStep({
  date,
  minDate,
  quickDates,
  isDateEnabled,
  time,
  suggestedTime,
  notes,
  onChangeDate,
  onChangeTime,
  onChangeNotes,
  error,
  canAssignSeller,
  sellers,
  sellerId,
  onChangeSeller,
  teamUnavailable,
}: ScheduleStepProps) {
  return (
    <View className="gap-4">
      <View className="gap-2">
        <View className="flex-row flex-wrap gap-2">
          {QUICK_VISIT_DATES.map((key) => (
            <Chip
              key={key}
              testID={`new-visit-quick-${key}`}
              label={es.newVisit.quickDate(
                es.newVisit.quickDates[key],
                formatShortDay(quickDates[key]),
              )}
              selected={date === quickDates[key]}
              onPress={() => onChangeDate(quickDates[key])}
            />
          ))}
        </View>
        <DatePickerField
          testID="new-visit-date"
          label={es.newVisit.date}
          value={date}
          minDate={minDate}
          isDateEnabled={isDateEnabled}
          onChange={onChangeDate}
        />
        {isDateEnabled ? (
          <Text className="text-xs text-muted-foreground">{es.newVisit.routeDaysHint}</Text>
        ) : null}
      </View>
      <OptionalTimeField
        testID="new-visit-time"
        value={time}
        suggestedTime={suggestedTime}
        onChange={onChangeTime}
        error={error}
      />

      {canAssignSeller ? (
        <View>
          <Text className="mb-2 text-sm font-medium text-foreground">{es.newVisit.seller}</Text>
          {teamUnavailable ? (
            <AlertBanner variant="warning" message={es.newVisit.teamUnavailable} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                <Chip
                  testID="new-visit-seller-me"
                  label={es.newVisit.me}
                  selected={sellerId === null}
                  onPress={() => onChangeSeller(null)}
                />
                {sellers.map((seller) => (
                  <Chip
                    key={seller.id}
                    testID={`new-visit-seller-${seller.id}`}
                    label={seller.name}
                    selected={sellerId === seller.id}
                    onPress={() => onChangeSeller(seller.id)}
                  />
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      ) : null}

      <Input
        testID="new-visit-notes"
        label={`${es.newVisit.notes} (${es.common.optional.toLowerCase()})`}
        placeholder={es.newVisit.notesPlaceholder}
        value={notes}
        onChangeText={onChangeNotes}
        maxLength={MAX_NOTES_LENGTH}
        multiline
        textAlignVertical="top"
        inputClassName="min-h-[88px]"
      />
    </View>
  );
}
