import Image from "next/image";

import { Button } from "@/components/ui/button";

import businessWithReviewIllustration from "@/public/dashboard/business_with_review.png";
import { Plus } from "lucide-react";

import { DASHBOARD_ACCENT } from "./constants";

export function NoBusinessesEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="my-auto w-full min-w-0 self-stretch font-inter">
      <div className="flex flex-col items-start">
        <div className="flex flex-col gap-3">
          <h2 className="text-4xl font-normal tracking-tight text-neutral-800 sm:text-5xl">
            Start by adding your first business
          </h2>
          <p className="text-base text-neutral-500">
            Connect with other businesses and grow your reputation through
            verified reviews.
          </p>
        </div>
        <div className="relative aspect-[16/9] w-full max-w-lg">
          <Image
            src={businessWithReviewIllustration}
            alt=""
            fill
            className="object-contain object-center"
            sizes="(max-width: 768px) 100vw, 448px"
            priority
          />
        </div>
        <Button
          type="button"
          className="mt-6 h-11 rounded-md px-6 font-medium text-white"
          style={{ backgroundColor: DASHBOARD_ACCENT }}
          onClick={onAdd}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add Your First Business
        </Button>
      </div>
    </div>
  );
}
