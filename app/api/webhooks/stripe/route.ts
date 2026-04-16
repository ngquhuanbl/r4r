import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { syncStripeSubscriptionToDatabase } from "@/lib/stripe/sync-subscription";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 },
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET missing");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const body = await request.text();
  const headerList = await headers();
  const sig = headerList.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const stripe = getStripe();
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Parameters<
          typeof syncStripeSubscriptionToDatabase
        >[0];
        await syncStripeSubscriptionToDatabase(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Parameters<
          typeof syncStripeSubscriptionToDatabase
        >[0];
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        const customer = await stripe.customers.retrieve(customerId);
        if (!customer.deleted && customer.metadata?.supabase_user_id) {
          const { createServiceRoleClient } = await import(
            "@/lib/supabase/admin"
          );
          const supabase = createServiceRoleClient();
          await supabase
            .from("user_billing")
            .update({
              stripe_subscription_id: null,
              subscription_current_period_end: null,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", customer.metadata.supabase_user_id);
          const { data: businesses } = await supabase
            .from("businesses")
            .select("id")
            .eq("user_id", customer.metadata.supabase_user_id);
          for (const b of businesses ?? []) {
            await supabase.from("business_billing").delete().eq("business_id", b.id);
          }
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    console.error("Stripe webhook handler error:", e);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
