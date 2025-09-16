"use client";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import Logo from "@/components/shared/logo";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Dashboard", href: "/home" },
  { name: "Businesses", href: "/businesses" },
];

export function HamburgerMenu() {
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
      <Menu
        aria-label="Open menu"
        className="w-6 h-6 text-gray-800 dark:text-white pl-0 sm:pl-4"
        onClick={openMenu}
      />
      <dialog
        ref={ref}
        // className="w-[80%] h-screen backdrop:bg-gray-500 backdrop:opacity-70 m-0 md:hidden max-h-screen dark:bg-black transition-transform duration-500 ease-in-out transform -translate-x-full open:translate-x-0"
        className={cn(
          "w-[80%] h-screen backdrop:bg-gray-500 backdrop:opacity-70 m-0 md:hidden max-h-screen dark:bg-black transition-transform duration-500 ease-in-out transform -translate-x-full",
          {
            "translate-x-0": isOpen,
          }
        )}
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
              {navLinks.map(({ name, href }, index) => (
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
            </nav>
          </div>
          <div className="p-4 dark:text-white">
            <p className="text-xs">YOUR ACHIEVEMENT</p>
            <div className="grid grid-cols-[1fr_4fr] py-3 items-center border-b border-gray-300">
              <p className="font-bold text-3xl  text-teal-500">25</p>
              <div>
                <p className="text-sm font-medium">reviews you have received</p>
                <p className="text-xs">
                  (total number including both valid and invalid reviews)
                </p>
              </div>
              <p className="font-bold text-lg text-teal-500">70%</p>
              <p className="text-sm font-medium">reviews are valid</p>
            </div>
            <div className="grid grid-cols-[1fr_4fr] py-3 items-center">
              <p className="font-bold text-3xl text-purple-700">26</p>
              <div>
                <p className="text-sm font-medium">reviews you have given</p>
                <p className="text-xs">
                  (total number including both valid and invalid reviews)
                </p>
              </div>
              <p className="font-bold text-lg text-purple-700">82%</p>
              <p className="text-sm font-medium">acceptance rate</p>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
