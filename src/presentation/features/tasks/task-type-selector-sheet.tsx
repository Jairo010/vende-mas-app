import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { X, TrendingUp, MapPin, ShoppingCart, HandCoins, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import type { TaskType } from '@/core/types/task.types';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';

export interface TaskTypeSelectorSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: TaskType) => void;
}

interface TypeCardOption {
  type: TaskType;
  title: string;
  subtitle: string;
  icon: typeof TrendingUp;
  accentColor: string;
  bgTint: string;
  borderColor: string;
}

export function TaskTypeSelectorSheet({
  visible,
  onClose,
  onSelectType,
}: TaskTypeSelectorSheetProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  const options: TypeCardOption[] = [
    {
      type: 'OPPORTUNITY',
      title: es.tasks.selector.opportunityTitle,
      subtitle: es.tasks.selector.opportunityDesc,
      icon: TrendingUp,
      accentColor: '#8b5cf6',
      bgTint: scheme === 'dark' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.08)',
      borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    {
      type: 'VISIT',
      title: es.tasks.selector.visitTitle,
      subtitle: es.tasks.selector.visitDesc,
      icon: MapPin,
      accentColor: '#0ea5e9',
      bgTint: scheme === 'dark' ? 'rgba(14, 165, 233, 0.12)' : 'rgba(14, 165, 233, 0.08)',
      borderColor: 'rgba(14, 165, 233, 0.3)',
    },
    {
      type: 'SALE',
      title: es.tasks.selector.saleTitle,
      subtitle: es.tasks.selector.saleDesc,
      icon: ShoppingCart,
      accentColor: '#10b981',
      bgTint: scheme === 'dark' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    {
      type: 'COLLECTION',
      title: es.tasks.selector.collectionTitle,
      subtitle: es.tasks.selector.collectionDesc,
      icon: HandCoins,
      accentColor: '#f59e0b',
      bgTint: scheme === 'dark' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
    },
  ];

  const handleSelect = (type: TaskType) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSelectType(type);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end bg-black/60">
        <Pressable className="flex-1" onPress={onClose} />

        <View
          className="rounded-t-3xl border-t border-border bg-card px-5 pt-4 pb-8 max-h-[85%]"
          style={{ backgroundColor: scheme === 'dark' ? '#171717' : '#ffffff' }}
        >
          {/* Header indicator */}
          <View className="items-center mb-3">
            <View className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </View>

          {/* Header row */}
          <View className="flex-row items-center justify-between pb-3 border-b border-border">
            <View className="flex-1 pr-2">
              <Text className="text-lg font-bold text-foreground">{es.tasks.selector.title}</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                Selecciona la etapa para adaptar los campos requeridos
              </Text>
            </View>
            <Pressable
              testID="close-type-selector-btn"
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="p-2 rounded-full bg-muted"
            >
              <X size={18} color={activeColors.foreground} />
            </Pressable>
          </View>

          {/* Options list */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 12 }}
            className="gap-y-3"
          >
            {options.map((opt) => {
              const Icon = opt.icon;
              return (
                <Pressable
                  key={opt.type}
                  testID={`select-type-${opt.type.toLowerCase()}`}
                  onPress={() => handleSelect(opt.type)}
                  className="flex-row items-center p-4 rounded-2xl border"
                  style={({ pressed }) => [
                    {
                      backgroundColor: opt.bgTint,
                      borderColor: opt.borderColor,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <View
                    className="h-12 w-12 rounded-xl items-center justify-center mr-3.5"
                    style={{ backgroundColor: opt.accentColor }}
                  >
                    <Icon size={22} color="#ffffff" strokeWidth={2.2} />
                  </View>

                  <View className="flex-1 pr-2">
                    <Text className="text-base font-bold" style={{ color: opt.accentColor }}>
                      {opt.title}
                    </Text>
                    <Text className="text-xs text-muted-foreground mt-0.5 leading-4">
                      {opt.subtitle}
                    </Text>
                  </View>

                  <ChevronRight size={18} color={opt.accentColor} />
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
