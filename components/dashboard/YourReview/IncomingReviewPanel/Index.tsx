"use client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  fetchBusinesses,
  fetchReviews,
  fetchReviewStatuses,
} from "@/app/(protected)/home/actions";
import { Platform } from "@/components/dashboard/Platform";
import { VerifyReviewDialog } from "@/components/dashboard/YourReview/IncomingReviewPanel/VerifyReviewDialog";
import { ViewReviewDialog } from "@/components/dashboard/YourReview/IncomingReviewPanel/ViewReviewDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BUSINESS_FILTER_ALL_OPTION,
  INCOMING_REVIEWS_PAGE_SIZE,
  INCOMING_REVIEWS_PANEL_ID,
  INCOMING_REVIEWS_TAB_ID,
  REVIEW_CONTENT_LENGTH_LIMIT,
  REVIEW_STATUS_FILTER_ALL_OPTION,
} from "@/constants/dashboard/ui";
import { ReviewStatusNames } from "@/constants/shared";
import { cn } from "@/lib/utils";
import { FetchedReview, UpdatedReviewStatus } from "@/types/dashboard";
import { Tables } from "@/types/database";
import { Label } from "@radix-ui/react-dropdown-menu";

import { InboxPagination } from "../Pagination";

interface IncomingReviewsPanelProps {
  userId: string;
}

export function IncomingReviewsPanel({ userId }: IncomingReviewsPanelProps) {
  const [data, setData] = useState<FetchedReview[] | null>(null);
  const [isLoadingData, startLoadingData] = useTransition();
  const [selectedVerifyingReview, setSelectedVerifyingReview] =
    useState<FetchedReview | null>(null);
  const [selectedViewReview, setSelectedViewReview] =
    useState<FetchedReview | null>(null);

  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);

  const [reviewStatuses, setReviewStatuses] = useState<
    Tables<"review_statuses">[] | null
  >(null);
  const [businesses, setBusinesses] = useState<Tables<"businesses">[] | null>(
    null
  );
  const [isLoadingFilter, startLoadingFilter] = useTransition();
  const [filteredBusiness, setFilteredBusiness] = useState(
    BUSINESS_FILTER_ALL_OPTION.id
  );
  const [filteredStatus, setFilteredStatus] = useState(
    REVIEW_STATUS_FILTER_ALL_OPTION.id
  );

  useEffect(() => {
    startLoadingFilter(async () => {
      try {
        const [reviewStatusesResult, businessesResult] = await Promise.all([
          fetchReviewStatuses(),
          fetchBusinesses(userId),
        ]);
        if (!reviewStatusesResult.ok || !businessesResult.ok) {
          toast.error("Unexpected error", {
            description: "Please reload the page",
          });
        } else {
          setReviewStatuses(reviewStatusesResult.data);
          setBusinesses(businessesResult.data);
        }
      } catch (e) {
        toast.error("Unexpected error", {
          description: "Please reload the page",
        });
      }
    });
  }, [userId]);

  useEffect(() => {
    let toastId: string | number | null = null;
    let shouldIgnore = false;
    startLoadingData(async () => {
      try {
        toastId = toast.info("Loading...", {
          position: "top-center",
        });

        const result = await fetchReviews(
          userId,
          page,
          INCOMING_REVIEWS_PAGE_SIZE,
          filteredBusiness !== BUSINESS_FILTER_ALL_OPTION.id
            ? +filteredBusiness
            : undefined,
          filteredStatus !== REVIEW_STATUS_FILTER_ALL_OPTION.id
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
          toast.error("Failed to load incoming reviews", {
            description: error || "Unexpected error",
            position: "top-center",
          });
        }
      } catch (e: any) {
        toast.error("Failed to load incoming reviews", {
          description: e.message || "Unexpected error",
          position: "top-center",
        });
      } finally {
        if (toastId !== null) {
          toast.dismiss(toastId);
        }
      }
    });

    return () => {
      if (toastId !== null) {
        toast.dismiss(toastId);
      }
      shouldIgnore = true;
    };
  }, [page, userId, filteredBusiness, filteredStatus]);

  const onPageChange = useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

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

  const onUpdatedReview = useCallback((updatedReview: UpdatedReviewStatus) => {
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
    setSelectedVerifyingReview(null);
  }, []);

  const onFilteredByBusiness = useCallback((value: string) => {
    setFilteredBusiness(value);
    setPage(1);
  }, []);

  const onFilteredByStatus = useCallback((value: string) => {
    setFilteredStatus(value);
    setPage(1);
  }, []);

  const isFilterReady = reviewStatuses !== null && businesses !== null;

  const isLoading = isLoadingData || isLoadingFilter;

  const hasNoBusiness = businesses !== null && businesses.length === 0;
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

  const statusNameMap = new Map();
  if (reviewStatuses !== null) {
    reviewStatuses.forEach(({ id, name }) => {
      statusNameMap.set(id, name);
    });
  }

  let tableContent = null;
  if (data !== null) {
    if (data.length) {
      tableContent = data.map((item) => {
        const { id, content, created_at, status, invitation } = item;
        const businessInfo = invitation.business;
        const businessName = businessInfo.business_name;
        const businessAddress = [
          businessInfo.address,
          businessInfo.city,
          businessInfo.state,
        ].join(", ");

        const reviewStatusName = status.name;
        const reviewStatusId = status.id;
        const reviewContent = content || "";
        const submittedDttm = created_at;
        return (
          <div key={id} className="p-5 grid grid-cols-[2fr_3fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-1">
                <p className="font-semibold">{businessName}</p>
                <Platform name={invitation.platform.name} />
              </div>
              <p className="text-sm font-light">{businessAddress}</p>
              {reviewStatusName === ReviewStatusNames.SUBMITTED ? (
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
              )}
            </div>
            <p className="italic">
              &quot;
              {reviewContent.length > REVIEW_CONTENT_LENGTH_LIMIT
                ? reviewContent.slice(0, REVIEW_CONTENT_LENGTH_LIMIT) + "..."
                : reviewContent}
              &quot;
            </p>
            {/* TODO: Tooltip using Redux */}
            <p>{statusNameMap.get(reviewStatusId) || "..."}</p>
            <p className="text-sm font-medium">
              {new Date(submittedDttm).toLocaleString()}
            </p>
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
        id={INCOMING_REVIEWS_PANEL_ID}
        role="tabpanel"
        aria-labelledby={INCOMING_REVIEWS_TAB_ID}
        className={cn("border border-zinc-200 divide-y divide-zinc-200", {
          "animate-pulse": isLoading,
        })}
      >
        {isFilterReady && (
          <div className="flex items-center px-5 py-2 gap-10">
            <p className="font-semibold">Filter:</p>
            {businesses.length && (
              <div className="flex items-center ml-auto">
                <Label className="mr-4">By business:</Label>
                <Select
                  value={filteredBusiness}
                  onValueChange={onFilteredByBusiness}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select business" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BUSINESS_FILTER_ALL_OPTION.id}>
                      {BUSINESS_FILTER_ALL_OPTION.name}
                    </SelectItem>
                    {businesses.map(({ id, business_name }) => (
                      <SelectItem key={id} value={`${id}`}>
                        {business_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {reviewStatuses.length && (
              <div className="flex items-center">
                <Label className="mr-4">By status:</Label>
                <Select
                  value={filteredStatus}
                  onValueChange={onFilteredByStatus}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={REVIEW_STATUS_FILTER_ALL_OPTION.id}>
                      {REVIEW_STATUS_FILTER_ALL_OPTION.name}
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
          </div>
        )}
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
