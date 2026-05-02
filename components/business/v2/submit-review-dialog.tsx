import {
  ExternalLink,
  Loader2Icon,
  Send,
  Share2,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import { submitOutgoingReview } from "@/app/(protected)/home/actions";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { OutgoingReview, SubmitReviewResponse } from "@/types/dashboard";
import { ErrorUtils } from "@/utils/error";

const REVIEW_URL_FIELD_NAME = "url";
const REVIEW_CONTENT_FIELD_NAME = "content";
const FORM_ID = "submit-outgoing-review-form";

const TIP_ROTATE_MS = 45_000;

const SUBMIT_REVIEW_TIPS = [
  "One real detail beats a vague “love it”—helps them verify you were there.",
  "Keep it constructive. You’re swapping honest value, not venting.",
  "If speed or communication stood out, say so.",
  "Short is fine. Just make it true to what you saw.",
  "Skim for typos before you paste the link.",
] as const;

interface SubmitReviewDialogProps {
  open: boolean;
  data: OutgoingReview;
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

  const partnerListingUrl = useMemo(() => {
    const rows = businessInfo.business_platforms ?? [];
    const row = rows.find((bp) => bp.platform_id === platformInfo.id);
    const url = row?.platform_url;
    return url?.trim() ? url : null;
  }, [businessInfo.business_platforms, platformInfo.id]);

  const [reviewUrl, setReviewUrl] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [howToOpen, setHowToOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    setReviewUrl(data.url?.trim() ? data.url : "");
    setReviewContent(data.content?.trim() ? data.content : "");
    setHowToOpen(false);
    setTipIndex(0);
  }, [open, data.id, data.url, data.content]);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % SUBMIT_REVIEW_TIPS.length);
    }, TIP_ROTATE_MS);
    return () => clearInterval(id);
  }, [open]);

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
    [id, onUpdatedReview]
  );

  const getInstructions = () => {
    if (platformName === "Google") {
      return (
        <ol className="list-decimal space-y-1 pl-5 text-xs sm:text-sm">
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
    }
    if (platformName === "Yelp") {
      return (
        <ol className="list-decimal space-y-1 pl-5 text-xs sm:text-sm">
          <li>Find your review on the Yelp page for {businessName}</li>
          <li>
            Look for three horizontal dots (⋯) on the top right of your review
          </li>
          <li>Click on those dots, then click "Share Review"</li>
          <li>Copy and paste the link that you see in the box</li>
        </ol>
      );
    }
    if (platformName === "TripAdvisor") {
      return (
        <ol className="list-decimal space-y-1 pl-5 text-xs sm:text-sm">
          <li>Find your review on the TripAdvisor page for {businessName}</li>
          <li>Under your review, look for the "Share" button</li>
          <li>Select "Copy Link"</li>
          <li>Paste that link below in the Review URL field</li>
        </ol>
      );
    }
    return (
      <ol className="list-decimal space-y-1 pl-5 text-xs sm:text-sm">
        <li>
          Visit {platformName} and leave your review for {businessName}
        </li>
        <li>Find your review on the platform</li>
        <li>Look for a share or link option for your review</li>
        <li>Copy that link and paste it below</li>
      </ol>
    );
  };

  const canSubmit =
    reviewUrl.trim().length > 0 && reviewContent.trim().length > 0;
  const isLoading = isSubmitting;

  const goToPlatformControl =
    partnerListingUrl != null ? (
      <Button
        variant="ghost"
        className="h-auto w-full justify-center border border-border bg-muted/30 py-2.5 text-foreground shadow-none hover:bg-muted/60"
        asChild
      >
        <a
          href={partnerListingUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Go to {platformName}
          <ExternalLink className="ml-2 h-4 w-4 shrink-0" aria-hidden />
        </a>
      </Button>
    ) : (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex w-full">
              <Button
                type="button"
                variant="ghost"
                disabled
                className="w-full justify-center border border-dashed border-border opacity-80"
              >
                Go to {platformName}
                <ExternalLink className="ml-2 h-4 w-4 shrink-0" aria-hidden />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>Listing link not available for this business yet.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,900px)] w-full max-w-[min(100vw-2rem,62.5rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[940px]">
        <DialogHeader className="space-y-2 border-b border-border px-6 py-5 text-left">
          <DialogTitle className="text-xl font-semibold leading-tight">
            Submit review for {businessName}
          </DialogTitle>
        </DialogHeader>

        <form
          id={FORM_ID}
          className="flex min-h-0 flex-1 flex-col"
          action={onSubmit}
        >
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_1px_minmax(0,3fr)]">
              <div className="space-y-8 px-6 py-6 lg:pr-5">
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold tracking-wide text-foreground">
                    1. Visit Business
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Click to open {businessName} on {platformName} in a new tab.
                  </p>
                  {goToPlatformControl}
                </section>

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold tracking-wide text-foreground">
                    2. Leave Honest Review
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Write a genuine, professional review. Focus on specific
                    service details.
                  </p>
                  <div className="rounded-md border border-l-4 border-l-amber-400/80 border-border bg-muted/60 px-3 py-2.5 text-sm">
                    <p className="flex gap-2 text-muted-foreground">
                      <span aria-hidden className="shrink-0">
                        💡
                      </span>
                      <span className="min-w-0 min-h-[2.5rem] leading-relaxed">
                        <span className="font-medium not-italic text-foreground/90">
                          Tip:{" "}
                        </span>
                        <span className="inline-block [perspective:900px] align-baseline">
                          <span
                            key={tipIndex}
                            aria-live="polite"
                            className="submit-tip-flip inline-block italic"
                          >
                            {SUBMIT_REVIEW_TIPS[tipIndex]}
                          </span>
                        </span>
                      </span>
                    </p>
                  </div>
                </section>
              </div>

              <div
                className="h-px bg-border lg:h-auto lg:min-h-0 lg:w-px"
                aria-hidden
              />

              <div className="space-y-5 px-6 py-6 lg:pl-5">
                <h3 className="text-sm font-semibold tracking-wide text-foreground">
                  3. Confirm completion
                </h3>

                <div className="grid gap-2">
                  <Label htmlFor="out-going-review-url">Review URL</Label>
                  <Input
                    id="out-going-review-url"
                    name={REVIEW_URL_FIELD_NAME}
                    value={reviewUrl}
                    onChange={(e) => setReviewUrl(e.target.value)}
                    placeholder="Paste the link to your review here"
                    className="text-sm sm:text-base"
                    autoComplete="off"
                  />
                </div>

                <Collapsible open={howToOpen} onOpenChange={setHowToOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/90"
                    >
                      How do I find my review link?
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 rounded-md border border-border bg-muted/40 px-3 py-3 text-muted-foreground">
                    {getInstructions()}
                  </CollapsibleContent>
                </Collapsible>

                <div className="grid gap-2">
                  <Label htmlFor="review-content">Review content</Label>
                  <Textarea
                    id="review-content"
                    name={REVIEW_CONTENT_FIELD_NAME}
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="Paste your review text here"
                    rows={5}
                    className="min-h-[120px] text-sm sm:text-base"
                  />
                  <p className="text-xs text-muted-foreground">
                    The owner will use this to verify your review matches.
                  </p>
                </div>

                <p className="text-xs italic text-muted-foreground">
                  After submitting, the owner will be notified for verification.<br/>
                  <b>Submitting your review will free up a connection slot on your plan.</b>
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-0 shrink-0 gap-2 border-t border-border px-6 py-4 sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              form={FORM_ID}
              disabled={!canSubmit || isLoading}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
