import { revalidatePath } from "next/cache";

import { Paths } from "@/constants/paths";
import { ReviewStatusNames } from "@/constants/shared";
import type { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

type Supabase = ReturnType<typeof createClient>;

export function isTerminalReview(name: string | undefined): boolean {
  if (!name) return false;
  return (
    name === ReviewStatusNames.VERIFIED || name === ReviewStatusNames.REJECTED
  );
}

type StatusLookup = {
  draftId: number;
  terminalIds: Set<number>;
};

let statusLookupCache: StatusLookup | null = null;

async function getStatusLookup(supabase: Supabase): Promise<StatusLookup | null> {
  if (statusLookupCache) {
    return statusLookupCache;
  }

  const { data, error } = await supabase
    .from("review_statuses")
    .select("id, name")
    .in("name", [
      ReviewStatusNames.DRAFT,
      ReviewStatusNames.VERIFIED,
      ReviewStatusNames.REJECTED,
    ]);

  if (error || !data?.length) {
    if (error) {
      console.error("getStatusLookup", error);
    }
    return null;
  }

  const draft = data.find((row) => row.name === ReviewStatusNames.DRAFT);
  if (!draft) return null;

  const terminalIds = new Set(
    data
      .filter(
        (row) =>
          row.name === ReviewStatusNames.VERIFIED ||
          row.name === ReviewStatusNames.REJECTED,
      )
      .map((row) => row.id),
  );

  statusLookupCache = { draftId: draft.id, terminalIds };
  return statusLookupCache;
}

async function getConnectionReviewStatuses(
  supabase: Supabase,
  connectionId: Tables<"connections">["id"],
): Promise<number[] | null> {
  const { data: revs, error: revErr } = await supabase
    .from("reviews")
    .select("status_id")
    .eq("connection_id", connectionId);

  if (revErr || !revs || revs.length !== 2) {
    return null;
  }
  return revs.map((row) => row.status_id);
}

export async function tryCloseConnectionWhenBothSubmitted(
  supabase: Supabase,
  connectionId: Tables<"connections">["id"],
): Promise<void> {
  const lookup = await getStatusLookup(supabase);
  if (!lookup) return;

  const statuses = await getConnectionReviewStatuses(supabase, connectionId);
  if (!statuses) return;

  const allSubmittedOrTerminal = statuses.every((statusId) => statusId !== lookup.draftId);
  if (!allSubmittedOrTerminal) {
    return;
  }

  const { data: updated } = await supabase
    .from("connections")
    .update({
      closed_at: new Date().toISOString(),
    })
    .eq("id", connectionId)
    .is("closed_at", null)
    .select("id");

  if (updated?.[0]) {
    revalidatePath(Paths.DASHBOARD);
    // Avoid revalidatePath(businessPath(...)): users on a business page would get
    // a full segment refresh and lose client UI state (e.g. active reviews tab).
  }
}

export async function tryResolveConnection(
  supabase: Supabase,
  connectionId: Tables<"connections">["id"],
): Promise<void> {
  const lookup = await getStatusLookup(supabase);
  if (!lookup) return;

  const statuses = await getConnectionReviewStatuses(supabase, connectionId);
  if (!statuses) return;

  const allTerminal = statuses.every((statusId) => lookup.terminalIds.has(statusId));
  if (!allTerminal) return;

  const { data: updated } = await supabase
    .from("connections")
    .update(
      {
        resolved_at: new Date().toISOString(),
      },
    )
    .eq("id", connectionId)
    .is("resolved_at", null)
    .select("id");

  if (updated?.[0]) {
    revalidatePath(Paths.DASHBOARD);
  }
}

export async function tryCloseConnectionForReview(
  supabase: Supabase,
  reviewId: Tables<"reviews">["id"],
): Promise<void> {
  const { data: rev } = await supabase
    .from("reviews")
    .select("connection_id")
    .eq("id", reviewId)
    .maybeSingle();

  if (!rev?.connection_id) return;
  await tryCloseConnectionWhenBothSubmitted(supabase, rev.connection_id);
}

export async function tryResolveConnectionForReview(
  supabase: Supabase,
  reviewId: Tables<"reviews">["id"],
): Promise<void> {
  const { data: rev } = await supabase
    .from("reviews")
    .select("connection_id")
    .eq("id", reviewId)
    .maybeSingle();

  if (!rev?.connection_id) return;
  await tryResolveConnection(supabase, rev.connection_id);
}
