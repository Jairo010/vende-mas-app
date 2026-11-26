import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { CarFront, ChevronDown, PackageCheck, X } from 'lucide-react-native';
import type { ProductFacets, ProductFamily, SaleVehicle } from '@/core/types/catalog.types';
import { Chip } from '@/presentation/components/ui/chip';
import { es } from '@/shared/i18n/es';
import { todayKey } from '@/shared/utils/date';
import { useThemeColors } from '@/theme';
import { FilterOptionsSheet } from './filter-options-sheet';
import {
  attributesOf,
  hasActiveFilters,
  optionLabel,
  optionsOf,
  vehicleLabel,
  withFamily,
  type AttributeFilter,
  type SaleFilters,
} from './sale-filters';
import { VehicleFilterSheet } from './vehicle-filter-sheet';

const t = es.orders.filters;

export interface CatalogFiltersProps {
  filters: SaleFilters;
  onChangeFilters: (filters: SaleFilters) => void;
  /** The customer's vehicle: kept for the whole sale. */
  vehicle: SaleVehicle | null;
  onChangeVehicle: (vehicle: SaleVehicle | null) => void;
  /** What each filter can still take, counted on the device. */
  facets: ProductFacets;
}

/**
 * Filters of the sale catalog (ADR 0021): the customer's vehicle and the product family first,
 * then what that family can be narrowed by. Only values that have products are offered.
 */
export function CatalogFilters({
  filters,
  onChangeFilters,
  vehicle,
  onChangeVehicle,
  facets,
}: CatalogFiltersProps) {
  const colors = useThemeColors();
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [openAttribute, setOpenAttribute] = useState<AttributeFilter | null>(null);
  const iconColor = (selected: boolean) =>
    selected ? colors.primaryForeground : colors.foreground;

  const chooseFamily = (family: ProductFamily | undefined) =>
    onChangeFilters(withFamily(filters, family));

  // A chosen value stays visible even when the other filters leave it without products.
  const attributes = attributesOf(filters.family).filter(
    (attribute) => filters[attribute] !== undefined || optionsOf(facets, attribute).length > 1,
  );
  const active = hasActiveFilters(filters, vehicle);

  return (
    <View className="gap-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
      >
        <Chip
          testID="catalog-filter-vehicle"
          label={vehicle ? vehicleLabel(vehicle) : t.vehicle.label}
          selected={vehicle !== null}
          icon={<CarFront size={16} color={iconColor(vehicle !== null)} />}
          onPress={() => setVehicleOpen(true)}
        />
        <Chip
          testID="catalog-family-all"
          label={t.allFamilies}
          selected={filters.family === undefined}
          onPress={() => chooseFamily(undefined)}
        />
        {facets.families.map((family) => (
          <Chip
            key={family.value}
            testID={`catalog-family-${family.value}`}
            label={`${t.families[family.value]} (${family.count})`}
            selected={filters.family === family.value}
            onPress={() => chooseFamily(filters.family === family.value ? undefined : family.value)}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
      >
        {attributes.map((attribute) => {
          const value = filters[attribute];
          return (
            <Chip
              key={attribute}
              testID={`catalog-filter-${attribute}`}
              label={value ? optionLabel(attribute, value) : t.attributes[attribute]}
              selected={value !== undefined}
              icon={<ChevronDown size={14} color={iconColor(value !== undefined)} />}
              onPress={() => setOpenAttribute(attribute)}
            />
          );
        })}
        <Chip
          testID="catalog-filter-stock"
          label={t.inStockOnly}
          selected={filters.inStockOnly === true}
          icon={<PackageCheck size={14} color={iconColor(filters.inStockOnly === true)} />}
          onPress={() => {
            const { inStockOnly, ...rest } = filters;
            onChangeFilters(inStockOnly ? rest : { ...rest, inStockOnly: true });
          }}
        />
        {active ? (
          <Chip
            testID="catalog-filter-clear"
            label={t.clear}
            icon={<X size={14} color={colors.foreground} />}
            onPress={() => {
              onChangeFilters({});
              onChangeVehicle(null);
            }}
          />
        ) : null}
      </ScrollView>

      <VehicleFilterSheet
        open={vehicleOpen}
        vehicle={vehicle}
        family={filters.family}
        currentYear={Number(todayKey().slice(0, 4))}
        onSelect={onChangeVehicle}
        onClose={() => setVehicleOpen(false)}
      />
      <FilterOptionsSheet
        open={openAttribute !== null}
        title={openAttribute ? t.attributes[openAttribute] : ''}
        options={
          openAttribute
            ? optionsOf(facets, openAttribute).map((option) => ({
                ...option,
                label: optionLabel(openAttribute, option.value),
              }))
            : []
        }
        selected={openAttribute ? filters[openAttribute] : undefined}
        onSelect={(value) => {
          if (!openAttribute) return;
          const { [openAttribute]: _previous, ...rest } = filters;
          onChangeFilters(value ? ({ ...rest, [openAttribute]: value } as SaleFilters) : rest);
        }}
        onClose={() => setOpenAttribute(null)}
      />
    </View>
  );
}
