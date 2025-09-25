import { Loader2Icon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { rejectOutgoingReview } from "@/app/(protected)/home/actions";
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
import { OutgoingReview, UpdatedOutgoingReviewStatus } from "@/types/dashboard";

interface RejectOutgoingReviewDialogProps {
  open: boolean;
  data: OutgoingReview;
  onOpenChange: (opened: boolean) => void;
  onUpdatedReview: (updatedReview: UpdatedOutgoingReviewStatus) => void;
}

export function RejectOutgoingReviewDialog({
  open,
  data,
  onUpdatedReview,
  onOpenChange,
}: RejectOutgoingReviewDialogProps) {
  const { id, business } = data;
  const [isRejecting, startRejecting] = useTransition();

  const onReject = () => {
    startRejecting(async () => {
      try {
        const result = await rejectOutgoingReview(id);
        if (result.ok) {
          toast.success(`Reject outgoing review successfully`);
          // setStatus("approved");
          // Notify parent component that this review has been processed
          if (onUpdatedReview) {
            onUpdatedReview(result.data);
          }
        } else {
          throw result.error;
        }
      } catch (e) {
        toast.error("Failed to reject outgoing review", {
          description: `Error: ${e}`,
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reject outgoing review</DialogTitle>
          <DialogDescription>
            This action is permanent. The recipient will never receive review
            from you.
          </DialogDescription>
        </DialogHeader>
        <p>
          Are you sure you want to reject giving a review for{" "}
          <span className="font-semibold">{business.business_name}</span>?
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isRejecting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={onReject}
            disabled={isRejecting}
          >
            {isRejecting && <Loader2Icon className="animate-spin" />}
            Yes, I don't want to give a review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
