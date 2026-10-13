import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { UserX } from 'lucide-react-native';
import { useCustomer } from '@/application/hooks/customers/use-customer';
import { usePromoteCustomer } from '@/application/hooks/customers/use-promote-customer';
import type { PromoteCustomerFormData } from '@/application/schemas/customer.schema';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { AlertBanner } from '@/presentation/components/feedback/alert-banner';
import { notify } from '@/presentation/components/feedback/toast';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { BillingDataForm } from '@/presentation/features/customers/billing-data-form';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

/** Billing data of a prospect (PROSPECT → ACTIVE). Opened from the visit or the customer. */
export default function CustomerBillingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const { customer, isLoading } = useCustomer(id);
  const { promoteCustomer, isPending } = usePromoteCustomer();

  const submit = async (data: PromoteCustomerFormData) => {
    if (!customer) return;
    try {
      await promoteCustomer({ id: customer.id, ...data });
      notify.success(es.customers.billing.promoted, es.visits.toasts.queued);
      router.back();
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={es.customers.billing.title}
        subtitle={customer?.tradeName}
        onBack={() => router.back()}
      />
      {isLoading ? (
        <View className="gap-3 p-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-72" />
        </View>
      ) : !customer ? (
        <EmptyState
          icon={<UserX size={32} color={colors.mutedForeground} />}
          title={es.customers.notFound}
        />
      ) : (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            {customer.isProspect() ? (
              <>
                <Text className="text-sm leading-5 text-muted-foreground">
                  {es.customers.billing.description}
                </Text>
                <BillingDataForm customer={customer} onSubmit={submit} isSubmitting={isPending} />
              </>
            ) : (
              <AlertBanner variant="success" message={es.customers.billing.alreadyActive} />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
