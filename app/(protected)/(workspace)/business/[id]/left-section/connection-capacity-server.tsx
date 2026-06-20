import {
  fetchBusinessBillingInfoCached,
  fetchUserSubscriptionPeriodEndCached,
} from "@/app/(protected)/billing/actions";
import { ConnectionCapacityClient } from "@/components/business/connect-capacity/connection-capacity-client";
import type { UserId } from "@/types/shared";

interface ConnectionCapacityServerProps {
  userId: UserId;
  businessId: number;
  businessName: string;
}

export async function ConnectionCapacityServer({
  userId,
  businessId,
  businessName,
}: ConnectionCapacityServerProps) {
  const [businessBilling, subscriptionPeriodEnd] = await Promise.all([
    fetchBusinessBillingInfoCached(businessId),
    fetchUserSubscriptionPeriodEndCached(userId),
  ]);

  return (
    <ConnectionCapacityClient
      userId={userId}
      businessId={businessId}
      businessName={businessName}
      billingData={businessBilling}
      subscriptionPeriodEnd={subscriptionPeriodEnd}
    />
  );
}
