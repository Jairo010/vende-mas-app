import { useEffect, useMemo, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Camera } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { usePhotoSource } from '@/application/hooks/files/use-photo-source';
import {
  createPaymentSchema,
  parseAmount,
  type PaymentFormData,
} from '@/application/schemas/payment.schema';
import { ReceivableEntity } from '@/core/entities/receivable.entity';
import {
  METHODS_REQUIRING_BANK,
  METHODS_REQUIRING_REFERENCE,
  PAYMENT_METHODS,
  type PaymentMethod,
} from '@/core/types/collection.types';
import { fromCents, toCents } from '@/core/value-objects/payment-schedule';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { Chip } from '@/presentation/components/ui/chip';
import { DatePickerField } from '@/presentation/components/ui/date-time-picker-field';
import { Input } from '@/presentation/components/ui/input';
import { es } from '@/shared/i18n/es';
import { formatCurrency } from '@/shared/utils/format-currency';
import { useThemeColors } from '@/theme';
import { PAYMENT_METHOD_VISUALS } from './payment-method-visuals';

const PHOTO_METHODS: readonly PaymentMethod[] = ['TRANSFER', 'DEPOSIT', 'CHECK'];
const PREVIEW_HEIGHT = 160;

export interface PaymentFormProps {
  receivables: readonly ReceivableEntity[];
  receivableId: string;
  onChangeReceivable: (id: string) => void;
  overdueOf: (receivable: ReceivableEntity) => number;
  photoUri: string | null;
  onTakePhoto: () => void;
  isCapturingPhoto: boolean;
  onSubmit: (data: PaymentFormData & { amountValue: number }) => Promise<void> | void;
  isSubmitting: boolean;
}

/**
 * Amount (with shortcuts: next installment, overdue, full balance), method and the data that
 * method needs, optional receipt photo. Never more than the document's balance.
 */
export function PaymentForm({
  receivables,
  receivableId,
  onChangeReceivable,
  overdueOf,
  photoUri,
  onTakePhoto,
  isCapturingPhoto,
  onSubmit,
  isSubmitting,
}: PaymentFormProps) {
  const colors = useThemeColors();
  const receivable = receivables.find((item) => item.id === receivableId) ?? null;
  const balanceRef = useRef(0);
  const balance = receivable?.balance ?? 0;
  useEffect(() => {
    // The schema reads the balance of the document selected when it validates.
    balanceRef.current = balance;
  }, [balance]);
  const schema = useMemo(() => createPaymentSchema(() => balanceRef.current), []);
  const photo = usePhotoSource(photoUri);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitted },
    trigger,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: '',
      method: 'CASH',
      reference: '',
      bankName: '',
      checkDate: null,
      notes: '',
    },
    mode: 'onTouched',
  });

  const method = watch('method');
  const amountText = watch('amount');
  const amount = parseAmount(amountText ?? '');
  const remaining =
    receivable && Number.isFinite(amount)
      ? fromCents(Math.max(0, toCents(receivable.balance) - toCents(amount)))
      : null;

  const quickAmounts = useMemo(() => {
    if (!receivable) return [];
    const next = receivable.nextInstallment();
    const overdue = overdueOf(receivable);
    const options = [
      ...(next
        ? [
            {
              key: 'installment',
              label: `${es.collections.form.quickInstallment} ${next.number}`,
              value: ReceivableEntity.remainingOf(next),
            },
          ]
        : []),
      ...(overdue > 0
        ? [{ key: 'overdue', label: es.collections.form.quickOverdue, value: overdue }]
        : []),
      { key: 'balance', label: es.collections.form.quickBalance, value: receivable.balance },
    ];
    // The same amount twice is noise (e.g. a single installment equal to the balance).
    return options.filter(
      (option, index) =>
        options.findIndex((other) => toCents(other.value) === toCents(option.value)) === index,
    );
  }, [receivable, overdueOf]);

  const setAmount = (value: number) => {
    Haptics.selectionAsync().catch(() => {});
    setValue('amount', value.toFixed(2), { shouldValidate: isSubmitted });
  };

  return (
    <View className="gap-4">
      {receivables.length > 1 ? (
        <Card className="gap-2 p-4">
          <Text className="text-sm font-medium text-foreground">
            {es.collections.form.document}
          </Text>
          {receivables.map((item) => {
            const selected = item.id === receivableId;
            const overdue = overdueOf(item);
            return (
              <Pressable
                key={item.id}
                testID={`payment-receivable-${item.id}`}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  onChangeReceivable(item.id);
                  if (isSubmitted) void trigger('amount');
                }}
                className={`flex-row items-center justify-between rounded-xl border px-3 py-2.5 ${
                  selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
                }`}
              >
                <View className="mr-2 flex-1">
                  <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                    {es.collections.sources[item.source]}{' '}
                    {item.documentNumber || es.collections.pendingNumber}
                  </Text>
                  {overdue > 0 ? (
                    <Text className="text-xs text-destructive">
                      {es.collections.overdue} {formatCurrency(overdue)}
                    </Text>
                  ) : null}
                </View>
                <Text className="text-sm font-bold text-foreground">
                  {formatCurrency(item.balance)}
                </Text>
              </Pressable>
            );
          })}
        </Card>
      ) : null}

      <Card className="gap-3 p-4">
        <Controller
          control={control}
          name="amount"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              testID="payment-amount"
              label={es.collections.form.amount}
              placeholder={es.collections.form.amountPlaceholder}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="decimal-pad"
              leftIcon={<Text className="text-base font-semibold text-muted-foreground">$</Text>}
              error={errors.amount?.message}
            />
          )}
        />
        <View className="flex-row flex-wrap gap-2">
          {quickAmounts.map((option) => (
            <Chip
              key={option.key}
              testID={`payment-quick-${option.key}`}
              label={`${option.label} · ${formatCurrency(option.value)}`}
              onPress={() => setAmount(option.value)}
            />
          ))}
        </View>
        {remaining !== null && receivable ? (
          <Text className="text-xs text-muted-foreground">
            {es.collections.form.remaining}: {formatCurrency(remaining)}
          </Text>
        ) : null}
      </Card>

      <Card className="gap-3 p-4">
        <Text className="text-sm font-medium text-foreground">{es.collections.form.method}</Text>
        <View className="flex-row flex-wrap gap-2">
          {PAYMENT_METHODS.map((option) => {
            const visual = PAYMENT_METHOD_VISUALS[option];
            const Icon = visual.icon;
            const selected = option === method;
            return (
              <Chip
                key={option}
                testID={`payment-method-${option}`}
                label={visual.label}
                selected={selected}
                icon={
                  <Icon size={14} color={selected ? colors.primaryForeground : colors.foreground} />
                }
                onPress={() => {
                  setValue('method', option);
                  if (option !== 'CHECK') setValue('checkDate', null);
                  if (isSubmitted) void trigger(['reference', 'bankName']);
                }}
              />
            );
          })}
        </View>

        {METHODS_REQUIRING_REFERENCE.includes(method) ? (
          <Controller
            control={control}
            name="reference"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                testID="payment-reference"
                label={
                  es.collections.form.reference[method as 'TRANSFER' | 'DEPOSIT' | 'CHECK' | 'CARD']
                }
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="characters"
                autoCorrect={false}
                error={errors.reference?.message}
              />
            )}
          />
        ) : null}

        {METHODS_REQUIRING_BANK.includes(method) ? (
          <Controller
            control={control}
            name="bankName"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                testID="payment-bank"
                label={es.collections.form.bank}
                placeholder={es.collections.form.bankPlaceholder}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="words"
                error={errors.bankName?.message}
              />
            )}
          />
        ) : null}

        {method === 'CHECK' ? (
          <Controller
            control={control}
            name="checkDate"
            render={({ field: { value, onChange } }) => (
              <View>
                <DatePickerField
                  testID="payment-check-date"
                  label={es.collections.form.checkDate}
                  value={value}
                  onChange={onChange}
                />
                <Text className="mt-1.5 text-xs text-muted-foreground">
                  {es.collections.form.checkDateHint}
                </Text>
              </View>
            )}
          />
        ) : null}
      </Card>

      {PHOTO_METHODS.includes(method) ? (
        <Card className="gap-3 p-4">
          <View>
            <Text className="text-sm font-medium text-foreground">{es.collections.form.photo}</Text>
            <Text className="mt-0.5 text-xs text-muted-foreground">
              {es.collections.form.photoHint}
            </Text>
          </View>
          {photo ? (
            <Image
              source={photo}
              style={{ width: '100%', height: PREVIEW_HEIGHT, borderRadius: 12 }}
              contentFit="cover"
              accessibilityLabel={es.collections.form.photo}
            />
          ) : null}
          <Button
            testID="payment-take-photo"
            variant="outline"
            isLoading={isCapturingPhoto}
            leftIcon={<Camera size={16} color={colors.foreground} />}
            onPress={onTakePhoto}
          >
            {photoUri ? es.collections.form.retakePhoto : es.collections.form.takePhoto}
          </Button>
        </Card>
      ) : null}

      <Card className="p-4">
        <Controller
          control={control}
          name="notes"
          render={({ field: { value, onChange, onBlur } }) => (
            <Input
              testID="payment-notes"
              label={`${es.collections.form.notes} (${es.common.optional.toLowerCase()})`}
              placeholder={es.collections.form.notesPlaceholder}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              textAlignVertical="top"
              inputClassName="min-h-[64px]"
              error={errors.notes?.message}
            />
          )}
        />
      </Card>

      <Button
        testID="payment-submit"
        size="lg"
        isLoading={isSubmitting}
        disabled={!receivable}
        onPress={handleSubmit((data) =>
          onSubmit({ ...data, amountValue: parseAmount(data.amount) }),
        )}
      >
        {es.collections.form.submit}
      </Button>
    </View>
  );
}
