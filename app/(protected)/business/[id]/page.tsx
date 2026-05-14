import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BusinessPageClient } from "@/components/business/v2/business-page-client";
import { fetchReviewStatuses } from "@/app/(protected)/actions/review-actions";
import { getUser, getUserOrRedirect } from "@/lib/supabase/server";
import type { BusinessReviewSnapshot } from "@/types/business-page";
import type { Tables } from "@/types/database";

import {
  fetchBusinessBillingContext,
  fetchBusinessReviewSnapshot,
  getBusinessForUser,
} from "./actions";

type PageProps = { params: { id: string } };

function emptySnapshot(): BusinessReviewSnapshot {
  return {
    received: { accepted: 0, rejected: 0, other: 0 },
    given: { accepted: 0, rejected: 0, other: 0 },
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = Number.parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return { title: "Business | R4R" };
  }
  const user = await getUser();
  if (!user) {
    return { title: "Business | R4R" };
  }
  const business = await getBusinessForUser(user.id, id);
  if (!business) {
    return { title: "Business | R4R" };
  }
  return {
    title: `${business.business_name} | R4R`,
    description: `Manage review exchanges and tasks for ${business.business_name}.`,
  };
}

export default async function BusinessPage({ params }: PageProps) {
  const id = Number.parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    notFound();
  }

  const user = await getUserOrRedirect();
  const business = await getBusinessForUser(user.id, id as Tables<"businesses">["id"]);
  if (!business) {
    notFound();
  }

  const [snapshotRes, statusesRes, billingContext] = await Promise.all([
    fetchBusinessReviewSnapshot(user.id, business.id),
    fetchReviewStatuses(),
    fetchBusinessBillingContext(user.id, business.id),
  ]);

  const snapshot = snapshotRes.ok ? snapshotRes.data : emptySnapshot();
  const reviewStatuses = statusesRes.ok ? statusesRes.data : [];

  return (
    <BusinessPageClient
      userId={user.id}
      business={business}
      snapshot={snapshot}
      reviewStatuses={reviewStatuses}
      billingContext={billingContext}
    />
  );
}
