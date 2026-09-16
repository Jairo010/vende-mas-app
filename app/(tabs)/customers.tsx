import { Text, View } from 'react-native';
import { SafeAreaLayout } from '@/presentation/layouts/safe-area-layout';
import { t } from '@/shared/i18n';

export default function CustomersScreen() {
  return (
    <SafeAreaLayout>
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-xl font-semibold text-foreground">{t('tabs.customers')}</Text>
      </View>
    </SafeAreaLayout>
  );
}
