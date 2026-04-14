"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  fetchIncomingReviews,
  fetchOutgoingReviews,
} from "@/app/(protected)/home/actions";
import { Platform } from "@/components/dashboard/Platform";
import { ViewReviewDialog } from "@/components/dashboard/YourReview/IncomingReviewPanel/ViewReviewDialog";
import { SubmitReviewDialog } from "@/components/business/v2/submit-review-dialog";
import { VerifyReviewDialog } from "@/components/business/v2/verify-review-dialog";
import { ViewOutgoingReviewDialog } from "@/components/dashboard/YourReview/OutgoingReviewPanel/ViewReviewDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
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
} from "@/constants/dashboard/ui";
import { ReviewStatusNames } from "@/constants/shared";
import { cn } from "@/lib/utils";
import type { IncomingReview, OutgoingReview } from "@/types/dashboard";
import type { Tables } from "@/types/database";
import type { UserId } from "@/types/shared";
import { ReviewUtils } from "@/utils/review";
import { getAddress, getTotalPage } from "@/utils/shared";

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

function rowMuted(statusName: string) {
  return (
    ReviewUtils.isVerifiedReviewStatus(statusName as any) ||
    ReviewUtils.isRejectedReviewStatus(statusName as any)
  );
}

type WorkspaceProps = {
  userId: UserId;
  businessId: Tables<"businesses">["id"];
  reviewStatuses: Tables<"review_statuses">[];
};

/**
 * Fetches lists via server actions (isolated from global Redux filters used on /home).
 */
export function BusinessReviewsWorkspace({
  userId,
  businessId,
  reviewStatuses,
}: WorkspaceProps) {
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

  const [loading, setLoading] = useState(true);

  const [verifyOpen, setVerifyOpen] = useState<IncomingReview | null>(null);
  const [viewInOpen, setViewInOpen] = useState<IncomingReview | null>(null);
  const [submitOpen, setSubmitOpen] = useState<OutgoingReview | null>(null);
  const [viewOutOpen, setViewOutOpen] = useState<OutgoingReview | null>(null);

  const statusOptions = useMemo(
    () => [REVIEW_STATUS_FILTER_ALL_OPTION, ...reviewStatuses],
    [reviewStatuses],
  );

  const loadIncoming = useCallback(async () => {
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

  const loadOutgoing = useCallback(async () => {
    const res = await fetchOutgoingReviews(
      userId,
      outgoingPage,
      OUTGOING_REVIEWS_PAGE_SIZE,
      statusFilter === REVIEW_STATUS_FILTER_ALL_OPTION.id
        ? undefined
        : (statusFilter as Tables<"review_statuses">["id"]),
      undefined,
    );
    if (!res.ok) {
      toast.error("Failed to load outgoing reviews", { description: res.error });
      return;
    }
    setOutgoing(res.data.data);
    setOutgoingTotal(res.data.total_results);
  }, [userId, outgoingPage, statusFilter]);

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
  }, [tab, loadOutgoing]);

  const refresh = useCallback(async () => {
    if (tab === "incoming") await loadIncoming();
    else await loadOutgoing();
  }, [tab, loadIncoming, loadOutgoing]);

  const incomingColumns: ColumnDef<IncomingReview>[] = useMemo(
    () => [
      {
        id: "partner",
        header: "Partner business",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-start gap-3 min-w-[180px]">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                <Image
                  src="/dashboard/fallback_business_avatar.png"
                  alt=""
                  fill
                  className="object-cover dark:hidden"
                  sizes="40px"
                />
                <Image
                  src="/dashboard/fallback_business_avatar--dark.png"
                  alt=""
                  fill
                  className="hidden object-cover dark:block"
                  sizes="40px"
                />
              </div>
              <div>
                <p className="font-semibold text-foreground">Review #{r.id}</p>
                <p className="text-xs text-muted-foreground">
                  {r.invitation.platform.name}
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
          return (
            <Badge variant="outline" className={cn("font-normal", statusBadgeClass(name))}>
              {incomingLabel(name)}
            </Badge>
          );
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
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                <Image
                  src="/dashboard/fallback_business_avatar.png"
                  alt=""
                  fill
                  className="object-cover dark:hidden"
                  sizes="40px"
                />
                <Image
                  src="/dashboard/fallback_business_avatar--dark.png"
                  alt=""
                  fill
                  className="hidden object-cover dark:block"
                  sizes="40px"
                />
              </div>
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
          return (
            <Badge variant="outline" className={cn("font-normal", statusBadgeClass(name))}>
              {outgoingLabel(name)}
            </Badge>
          );
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
    <div className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-4 text-card-foreground shadow-sm md:p-6">
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as "incoming" | "outgoing");
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
                  {s.id === REVIEW_STATUS_FILTER_ALL_OPTION.id ? "All statuses" : s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="incoming" className="mt-4 space-y-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
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
            <p className="text-sm text-muted-foreground">Loading…</p>
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
          onUpdatedReview={() => {
            void refresh();
            setVerifyOpen(null);
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
          onUpdatedReview={() => {
            void refresh();
            setSubmitOpen(null);
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
  );
}
