import { Tables } from "@/types/database";

export type UpdatedReviewStatus = {
  id: Tables<"reviews">["id"];
  status: Pick<Tables<"review_statuses">, "id" | "name">;
};

export type Review = Pick<
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

export type SubmitReviewResponse = Pick<
  Tables<"reviews">,
  "id" | "url" | "content"
> & {
  status: Pick<Tables<"review_statuses">, "id" | "name">;
};

export type PartialReviewWithId = {
  id: Tables<"reviews">["id"];
} & Partial<Review>;

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
