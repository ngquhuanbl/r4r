"use client";

import { Sparkles } from "lucide-react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
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
  const isFull = slotsAvailable <= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connection capacity</DialogTitle>
          <p className="text-xs text-muted-foreground">{planName}</p>
        </DialogHeader>

        <div className="space-y-4 text-sm text-muted-foreground">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-[8px] bg-muted px-3 py-3 text-center">
              <p className="text-[22px] font-medium tabular-nums text-foreground">
                {slotsTotal}
              </p>
              <p className="text-[11px] text-muted-foreground">Total slots</p>
            </div>
            <div className="rounded-[8px] bg-muted px-3 py-3 text-center">
              <p className="text-[22px] font-medium tabular-nums text-foreground">
                {slotsUsed}
              </p>
              <p className="text-[11px] text-muted-foreground">In use</p>
            </div>
            <div
              className={isFull
                ? "rounded-[8px] bg-destructive/10 px-3 py-3 text-center"
                : "rounded-[8px] bg-emerald-500/15 px-3 py-3 text-center"}
            >
              <p
                className={isFull
                  ? "text-[22px] font-medium tabular-nums text-destructive"
                  : "text-[22px] font-medium tabular-nums text-emerald-700 dark:text-emerald-300"}
              >
                {slotsAvailable}
              </p>
              <p
                className={isFull
                  ? "text-[11px] text-destructive/80"
                  : "text-[11px] text-emerald-700/80 dark:text-emerald-300/80"}
              >
                Available
              </p>
            </div>
          </div>

          <p className="text-xs leading-[1.6] text-muted-foreground">
            Each slot represents one active review exchange. A slot is occupied
            on both businesses when a match is made — whether you requested it
            or another business matched with you.
          </p>

          <div className={isFull
            ? "flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2"
            : "flex items-start gap-2 rounded-md bg-emerald-500/15 px-3 py-2"}>
            {isFull ? (
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                aria-hidden
              />
            ) : (
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300"
                aria-hidden
              />
            )}
            <div className="space-y-1">
              <p className={isFull
                ? "text-sm font-medium text-destructive"
                : "text-sm font-medium text-emerald-700 dark:text-emerald-300"}>
                {isFull ? "All slots in use" : "Ready to connect"}
              </p>
              <p className={isFull
                ? "text-sm text-destructive/80"
                : "text-sm text-emerald-700/80 dark:text-emerald-300/80"}>
                {isFull
                  ? "Upgrade your plan to take on more review exchanges."
                  : "You have open slots and can take on new review exchanges."}
              </p>
            </div>
          </div>

          <p className="text-xs leading-[1.6] text-muted-foreground">
            To free a slot, complete the review work on a connection. Check the{" "}
            <span className="font-medium text-foreground">Outgoing</span> tab
            for pending tasks.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!atMaxTier ? (
            <Button
              type="button"
              variant="ocean"
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
