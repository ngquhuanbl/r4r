"use client";

import { useState } from "react";
import { toast } from "sonner";

import { changeBusinessTier } from "@/app/(protected)/billing/actions";
import {
  TIER_FEATURES,
  TIER_LABELS,
  TIER_MONTHLY_USD,
  TIER_ORDER,
  TIER_STARTER,
  TIER_TAGLINE,
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: number;
  businessName: string;
  currentTier: BillingTier;
  nextRenewalLabel: string | null;
};

export function ManageSubscriptionDialog({
  open,
  onOpenChange,
  businessId,
  businessName,
  currentTier,
  nextRenewalLabel,
}: Props) {
  const [pending, setPending] = useState(false);

  const switchTier = async (tier: BillingTier) => {
    if (tier === currentTier) return;
    setPending(true);
    try {
      const res = await changeBusinessTier(businessId, tier);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Subscription updated.");
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92vh,720px)] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage subscription: {businessName}</DialogTitle>
          <DialogDescription>
            Compare tiers and switch plans. One payment method applies to all
            businesses on your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {TIER_ORDER.map((tier) => {
            const isCurrent = tier === currentTier;
            return (
              <div
                key={tier}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  isCurrent ? "border-primary bg-muted/30" : "border-border",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {TIER_LABELS[tier].toUpperCase()}
                      {TIER_MONTHLY_USD[tier] === 0 ? (
                        <span className="text-muted-foreground"> (FREE)</span>
                      ) : (
                        <span className="text-muted-foreground">
                          {" "}
                          (${TIER_MONTHLY_USD[tier]}/mo)
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {TIER_TAGLINE[tier]}
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {TIER_FEATURES[tier].map((f) => (
                        <li key={f}>• {f}</li>
                      ))}
                    </ul>
                  </div>
                  {isCurrent ? (
                    <Badge variant="secondary">Current plan</Badge>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => void switchTier(tier)}
                    >
                      {tier > currentTier ? "Upgrade" : "Switch to this plan"}
                    </Button>
                  )}
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
