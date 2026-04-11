import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCheckIcon, CreditCardIcon, LogOutIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { HamburgerMenu } from "./hamburger-menu";
import Link from "next/link";
import Logo from "@/components/shared/logo";
import { Notifications } from "./notifications";
import { ONBOARDING_STEP_IDS } from "@/constants/dashboard/ui";
import { PageTitle } from "./page-title";
import { UserId } from "@/types/shared";
import { signOut } from "@/app/actions/auth";

interface HeaderProps {
  userId: UserId;
}
export async function Header({ userId }: HeaderProps) {
  // TODO: use real user image when we have user profile set up
  const imageURL = "";

  const profileMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar>
            <AvatarImage src={imageURL} alt="shadcn" />
            <AvatarFallback>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="40px"
                viewBox="0 -960 960 960"
                width="40px"
                fill="#334155"
              >
                <path d="M226-262q59-39.67 121-60.83Q409-344 480-344t133.33 21.17q62.34 21.16 121.34 60.83 41-49.67 59.83-103.67T813.33-480q0-141-96.16-237.17Q621-813.33 480-813.33t-237.17 96.16Q146.67-621 146.67-480q0 60.33 19.16 114.33Q185-311.67 226-262Zm155.83-224.5Q342-526.33 342-584.67q0-58.33 39.83-98.16 39.84-39.84 98.17-39.84t98.17 39.84Q618-643 618-584.67q0 58.34-39.83 98.17-39.84 39.83-98.17 39.83t-98.17-39.83ZM480-80q-83.67 0-156.67-31.5-73-31.5-127-85.83-54-54.34-85.16-127.34Q80-397.67 80-480q0-83 31.5-156t85.83-127q54.34-54 127.34-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 82.33-31.5 155.33-31.5 73-85.5 127.34Q709-143 636-111.5T480-80Z" />
              </svg>
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheckIcon />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCardIcon />
            Billing
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOutIcon />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  return (
    <header className="w-full px-5 md:px-16 py-5">
      <div className="flex items-center justify-between pt-2 md:pt-0 md:w-full">
        <div className="flex md:hidden items-center gap-3">
          <HamburgerMenu />
        </div>
        <div className="hidden md:block">
          <Link href="/" className="hover:cursor-pointer">
            <Logo />
          </Link>
        </div>
        <PageTitle />
        <div className="flex items-center gap-10">
          <ul className="flex items-center gap-3 md:gap-3 text-sm">
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
