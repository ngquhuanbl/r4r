"use client";

import { AlertTriangle, Info, SparkleIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Tables } from "@/types/database";
import type { UserId } from "@/types/shared";
import {
  getTierNameFromBillingData,
  TIER_LABELS,
  TIER_MOMENTUM,
  TIER_SLOT_LIMIT,
  TIER_STARTER,
} from "@/lib/billing/tiers";

import { ConnectionCapacityInfoDialog } from "./connection-capacity-info-dialog";
import { ManageSubscriptionDialog } from "@/components/billing/manage-subscription-dialog";
import { ConnectionMatchButton } from "./connection-match-button";

type CapacityState = "full" | "low" | "ok";

/** Classifies capacity state so visuals can reflect urgency. */
function getCapacityState(
  slotsTotal: number,
  slotsAvailable: number,
): CapacityState {
  if (slotsTotal <= 0) return "ok";
  if (slotsAvailable <= 0) return "full";
  if (slotsAvailable / slotsTotal < 0.5) return "low";
  return "ok";
}

interface ConnectionCapacityClientProps {
  userId: UserId;
  businessId: number;
  businessName: string;
  billingData: Tables<"business_billing"> | null;
  subscriptionPeriodEnd: string | null;
}

/** Renders capacity usage, matching CTA, and upgrade entry points for a business workspace. */
export function ConnectionCapacityClient({
  userId,
  businessId,
  businessName,
  billingData,
  subscriptionPeriodEnd,
}: ConnectionCapacityClientProps) {
  //
  // PROPS
  //
  /** Current active draft-review slots consumed by this business. */
  const slotsUsed = billingData?.slots_used ?? 0;
  /** Maximum simultaneous draft-review slots allowed by the current plan. */
  const slotsTotal = billingData?.slot_limit ?? TIER_SLOT_LIMIT[TIER_STARTER];
  /** Remaining slots available to open new connection matches. */
  const slotsAvailable = Math.max(0, slotsTotal - slotsUsed);
  /** True when no additional match can be opened without changing capacity. */
  const isFull = slotsAvailable <= 0;
  /** Visual severity for usage bar and warning treatment. */
  const capacityState = getCapacityState(slotsTotal, slotsAvailable);
  /** Fill percentage for used-slot progress semantics. */
  const usedSlotsProgressPct =
    slotsTotal > 0 ? Math.min(100, (slotsUsed / slotsTotal) * 100) : 0;
  /** Human-readable usage label shown beside total capacity. */
  const slotUsedLabel = `${slotsUsed} slot${slotsUsed === 1 ? "" : "s"} used`;
  /** Billing tier used by dialogs and upgrade affordances. */
  const currentTierName = getTierNameFromBillingData(billingData);
  /** Whether upgrades should be suppressed because highest tier is active. */
  const atMaxTier = currentTierName === TIER_MOMENTUM;
  /** Signals when informational dialog should emphasize plan expansion. */
  const suggestUpgrade =
    isFull || (slotsTotal > 0 && slotsAvailable / slotsTotal < 0.5);

  //
  // STATE
  //
  const router = useRouter();
  /** Controls plan-selection modal visibility. */
  const [shouldOpenUpgradeDialog, setShouldOpenUpgradeDialog] = useState(false);
  /** Controls the capacity explainer modal visibility. */
  const [shouldOpenCapacityInfoDialog, setShouldOpenCapacityInfoDialog] =
    useState(false);
  /** Temporary highlight when capacity becomes full to draw attention. */
  const [shouldShowCapacityAttention, setShouldShowCapacityAttention] = useState(false);

  //
  // REFS
  //
  /** Focus target used when redirecting users to capacity details. */
  const capacitySectionRef = useRef<HTMLDivElement>(null);
  /** Stores active timeout for clearing temporary capacity attention state. */
  const attentionTimeoutRef = useRef<number | null>(null);
  /** Tracks prior full-state so transitions into full can be detected. */
  const wasFullRef = useRef<boolean | null>(null);

  //
  // EVENTS
  //
  /** Handler for sending focus to the capacity section when CTA is blocked by full usage. */
  function focusCapacitySection() {
    const el = capacitySectionRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      el.focus({ preventScroll: true });
    }, 350);
  }

  //
  // EFFECTS
  //
  /** Triggers a brief attention ring when capacity transitions into a full state. */
  useEffect(() => {
    const wasFull = wasFullRef.current;
    if (isFull && wasFull !== true) {
      if (attentionTimeoutRef.current) {
        clearTimeout(attentionTimeoutRef.current);
      }
      setShouldShowCapacityAttention(true);
      attentionTimeoutRef.current = window.setTimeout(() => {
        setShouldShowCapacityAttention(false);
        attentionTimeoutRef.current = null;
      }, 2600);
    }
    wasFullRef.current = isFull;
  }, [isFull]);

  /** Cleans up pending timers when this section unmounts. */
  useEffect(() => {
    return () => {
      if (attentionTimeoutRef.current) {
        clearTimeout(attentionTimeoutRef.current);
      }
    };
  }, []);

  //
  // RENDER
  //
  return (
    <>
      <ConnectionMatchButton
        userId={userId}
        businessId={businessId}
        isFull={isFull}
        onFullClick={focusCapacitySection}
        onMatched={() => router.refresh()}
      />

      <div
        ref={capacitySectionRef}
        id="business-connection-capacity"
        tabIndex={-1}
        className={cn(
          "animate-in rounded-xl border-[0.5px] border-border bg-card p-3 shadow-sm outline-none transition-[box-shadow,ring] duration-300",
          shouldShowCapacityAttention
            ? "z-[1] ring-4 ring-red-500/70 ring-offset-2 ring-offset-background dark:ring-red-400/60"
            : "",
        )}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">
                Connection capacity
              </p>
              <button
                type="button"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-transparent text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Learn about connection capacity"
                onClick={() => setShouldOpenCapacityInfoDialog(true)}
              >
                <Info className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShouldOpenUpgradeDialog(true)}
              className="inline-flex shrink-0 items-center rounded-md border border-border bg-transparent px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted/60"
            >
              <SparkleIcon className="h-4 w-4 mr-1" aria-hidden />
              Upgrade
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Progress
              value={usedSlotsProgressPct}
              className="h-[5px] flex-1 bg-muted/70"
              indicatorClassName={cn(
                capacityState === "full"
                  ? "bg-destructive"
                  : capacityState === "low"
                    ? "bg-amber-500"
                    : "bg-emerald-600",
              )}
            />
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-transparent text-[11px] font-medium text-foreground">
              {slotsUsed}/{slotsTotal}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-medium text-foreground">{slotUsedLabel}</span>
            <span className="text-muted-foreground">{slotsTotal} total</span>
          </div>

          {isFull ? (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              <span>All slots in use. Upgrade to add more connections.</span>
            </div>
          ) : null}
        </div>
      </div>

      <ConnectionCapacityInfoDialog
        open={shouldOpenCapacityInfoDialog}
        onOpenChange={setShouldOpenCapacityInfoDialog}
        planName={TIER_LABELS[currentTierName]}
        slotsTotal={slotsTotal}
        slotsUsed={slotsUsed}
        slotsAvailable={slotsAvailable}
        suggestUpgrade={suggestUpgrade}
        atMaxTier={atMaxTier}
        onManageSubscription={() => setShouldOpenUpgradeDialog(true)}
      />

      <ManageSubscriptionDialog
        open={shouldOpenUpgradeDialog}
        onOpenChange={setShouldOpenUpgradeDialog}
        businessId={businessId}
        businessName={businessName}
        currentTier={currentTierName}
        subscriptionPeriodEnd={subscriptionPeriodEnd}
      />
    </>
  );
}
