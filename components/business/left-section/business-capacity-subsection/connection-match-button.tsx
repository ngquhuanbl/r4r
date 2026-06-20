"use client";

import { UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { startConnectionMatch } from "@/app/(protected)/(workspace)/business/[id]/connection-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buildMatchFeedback } from "@/lib/connections/match-feedback";
import type { UserId } from "@/types/shared";

interface ConnectionMatchButtonProps {
  userId: UserId;
  businessId: number;
  isFull: boolean;
  onFullClick: () => void;
  onMatched: () => void;
}

export function ConnectionMatchButton({
  userId,
  businessId,
  isFull,
  onFullClick,
  onMatched,
}: ConnectionMatchButtonProps) {
  const [searching, setSearching] = useState(false);

  const onConnectClick = async () => {
    if (searching) return;
    if (isFull) {
      onFullClick();
      return;
    }

    setSearching(true);
    try {
      const res = await startConnectionMatch(userId, businessId);
      if (!res.ok) {
        toast.error("Could not start matching", {
          description:
            typeof res.error === "string" ? res.error : String(res.error),
        });
        return;
      }
      const feedback = buildMatchFeedback(res.data);
      if (feedback.kind === "error") {
        toast.error(feedback.message);
        return;
      }
      toast.success(feedback.message);
      onMatched();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ocean"
      size="lg"
      disabled={searching}
      aria-disabled={isFull ? true : undefined}
      aria-describedby={isFull ? "connect-capacity-hint" : undefined}
      onClick={() => void onConnectClick()}
      className={cn(
        "h-12 w-full rounded-lg text-sm font-semibold uppercase tracking-wide",
        isFull &&
          "cursor-not-allowed opacity-50 hover:bg-[#007AFF] hover:opacity-50 dark:hover:bg-[#0A84FF]",
      )}
    >
      <UserPlus className="h-4 w-4" aria-hidden />
      {searching ? "Searching…" : "LET'S CONNECT"}
    </Button>
  );
}
