import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { X, Search, Package, Plus, Minus, ShoppingCart } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useProducts, type CatalogProduct } from '@/application/hooks/products';
import { Button } from '@/presentation/components/ui/button';
import { LoadingSpinner } from '@/presentation/components/ui/loading-spinner';
import { useThemeStore } from '@/stores/theme.store';
import { darkColors, lightColors } from '@/theme/colors';
import { es } from '@/shared/i18n/es';

export interface CartItem {
  product: CatalogProduct;
  quantity: number;
}

export interface SaleProductCartSheetProps {
  visible: boolean;
  initialItems?: CartItem[];
  onClose: () => void;
  onConfirmCart: (cart: {
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
  }) => void;
}

export function SaleProductCartSheet({
  visible,
  initialItems = [],
  onClose,
  onConfirmCart,
}: SaleProductCartSheetProps) {
  const scheme = useThemeStore((state) => state.getEffectiveScheme());
  const activeColors = scheme === 'dark' ? darkColors : lightColors;

  const [searchTerm, setSearchTerm] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const item of initialItems) {
      initial[item.product.id] = item.quantity;
    }
    return initial;
  });

  const { data: products = [], isLoading } = useProducts(searchTerm);

  const handleIncrement = async (product: CatalogProduct) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
    setQuantities((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }));
  };

  const handleDecrement = async (product: CatalogProduct) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignore
    }
    setQuantities((prev) => {
      const current = prev[product.id] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      }
      return {
        ...prev,
        [product.id]: current - 1,
      };
    });
  };

  // Calculate totals
  const cartItems: CartItem[] = [];
  let subtotal = 0;

  for (const p of products) {
    const qty = quantities[p.id] || 0;
    if (qty > 0) {
      cartItems.push({ product: p, quantity: qty });
      subtotal += p.unitPrice * qty;
    }
  }

  // Also include items from initial that might not be in current search results
  for (const item of initialItems) {
    if (!products.some((p) => p.id === item.product.id)) {
      const qty = quantities[item.product.id] || 0;
      if (qty > 0) {
        cartItems.push({ product: item.product, quantity: qty });
        subtotal += item.product.unitPrice * qty;
      }
    }
  }

  const tax = subtotal * 0.15;
  const total = subtotal + tax;
  const totalItemCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  const handleConfirm = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignore
    }
    onConfirmCart({
      items: cartItems,
      subtotal,
      tax,
      total,
    });
    onClose();
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
          className="rounded-t-3xl border-t border-border bg-card px-5 pt-4 pb-8 max-h-[90%]"
          style={{ backgroundColor: scheme === 'dark' ? '#171717' : '#ffffff' }}
        >
          {/* Handle */}
          <View className="items-center mb-3">
            <View className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-border">
            <View className="flex-row items-center">
              <View className="p-2 rounded-xl bg-emerald-500/10 mr-2.5">
                <ShoppingCart size={20} color="#10b981" />
              </View>
              <View>
                <Text className="text-lg font-bold text-foreground">{es.tasks.cart.title}</Text>
                <Text className="text-xs text-muted-foreground">
                  Selecciona los productos y define las cantidades
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="p-2 rounded-full bg-muted"
            >
              <X size={18} color={activeColors.foreground} />
            </Pressable>
          </View>

          {/* Search bar */}
          <View className="py-3">
            <View className="flex-row items-center border border-input rounded-xl bg-card px-3.5 h-12">
              <Search size={18} color={activeColors.mutedForeground} className="mr-2.5" />
              <TextInput
                testID="product-search-input"
                placeholder={es.tasks.cart.searchPlaceholder}
                placeholderTextColor={activeColors.mutedForeground}
                value={searchTerm}
                onChangeText={setSearchTerm}
                className="flex-1 text-foreground text-base py-0"
                clearButtonMode="while-editing"
              />
            </View>
          </View>

          {/* Product list */}
          {isLoading ? (
            <View className="py-16 items-center justify-center">
              <LoadingSpinner />
            </View>
          ) : products.length === 0 ? (
            <View className="py-12 items-center justify-center">
              <Package size={36} color={activeColors.mutedForeground} />
              <Text className="text-sm font-medium text-foreground mt-2">
                No se encontraron productos
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
              className="gap-y-2.5 max-h-[380px]"
            >
              {products.map((p) => {
                const qty = quantities[p.id] || 0;
                return (
                  <View
                    key={p.id}
                    className="p-3 rounded-2xl border border-border bg-card flex-row items-center justify-between"
                  >
                    <View className="flex-1 pr-2">
                      <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
                        {p.name}
                      </Text>
                      <View className="flex-row items-center mt-0.5 space-x-2">
                        <Text className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          ${p.unitPrice.toFixed(2)}
                        </Text>
                        <Text className="text-[11px] text-muted-foreground font-mono">
                          ({p.code})
                        </Text>
                        <Text className="text-[11px] text-muted-foreground">Stock: {p.stock}</Text>
                      </View>
                    </View>

                    {/* Quantity Stepper */}
                    <View className="flex-row items-center bg-muted/70 rounded-xl p-1 border border-border">
                      <Pressable
                        testID={`decrement-${p.id}`}
                        onPress={() => handleDecrement(p)}
                        className="h-8 w-8 items-center justify-center rounded-lg bg-card border border-border"
                      >
                        <Minus size={14} color={activeColors.foreground} />
                      </Pressable>

                      <Text className="w-8 text-center text-sm font-bold text-foreground">
                        {qty}
                      </Text>

                      <Pressable
                        testID={`increment-${p.id}`}
                        onPress={() => handleIncrement(p)}
                        className="h-8 w-8 items-center justify-center rounded-lg bg-emerald-500"
                      >
                        <Plus size={14} color="#ffffff" strokeWidth={2.5} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Cart summary footer */}
          <View className="pt-3 border-t border-border gap-y-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-muted-foreground">
                {es.tasks.cart.itemsCount}: {totalItemCount}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {es.tasks.cart.subtotal}: ${subtotal.toFixed(2)}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {es.tasks.cart.tax}: ${tax.toFixed(2)}
              </Text>
            </View>

            <View className="flex-row items-center justify-between pt-1">
              <Text className="text-base font-bold text-foreground">{es.tasks.cart.total}:</Text>
              <Text className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                ${total.toFixed(2)}
              </Text>
            </View>

            <View className="pt-2">
              <Button testID="confirm-cart-btn" onPress={handleConfirm} variant="default" size="lg">
                {es.tasks.cart.confirmOrder}
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
