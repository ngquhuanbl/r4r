"use client";
import { Bell, ChevronsUpDown, Radio } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { Platform } from "@/components/dashboard/Platform";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  OUTGOING_REVIEWS_PAGE_SIZE,
  OUTGOING_REVIEWS_PANEL_ID,
  OUTGOING_REVIEWS_TAB_ID,
  REVIEW_CONTENT_LENGTH_LIMIT,
  REVIEW_STATUS_FILTER_ALL_OPTION,
} from "@/constants/dashboard/ui";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  outgoingReviewsActions,
  outgoingReviewsSelectors,
  Status,
} from "@/lib/redux/slices/outgoing-review";
import { cn } from "@/lib/utils";
import { OutgoingReview, SubmitReviewResponse } from "@/types/dashboard";
import { Tables } from "@/types/database";
import { ErrorUtils } from "@/utils/error";
import { ReviewUtils } from "@/utils/review";
import { getAddress, getTotalPage } from "@/utils/shared";

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
  const totalResults = useAppSelector(
    outgoingReviewsSelectors.selectTotalResults
  );
  const filteredStatus = useAppSelector(
    outgoingReviewsSelectors.selectFilteredStatus
  );
  const dispatch = useAppDispatch();

  const isLoading = status === Status.LOADING;

  const [selectedSubmitReview, setSelectedSubmitReview] =
    useState<OutgoingReview | null>(null);
  const [selectedViewReview, setSelectedViewReview] =
    useState<OutgoingReview | null>(null);

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

  const areFiltersApplied =
    filteredStatus !== REVIEW_STATUS_FILTER_ALL_OPTION.id;

  let resultStatus: JSX.Element | null = null;
  if (isLoading) {
    resultStatus = (
      <div
        role="status"
        aria-live="polite"
        className="p-4 grow flex flex-col justify-center"
      >
        <p className="mx-auto text-xs sm:text-sm w-max">
          Loading <span aria-hidden>...</span>
        </p>
      </div>
    );
  } else {
    if (data.length) {
      const n = data.length;
      let content = "";
      if (totalResults === 1) {
        content = `Showing all ${n} results.`;
      } else {
        const from = page * OUTGOING_REVIEWS_PAGE_SIZE;
        const to = from + n;
        content = `Showing ${from + 1} to ${to} of ${totalResults} results.`;
      }
      resultStatus = (
        <div role="status" aria-live="polite" className="sr-only">
          <p className="mx-auto text-xs sm:text-sm w-max">{content}</p>
        </div>
      );
    } else {
      if (areFiltersApplied) {
        resultStatus = (
          <div
            role="status"
            aria-live="polite"
            className="p-4 grow flex flex-col justify-center"
          >
            <p className="mx-auto text-xs sm:text-sm w-max">No result found</p>
          </div>
        );
      } else {
        resultStatus = (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col justify-center items-center gap-2 grow text-center px-3 py-5"
          >
            <div className="flex flex-col gap-1 items-center mb-3">
              <Radio aria-hidden className="animate-bounce" />
              <p className="text-base">Connecting Others to You!</p>
            </div>
            <p className="text-sm">
              Our network community is actively working to connect other
              businesses with you.
              <br />
              Review requests will appear in the{" "}
              <Bell
                aria-label="notifications"
                className="inline"
                size={20}
              />{" "}
              in the page header.
              <br />
              After you accept a request, your review for them will be shown
              here.
            </p>
            <p className="text-xs sm:text-sm italic">
              Please check your notifications regularly for new outgoing review
              requests.
            </p>
          </div>
        );
      }
    }
  }

  let tableContent: JSX.Element | null = null;
  if (!isLoading && data.length) {
    tableContent = (
      <table
        id="incoming-review-table"
        aria-label="Incoming reviews"
        aria-describedby="incoming-review-table-desc"
        className="divide-y divide-zinc-300 border border-zinc-300"
      >
        <caption id="incoming-review-table-desc" className="sr-only">
          Reviews sent by others to your businesses
        </caption>
        <thead className="sr-only md:not-sr-only divide-y divide-zinc-300 bg-purple-100 dark:bg-purple-950">
          <tr className="divide-x divide-zinc-300">
            <th scope="col" colSpan={2} className="p-2">
              Business info
            </th>
            <th scope="col" colSpan={4} className="p-2">
              Review info
            </th>
            <th scope="col" colSpan={1} rowSpan={2} className="p-2">
              Actions
            </th>
          </tr>
          <tr className="divide-x divide-zinc-300">
            <th scope="col" className="p-2 text-left">
              Name
            </th>
            <th scope="col" className="p-2 text-left">
              Address
            </th>
            <th scope="col" className="p-2 text-center">
              Platform
            </th>
            <th scope="col" className="p-2 text-left">
              Content
            </th>
            <th scope="col" className="p-2 text-left">
              Status
            </th>
            <th scope="col" className="p-2 text-left">
              Submitted date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-300">
          {data.map((item) => {
            const { id, content, created_at, status, invitation } = item;
            const businessInfo = invitation.business;
            const businessName = businessInfo.business_name;
            const businessAddress = getAddress(businessInfo);

            const reviewStatusName = status.name;
            const reviewStatusId = status.id;
            const reviewContent = content || "";
            const submittedDttm = created_at;

            const platformName = invitation.platform.name;

            const reviewAriaId =
              "the incoming review for ${businessName} on ${platformName} platform";

            let actions = null;

            const isDraftReview =
              ReviewUtils.isDraftReviewStatus(reviewStatusName);
            if (isDraftReview) {
              actions = (
                <Button
                  className="bg-violet-600 hover:bg-violet-900"
                  onClick={() => setSelectedSubmitReview(item)}
                >
                  Complete review
                </Button>
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
              <tr
                key={id}
                className="flex flex-col p-3 md:p-0 md:table-row md:divide-x md:divide-zinc-300 text-base"
              >
                <th scope="row" className="md:p-2 text-left">
                  {businessName}
                </th>
                <td className="md:p-2 md:text-left">{businessAddress}</td>
                <td className="text-left md:text-center md:p-2">
                  <div className="grid grid-cols-[1fr_3fr] gap-1 items-center md:block md:mx-auto md:w-max">
                    <span
                      aria-hidden
                      className="md:hidden text-base text-gray-700 dark:text-gray-400 font-semibold"
                    >
                      Platform:{" "}
                    </span>
                    <Platform name={platformName} />
                  </div>
                </td>
                <td className="grid grid-cols-[1fr_3fr] gap-1 md:table-cell md:p-2 md:text-left">
                  <span
                    aria-hidden
                    className="md:hidden text-base text-gray-700 dark:text-gray-400 font-semibold"
                  >
                    Content:{" "}
                  </span>
                  {isDraftReview ? (
                    <span className="italic text-gray-600 dark:text-gray-400">
                      Not available
                    </span>
                  ) : (
                    <>
                      &quot;
                      {reviewContent.length > REVIEW_CONTENT_LENGTH_LIMIT
                        ? reviewContent.slice(0, REVIEW_CONTENT_LENGTH_LIMIT) +
                          "..."
                        : reviewContent}
                      &quot;
                    </>
                  )}
                </td>
                <td className="grid grid-cols-[1fr_3fr] gap-1 md:table-cell md:p-2 md:text-left">
                  <span
                    aria-hidden
                    className="md:hidden text-base text-gray-700 dark:text-gray-400 font-semibold"
                  >
                    Status:{" "}
                  </span>
                  <ReviewStatus id={reviewStatusId} />
                </td>
                <td className="grid grid-cols-[1fr_3fr] gap-1 md:table-cell md:p-2 md:text-left">
                  <span
                    aria-hidden
                    className="md:hidden text-base text-gray-700 dark:text-gray-400 font-semibold"
                  >
                    Submitted date:{" "}
                  </span>
                  <time dateTime={submittedDttm}>
                    {new Date(submittedDttm).toLocaleString()}
                  </time>
                </td>
                <td className="md:text-center md:p-2">
                  <div
                    // role="toolbar"
                    aria-label={`Actions for ${reviewAriaId}`}
                  >
                    {actions}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <div className="flex flex-col justify-between grow ">
      <div
        id={OUTGOING_REVIEWS_PANEL_ID}
        role="tabpanel"
        aria-labelledby={OUTGOING_REVIEWS_TAB_ID}
        className={cn(
          "border border-zinc-200 grow flex flex-col sm:p-4 p-3 gap-3 sm:gap-4",
          {
            "animate-pulse": isLoading,
          }
        )}
      >
        {(function () {
          const content = (
            <ReviewStatusFilter
              value={`${filteredStatus}`}
              onChange={onFilteredByStatus}
            />
          );
          return (
            <div role="group" aria-label="Table filters">
              <div className="hidden sm:flex flex-row items-center justify-end gap-10">
                <div className="flex items-center gap-10">{content}</div>
              </div>
              <Collapsible className="md:hidden">
                <div className="flex items-center justify-between">
                  <p aria-hidden className="font-semibold text-sm sm:text-base">
                    Filters:
                  </p>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <ChevronsUpDown />
                      <span className="sr-only">Toggle</span>
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="flex flex-col gap-2">{content}</div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          );
        })()}
        {resultStatus}
        {tableContent}
      </div>
      {!isLoading && (
        <InboxPagination
          page={page}
          totalPage={getTotalPage(totalResults, OUTGOING_REVIEWS_PAGE_SIZE)}
          numVisiblePage={OUTGOING_REVIEWS_PAGE_SIZE}
          onPageChange={onPageChange}
        />
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
