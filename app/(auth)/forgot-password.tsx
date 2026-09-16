import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, KeyRound } from 'lucide-react-native';
import { AuthLayout } from '@/presentation/layouts/auth-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  return (
    <AuthLayout>
      <View className="items-center justify-center mb-8">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 shadow-sm">
          <KeyRound size={32} color={activeColors.primary} strokeWidth={2.5} />
        </View>
        <Text className="text-2xl font-bold tracking-tight text-foreground text-center">
          Recuperar Contraseña
        </Text>
        <Text className="mt-2 text-center text-sm text-muted-foreground max-w-xs leading-5">
          Comunícate con el administrador del sistema para restablecer tus credenciales de acceso.
        </Text>
      </View>

      <Card className="rounded-3xl border border-border bg-card p-6 shadow-md items-center">
        <Text className="text-sm text-center text-muted-foreground mb-6 leading-5">
          Por motivos de seguridad institucional, el restablecimiento de contraseñas para vendedores
          y administradores se gestiona de forma centralizada.
        </Text>

        <Button
          variant="outline"
          leftIcon={<ArrowLeft size={18} color={activeColors.foreground} />}
          onPress={() => router.back()}
          className="w-full"
        >
          Volver a Iniciar Sesión
        </Button>
      </Card>
    </AuthLayout>
  );
}
