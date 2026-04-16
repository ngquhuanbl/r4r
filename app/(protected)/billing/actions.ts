"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { stripeErrorToUserMessage } from "@/lib/billing/stripe-errors";
import {
  getPriceIdForTier,
  TIER_STARTER,
  type BillingTier,
} from "@/lib/billing/tiers";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { syncStripeSubscriptionToDatabase } from "@/lib/stripe/sync-subscription";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";
import { Paths } from "@/constants/paths";

function appOrigin(): string {
  const h = headers();
  const o = h.get("origin");
  if (o) return o;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.PROD_URL) return `https://${process.env.PROD_URL}`;
  return "http://localhost:3000";
}

export async function ensureStripeCustomer(): Promise<
  { ok: true; customerId: string } | { ok: false; error: string }
> {
  if (!isStripeConfigured()) {
    return { ok: false, error: "Billing is not configured (Stripe keys missing)." };
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const admin = createServiceRoleClient();
  const { data: row } = await admin
    .from("user_billing")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (row?.stripe_customer_id) {
    return { ok: true, customerId: row.stripe_customer_id };
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    metadata: { supabase_user_id: user.id },
  });

  await admin.from("user_billing").upsert(
    {
      user_id: user.id,
      stripe_customer_id: customer.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return { ok: true, customerId: customer.id };
}

export async function changeBusinessTier(
  businessId: number,
  tier: BillingTier,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isStripeConfigured()) {
    return { ok: false, error: "Billing is not configured." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: biz } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!biz) return { ok: false, error: "Business not found." };

  const ensured = await ensureStripeCustomer();
  if (!ensured.ok) return ensured;

  const stripe = getStripe();
  const admin = createServiceRoleClient();

  const { data: ub } = await admin
    .from("user_billing")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ub?.stripe_customer_id) {
    return { ok: false, error: "Missing Stripe customer." };
  }

  const customerId = ub.stripe_customer_id;
  let subscriptionId = ub.stripe_subscription_id;

  const { data: bb } = await admin
    .from("business_billing")
    .select("stripe_subscription_item_id")
    .eq("business_id", businessId)
    .maybeSingle();

  const existingItemId = bb?.stripe_subscription_item_id ?? null;

  try {
    if (tier === TIER_STARTER) {
      if (existingItemId) {
        await stripe.subscriptionItems.del(existingItemId, {
          proration_behavior: "create_prorations",
        });
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          await syncStripeSubscriptionToDatabase(sub);
        }
      }
      revalidatePath(Paths.BILLING);
      return { ok: true };
    }

    const priceId = getPriceIdForTier(tier);
    if (!priceId) {
      return {
        ok: false,
        error:
          "Stripe Price IDs are not configured (STRIPE_PRICE_VELOCITY / STRIPE_PRICE_MOMENTUM).",
      };
    }

    if (!subscriptionId) {
      const sub = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: priceId,
            metadata: { business_id: String(businessId) },
          },
        ],
        metadata: { supabase_user_id: user.id },
        collection_method: "charge_automatically",
      });
      await syncStripeSubscriptionToDatabase(sub);
      revalidatePath(Paths.BILLING);
      return { ok: true };
    }

    if (existingItemId) {
      await stripe.subscriptionItems.update(existingItemId, {
        price: priceId,
        proration_behavior: "create_prorations",
      });
    } else {
      await stripe.subscriptionItems.create({
        subscription: subscriptionId,
        price: priceId,
        metadata: { business_id: String(businessId) },
      });
    }

    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    await syncStripeSubscriptionToDatabase(sub);
    revalidatePath(Paths.BILLING);
    return { ok: true };
  } catch (err) {
    console.error("changeBusinessTier:", err);
    return { ok: false, error: stripeErrorToUserMessage(err) };
  }
}

export async function createBillingPortalSession(): Promise<
  { ok: true; url: string } | { ok: false; error: string }
> {
  if (!isStripeConfigured()) {
    return { ok: false, error: "Billing is not configured." };
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const ensured = await ensureStripeCustomer();
  if (!ensured.ok) return ensured;

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: ensured.customerId,
      return_url: `${appOrigin()}${Paths.BILLING}`,
    });

    return { ok: true, url: session.url };
  } catch (err) {
    console.error("createBillingPortalSession:", err);
    return { ok: false, error: stripeErrorToUserMessage(err) };
  }
}

export type BillingInvoiceRow = {
  id: string;
  date: string;
  amountUsd: number;
  status: string;
  pdfUrl: string | null;
};

export async function fetchBillingInvoices(): Promise<
  BillingInvoiceRow[] | { error: string }
> {
  if (!isStripeConfigured()) return [];
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const admin = createServiceRoleClient();
  const { data: ub } = await admin
    .from("user_billing")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ub?.stripe_customer_id) return [];

  const stripe = getStripe();
  const list = await stripe.invoices.list({
    customer: ub.stripe_customer_id,
    limit: 24,
  });

  return list.data.map((inv: (typeof list.data)[number]) => {
    const tsSec =
      inv.status_transitions?.paid_at ??
      inv.created ??
      Math.floor(Date.now() / 1000);
    return {
      id: inv.id ?? "",
      date: new Date(tsSec * 1000).toISOString(),
      amountUsd: (inv.amount_paid ?? 0) / 100,
      status: inv.status ?? "unknown",
      pdfUrl: inv.invoice_pdf ?? null,
    };
  });
}

export async function getDefaultPaymentMethodSummary(): Promise<
  | { brand: string | null; last4: string | null; expMonth: number | null; expYear: number | null }
  | null
> {
  if (!isStripeConfigured()) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createServiceRoleClient();
  const { data: ub } = await admin
    .from("user_billing")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ub?.stripe_customer_id) return null;

  const stripe = getStripe();
  const customer = await stripe.customers.retrieve(ub.stripe_customer_id, {
    expand: ["invoice_settings.default_payment_method"],
  });
  if (customer.deleted) return null;

  const rawPm = customer.invoice_settings?.default_payment_method;
  type CardPm = { card?: { brand?: string | null; last4?: string | null; exp_month?: number | null; exp_year?: number | null } | null };
  let pm: CardPm | null = null;
  if (rawPm && typeof rawPm !== "string") {
    pm = rawPm as CardPm;
  } else if (typeof rawPm === "string") {
    pm = (await stripe.paymentMethods.retrieve(rawPm)) as CardPm;
  } else {
    const list = await stripe.paymentMethods.list({
      customer: ub.stripe_customer_id,
      type: "card",
      limit: 1,
    });
    pm = (list.data[0] ?? null) as CardPm | null;
  }
  if (!pm) return null;

  const card = pm.card;
  return {
    brand: card?.brand ?? null,
    last4: card?.last4 ?? null,
    expMonth: card?.exp_month ?? null,
    expYear: card?.exp_year ?? null,
  };
}
