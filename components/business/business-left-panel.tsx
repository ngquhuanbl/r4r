"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  Info,
  Pencil,
  Sparkles,
  UserPlus,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { startConnectionMatch } from "@/app/(protected)/(workspace)/business/[id]/connection-actions";
import { Platform } from "@/components/shared/platform";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Paths } from "@/constants/paths";
import type { BusinessBillingSidebarContext } from "@/app/(protected)/(workspace)/business/[id]/actions";
import { buildMatchFeedback } from "@/lib/connections/match-feedback";
import type { FetchedBusiness } from "@/types/dashboard";
import { sortPlatformsBySpec } from "@/components/business/create-business/sort-platforms";
import { useAppSelector } from "@/lib/redux/hooks";
import { platformsSelectors } from "@/lib/redux/slices/platform";
import { ManageSubscriptionDialog } from "@/components/billing/manage-subscription-dialog";
import {
  TIER_LABELS,
  TIER_MOMENTUM,
  TIER_SLOT_LIMIT,
  TIER_STARTER,
  type BillingTier,
} from "@/lib/billing/tiers";

import { ConnectionCapacityInfoDialog } from "./connection-capacity-info-dialog";
import { EditBusinessProfileDialog } from "./edit-business-profile-dialog";
import { ReviewSnapshotChart } from "./review-snapshot-chart";
import type { BusinessReviewSnapshot } from "@/types/business-page";
import type { UserId } from "@/types/shared";

import fallbackLight from "@/public/dashboard/fallback_business_avatar.png";
import fallbackDark from "@/public/dashboard/fallback_business_avatar--dark.png";

function formatPhone(phone: string | null) {
  if (!phone) return "—";
  return phone;
}

export type ConnectCtaState = "ready" | "searching" | "connected" | "full";

function tierFromBilling(
  billing: BusinessBillingSidebarContext["businessBilling"],
): BillingTier {
  if (!billing) return TIER_STARTER;
  return billing.tier as BillingTier;
}

type CapacityVariant = "full" | "low" | "ok";

function capacityVariant(
  slotsTotal: number,
  slotsAvailable: number,
): CapacityVariant {
  if (slotsTotal <= 0) return "ok";
  if (slotsAvailable <= 0) return "full";
  if (slotsAvailable / slotsTotal < 0.5) return "low";
  return "ok";
}

const CAPACITY_STYLES: Record<
  CapacityVariant,
  {
    card: string;
    glow: string;
    ring: string;
    title: string;
    progressTrack: string;
    progressIndicator: string;
    infoBtn: string;
  }
> = {
  ok: {
    card:
      "border-primary/20 bg-gradient-to-br from-primary/[0.09] via-card/80 to-violet-500/[0.07] dark:border-primary/25 dark:from-primary/[0.12] dark:via-card/60 dark:to-violet-500/10",
    glow: "from-amber-400/25 to-primary/20 dark:from-amber-400/15",
    ring: "ring-primary/10 dark:ring-primary/15",
    title: "text-primary/90",
    progressTrack: "bg-emerald-600/15 dark:bg-emerald-500/20",
    progressIndicator: "bg-emerald-600 dark:bg-emerald-500",
    infoBtn:
      "border-border/80 bg-background/80 text-muted-foreground hover:border-primary/30 hover:text-foreground",
  },
  low: {
    card:
      "border-amber-300/70 bg-gradient-to-br from-amber-500/[0.12] via-card/85 to-amber-600/[0.06] dark:border-amber-800/60 dark:from-amber-500/[0.14] dark:via-card/60 dark:to-amber-950/30",
    glow: "from-amber-400/35 to-amber-600/20 dark:from-amber-500/20",
    ring: "ring-amber-400/20 dark:ring-amber-700/25",
    title: "text-amber-900 dark:text-amber-200",
    progressTrack: "bg-amber-500/25 dark:bg-amber-500/15",
    progressIndicator: "bg-amber-500 dark:bg-amber-400",
    infoBtn:
      "border-amber-300/80 bg-background/90 text-amber-900 hover:border-amber-500 hover:text-amber-950 dark:border-amber-800 dark:text-amber-100 dark:hover:border-amber-600",
  },
  full: {
    card:
      "border-red-300/80 bg-gradient-to-br from-red-500/[0.1] via-card/85 to-red-900/[0.05] dark:border-red-900/55 dark:from-red-500/[0.12] dark:via-card/55 dark:to-red-950/35",
    glow: "from-red-400/30 to-red-600/20 dark:from-red-500/18",
    ring: "ring-red-400/15 dark:ring-red-900/30",
    title: "text-red-900 dark:text-red-200",
    progressTrack: "bg-red-500/20 dark:bg-red-500/15",
    progressIndicator: "bg-red-600 dark:bg-red-500",
    infoBtn:
      "border-red-300/80 bg-background/90 text-red-900 hover:border-red-500 hover:text-red-950 dark:border-red-900 dark:text-red-100 dark:hover:border-red-700",
  },
};

const CAPACITY_BADGE_TOOLTIP_CONTENT_CLASS =
  "max-w-[min(15rem,calc(100vw-2rem))] flex-col items-stretch gap-0 px-3 py-2.5 text-left text-xs leading-snug";

function CapacityStatusBadgeTooltip({ variant }: { variant: CapacityVariant }) {
  const label =
    variant === "full" ? "Full" : variant === "low" ? "Limited" : "Ready";
  const badgeClass =
    variant === "full"
      ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
      : variant === "low"
        ? "bg-amber-50 text-amber-800 dark:bg-amber-950/45 dark:text-amber-200"
        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400";

  const tooltip =
    variant === "ok"
      ? {
          title: "Slots available",
          body: (
            <>
              You can accept new connections here. Each slot is one live
              exchange.
            </>
          ),
        }
      : variant === "full"
        ? {
            title: "At capacity",
            body: (
              <>
                Every plan slot is in use. Finish a connection or upgrade to
                open more.
              </>
            ),
          }
        : {
            title: "Limited capacity",
            body: (
              <>
                Fewer than half of your plan slots are still free. Finish
                exchanges or upgrade so you don&apos;t run out.
              </>
            ),
          };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex cursor-default items-center rounded-full px-2 py-0.5 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              badgeClass,
            )}
            tabIndex={0}
          >
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className={CAPACITY_BADGE_TOOLTIP_CONTENT_CLASS}>
          <div className="flex flex-col gap-1">
            <p className="font-semibold leading-tight text-background">
              {tooltip.title}
            </p>
            <p className="text-[11px] leading-relaxed text-background/80">
              {tooltip.body}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function BusinessLeftPanel({
  userId,
  business,
  snapshot,
  billingContext,
  onBusinessUpdated,
  onConnectionMatchFound,
}: {
  userId: UserId;
  business: FetchedBusiness;
  snapshot: BusinessReviewSnapshot;
  billingContext: BusinessBillingSidebarContext;
  /** Local business metadata update after profile edits. */
  onBusinessUpdated?: (updatedBusiness: FetchedBusiness) => void;
  /** After a successful connection match: apply post-match local updates. */
  onConnectionMatchFound?: (payload: { slotsDelta: number }) => void;
}) {
  const platformList = useAppSelector(platformsSelectors.selectData);
  const ordered = sortPlatformsBySpec(platformList);
  const cover = business.cover_image_url;

  const { businessBilling, subscriptionPeriodEnd, slotsUsed } = billingContext;
  const slotsTotal =
    businessBilling?.slot_limit ?? TIER_SLOT_LIMIT[TIER_STARTER];
  const slotsAvailable = Math.max(0, slotsTotal - slotsUsed);
  /** Bar fill = share of capacity still available (100% = all slots free). */
  const availableSlotsProgressPct =
    slotsTotal > 0 ? Math.min(100, (slotsAvailable / slotsTotal) * 100) : 0;
  const nextRenewalLabel = subscriptionPeriodEnd
    ? new Date(subscriptionPeriodEnd).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const currentTier = tierFromBilling(businessBilling);
  const atMaxTier = currentTier === TIER_MOMENTUM;

  const isFull = slotsAvailable <= 0;
  const capVariant = capacityVariant(slotsTotal, slotsAvailable);
  const capUi = CAPACITY_STYLES[capVariant];
  const suggestUpgrade =
    isFull ||
    (slotsTotal > 0 && slotsAvailable / slotsTotal < 0.5);

  const [searching, setSearching] = useState(false);
  const [capacityOpen, setCapacityOpen] = useState(false);
  const [capacityInfoOpen, setCapacityInfoOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [capacityAttention, setCapacityAttention] = useState(false);
  const capacitySectionRef = useRef<HTMLDivElement>(null);
  /** Browser `setTimeout` id (avoid Node `Timeout` vs `number` mismatch). */
  const attentionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (attentionTimeoutRef.current) {
        clearTimeout(attentionTimeoutRef.current);
      }
    };
  }, []);

  const ctaLabel = searching ? "Searching…" : "LET'S CONNECT";

  const ctaDisabled = searching;

  const onConnectClick = async () => {
    if (searching) return;
    if (isFull) {
      const el = capacitySectionRef.current;
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => {
          el.focus({ preventScroll: true });
        }, 350);
      }
      if (attentionTimeoutRef.current) {
        clearTimeout(attentionTimeoutRef.current);
      }
      setCapacityAttention(true);
      attentionTimeoutRef.current = window.setTimeout(() => {
        setCapacityAttention(false);
        attentionTimeoutRef.current = null;
      }, 2600);
      return;
    }
    setSearching(true);
    try {
      const res = await startConnectionMatch(userId, business.id);
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
      onConnectionMatchFound?.({ slotsDelta: feedback.slotsDelta });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Link
        href={Paths.DASHBOARD}
        className="hidden shrink-0 md:inline-flex w-max items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back to Dashboard
      </Link>

      <div className="flex flex-col items-center gap-4 sm:items-start">
        <div className="relative w-full max-w-[200px]">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-muted">
            {cover ? (
              <Image
                src={cover}
                alt=""
                fill
                className="object-cover"
                sizes="200px"
              />
            ) : (
              <>
                <Image
                  src={fallbackLight}
                  alt=""
                  fill
                  className="object-cover dark:hidden"
                  sizes="200px"
                />
                <Image
                  src={fallbackDark}
                  alt=""
                  fill
                  className="hidden object-cover dark:block"
                  sizes="200px"
                />
              </>
            )}
            <button
              type="button"
              className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border bg-background/90 text-foreground shadow"
              aria-label="Edit business profile"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        </div>

        <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-left">
          {business.business_name}
        </h1>

        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          {ordered.map((p) => {
            const url = business.platform_urls[p.id];
            if (!url) return null;
            return <Platform key={p.id} name={p.name} href={url} />;
          })}
        </div>

        <div className="w-full space-y-2 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <span className="shrink-0" aria-hidden>
              📍
            </span>
            <span>
              {[business.address, business.city, business.state, business.zip_code]
                .filter(Boolean)
                .join(", ") || "—"}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <span className="shrink-0" aria-hidden>
              ☎
            </span>
            <span>{formatPhone(business.phone)}</span>
          </p>
        </div>
      </div>

      {isFull ? (
        <p id="connect-capacity-hint" className="sr-only">
          Your plan slots are full. Connection capacity is explained in the
          section below.
        </p>
      ) : null}
      <Button
        type="button"
        variant="ocean"
        size="lg"
        disabled={ctaDisabled}
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
        {ctaLabel}
      </Button>

      <div
        ref={capacitySectionRef}
        id="business-connection-capacity"
        tabIndex={-1}
        className={cn(
          "animate-in relative overflow-hidden rounded-xl border p-3 shadow-sm outline-none transition-[box-shadow,ring] duration-300 ring-1",
          capUi.card,
          capacityAttention
            ? "z-[1] ring-4 ring-red-500/70 ring-offset-2 ring-offset-background dark:ring-red-400/60"
            : capUi.ring,
        )}
      >
        <div
          className={cn(
            "pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-gradient-to-br blur-2xl",
            capUi.glow,
          )}
          aria-hidden
        />
        <div className="relative space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-wide",
                capUi.title,
              )}
            >
              Connection capacity
            </p>
            <button
              type="button"
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm transition-colors",
                capUi.infoBtn,
              )}
              aria-label="Learn about connection capacity"
              onClick={() => setCapacityInfoOpen(true)}
            >
              <Info className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Progress
              value={availableSlotsProgressPct}
              className={cn(
                "h-2.5 flex-1 shadow-inner [&>div]:transition-all",
                capUi.progressTrack,
              )}
              indicatorClassName={capUi.progressIndicator}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
              <span className="font-medium tabular-nums text-foreground">
                {slotsAvailable}
                <span className="font-normal text-muted-foreground">
                  {" "}
                  of {slotsTotal}
                </span>
              </span>
              <span className="text-muted-foreground">slots available</span>
              <CapacityStatusBadgeTooltip variant={capVariant} />
            </div>
            <button
              type="button"
              onClick={() => setCapacityOpen(true)}
              className={cn(
                "group relative inline-flex shrink-0 items-center gap-1.5 overflow-hidden rounded-full px-3.5 py-2 text-xs font-semibold shadow-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                atMaxTier
                  ? "border border-primary/25 bg-background/90 text-primary hover:border-primary/40 hover:bg-muted/80 dark:bg-background/50"
                  : "bg-gradient-to-r from-sky-600 via-primary to-cyan-600 text-primary-foreground shadow-primary/25 hover:scale-[1.03] hover:shadow-lg hover:brightness-110 active:scale-[0.98] dark:from-sky-500 dark:via-primary dark:to-cyan-500",
              )}
            >
              {!atMaxTier ? (
                <span
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                  aria-hidden
                />
              ) : null}
              {atMaxTier ? (
                <Zap className="relative h-3.5 w-3.5" aria-hidden />
              ) : (
                <Sparkles
                  className="relative h-3.5 w-3.5 animate-sparkle-nudge"
                  aria-hidden
                />
              )}
              <span className="relative">
                {atMaxTier ? "Your plan" : "Upgrade"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <ConnectionCapacityInfoDialog
        open={capacityInfoOpen}
        onOpenChange={setCapacityInfoOpen}
        planName={TIER_LABELS[currentTier]}
        slotsTotal={slotsTotal}
        slotsUsed={slotsUsed}
        slotsAvailable={slotsAvailable}
        suggestUpgrade={suggestUpgrade}
        atMaxTier={atMaxTier}
        onManageSubscription={() => setCapacityOpen(true)}
      />

      <ManageSubscriptionDialog
        open={capacityOpen}
        onOpenChange={setCapacityOpen}
        businessId={business.id}
        businessName={business.business_name}
        currentTier={currentTier}
        nextRenewalLabel={nextRenewalLabel}
      />
      <EditBusinessProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        data={business}
        onUpdatedData={(updated) => {
          onBusinessUpdated?.(updated);
          setEditOpen(false);
        }}
      />

      <div className="rounded-lg border border-border/60 bg-card/30 p-3">
        <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
          Performance snapshot
        </p>
        <ReviewSnapshotChart snapshot={snapshot} />
      </div>
    </div>
  );
}
