import { useMemo } from 'react';
import { Text, View } from 'react-native';
import {
  MAX_WEEKLY_INSTALLMENTS,
  MIN_WEEKLY_INSTALLMENTS,
  PAYMENT_PLAN_TYPES,
  type PaymentPlanType,
} from '@/core/types/collection.types';
import { buildSchedule } from '@/core/value-objects/payment-schedule';
import { DatePickerField } from '@/presentation/components/ui/date-time-picker-field';
import { SegmentedControl } from '@/presentation/components/ui/segmented-control';
import { Stepper } from '@/presentation/components/ui/stepper';
import { es } from '@/shared/i18n/es';
import { addDays, formatDate, todayKey, zonedInstant, type DateKey } from '@/shared/utils/date';
import { formatCurrency } from '@/shared/utils/format-currency';

const PLAN_OPTIONS = PAYMENT_PLAN_TYPES.map((value) => ({
  value,
  label: es.collections.plans[value],
}));

/** Local time used for due dates (the business day matters, not the hour). */
const DUE_TIME = '12:00';

export interface PaymentPlanValue {
  type: PaymentPlanType;
  installments: number;
  /** First (or only) due day. */
  firstDueDate: DateKey;
}

export interface PaymentPlanPickerProps {
  value: PaymentPlanValue;
  onChange: (value: PaymentPlanValue) => void;
  /** Order total, to preview each installment. */
  total: number;
}

/** Default plan: a single payment on the delivery day (or in a week). */
export function defaultPaymentPlan(deliveryDate: DateKey | null): PaymentPlanValue {
  return { type: 'SINGLE', installments: 1, firstDueDate: deliveryDate ?? addDays(todayKey(), 7) };
}

/** Converts the picker value into the order input (ISO instant for the first due date). */
export function toPaymentPlanInput(value: PaymentPlanValue) {
  return {
    type: value.type,
    ...(value.type === 'WEEKLY' && { installments: value.installments }),
    firstDueDate: zonedInstant(value.firstDueDate, DUE_TIME).toISOString(),
  };
}

/** Once or weekly, with the installments the customer will pay. */
export function PaymentPlanPicker({ value, onChange, total }: PaymentPlanPickerProps) {
  const schedule = useMemo(
    () =>
      buildSchedule(
        total,
        value.type,
        value.installments,
        zonedInstant(value.firstDueDate, DUE_TIME),
      ),
    [total, value],
  );

  return (
    <View className="gap-4">
      <Text className="text-base font-semibold text-foreground">{es.orders.paymentPlan.title}</Text>
      <SegmentedControl
        options={PLAN_OPTIONS}
        value={value.type}
        onChange={(type) =>
          onChange({
            ...value,
            type,
            installments: type === 'WEEKLY' ? Math.max(value.installments, 4) : 1,
          })
        }
      />
      <Text className="-mt-2 text-xs text-muted-foreground">
        {es.collections.planDescriptions[value.type]}
      </Text>

      {value.type === 'WEEKLY' ? (
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-foreground">
            {es.orders.paymentPlan.installments}
          </Text>
          <Stepper
            testID="order-plan-installments"
            value={value.installments}
            min={MIN_WEEKLY_INSTALLMENTS}
            max={MAX_WEEKLY_INSTALLMENTS}
            onChange={(installments) => onChange({ ...value, installments })}
          />
        </View>
      ) : null}

      <DatePickerField
        testID="order-plan-first-due"
        label={
          value.type === 'WEEKLY' ? es.orders.paymentPlan.firstDue : es.orders.paymentPlan.singleDue
        }
        value={value.firstDueDate}
        minDate={todayKey()}
        onChange={(firstDueDate) => onChange({ ...value, firstDueDate })}
      />

      <View className="gap-1.5 rounded-xl bg-muted p-3">
        <Text className="text-xs font-semibold uppercase text-muted-foreground">
          {es.orders.paymentPlan.schedule}
        </Text>
        {schedule.map((installment) => (
          <View key={installment.number} className="flex-row justify-between">
            <Text className="text-sm text-foreground">
              {es.collections.installment} {installment.number} · {formatDate(installment.dueDate)}
            </Text>
            <Text className="text-sm font-semibold text-foreground">
              {formatCurrency(installment.amount)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
