"use client";
import { useState } from "react";

import { IncomingReviewsPanel } from "@/components/dashboard/YourReview/IncomingReviewPanel/Index";
import { OutgoingReviewsPanel } from "@/components/dashboard/YourReview/OutgoingReviewPanel/Index";
import {
  INCOMING_REVIEWS_PANEL_ID,
  INCOMING_REVIEWS_TAB_ID,
  OUTGOING_REVIEWS_PANEL_ID,
  OUTGOING_REVIEWS_TAB_ID,
} from "@/constants/dashboard/ui";
import { cn } from "@/lib/utils";

export function YourReview({ userId }: { userId: string }) {
  const [selectedTab, setSelectedTab] = useState(INCOMING_REVIEWS_TAB_ID);

  const isIncomingReviewsTabSelected = selectedTab === INCOMING_REVIEWS_TAB_ID;
  const isOutgoingReviewsTabSelected = selectedTab === OUTGOING_REVIEWS_TAB_ID;

  return (
    <div>
      <div
        className="flex border border-zinc-200 border-b-0 w-max"
        role="tablist"
      >
        {/* INCOMING REVIEWS TAB */}
        <button
          id={INCOMING_REVIEWS_TAB_ID}
          className={cn("py-2 px-4 pr-20 border-b-2", {
            "border-b-2 border-teal-600": isIncomingReviewsTabSelected,
          })}
          role="tab"
          aria-selected={isIncomingReviewsTabSelected}
          aria-controls={INCOMING_REVIEWS_PANEL_ID}
          onClick={() => setSelectedTab(INCOMING_REVIEWS_TAB_ID)}
        >
          <div
            className={cn("flex items-center gap-4", {
              "opacity-20": !isIncomingReviewsTabSelected,
            })}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 17 17"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 0.5L16.75 2.25L4.75 14.25H15.5V16.75H0.5V1.75H3V12.5L15 0.5Z"
                fill="#00C7BE"
              />
            </svg>
            <div className="text-start">
              <p className="uppercase font-semibold">incoming reviews</p>
              <p className="text-sm">Reviews from other businesses to you</p>
            </div>
          </div>
        </button>

        {/* OUTGOING REVIEWS TAB */}
        <button
          id={OUTGOING_REVIEWS_TAB_ID}
          className={cn(
            "py-2 px-4 pr-20 border-b-2 border-l border-l-zinc-200",
            {
              "border-b-2 border-b-purple-700 ": isOutgoingReviewsTabSelected,
            }
          )}
          role="tab"
          aria-selected={isOutgoingReviewsTabSelected}
          aria-controls={OUTGOING_REVIEWS_PANEL_ID}
          onClick={() => setSelectedTab(OUTGOING_REVIEWS_TAB_ID)}
        >
          <div
            className={cn("flex items-center gap-4", {
              "opacity-20": !isOutgoingReviewsTabSelected,
            })}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 30 30"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 22.5L6.25 20.75L18.25 8.75H7.5V6.25H22.5V21.25H20V10.5L8 22.5Z"
                fill="#AF52DE"
              />
            </svg>
            <div className="text-start">
              <p className="uppercase font-semibold">OUTGOING REVIEWS</p>
              <p className="text-sm">Reviews from you to others</p>
            </div>
          </div>
        </button>
      </div>
      <div className="h-[650px]">
        {/* INCOMING REVIEWS PANEL */}
        {isIncomingReviewsTabSelected && (
          <IncomingReviewsPanel userId={userId} />
        )}

        {/* OUTGOING REVIEWS PANEL */}
        {isOutgoingReviewsTabSelected && (
          <OutgoingReviewsPanel userId={userId} />
        )}
      </div>
    </div>
  );
}
