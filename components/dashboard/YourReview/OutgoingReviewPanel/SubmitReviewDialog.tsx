import { Loader2Icon, Send, Share2 } from "lucide-react";
import { useCallback, useTransition } from "react";
import { toast } from "sonner";

import { submitOutgoingReview } from "@/app/(protected)/home/actions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Review, SubmitReviewResponse } from "@/types/dashboard";
import { ErrorUtils } from "@/utils/error";

const REVIEW_URL_FIELD_NAME = "url";
const REVIEW_CONTENT_FIELD_NAME = "content";

interface SubmitReviewDialogProps {
  open: boolean;
  data: Review;
  onOpenChange: (open: boolean) => void;
  onUpdatedReview: (updatedReview: SubmitReviewResponse) => void;
}
export function SubmitReviewDialog({
  open,
  data,
  onOpenChange,
  onUpdatedReview,
}: SubmitReviewDialogProps) {
  const { invitation, id } = data;
  const businessInfo = invitation.business;
  const businessName = businessInfo.business_name;

  const platformInfo = invitation.platform;
  const platformName = platformInfo.name;

  const [isSubmitting, startSubmitting] = useTransition();

  const onSubmit = useCallback(
    (formData: FormData) => {
      startSubmitting(async () => {
        try {
          const result = await submitOutgoingReview(
            id,
            formData.get(REVIEW_CONTENT_FIELD_NAME) as string,
            formData.get(REVIEW_URL_FIELD_NAME) as string
          );
          if (result.ok) {
            toast.success(`Submit review successfully`);
            // setStatus("approved");
            // Notify parent component that this review has been processed
            if (onUpdatedReview) {
              onUpdatedReview(result.data);
            }
          } else {
            throw result.error;
          }
        } catch (e) {
          toast.error("Failed to submit review", {
            description: ErrorUtils.serializeError(e),
          });
        }
      });
    },
    [id]
  );

  const getInstructions = () => {
    if (platformName === "Google") {
      return (
        <ol className="list-decimal pl-5 space-y-1 text-xs sm:text-sm">
          <li>Google "{businessName}" and find it in the results</li>
          <li>
            Next to the stars, click where it says "{`<number>`} Google Reviews"
            (in which {`<number>`} is a numeric value)
          </li>
          <li>Find your review in the pop-up window</li>
          <li className="align-middle">
            Click the share icon at the bottom of your review{" "}
            <Share2 className="inline" />
          </li>
          <li>Click "Click to copy link"</li>
          <li>Paste the copied link in the Review URL field above</li>
        </ol>
      );
    } else if (platformName === "Yelp") {
      return (
        <ol className="list-decimal pl-5 space-y-1 text-xs sm:text-sm">
          <li>Find your review on the Yelp page for {businessName}</li>
          <li>
            Look for three horizontal dots (⋯) on the top right of your review
          </li>
          <li>Click on those dots, then click "Share Review"</li>
          <li>Copy and paste the link that you see in the box</li>
        </ol>
      );
    } else if (platformName === "TripAdvisor") {
      return (
        <ol className="list-decimal pl-5 space-y-1 text-xs sm:text-sm">
          <li>Find your review on the TripAdvisor page for {businessName}</li>
          <li>Under your review, look for the "Share" button</li>
          <li>Select "Copy Link"</li>
          <li>Paste that link below in the Review URL field</li>
        </ol>
      );
    }
    return (
      <ol className="list-decimal pl-5 space-y-1 text-xs sm:text-sm">
        <li>
          Visit {platformName} and leave your review for {businessName}
        </li>
        <li>Find your review on the platform</li>
        <li>Look for a share or link option for your review</li>
        <li>Copy that link and paste it below</li>
      </ol>
    );
  };

  const isLoading = isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-screen sm:max-w-[60%]">
        <DialogHeader>
          <DialogTitle>Submit review</DialogTitle>
          <DialogDescription>
            Please follow these steps to submit your review for{" "}
            <span className="font-semibold">{businessName}</span> and help
            foster authenticity in our network.
          </DialogDescription>
        </DialogHeader>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full text-center bg-slate-300 text-primary font-semibold flex items-center justify-center text-xs sm:text-sm">
                  1
                </div>
                <p className="font-semibold text-sm sm:text-base">
                  Visit <span>{businessName}</span> on {platformName}
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p className="font-base text-xs sm:text-sm">
                Leave your review for{" "}
                <span className="font-medium">{businessName}</span> on{" "}
                <span className="font-medium">{platformName}</span> first, then
                move to the next steps
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full text-center bg-slate-300 text-primary font-semibold flex items-center justify-center text-xs sm:text-sm">
                  2
                </div>
                <p className="font-semibold text-sm sm:text-base">
                  Leave Your Honest Review
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <p className="text-xs sm:text-sm">
                Write a genuine, constructive review based on your experience or
                knowledge of <span className="font-medium">{businessName}</span>
                .
              </p>
              <div className="px-3 py-2 border border-sky-400 bg-cyan-100 rounded-md">
                <p className="italic text-sky-700 text-xs sm:text-sm">
                  <span className="font-semibold">Tip:</span>&nbsp;Focus on
                  specific aspects, be professional, and ensure your review adds
                  value to future visitors.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full text-center bg-slate-300 text-primary font-semibold flex items-center justify-center text-xs sm:text-sm">
                  3
                </div>
                <p className="font-semibold text-sm sm:text-base">
                  Confirm review completion
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-4 text-balance">
              <form action={onSubmit} className="flex flex-col gap-2 sm:gap-3">
                <div>
                  <div className="grid gap-1 sm:gap-2">
                    <Label
                      className="text-sm sm:text-base"
                      htmlFor="out-going-review-url"
                    >
                      Your review URL:
                    </Label>
                    <Input
                      id="out-going-review-url"
                      name={REVIEW_URL_FIELD_NAME}
                      placeholder="Enter the review URL"
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="instructions">
                      <AccordionTrigger className="text-xs sm:text-sm text-sky-700">
                        How to get your review URL
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="px-3 py-2 bg-cyan-100 rounded-md text-xs sm:text-sm">
                          {getInstructions()}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
                <div className="grid gap-1 sm:gap-2">
                  <Label
                    className="text-sm sm:text-base"
                    htmlFor="review-content"
                  >
                    Your review content:
                  </Label>
                  <Textarea
                    className="text-sm sm:text-base"
                    id="review-content"
                    placeholder="Copy and paste your review content here"
                    rows={4}
                    required
                    name={REVIEW_CONTENT_FIELD_NAME}
                  />
                </div>
                <div className="px-3 py-2 border border-sky-400 bg-cyan-100 rounded-md text-xs sm:text-sm">
                  <p className="text-sky-700 text-xs sm:text-sm italic">
                    After submitting this form, the business owner will be
                    notified and will verify your review.
                    <br />
                    Only verified reviews will be counted.
                  </p>
                </div>
                <div className="flex flex-row-reverse items-center gap-2 sm:gap-4">
                  <Button
                    type="submit"
                    className="bg-violet-600 hover:bg-violet-800"
                    disabled={isLoading}
                  >
                    {isSubmitting ? (
                      <Loader2Icon className="animate-spin" />
                    ) : (
                      <Send />
                    )}
                    Submit review
                  </Button>
                  <DialogClose asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                </div>
              </form>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}
