import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BadgeCheckIcon,
  BellIcon,
  CreditCardIcon,
  LogOutIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { HamburgerMenu } from "./hamburger-menu";
import Image from "next/image";
import Link from "next/link";
import { LogOutBtn } from "./log-out-btn";
import Logo from "@/components/shared/logo";
import { Notifications } from "./notifications";
import { ONBOARDING_STEP_IDS } from "@/constants/dashboard/ui";
import { PageTitle } from "./page-title";
import { UserId } from "@/types/shared";
import fallbackAvatarSrc from "@/public/shared/user.png";
import { signOut } from "@/app/actions/auth";

interface HeaderProps {
  userId: UserId;
}
export async function Header({ userId }: HeaderProps) {
  // TODO: use real user image when we have user profile set up
  const imageURL = '';

  const profileMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar>
            <AvatarImage src={imageURL} alt="shadcn" />
            <AvatarFallback>
              <Image
                src={fallbackAvatarSrc}
                width={32}
                height={32}
                // className="w-6 h-6 md:w-8 md:h-8"
                alt={""}
              />
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
