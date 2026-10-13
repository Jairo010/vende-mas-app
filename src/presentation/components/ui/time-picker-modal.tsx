import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Clock, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Button } from './button';
import { useThemeColorWithAlpha, useThemeColors } from '@/theme';

export interface TimePickerModalProps {
  visible: boolean;
  initialTime?: string | null;
  title?: string;
  onConfirm: (time: string) => void;
  onClose: () => void;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const COMMERCIAL_PRESETS = [
  { label: '08:30 AM', hour: 8, minute: '30', period: 'AM' as const },
  { label: '10:00 AM', hour: 10, minute: '00', period: 'AM' as const },
  { label: '11:30 AM', hour: 11, minute: '30', period: 'AM' as const },
  { label: '02:30 PM', hour: 2, minute: '30', period: 'PM' as const },
  { label: '04:00 PM', hour: 4, minute: '00', period: 'PM' as const },
  { label: '05:30 PM', hour: 5, minute: '30', period: 'PM' as const },
];

export function TimePickerModal({
  visible,
  initialTime,
  title = 'Seleccionar Hora',
  onConfirm,
  onClose,
}: TimePickerModalProps) {
  const primaryTintStrong = useThemeColorWithAlpha('primary', 0.18);
  const activeColors = useThemeColors();

  const initialParsed = useMemo(() => {
    if (!initialTime) return { hour: 10, minute: '00', period: 'AM' as const };
    const parts = initialTime.split(':').map(Number);
    if (parts[0] === undefined || isNaN(parts[0])) {
      return { hour: 10, minute: '00', period: 'AM' as const };
    }
    const rawHour = parts[0];
    const rawMinute = parts[1] !== undefined && !isNaN(parts[1]) ? parts[1] : 0;
    const period = rawHour >= 12 ? ('PM' as const) : ('AM' as const);
    const displayHour = rawHour % 12 === 0 ? 12 : rawHour % 12;
    const roundedMinute = Math.round(rawMinute / 5) * 5;
    const normalizedMinute = roundedMinute >= 60 ? 55 : roundedMinute;
    return {
      hour: displayHour,
      minute: String(normalizedMinute).padStart(2, '0'),
      period,
    };
  }, [initialTime]);

  const [selectedHour, setSelectedHour] = useState<number>(initialParsed.hour);
  const [selectedMinute, setSelectedMinute] = useState<string>(initialParsed.minute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(initialParsed.period);

  // Sync state on open
  useEffect(() => {
    if (visible) {
      setSelectedHour(initialParsed.hour);
      setSelectedMinute(initialParsed.minute);
      setSelectedPeriod(initialParsed.period);
    }
  }, [visible, initialParsed]);

  const handleSelectHour = (h: number) => {
    void Haptics.selectionAsync().catch(() => {});
    setSelectedHour(h);
  };

  const handleSelectMinute = (m: string) => {
    void Haptics.selectionAsync().catch(() => {});
    setSelectedMinute(m);
  };

  const handleSelectPeriod = (p: 'AM' | 'PM') => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedPeriod(p);
  };

  const handleApplyPreset = (p: (typeof COMMERCIAL_PRESETS)[0]) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedHour(p.hour);
    setSelectedMinute(p.minute);
    setSelectedPeriod(p.period);
  };

  // Convert 12h + AM/PM to 24h format HH:mm
  const formatted24h = useMemo(() => {
    let hour24 = selectedHour;
    if (selectedPeriod === 'PM' && selectedHour < 12) {
      hour24 = selectedHour + 12;
    } else if (selectedPeriod === 'AM' && selectedHour === 12) {
      hour24 = 0;
    }
    const hourStr = String(hour24).padStart(2, '0');
    return `${hourStr}:${selectedMinute}`;
  }, [selectedHour, selectedMinute, selectedPeriod]);

  const handleConfirm = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onConfirm(formatted24h);
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
              <Clock size={18} color={activeColors.primary} className="mr-2" />
              <Text className="text-lg font-bold text-foreground">{title}</Text>
            </View>
            <Pressable
              testID="close-time-picker-btn"
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
            <Text className="text-xs font-bold text-muted-foreground mb-2">
              Horarios Frecuentes
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {COMMERCIAL_PRESETS.map((p) => {
                const isSelected =
                  selectedHour === p.hour &&
                  selectedMinute === p.minute &&
                  selectedPeriod === p.period;

                return (
                  <Pressable
                    key={p.label}
                    onPress={() => handleApplyPreset(p)}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: isSelected ? primaryTintStrong : activeColors.muted,
                      borderWidth: 1,
                      borderColor: isSelected ? activeColors.primary : activeColors.border,
                    }}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Large Digital Clock Display */}
            <View className="flex-row items-center justify-center my-3 py-3 rounded-2xl bg-muted/40 border border-border">
              <Text className="text-3xl font-extrabold text-foreground tracking-wider font-mono">
                {String(selectedHour).padStart(2, '0')} : {selectedMinute}
              </Text>

              {/* AM / PM Toggle Pills */}
              <View className="flex-row ml-4 bg-muted rounded-xl p-1 border border-border">
                <Pressable
                  testID="period-am-btn"
                  onPress={() => handleSelectPeriod('AM')}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: selectedPeriod === 'AM' ? activeColors.primary : 'transparent',
                  }}
                >
                  <Text
                    className={`text-xs font-extrabold ${
                      selectedPeriod === 'AM' ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    AM
                  </Text>
                </Pressable>

                <Pressable
                  testID="period-pm-btn"
                  onPress={() => handleSelectPeriod('PM')}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                    backgroundColor: selectedPeriod === 'PM' ? activeColors.primary : 'transparent',
                  }}
                >
                  <Text
                    className={`text-xs font-extrabold ${
                      selectedPeriod === 'PM' ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    PM
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Hour Selector Grid */}
            <Text className="text-xs font-bold text-muted-foreground mt-2 mb-2">Hora</Text>
            <View className="flex-row flex-wrap">
              {HOURS.map((h) => {
                const isSelected = selectedHour === h;
                return (
                  <View key={h} className="w-[16.66%] p-1">
                    <Pressable
                      testID={`hour-btn-${h}`}
                      onPress={() => handleSelectHour(h)}
                      style={{
                        height: 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 10,
                        backgroundColor: isSelected ? activeColors.primary : activeColors.muted,
                        borderWidth: 1,
                        borderColor: isSelected ? activeColors.primary : activeColors.border,
                      }}
                    >
                      <Text
                        className={`text-sm font-bold ${
                          isSelected ? 'text-primary-foreground' : 'text-foreground'
                        }`}
                      >
                        {h}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Minute Selector Grid */}
            <Text className="text-xs font-bold text-muted-foreground mt-4 mb-2">Minutos</Text>
            <View className="flex-row flex-wrap">
              {MINUTES.map((m) => {
                const isSelected = selectedMinute === m;
                return (
                  <View key={m} className="w-[16.66%] p-1">
                    <Pressable
                      testID={`minute-btn-${m}`}
                      onPress={() => handleSelectMinute(m)}
                      style={{
                        height: 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 10,
                        backgroundColor: isSelected ? activeColors.primary : activeColors.muted,
                        borderWidth: 1,
                        borderColor: isSelected ? activeColors.primary : activeColors.border,
                      }}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? 'text-primary-foreground' : 'text-foreground'
                        }`}
                      >
                        :{m}
                      </Text>
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
                  testID="confirm-time-btn"
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
