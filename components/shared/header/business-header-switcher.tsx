"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { businessPath } from "@/constants/paths";
import { useAppSelector } from "@/lib/redux/hooks";
import { myBusinessesSelectors } from "@/lib/redux/slices/my-business";
import { cn } from "@/lib/utils";

const BUSINESS_ROUTE = /^\/business\/(\d+)/;

/**
 * Business switcher beside the logo — only rendered on `/business/[id]`.
 * Uses the same business list as the rest of the app (Redux init from layout).
 */
export function BusinessHeaderSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const businesses = useAppSelector(myBusinessesSelectors.selectData);

  const currentId = useMemo(() => {
    const m = pathname?.match(BUSINESS_ROUTE);
    return m ? m[1] : null;
  }, [pathname]);

  const sorted = useMemo(
    () =>
      [...businesses].sort((a, b) =>
        a.business_name.localeCompare(b.business_name, undefined, {
          sensitivity: "base",
        }),
      ),
    [businesses],
  );

  const inList = sorted.some((b) => String(b.id) === currentId);

  if (!currentId || sorted.length === 0 || !inList) {
    return null;
  }

  const current = sorted.find((b) => String(b.id) === currentId)!;
  const label = current.business_name;

  return (
    <div className="flex min-w-0 max-w-[20rem] items-center justify-start">
      <Select
        value={currentId}
        onValueChange={(id) => {
          router.push(businessPath(id));
        }}
      >
        <SelectTrigger
          className={cn(
            "h-10 w-full min-w-[12rem] max-w-[min(100%,20rem)] border-border bg-background shadow-sm",
            "text-left font-medium text-foreground",
          )}
          aria-label="Switch business"
        >
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent align="start" className="max-h-[min(60vh,320px)]">
          {sorted.map((b) => (
            <SelectItem key={b.id} value={String(b.id)}>
              {b.business_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
