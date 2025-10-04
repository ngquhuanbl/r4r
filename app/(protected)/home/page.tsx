import { Metadata } from "next";

import { OnboardingBanner } from "@/components/dashboard/OnboardingBanner";
import { YourAchievement } from "@/components/dashboard/YourAchievement";
import { YourReview } from "@/components/dashboard/YourReview/Index";
import { ONBOARDING_STEP_IDS } from "@/constants/dashboard/ui";
import { getUserOrRedirect } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard: Manage Business Reviews & Insights",
  description: `Your personalized reputation management hub. View new reviews, insights for all your connected businesses.`,
};

export default async function Page() {
  const user = await getUserOrRedirect();
  return (
    <>
      <section className="hidden md:block">
        <OnboardingBanner />
      </section>
      <section
        id={ONBOARDING_STEP_IDS.YOUR_REVIEWS}
        className="grow md:grow-0 flex flex-col"
      >
        <div className="mb-5">
          <h2
            id="section-1-title"
            aria-describedby="section-1-desc"
            className="font-bold sm:text-lg"
          >
            YOUR REVIEWS
          </h2>
          <p id="section-1-desc" className="font-light text-sm sm:text-base">
            Your central hub for all incoming/outgoing reviews.
          </p>
        </div>
        <YourReview userId={user.id} />
      </section>
      <section
        id={ONBOARDING_STEP_IDS.YOUR_ACHIEVEMENT}
        className="hidden md:block"
      >
        <h2
          id="section-2-title"
          aria-describedby="section-2-desc"
          className="font-bold sm:text-lg"
        >
          YOUR ACHIEVEMENT
        </h2>
        <p id="section-2-desc" className="font-light text-sm sm:text-base">
          Everything you have achieved so far with the community
        </p>
        <YourAchievement />
      </section>
    </>
  );
}
