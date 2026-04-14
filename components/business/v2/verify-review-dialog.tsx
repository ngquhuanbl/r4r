"use client";

import { Check, ExternalLink, Link2, Loader2Icon, X } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  confirmIncomingReview,
  rejectIncomingReview,
} from "@/app/(protected)/home/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { IncomingReview, UpdatedReviewStatus } from "@/types/dashboard";
import { ErrorUtils } from "@/utils/error";

function formatSubmittedAt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

interface VerifyReviewDialogProps {
  open: boolean;
  data: IncomingReview;
  onOpenChange: (open: boolean) => void;
  onUpdatedReview: (updatedReview: UpdatedReviewStatus) => void;
}

/** Spec: single-column verify flow for the business page workspace. */
export function VerifyReviewDialog({
  open,
  data,
  onOpenChange,
  onUpdatedReview,
}: VerifyReviewDialogProps) {
  const { url, content, invitation, id, created_at } = data;
  const subjectName = invitation.business.business_name;
  const reviewerName =
    invitation.invitee_business_name?.trim() || "Partner business";

  const platformName = invitation.platform.name;
  const reviewURL = url?.trim() ? url : null;
  const reviewContent = content ?? "";

  const [isConfirming, startConfirming] = useTransition();
  const [isRejecting, startRejecting] = useTransition();

  const onConfirm = () => {
    startConfirming(async () => {
      try {
        const result = await confirmIncomingReview(id);
        if (result.ok) {
          toast.success(`Confirm review successfully`);
          if (onUpdatedReview) {
            onUpdatedReview(result.data);
          }
        } else {
          throw result.error;
        }
      } catch (e) {
        toast.error("Failed to confirm review", {
          description: ErrorUtils.serializeError(e),
        });
      }
    });
  };

  const onReject = () => {
    startRejecting(async () => {
      try {
        const result = await rejectIncomingReview(id);
        if (result.ok) {
          toast.success(`Reject review successfully`);
          if (onUpdatedReview) {
            onUpdatedReview(result.data);
          }
        } else {
          throw result.error;
        }
      } catch (e) {
        toast.error("Failed to reject review", {
          description: ErrorUtils.serializeError(e),
        });
      }
    });
  };

  const isLoading = isConfirming || isRejecting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="space-y-2 px-6 pb-2 pt-6 text-left">
          <DialogTitle>Verify Review</DialogTitle>
          <DialogDescription className="text-pretty text-muted-foreground">
            Review submitted for{" "}
            <span className="font-semibold text-foreground">{subjectName}</span>{" "}
            by{" "}
            <span className="font-semibold text-foreground">{reviewerName}</span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-2">
          <dl className="space-y-3 text-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <dt className="shrink-0 text-muted-foreground">Reviewer</dt>
              <dd className="min-w-0 font-medium text-foreground">
                {reviewerName}
              </dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <dt className="shrink-0 text-muted-foreground">Platform</dt>
              <dd className="font-medium">{platformName}</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <dt className="shrink-0 text-muted-foreground">Submitted on</dt>
              <dd className="font-medium">{formatSubmittedAt(created_at)}</dd>
            </div>
          </dl>

          {reviewURL ? (
            <Button variant="outline" className="h-11 w-full justify-center" asChild>
              <a href={reviewURL} target="_blank" rel="noopener noreferrer">
                <Link2 className="mr-2 h-4 w-4" aria-hidden />
                Open review on {platformName}
                <ExternalLink className="ml-2 h-4 w-4 opacity-70" aria-hidden />
              </a>
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              No review URL was provided.
            </p>
          )}

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              Partner&apos;s message
            </p>
            <blockquote className="max-h-48 overflow-y-auto rounded-md border border-l-4 border-l-border border-border bg-muted/50 px-4 py-3 text-sm leading-relaxed text-foreground">
              {reviewContent ? (
                <span className="whitespace-pre-wrap">{reviewContent}</span>
              ) : (
                <span className="text-muted-foreground">(No text)</span>
              )}
            </blockquote>
          </div>
        </div>

        <Separator />

        <DialogFooter className="flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:mr-auto sm:w-auto"
            onClick={onReject}
            disabled={isLoading}
          >
            {isRejecting ? (
              <Loader2Icon className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
            Mark as invalid
          </Button>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="gap-2"
            >
              {isConfirming ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Confirm as valid
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
