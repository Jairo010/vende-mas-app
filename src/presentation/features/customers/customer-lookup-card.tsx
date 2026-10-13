import { Text, View } from 'react-native';
import { CloudDownload } from 'lucide-react-native';
import { useCustomerLookup } from '@/application/hooks/customers/use-customer-lookup';
import { useSyncStatus } from '@/application/hooks/sync/use-sync-status';
import type { CustomerEntity } from '@/core/entities/customer.entity';
import { notify } from '@/presentation/components/feedback/toast';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

/** A cédula (10 digits) or RUC (13 digits), ignoring spaces and dashes. */
export function looksLikeIdentification(text: string): boolean {
  return /^(\d{10}|\d{13})$/.test(text.replace(/[\s-]/g, ''));
}

export interface CustomerLookupCardProps {
  identification: string;
  onFound: (customer: CustomerEntity) => void;
}

/**
 * Offered when a RUC / cédula is not on the device: asks the API, which also searches the
 * billing system, and saves the result locally.
 */
export function CustomerLookupCard({ identification, onFound }: CustomerLookupCardProps) {
  const colors = useThemeColors();
  const { isOnline } = useSyncStatus();
  const { lookupCustomer, isPending } = useCustomerLookup();

  const search = async () => {
    try {
      const { customer, source } = await lookupCustomer(identification.replace(/[\s-]/g, ''));
      notify.success(
        source === 'DEVICE'
          ? es.customers.lookup.foundOnDevice
          : source === 'BILLING'
            ? es.customers.lookup.imported
            : es.customers.lookup.found,
        customer.tradeName,
      );
      onFound(customer);
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <Card className="gap-3 p-4">
      <View>
        <Text className="text-base font-semibold text-foreground">{es.customers.lookup.title}</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          {isOnline ? es.customers.lookup.description : es.customers.lookup.offline}
        </Text>
      </View>
      <Button
        testID="customer-lookup-button"
        variant="secondary"
        disabled={!isOnline}
        isLoading={isPending}
        leftIcon={<CloudDownload size={16} color={colors.secondaryForeground} />}
        onPress={() => void search()}
      >
        {es.customers.lookup.action}
      </Button>
    </Card>
  );
}
