import { useState } from 'react';
import { Text, View } from 'react-native';
import { Search, UserPlus } from 'lucide-react-native';
import { useCustomers } from '@/application/hooks/customers/use-customers';
import type { CustomerEntity } from '@/core/entities/customer.entity';
import { VISIT_TYPES_REQUIRING_ACTIVE_CUSTOMER, type VisitType } from '@/core/types/visit.types';
import { AlertBanner } from '@/presentation/components/feedback/alert-banner';
import { Avatar } from '@/presentation/components/ui/avatar';
import { Badge } from '@/presentation/components/ui/badge';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { CustomerListItem } from '@/presentation/features/customers/customer-list-item';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';
import { QuickProspectForm, type QuickProspect } from './quick-prospect-form';

const SEARCH_LIMIT = 30;

export type CustomerSelection =
  { kind: 'existing'; customer: CustomerEntity } | { kind: 'prospect'; prospect: QuickProspect };

export interface CustomerStepProps {
  visitType: VisitType;
  selection: CustomerSelection | null;
  onChange: (selection: CustomerSelection | null) => void;
}

/** Whether a selection is valid for the visit type (orders and collections need ACTIVE). */
export function isSelectionAllowed(type: VisitType, selection: CustomerSelection | null): boolean {
  if (!selection) return false;
  if (!VISIT_TYPES_REQUIRING_ACTIVE_CUSTOMER.includes(type)) return true;
  return selection.kind === 'existing' && selection.customer.canTakeOrders();
}

function SelectedCustomer({
  selection,
  onChange,
}: {
  selection: CustomerSelection;
  onChange: () => void;
}) {
  const name =
    selection.kind === 'existing'
      ? selection.customer.tradeName
      : selection.prospect.data.tradeName;
  const caption =
    selection.kind === 'existing'
      ? (selection.customer.address ?? selection.customer.businessName)
      : (selection.prospect.data.addressReference ?? selection.prospect.data.contactName);

  return (
    <Card className="flex-row items-center p-4">
      <Avatar
        name={name}
        imageUri={
          selection.kind === 'existing'
            ? (selection.customer.storePhotoUrl ?? selection.customer.storePhotoLocalUri)
            : null
        }
        size="md"
      />
      <View className="ml-3 flex-1">
        <Text className="text-base font-semibold text-foreground" numberOfLines={1}>
          {name}
        </Text>
        {caption ? (
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {caption}
          </Text>
        ) : null}
        <Badge
          className="mt-1.5"
          size="sm"
          variant={
            selection.kind === 'prospect' || selection.customer.isProspect() ? 'warning' : 'success'
          }
          label={
            selection.kind === 'prospect'
              ? es.newVisit.prospectBadge
              : es.customers.statuses[selection.customer.status]
          }
        />
      </View>
      <Button testID="new-visit-change-customer" variant="ghost" size="sm" onPress={onChange}>
        {es.common.change}
      </Button>
    </Card>
  );
}

/** Step 2: search a customer or prospect, or create a prospect on the spot. */
export function CustomerStep({ visitType, selection, onChange }: CustomerStepProps) {
  const colors = useThemeColors();
  const [search, setSearch] = useState('');
  const [creatingProspect, setCreatingProspect] = useState(false);
  const [prospectDraft, setProspectDraft] = useState<QuickProspect | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const onlyActive = VISIT_TYPES_REQUIRING_ACTIVE_CUSTOMER.includes(visitType);
  const { customers, isLoading } = useCustomers({
    search: debouncedSearch,
    status: onlyActive ? 'ACTIVE' : undefined,
    limit: SEARCH_LIMIT,
  });

  if (selection) {
    return (
      <SelectedCustomer
        selection={selection}
        onChange={() => {
          if (selection.kind === 'prospect') {
            // Editing the prospect keeps what was typed.
            setProspectDraft(selection.prospect);
            setCreatingProspect(true);
          }
          onChange(null);
        }}
      />
    );
  }

  if (creatingProspect) {
    return (
      <QuickProspectForm
        initialValue={prospectDraft}
        onCancel={() => setCreatingProspect(false)}
        onSubmit={(prospect) => {
          setCreatingProspect(false);
          onChange({ kind: 'prospect', prospect });
        }}
      />
    );
  }

  return (
    <View className="gap-3">
      {onlyActive ? <AlertBanner variant="info" message={es.newVisit.onlyActiveHint} /> : null}

      <Input
        testID="new-visit-customer-search"
        value={search}
        onChangeText={setSearch}
        placeholder={es.newVisit.searchPlaceholder}
        leftIcon={<Search size={18} color={colors.mutedForeground} />}
        showClearButton
        onClear={() => setSearch('')}
        autoCorrect={false}
      />

      {!onlyActive ? (
        <Button
          testID="new-visit-new-prospect"
          variant="outline"
          leftIcon={<UserPlus size={16} color={colors.foreground} />}
          onPress={() => setCreatingProspect(true)}
        >
          {es.newVisit.newProspect}
        </Button>
      ) : null}

      <Card className="overflow-hidden p-0">
        {customers.length === 0 && !isLoading ? (
          <Text className="p-4 text-center text-sm text-muted-foreground">
            {es.newVisit.noCustomers}
          </Text>
        ) : (
          customers.map((customer, index) => (
            <View key={customer.id} className={index > 0 ? 'border-t border-border' : ''}>
              <CustomerListItem
                customer={customer}
                onPress={(picked) => onChange({ kind: 'existing', customer: picked })}
              />
            </View>
          ))
        )}
      </Card>
    </View>
  );
}
