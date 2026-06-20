"use client";

import {
  Check,
  Crown,
  Leaf,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { changeBusinessTier } from "@/app/(protected)/billing/actions";
import { stripeErrorToUserMessage } from "@/lib/billing/stripe-errors";
import {
  TIER_FEATURES,
  TIER_LABELS,
  TIER_MONTHLY_USD,
  TIER_ORDER,
  TIER_MOMENTUM,
  TIER_SLOT_LIMIT,
  TIER_STARTER,
  TIER_TAGLINE,
  TIER_VELOCITY,
  type BillingTier,
} from "@/lib/billing/tiers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const TIER_ICONS = {
  [TIER_STARTER]: Leaf,
  [TIER_VELOCITY]: Zap,
  [TIER_MOMENTUM]: Crown,
} as const;

type Props = {
  open: boolean;
  onOpenChange: (_open: boolean) => void;
  businessId: number;
  businessName: string;
  currentTier: BillingTier;
  subscriptionPeriodEnd: string | null;
};

export function ManageSubscriptionDialog({
  open,
  onOpenChange,
  businessId,
  businessName,
  currentTier,
  subscriptionPeriodEnd,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const nextRenewalLabel = subscriptionPeriodEnd
    ? new Date(subscriptionPeriodEnd).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const switchTier = async (tier: BillingTier) => {
    if (tier === currentTier) return;
    setPending(true);
    try {
      const res = await changeBusinessTier(businessId, tier);
      if (!res.ok) {
        toast.error("Could not change plan", { description: res.error });
        return;
      }
      toast.success("Subscription updated.");
      router.refresh();
      onOpenChange(false);
    } catch (e) {
      toast.error("Could not change plan", {
        description: stripeErrorToUserMessage(e),
        duration: 60000,
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92vh,760px)] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Choose a plan</DialogTitle>
          <DialogDescription>
            <span className="block text-xs text-muted-foreground">
              {businessName}
            </span>
            <span className="mt-1 block">
              Compare tiers and switch plans. One payment method applies to all
              businesses on your account.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {TIER_ORDER.map((tier) => {
            const isCurrent = tier === currentTier;
            const Icon = TIER_ICONS[tier];
            const isUpgrade = tier > currentTier;
            const isVelocity = tier === TIER_VELOCITY;
            return (
              <div
                key={tier}
                className={cn(
                  "relative overflow-hidden rounded-xl border-[0.5px] p-4 shadow-sm transition-all duration-300",
                  isCurrent
                    ? "bg-muted/40 border-border"
                    : "bg-card hover:-translate-y-0.5 hover:shadow-md",
                  isVelocity && !isCurrent && "border-2 border-primary/70",
                )}
              >
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Icon
                        className={cn(
                          "h-5 w-5 shrink-0",
                          tier === TIER_VELOCITY && "text-primary",
                          tier === TIER_MOMENTUM &&
                            "text-violet-500 dark:text-violet-300",
                        )}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold tracking-tight text-foreground">
                            {TIER_LABELS[tier]}
                          </h3>
                          {isVelocity ? (
                            <span
                              className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                            >
                              Popular
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
                          {TIER_MONTHLY_USD[tier] === 0 ? (
                            <span className="text-[18px] font-medium tabular-nums text-foreground">
                              Free
                            </span>
                          ) : (
                            <>
                              <span className="text-[18px] font-medium tabular-nums text-foreground">
                                ${TIER_MONTHLY_USD[tier]}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                /month
                              </span>
                            </>
                          )}
                          <span className="rounded-md bg-background/60 px-2 py-0.5 text-xs font-medium text-muted-foreground ring-1 ring-border/80">
                            {TIER_SLOT_LIMIT[tier]} connection
                            {TIER_SLOT_LIMIT[tier] === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {TIER_TAGLINE[tier]}
                    </p>
                    <ul className="space-y-2">
                      {TIER_FEATURES[tier].map((f) => (
                        <li
                          key={f}
                          className="flex gap-2 text-xs leading-snug text-muted-foreground"
                        >
                          <Check
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                            aria-hidden
                          />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end sm:pt-1">
                    {isCurrent ? (
                      <Badge
                        variant="secondary"
                        size="md"
                        className="border-0 bg-primary/10 px-2.5 py-1 text-primary"
                      >
                        Current plan
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        variant={isVelocity ? "ocean" : "outline"}
                        disabled={pending}
                        onClick={() => void switchTier(tier)}
                      >
                        {isUpgrade ? "Upgrade" : "Switch"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          Upgrades are effective immediately (Stripe may charge a prorated
          difference). Downgrades to a lower paid tier apply on the next cycle
          when configured in Stripe; canceling to{" "}
          {TIER_LABELS[TIER_STARTER]} removes this business&apos;s paid item.
          {nextRenewalLabel
            ? ` Next renewal: ${nextRenewalLabel}.`
            : null}
        </p>

        <div className="flex flex-col gap-2 border-t pt-4">
          {currentTier !== TIER_STARTER ? (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={pending}
              onClick={() => void switchTier(TIER_STARTER)}
            >
              Cancel subscription (revert to {TIER_LABELS[TIER_STARTER]})
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
