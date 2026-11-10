import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthSession } from '@/application/hooks/auth/use-auth-session';
import { useCustomer } from '@/application/hooks/customers/use-customer';
import { useTeamSellers } from '@/application/hooks/team/use-team-sellers';
import { useRouteDays } from '@/application/hooks/route/use-route-days';
import { useScheduleVisit } from '@/application/hooks/visits/use-schedule-visit';
import {
  isRouteDay,
  nextRouteDayFrom,
  quickVisitDates,
  routeWeekdaysOf,
} from '@/application/route/route-days';
import { VISIT_TYPES, type VisitType } from '@/core/types/visit.types';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { notify } from '@/presentation/components/feedback/toast';
import { Button } from '@/presentation/components/ui/button';
import { StickyFooter } from '@/presentation/components/ui/sticky-footer';
import {
  CustomerStep,
  isSelectionAllowed,
  needsActivation,
  type CustomerSelection,
} from '@/presentation/features/visits/new-visit/customer-step';
import { ScheduleStep } from '@/presentation/features/visits/new-visit/schedule-step';
import { VisitTypeStep } from '@/presentation/features/visits/new-visit/visit-type-step';
import { WizardProgress } from '@/presentation/features/visits/new-visit/wizard-progress';
import { es } from '@/shared/i18n/es';
import { addDays, todayKey, toLocalTime, zonedInstant, type DateKey } from '@/shared/utils/date';
import { useVisitDraftStore } from '@/stores/visit-draft.store';

const STEP_TITLES = [
  es.newVisit.steps.type,
  es.newVisit.steps.customer,
  es.newVisit.steps.schedule,
];
const LAST_STEP = STEP_TITLES.length - 1;
const DEFAULT_TIME = '09:00';
const LAST_HOUR_OF_DAY = 22;

type NewVisitParams = {
  date?: string;
  customerId?: string;
  type?: string;
  parentVisitId?: string;
};

function parseType(value: string | undefined): VisitType | null {
  return VISIT_TYPES.find((type) => type === value) ?? null;
}

/** The requested day (agenda selection) when it is not in the past; otherwise today. */
function initialDate(requestedDate: string | undefined): DateKey {
  const today = todayKey();
  return requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) && requestedDate >= today
    ? requestedDate
    : today;
}

/** Time offered when the user adds one: today the next full hour, another day 09:00. */
function suggestedTime(date: DateKey): string {
  if (date !== todayKey()) return DEFAULT_TIME;
  const nextHour = Number(toLocalTime(new Date()).slice(0, 2)) + 1;
  if (nextHour > LAST_HOUR_OF_DAY) return DEFAULT_TIME;
  return `${String(nextHour).padStart(2, '0')}:00`;
}

/**
 * New visit wizard: type → customer (search, or a prospect created on the spot) → date,
 * optional time, seller and notes. A seller only picks the route days of the customer (API ADR
 * 0038). The next visit of a finished one opens on the date, one week ahead (app ADR 0015).
 */
export default function NewVisitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<NewVisitParams>();
  const { isAdmin, isSupervisor, isSeller } = useAuthSession();
  const canAssignSeller = isAdmin || isSupervisor;
  const isFollowUp = Boolean(params.parentVisitId);
  // Type and customer come from the finished visit: straight to the date.
  const firstStep = isFollowUp ? LAST_STEP : 0;

  const [step, setStep] = useState(firstStep);
  const [type, setType] = useState<VisitType | null>(() => parseType(params.type));
  const [selection, setSelection] = useState<CustomerSelection | null>(null);
  const [date, setDate] = useState<DateKey>(() => initialDate(params.date));
  // Until the seller picks one, the date follows the customer's route days.
  const [dateChosen, setDateChosen] = useState(false);
  // No time by default: the visit is planned for the day; the real start/end are recorded.
  const [time, setTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const { customer: presetCustomer } = useCustomer(params.customerId);
  const { sellers, isError: teamUnavailable } = useTeamSellers(canAssignSeller);
  const { scheduleVisit, isPending } = useScheduleVisit();
  const { routeDays } = useRouteDays();
  const clearFollowUp = useVisitDraftStore((state) => state.clearFollowUp);

  const today = todayKey();
  // The next visit is another day: today is the visit just finished.
  const minDate = isFollowUp ? addDays(today, 1) : today;
  const zoneId = selection?.kind === 'existing' ? selection.customer.zoneId : null;
  // Admins and supervisors plan the routes: only a seller is held to the days of theirs.
  const weekdays = useMemo(
    () => (isSeller ? routeWeekdaysOf(zoneId, routeDays) : []),
    [isSeller, zoneId, routeDays],
  );
  const quickDates = quickVisitDates(today, weekdays);
  const scheduledDate = dateChosen
    ? date
    : isFollowUp
      ? quickDates.WEEK
      : nextRouteDayFrom(date < minDate ? minDate : date, weekdays);
  const isDateEnabled =
    weekdays.length > 0 ? (day: DateKey) => isRouteDay(day, weekdays) : undefined;

  // Follow-up / visit from a customer: preselect it once it is read from the device.
  useEffect(() => {
    if (presetCustomer) {
      setSelection((current) => current ?? { kind: 'existing', customer: presetCustomer });
    }
  }, [presetCustomer]);

  const changeType = (next: VisitType) => {
    setType(next);
    // Orders and collections only for ACTIVE customers: drop a selection that no longer fits,
    // except a saved prospect, which the step offers to activate (a follow-up keeps its
    // customer; the step explains why it cannot continue).
    if (!isFollowUp) {
      setSelection((current) =>
        current && (isSelectionAllowed(next, current) || needsActivation(next, current))
          ? current
          : null,
      );
    }
  };

  const canContinue =
    step === 0
      ? type !== null
      : step === 1
        ? type !== null && isSelectionAllowed(type, selection)
        : selection !== null;

  const submit = async () => {
    if (!type || !selection) return;
    if (scheduledDate < minDate) {
      setScheduleError(es.newVisit.pastDayError);
      return;
    }
    if (!isRouteDay(scheduledDate, weekdays)) {
      setScheduleError(es.newVisit.notRouteDayError);
      return;
    }
    // Without a time the visit is stored at the local midnight of its day.
    const instant = zonedInstant(scheduledDate, time ?? '00:00');
    if (time !== null && instant.getTime() <= Date.now()) {
      setScheduleError(es.newVisit.pastDateError);
      return;
    }

    const visit = {
      type,
      scheduledAt: instant.toISOString(),
      hasScheduledTime: time !== null,
      notes: notes.trim() || undefined,
      sellerId: canAssignSeller ? (sellerId ?? undefined) : undefined,
      parentVisitId: params.parentVisitId,
    };

    try {
      if (selection.kind === 'existing') {
        await scheduleVisit({ visit: { ...visit, customerId: selection.customer.id } });
      } else {
        const { data, location } = selection.prospect;
        await scheduleVisit({
          visit,
          prospect: {
            tradeName: data.tradeName,
            contactName: data.contactName,
            phone: data.phone,
            addressReference: data.addressReference,
            latitude: location?.latitude,
            longitude: location?.longitude,
          },
        });
      }
      notify.success(es.visits.toasts.scheduled, es.visits.toasts.queued);
      // The finished visit no longer holds the seller (app ADR 0015): back to the agenda.
      if (isFollowUp && useVisitDraftStore.getState().pendingFollowUpId === params.parentVisitId) {
        clearFollowUp();
        router.dismissTo('/(app)/(tabs)/agenda');
        return;
      }
      router.back();
    } catch (error) {
      notify.error(error);
    }
  };

  const next = () => {
    if (step < LAST_STEP) setStep(step + 1);
    else void submit();
  };

  const back = () => (step > firstStep ? setStep(step - 1) : router.back());

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={isFollowUp ? es.newVisit.followUpTitle : es.newVisit.title}
        onBack={back}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <WizardProgress step={step} total={STEP_TITLES.length} title={STEP_TITLES[step]} />

          {step === 0 ? <VisitTypeStep value={type} onChange={changeType} /> : null}

          {step === 1 && type ? (
            <CustomerStep
              visitType={type}
              selection={selection}
              onChange={setSelection}
              locked={isFollowUp}
            />
          ) : null}

          {step === 2 ? (
            <ScheduleStep
              date={scheduledDate}
              minDate={minDate}
              quickDates={quickDates}
              isDateEnabled={isDateEnabled}
              time={time}
              suggestedTime={suggestedTime(scheduledDate)}
              notes={notes}
              onChangeDate={(value) => {
                setDate(value);
                setDateChosen(true);
                setScheduleError(null);
              }}
              onChangeTime={(value) => {
                setTime(value);
                setScheduleError(null);
              }}
              onChangeNotes={setNotes}
              error={scheduleError}
              canAssignSeller={canAssignSeller}
              sellers={sellers}
              sellerId={sellerId}
              onChangeSeller={setSellerId}
              teamUnavailable={teamUnavailable}
            />
          ) : null}
        </ScrollView>

        <StickyFooter>
          <View className="flex-row gap-2">
            {step > firstStep ? (
              <Button variant="outline" className="flex-1" onPress={back}>
                {es.common.back}
              </Button>
            ) : null}
            <Button
              testID="new-visit-next"
              className="flex-1"
              disabled={!canContinue}
              isLoading={isPending}
              onPress={next}
            >
              {step === LAST_STEP ? es.newVisit.submit : es.common.next}
            </Button>
          </View>
        </StickyFooter>
      </KeyboardAvoidingView>
    </View>
  );
}
