import { View } from 'react-native';
import { BottomSheet } from '@/presentation/components/ui/bottom-sheet';
import { Chip } from '@/presentation/components/ui/chip';
import { es } from '@/shared/i18n/es';

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface FilterOptionsSheetProps {
  open: boolean;
  title: string;
  options: readonly FilterOption[];
  /** Undefined: no value chosen ("Todos"). */
  selected: string | undefined;
  onSelect: (value: string | undefined) => void;
  onClose: () => void;
}

/** The values one filter can take, each with how many products it leaves. One tap chooses. */
export function FilterOptionsSheet({
  open,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: FilterOptionsSheetProps) {
  const choose = (value: string | undefined) => {
    onSelect(value);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={title} scrollable testID="filter-options">
      <View className="flex-row flex-wrap gap-2">
        <Chip
          testID="filter-option-all"
          label={es.orders.filters.any}
          selected={selected === undefined}
          onPress={() => choose(undefined)}
        />
        {options.map((option) => (
          <Chip
            key={option.value}
            testID={`filter-option-${option.value}`}
            label={`${option.label} (${option.count})`}
            selected={selected === option.value}
            onPress={() => choose(option.value)}
          />
        ))}
      </View>
    </BottomSheet>
  );
}
