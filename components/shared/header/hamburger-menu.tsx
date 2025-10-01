"use client";
import { Lock, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import Logo from "@/components/shared/logo";
import { NAV_LINKS } from "@/constants/nav-links";
import { Paths } from "@/constants/paths";
import { useAppSelector } from "@/lib/redux/hooks";
import { authSelectors } from "@/lib/redux/slices/auth";
import { metricSelectors } from "@/lib/redux/slices/metric";
import { cn } from "@/lib/utils";
import { getVerifiedRate } from "@/utils/metrics";

export function HamburgerMenu() {
  const isAdmin = useAppSelector(authSelectors.selectIsAdmin);
  const {
    total_incoming_verified,
    total_incoming_all,
    total_outgoing_verified,
    total_outgoing_all,
  } = useAppSelector(metricSelectors.selectData);
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const openMenu = useCallback(() => {
    ref.current?.showModal();
    setIsOpen(true);
  }, []);
  const closeMenu = useCallback(() => {
    ref.current?.close();
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const mainContainerElement = document.getElementById("main-container")!;
    if (isOpen) {
      document.body.style.overflow = "hidden";
      mainContainerElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      mainContainerElement.style.overflow = "auto";
    }
  }, [isOpen, closeMenu]);

  return (
    <>
      <div className="flex items-center gap-3">
        <Menu
          aria-label="Open menu"
          className="w-6 h-6 text-gray-800 dark:text-white pl-0 sm:pl-4"
          onClick={openMenu}
        />
        {NAV_LINKS.map(({ href, name }, index) => (
          <p
            key={index}
            className={cn("font-bold uppercase", { hidden: href !== pathname })}
          >
            {name}
          </p>
        ))}
      </div>
      <dialog
        ref={ref}
        // className="w-[80%] h-screen backdrop:bg-gray-500 backdrop:opacity-70 m-0 md:hidden max-h-screen dark:bg-black transition-transform duration-500 ease-in-out transform -translate-x-full open:translate-x-0"
        className={cn(
          "w-[80%] h-screen backdrop:bg-gray-500 backdrop:opacity-70 m-0 md:hidden max-h-screen dark:bg-black transition-transform duration-500 ease-in-out transform -translate-x-full",
          {
            "translate-x-0": isOpen,
          }
        )}
        // @ts-ignore
        closedby="any"
      >
        <div className="flex flex-col">
          <div className="flex p-4 pb-3 border-b border-gray-300 justify-between items-center pr-5">
            <Logo />
            <X
              className="w-5 h-5 text-gray-800 dark:text-white pl-0 sm:pl-4"
              onClick={closeMenu}
            />
          </div>
          <div className="py-4 border-b border-gray-300 dark:text-white">
            <p className="pl-4 text-xs">MENU</p>
            <nav className="flex flex-col gap-1 pr-2 mt-3">
              {NAV_LINKS.map(({ name, href }, index) => (
                <Link
                  key={index}
                  href={href}
                  className={cn("px-4 py-2 font-medium", {
                    "bg-primary rounded-r-xl text-white": pathname === href,
                  })}
                  onClick={closeMenu}
                >
                  {name}
                </Link>
              ))}
              {isAdmin ? (
                <Link
                  href={Paths.ADMIN}
                  className={cn("px-4 py-2 font-medium", {
                    "bg-primary rounded-r-xl text-white":
                      pathname === Paths.ADMIN,
                  })}
                  onClick={closeMenu}
                >
                  Admin <Lock className="inline ml-1 align-top" size={20} />
                </Link>
              ) : null}
            </nav>
          </div>
          <div className="p-4 dark:text-white">
            <p className="text-xs">YOUR ACHIEVEMENT</p>
            <div className="grid grid-cols-[1fr_4fr] py-3 items-center border-b border-gray-300">
              <p className="font-bold text-3xl text-teal-500">
                {total_incoming_all}
              </p>
              <div>
                <p className="text-sm font-medium">reviews you have received</p>
                <p className="text-xs">
                  (total number including all submitted, verified and rejected
                  reviews)
                </p>
              </div>
              <p className="font-bold text-lg text-teal-500">
                {getVerifiedRate(total_incoming_verified, total_incoming_all)}%
              </p>
              <p className="text-sm font-medium">reviews are valid</p>
            </div>
            <div className="grid grid-cols-[1fr_4fr] py-3 items-center">
              <p className="font-bold text-3xl text-purple-700">
                {total_outgoing_all}
              </p>
              <div>
                <p className="text-sm font-medium">reviews you have given</p>
                <p className="text-xs">
                  (total number including all submitted, verified and rejected
                  reviews)
                </p>
              </div>
              <p className="font-bold text-lg text-purple-700">
                {getVerifiedRate(total_outgoing_verified, total_outgoing_all)}%
              </p>
              <p className="text-sm font-medium">acceptance rate</p>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
