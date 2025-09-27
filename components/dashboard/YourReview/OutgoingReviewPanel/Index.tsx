"use client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { Platform } from "@/components/dashboard/Platform";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  OUTGOING_REVIEWS_PAGE_SIZE,
  OUTGOING_REVIEWS_PANEL_ID,
  OUTGOING_REVIEWS_TAB_ID,
  REVIEW_CONTENT_LENGTH_LIMIT,
} from "@/constants/dashboard/ui";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { myBusinessesSelectors } from "@/lib/redux/slices/my-business";
import {
  outgoingReviewsActions,
  outgoingReviewsSelectors,
  Status,
} from "@/lib/redux/slices/outgoing-review";
import { cn } from "@/lib/utils";
import { Review, SubmitReviewResponse } from "@/types/dashboard";
import { Tables } from "@/types/database";
import { ErrorUtils } from "@/utils/error";
import { ReviewUtils } from "@/utils/review";
import { getAddress } from "@/utils/shared";

import { InboxPagination } from "../Pagination";
import { ReviewStatus } from "../ReviewStatus";
import { ReviewStatusFilter } from "./ReviewStatusFilter";
import { SubmitReviewDialog } from "./SubmitReviewDialog";
import { ViewOutgoingReviewDialog } from "./ViewReviewDialog";

interface OutgoingReviewsPanelProps {
  userId: string;
}

export function OutgoingReviewsPanel({ userId }: OutgoingReviewsPanelProps) {
  const data = useAppSelector(outgoingReviewsSelectors.selectData);
  const status = useAppSelector(outgoingReviewsSelectors.selectStatus);
  const page = useAppSelector(outgoingReviewsSelectors.selectPage);
  const totalPage = useAppSelector(outgoingReviewsSelectors.selectTotalPage);
  const hasBusiness = useAppSelector(myBusinessesSelectors.selectHasBusinesses);
  const filteredStatus = useAppSelector(
    outgoingReviewsSelectors.selectFilteredStatus
  );
  const dispatch = useAppDispatch();

  const isLoading = status === Status.LOADING;

  const [selectedSubmitReview, setSelectedSubmitReview] =
    useState<Review | null>(null);
  const [selectedViewReview, setSelectedViewReview] = useState<Review | null>(
    null
  );

  const lastFetchingRequest = useRef<AbortController | null>(null);
  const refetchList = async (
    page: number,
    filteredStatus: Tables<"review_statuses">["id"]
  ) => {
    if (lastFetchingRequest.current !== null) {
      lastFetchingRequest.current.abort();
    }

    const abortController = new AbortController();
    lastFetchingRequest.current = abortController;
    try {
      await dispatch(
        outgoingReviewsActions.fetchOutgoingReviewsThunk(
          { userId, page, filteredStatus },
          {
            signal: abortController.signal,
          }
        )
      ).unwrap();
    } catch (e) {
      if (ErrorUtils.isAbortError(e)) return;
      toast.error(`Failed to load outcoming reviews`, {
        description: ErrorUtils.serializeError(e),
      });
    } finally {
      lastFetchingRequest.current = null;
    }
  };

  const onPageChange = (nextPage: number) => {
    dispatch(outgoingReviewsActions.setPage(nextPage));
    refetchList(nextPage, filteredStatus);
  };

  const onFilteredByStatus = (value: string) => {
    const nextFilteredStatus = +value;
    dispatch(
      outgoingReviewsActions.setFilteredReviewStatus(nextFilteredStatus)
    );
    refetchList(page, nextFilteredStatus);
  };

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

  const onSubmittedReview = useCallback(
    (submittedReview: SubmitReviewResponse) => {
      dispatch(outgoingReviewsActions.updateReview(submittedReview));

      setSelectedSubmitReview(null);
    },
    [dispatch]
  );

  if (!hasBusiness) {
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
        const { id, content, created_at, status, invitation } = item;
        const businessInfo = invitation.business;
        const businessName = businessInfo.business_name;
        const businessAddress = getAddress(businessInfo);

        const reviewStatusName = status.name;
        const reviewStatusId = status.id;
        const reviewContent = content || "";
        const submittedDttm = created_at;

        const platformName = invitation.platform.name;

        let actions = null;
        if (ReviewUtils.isDraftReviewStatus(reviewStatusName)) {
          actions = (
            <div className="flex gap-3 mt-3">
              <Button
                className="bg-violet-600 hover:bg-violet-900"
                onClick={() => setSelectedSubmitReview(item)}
              >
                Complete review
              </Button>
            </div>
          );
        } else {
          actions = (
            <Button
              className="mt-3"
              variant="outline"
              onClick={() => setSelectedViewReview(item)}
            >
              View details
            </Button>
          );
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
                <Platform name={platformName} />
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
            <div>
              <ReviewStatus id={reviewStatusId} />
            </div>
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
        {(function () {
          const content = (
            <ReviewStatusFilter
              value={`${filteredStatus}`}
              onChange={onFilteredByStatus}
            />
          );
          return (
            <div className="py-2 px-3 sm:px-5 sm:py-2">
              <div className="hidden sm:flex flex-row items-center gap-10">
                <p className="font-semibold text-sm sm:text-base">Filter:</p>
                <div className="ml-auto">{content}</div>
              </div>
              <Accordion type="single" collapsible className="block sm:hidden">
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
    </div>
  );
}
