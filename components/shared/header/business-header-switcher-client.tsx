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
import { cn } from "@/lib/utils";
import type { FetchedBusiness } from "@/types/dashboard";

const BUSINESS_ROUTE = /^\/business\/(\d+)/;

type BusinessHeaderSwitcherClientProps = {
  businesses: FetchedBusiness[];
};

export function BusinessHeaderSwitcherClient({
  businesses,
}: BusinessHeaderSwitcherClientProps) {
  const pathname = usePathname();
  const router = useRouter();

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
