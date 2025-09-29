"use client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { Platform } from "@/components/dashboard/Platform";
import { VerifyReviewDialog } from "@/components/dashboard/YourReview/IncomingReviewPanel/VerifyReviewDialog";
import { ViewReviewDialog } from "@/components/dashboard/YourReview/IncomingReviewPanel/ViewReviewDialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  INCOMING_REVIEWS_PAGE_SIZE,
  INCOMING_REVIEWS_PANEL_ID,
  INCOMING_REVIEWS_TAB_ID,
  REVIEW_CONTENT_LENGTH_LIMIT,
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
import { getAddress } from "@/utils/shared";

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
  const totalPage = useAppSelector(incomingReviewsSelectors.selectTotalPage);
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
      <div className="border border-zinc-20 h-full content-center px-3 text-center grow md:grow-0">
        <div className="flex flex-col items-center mx-auto">
          <p className="font-semibold text-sm md:text-base">
            Your review is waiting!
          </p>
          <p className="font-light text-xs md:text-sm mt-2">
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

  let tableContent = null;
  if (isLoading) {
    tableContent = (
      <div className="p-4">
        <p className="mx-auto text-xs sm:text-sm w-max">Loading ...</p>
      </div>
    );
  } else {
    if (data.length) {
      tableContent = data.map((item) => {
        const { id, content, created_at, status, invitation } = item;
        const businessInfo = businessEntries[invitation.business.id];
        const businessName = businessInfo.business_name;
        const businessAddress = getAddress(businessInfo);

        const reviewStatusName = status.name;
        const reviewStatusId = status.id;
        const reviewContent = content || "";
        const submittedDttm = created_at;

        const platformName = invitation.platform.name;

        const actions =
          reviewStatusName === ReviewStatusNames.SUBMITTED ? (
            <Button
              className="mt-3 bg-teal-600 hover:bg-teal-900"
              onClick={() => setSelectedVerifyingReview(item)}
            >
              Verify now
            </Button>
          ) : (
            <Button
              className="mt-3"
              variant="outline"
              onClick={() => setSelectedViewReview(item)}
            >
              View details
            </Button>
          );
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
              &quot;
              {reviewContent.length > REVIEW_CONTENT_LENGTH_LIMIT
                ? reviewContent.slice(0, REVIEW_CONTENT_LENGTH_LIMIT) + "..."
                : reviewContent}
              &quot;
            </p>
            <div>
              <ReviewStatus
                className="text-sm sm:text-base"
                id={reviewStatusId}
              />
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
          <p className="mx-auto text-xs sm:text-sm w-max">No result found</p>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col justify-between grow md:grow-0">
      <div
        id={INCOMING_REVIEWS_PANEL_ID}
        role="tabpanel"
        aria-labelledby={INCOMING_REVIEWS_TAB_ID}
        className={cn(
          "border border-zinc-200 divide-y divide-zinc-200 grow md:grow-0",
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
            <div className="py-2 px-3 sm:px-5 sm:py-2">
              <div className="hidden sm:flex flex-row items-center gap-10">
                <p className="font-semibold text-sm sm:text-base">Filter:</p>
                <div className="ml-auto flex items-center gap-10">
                  {content}
                </div>
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
            numVisiblePage={INCOMING_REVIEWS_PAGE_SIZE}
            onPageChange={onPageChange}
          />
        </div>
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
