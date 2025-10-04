"use client";
import { ChevronsUpDown, Handshake, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { Platform } from "@/components/dashboard/Platform";
import { VerifyReviewDialog } from "@/components/dashboard/YourReview/IncomingReviewPanel/VerifyReviewDialog";
import { ViewReviewDialog } from "@/components/dashboard/YourReview/IncomingReviewPanel/ViewReviewDialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  BUSINESS_FILTER_ALL_OPTION,
  INCOMING_REVIEWS_PAGE_SIZE,
  INCOMING_REVIEWS_PANEL_ID,
  INCOMING_REVIEWS_TAB_ID,
  REVIEW_CONTENT_LENGTH_LIMIT,
  REVIEW_STATUS_FILTER_ALL_OPTION,
} from "@/constants/dashboard/ui";
import { MyBusinessesSearchParams } from "@/constants/my-businesses";
import { Paths } from "@/constants/paths";
import { ReviewStatusNames } from "@/constants/shared";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  incomingReviewsActions,
  incomingReviewsSelectors,
  Status,
} from "@/lib/redux/slices/incoming-review";
import { myBusinessesSelectors } from "@/lib/redux/slices/my-business";
import { cn } from "@/lib/utils";
import { IncomingReview, UpdatedReviewStatus } from "@/types/dashboard";
import { Tables } from "@/types/database";
import { ErrorUtils } from "@/utils/error";
import { getAddress, getTotalPage } from "@/utils/shared";

import { InboxPagination } from "../Pagination";
import { ReviewStatus } from "../ReviewStatus";
import { BusinessesFilter } from "./BusinessesFilter";
import { ReviewStatusFilter } from "./ReviewStatusFilter";

interface IncomingReviewsPanelProps {
  userId: string;
}

export function IncomingReviewsPanel({ userId }: IncomingReviewsPanelProps) {
  const data = useAppSelector(incomingReviewsSelectors.selectData);
  const status = useAppSelector(incomingReviewsSelectors.selectStatus);
  const page = useAppSelector(incomingReviewsSelectors.selectPage);
  const totalResults = useAppSelector(
    incomingReviewsSelectors.selectTotalResults
  );
  const filteredBusinessId = useAppSelector(
    incomingReviewsSelectors.selectFilteredBusinessId
  );
  const filteredStatus = useAppSelector(
    incomingReviewsSelectors.selectFilteredStatus
  );

  const businessEntries = useAppSelector(myBusinessesSelectors.selectEntries);
  const hasBusiness = useAppSelector(myBusinessesSelectors.selectHasBusinesses);
  const dispatch = useAppDispatch();

  const isLoading = status === Status.LOADING;

  const [selectedVerifyingReview, setSelectedVerifyingReview] =
    useState<IncomingReview | null>(null);
  const [selectedViewReview, setSelectedViewReview] =
    useState<IncomingReview | null>(null);

  const lastFetchingRequest = useRef<AbortController | null>(null);
  const refetchList = async (
    page: number,
    filteredBusinessId: Tables<"businesses">["id"],
    filteredStatus: Tables<"review_statuses">["id"]
  ) => {
    if (lastFetchingRequest.current !== null) {
      lastFetchingRequest.current.abort();
    }

    const abortController = new AbortController();
    lastFetchingRequest.current = abortController;
    try {
      await dispatch(
        incomingReviewsActions.fetchIncomingReviewsThunk(
          { userId, page, filteredBusinessId, filteredStatus },
          {
            signal: abortController.signal,
          }
        )
      ).unwrap();
    } catch (e) {
      if (ErrorUtils.isAbortError(e)) return;
      toast.error(`Failed to load incoming reviews`, {
        description: ErrorUtils.serializeError(e),
      });
    } finally {
      lastFetchingRequest.current = null;
    }
  };

  const onPageChange = (nextPage: number) => {
    dispatch(incomingReviewsActions.setPage(nextPage));
    refetchList(nextPage, filteredBusinessId, filteredStatus);
  };

  const onFilteredByBusiness = (value: string) => {
    const nextFilteredBusinessId = +value;
    dispatch(
      incomingReviewsActions.setFilteredBusinessId(nextFilteredBusinessId)
    );
    refetchList(page, nextFilteredBusinessId, filteredStatus);
  };

  const onFilteredByStatus = (value: string) => {
    const nextFilterStatus = +value;
    dispatch(incomingReviewsActions.setFilteredReviewStatus(nextFilterStatus));
    refetchList(page, filteredBusinessId, nextFilterStatus);
  };

  const onOpenChangeVerifiedReview = useCallback((opened: boolean) => {
    if (!opened) {
      setSelectedVerifyingReview(null);
    }
  }, []);

  const onOpenChangeViewReview = useCallback((opened: boolean) => {
    if (!opened) {
      setSelectedViewReview(null);
    }
  }, []);

  const onUpdatedReview = useCallback(
    (updatedReview: UpdatedReviewStatus) => {
      dispatch(incomingReviewsActions.updateReview(updatedReview));
      setSelectedVerifyingReview(null);
    },
    [dispatch]
  );

  if (!hasBusiness) {
    const params = new URLSearchParams();
    params.append(MyBusinessesSearchParams.SHOW, "1");
    return (
      <div className="border border-zinc-20 content-center px-3 text-center grow md:grow-0">
        <div className="flex flex-col items-center mx-auto">
          <p className="font-semibold text-base">Your review is waiting!</p>
          <p className="font-light text-sm mt-2">
            It looks a little empty right now because you haven't add any
            businesses yet.
            <br />
            Add your business to start receiving notifications and managing your
            feedback!
          </p>
          <Button asChild className="mt-5">
            <Link href={`${Paths.MY_BUSINESSES}?${params.toString()}`}>
              <Plus />
              Add new business
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const areFiltersApplied =
    filteredBusinessId !== BUSINESS_FILTER_ALL_OPTION.id ||
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
        const from = page * INCOMING_REVIEWS_PAGE_SIZE;
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
              <Handshake aria-hidden className="animate-bounce" />
              <p className="text-sm sm:text-base">
                Connecting You to the Network!
              </p>
            </div>
            <p className="text-xs sm:text-sm">
              Our network community is actively working to introduce your
              businesses to others. <br />
              Their reviews will appear here automatically.
            </p>
            <p className="text-xs sm:text-sm italic">
              Feel free to navigate away — you'll see the results here next time
              you check.
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
        <thead className="sr-only md:not-sr-only divide-y divide-zinc-300 bg-teal-100 dark:bg-teal-950">
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
            const businessInfo = businessEntries[invitation.business.id];
            const businessName = businessInfo.business_name;
            const businessAddress = getAddress(businessInfo);

            const reviewStatusName = status.name;
            const reviewStatusId = status.id;
            const reviewContent = content || "";
            const submittedDttm = created_at;

            const platformName = invitation.platform.name;

            const reviewAriaId =
              "the incoming review for ${businessName} on ${platformName} platform";

            const actions =
              reviewStatusName === ReviewStatusNames.SUBMITTED ? (
                <Button
                  aria-label={`Verify ${reviewAriaId} now.`}
                  className="mt-3 bg-teal-700 hover:bg-teal-600 text-white"
                  onClick={() => setSelectedVerifyingReview(item)}
                >
                  Verify now
                </Button>
              ) : (
                <Button
                  aria-label={`View details of ${reviewAriaId}.`}
                  className="mt-3"
                  variant="outline"
                  onClick={() => setSelectedViewReview(item)}
                >
                  View details
                </Button>
              );
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
                  &quot;
                  {reviewContent.length > REVIEW_CONTENT_LENGTH_LIMIT
                    ? reviewContent.slice(0, REVIEW_CONTENT_LENGTH_LIMIT) +
                      "..."
                    : reviewContent}
                  &quot;
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
    <div className="flex flex-col justify-between grow">
      <div
        id={INCOMING_REVIEWS_PANEL_ID}
        role="tabpanel"
        aria-labelledby={INCOMING_REVIEWS_TAB_ID}
        className={cn(
          "border border-zinc-200 grow flex flex-col sm:p-4 p-3 gap-3 sm:gap-4",
          {
            "animate-pulse": isLoading,
          }
        )}
      >
        {(function () {
          const content = (
            <>
              <BusinessesFilter
                value={`${filteredBusinessId}`}
                onChange={onFilteredByBusiness}
              />
              <ReviewStatusFilter
                value={`${filteredStatus}`}
                onChange={onFilteredByStatus}
              />
            </>
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
          totalPage={getTotalPage(totalResults, INCOMING_REVIEWS_PAGE_SIZE)}
          numVisiblePage={INCOMING_REVIEWS_PAGE_SIZE}
          onPageChange={onPageChange}
        />
      )}
      {selectedVerifyingReview !== null && (
        <VerifyReviewDialog
          open={true}
          data={selectedVerifyingReview}
          onOpenChange={onOpenChangeVerifiedReview}
          onUpdatedReview={onUpdatedReview}
        />
      )}
      {selectedViewReview !== null && (
        <ViewReviewDialog
          open={true}
          data={selectedViewReview}
          onOpenChange={onOpenChangeViewReview}
        />
      )}
    </div>
  );
}
