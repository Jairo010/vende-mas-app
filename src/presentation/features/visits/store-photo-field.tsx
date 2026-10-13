import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Camera, ImageOff } from 'lucide-react-native';
import { usePhotoSource } from '@/application/hooks/files/use-photo-source';
import { Button } from '@/presentation/components/ui/button';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

export interface StorePhotoFieldProps {
  /** Photo taken in this visit (durable local URI). */
  photoUri: string | null;
  /** The customer's current store photo (local or API path). */
  currentPhotoUrl: string | null;
  required: boolean;
  onTakePhoto: () => void;
  isCapturing?: boolean;
  error?: string;
}

const PREVIEW_HEIGHT = 180;

/** Store front photo of an opportunity visit: mandatory the first time, optional later. */
export function StorePhotoField({
  photoUri,
  currentPhotoUrl,
  required,
  onTakePhoto,
  isCapturing = false,
  error,
}: StorePhotoFieldProps) {
  const colors = useThemeColors();
  const shownUrl = photoUri ?? currentPhotoUrl;
  const source = usePhotoSource(shownUrl);

  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-base font-semibold text-foreground">{es.visits.fields.photo}</Text>
        {!photoUri && currentPhotoUrl ? (
          <Text className="text-xs text-muted-foreground">{es.visits.photo.current}</Text>
        ) : null}
      </View>
      <Text className={`mb-3 text-xs ${error ? 'text-destructive' : 'text-muted-foreground'}`}>
        {error ?? (required ? es.visits.photo.required : es.visits.photo.optional)}
      </Text>

      {source ? (
        <Image
          source={source}
          style={{ width: '100%', height: PREVIEW_HEIGHT, borderRadius: 16 }}
          contentFit="cover"
          accessibilityLabel={es.visits.fields.photo}
        />
      ) : (
        <View
          className={`items-center justify-center rounded-2xl border border-dashed bg-muted ${
            error ? 'border-destructive' : 'border-border'
          }`}
          style={{ height: PREVIEW_HEIGHT }}
        >
          <ImageOff size={28} color={colors.mutedForeground} />
        </View>
      )}

      <Button
        testID="visit-take-photo"
        className="mt-3"
        variant={photoUri ? 'outline' : 'secondary'}
        isLoading={isCapturing}
        leftIcon={
          <Camera size={16} color={photoUri ? colors.foreground : colors.secondaryForeground} />
        }
        onPress={onTakePhoto}
      >
        {photoUri ? es.visits.photo.retake : es.visits.photo.take}
      </Button>
    </View>
  );
}
