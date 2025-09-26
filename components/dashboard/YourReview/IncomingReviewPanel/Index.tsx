"use client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  fetchBusinesses,
  fetchIncomingReviews,
  fetchIncomingReviewStatuses,
} from "@/app/(protected)/home/actions";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BUSINESS_FILTER_ALL_OPTION,
  INCOMING_REVIEW_STATUS_FILTER_ALL_OPTION,
  INCOMING_REVIEWS_PAGE_SIZE,
  INCOMING_REVIEWS_PANEL_ID,
  INCOMING_REVIEWS_TAB_ID,
  REVIEW_CONTENT_LENGTH_LIMIT,
} from "@/constants/dashboard/ui";
import { ReviewStatusNames } from "@/constants/shared";
import { cn } from "@/lib/utils";
import { IncomingReview, UpdatedIncomingReviewStatus } from "@/types/dashboard";
import { Tables } from "@/types/database";
import { getAddress } from "@/utils/shared";
import { Label } from "@radix-ui/react-dropdown-menu";

import { InboxPagination } from "../Pagination";

interface IncomingReviewsPanelProps {
  userId: string;
}

export function IncomingReviewsPanel({ userId }: IncomingReviewsPanelProps) {
  const [data, setData] = useState<IncomingReview[] | null>(null);
  const [isLoadingData, startLoadingData] = useTransition();
  const [selectedVerifyingReview, setSelectedVerifyingReview] =
    useState<IncomingReview | null>(null);
  const [selectedViewReview, setSelectedViewReview] =
    useState<IncomingReview | null>(null);

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
    INCOMING_REVIEW_STATUS_FILTER_ALL_OPTION.id
  );

  useEffect(() => {
    let toastId: string | number | null = null;
    let shouldIgnore = false;
    startLoadingFilter(async () => {
      try {
        const [reviewStatusesResult, businessesResult] = await Promise.all([
          fetchIncomingReviewStatuses(),
          fetchBusinesses(userId),
        ]);
        if (shouldIgnore) return;

        if (!reviewStatusesResult.ok || !businessesResult.ok) {
          toastId = toast.error("Unexpected error", {
            description: "Please reload the page",
          });
        } else {
          setReviewStatuses(reviewStatusesResult.data);
          setBusinesses(businessesResult.data);
        }
      } catch (e) {
        toastId = toast.error("Unexpected error", {
          description: "Please reload the page",
        });
      }
    });
    return () => {
      if (toastId !== null) {
        toast.dismiss(toastId);
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

        const result = await fetchIncomingReviews(
          userId,
          page,
          INCOMING_REVIEWS_PAGE_SIZE,
          filteredBusiness !== BUSINESS_FILTER_ALL_OPTION.id
            ? +filteredBusiness
            : undefined,
          filteredStatus !== INCOMING_REVIEW_STATUS_FILTER_ALL_OPTION.id
            ? +filteredStatus
            : undefined
        );

        if (shouldIgnore) return;
        if (result.ok) {
          const { total_page, data } = result.data!;
          console.log(data);
          setTotalPage(total_page);
          setData(data);
        } else {
          const { error } = result as any;
          toastId = toast.error("Failed to load incoming reviews", {
            description: error || "Unexpected error",
            position: "top-center",
          });
        }
      } catch (e: any) {
        toastId = toast.error("Failed to load incoming reviews", {
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

  const onUpdatedReview = useCallback(
    (updatedReview: UpdatedIncomingReviewStatus) => {
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
    },
    []
  );

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
            {/* TODO: Tooltip using Redux */}
            <p className="text-sm sm:text-base">
              {statusNameMap.get(reviewStatusId) || "..."}
            </p>
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
    <div className="flex flex-col justify-between">
      <div
        id={INCOMING_REVIEWS_PANEL_ID}
        role="tabpanel"
        aria-labelledby={INCOMING_REVIEWS_TAB_ID}
        className={cn(
          "border border-zinc-200 border-t-0 divide-y divide-zinc-200",
          {
            "animate-pulse": isLoading,
          }
        )}
      >
        {isFilterReady &&
          (function () {
            const content = (
              <>
                {businesses.length && (
                  <div className="flex justify-between sm:justify-start items-center sm:ml-auto">
                    <Label className="sm:mr-4 text-xs sm:text-base">
                      By business:
                    </Label>
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
                  <div className="flex justify-between sm:justify-start items-center">
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
                          value={INCOMING_REVIEW_STATUS_FILTER_ALL_OPTION.id}
                        >
                          {INCOMING_REVIEW_STATUS_FILTER_ALL_OPTION.name}
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
