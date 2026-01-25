"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { useAppDispatch } from "@/lib/redux/hooks";
import { reviewRequestsActions } from "@/lib/redux/slices/review-request";
import { ReviewRequest } from "@/types/dashboard";
import { Tables } from "@/types/database";

import { createClient } from "./client";

type RealtimeInvitationPayload = {
  new: Tables<"review_invitations">;
  old: Tables<"review_invitations"> | null;
};

/**
 * Hook to subscribe to Supabase Realtime for new review invitations.
 * When a new invitation is created for this user, it fetches the full
 * invitation details and adds it to the Redux store.
 */
export function useRealtimeInvitations(userId: string) {
  const dispatch = useAppDispatch();
  const supabaseRef = useRef(createClient());

  useEffect(() => {
    const supabase = supabaseRef.current;

    const channel = supabase
      .channel(`invitations:${userId}`)
      .on<Tables<"review_invitations">>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "review_invitations",
          filter: `invitee_id=eq.${userId}`,
        },
        async (payload: RealtimeInvitationPayload) => {
          console.log("Realtime: New invitation received", payload.new);

          // Fetch the full invitation details with relations
          const fullInvitation = await fetchInvitationDetails(
            supabase,
            payload.new.id
          );

          if (fullInvitation) {
            dispatch(reviewRequestsActions.addOne(fullInvitation));
            toast.success("New review request received!", {
              description: `${fullInvitation.business.business_name} wants you to leave a review.`,
            });
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    return () => {
      console.log("Cleaning up Realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [userId, dispatch]);
}

/**
 * Fetch full invitation details with business and platform relations.
 */
async function fetchInvitationDetails(
  supabase: ReturnType<typeof createClient>,
  invitationId: Tables<"review_invitations">["id"]
): Promise<ReviewRequest | null> {
  const { data, error } = await supabase
    .from("review_invitations")
    .select(
      `
      id,
      message,
      business:businesses!inner (
        id,
        business_name,
        address,
        city,
        state,
        zip_code,
        phone
      ),
      platform:platforms!inner (
        id,
        name,
        color
      ),
      status:invitation_statuses!inner (
        id,
        name
      )
    `
    )
    .eq("id", invitationId)
    .single();

  if (error) {
    console.error("Error fetching invitation details:", error);
    return null;
  }

  return data as unknown as ReviewRequest;
}
