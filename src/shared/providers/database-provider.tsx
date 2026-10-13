import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { DatabaseZap } from 'lucide-react-native';
import { getDatabase } from '@/infrastructure/database/database.client';
import migrations from '@/infrastructure/database/migrations/migrations';
import { EmptyState } from '@/presentation/components/ui/empty-state';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

interface DatabaseProviderProps {
  children: ReactNode;
}

/** Applies pending Drizzle migrations to the device database before rendering the app. */
export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const { success, error } = useMigrations(getDatabase(), migrations);
  const colors = useThemeColors();

  if (error) {
    return (
      <View testID="database-error" className="flex-1 items-center justify-center bg-background">
        <EmptyState
          icon={<DatabaseZap size={32} color={colors.destructive} />}
          title={es.errors.databaseTitle}
          description={`${es.errors.databaseDescription}\n(${error.message})`}
        />
      </View>
    );
  }

  if (!success) return <View className="flex-1 bg-background" />;

  return <>{children}</>;
}
