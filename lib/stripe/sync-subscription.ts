import {
  TIER_MOMENTUM,
  TIER_SLOT_LIMIT,
  TIER_STARTER,
  TIER_VELOCITY,
  type BillingTier,
} from "@/lib/billing/tiers";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";

function tierFromPriceId(priceId: string): BillingTier | null {
  const v = process.env.STRIPE_PRICE_VELOCITY;
  const m = process.env.STRIPE_PRICE_MOMENTUM;
  if (v && priceId === v) return TIER_VELOCITY;
  if (m && priceId === m) return TIER_MOMENTUM;
  return null;
}

/**
 * Upsert cache rows from a Stripe Subscription (multi-item, metadata.business_id per item).
 */
export async function syncStripeSubscriptionToDatabase(
  subscription: Awaited<
    ReturnType<InstanceType<typeof import("stripe")>["subscriptions"]["retrieve"]>
  >,
): Promise<void> {
  const stripe = getStripe();
  const supabase = createServiceRoleClient();

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return;

  const userId = customer.metadata?.supabase_user_id;
  if (!userId) {
    console.warn(
      "[stripe] Customer missing supabase_user_id metadata:",
      customerId,
    );
    return;
  }

  const periodSec = (
    subscription as { current_period_end?: number | null }
  ).current_period_end;
  const periodEnd = periodSec
    ? new Date(periodSec * 1000).toISOString()
    : null;

  await supabase.from("user_billing").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      subscription_current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  const activeItemIds = new Set(
    subscription.items.data.map((i: { id: string }) => i.id),
  );

  for (const item of subscription.items.data) {
    const bid = item.metadata?.business_id;
    if (!bid) continue;
    const businessId = Number(bid);
    if (Number.isNaN(businessId)) continue;

    const priceId =
      typeof item.price === "string" ? item.price : item.price?.id;
    if (!priceId) continue;

    const tier = tierFromPriceId(priceId);
    if (tier === null || tier === TIER_STARTER) continue;

    await supabase.from("business_billing").upsert(
      {
        business_id: businessId,
        tier,
        slot_limit: TIER_SLOT_LIMIT[tier],
        stripe_subscription_item_id: item.id,
        current_period_end: periodEnd,
        cancel_at_period_end:
          (item as { cancel_at_period_end?: boolean }).cancel_at_period_end ??
          false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "business_id" },
    );
  }

  const { data: owned } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", userId);

  const ownedIds = (owned ?? []).map((r) => r.id);
  if (ownedIds.length === 0) return;

  const { data: cached } = await supabase
    .from("business_billing")
    .select("business_id, stripe_subscription_item_id")
    .in("business_id", ownedIds);

  for (const row of cached ?? []) {
    if (!row.stripe_subscription_item_id) continue;
    if (!activeItemIds.has(row.stripe_subscription_item_id)) {
      await supabase
        .from("business_billing")
        .delete()
        .eq("business_id", row.business_id);
    }
  }
}
