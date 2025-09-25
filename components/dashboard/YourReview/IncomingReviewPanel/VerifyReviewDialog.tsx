import { Check, ExternalLink, Loader2Icon, X } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  confirmIncomingReview,
  rejectIncomingReview,
} from "@/app/(protected)/home/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IncomingReview, UpdatedIncomingReviewStatus } from "@/types/dashboard";
import { getAddress } from "@/utils/shared";

interface VerifyReviewDialogProps {
  open: boolean;
  data: IncomingReview;
  onOpenChange: (open: boolean) => void;
  onUpdatedReview: (updatedReview: UpdatedIncomingReviewStatus) => void;
}
export function VerifyReviewDialog({
  open,
  data,
  onOpenChange,
  onUpdatedReview,
}: VerifyReviewDialogProps) {
  const { url, content, status, invitation, id } = data;
  const businessInfo = invitation.business;
  const businessName = businessInfo.business_name;
  const businessAddress = getAddress(businessInfo);

  const platformInfo = invitation.platform;
  const platformName = platformInfo.name;

  const reviewURL = url;
  const reviewContent = content;
  const reviewStatusName = status.name;

  const [isConfirming, startConfirming] = useTransition();
  const [isRejecting, startRejecting] = useTransition();

  const onConfirm = () => {
    startConfirming(async () => {
      try {
        const result = await confirmIncomingReview(id);
        if (result.ok) {
          toast.success(`Confirm review successfully`);
          // setStatus("approved");
          // Notify parent component that this review has been processed
          if (onUpdatedReview) {
            onUpdatedReview(result.data);
          }
        } else {
          throw result.error;
        }
      } catch (e) {
        toast.error("Failed to approve review", {
          description: `Error: ${e}`,
        });
      }
    });
  };

  const onReject = () => {
    startRejecting(async () => {
      try {
        const result = await rejectIncomingReview(id);
        if (result.ok) {
          toast.success(`Deny review successfully`);
          // setStatus("rejected");
          // Notify parent component that this review has been processed
          if (onUpdatedReview) {
            onUpdatedReview(result.data);
          }
        } else {
          throw result.error;
        }
      } catch (e) {
        toast.error("Failed to deny review", {
          description: `Error: ${e}`,
        });
      }
    });
  };

  const isLoading = isConfirming || isRejecting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen sm:max-w-[60%]">
        <DialogHeader>
          <DialogTitle>Verify review</DialogTitle>
          <DialogDescription>
            A review has been submitted for{" "}
            <span className="font-semibold">{businessName}</span>. Please verify
            its authenticity.
          </DialogDescription>
        </DialogHeader>
        <table className="border border-zinc-300 border-collapse ">
          <tbody>
            <tr>
              <th className="border border-zinc-300 text-start p-2 text-xs sm:text-sm ">
                Reviewer
              </th>
              <td className="border border-zinc-300 p-2 text-start text-xs sm:text-sm ">
                {businessName}
              </td>
            </tr>
            <tr>
              <th className="border border-zinc-300 text-start p-2 text-xs sm:text-sm">
                Platform
              </th>
              <td className="border border-zinc-300 p-2 text-start text-xs sm:text-sm">
                {platformName}
              </td>
            </tr>
            <tr>
              <th className="border border-zinc-300 text-start p-2 text-xs sm:text-sm ">
                Address
              </th>
              <td className="border border-zinc-300 p-2 text-start text-xs sm:text-sm ">
                {businessAddress}
              </td>
            </tr>
            <tr>
              <th className="border border-zinc-300 text-start p-2 text-xs sm:text-sm ">
                URL
              </th>
              <td className="border border-zinc-300 p-2 text-start text-xs sm:text-sm ">
                <Link
                  className="underline text-primary break-all"
                  href={reviewURL!}
                  target="_blank"
                  rel="noreferrer"
                >
                  {reviewURL}&nbsp;
                  <ExternalLink className="inline w-3 h-3 align-middle" />
                </Link>
              </td>
            </tr>
            <tr>
              <th className="border border-zinc-300 text-start p-2 text-xs sm:text-sm ">
                Content
              </th>
              <td className="border border-zinc-300 p-2 text-start text-xs sm:text-sm ">
                &quot;{reviewContent}&quot;
              </td>
            </tr>
          </tbody>
        </table>
        <div>
          <p className="font-semibold">Actions</p>
          <p className="text-xs sm:text-sm">
            <span>
              After reviewing the details and checking the review on{" "}
              {platformName} via{" "}
              <Link
                className="underline font-semibold text-primary"
                href={reviewURL!}
                target="_blank"
                rel="noreferrer"
              >
                this link
              </Link>
            </span>
            , <br /> please confirm its validity.
          </p>
        </div>
        <DialogFooter>
          <div className="flex flex-col gap-2 items-end">
            <Button
              className="bg-teal-600"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isConfirming ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <Check />
              )}
              Confirm the review is valid
            </Button>
            <Button
              variant="destructive"
              onClick={onReject}
              disabled={isLoading}
            >
              {isRejecting ? <Loader2Icon className="animate-spin" /> : <X />}
              Mark the review as invalid/dispute
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
