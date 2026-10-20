import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { usePhotoSource } from '@/application/hooks/files/use-photo-source';

export interface AvatarProps {
  name: string;
  /** Local `file://` URI or API photo path (`/api/v1/files/photos/...`). */
  imageUri?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { box: 'h-9 w-9 rounded-xl', text: 'text-sm', px: 36 },
  md: { box: 'h-12 w-12 rounded-2xl', text: 'text-base', px: 48 },
  lg: { box: 'h-20 w-20 rounded-3xl', text: 'text-3xl', px: 80 },
} as const;

/** First letters of the first two words: "Lubricadora El Pana" → "LE". */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.slice(0, 2).map((word) => word.charAt(0).toUpperCase());
  return letters.join('') || '?';
}

export function Avatar({ name, imageUri, size = 'md', className = '' }: AvatarProps) {
  const config = SIZES[size];
  const source = usePhotoSource(imageUri);

  if (source) {
    return (
      <Image
        source={source}
        style={{ width: config.px, height: config.px, borderRadius: config.px / 3.5 }}
        contentFit="cover"
        accessibilityLabel={name}
      />
    );
  }

  return (
    <View className={`items-center justify-center bg-primary/10 ${config.box} ${className}`}>
      <Text className={`font-bold text-primary ${config.text}`}>{initialsOf(name)}</Text>
    </View>
  );
}
