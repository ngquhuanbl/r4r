"use client";

import {
  type LucideIcon,
  Check,
  Crown,
  Leaf,
  Sparkles,
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

const TIER_VISUAL: Record<
  BillingTier,
  {
    Icon: LucideIcon;
    card: string;
    orb: string;
    iconWrap: string;
    highlight?: string;
  }
> = {
  [TIER_STARTER]: {
    Icon: Leaf,
    card: "border-slate-400/25 bg-gradient-to-br from-slate-500/[0.08] via-card/90 to-slate-500/[0.04] dark:border-slate-500/30 dark:from-slate-500/[0.12]",
    orb: "from-emerald-400/20 to-slate-400/10",
    iconWrap:
      "border-slate-400/30 bg-slate-500/10 text-slate-700 dark:text-slate-200",
  },
  [TIER_VELOCITY]: {
    Icon: Zap,
    card: "border-sky-500/35 bg-gradient-to-br from-sky-500/[0.14] via-card/90 to-primary/[0.08] dark:border-sky-400/25 dark:from-sky-500/[0.18]",
    orb: "from-sky-400/30 to-primary/20",
    iconWrap:
      "border-sky-500/40 bg-sky-500/15 text-sky-800 dark:text-sky-200",
    highlight: "Popular",
  },
  [TIER_MOMENTUM]: {
    Icon: Crown,
    card: "border-violet-500/40 bg-gradient-to-br from-violet-500/[0.16] via-card/90 to-amber-500/[0.08] dark:border-violet-400/35 dark:from-violet-500/[0.2]",
    orb: "from-violet-400/25 to-amber-400/20",
    iconWrap:
      "border-violet-500/45 bg-gradient-to-br from-violet-500/20 to-amber-500/15 text-violet-900 dark:text-violet-100",
    highlight: "Full power",
  },
};

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
  const router = useRouter();
  const [pending, setPending] = useState(false);

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
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92vh,760px)] max-w-lg overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Manage subscription: {businessName}</DialogTitle>
          <DialogDescription>
            Compare tiers and switch plans. One payment method applies to all
            businesses on your account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {TIER_ORDER.map((tier) => {
            const isCurrent = tier === currentTier;
            const visual = TIER_VISUAL[tier];
            const { Icon, highlight } = visual;
            const isUpgrade = tier > currentTier;
            return (
              <div
                key={tier}
                className={cn(
                  "relative overflow-hidden rounded-xl border p-4 shadow-sm transition-all duration-300",
                  visual.card,
                  isCurrent
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background dark:ring-offset-background"
                    : "hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md",
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-gradient-to-br opacity-90 blur-2xl",
                    visual.orb,
                  )}
                  aria-hidden
                />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-sm",
                          visual.iconWrap,
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold tracking-tight text-foreground">
                            {TIER_LABELS[tier]}
                          </h3>
                          {highlight ? (
                            <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary shadow-sm ring-1 ring-primary/20">
                              {highlight}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-baseline gap-2">
                          {TIER_MONTHLY_USD[tier] === 0 ? (
                            <span className="text-2xl font-bold tabular-nums text-foreground">
                              Free
                            </span>
                          ) : (
                            <>
                              <span className="text-2xl font-bold tabular-nums text-foreground">
                                ${TIER_MONTHLY_USD[tier]}
                              </span>
                              <span className="text-sm font-medium text-muted-foreground">
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
                          className="flex gap-2 text-sm leading-snug text-foreground/90"
                        >
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
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
                        className="gap-1 border border-primary/25 bg-primary/10 px-2.5 py-1 text-primary"
                      >
                        <Sparkles className="h-3 w-3" aria-hidden />
                        Current plan
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() => void switchTier(tier)}
                        className={cn(
                          "min-w-[9.5rem] font-semibold transition-all duration-300",
                          isUpgrade
                            ? "border-0 bg-gradient-to-r from-sky-600 via-primary to-cyan-600 text-primary-foreground shadow-md hover:scale-[1.02] hover:shadow-lg hover:brightness-110 active:scale-[0.98] dark:from-sky-500 dark:via-primary dark:to-cyan-500"
                            : "border-border/80 bg-background/90 shadow-sm hover:border-primary/30 hover:bg-muted/80",
                        )}
                      >
                        {isUpgrade ? "Upgrade" : "Switch plan"}
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
