"use client";

import {
  ONBOARDING_IMG_SRC,
  ONBOARDING_TOUR_NAME,
} from "@/constants/dashboard/onboarding";

import { Button } from "../ui/button";
import { authSelectors } from "@/lib/redux/slices/auth";
import { getUsernameFromEmail } from "@/utils/shared";
import { useAppSelector } from "@/lib/redux/hooks";
import { useNextStep } from "nextstepjs";

export function OnboardingBanner() {
  const email = useAppSelector(authSelectors.selectEmail);
  const username = getUsernameFromEmail(email);
  const { startNextStep } = useNextStep();

  return (
    <div
      className="w-full px-16 py-8 bg-left-top md:bg-right-bottom bg-cover"
      style={{
        backgroundImage: `url(${ONBOARDING_IMG_SRC})`,
      }}
    >
      <p className="text-2xl font-semibold text-white tracking-[-.04em]">
        Welcome back, {username}
      </p>
      <p className="font-light text-sm text-white leading-6 mt-2">
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="20px"
          viewBox="0 -960 960 960"
          width="20px"
          fill="#000000"
        >
          <path d="m384-312 264-168-264-168v336Zm96.28 216Q401-96 331-126t-122.5-82.5Q156-261 126-330.96t-30-149.5Q96-560 126-629.5q30-69.5 82.5-122T330.96-834q69.96-30 149.5-30t149.04 30q69.5 30 122 82.5T834-629.28q30 69.73 30 149Q864-401 834-331t-82.5 122.5Q699-156 629.28-126q-69.73 30-149 30Z" />
        </svg>
        Get started
      </Button>
    </div>
  );
}
