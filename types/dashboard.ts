import { Tables } from "@/types/database";

export type IncomingReview = Pick<
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

export type UpdatedIncomingReviewStatus = {
  id: Tables<"reviews">["id"];
  status: Pick<Tables<"review_statuses">, "id" | "name">;
};

export type OutgoingReview = Pick<
  Tables<"review_invitations">,
  "id" | "message" | "created_at" | "invitee_id" | "inviter_id"
> & {
  status: Pick<Tables<"review_statuses">, "id" | "name">;
  business: Pick<
    Tables<"businesses">,
    "id" | "business_name" | "address" | "city" | "state" | "zip_code"
  >;
  platform: Pick<Tables<"platforms">, "id" | "name">;
  review: Array<
    Pick<Tables<"reviews">, "id" | "url" | "content"> & {
      status: Pick<Tables<"review_statuses">, "id" | "name">;
    }
  >;
};

export type UpdatedOutgoingReviewStatus = {
  id: Tables<"review_invitations">["id"];
  status: Pick<Tables<"invitation_statuses">, "id" | "name">;
};

export type SubmitReviewResponse = {
  id: Tables<"review_invitations">["id"];
  review: Pick<Tables<"reviews">, "id" | "url" | "content"> & {
    status: Pick<Tables<"review_statuses">, "id" | "name">;
  };
  status: Pick<Tables<"invitation_statuses">, "id" | "name">;
};
