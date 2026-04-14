"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Info, Pencil, UserPlus } from "lucide-react";

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
import type { FetchedBusiness } from "@/types/dashboard";
import { sortPlatformsBySpec } from "@/components/my-business/create-business/sort-platforms";
import { useAppSelector } from "@/lib/redux/hooks";
import { platformsSelectors } from "@/lib/redux/slices/platform";

import { ReviewSnapshotChart } from "./review-snapshot-chart";
import type { BusinessReviewSnapshot } from "@/types/business-page";

import fallbackLight from "@/public/dashboard/fallback_business_avatar.png";
import fallbackDark from "@/public/dashboard/fallback_business_avatar--dark.png";

function formatPhone(phone: string | null) {
  if (!phone) return "—";
  return phone;
}

export type ConnectCtaState = "ready" | "searching" | "connected" | "full";

export function BusinessLeftPanel({
  business,
  snapshot,
  ctaState = "ready",
}: {
  business: FetchedBusiness;
  snapshot: BusinessReviewSnapshot;
  ctaState?: ConnectCtaState;
}) {
  const platformList = useAppSelector(platformsSelectors.selectData);
  const ordered = sortPlatformsBySpec(platformList);
  const cover = business.cover_image_url;

  const slotsUsed = 2;
  const slotsTotal = 5;
  const progressPct = (slotsUsed / slotsTotal) * 100;

  const ctaLabel =
    ctaState === "searching"
      ? "Searching…"
      : ctaState === "connected"
        ? "Connected"
        : "LET'S CONNECT";

  const ctaDisabled = ctaState === "connected" || ctaState === "searching";

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
              className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow border"
              aria-label="Edit business image"
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

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Progress value={progressPct} className="h-2 flex-1" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground hover:text-foreground"
                  aria-label="About connection capacity"
                >
                  <Info className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs" side="left">
                Each slot allows 1 active review exchange at a time. Upgrade for
                higher throughput.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {slotsUsed}/{slotsTotal} available connections
          </span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            Ready
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-card/30 p-3">
        <p className="mb-2 text-center text-xs font-medium text-muted-foreground">
          Performance snapshot
        </p>
        <ReviewSnapshotChart snapshot={snapshot} />
      </div>
    </div>
  );
}
