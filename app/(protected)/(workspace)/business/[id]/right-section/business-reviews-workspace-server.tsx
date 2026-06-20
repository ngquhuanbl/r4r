import { notFound } from "next/navigation";

import { BusinessReviewsWorkspaceClient } from "@/components/business/right-section/business-reviews-workspace";
import type { Tables } from "@/types/database";
import type { UserId } from "@/types/shared";

import { getBusinessForUser } from "../actions";

type BusinessReviewsWorkspaceServerProps = {
  userId: UserId;
  businessId: Tables<"businesses">["id"];
};

export async function BusinessReviewsWorkspaceServer({
  userId,
  businessId,
}: BusinessReviewsWorkspaceServerProps) {
  const business = await getBusinessForUser(userId, businessId);
  if (!business) {
    notFound();
  }

  return (
    <BusinessReviewsWorkspaceClient
      userId={userId}
      businessId={businessId}
      currentBusiness={{
        id: business.id,
        business_name: business.business_name,
        address: business.address ?? "",
        city: business.city ?? "",
        state: business.state ?? "",
        zip_code: business.zip_code ?? "",
      }}
    />
  );
}
