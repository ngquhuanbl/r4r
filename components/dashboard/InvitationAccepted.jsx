"use client";

import { useState } from "react";
import Container from "@/components/dashboard/Container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Submit } from "@/components/shared/submit";
import { submitReview } from "@/app/(protected)/home/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" height="20px" width="20px">
      <path d="M0 0h24v24H0z" fill="none"></path>
      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"></path>
    </svg>
  );
}

export default function InvitationAccepted({
  invitation,
  platformStyles = {},
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check if this invitation has a review and what status it's in
  const reviewStatus = invitation.review?.status_id;
  const isReviewSubmitted = reviewStatus === 2; // SUBMITTED status
  const isReviewVerified = reviewStatus === 3; // VERIFIED status
  const isReviewRejected = reviewStatus === 4; // REJECTED status

  // State to track local review status
  const [localReviewStatus, setLocalReviewStatus] = useState(reviewStatus);
  const isLocalReviewSubmitted = localReviewStatus === 2;

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await submitReview(invitation.id, reviewContent, reviewUrl);
      
      if (result.success) {
        // Update local state immediately to reflect the change without requiring a page refresh
        setLocalReviewStatus(result.status_id);
        
        // As a fallback, force a page refresh after a short delay if needed
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
    }

    setIsLoading(false);
    setIsOpen(false);
  };

  const platformData = platformStyles[invitation.platform?.id] || {
    color: "bg-gray-500",
    name: "Unknown",
  };

  const getInstructions = () => {
    if (platformData.name === "Google") {
      return (
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>
            Google "{invitation.business?.business_name}" and find it in the
            results
          </li>
          <li>Next to the stars, click where it says "X Google Reviews"</li>
          <li>Find your review in the pop-up window</li>
          <li>
            Click the share icon at the bottom of your review <ShareIcon />
          </li>
          <li>Click "Click to copy link"</li>
          <li>Paste the copied link in the Review URL field below</li>
        </ol>
      );
    } else if (platformData.name === "Yelp") {
      return (
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>
            Find your review on the Yelp page for{" "}
            {invitation.business?.business_name}
          </li>
          <li>
            Look for three horizontal dots (⋯) on the top right of your review
          </li>
          <li>Click on those dots, then click "Share Review"</li>
          <li>Copy and paste the link that you see in the box</li>
        </ol>
      );
    } else if (platformData.name === "TripAdvisor") {
      return (
        <ol className="list-decimal pl-5 space-y-1 text-sm">
          <li>
            Find your review on the TripAdvisor page for{" "}
            {invitation.business?.business_name}
          </li>
          <li>Under your review, look for the "Share" button</li>
          <li>Select "Copy Link"</li>
          <li>Paste that link below in the Review URL field</li>
        </ol>
      );
    }
    return (
      <ol className="list-decimal pl-5 space-y-1 text-sm">
        <li>
          Visit {platformData.name} and leave your review for{" "}
          {invitation.business?.business_name}
        </li>
        <li>Find your review on the platform</li>
        <li>Look for a share or link option for your review</li>
        <li>Copy that link and paste it below</li>
      </ol>
    );
  };

  return (
    <Container key={invitation.id}>
      <div>
        <h1 className="flex items-center text-xl font-semibold text-gray-900">
          {invitation.business?.business_name || "Unknown Business"}
          <Badge className={`ml-2 ${platformData.color}`}>
            {platformData.name}
          </Badge>
        </h1>
        <p className="text-sm text-gray-500">
          {invitation.business?.address}, {invitation.business?.city},{" "}
          {invitation.business?.state} {invitation.business?.zip_code}
        </p>
        {invitation.message && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium mb-1">
              Message from business owner:
            </p>
            <p className="text-sm italic">{invitation.message}</p>
          </div>
        )}
      </div>
      <div>
        {isReviewSubmitted || isReviewVerified || isReviewRejected || isLocalReviewSubmitted ? (
          <div>
            <div className="flex items-center mb-2">
              {(isReviewSubmitted || isLocalReviewSubmitted) && (
                <>
                  <Badge className="bg-amber-500">Review Submitted</Badge>
                  <p className="text-sm ml-2 text-gray-500">Waiting for business owner approval</p>
                </>
              )}
              {isReviewVerified && (
                <>
                  <Badge className="bg-green-500">Review Verified</Badge>
                  <p className="text-sm ml-2 text-gray-500">Approved by business owner</p>
                </>
              )}
              {isReviewRejected && (
                <>
                  <Badge className="bg-red-500">Review Rejected</Badge>
                  <p className="text-sm ml-2 text-gray-500">Contact the business owner for details</p>
                </>
              )}
            </div>
            {invitation.review?.content && (
              <div className="bg-gray-50 p-3 rounded-md text-sm mt-2">
                <p className="font-medium mb-1">Your review:</p>
                <p className="italic">{invitation.review.content}</p>
                {invitation.review.url && (
                  <a 
                    href={invitation.review.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 text-xs mt-2 block hover:underline"
                  >
                    View on {platformData.name}
                  </a>
                )}
              </div>
            )}
          </div>
        ) : (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>I've Left a Review</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Your Review</DialogTitle>
                <DialogDescription>
                  Enter the details of the review you left on {platformData.name}.
                </DialogDescription>
              </DialogHeader>

              <Alert className="bg-amber-50 border-amber-200 my-2">
                <AlertDescription className="text-center text-amber-800">
                  Leave your review on {platformData.name} first, then complete
                  this form.
                </AlertDescription>
              </Alert>

              <Accordion type="single" collapsible className="w-full mb-2">
                <AccordionItem value="instructions">
                  <AccordionTrigger className="text-sm text-blue-600">
                    How to get your review link
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="bg-gray-50 p-3 rounded-md">
                      {getInstructions()}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <form onSubmit={handleSubmitReview}>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label htmlFor="review-url">Review URL</Label>
                    <Input
                      id="review-url"
                      placeholder="Paste the URL to your review"
                      value={reviewUrl}
                      onChange={(e) => setReviewUrl(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="review-content">Review Content</Label>
                    <Textarea
                      id="review-content"
                      placeholder="Copy and paste your review content here"
                      rows={4}
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-md mt-2 mb-4">
                  <p className="text-xs text-blue-800">
                    After submitting this form, the business owner will be
                    notified and will verify your review. Only verified reviews
                    will be counted.
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Submit
                    type="submit"
                    text="Submit Review"
                    loadingText="Submitting..."
                    disabled={isLoading}
                  />
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Container>
  );
}
