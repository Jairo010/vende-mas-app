import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaLayout } from '@/presentation/layouts/safe-area-layout';
import { t } from '@/shared/i18n';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <SafeAreaLayout>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-xl font-bold text-foreground">{t('errors.notFound')}</Text>
          <Link href="/(tabs)" className="mt-4">
            <Text className="text-primary font-medium">{t('common.back')}</Text>
          </Link>
        </View>
      </SafeAreaLayout>
    </>
  );
}
