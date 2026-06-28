"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { useState } from "react";

import { Platform } from "@/components/shared/platform";
import { Paths } from "@/constants/paths";
import { useAppSelector } from "@/lib/redux/hooks";
import { platformsSelectors } from "@/lib/redux/slices/platform";
import type { FetchedBusiness } from "@/types/dashboard";
import { orDash } from "@/utils/display";

import { EditBusinessProfileDialog } from "./edit-business-profile-dialog";

import fallbackLight from "@/public/dashboard/fallback_business_avatar.png";
import fallbackDark from "@/public/dashboard/fallback_business_avatar--dark.png";

interface BusinessInfoClientProps {
  business: FetchedBusiness;
}

/**
 * The client version of the business info subsection in the left section of the business page.
 * Displays the business name, cover image, platforms, address, and phone number
 * and provides a button to edit the business profile.
 */
export function BusinessInfoSubSectionClient({
  business,
}: BusinessInfoClientProps) {
  //
  // PROPS
  //

  //
  // STATE
  //
  /** Controls visibility of the edit profile dialog. */
  const [shouldOpenEditDialog, setShouldOpenEditDialog] = useState(false);
  const platforms = useAppSelector(platformsSelectors.selectData);
  const cover = business.cover_image_url;

  //
  // EVENTS
  //

  //
  // EFFECTS
  //

  //
  // RENDER
  //
  return (
    <>
      <Link
        href={Paths.DASHBOARD}
        className="hidden w-max shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-flex"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back to Dashboard
      </Link>

      <div className="flex flex-col items-center gap-4 sm:items-start">
        <div className="relative w-full max-w-[200px]">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-muted">
            {cover ? (
              <Image
                src={cover}
                alt=""
                fill
                className="object-cover"
                sizes="200px"
              />
            ) : (
              <>
                <Image
                  src={fallbackLight}
                  alt=""
                  fill
                  className="object-cover dark:hidden"
                  sizes="200px"
                />
                <Image
                  src={fallbackDark}
                  alt=""
                  fill
                  className="hidden object-cover dark:block"
                  sizes="200px"
                />
              </>
            )}
            <button
              type="button"
              className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border bg-background/90 text-foreground shadow"
              aria-label="Edit business profile"
              onClick={() => setShouldOpenEditDialog(true)}
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        </div>

        <h1 className="text-center text-2xl font-semibold tracking-tight text-foreground sm:text-left">
          {business.business_name}
        </h1>

        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          {platforms.map((p) => {
            const url = business.platform_urls[p.id];
            if (!url) return null;
            return <Platform key={p.id} name={p.name} href={url} />;
          })}
        </div>

        <div className="w-full space-y-2 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <span className="shrink-0" aria-hidden>
              📍
            </span>
            <span>
              {orDash(
                [business.address, business.city, business.state, business.zip_code]
                  .filter(Boolean)
                  .join(", "),
              )}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <span className="shrink-0" aria-hidden>
              ☎
            </span>
            <span>{orDash(business.phone)}</span>
          </p>
        </div>
      </div>

      <EditBusinessProfileDialog
        open={shouldOpenEditDialog}
        onOpenChange={setShouldOpenEditDialog}
        data={business}
      />
    </>
  );
}
