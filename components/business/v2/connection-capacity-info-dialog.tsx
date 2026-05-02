"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  slotsTotal: number;
  slotsUsed: number;
  slotsAvailable: number;
  /** True when at capacity or fewer than half of slots remain available. */
  suggestUpgrade: boolean;
  atMaxTier: boolean;
  /** Opens subscription management (same flow as the capacity card Upgrade button). */
  onManageSubscription: () => void;
};

type CapacityVariant = "full" | "low" | "ok";

function capacityVariantFromSlots(
  slotsTotal: number,
  slotsAvailable: number,
): CapacityVariant {
  if (slotsTotal <= 0) return "ok";
  if (slotsAvailable <= 0) return "full";
  if (slotsAvailable / slotsTotal < 0.5) return "low";
  return "ok";
}

/** Badge visuals + one-line interpretation (no upgrade / Outgoing — those appear once below). */
const CAPACITY_STATUS: Record<
  CapacityVariant,
  { label: string; badgeClass: string; interpretation: string }
> = {
  ok: {
    label: "Ready",
    badgeClass:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
    interpretation:
      "Ready means you still have open slots, so you can take on new review exchanges for this location.",
  },
  low: {
    label: "Limited",
    badgeClass:
      "bg-amber-50 text-amber-800 dark:bg-amber-950/45 dark:text-amber-200",
    interpretation:
      "Limited means fewer than half of your plan slots are still available.",
  },
  full: {
    label: "Full",
    badgeClass:
      "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
    interpretation:
      "Full means every slot on your plan is tied up by active exchanges—you cannot start another until one frees up.",
  },
};

export function ConnectionCapacityInfoDialog({
  open,
  onOpenChange,
  planName,
  slotsTotal,
  slotsUsed,
  slotsAvailable,
  suggestUpgrade,
  atMaxTier,
  onManageSubscription,
}: Props) {
  const openPlans = () => {
    onOpenChange(false);
    onManageSubscription();
  };

  const capVariant = capacityVariantFromSlots(slotsTotal, slotsAvailable);
  const status = CAPACITY_STATUS[capVariant];

  const upgradeOrTierNote =
    suggestUpgrade && !atMaxTier ? (
      <>
        {" "}
        If you often run tight on slots, consider {" "}
        <span className="font-medium text-foreground">Upgrade for more slots</span>{" "}
        to add capacity.
      </>
    ) : suggestUpgrade && atMaxTier ? (
      <>
        {" "}
        You&apos;re already on the highest plan — freeing slots only happens when
        exchanges finish or close.
      </>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connection capacity</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            Each slot on your plan is one concurrent review exchange with another
            business. The table is scoped to this business and your current plan.
          </p>

          <ul className="list-none space-y-2 rounded-lg border border-border bg-muted/40 p-3 text-foreground">
            <li className="flex justify-between gap-3">
              <span className="text-muted-foreground">Current plan</span>
              <span className="text-right font-medium">{planName}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-muted-foreground">Slots on plan</span>
              <span className="font-medium tabular-nums">{slotsTotal}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-muted-foreground">In use</span>
              <span className="font-medium tabular-nums">{slotsUsed}</span>
            </li>
            <li className="flex justify-between gap-3">
              <span className="text-muted-foreground">Available</span>
              <span className="font-medium tabular-nums">{slotsAvailable}</span>
            </li>
          </ul>

          <section
            className="rounded-lg border border-border bg-muted/35 p-3"
            aria-labelledby="capacity-status-heading"
          >
            <p
              id="capacity-status-heading"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Your current capacity status
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                  status.badgeClass,
                )}
              >
                {status.label}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <span className="text-foreground">{status.interpretation}</span>
            </p>
          </section>

          <p className="leading-relaxed">
            To free a slot, complete the review work linked to that
            connection. On this page, open the{" "}
            <span className="font-medium text-foreground">Outgoing</span> tab for
            tasks still waiting on you related to your connections.
            <br />
            {upgradeOrTierNote}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!atMaxTier ? (
            <Button
              type="button"
              className="gap-2 bg-gradient-to-r from-sky-600 via-primary to-cyan-600 text-primary-foreground shadow-md hover:brightness-110 dark:from-sky-500 dark:via-primary dark:to-cyan-500"
              onClick={openPlans}
            >
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
              {suggestUpgrade ? "Upgrade for more slots" : "Manage subscription"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
