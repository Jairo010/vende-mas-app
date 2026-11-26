import { useMemo, useState, useEffect } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Button } from './button';
import { formatMonthTitle, MonthGrid } from './month-grid';
import { useThemeColorWithAlpha, useThemeColors } from '@/theme';

export interface DatePickerModalProps {
  visible: boolean;
  initialDate?: string | null;
  minDate?: string | null;
  /** Days that can be picked; the others stay visible but disabled (e.g. off the route). */
  isDateEnabled?: (date: string) => boolean;
  title?: string;
  onConfirm: (date: string) => void;
  onClose: () => void;
}

const formatToIso = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function DatePickerModal({
  visible,
  initialDate,
  minDate,
  isDateEnabled,
  title = 'Seleccionar Fecha',
  onConfirm,
  onClose,
}: DatePickerModalProps) {
  const primaryTintStrong = useThemeColorWithAlpha('primary', 0.18);
  const activeColors = useThemeColors();

  const todayIso = useMemo(() => formatToIso(new Date()), []);

  // Current selected date (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return initialDate || todayIso;
  });

  // Calendar viewport (year & month, 0-indexed month)
  const [viewYear, setViewYear] = useState<number>(() => {
    if (initialDate) {
      const parts = initialDate.split('-').map(Number);
      if (parts[0] && !isNaN(parts[0])) return parts[0];
    }
    return new Date().getFullYear();
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (initialDate) {
      const parts = initialDate.split('-').map(Number);
      if (parts[1] && !isNaN(parts[1])) return parts[1] - 1;
    }
    return new Date().getMonth();
  });

  // Sync state on open
  useEffect(() => {
    if (visible) {
      const target = initialDate || todayIso;
      setSelectedDate(target);
      const parts = target.split('-').map(Number);
      if (parts[0] && parts[1]) {
        setViewYear(parts[0]);
        setViewMonth(parts[1] - 1);
      }
    }
  }, [visible, initialDate, todayIso]);

  const handlePrevMonth = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Quick preset handlers
  const handleQuickPreset = (offsetDays: number) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const iso = formatToIso(target);
    setSelectedDate(iso);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
  };

  const viewMonthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
  const isDayDisabled = (date: string) =>
    (minDate ? date < minDate : false) || (isDateEnabled ? !isDateEnabled(date) : false);

  const handleSelectDay = (date: string) => {
    void Haptics.selectionAsync().catch(() => {});
    setSelectedDate(date);
  };

  const handleConfirm = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onConfirm(selectedDate);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end bg-overlay/60">
        <Pressable className="flex-1" onPress={onClose} />

        <View className="rounded-t-3xl border-t border-border bg-card px-5 pt-4 pb-8 max-h-[85%]">
          {/* Sheet Handle */}
          <View className="items-center mb-3">
            <View className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-border">
            <View className="flex-row items-center">
              <CalendarIcon size={18} color={activeColors.primary} className="mr-2" />
              <Text className="text-lg font-bold text-foreground">{title}</Text>
            </View>
            <Pressable
              testID="close-date-picker-btn"
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="p-2 rounded-full bg-muted"
            >
              <X size={18} color={activeColors.foreground} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 14 }}
          >
            {/* Quick Presets: skipped when only some days can be picked (they would bypass it). */}
            <View className={`flex-row flex-wrap gap-2 mb-4 ${isDateEnabled ? 'hidden' : ''}`}>
              <Pressable
                testID="date-preset-today"
                onPress={() => handleQuickPreset(0)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor:
                    selectedDate === todayIso ? primaryTintStrong : activeColors.muted,
                  borderWidth: 1,
                  borderColor:
                    selectedDate === todayIso ? activeColors.primary : activeColors.border,
                }}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedDate === todayIso ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  Hoy
                </Text>
              </Pressable>

              <Pressable
                testID="date-preset-tomorrow"
                onPress={() => handleQuickPreset(1)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: activeColors.muted,
                  borderWidth: 1,
                  borderColor: activeColors.border,
                }}
              >
                <Text className="text-xs font-semibold text-foreground">Mañana</Text>
              </Pressable>

              <Pressable
                testID="date-preset-3days"
                onPress={() => handleQuickPreset(3)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: activeColors.muted,
                  borderWidth: 1,
                  borderColor: activeColors.border,
                }}
              >
                <Text className="text-xs font-semibold text-foreground">En 3 días</Text>
              </Pressable>

              <Pressable
                testID="date-preset-nextweek"
                onPress={() => handleQuickPreset(7)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: activeColors.muted,
                  borderWidth: 1,
                  borderColor: activeColors.border,
                }}
              >
                <Text className="text-xs font-semibold text-foreground">En 1 semana</Text>
              </Pressable>
            </View>

            {/* Month & Year Navigation */}
            <View className="flex-row items-center justify-between px-2 py-2 mb-3 bg-muted/40 rounded-xl border border-border">
              <Pressable
                testID="date-prev-month-btn"
                onPress={handlePrevMonth}
                className="p-2 rounded-lg bg-card active:opacity-70 border border-border"
              >
                <ChevronLeft size={18} color={activeColors.foreground} />
              </Pressable>

              <Text className="text-base font-bold text-foreground">
                {formatMonthTitle(viewMonthKey)}
              </Text>

              <Pressable
                testID="date-next-month-btn"
                onPress={handleNextMonth}
                className="p-2 rounded-lg bg-card active:opacity-70 border border-border"
              >
                <ChevronRight size={18} color={activeColors.foreground} />
              </Pressable>
            </View>

            <MonthGrid
              month={viewMonthKey}
              selectedDate={selectedDate}
              today={todayIso}
              onSelectDay={handleSelectDay}
              isDayDisabled={isDayDisabled}
            />

            {/* Action Buttons */}
            <View className="flex-row items-center space-x-3 pt-6">
              <View className="flex-1 mr-2">
                <Button variant="outline" size="default" onPress={onClose}>
                  Cancelar
                </Button>
              </View>
              <View className="flex-1">
                <Button
                  testID="confirm-date-btn"
                  variant="default"
                  size="default"
                  onPress={handleConfirm}
                >
                  Seleccionar
                </Button>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
