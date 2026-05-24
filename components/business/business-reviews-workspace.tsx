"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import {
  fetchIncomingReviews,
  fetchOutgoingReviews,
} from "@/app/(protected)/actions/review-actions";
import { Platform } from "@/components/dashboard/platform";
import { ViewReviewDialog } from "@/components/reviews/incoming-review-panel/view-review-dialog";
import { SubmitReviewDialog } from "@/components/business/submit-review-dialog";
import { VerifyReviewDialog } from "@/components/business/verify-review-dialog";
import { ViewOutgoingReviewDialog } from "@/components/reviews/outgoing-review-panel/view-review-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DataTable } from "@/components/ui/data-table";
import { Pulse } from "@/components/ui/pulse";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  INCOMING_REVIEWS_PAGE_SIZE,
  OUTGOING_REVIEWS_PAGE_SIZE,
  REVIEW_STATUS_FILTER_ALL_OPTION,
} from "@/constants/reviews";
import { ReviewStatusNames } from "@/constants/shared";
import { cn } from "@/lib/utils";
import type {
  IncomingReview,
  OutgoingReview,
  SubmitReviewResponse,
  UpdatedReviewStatus,
} from "@/types/dashboard";
import type { Tables } from "@/types/database";
import type { UserId } from "@/types/shared";
import { ReviewUtils } from "@/utils/review";
import { getAddress, getTotalPage } from "@/utils/shared";

import fallbackBusinessAvatarSrc from "@/public/dashboard/fallback_business_avatar.png";
import fallbackBusinessAvatarDarkSrc from "@/public/dashboard/fallback_business_avatar--dark.png";

function statusBadgeClass(name: string) {
  if (ReviewUtils.isVerifiedReviewStatus(name as any))
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
  if (ReviewUtils.isRejectedReviewStatus(name as any))
    return "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
  if (ReviewUtils.isSubmittedReviewStatus(name as any))
    return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200";
  return "border-border bg-muted text-muted-foreground";
}

function incomingLabel(statusName: string) {
  if (ReviewUtils.isDraftReviewStatus(statusName as any)) return "Wait to verify";
  if (ReviewUtils.isSubmittedReviewStatus(statusName as any))
    return "Ready to verify";
  if (ReviewUtils.isVerifiedReviewStatus(statusName as any)) return "Accepted";
  if (ReviewUtils.isRejectedReviewStatus(statusName as any)) return "Rejected";
  return statusName;
}

function outgoingLabel(statusName: string) {
  if (ReviewUtils.isDraftReviewStatus(statusName as any)) return "To submit";
  if (ReviewUtils.isSubmittedReviewStatus(statusName as any)) return "Submitted";
  if (ReviewUtils.isVerifiedReviewStatus(statusName as any)) return "Accepted";
  if (ReviewUtils.isRejectedReviewStatus(statusName as any)) return "Rejected";
  return statusName;
}

/** Filter dropdown labels — same wording as status badges per tab. */
function statusFilterOptionLabel(
  statusName: string,
  tab: "incoming" | "outgoing",
): string {
  return tab === "incoming"
    ? incomingLabel(statusName)
    : outgoingLabel(statusName);
}

function rowMuted(statusName: string) {
  return (
    ReviewUtils.isVerifiedReviewStatus(statusName as any) ||
    ReviewUtils.isRejectedReviewStatus(statusName as any)
  );
}

function incomingStatusTooltip(statusName: string): string {
  if (ReviewUtils.isDraftReviewStatus(statusName as any))
    return "The partner has not submitted their review yet. There is nothing for you to verify.";
  if (ReviewUtils.isSubmittedReviewStatus(statusName as any))
    return "Review for your business is waiting for you to verify.";
  if (ReviewUtils.isVerifiedReviewStatus(statusName as any))
    return "This review was accepted by you! Congratulations!";
  if (ReviewUtils.isRejectedReviewStatus(statusName as any))
    return "You rejected this review.";
  return `Status in our system: ${statusName}.`;
}

function outgoingStatusTooltip(statusName: string): string {
  if (ReviewUtils.isDraftReviewStatus(statusName as any))
    return "You still need to write and submit your review for this partner.";
  if (ReviewUtils.isSubmittedReviewStatus(statusName as any))
    return "Your review is submitted and waiting for the partner to verify.";
  if (ReviewUtils.isVerifiedReviewStatus(statusName as any))
    return "Your review was accepted. Thank you for your feedback!";
  if (ReviewUtils.isRejectedReviewStatus(statusName as any))
    return "Your review was rejected by the partner.";
  return `Status in our system: ${statusName}.`;
}

const REVIEW_STATUS_TOOLTIP_CONTENT_CLASS =
  "max-w-[min(18rem,calc(100vw-2rem))] text-left text-xs leading-snug";

const REVIEW_TABLE_SKELETON_ROW_COUNT = 6;

/** Matches incoming/outgoing workspace tables: Partner | Platform | Status | Action */
function ReviewsWorkspaceTableSkeleton() {
  return (
    <div
      className="overflow-x-auto rounded-md border"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading reviews…</span>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[180px]">Partner business</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[120px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: REVIEW_TABLE_SKELETON_ROW_COUNT }, (_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex min-w-[180px] items-start gap-3">
                  <Pulse className="h-10 w-10 shrink-0 rounded-md" />
                  <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
                    <Pulse className="h-4 w-36 max-w-full" />
                    <Pulse className="h-3 w-28 max-w-full" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Pulse className="h-6 w-6 rounded-full" />
              </TableCell>
              <TableCell>
                <Pulse className="h-6 w-24 rounded-full" />
              </TableCell>
              <TableCell>
                <Pulse className="h-9 w-[4.5rem] rounded-md" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ReviewPartnerAvatar({
  coverUrl,
  alt,
}: {
  coverUrl: string | null | undefined;
  alt: string;
}) {
  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={alt}
          fill
          className="object-cover"
          sizes="40px"
        />
      ) : (
        <>
          <Image
            src={fallbackBusinessAvatarSrc}
            alt=""
            fill
            className="object-cover dark:hidden"
            sizes="40px"
          />
          <Image
            src={fallbackBusinessAvatarDarkSrc}
            alt=""
            fill
            className="hidden object-cover dark:block"
            sizes="40px"
          />
        </>
      )}
    </div>
  );
}

function ReviewStatusBadgeWithTooltip({
  statusName,
  variant,
}: {
  statusName: string;
  variant: "incoming" | "outgoing";
}) {
  const label =
    variant === "incoming"
      ? incomingLabel(statusName)
      : outgoingLabel(statusName);
  const tooltip =
    variant === "incoming"
      ? incomingStatusTooltip(statusName)
      : outgoingStatusTooltip(statusName);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex cursor-default rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          tabIndex={0}
        >
          <Badge
            variant="outline"
            className={cn("font-normal", statusBadgeClass(statusName))}
          >
            {label}
          </Badge>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className={REVIEW_STATUS_TOOLTIP_CONTENT_CLASS}>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

type WorkspaceProps = {
  userId: UserId;
  businessId: Tables<"businesses">["id"];
  reviewStatuses: Tables<"review_statuses">[];
  /** After outgoing submit: refresh sidebar slot counts without a full page reload. */
  onOutgoingReviewSubmitted?: () => void | Promise<void>;
  /** Recompute left-panel performance chart after verify/submit (browser Supabase). */
  onReviewStatsMayHaveChanged?: () => void | Promise<void>;
};

export type BusinessReviewsWorkspaceHandle = {
  /** After a connection match: show Outgoing tab and reload that list only (no full page refresh). */
  afterConnectionMatch: () => void;
};

/**
 * Fetches lists via server actions (isolated from global Redux filters on the dashboard hub).
 */
export const BusinessReviewsWorkspace = forwardRef<
  BusinessReviewsWorkspaceHandle,
  WorkspaceProps
>(function BusinessReviewsWorkspace(
  {
    userId,
    businessId,
    reviewStatuses,
    onOutgoingReviewSubmitted,
    onReviewStatsMayHaveChanged,
  },
  ref,
) {
  const reviewsTabStorageKey = useMemo(
    () => `r4r:reviews-workspace-tab:${businessId}`,
    [businessId],
  );

  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [statusFilter, setStatusFilter] = useState<number>(
    REVIEW_STATUS_FILTER_ALL_OPTION.id,
  );

  const [incoming, setIncoming] = useState<IncomingReview[]>([]);
  const [incomingTotal, setIncomingTotal] = useState(0);
  const [incomingPage, setIncomingPage] = useState(1);
  const [outgoing, setOutgoing] = useState<OutgoingReview[]>([]);
  const [outgoingTotal, setOutgoingTotal] = useState(0);
  const [outgoingPage, setOutgoingPage] = useState(1);
  /** Bumps when we need to refetch outgoing while already on that tab (e.g. new match). */
  const [outgoingReloadNonce, setOutgoingReloadNonce] = useState(0);

  const [loading, setLoading] = useState(true);

  const [verifyOpen, setVerifyOpen] = useState<IncomingReview | null>(null);
  const [viewInOpen, setViewInOpen] = useState<IncomingReview | null>(null);
  const [submitOpen, setSubmitOpen] = useState<OutgoingReview | null>(null);
  const [viewOutOpen, setViewOutOpen] = useState<OutgoingReview | null>(null);

  /** Restore tab after remounts (e.g. layout revalidation) so submit/verify does not jump to Incoming. */
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = sessionStorage.getItem(reviewsTabStorageKey);
      if (stored === "outgoing" || stored === "incoming") {
        setTab(stored);
        return;
      }
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "outgoing") {
        setTab("outgoing");
      }
    } catch {
      /* private mode */
    }
  }, [businessId, reviewsTabStorageKey]);

  const statusOptions = useMemo(
    () => [REVIEW_STATUS_FILTER_ALL_OPTION, ...reviewStatuses],
    [reviewStatuses],
  );

  const refetchIncomingOnly = useCallback(async () => {
    const res = await fetchIncomingReviews(
      userId,
      incomingPage,
      INCOMING_REVIEWS_PAGE_SIZE,
      businessId,
      statusFilter === REVIEW_STATUS_FILTER_ALL_OPTION.id
        ? undefined
        : (statusFilter as Tables<"review_statuses">["id"]),
    );
    if (!res.ok) {
      toast.error("Failed to load incoming reviews", { description: res.error });
      return;
    }
    setIncoming(res.data.data);
    setIncomingTotal(res.data.total_results);
  }, [userId, businessId, incomingPage, statusFilter]);

  const loadIncoming = useCallback(async () => {
    await refetchIncomingOnly();
  }, [refetchIncomingOnly]);

  const refetchOutgoingOnly = useCallback(async () => {
    const res = await fetchOutgoingReviews(
      userId,
      outgoingPage,
      OUTGOING_REVIEWS_PAGE_SIZE,
      statusFilter === REVIEW_STATUS_FILTER_ALL_OPTION.id
        ? undefined
        : (statusFilter as Tables<"review_statuses">["id"]),
      businessId,
    );
    if (!res.ok) {
      toast.error("Failed to load outgoing reviews", { description: res.error });
      return;
    }
    setOutgoing(res.data.data);
    setOutgoingTotal(res.data.total_results);
  }, [userId, businessId, outgoingPage, statusFilter]);

  const loadOutgoing = useCallback(async () => {
    await refetchOutgoingOnly();
  }, [refetchOutgoingOnly]);

  useEffect(() => {
    if (tab !== "incoming") return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadIncoming();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, loadIncoming]);

  useEffect(() => {
    if (tab !== "outgoing") return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadOutgoing();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, loadOutgoing, outgoingReloadNonce]);

  useImperativeHandle(ref, () => ({
    afterConnectionMatch: () => {
      setStatusFilter(REVIEW_STATUS_FILTER_ALL_OPTION.id);
      setIncomingPage(1);
      setOutgoingPage(1);
      setTab("outgoing");
      try {
        sessionStorage.setItem(reviewsTabStorageKey, "outgoing");
      } catch {
        /* private mode */
      }
      setOutgoingReloadNonce((n) => n + 1);
    },
  }));

  const incomingColumns: ColumnDef<IncomingReview>[] = useMemo(
    () => [
      {
        id: "partner",
        header: "Partner business",
        cell: ({ row }) => {
          const r = row.original;
          const loc = r.invitation.invitee_business_location;
          const partnerName =
            r.invitation.invitee_business_name?.trim() || "Partner business";
          const addressLine = loc ? getAddress(loc) : null;
          return (
            <div className="flex items-start gap-3 min-w-[180px]">
              <ReviewPartnerAvatar
                coverUrl={r.invitation.invitee_business_cover_image_url}
                alt={partnerName}
              />
              <div>
                <p className="font-semibold text-foreground">{partnerName}</p>
                <p className="text-xs text-muted-foreground">
                  {addressLine?.trim() ? addressLine : "—"}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "platform",
        header: "Platform",
        cell: ({ row }) => (
          <Platform name={row.original.invitation.platform.name} />
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const name = row.original.status.name;
          return <ReviewStatusBadgeWithTooltip statusName={name} variant="incoming" />;
        },
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => {
          const item = row.original;
          const name = item.status.name;
          if (name === ReviewStatusNames.SUBMITTED) {
            return (
              <Button
                size="sm"
                className="bg-primary text-primary-foreground"
                onClick={() => setVerifyOpen(item)}
              >
                Verify
              </Button>
            );
          }
          return (
            <Button variant="link" className="px-0" onClick={() => setViewInOpen(item)}>
              View detail
            </Button>
          );
        },
      },
    ],
    [],
  );

  const outgoingColumns: ColumnDef<OutgoingReview>[] = useMemo(
    () => [
      {
        id: "partner",
        header: "Partner business",
        cell: ({ row }) => {
          const b = row.original.invitation.business;
          return (
            <div className="flex items-start gap-3 min-w-[200px]">
              <ReviewPartnerAvatar
                coverUrl={b.cover_image_url}
                alt={b.business_name || "Partner business"}
              />
              <div>
                <p className="font-semibold text-foreground">{b.business_name}</p>
                <p className="text-xs text-muted-foreground">{getAddress(b)}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: "platform",
        header: "Platform",
        cell: ({ row }) => (
          <Platform name={row.original.invitation.platform.name} />
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const name = row.original.status.name;
          return <ReviewStatusBadgeWithTooltip statusName={name} variant="outgoing" />;
        },
      },
      {
        id: "action",
        header: "Action",
        cell: ({ row }) => {
          const item = row.original;
          const name = item.status.name;
          if (name === ReviewStatusNames.DRAFT) {
            return (
              <Button size="sm" onClick={() => setSubmitOpen(item)}>
                Submit
              </Button>
            );
          }
          if (name === ReviewStatusNames.SUBMITTED) {
            return <span className="text-sm text-muted-foreground">—</span>;
          }
          return (
            <Button variant="link" className="px-0" onClick={() => setViewOutOpen(item)}>
              View detail
            </Button>
          );
        },
      },
    ],
    [],
  );

  const incomingPages = getTotalPage(incomingTotal, INCOMING_REVIEWS_PAGE_SIZE);
  const outgoingPages = getTotalPage(outgoingTotal, OUTGOING_REVIEWS_PAGE_SIZE);

  return (
    <TooltipProvider delayDuration={200}>
      <div
        id="business-reviews-workspace"
        className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4 text-card-foreground shadow-sm md:p-6"
      >
      <Tabs
        value={tab}
        onValueChange={(v) => {
          const next = v as "incoming" | "outgoing";
          setTab(next);
          try {
            sessionStorage.setItem(reviewsTabStorageKey, next);
          } catch {
            /* private mode */
          }
          setStatusFilter(REVIEW_STATUS_FILTER_ALL_OPTION.id);
          setIncomingPage(1);
          setOutgoingPage(1);
        }}
        className="w-full"
      >
        <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 md:grid-cols-2">
          <TabsTrigger
            value="incoming"
            className="flex h-auto flex-col items-start gap-1 border bg-muted/40 px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-background"
          >
            <span className="flex items-center gap-2 text-sm font-semibold uppercase">
              <ArrowDownLeft className="h-4 w-4" aria-hidden />
              Incoming review
            </span>
            <span className="text-left text-xs font-normal text-muted-foreground">
              Review for your business
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="outgoing"
            className="flex h-auto flex-col items-start gap-1 border bg-muted/40 px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-background"
          >
            <span className="flex items-center gap-2 text-sm font-semibold uppercase">
              <ArrowUpRight className="h-4 w-4" aria-hidden />
              Outgoing review
            </span>
            <span className="text-left text-xs font-normal text-muted-foreground">
              Review from you
            </span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Select
            value={String(statusFilter)}
            onValueChange={(v) => {
              setStatusFilter(+v);
              setIncomingPage(1);
              setOutgoingPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.id === REVIEW_STATUS_FILTER_ALL_OPTION.id
                    ? "All statuses"
                    : statusFilterOptionLabel(s.name, tab)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="incoming" className="mt-4 space-y-4">
          {loading ? (
            <ReviewsWorkspaceTableSkeleton />
          ) : (
            <DataTable
              columns={incomingColumns}
              data={incoming}
              getRowClassName={(r) =>
                rowMuted(r.status.name) ? "opacity-60" : undefined
              }
            />
          )}
          {incomingPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (incomingPage > 1) setIncomingPage((p) => p - 1);
                    }}
                    className={
                      incomingPage <= 1 ? "pointer-events-none opacity-50" : undefined
                    }
                  />
                </PaginationItem>
                {Array.from({ length: incomingPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <button
                      type="button"
                      className={cn(
                        "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm",
                        p === incomingPage ? "border-primary bg-background" : "border-transparent",
                      )}
                      onClick={() => setIncomingPage(p)}
                    >
                      {p}
                    </button>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (incomingPage < incomingPages) setIncomingPage((p) => p + 1);
                    }}
                    className={
                      incomingPage >= incomingPages
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="mt-4 space-y-4">
          {loading ? (
            <ReviewsWorkspaceTableSkeleton />
          ) : (
            <DataTable
              columns={outgoingColumns}
              data={outgoing}
              getRowClassName={(r) =>
                rowMuted(r.status.name) ? "opacity-60" : undefined
              }
            />
          )}
          {outgoingPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (outgoingPage > 1) setOutgoingPage((p) => p - 1);
                    }}
                    className={
                      outgoingPage <= 1 ? "pointer-events-none opacity-50" : undefined
                    }
                  />
                </PaginationItem>
                {Array.from({ length: outgoingPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <button
                      type="button"
                      className={cn(
                        "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm",
                        p === outgoingPage ? "border-primary bg-background" : "border-transparent",
                      )}
                      onClick={() => setOutgoingPage(p)}
                    >
                      {p}
                    </button>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (outgoingPage < outgoingPages) setOutgoingPage((p) => p + 1);
                    }}
                    className={
                      outgoingPage >= outgoingPages
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </TabsContent>
      </Tabs>

      {verifyOpen && (
        <VerifyReviewDialog
          open={!!verifyOpen}
          data={verifyOpen}
          onOpenChange={(o) => !o && setVerifyOpen(null)}
          onUpdatedReview={async (updated: UpdatedReviewStatus) => {
            const matchesFilter =
              statusFilter === REVIEW_STATUS_FILTER_ALL_OPTION.id ||
              updated.status.id === statusFilter;
            if (matchesFilter) {
              setIncoming((prev) =>
                prev.map((r) =>
                  r.id === updated.id
                    ? { ...r, status: updated.status, invitation: r.invitation }
                    : r,
                ),
              );
            } else {
              await refetchIncomingOnly();
            }
            setVerifyOpen(null);
            await onReviewStatsMayHaveChanged?.();
          }}
        />
      )}
      {viewInOpen && (
        <ViewReviewDialog
          open={!!viewInOpen}
          data={viewInOpen}
          onOpenChange={(o) => !o && setViewInOpen(null)}
        />
      )}
      {submitOpen && (
        <SubmitReviewDialog
          open={!!submitOpen}
          data={submitOpen}
          onOpenChange={(o) => !o && setSubmitOpen(null)}
          onUpdatedReview={async (updated: SubmitReviewResponse) => {
            const matchesFilter =
              statusFilter === REVIEW_STATUS_FILTER_ALL_OPTION.id ||
              updated.status.id === statusFilter;
            if (matchesFilter) {
              setOutgoing((prev) =>
                prev.map((r) =>
                  r.id === updated.id
                    ? { ...r, ...updated, invitation: r.invitation }
                    : r,
                ),
              );
            } else {
              await refetchOutgoingOnly();
            }
            setSubmitOpen(null);
            await onOutgoingReviewSubmitted?.();
            await onReviewStatsMayHaveChanged?.();
          }}
        />
      )}
      {viewOutOpen && (
        <ViewOutgoingReviewDialog
          open={!!viewOutOpen}
          data={viewOutOpen}
          onOpenChange={(o) => !o && setViewOutOpen(null)}
        />
      )}
      </div>
      </TooltipProvider>
  );
});

BusinessReviewsWorkspace.displayName = "BusinessReviewsWorkspace";
