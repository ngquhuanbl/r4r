import Image from "next/image";

import { Button } from "@/components/ui/button";

import businessWithReviewIllustration from "@/public/dashboard/business_with_review.png";
import businessWithReviewIllustrationDark from "@/public/dashboard/business_with_review--dark.png";

import { Plus } from "lucide-react";

/**
 * Empty state for the dashboard when there are no businesses.
 */
export function EmptyDashboardContent({ onAddNewBusinessProfile }: { onAddNewBusinessProfile: () => void }) {
  return (
    <div className="my-auto w-full min-w-0 self-stretch font-inter">
      <div className="flex flex-col items-center">
        <div className="flex flex-col gap-3 text-center">
          <h2 className="text-4xl font-normal tracking-tight text-foreground sm:text-5xl">
            Start by adding your first business profile
          </h2>
          <p className="text-base text-muted-foreground">
            Connect with other businesses and grow your reputation through
            verified reviews.
          </p>
        </div>
        <Button
          type="button"
          variant="ocean"
          className="mt-6 h-11 rounded-md px-6 font-medium"
          onClick={onAddNewBusinessProfile}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add Your First Business Profile
        </Button>
        <div className="relative aspect-[16/9] w-full max-w-lg mt-3">
          <Image
            src={businessWithReviewIllustration}
            alt=""
            fill
            className="object-contain object-center dark:hidden"
            sizes="(max-width: 768px) 100vw, 448px"
            priority
          />
          <Image
            src={businessWithReviewIllustrationDark}
            alt=""
            fill
            className="hidden object-contain object-center dark:block"
            sizes="(max-width: 768px) 100vw, 448px"
            priority
          />
        </div>
      </div>
    </div>
  );
}
