import { Tables } from "@/types/database";

export type UpdatedReviewStatus = {
  id: Tables<"reviews">["id"];
  status: Pick<Tables<"review_statuses">, "id" | "name">;
};

export type PlatformURLs = Record<
  Tables<"platforms">["id"],
  Tables<"business_platforms">["platform_url"]
>;

export type FetchedBusiness = Pick<
  Tables<"businesses">,
  | "id"
  | "business_name"
  | "address"
  | "city"
  | "state"
  | "zip_code"
  | "phone"
  | "created_at"
> & {
  platform_urls: PlatformURLs;
};

export type IncomingReview = Pick<
  Tables<"reviews">,
  "id" | "content" | "url" | "created_at"
> & {
  status: Pick<Tables<"review_statuses">, "id" | "name">;
  invitation: {
    business: Pick<
      Tables<"businesses">,
      // "id" | "business_name" | "address" | "city" | "state" | "zip_code"
      "id"
    >;
    platform: Pick<Tables<"platforms">, "id" | "name">;
    inviter_id: Tables<"review_invitations">["inviter_id"];
  };
};

export type OutgoingReview = Pick<
  Tables<"reviews">,
  "id" | "content" | "url" | "created_at"
> & {
  status: Pick<Tables<"review_statuses">, "id" | "name">;
  invitation: {
    business: Pick<
      Tables<"businesses">,
      "id" | "business_name" | "address" | "city" | "state" | "zip_code"
    >;
    platform: Pick<Tables<"platforms">, "id" | "name">;
    inviter_id: Tables<"review_invitations">["inviter_id"];
  };
};

export type FetchedReviewsResponse<ReviewType> = {
  data: ReviewType[];
  total_page: number;
};

export type SubmitReviewResponse = Pick<
  Tables<"reviews">,
  "id" | "url" | "content"
> & {
  status: Pick<Tables<"review_statuses">, "id" | "name">;
};

export type PartialReviewWithId<ReviewType extends { id: any }> = {
  id: ReviewType["id"];
} & Partial<ReviewType>;

export type ReviewRequest = {
  id: Tables<"review_invitations">["id"];
  business: Pick<
    Tables<"businesses">,
    "id" | "business_name" | "address" | "city" | "state" | "zip_code" | "phone"
  >;
  platform: Pick<Tables<"platforms">, "id" | "name">;
  status: Pick<Tables<"invitation_statuses">, "id" | "name">;
};

export type UpdatedReviewRequestsStatus = {
  id: Tables<"review_invitations">["id"];
  status: Pick<Tables<"invitation_statuses">, "id" | "name">;
};
