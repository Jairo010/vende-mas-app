import { Text, View } from 'react-native';
import { HandCoins } from 'lucide-react-native';
import type { CustomerBalance } from '@/core/types/collection.types';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { es } from '@/shared/i18n/es';
import { formatCurrency } from '@/shared/utils/format-currency';
import { useThemeColors } from '@/theme';

export interface CustomerBalanceCardProps {
  balance: CustomerBalance;
  onCollect?: () => void;
}

/** Customer's balance and overdue amount, with the shortcut to collect. */
export function CustomerBalanceCard({ balance, onCollect }: CustomerBalanceCardProps) {
  const colors = useThemeColors();
  const hasDebt = balance.balance > 0;

  return (
    <Card className="gap-3 p-4">
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="text-xs text-muted-foreground">{es.collections.balance}</Text>
          <Text className="text-xl font-bold text-foreground">
            {formatCurrency(balance.balance)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-muted-foreground">{es.collections.overdue}</Text>
          <Text
            className={`text-xl font-bold ${balance.overdue > 0 ? 'text-destructive' : 'text-success'}`}
          >
            {balance.overdue > 0 ? formatCurrency(balance.overdue) : es.collections.upToDate}
          </Text>
        </View>
      </View>
      {!hasDebt ? (
        <Text className="text-sm text-muted-foreground">{es.collections.noDebt}</Text>
      ) : null}
      {hasDebt && onCollect ? (
        <Button
          testID="customer-collect"
          leftIcon={<HandCoins size={16} color={colors.primaryForeground} />}
          onPress={onCollect}
        >
          {es.collections.register}
        </Button>
      ) : null}
    </Card>
  );
}
