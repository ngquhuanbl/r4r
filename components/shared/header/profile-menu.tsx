"use client";

import { BadgeCheckIcon, CreditCardIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Paths } from "@/constants/paths";

type Props = {
  imageURL: string;
  displayName: string;
  billingEnabled: boolean;
};

export function ProfileMenu({ imageURL, displayName, billingEnabled }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar>
            <AvatarImage src={imageURL} alt={displayName} />
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
          <DropdownMenuItem asChild>
            <Link
              href={Paths.ACCOUNT}
              className="flex cursor-pointer items-center gap-2"
            >
              <BadgeCheckIcon />
              Account
            </Link>
          </DropdownMenuItem>
          {billingEnabled ? (
            <DropdownMenuItem asChild>
              <Link
                href={Paths.BILLING}
                className="flex cursor-pointer items-center gap-2"
              >
                <CreditCardIcon />
                Billing
              </Link>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void signOut()}
          className="text-destructive focus:text-destructive"
        >
          <LogOutIcon />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
