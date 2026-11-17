import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useVehicleMakes } from '@/application/hooks/catalog/use-vehicle-makes';
import type { ProductFamily, SaleVehicle } from '@/core/types/catalog.types';
import { BottomSheet } from '@/presentation/components/ui/bottom-sheet';
import { Button } from '@/presentation/components/ui/button';
import { Chip } from '@/presentation/components/ui/chip';
import { es } from '@/shared/i18n/es';
import { useThemeColors } from '@/theme';

const t = es.orders.filters.vehicle;
/** Oldest model year offered; older vehicles are chosen without a year. */
const FIRST_YEAR = 1990;

export interface VehicleFilterSheetProps {
  open: boolean;
  /** The vehicle chosen now, if any. */
  vehicle: SaleVehicle | null;
  /** Offers only the makes and models with products of this family. */
  family?: ProductFamily;
  /** Calendar year of today: the list of years ends one after it. */
  currentYear: number;
  onSelect: (vehicle: SaleVehicle | null) => void;
  onClose: () => void;
}

/**
 * The customer's vehicle in three taps: make, model, year. Each step can be skipped ("Cualquier
 * modelo", "Cualquier año"), because the catalog does not always say them.
 */
export function VehicleFilterSheet({
  open,
  vehicle,
  family,
  currentYear,
  onSelect,
  onClose,
}: VehicleFilterSheetProps) {
  const colors = useThemeColors();
  const { makes } = useVehicleMakes(family, open);
  // null: choosing the make; then the model (undefined until chosen; null = any model).
  const [make, setMake] = useState<string | null>(null);
  const [model, setModel] = useState<string | null | undefined>(undefined);

  const close = () => {
    setMake(null);
    setModel(undefined);
    onClose();
  };
  const finish = (chosen: SaleVehicle | null) => {
    onSelect(chosen);
    close();
  };

  const models = makes.find((entry) => entry.make === make)?.models ?? [];
  const step = make === null ? 'make' : model === undefined ? 'model' : 'year';
  const years = Array.from(
    { length: currentYear + 1 - FIRST_YEAR + 1 },
    (_, index) => currentYear + 1 - index,
  );
  const back = () => {
    if (step === 'year') setModel(undefined);
    else setMake(null);
  };

  return (
    <BottomSheet
      open={open}
      onClose={close}
      title={step === 'make' ? t.chooseMake : step === 'model' ? t.chooseModel : t.chooseYear}
      scrollable
      testID="vehicle-filter"
    >
      {step !== 'make' ? (
        <Pressable
          testID="vehicle-filter-back"
          accessibilityRole="button"
          accessibilityLabel={es.common.back}
          onPress={back}
          className="mb-3 flex-row items-center self-start rounded-xl py-1 pr-3 active:bg-muted"
        >
          <ChevronLeft size={18} color={colors.primary} />
          <Text className="ml-1 text-sm font-semibold text-primary">
            {[make, model].filter(Boolean).join(' ')}
          </Text>
        </Pressable>
      ) : null}

      <View className="flex-row flex-wrap gap-2">
        {step === 'make'
          ? makes.map((entry) => (
              <Chip
                key={entry.make}
                testID={`vehicle-make-${entry.make}`}
                label={`${entry.make} (${entry.count})`}
                selected={vehicle?.make === entry.make}
                onPress={() => setMake(entry.make)}
              />
            ))
          : null}

        {step === 'model' && make !== null ? (
          <>
            <Chip testID="vehicle-model-any" label={t.anyModel} onPress={() => setModel(null)} />
            {models.map((entry) => (
              <Chip
                key={entry.model}
                testID={`vehicle-model-${entry.model}`}
                label={`${entry.model} (${entry.count})`}
                selected={vehicle?.make === make && vehicle.model === entry.model}
                onPress={() => setModel(entry.model)}
              />
            ))}
          </>
        ) : null}

        {step === 'year' && make !== null && model !== undefined ? (
          <>
            <Chip
              testID="vehicle-year-any"
              label={t.anyYear}
              onPress={() => finish({ make, model, year: null })}
            />
            {years.map((year) => (
              <Chip
                key={year}
                testID={`vehicle-year-${year}`}
                label={String(year)}
                selected={
                  vehicle?.make === make && vehicle.model === model && vehicle.year === year
                }
                onPress={() => finish({ make, model, year })}
              />
            ))}
          </>
        ) : null}
      </View>

      {step === 'make' && makes.length === 0 ? (
        <Text className="text-sm text-muted-foreground">{t.empty}</Text>
      ) : null}

      {step === 'make' && vehicle ? (
        <Button
          testID="vehicle-filter-clear"
          variant="ghost"
          className="mt-4"
          onPress={() => finish(null)}
        >
          {t.clear}
        </Button>
      ) : null}
    </BottomSheet>
  );
}
