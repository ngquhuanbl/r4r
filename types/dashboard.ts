import { Tables } from "@/types/database";

export type FetchedReview = Pick<
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

export type UpdatedReviewStatus = {
  id: Tables<"reviews">["id"];
  status: Pick<Tables<"review_statuses">, "id" | "name">;
};
