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
import { useState } from "react";

import { Platform } from "@/components/dashboard/Platform";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DASHBOARD_PRIMARY_BUTTON_CLASSNAME } from "@/components/dashboard/locations/constants";
import { cn } from "@/lib/utils";
import { Paths } from "@/constants/paths";
import type { BusinessBillingSidebarContext } from "@/app/(protected)/business/[id]/actions";
import type { FetchedBusiness } from "@/types/dashboard";
import { sortPlatformsBySpec } from "@/components/my-business/create-business/sort-platforms";
import { useAppSelector } from "@/lib/redux/hooks";
import { platformsSelectors } from "@/lib/redux/slices/platform";
import { ManageSubscriptionDialog } from "@/components/billing/manage-subscription-dialog";
import {
  TIER_MOMENTUM,
  TIER_SLOT_LIMIT,
  TIER_STARTER,
  type BillingTier,
} from "@/lib/billing/tiers";

import { EditBusinessProfileDialog } from "./edit-business-profile-dialog";
import { ReviewSnapshotChart } from "./review-snapshot-chart";
import type { BusinessReviewSnapshot } from "@/types/business-page";

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

export function BusinessLeftPanel({
  business,
  snapshot,
  billingContext,
  ctaState = "ready",
  onBusinessUpdated,
}: {
  business: FetchedBusiness;
  snapshot: BusinessReviewSnapshot;
  billingContext: BusinessBillingSidebarContext;
  ctaState?: ConnectCtaState;
  onBusinessUpdated?: () => void;
}) {
  const platformList = useAppSelector(platformsSelectors.selectData);
  const ordered = sortPlatformsBySpec(platformList);
  const cover = business.cover_image_url;

  const { businessBilling, subscriptionPeriodEnd, slotsUsed } = billingContext;
  const slotsTotal =
    businessBilling?.slot_limit ?? TIER_SLOT_LIMIT[TIER_STARTER];
  const progressPct =
    slotsTotal > 0 ? Math.min(100, (slotsUsed / slotsTotal) * 100) : 0;
  const nextRenewalLabel = subscriptionPeriodEnd
    ? new Date(subscriptionPeriodEnd).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const currentTier = tierFromBilling(businessBilling);
  const atMaxTier = currentTier === TIER_MOMENTUM;

  const ctaLabel =
    ctaState === "searching"
      ? "Searching…"
      : ctaState === "connected"
        ? "Connected"
        : "LET'S CONNECT";

  const ctaDisabled = ctaState === "connected" || ctaState === "searching";

  const [capacityOpen, setCapacityOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Link
        href={Paths.DASHBOARD}
        className="inline-flex w-max items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
            return <Platform key={p.id} name={p.name} />;
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

      <Button
        type="button"
        size="lg"
        disabled={ctaDisabled}
        className={cn(
          "h-12 w-full rounded-lg text-sm font-semibold uppercase tracking-wide",
          DASHBOARD_PRIMARY_BUTTON_CLASSNAME,
        )}
      >
        <UserPlus className="h-4 w-4" aria-hidden />
        {ctaLabel}
      </Button>

      <div className="animate-in relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.09] via-card/80 to-violet-500/[0.07] p-3 shadow-sm ring-1 ring-primary/10 dark:border-primary/25 dark:from-primary/[0.12] dark:via-card/60 dark:to-violet-500/10 dark:ring-primary/15">
        <div
          className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-amber-400/25 to-primary/20 blur-2xl dark:from-amber-400/15"
          aria-hidden
        />
        <div className="relative space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary/90">
              Connection capacity
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/80 bg-background/80 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:border-primary/30 hover:text-foreground"
                    aria-label="About connection capacity"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs" side="left">
                  Each slot allows 1 active review exchange at a time. Upgrade
                  for higher throughput.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Progress
              value={progressPct}
              className="h-2.5 flex-1 bg-primary/15 shadow-inner"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
              <span className="font-medium tabular-nums text-foreground">
                {slotsUsed}
                <span className="font-normal text-muted-foreground">
                  /{slotsTotal}
                </span>
              </span>
              <span className="text-muted-foreground">active connections</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                Ready
              </span>
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
        onUpdatedData={() => {
          onBusinessUpdated?.();
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
