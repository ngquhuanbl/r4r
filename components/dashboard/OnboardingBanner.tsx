"use client";
import { Sparkle } from "lucide-react";
import { useNextStep } from "nextstepjs";

import {
  ONBOARDING_IMG_SRC,
  ONBOARDING_TOUR_NAME,
} from "@/constants/dashboard/onboarding";
import { useAppSelector } from "@/lib/redux/hooks";
import { authSelectors } from "@/lib/redux/slices/auth";
import { getUsernameFromEmail } from "@/utils/shared";

import { Button } from "../ui/button";

export function OnboardingBanner() {
  const email = useAppSelector(authSelectors.selectEmail);
  const username = getUsernameFromEmail(email);
  const { startNextStep } = useNextStep();

  return (
    <div
      className="w-full p-4 md:p-10 bg-left-top md:bg-right-bottom bg-cover"
      style={{
        backgroundImage: `url(${ONBOARDING_IMG_SRC})`,
      }}
    >
      <p className="text-2xl md:text-4xl font-bold text-white tracking-[-.04em]">
        Wellcome back, {username}
      </p>
      <p className="font-light text-sm md:text-lg text-white leading-6 mt-2">
        We're thrilled to have you join our community.
        <br />
        Let's get you set up and ready to explore everything our service has to
        offer!
      </p>
      <Button
        variant="outline"
        className="mt-6"
        onClick={() => startNextStep(ONBOARDING_TOUR_NAME)}
      >
        <Sparkle />
        Get started
      </Button>
    </div>
  );
}
