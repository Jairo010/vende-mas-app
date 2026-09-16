import { Text, View } from 'react-native';
import { SafeAreaLayout } from '@/presentation/layouts/safe-area-layout';
import { t } from '@/shared/i18n';

export default function ProfileScreen() {
  return (
    <SafeAreaLayout>
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-xl font-semibold text-foreground">{t('tabs.profile')}</Text>
      </View>
    </SafeAreaLayout>
  );
}
