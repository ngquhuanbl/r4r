import Link from "next/link";
import { Suspense } from "react";
import type { User } from "@supabase/supabase-js";

import { BusinessHeaderSwitcherServer } from "@/app/(protected)/business-header-switcher-server";
import Logo from "@/components/shared/logo";
import { getAvatarUrl, getDisplayName } from "@/lib/account/profile";
import { PageTitle } from "./page-title";
import { ProfileMenu } from "./profile-menu";
import { Theme } from "./theme";

interface HeaderProps {
  user: User;
}

const billingEnabled = process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";

export async function Header({ user }: HeaderProps) {
  const imageURL = getAvatarUrl(user) ?? "";
  const displayName = getDisplayName(user);

  return (
    <header className="w-full">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-8 lg:px-16">
        <div className="flex w-full items-center justify-between gap-2 pt-2 md:gap-4 md:pt-0">
          <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
            <div className="md:hidden">
              <Link
                href="/"
                className="inline-flex items-center rounded-md hover:cursor-pointer"
                aria-label="Go to dashboard"
              >
                <Logo mode="compact" />
              </Link>
            </div>
            <div className="hidden shrink-0 md:block">
              <Link href="/" className="hover:cursor-pointer">
                <Logo />
              </Link>
            </div>
            <Suspense
              fallback={
                <div
                  className="h-10 w-[12rem] max-w-[20rem] animate-pulse rounded-md border border-border bg-muted/40"
                  aria-hidden
                />
              }
            >
              <BusinessHeaderSwitcherServer userId={user.id} />
            </Suspense>
            <PageTitle />
          </div>
          <div className="flex shrink-0 items-center gap-3 md:gap-10">
            <ul className="flex items-center gap-3 text-sm md:gap-3">
              <li>
                <Theme />
              </li>
              <li>
                <ProfileMenu
                  imageURL={imageURL}
                  displayName={displayName}
                  billingEnabled={billingEnabled}
                />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
