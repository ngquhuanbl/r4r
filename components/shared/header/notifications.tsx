"use client";

import { Bell, BellDot, Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import React, { useCallback, useEffect, useState, useTransition } from "react";
import {
  Status,
  reviewRequestsActions,
  reviewRequestsSelectors,
} from "@/lib/redux/slices/review-request";
import {
  acceptReviewRequest,
  rejectReviewRequest,
} from "@/app/(protected)/home/actions";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { myBusinessesSelectors } from "@/lib/redux/slices/my-business";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReviewRequest } from "@/types/dashboard";
import { ReviewRequestUtils } from "@/utils/review-request";
import { UserId } from "@/types/shared";
import { getAddress } from "@/utils/shared";
import { toast } from "sonner";

interface ReviewRequestItemProps {
  data: ReviewRequest;
}
function ReviewRequestItem({ data }: ReviewRequestItemProps) {
  const [isAccepting, startAccepting] = useTransition();
  const [isRejecting, startRejecting] = useTransition();
  const dispatch = useAppDispatch();
  const myBusinesses = useAppSelector(myBusinessesSelectors.selectData);
  const [inviteeBusinessId, setInviteeBusinessId] = useState<string>("");

  useEffect(() => {
    if (myBusinesses.length && !inviteeBusinessId) {
      setInviteeBusinessId(String(myBusinesses[0].id));
    }
  }, [myBusinesses, inviteeBusinessId]);

  const onAccept = useCallback(() => {
    startAccepting(async () => {
      try {
        if (myBusinesses.length === 0) {
          toast.error("Add a business before accepting");
          return;
        }
        const chosen =
          myBusinesses.length > 1
            ? Number.parseInt(inviteeBusinessId, 10)
            : myBusinesses[0].id;
        if (myBusinesses.length > 1 && Number.isNaN(chosen)) {
          toast.error("Choose which of your businesses this review is for");
          return;
        }
        const result = await acceptReviewRequest(data.id, chosen);
        if (result.ok) {
          dispatch(reviewRequestsActions.updateStatus(result.data));
        } else {
          toast.error("Failed to accept review request", {
            description:
              typeof result.error === "string"
                ? result.error
                : String(result.error),
          });
        }
      } catch (e) {
        toast.error(`Failed to accept review request`);
      }
    });
  }, [
    data.id,
    dispatch,
    inviteeBusinessId,
    myBusinesses,
  ]);

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
      {myBusinesses.length > 1 ? (
        <div className="mb-2 space-y-1">
          <Label className="text-xs">Your business for this review</Label>
          <Select
            value={inviteeBusinessId}
            onValueChange={setInviteeBusinessId}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select business" />
            </SelectTrigger>
            <SelectContent>
              {myBusinesses.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.business_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
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
        <Button variant="ghost" aria-label="Review request notifications" size="icon" className="rounded-full">
          {hasRequests ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20px"
              viewBox="0 -960 960 960"
              width="20px"
              fill="#334155"
            >
              <path d="M192-216v-72h48v-240q0-87 53.5-153T432-763v-53q0-20 14-34t34-14q20 0 34 14t14 34v53q85 16 138.5 82T720-528v240h48v72H192ZM479.79-96Q450-96 429-117.15T408-168h144q0 30-21.21 51t-51 21Z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#334155"
            >
              <path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160ZM480-80q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80Z" />
            </svg>
          )}
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
