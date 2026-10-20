import type { CustomerEntity } from '@/core/entities/customer.entity';
import { Avatar } from '@/presentation/components/ui/avatar';
import { Badge } from '@/presentation/components/ui/badge';
import { ListItem } from '@/presentation/components/ui/list-item';
import { es } from '@/shared/i18n/es';

export interface CustomerListItemProps {
  customer: CustomerEntity;
  onPress?: (customer: CustomerEntity) => void;
}

export function CustomerListItem({ customer, onPress }: CustomerListItemProps) {
  return (
    <ListItem
      testID={`customer-item-${customer.id}`}
      title={customer.tradeName}
      subtitle={customer.businessName ?? customer.identification}
      caption={customer.address}
      leading={
        <Avatar
          name={customer.tradeName}
          imageUri={customer.storePhotoUrl ?? customer.storePhotoLocalUri}
          size="sm"
        />
      }
      trailing={
        <Badge
          size="sm"
          variant={customer.isProspect() ? 'warning' : 'success'}
          label={es.customers.statuses[customer.status]}
        />
      }
      onPress={onPress ? () => onPress(customer) : undefined}
    />
  );
}
