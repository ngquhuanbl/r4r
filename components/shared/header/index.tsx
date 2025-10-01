import Image from "next/image";
import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import Logo from "@/components/shared/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ONBOARDING_STEP_IDS } from "@/constants/dashboard/ui";
import { NAV_LINKS } from "@/constants/nav-links";
import userSrc from "@/public/shared/user.png";
import { UserId } from "@/types/shared";

import { HamburgerMenu } from "./hamburger-menu";
import { LogOutBtn } from "./log-out-btn";
import { Notifications } from "./notifications";

interface HeaderProps {
  userId: UserId;
  email?: string;
}
export async function Header({ userId, email }: HeaderProps) {
  const profileMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-primary border sm:border-2 overflow-hidden">
          <Image
            src={userSrc}
            width={64}
            height={64}
            className="w-6 h-6 md:w-8 md:h-8"
            alt={""}
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom">
        <DropdownMenuLabel>{email || "My account"}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <LogOutBtn onClick={signOut} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
  return (
    <header className="w-full px-5 md:px-8 py-2 max-w-7xl mx-auto">
      <div className="flex items-center justify-between pt-2 md:pt-0 md:w-full">
        <div className="flex md:hidden items-center gap-3">
          <HamburgerMenu />
        </div>
        <div className="hidden md:block">
          <Logo />
        </div>
        <div className="flex items-center gap-10">
          <nav
            id={ONBOARDING_STEP_IDS.NAV_BAR}
            role="menu"
            className="hidden md:flex md:items-center text-sm gap-10 list-none"
          >
            {NAV_LINKS.map(({ name, href }, index) => (
              <li key={index} role="menuitem">
                <Link href={href} className="font-medium hover:text-primary">
                  {name}
                </Link>
              </li>
            ))}
          </nav>
          <ul className="flex items-center gap-3 md:gap-10 text-sm">
            <li id={ONBOARDING_STEP_IDS.NOTIFICATIONS}>
              <Notifications userId={userId} />
            </li>
            <li>{profileMenu}</li>
          </ul>
        </div>
      </div>
    </header>
  );
}
