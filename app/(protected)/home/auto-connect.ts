"use server";

import { InvitationStatusNames } from "@/constants/shared";
import { createClient } from "@/lib/supabase/server";
import { Tables } from "@/types/database";
import { UserId } from "@/types/shared";

// Configuration
const MAX_CONNECTIONS_PER_DAY = 3;
const HOURS_BEFORE_RESET = 24;

interface AutoConnectResult {
  processed: number;
  connected: number;
  errors: string[];
}

/**
 * Process auto-connect queue for a user's businesses.
 * Called on page visit to gradually connect businesses.
 * 
 * When a new business is created, its owner should receive invitations
 * from OTHER businesses asking them to write reviews. This way:
 * - New users start by writing reviews (giving first)
 * - Existing businesses get more reviewers
 */
export async function processAutoConnect(
  userId: UserId
): Promise<AutoConnectResult> {
  const supabase = createClient();
  const result: AutoConnectResult = {
    processed: 0,
    connected: 0,
    errors: [],
  };

  try {
    // 1. Get all businesses owned by this user that are in the queue
    const { data: queueItems, error: queueError } = await supabase
      .from("auto_connect_queue")
      .select(
        `
        id,
        business_id,
        attempts_today,
        last_attempt_at,
        businesses!inner (
          id,
          user_id
        )
      `
      )
      .eq("businesses.user_id", userId);

    if (queueError) {
      console.error("Error fetching auto-connect queue:", queueError);
      result.errors.push(queueError.message);
      return result;
    }

    if (!queueItems || queueItems.length === 0) {
      return result;
    }

    // 2. Get PENDING status ID
    const { data: pendingStatus, error: statusError } = await supabase
      .from("invitation_statuses")
      .select("id")
      .eq("name", InvitationStatusNames.PENDING)
      .single();

    if (statusError || !pendingStatus) {
      console.error("Error fetching pending status:", statusError);
      result.errors.push("Could not fetch pending status");
      return result;
    }

    // 3. Process each queue item
    for (const item of queueItems) {
      result.processed++;

      // Check if we need to reset daily counter
      const now = new Date();
      const lastAttempt = item.last_attempt_at
        ? new Date(item.last_attempt_at)
        : null;
      const hoursSinceLastAttempt = lastAttempt
        ? (now.getTime() - lastAttempt.getTime()) / (1000 * 60 * 60)
        : Infinity;

      let attemptsToday = item.attempts_today;
      if (hoursSinceLastAttempt >= HOURS_BEFORE_RESET) {
        attemptsToday = 0;
      }

      // Skip if already at max for today
      if (attemptsToday >= MAX_CONNECTIONS_PER_DAY) {
        continue;
      }

      // 4. Find a random eligible business to connect
      const targetBusiness = await findRandomEligibleBusiness(
        supabase,
        item.business_id,
        userId
      );

      if (!targetBusiness) {
        // No eligible businesses found
        continue;
      }

      // 5. Create the connection (invitation)
      const connectionResult = await createAutoConnection(
        supabase,
        item.business_id,
        targetBusiness.id,
        targetBusiness.user_id,
        userId,
        pendingStatus.id
      );

      if (connectionResult.success) {
        result.connected++;

        // 6. Update queue item
        await supabase
          .from("auto_connect_queue")
          .update({
            attempts_today: attemptsToday + 1,
            last_attempt_at: now.toISOString(),
          })
          .eq("id", item.id);
      } else if (connectionResult.error) {
        result.errors.push(connectionResult.error);
      }
    }
  } catch (error: any) {
    console.error("Unexpected error in processAutoConnect:", error);
    result.errors.push(error.message || "Unexpected error");
  }

  return result;
}

/**
 * Find a random business that wants reviews and is eligible to invite this user.
 * The newly created business owner will be the INVITEE (reviewer).
 * 
 * Excludes:
 * - Same owner's businesses
 * - Businesses the user has already rejected invitations from
 * - Businesses that have already sent invitations to this user
 * - Businesses without any platforms configured
 */
async function findRandomEligibleBusiness(
  supabase: ReturnType<typeof createClient>,
  sourceBusinessId: Tables<"businesses">["id"],
  userId: UserId
): Promise<{ id: number; user_id: string } | null> {
  // Get REJECTED status ID
  const { data: rejectedStatus } = await supabase
    .from("invitation_statuses")
    .select("id")
    .eq("name", InvitationStatusNames.REJECTED)
    .single();

  const rejectedStatusId = rejectedStatus?.id;

  // Find businesses that have platforms configured (can receive reviews)
  // and are not owned by the same user
  const { data: businessesWithPlatforms, error } = await supabase
    .from("businesses")
    .select(
      `
      id, 
      user_id,
      business_platforms!inner (
        platform_id
      )
    `
    )
    .neq("user_id", userId) // Not same owner
    .neq("id", sourceBusinessId); // Not the source business itself

  if (error || !businessesWithPlatforms || businessesWithPlatforms.length === 0) {
    return null;
  }

  // Get existing invitations where this user is the invitee
  // These are businesses that have already invited this user
  const { data: existingInvitations } = await supabase
    .from("review_invitations")
    .select("business_id, status_id")
    .eq("invitee_id", userId);

  const alreadyInvitedByBusinessIds = new Set<number>();
  const rejectedByUserBusinessIds = new Set<number>();

  if (existingInvitations) {
    for (const inv of existingInvitations) {
      // Already have an invitation from this business
      alreadyInvitedByBusinessIds.add(inv.business_id);

      // User rejected invitation from this business
      if (inv.status_id === rejectedStatusId) {
        rejectedByUserBusinessIds.add(inv.business_id);
      }
    }
  }

  // Filter to only eligible businesses
  const finalEligible = businessesWithPlatforms.filter(
    (b) =>
      !alreadyInvitedByBusinessIds.has(b.id) &&
      !rejectedByUserBusinessIds.has(b.id)
  );

  if (finalEligible.length === 0) {
    return null;
  }

  // Pick a random one
  const randomIndex = Math.floor(Math.random() * finalEligible.length);
  return finalEligible[randomIndex];
}

/**
 * Create an auto-connection (invitation) where:
 * - The TARGET business wants reviews (is the inviter)
 * - The SOURCE user (newly created business owner) will write reviews (is the invitee)
 * 
 * @param sourceBusinessId - The newly created business (for tracking purposes)
 * @param targetBusinessId - The business that wants reviews
 * @param targetUserId - Owner of target business (inviter - asking for reviews)
 * @param sourceUserId - Owner of source business (invitee - will write reviews)
 */
async function createAutoConnection(
  supabase: ReturnType<typeof createClient>,
  sourceBusinessId: Tables<"businesses">["id"],
  targetBusinessId: Tables<"businesses">["id"],
  targetUserId: UserId,
  sourceUserId: UserId,
  pendingStatusId: number
): Promise<{ success: boolean; error?: string }> {
  // Get platforms for the TARGET business (the one wanting reviews)
  const { data: platforms, error: platformError } = await supabase
    .from("business_platforms")
    .select("platform_id")
    .eq("business_id", targetBusinessId);

  if (platformError) {
    console.error("Error fetching platforms:", platformError);
    return { success: false, error: platformError.message };
  }

  if (!platforms || platforms.length === 0) {
    // No platforms configured, skip
    return { success: false, error: "No platforms configured for business" };
  }

  // Create invitation for each platform
  // The TARGET business is asking the SOURCE user to write a review
  const invitations = platforms.map((p) => ({
    business_id: targetBusinessId, // Business that wants reviews
    platform_id: p.platform_id,
    inviter_id: targetUserId, // Owner of business wanting reviews
    invitee_id: sourceUserId, // New user who will write reviews
    status_id: pendingStatusId,
    message: "Auto-connected by the system",
  }));

  const { error: insertError } = await supabase
    .from("review_invitations")
    .insert(invitations);

  if (insertError) {
    console.error("Error creating auto-connection:", insertError);
    return { success: false, error: insertError.message };
  }

  return { success: true };
}

/**
 * Add a business to the auto-connect queue.
 * Called when a new business is created.
 */
export async function addToAutoConnectQueue(
  businessId: Tables<"businesses">["id"]
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase.from("auto_connect_queue").insert({
    business_id: businessId,
    attempts_today: 0,
  });

  if (error) {
    // Ignore unique constraint violations (already in queue)
    if (error.code === "23505") {
      return { success: true };
    }
    console.error("Error adding to auto-connect queue:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
