"use client";

import { NAV_LINKS } from "@/constants/nav-links";
import { Paths } from "@/constants/paths";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const EXTRA_TITLES: { href: string; name: string }[] = [
  { href: Paths.ACCOUNT, name: "Account" },
];

export const PageTitle = () => {
  const pathname = usePathname();
  return (
    <div className="sr-only">
      {NAV_LINKS.map(({ href, name }, index) => (
        <h1 key={index} className={cn({ hidden: href !== pathname })}>
          {name}
        </h1>
      ))}
      {EXTRA_TITLES.map(({ href, name }, index) => (
        <h1 key={`extra-${index}`} className={cn({ hidden: href !== pathname })}>
          {name}
        </h1>
      ))}
    </div>
  );
};
