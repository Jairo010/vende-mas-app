import { Text, View } from 'react-native';
import { SafeAreaLayout } from '@/presentation/layouts/safe-area-layout';
import { t } from '@/shared/i18n';

export default function LoginScreen() {
  return (
    <SafeAreaLayout>
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-2xl font-bold text-foreground">{t('auth.welcomeBack')}</Text>
        <Text className="mt-2 text-center text-sm text-muted-foreground">
          {t('auth.loginSubtitle')}
        </Text>
      </View>
    </SafeAreaLayout>
  );
}
