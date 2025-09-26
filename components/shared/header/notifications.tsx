"use client";
import { Bell, BellDot, Loader2Icon } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  acceptReviewRequest,
  fetchPendingReviewRequests,
  rejectReviewRequest,
} from "@/app/(protected)/home/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReviewRequest, UpdatedReviewRequestsStatus } from "@/types/dashboard";
import { UserId } from "@/types/shared";
import { ReviewRequestUtils } from "@/utils/review-request";
import { getAddress } from "@/utils/shared";

interface ReviewRequestItemProps {
  data: ReviewRequest;
  onUpdateStatus: (data: UpdatedReviewRequestsStatus) => void;
}
function ReviewRequestItem({ data, onUpdateStatus }: ReviewRequestItemProps) {
  const [isAccepting, startAccepting] = useTransition();
  const [isRejecting, startRejecting] = useTransition();

  const onAccept = useCallback(() => {
    startAccepting(async () => {
      try {
        const result = await acceptReviewRequest(data.id);
        if (result.ok) {
          onUpdateStatus(result.data);
        } else {
          toast.error(`Failed to accept review request`);
        }
      } catch (e) {
        toast.error(`Failed to accept review request`);
      }
    });
  }, [data.id, onUpdateStatus]);

  const onReject = useCallback(() => {
    startRejecting(async () => {
      try {
        const result = await rejectReviewRequest(data.id);
        if (result.ok) {
          onUpdateStatus(result.data);
        } else {
          toast.error(`Failed to reject review request`);
        }
      } catch (e) {
        toast.error(`Failed to reject review request`);
      }
    });
  }, []);

  const isLoading = isAccepting || isRejecting;

  if (ReviewRequestUtils.isAcceptedStatus(data.status.name)) {
    return (
      <div className="p-4 text-sm">
        <p>
          Complete your review to{" "}
          <span className="font-semibold">{data.business.business_name}</span>{" "}
          in the OUTGOING REVIEWS section
        </p>
      </div>
    );
  }
  return (
    <div className="p-4 text-sm">
      <p>
        <span className="font-semibold">{data.business.business_name}</span>{" "}
        requests a review from you
      </p>
      <p className="text-xs mt-1 mb-2">
        {getAddress(data.business)} | {data.business.phone}
      </p>
      <div className="flex gap-2">
        <Button onClick={onAccept} disabled={isLoading}>
          {isAccepting && <Loader2Icon className="animate-spin" />}
          Accept
        </Button>
        <Button variant="destructive" disabled={isLoading} onClick={onReject}>
          {isRejecting && <Loader2Icon className="animate-spin" />}
          Delete
        </Button>
      </div>
    </div>
  );
}

interface NotificationsProps {
  userId: UserId;
}
export function Notifications({ userId }: NotificationsProps) {
  const [requests, setRequests] = useState<Array<ReviewRequest>>([]);
  const [isLoading, startTransition] = useTransition();
  useEffect(() => {
    let shouldIgnore = false;
    startTransition(async () => {
      try {
        const result = await fetchPendingReviewRequests(userId);
        if (shouldIgnore) return;
        if (result.ok) {
          setRequests(result.data);
        } else {
          toast.error(`Failed to load request reviews`, {
            description: result.error,
          });
        }
      } catch (e) {
        toast.error(`Failed to load request reviews`, {
          description: JSON.stringify(e),
        });
      }
    });
    return () => {
      shouldIgnore = true;
    };
  }, [userId]);

  const onUpdatedRequestStatus = useCallback(
    (data: UpdatedReviewRequestsStatus) => {
      if (ReviewRequestUtils.isRejectedStatus(data.status.name)) {
        setRequests((prevState) =>
          prevState.filter(({ id: currId }) => currId !== data.id)
        );
      } else if (ReviewRequestUtils.isAcceptedStatus(data.status.name)) {
        setRequests((prevState) =>
          prevState.map((item) => {
            if (item.id !== data.id) return item;
            return {
              ...item,
              status: {
                ...data.status,
              },
            };
          })
        );
      } else {
        toast.error(`Unexpected error during processing review request`);
      }
    },
    []
  );

  const hasRequests = requests.length !== 0;

  let content = null;
  if (isLoading) {
    content = (
      <div className="flex gap-4 p-4 text-center items-center">
        <Loader2Icon className="animate-spin text-sm" />
        <p className="text-sm">Loading ...</p>
      </div>
    );
  } else {
    content = hasRequests ? (
      <div>
        {requests.map((item) => (
          <ReviewRequestItem
            key={item.id}
            data={item}
            onUpdateStatus={onUpdatedRequestStatus}
          />
        ))}
      </div>
    ) : (
      <div className="p-4 text-center">
        <p>Nothing to shown</p>
      </div>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">{hasRequests ? <BellDot /> : <Bell />}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-screen md:w-[400px]">
        <DropdownMenuLabel className="text-base">
          Review requests
        </DropdownMenuLabel>
        {content}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
