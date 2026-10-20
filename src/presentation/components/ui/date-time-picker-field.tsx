import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Calendar as CalendarIcon, Clock, ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { DatePickerModal } from './date-picker-modal';
import { TimePickerModal } from './time-picker-modal';
import { useThemeColors } from '@/theme';

// Helper to format ISO date "YYYY-MM-DD" to human readable "17 de Sep, 2026"
export function formatDisplayDate(isoDate?: string | null): string | null {
  if (!isoDate) return null;
  try {
    const parts = isoDate.split('-').map(Number);
    if (!parts[0] || !parts[1] || !parts[2]) return isoDate;
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    if (isNaN(d.getTime())) return isoDate;

    const day = d.getDate();
    const months = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} de ${month}, ${year}`;
  } catch {
    return isoDate;
  }
}

// Helper to format 24h "14:30" to "02:30 PM"
export function formatDisplayTime(timeStr?: string | null): string | null {
  if (!timeStr) return null;
  try {
    const parts = timeStr.split(':').map(Number);
    if (parts[0] === undefined || isNaN(parts[0])) return timeStr;
    const rawH = parts[0];
    const m = String(parts[1] !== undefined && !isNaN(parts[1]) ? parts[1] : 0).padStart(2, '0');
    const period = rawH >= 12 ? 'PM' : 'AM';
    const displayH = rawH % 12 === 0 ? 12 : rawH % 12;
    return `${String(displayH).padStart(2, '0')}:${m} ${period}`;
  } catch {
    return timeStr;
  }
}

export interface DatePickerFieldProps {
  label?: string;
  value?: string | null;
  onChange: (date: string) => void;
  placeholder?: string;
  minDate?: string | null;
  error?: string;
  testID?: string;
  className?: string;
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Seleccionar fecha...',
  minDate,
  error,
  testID = 'date-picker-field',
  className = '',
}: DatePickerFieldProps) {
  const activeColors = useThemeColors();
  const [isOpen, setIsOpen] = useState(false);

  const display = formatDisplayDate(value);

  const handleOpen = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsOpen(true);
  };

  return (
    <View className={className}>
      {label ? <Text className="text-sm font-medium text-foreground mb-1.5">{label}</Text> : null}

      <Pressable
        testID={testID}
        onPress={handleOpen}
        className={`flex-row items-center justify-between border rounded-xl bg-card px-3.5 h-12 active:opacity-80 ${
          error ? 'border-destructive' : 'border-input'
        }`}
      >
        <View className="flex-row items-center flex-1 mr-2">
          <CalendarIcon size={18} color={activeColors.mutedForeground} className="mr-2.5" />
          <Text
            className={`text-base ${display ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
            numberOfLines={1}
          >
            {display || placeholder}
          </Text>
        </View>

        <ChevronDown size={16} color={activeColors.mutedForeground} />
      </Pressable>

      {error ? (
        <Text className="text-xs text-destructive mt-1 font-medium pl-0.5">{error}</Text>
      ) : null}

      <DatePickerModal
        visible={isOpen}
        initialDate={value}
        minDate={minDate}
        title={label || 'Seleccionar Fecha'}
        onConfirm={onChange}
        onClose={() => setIsOpen(false)}
      />
    </View>
  );
}

export interface TimePickerFieldProps {
  label?: string;
  value?: string | null;
  onChange: (time: string) => void;
  placeholder?: string;
  error?: string;
  testID?: string;
  className?: string;
}

export function TimePickerField({
  label,
  value,
  onChange,
  placeholder = 'Seleccionar hora...',
  error,
  testID = 'time-picker-field',
  className = '',
}: TimePickerFieldProps) {
  const activeColors = useThemeColors();
  const [isOpen, setIsOpen] = useState(false);

  const display = formatDisplayTime(value);

  const handleOpen = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsOpen(true);
  };

  return (
    <View className={className}>
      {label ? <Text className="text-sm font-medium text-foreground mb-1.5">{label}</Text> : null}

      <Pressable
        testID={testID}
        onPress={handleOpen}
        className={`flex-row items-center justify-between border rounded-xl bg-card px-3.5 h-12 active:opacity-80 ${
          error ? 'border-destructive' : 'border-input'
        }`}
      >
        <View className="flex-row items-center flex-1 mr-2">
          <Clock size={18} color={activeColors.mutedForeground} className="mr-2.5" />
          <Text
            className={`text-base ${display ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
            numberOfLines={1}
          >
            {display || placeholder}
          </Text>
        </View>

        <ChevronDown size={16} color={activeColors.mutedForeground} />
      </Pressable>

      {error ? (
        <Text className="text-xs text-destructive mt-1 font-medium pl-0.5">{error}</Text>
      ) : null}

      <TimePickerModal
        visible={isOpen}
        initialTime={value}
        title={label || 'Seleccionar Hora'}
        onConfirm={onChange}
        onClose={() => setIsOpen(false)}
      />
    </View>
  );
}
