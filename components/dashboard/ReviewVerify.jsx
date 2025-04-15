"use client";

import { useState, useTransition } from "react";
import Container from "@/components/dashboard/Container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { approveReview, denyReview } from "@/app/(protected)/home/actions";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function ReviewVerify({
  review,
  platformStyles = {},
  onReviewProcessed,
}) {
  const [isApproving, startApproving] = useTransition();
  const [isDenying, startDenying] = useTransition();
  const [status, setStatus] = useState(null); // 'approved', 'rejected', or null

  const handleApprove = () => {
    startApproving(async () => {
      try {
        const result = await approveReview(review.id);
        if (result.success) {
          toast.success(`Approve review successfully`);
          setStatus("approved");
          // Notify parent component that this review has been processed
          if (onReviewProcessed) {
            onReviewProcessed(review.id, "approved");
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

  const handleDeny = () => {
    startDenying(async () => {
      try {
        const result = await denyReview(review.id);
        if (result.success) {
          toast.success(`Deny review successfully`);
          setStatus("rejected");
          // Notify parent component that this review has been processed
          if (onReviewProcessed) {
            onReviewProcessed(review.id, "rejected");
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

  const platformData = platformStyles[review.platform?.id] || {
    color: "bg-gray-500",
    name: "Unknown",
  };
  const submittedDate = review.submitted_at
    ? formatDate(new Date(review.submitted_at))
    : "";

  const disabled = isApproving || isDenying;

  return (
    <Container
      key={review.id}
      className="flex-col items-start p-0 overflow-visible"
    >
      {/* Header section with business info and badge */}
      <div className="flex justify-between items-start w-full p-6 pb-4">
        <div>
          <h1 className="flex items-center text-xl font-semibold text-gray-900 dark:text-white">
            {review.business?.business_name || "Unknown Business"}
            <Badge className={`ml-2 ${platformData.color}`}>
              {platformData.name}
            </Badge>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
            {review.business?.address}, {review.business?.city},{" "}
            {review.business?.state} {review.business?.zip_code}
          </p>
          {submittedDate && (
            <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">
              Submitted on {submittedDate}
            </p>
          )}
        </div>

        {/* Review URL link moves to top right */}
        {review.review_url && (
          <a
            href={review.review_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center"
          >
            View on {platformData.name}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
      </div>

      {/* Review content section with distinct background */}
      <div className="w-full bg-gray-50 dark:bg-gray-900 p-6 border-t border-b border-gray-200 dark:border-gray-800">
        <div className="mb-2 flex items-center">
          <div className="bg-gray-600 dark:bg-gray-500 h-6 w-1 rounded mr-2"></div>
          <h2 className="font-medium text-gray-800 dark:text-white">
            Review Content
          </h2>
        </div>
        <div className="bg-white dark:bg-black rounded-md p-4 shadow-sm border border-gray-100 dark:border-gray-800">
          <p className="text-gray-700 dark:text-white italic whitespace-pre-line">
            {review.review_content}
          </p>
        </div>
      </div>

      {/* Actions section */}
      <div className="w-full p-6 pt-4 flex justify-end">
        {status === "approved" ? (
          <div className="bg-green-50 text-green-700 font-medium px-4 py-2 rounded-md border border-green-200 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Review approved successfully
          </div>
        ) : status === "rejected" ? (
          <div className="bg-red-50 text-red-700 font-medium px-4 py-2 rounded-md border border-red-200 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            Review marked as invalid
          </div>
        ) : (
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleDeny}
              disabled={disabled}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              loading={isDenying}
            >
              Not Valid
            </Button>
            <Button
              onClick={handleApprove}
              disabled={disabled}
              className="bg-green-600 hover:bg-green-700 dark:text-white"
              loading={isApproving}
            >
              Confirm Review
            </Button>
          </div>
        )}
      </div>
    </Container>
  );
}
