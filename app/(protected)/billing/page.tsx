import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  fetchBillingInvoices,
  getDefaultPaymentMethodSummary,
} from "@/app/(protected)/billing/actions";
import { BillingPageClient } from "@/components/billing/billing-page-client";
import { Paths } from "@/constants/paths";
import {
  TIER_MONTHLY_USD,
  TIER_STARTER,
  type BillingTier,
} from "@/lib/billing/tiers";
import { createClient } from "@/lib/supabase/server";
import { isStripeConfigured } from "@/lib/stripe/server";
import { fetchBusinesses } from "@/app/(protected)/my-businesses/actions";
import type { Tables } from "@/types/database";

export const metadata: Metadata = {
  title: "Billing",
  description: "Manage subscriptions, payment method, and invoices.",
};

function tierForRow(
  billing: Tables<"business_billing"> | null,
): BillingTier {
  if (!billing) return TIER_STARTER;
  return billing.tier as BillingTier;
}

export default async function BillingPage() {
  if (process.env.NEXT_PUBLIC_BILLING_ENABLED !== "true") {
    redirect(Paths.DASHBOARD);
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(Paths.LOGIN);
  }

  const businessesRes = await fetchBusinesses(user.id);
  const businesses = businessesRes.ok ? businessesRes.data : [];

  const { data: ub } = await supabase
    .from("user_billing")
    .select(
      "subscription_current_period_end",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  const businessRows = await Promise.all(
    businesses.map(async (b) => {
      const { data: billing } = await supabase
        .from("business_billing")
        .select("*")
        .eq("business_id", b.id)
        .maybeSingle();
      return { business: b, billing };
    }),
  );

  let totalMonthlyUsd = 0;
  for (const row of businessRows) {
    totalMonthlyUsd += TIER_MONTHLY_USD[tierForRow(row.billing)];
  }

  const payment = await getDefaultPaymentMethodSummary();
  const invRes = await fetchBillingInvoices();
  const invoices = Array.isArray(invRes) ? invRes : [];

  return (
    <BillingPageClient
      stripeConfigured={isStripeConfigured()}
      totalMonthlyUsd={totalMonthlyUsd}
      nextRenewal={ub?.subscription_current_period_end ?? null}
      businessRows={businessRows}
      payment={payment}
      invoices={invoices}
    />
  );
}
