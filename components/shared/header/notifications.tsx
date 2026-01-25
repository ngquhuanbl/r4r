"use client";
import { Bell, BellDot, Check, Loader2Icon, MapPin, Store, X } from "lucide-react";
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
      <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-green-100 dark:bg-green-900 p-2">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-green-800 dark:text-green-200">
              Complete your review to{" "}
              <span className="font-semibold">{data.business.business_name}</span>{" "}
              in the <span className="font-medium">OUTGOING REVIEWS</span> section
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-teal-100 dark:bg-teal-900 p-2 shrink-0">
          <Store className="h-4 w-4 text-teal-600 dark:text-teal-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
            {data.business.business_name}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            requests a review from you
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {getAddress(data.business)}
              {data.business.phone && ` · ${data.business.phone}`}
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
        <Button
          size="sm"
          onClick={onAccept}
          disabled={isLoading}
          className="flex-1"
        >
          {isAccepting ? (
            <Loader2Icon className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isLoading}
          onClick={onReject}
          className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950 dark:hover:text-red-400 dark:hover:border-red-800"
        >
          {isRejecting ? (
            <Loader2Icon className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          Decline
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
        <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
          <Loader2Icon className="h-6 w-6 animate-spin mb-2" />
          <p className="text-sm">Loading notifications...</p>
        </div>
      );
      break;
    }
    case Status.SUCCEEDED: {
      content = hasRequests ? (
        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
          {requests.map((item) => (
            <ReviewRequestItem key={item.id} data={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-zinc-500 dark:text-zinc-400">
          <Bell className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">No pending requests</p>
          <p className="text-xs mt-1 opacity-70">
            You&apos;re all caught up!
          </p>
        </div>
      );
      break;
    }
    case Status.FAILED: {
      content = (
        <div className="flex flex-col items-center justify-center py-8 text-red-500">
          <X className="h-10 w-10 mb-3 opacity-50" />
          <p className="text-sm font-medium">Failed to load</p>
          <p className="text-xs mt-1 opacity-70">
            Please try again later
          </p>
        </div>
      );
    }
  }

  return (
    <Dialog modal={false}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          aria-label="Review request notifications"
          className="relative"
        >
          {hasRequests ? (
            <>
              <BellDot />
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-teal-500 text-[10px] font-bold text-white flex items-center justify-center">
                {requests.length > 9 ? "9+" : requests.length}
              </span>
            </>
          ) : (
            <Bell />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Review Requests
          </DialogTitle>
          <DialogDescription>
            When another business wants a review from you, their request will
            appear here.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-2">{content}</div>
      </DialogContent>
    </Dialog>
  );
}
