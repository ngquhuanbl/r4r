import { Bell } from "lucide-react";

import { Paths } from "../paths";
import { ONBOARDING_STEP_IDS } from "./ui";

import type { Tour } from "nextstepjs";
export const ONBOARDING_TOUR_NAME = "onboardingTour";

export const ONBOARDING_STEPS: Tour[] = [
  {
    tour: ONBOARDING_TOUR_NAME,
    steps: [
      {
        title: "Navigation Bar",
        content: (
          <div className="flex flex-col gap-3">
            <p>
              <b className="font-semibold">Dashboard</b>: Manage all reviews for
              your businesses.
            </p>
            <p>
              <b className="font-semibold">My businesses</b>: View and edit your
              business profiles.
            </p>
          </div>
        ),
        icon: <>🌍</>,
        selector: "#" + ONBOARDING_STEP_IDS.NAV_BAR,
        side: "bottom",
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        title: "Review Request Notifications",
        content: (
          <div className="flex flex-col gap-3">
            <p className="font-semibold text-primary">
              When another business wants a review from you, their request will
              appear here.
            </p>
            <p>
              If you <b className="font-semibold">accept</b> the request, we
              will instantly create a <b className="font-semibold">draft</b>{" "}
              review targeting that business.
              <br />
              You'll find this draft in the{" "}
              <b className="font-semibold">Outgoing Reviews</b> section, ready
              for you to complete and submit
            </p>
          </div>
        ),
        icon: <>🔔</>,
        selector: "#" + ONBOARDING_STEP_IDS.NOTIFICATIONS,
        side: "bottom-right",
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        title: "Your Reviews",
        content: <p>All of your reviews across our network</p>,
        icon: <>✉️</>,
        selector: "#" + ONBOARDING_STEP_IDS.YOUR_REVIEWS,
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        title: "Your Review/Incoming Reviews",
        content: (
          <div className="flex flex-col gap-3">
            <p>
              This section shows reviews sent{" "}
              <b className="font-semibold">by others</b> to your businesses.
            </p>
            <p>
              <b className="font-semibold">Important</b>: The business details
              shown within each review of this section always refer to{" "}
              <b className="font-semibold">YOUR business</b> — the one being
              reviewed — not the business that sent the review.
            </p>
          </div>
        ),
        side: "bottom",
        icon: <>📩</>,
        selector: "#" + ONBOARDING_STEP_IDS.INCOMING_REVIEWS,
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        title: "Your Review/Outgoing reviews",
        content: (
          <div className="flex flex-col gap-3x">
            <p className="mb-3">
              This section shows reviews sent{" "}
              <b className="font-semibold">by you</b> to other businesses.
            </p>
            <p>
              <b className="font-semibold">Important</b>: The business details
              shown within each review of this section always refer to{" "}
              <b className="font-semibold">OTHER business</b> — the one being
              reviewed — not the business that sent the review.
            </p>
          </div>
        ),
        side: "bottom",
        icon: <>✍️</>,
        selector: "#" + ONBOARDING_STEP_IDS.OUTGOING_REVIEWS,
        showControls: true,
        showSkip: true,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        title: "Your Achievement",
        content: (
          <p>
            A quick summary of your milestones and progress within our network
            so far.
          </p>
        ),
        side: "top",
        icon: <>🏆</>,
        selector: "#" + ONBOARDING_STEP_IDS.YOUR_ACHIEVEMENT,
        showControls: true,
        showSkip: true,
        nextRoute: Paths.MY_BUSINESSES,
        pointerPadding: 10,
        pointerRadius: 10,
      },
      {
        title: "Let's Get Started!",
        content: (
          <div className="flex flex-col gap-3">
            <ol className="list-decimal pl-4">
              <li>
                <b className="font-semibold">
                  Create your first business profile
                </b>{" "}
                in our network.
              </li>
              <li>
                Once your profile is active, your{" "}
                <b className="font-semibold">Dashboard</b> will automatically
                start populating with reviews targeted at your business.
              </li>
            </ol>
            <p>
              <b className="font-semibold">Heads up:</b> While we immediately
              begin introducing your business to others in the network, it can
              sometimes take a little time for reviews to start coming in.{" "}
              <br />
              Feel free to navigate away and return later. <br />
              When you come back, check the{" "}
              <b className="font-semibold">Your Review</b> section and{" "}
              <b className="font-semibold">
                <Bell className="inline" size={20} /> notification
              </b>{" "}
              to see your activity!
            </p>
          </div>
        ),
        side: "right",
        icon: <>❇️</>,
        selector: "#" + ONBOARDING_STEP_IDS.LETS_START,
        showControls: true,
        prevRoute: Paths.HOME,
        pointerPadding: 10,
        pointerRadius: 10,
      },
    ],
  },
];
