"use client";
import { Bell, BellDot, Loader2Icon } from "lucide-react";
import React, { useCallback, useEffect, useTransition } from "react";
import { toast } from "sonner";

import {
  acceptReviewRequest,
  rejectReviewRequest,
} from "@/app/(protected)/home/actions";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  reviewRequestsActions,
  reviewRequestsSelectors,
  Status,
} from "@/lib/redux/slices/review-request";
import { ReviewRequest } from "@/types/dashboard";
import { UserId } from "@/types/shared";
import { ReviewRequestUtils } from "@/utils/review-request";
import { getAddress } from "@/utils/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ReviewRequestItemProps {
  data: ReviewRequest;
}
function ReviewRequestItem({ data }: ReviewRequestItemProps) {
  const [isAccepting, startAccepting] = useTransition();
  const [isRejecting, startRejecting] = useTransition();
  const dispatch = useAppDispatch();

  const onAccept = useCallback(() => {
    startAccepting(async () => {
      try {
        const result = await acceptReviewRequest(data.id);
        if (result.ok) {
          dispatch(reviewRequestsActions.updateStatus(result.data));
        } else {
          toast.error(`Failed to accept review request`);
        }
      } catch (e) {
        toast.error(`Failed to accept review request`);
      }
    });
  }, [data.id, dispatch]);

  const onReject = useCallback(() => {
    startRejecting(async () => {
      try {
        const result = await rejectReviewRequest(data.id);
        if (result.ok) {
          dispatch(reviewRequestsActions.requestRemoved(data.id));
        } else {
          toast.error(`Failed to reject review request`);
        }
      } catch (e) {
        toast.error(`Failed to reject review request`);
      }
    });
  }, [data.id, dispatch]);

  const isLoading = isAccepting || isRejecting;

  if (ReviewRequestUtils.isAcceptedStatus(data.status.name)) {
    return (
      <div className="px-2 text-sm">
        <p>
          Complete your review to{" "}
          <span className="font-semibold">{data.business.business_name}</span>{" "}
          in the OUTGOING REVIEWS section
        </p>
      </div>
    );
  }
  return (
    <div className="px-2 text-sm">
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
  const status = useAppSelector(reviewRequestsSelectors.selectStatus);
  const requests = useAppSelector(reviewRequestsSelectors.selectData);
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(reviewRequestsActions.fetchReviewRequestsThunk(userId));
  }, [userId, dispatch]);

  const hasRequests = requests.length !== 0;

  let content = null;
  switch (status) {
    case Status.INIT:
    case Status.LOADING: {
      content = (
        <div className="flex gap-4 px-2 text-center items-center">
          <Loader2Icon className="animate-spin text-sm" />
          <p className="text-sm">Loading ...</p>
        </div>
      );
      break;
    }
    case Status.SUCCEEDED: {
      content = hasRequests ? (
        <div>
          {requests.map((item) => (
            <ReviewRequestItem key={item.id} data={item} />
          ))}
        </div>
      ) : (
        <div className="px-2 text-center text-sm text-gray-800 dark:text-gray-400">
          <p>Nothing here</p>
        </div>
      );
      break;
    }
    case Status.FAILED: {
      content = (
        <div className="px-2 text-center text-destructive">
          <p>Failed to load review requests</p>
        </div>
      );
    }
  }

  return (
    <Dialog modal={false}>
      <DialogTrigger asChild>
        <Button variant="ghost" aria-label="Review request notifications">
          {hasRequests ? <BellDot /> : <Bell />}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review request notifications</DialogTitle>
          <DialogDescription>
            When another business wants a review from you, their request will
            appear here.
          </DialogDescription>
          <div className="py-2 flex flex-col gap-3">{content}</div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
