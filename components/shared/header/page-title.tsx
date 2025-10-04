"use client";

import { NAV_LINKS } from "@/constants/nav-links";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export const PageTitle = () => {
  const pathname = usePathname();
  return (
    <div className="sr-only">
      {NAV_LINKS.map(({ href, name }, index) => (
        <h1 key={index} className={cn({ hidden: href !== pathname })}>
          {name}
        </h1>
      ))}
    </div>
  );
};
