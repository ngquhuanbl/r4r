"use client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  fetchBusinessesCount,
  fetchOutgoingReviews,
  fetchOutgoingReviewStatuses,
} from "@/app/(protected)/home/actions";
import { Platform } from "@/components/dashboard/Platform";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  OUTGOING_REVIEW_STATUS_FILTER_ALL_OPTION,
  OUTGOING_REVIEWS_PAGE_SIZE,
  OUTGOING_REVIEWS_PANEL_ID,
  OUTGOING_REVIEWS_TAB_ID,
  REVIEW_CONTENT_LENGTH_LIMIT,
} from "@/constants/dashboard/ui";
import { OutgoingReviewStatusNames } from "@/constants/shared";
import { cn } from "@/lib/utils";
import {
  OutgoingReview,
  SubmitReviewResponse,
  UpdatedOutgoingReviewStatus,
} from "@/types/dashboard";
import { Tables } from "@/types/database";
import { getOutgoingReviewStatus } from "@/utils/outgoing-review";
import { getAddress } from "@/utils/shared";
import { Label } from "@radix-ui/react-dropdown-menu";

import { InboxPagination } from "../Pagination";
import { RejectOutgoingReviewDialog } from "./RejectReviewDialog";
import { SubmitReviewDialog } from "./SubmitReviewDialog";
import { ViewOutgoingReviewDialog } from "./ViewReviewDialog";

interface OutgoingReviewsPanelProps {
  userId: string;
}

export function OutgoingReviewsPanel({ userId }: OutgoingReviewsPanelProps) {
  const [data, setData] = useState<OutgoingReview[] | null>(null);
  const [isLoadingData, startLoadingData] = useTransition();
  const [selectedSubmitReview, setSelectedSubmitReview] =
    useState<OutgoingReview | null>(null);
  const [selectedViewReview, setSelectedViewReview] =
    useState<OutgoingReview | null>(null);
  const [selectedRejectwReview, setSelectedRejectReview] =
    useState<OutgoingReview | null>(null);

  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);

  const [businessCount, setBusinessesCount] = useState<number | null>(null);
  const [reviewStatuses, setReviewStatuses] = useState<
    Tables<"invitation_statuses">[] | null
  >(null);

  const [isLoadingFilter, startLoadingFilter] = useTransition();

  const [filteredStatus, setFilteredStatus] = useState(
    OUTGOING_REVIEW_STATUS_FILTER_ALL_OPTION.id
  );

  useEffect(() => {
    let toastId: string | number | null = null;
    let shouldIgnore = false;
    startLoadingFilter(async () => {
      try {
        const [businessCountResult, reviewStatusesResult] = await Promise.all([
          fetchBusinessesCount(userId),
          fetchOutgoingReviewStatuses(),
        ]);
        if (shouldIgnore) return;
        if (!businessCountResult.ok || !reviewStatusesResult.ok) {
          toastId = toast.error("Unexpected error", {
            description: "Please reload the page",
          });
        } else {
          setBusinessesCount(businessCountResult.data);
          setReviewStatuses(reviewStatusesResult.data);
        }
      } catch (e) {
        toastId = toast.error("Unexpected error", {
          description: "Please reload the page",
        });
      }
    });
    return () => {
      if (toastId !== null) {
        toastId = toast.dismiss(toastId);
      }
      shouldIgnore = true;
    };
  }, [userId]);

  useEffect(() => {
    let toastId: string | number | null = null;
    let shouldIgnore = false;
    startLoadingData(async () => {
      try {
        toastId = toast.info("Loading...", {
          position: "top-center",
        });

        const result = await fetchOutgoingReviews(
          userId,
          page,
          OUTGOING_REVIEWS_PAGE_SIZE,
          filteredStatus !== OUTGOING_REVIEW_STATUS_FILTER_ALL_OPTION.id
            ? +filteredStatus
            : undefined
        );

        if (shouldIgnore) return;
        if (result.ok) {
          const { total_page, data } = result.data!;
          setTotalPage(total_page);
          setData(data);
        } else {
          const { error } = result as any;
          toastId = toast.error("Failed to load outgoing reviews", {
            description: error || "Unexpected error",
            position: "top-center",
          });
        }
      } catch (e: any) {
        toastId = toast.error("Failed to load outgoing reviews", {
          description: e.message || "Unexpected error",
          position: "top-center",
        });
      }
    });

    return () => {
      if (toastId !== null) {
        toast.dismiss(toastId);
      }
      shouldIgnore = true;
    };
  }, [page, userId, filteredStatus]);

  const onPageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

  const onOpenChangeVerifiedReview = useCallback((opened: boolean) => {
    if (!opened) {
      setSelectedSubmitReview(null);
    }
  }, []);

  const onOpenChangeViewReview = useCallback((opened: boolean) => {
    if (!opened) {
      setSelectedViewReview(null);
    }
  }, []);

  const onOpenChangeRejectReview = useCallback((opened: boolean) => {
    if (!opened) {
      setSelectedRejectReview(null);
    }
  }, []);

  const onUpdatedReview = useCallback(
    (updatedReview: UpdatedOutgoingReviewStatus) => {
      setData((prevState) =>
        prevState!.map((currItem) =>
          currItem.id === updatedReview.id
            ? {
                ...currItem,
                status: { ...updatedReview.status },
              }
            : currItem
        )
      );

      setSelectedRejectReview(null);
    },
    []
  );

  const onSubmittedReview = useCallback(
    (submittedReview: SubmitReviewResponse) => {
      setData((prevState) =>
        prevState!.map((currItem) =>
          currItem.id === submittedReview.id
            ? {
                ...currItem,
                status: { ...submittedReview.status },
                review: [{ ...submittedReview.review }],
              }
            : currItem
        )
      );
      setSelectedSubmitReview(null);
    },
    []
  );

  const onFilteredByStatus = useCallback((value: string) => {
    setFilteredStatus(value);
    setPage(1);
  }, []);

  const isFilterReady = reviewStatuses !== null;

  const isLoading = isLoadingData || isLoadingFilter;

  const hasNoBusiness = businessCount === 0;
  if (hasNoBusiness) {
    const params = new URLSearchParams();
    params.append("show", "1");
    return (
      <div className="border border-zinc-20 h-full content-center">
        <div className="flex flex-col items-center mx-auto">
          <p className="font-semibold">Your review is waiting!</p>
          <p className="font-light text-sm mt-2">
            It looks a little empty right now because you haven't add any
            businesses yet.
            <br />
            Add your business to start receiving notifications and managing your
            feedback!
          </p>
          <Button asChild className="mt-5">
            <Link href={`/businesses?${params.toString()}`}>
              <Plus />
              Add new business
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  let tableContent = null;
  if (data !== null) {
    if (data.length) {
      tableContent = data.map((item) => {
        const { id, business, created_at, platform, review } = item;
        const businessInfo = business;
        const businessName = businessInfo.business_name;
        const businessAddress = getAddress(businessInfo);

        //@ts-ignore
        const status = getOutgoingReviewStatus(item);
        const reviewStatusName = status.name;
        const reviewContent = review.length ? review[0].content! : "";
        const submittedDttm = created_at;

        let actions = null;
        switch (reviewStatusName) {
          case OutgoingReviewStatusNames.PENDING:
            actions = (
              <div className="flex gap-3 mt-3">
                <Button
                  className="bg-violet-600 hover:bg-violet-900"
                  onClick={() => setSelectedSubmitReview(item)}
                >
                  Submit review
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setSelectedRejectReview(item)}
                >
                  Reject
                </Button>
              </div>
            );
            break;
          default:
            actions = (
              <Button
                className="mt-3"
                variant="outline"
                onClick={() => setSelectedViewReview(item)}
              >
                View details
              </Button>
            );
            break;
        }
        return (
          <div
            key={id}
            className="p-3 sm:p-5 flex flex-col gap-2 sm:gap-0 sm:grid sm:grid-cols-[2fr_3fr_1fr_1fr]"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm sm:text-base">
                  {businessName}
                </p>
                <Platform name={platform.name} />
              </div>
              <p className="text-sm font-light">{businessAddress}</p>
              <div className="hidden sm:block">{actions}</div>
            </div>
            <p className="italic text-sm sm:text-base">
              {reviewContent.length ? (
                <>
                  &quot;
                  {reviewContent.length > REVIEW_CONTENT_LENGTH_LIMIT
                    ? reviewContent.slice(0, REVIEW_CONTENT_LENGTH_LIMIT) +
                      "..."
                    : reviewContent}
                  &quot;
                </>
              ) : null}
            </p>
            {/* TODO: Tooltip using Redux */}
            <p className="text-sm sm:text-base">{reviewStatusName}</p>
            <p className="text-xs sm:text-sm font-medium">
              {new Date(submittedDttm).toLocaleString()}
            </p>
            <div className="block sm:hidden">{actions}</div>
          </div>
        );
      });
    } else {
      tableContent = (
        <div className="p-4">
          <p className="mx-auto text-sm w-max">No result found</p>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col justify-between">
      <div
        id={OUTGOING_REVIEWS_PANEL_ID}
        role="tabpanel"
        aria-labelledby={OUTGOING_REVIEWS_TAB_ID}
        className={cn("border border-zinc-200 divide-y divide-zinc-200", {
          "animate-pulse": isLoading,
        })}
      >
        {isFilterReady &&
          (function () {
            const content = (
              <>
                {reviewStatuses.length && (
                  <div className="flex justify-between sm:justify-start items-center sm:ml-auto">
                    <Label className="sm:mr-4 text-xs sm:text-base">
                      By status:
                    </Label>
                    <Select
                      value={filteredStatus}
                      onValueChange={onFilteredByStatus}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value={OUTGOING_REVIEW_STATUS_FILTER_ALL_OPTION.id}
                        >
                          {OUTGOING_REVIEW_STATUS_FILTER_ALL_OPTION.name}
                        </SelectItem>
                        {reviewStatuses.map(({ id, name }) => (
                          <SelectItem key={id} value={`${id}`}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            );
            return (
              <div className="py-2 px-3 sm:px-5 sm:py-2">
                <div className="hidden sm:flex flex-row items-center gap-10">
                  <p className="font-semibold text-sm sm:text-base">Filter:</p>
                  {content}
                </div>
                <Accordion
                  type="single"
                  collapsible
                  className="block sm:hidden"
                >
                  <AccordionItem value="filter">
                    <AccordionTrigger>
                      <p className="font-semibold text-sm sm:text-base">
                        Filter:
                      </p>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-2">{content}</div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            );
          })()}
        {tableContent}
      </div>
      {!isLoading && (
        <div className="mt-5">
          <InboxPagination
            page={page}
            totalPage={totalPage}
            numVisiblePage={OUTGOING_REVIEWS_PAGE_SIZE}
            onPageChange={onPageChange}
          />
        </div>
      )}
      {selectedSubmitReview !== null && (
        <SubmitReviewDialog
          open={true}
          data={selectedSubmitReview}
          onOpenChange={onOpenChangeVerifiedReview}
          onUpdatedReview={onSubmittedReview}
        />
      )}
      {selectedViewReview !== null && (
        <ViewOutgoingReviewDialog
          open={true}
          data={selectedViewReview}
          onOpenChange={onOpenChangeViewReview}
        />
      )}
      {selectedRejectwReview !== null && (
        <RejectOutgoingReviewDialog
          open={true}
          data={selectedRejectwReview}
          onOpenChange={onOpenChangeRejectReview}
          onUpdatedReview={onUpdatedReview}
        />
      )}
    </div>
  );
}
