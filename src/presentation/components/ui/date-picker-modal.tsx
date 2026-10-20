import { useMemo, useState, useEffect } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Button } from './button';
import { useThemeColorWithAlpha, useThemeColors } from '@/theme';

export interface DatePickerModalProps {
  visible: boolean;
  initialDate?: string | null;
  minDate?: string | null;
  title?: string;
  onConfirm: (date: string) => void;
  onClose: () => void;
}

const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEKDAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

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
  title = 'Seleccionar Fecha',
  onConfirm,
  onClose,
}: DatePickerModalProps) {
  const primaryTintStrong = useThemeColorWithAlpha('primary', 0.18);
  const primaryTintSoft = useThemeColorWithAlpha('primary', 0.1);
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

  // Calendar days computation (Monday as start of week)
  const calendarGrid = useMemo(() => {
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    // Sunday is 0, Monday is 1 ... Saturday is 6
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    // Shift so Monday is 0, Sunday is 6
    const offset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const days: Array<{
      key: string;
      dayNumber: number;
      isoString: string;
      isCurrentMonth: boolean;
      isDisabled: boolean;
      isToday: boolean;
    }> = [];

    // Empty lead slots
    for (let i = 0; i < offset; i++) {
      days.push({
        key: `empty-${i}`,
        dayNumber: 0,
        isoString: '',
        isCurrentMonth: false,
        isDisabled: true,
        isToday: false,
      });
    }

    // Month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const monthStr = String(viewMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const iso = `${viewYear}-${monthStr}-${dayStr}`;

      const isDisabled = minDate ? iso < minDate : false;
      const isToday = iso === todayIso;

      days.push({
        key: iso,
        dayNumber: d,
        isoString: iso,
        isCurrentMonth: true,
        isDisabled,
        isToday,
      });
    }

    return days;
  }, [viewYear, viewMonth, minDate, todayIso]);

  const handleSelectDay = (iso: string, disabled: boolean) => {
    if (disabled || !iso) return;
    void Haptics.selectionAsync().catch(() => {});
    setSelectedDate(iso);
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
            {/* Quick Presets */}
            <View className="flex-row flex-wrap gap-2 mb-4">
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
                {MONTH_NAMES_ES[viewMonth]} {viewYear}
              </Text>

              <Pressable
                testID="date-next-month-btn"
                onPress={handleNextMonth}
                className="p-2 rounded-lg bg-card active:opacity-70 border border-border"
              >
                <ChevronRight size={18} color={activeColors.foreground} />
              </Pressable>
            </View>

            {/* Weekdays Header */}
            <View className="flex-row items-center justify-between mb-2 px-1">
              {WEEKDAYS_ES.map((d) => (
                <View key={d} className="flex-1 items-center">
                  <Text className="text-xs font-bold text-muted-foreground">{d}</Text>
                </View>
              ))}
            </View>

            {/* Days Grid */}
            <View className="flex-row flex-wrap">
              {calendarGrid.map((item) => {
                if (!item.isCurrentMonth) {
                  return <View key={item.key} className="w-[14.28%] h-11" />;
                }

                const isSelected = selectedDate === item.isoString;

                return (
                  <View key={item.key} className="w-[14.28%] h-11 p-0.5">
                    <Pressable
                      testID={`date-day-${item.isoString}`}
                      disabled={item.isDisabled}
                      onPress={() => handleSelectDay(item.isoString, item.isDisabled)}
                      style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 10,
                        backgroundColor: isSelected
                          ? activeColors.primary
                          : item.isToday
                            ? primaryTintSoft
                            : 'transparent',
                        borderWidth: isSelected || item.isToday ? 1 : 0,
                        borderColor: isSelected ? activeColors.primary : activeColors.primary,
                        opacity: item.isDisabled ? 0.35 : 1,
                      }}
                    >
                      <Text
                        className={`text-sm font-bold ${
                          isSelected
                            ? 'text-primary-foreground'
                            : item.isToday
                              ? 'text-primary'
                              : 'text-foreground'
                        }`}
                      >
                        {item.dayNumber}
                      </Text>
                      {item.isToday && !isSelected ? (
                        <View className="h-1 w-1 rounded-full bg-primary mt-0.5" />
                      ) : null}
                    </Pressable>
                  </View>
                );
              })}
            </View>

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
