"use client";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
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
    <div className="flex flex-col grow">
      <div
        className="flex border border-zinc-200 border-b-0 w-full sm:w-max"
        role="tablist"
      >
        {/* INCOMING REVIEWS TAB */}
        <button
          id={INCOMING_REVIEWS_TAB_ID}
          className={cn("py-1 sm:py-2 px-3 sm:px-4 sm:pr-20 border-b-2", {
            "border-b-2 border-teal-600 grow": isIncomingReviewsTabSelected,
          })}
          role="tab"
          aria-labelledby="incoming-reviews-tab-label"
          aria-describedby="incoming-reviews-tab-desc"
          aria-selected={isIncomingReviewsTabSelected}
          aria-controls={INCOMING_REVIEWS_PANEL_ID}
          onClick={() => {
            setSelectedTab(INCOMING_REVIEWS_TAB_ID);
          }}
        >
          <div
            aria-hidden
            className={cn("flex items-center gap-2 sm:gap-4", {
              "opacity-70": !isIncomingReviewsTabSelected,
            })}
          >
            <ArrowDownLeft className="w-6 h-6 text-teal-600" />
            <div
              className={cn("text-start", {
                "hidden sm:block": !isIncomingReviewsTabSelected,
              })}
            >
              <p
                id="incoming-reviews-tab-label"
                className="uppercase font-semibold text-sm sm:text-base"
              >
                incoming reviews
              </p>
              <p id="incoming-reviews-tab-desc" className="text-xs sm:text-sm">
                Reviews from other businesses to you
              </p>
            </div>
          </div>
        </button>

        {/* OUTGOING REVIEWS TAB */}
        <button
          id={OUTGOING_REVIEWS_TAB_ID}
          className={cn(
            "py-1 sm:py-2 px-3 sm:px-4 sm:pr-20 border-b-2 border-l border-l-zinc-200",
            {
              "border-b-2 border-b-purple-600 grow":
                isOutgoingReviewsTabSelected,
            }
          )}
          role="tab"
          aria-labelledby="outgoing-reviews-tab-label"
          aria-describedby="outgoing-reviews-tab-desc"
          aria-selected={isOutgoingReviewsTabSelected}
          aria-controls={OUTGOING_REVIEWS_PANEL_ID}
          onClick={() => {
            setSelectedTab(OUTGOING_REVIEWS_TAB_ID);
          }}
        >
          <div
            aria-hidden
            className={cn("flex items-center gap-2 sm:gap-4", {
              "opacity-70": !isOutgoingReviewsTabSelected,
            })}
          >
            <ArrowUpRight className="w-6 h-6 text-purple-500" />
            <div
              className={cn("text-start", {
                "hidden sm:block": !isOutgoingReviewsTabSelected,
              })}
            >
              <p
                id="outgoing-reviews-tab-label"
                className="uppercase font-semibold text-sm sm:text-base"
              >
                outgoing reviews
              </p>
              <p id="outgoing-reviews-tab-desc" className="text-xs sm:text-sm">
                Reviews from you to others
              </p>
            </div>
          </div>
        </button>
      </div>
      <div className="grow md:min-h-[650px] md:grow-0 flex flex-col">
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
