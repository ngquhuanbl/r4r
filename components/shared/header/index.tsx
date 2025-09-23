import Image from "next/image";
import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import Logo from "@/components/shared/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import userSrc from "@/public/shared/user.png";

import { HamburgerMenu } from "./hamburger-menu";
import { LogOutBtn } from "./log-out-btn";

interface HeaderProps {
  email?: string;
}
export async function Header({ email }: HeaderProps) {
  return (
    <header className="w-full px-5 md:px-8 py-2 max-w-7xl mx-auto">
      <nav className="hidden md:flex items-center justify-between w-full">
        <Logo />
        <ul role="menu" className="flex items-center gap-10 text-sm">
          <li role="menuitem">
            <Link href="/home" className="font-medium hover:text-primary">
              Dashboard
            </Link>
          </li>
          <li role="menuitem">
            <Link href="/businesses" className="font-medium hover:text-primary">
              My busineses
            </Link>
          </li>
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div className="w-8 h-8 rounded-full border-primary border sm:border-2 overflow-hidden">
                  <Image
                    src={userSrc}
                    width={64}
                    height={64}
                    className="w-8 h-8"
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
          </li>
        </ul>
      </nav>
      <div className="flex md:hidden items-center justify-between pt-2">
        {/* Hambuger btn */}
        <HamburgerMenu />
				{/* TODO: Show screen title (e.g. DASHBOARD / BUSINESSES) */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="w-6 h-6 rounded-full border-primary border sm:border-2 overflow-hidden">
              <Image
                src={userSrc}
                width={64}
                height={64}
                className="w-6 h-6"
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
      </div>
    </header>
  );
}
