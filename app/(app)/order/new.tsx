import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FileText, ShoppingCart } from 'lucide-react-native';
import { useActivePromotions } from '@/application/hooks/catalog/use-active-promotions';
import { useCartProducts } from '@/application/hooks/catalog/use-cart-products';
import { useCustomer } from '@/application/hooks/customers/use-customer';
import { useCreateOrder } from '@/application/hooks/orders/use-create-order';
import { useVisit } from '@/application/hooks/visits/use-visit';
import type { ProductEntity } from '@/core/entities/product.entity';
import { priceOrder } from '@/core/value-objects/order-pricing';
import { ScreenHeader } from '@/presentation/components/common/screen-header';
import { AlertBanner } from '@/presentation/components/feedback/alert-banner';
import { notify } from '@/presentation/components/feedback/toast';
import { Button } from '@/presentation/components/ui/button';
import { Skeleton } from '@/presentation/components/ui/skeleton';
import { StickyFooter } from '@/presentation/components/ui/sticky-footer';
import { OrderCatalog } from '@/presentation/features/orders/order-catalog';
import { OrderCustomerPicker } from '@/presentation/features/orders/order-customer-picker';
import { OrderReview } from '@/presentation/features/orders/order-review';
import {
  defaultPaymentPlan,
  toPaymentPlanInput,
} from '@/presentation/features/orders/payment-plan-picker';
import { CustomerBalanceCard } from '@/presentation/features/collections/customer-balance-card';
import { useCollectionsSettings } from '@/application/hooks/collections/use-collections-settings';
import { useCustomerBalance } from '@/application/hooks/collections/use-customer-balance';
import { es } from '@/shared/i18n/es';
import { toZonedIsoString, zonedInstant } from '@/shared/utils/date';
import { formatCurrency } from '@/shared/utils/format-currency';
import { orderDraftKey, useOrderDraftStore, type OrderDraft } from '@/stores/order-draft.store';
import { useVisitDraftStore } from '@/stores/visit-draft.store';
import { useThemeColors } from '@/theme';

type Step = 'customer' | 'catalog' | 'review';

type NewOrderParams = {
  customerId?: string;
  visitId?: string;
};

/** Space the sticky cart footer takes over the catalog list. */
const FOOTER_INSET = 120;

/**
 * Takes an order offline: (customer) → catalog with steppers → review → confirm. The cart
 * is a persisted draft; prices and promotions are estimated with the server's rules.
 */
export default function NewOrderScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams<NewOrderParams>();
  const visitId = params.visitId ?? null;

  const [customerId, setCustomerId] = useState<string | null>(params.customerId ?? null);
  const [step, setStep] = useState<Step>(params.customerId ? 'catalog' : 'customer');

  const { customer } = useCustomer(customerId ?? undefined);
  const { visit } = useVisit(visitId ?? undefined);
  const { promotions } = useActivePromotions();
  const { createOrder, isPending } = useCreateOrder();

  const key = customerId ? orderDraftKey(customerId, visitId) : null;
  const draft = useOrderDraftStore((state) => (key ? state.drafts[key] : undefined));
  const setQuantity = useOrderDraftStore((state) => state.setQuantity);
  const updateDraft = useOrderDraftStore((state) => state.updateDraft);
  const clearDraft = useOrderDraftStore((state) => state.clearDraft);
  const updateVisitDraft = useVisitDraftStore((state) => state.updateDraft);
  const quantities = useMemo(() => draft?.quantities ?? {}, [draft]);

  const productIds = useMemo(() => Object.keys(quantities), [quantities]);
  const { products: cartProducts, isReady: cartReady } = useCartProducts(productIds);

  // Priced cart: active products only; the rest must be removed before confirming.
  const { priced, pricedProducts, unavailable } = useMemo(() => {
    const byId = new Map(cartProducts.map((product) => [product.id, product]));
    const available: ProductEntity[] = [];
    const missing: { productId: string; name: string; quantity: number }[] = [];
    for (const productId of productIds) {
      const product = byId.get(productId);
      if (product?.isActive) available.push(product);
      else if (cartReady) {
        missing.push({ productId, name: product?.name ?? '—', quantity: quantities[productId] });
      }
    }
    return {
      priced: priceOrder(
        available.map((product) => ({ product, quantity: quantities[product.id] })),
        promotions,
        new Date(),
      ),
      pricedProducts: available,
      unavailable: missing,
    };
  }, [cartProducts, cartReady, productIds, quantities, promotions]);

  const itemCount = priced.lines.reduce((sum, line) => sum + line.quantity, 0);
  const { settings } = useCollectionsSettings();
  const { balance } = useCustomerBalance(customerId ?? undefined);
  // Credit rule (server setting): no new orders while installments are overdue.
  const blockedByOverdue = settings.blockOrdersWhenOverdue && balance.overdue > 0;
  const canTakeOrders = (customer?.canTakeOrders() ?? false) && !blockedByOverdue;
  const paymentPlan = draft?.paymentPlan ?? defaultPaymentPlan(draft?.deliveryDate ?? null);

  const changeQuantity = (productId: string, quantity: number) => {
    if (!customerId || !key) return;
    const base: Pick<OrderDraft, 'customerId' | 'visitId'> = { customerId, visitId };
    setQuantity(key, base, productId, Math.max(0, quantity));
  };

  const back = () => {
    if (step === 'review') setStep('catalog');
    else if (step === 'catalog' && !params.customerId) setStep('customer');
    else router.back();
  };

  const confirm = async () => {
    if (!customerId || !key || priced.lines.length === 0 || unavailable.length > 0) return;
    try {
      const order = await createOrder({
        customerId,
        visitId: visitId ?? undefined,
        items: priced.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        estimatedDeliveryDate: draft?.deliveryDate
          ? toZonedIsoString(zonedInstant(draft.deliveryDate, '12:00'))
          : undefined,
        notes: draft?.notes.trim() || undefined,
        paymentPlan: toPaymentPlanInput(paymentPlan),
      });
      clearDraft(key);
      // An order visit now has its natural outcome preselected for the check-out.
      if (visit?.type === 'ORDER' && visit.canComplete()) {
        const current = useVisitDraftStore.getState().drafts[visit.id];
        if (!current?.outcome) updateVisitDraft(visit.id, { outcome: 'ORDER_TAKEN' });
      }
      notify.success(es.orders.created, es.visits.toasts.queued);
      router.replace({ pathname: '/(app)/order/[id]', params: { id: order.id } });
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title={step === 'review' ? es.orders.review.title : es.orders.newTitle}
        subtitle={customer?.tradeName}
        onBack={back}
      />

      {step === 'customer' ? (
        <OrderCustomerPicker
          onPick={(picked) => {
            setCustomerId(picked.id);
            setStep('catalog');
          }}
        />
      ) : null}

      {step !== 'customer' && !customer ? (
        <View className="gap-3 p-4">
          <Skeleton className="h-12" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </View>
      ) : null}

      {step !== 'customer' && customer?.canTakeOrders() && blockedByOverdue ? (
        <View className="gap-3 p-4">
          <AlertBanner
            variant="error"
            title={es.collections.overdueBlock.title}
            message={es.collections.overdueBlock.description}
          />
          <CustomerBalanceCard
            balance={balance}
            onCollect={() =>
              router.push({
                pathname: '/(app)/payment/new',
                params: { customerId: customer.id, ...(visitId && { visitId }) },
              })
            }
          />
        </View>
      ) : null}

      {step !== 'customer' && customer && !customer.canTakeOrders() ? (
        <View className="gap-3 p-4">
          <AlertBanner variant="warning" message={es.orders.onlyActive} />
          {customer.isProspect() ? (
            <Button
              leftIcon={<FileText size={16} color={colors.primaryForeground} />}
              onPress={() =>
                router.push({
                  pathname: '/(app)/customer/[id]/billing',
                  params: { id: customer.id },
                })
              }
            >
              {es.visits.actions.completeBilling}
            </Button>
          ) : null}
        </View>
      ) : null}

      {step === 'catalog' && canTakeOrders ? (
        <>
          <OrderCatalog
            quantities={quantities}
            onChangeQuantity={(product, quantity) => changeQuantity(product.id, quantity)}
            promotions={promotions}
            bottomInset={FOOTER_INSET}
          />
          <StickyFooter>
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <ShoppingCart size={18} color={colors.foreground} />
                <Text className="ml-2 text-sm text-muted-foreground">
                  {itemCount > 0 ? `${itemCount} ${es.orders.items}` : es.orders.cart.empty}
                </Text>
              </View>
              <Text className="text-lg font-bold text-foreground">
                {formatCurrency(priced.totals.total)}
              </Text>
            </View>
            <Button
              testID="order-review"
              disabled={itemCount === 0 && unavailable.length === 0}
              onPress={() => setStep('review')}
            >
              {es.orders.cart.review}
            </Button>
          </StickyFooter>
        </>
      ) : null}

      {step === 'review' && canTakeOrders ? (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
          >
            <OrderReview
              priced={priced}
              products={pricedProducts}
              unavailable={unavailable}
              onChangeQuantity={changeQuantity}
              deliveryDate={draft?.deliveryDate ?? null}
              onChangeDeliveryDate={(date) => key && updateDraft(key, { deliveryDate: date })}
              notes={draft?.notes ?? ''}
              onChangeNotes={(notes) => key && updateDraft(key, { notes })}
              paymentPlan={paymentPlan}
              onChangePaymentPlan={(plan) => key && updateDraft(key, { paymentPlan: plan })}
            />
          </ScrollView>
          <StickyFooter>
            <View className="flex-row gap-2">
              <Button variant="outline" className="flex-1" onPress={() => setStep('catalog')}>
                {es.orders.review.backToCatalog}
              </Button>
              <Button
                testID="order-confirm"
                className="flex-1"
                isLoading={isPending}
                disabled={priced.lines.length === 0 || unavailable.length > 0}
                onPress={() => void confirm()}
              >
                {es.orders.review.confirm}
              </Button>
            </View>
          </StickyFooter>
        </KeyboardAvoidingView>
      ) : null}
    </View>
  );
}
