import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import Logo from "@/components/shared/logo";
// import { ONBOARDING_STEP_IDS } from "@/constants/dashboard/ui";
import { getAvatarUrl, getDisplayName } from "@/lib/account/profile";

import { BusinessHeaderSwitcher } from "./business-header-switcher";
import { HamburgerMenu } from "./hamburger-menu";
// import { Notifications } from "./notifications";
import { PageTitle } from "./page-title";
import { ProfileMenu } from "./profile-menu";
import { Theme } from "./theme";

interface HeaderProps {
  user: User;
}

const billingEnabled =
  process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";

export async function Header({ user }: HeaderProps) {
  const imageURL = getAvatarUrl(user) ?? "";
  const displayName = getDisplayName(user);

  return (
    <header className="w-full">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 md:px-8 lg:px-16">
        <div className="flex w-full items-center justify-between gap-2 pt-2 md:gap-4 md:pt-0">
          <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
            <div className="md:hidden">
              <HamburgerMenu />
            </div>
            <div className="hidden shrink-0 md:block">
              <Link href="/" className="hover:cursor-pointer">
                <Logo />
              </Link>
            </div>
            <BusinessHeaderSwitcher />
            <PageTitle />
          </div>
          <div className="flex shrink-0 items-center gap-3 md:gap-10">
            <ul className="flex items-center gap-3 text-sm md:gap-3">
              <li>
                <Theme />
              </li>
              {/* <li id={ONBOARDING_STEP_IDS.NOTIFICATIONS}>
                <Notifications userId={user.id} />
              </li> */}
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
