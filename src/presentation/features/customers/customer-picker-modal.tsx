import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { X, Search, UserPlus, Building2, Phone, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useCustomers } from '@/application/hooks/customers';
import type { TaskCustomerSummary } from '@/core/types/task.types';
import { LoadingSpinner } from '@/presentation/components/ui/loading-spinner';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';
import { QuickCreateCustomerSheet } from './quick-create-customer-sheet';

export interface CustomerPickerModalProps {
  visible: boolean;
  selectedCustomerId?: string | null;
  onClose: () => void;
  onSelectCustomer: (customer: TaskCustomerSummary) => void;
}

export function CustomerPickerModal({
  visible,
  selectedCustomerId,
  onClose,
  onSelectCustomer,
}: CustomerPickerModalProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  const [searchTerm, setSearchTerm] = useState('');
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  const { data: customers = [], isLoading } = useCustomers({ search: searchTerm });

  const handleSelect = async (customer: TaskCustomerSummary) => {
    try {
      await Haptics.selectionAsync();
    } catch {
      // Ignore
    }
    onSelectCustomer(customer);
    onClose();
  };

  const handleCustomerCreated = (customer: TaskCustomerSummary) => {
    setIsQuickCreateOpen(false);
    onSelectCustomer(customer);
    onClose();
  };

  return (
    <>
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
            {/* Handle */}
            <View className="items-center mb-3">
              <View className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-border">
              <View className="flex-1">
                <Text className="text-lg font-bold text-foreground">
                  {es.tasks.customerPicker.title}
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  Selecciona un cliente para vincular a la actividad
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="p-2 rounded-full bg-muted"
              >
                <X size={18} color={activeColors.foreground} />
              </Pressable>
            </View>

            {/* Search + Quick Create Action */}
            <View className="pt-3 pb-2 gap-y-2.5">
              <View className="flex-row items-center border border-input rounded-xl bg-card px-3.5 h-12">
                <Search size={18} color={activeColors.mutedForeground} className="mr-2.5" />
                <TextInput
                  testID="customer-search-input"
                  placeholder={es.tasks.customerPicker.searchPlaceholder}
                  placeholderTextColor={activeColors.mutedForeground}
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  className="flex-1 text-foreground text-base py-0"
                  clearButtonMode="while-editing"
                />
              </View>

              <Pressable
                testID="open-quick-create-customer-btn"
                onPress={() => setIsQuickCreateOpen(true)}
                className="flex-row items-center justify-center p-3 rounded-xl border border-primary/40 bg-primary/10"
              >
                <UserPlus size={16} color={activeColors.primary} className="mr-2" />
                <Text className="text-sm font-bold text-primary">
                  {es.tasks.customerPicker.addNewCustomer}
                </Text>
              </Pressable>
            </View>

            {/* Customer List */}
            {isLoading ? (
              <View className="py-12 items-center justify-center">
                <LoadingSpinner />
              </View>
            ) : customers.length === 0 ? (
              <View className="py-10 items-center justify-center">
                <Building2 size={36} color={activeColors.mutedForeground} />
                <Text className="text-sm font-medium text-foreground mt-2">
                  {es.tasks.customerPicker.noResults}
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5 text-center px-6">
                  Prueba con otro término de búsqueda o registra uno nuevo con el botón superior.
                </Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
                className="gap-y-2"
              >
                {customers.map((c) => {
                  const isSelected = selectedCustomerId === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      testID={`customer-item-${c.id}`}
                      onPress={() => handleSelect(c)}
                      className={`p-3.5 rounded-xl border flex-row items-center justify-between ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                      }`}
                    >
                      <View className="flex-1 pr-3">
                        <View className="flex-row items-center">
                          <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                            {c.name}
                          </Text>
                          {c.identification ? (
                            <Text className="text-[11px] text-muted-foreground ml-2 font-mono">
                              ({c.identification})
                            </Text>
                          ) : null}
                        </View>
                        {c.address ? (
                          <Text className="text-xs text-muted-foreground mt-0.5" numberOfLines={1}>
                            {c.address}
                          </Text>
                        ) : null}
                        {c.phone ? (
                          <View className="flex-row items-center mt-1">
                            <Phone
                              size={10}
                              color={activeColors.mutedForeground}
                              className="mr-1"
                            />
                            <Text className="text-[11px] text-muted-foreground">{c.phone}</Text>
                          </View>
                        ) : null}
                      </View>

                      {isSelected ? (
                        <View className="h-6 w-6 rounded-full bg-primary items-center justify-center">
                          <Check size={14} color="#ffffff" strokeWidth={3} />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Quick create customer modal */}
      <QuickCreateCustomerSheet
        visible={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </>
  );
}
