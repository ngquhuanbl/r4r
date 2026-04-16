import Image from "next/image";
import Link from "next/link";
import { Loader2Icon } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { businessPath } from "@/constants/paths";

import fallbackBusinessAvatarSrc from "@/public/dashboard/fallback_business_avatar.png";
import fallbackBusinessAvatarDarkSrc from "@/public/dashboard/fallback_business_avatar--dark.png";

import type { DashboardLocation } from "./types";

function verifyLabel(n: number) {
  if (n === 0) return "0 to verify";
  if (n === 1) return "1 to verify";
  return `${n} to verify`;
}

function submitLabel(n: number) {
  if (n === 0) return "0 to submit";
  if (n === 1) return "1 to submit";
  return `${n} to submit`;
}

/** Fixed “down” icon — incoming / verify. */
function IncomingStatCell({ count }: { count: number }) {
  return (
    <div className="flex flex-1 items-center justify-center gap-2 py-5 text-sm text-muted-foreground">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        className="shrink-0 text-muted-foreground"
        fill="currentColor"
        aria-hidden
      >
        <path d="M440-800v487L216-537l-56 57 320 320 320-320-56-57-224 224v-487h-80Z" />
      </svg>
      <span>{verifyLabel(count)}</span>
    </div>
  );
}

/** Fixed “up” icon — outgoing / submit. */
function OutgoingStatCell({ count }: { count: number }) {
  return (
    <div className="flex flex-1 items-center justify-center gap-2 py-5 text-sm text-muted-foreground">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24px"
        viewBox="0 -960 960 960"
        width="24px"
        className="shrink-0 text-muted-foreground"
        fill="currentColor"
        aria-hidden
      >
        <path d="M440-160v-487L216-423l-56-57 320-320 320 320-56 57-224-224v487h-80Z" />
      </svg>
      <span>{submitLabel(count)}</span>
    </div>
  );
}

export function LocationCard({ location }: { location: DashboardLocation }) {
  return (
    <Link
      href={businessPath(location.id)}
      className="group block rounded-lg outline-none transition-transform duration-200 ease-out hover:-translate-y-1 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card
        role="article"
        className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-[box-shadow,border-color] duration-200 ease-out group-hover:border-primary/25 group-hover:shadow-md"
      >
        <CardHeader className="gap-1 space-y-1 px-6 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-xl font-semibold leading-tight text-card-foreground">
              {location.name}
            </CardTitle>
            {location.status === "loading" ? (
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/50 text-muted-foreground"
                aria-label="Loading connection status"
              >
                <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden />
              </span>
            ) : location.status === "ready" ? (
              <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                Ready
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1 text-sm font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-400">
                Full
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-base text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              className="shrink-0 text-muted-foreground"
              fill="currentColor"
            >
              <path d="M536.5-503.5Q560-527 560-560t-23.5-56.5Q513-640 480-640t-56.5 23.5Q400-593 400-560t23.5 56.5Q447-480 480-480t56.5-23.5ZM480-80Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0-100-79.5-217.5T480-80Z" />
            </svg>
            <span>{location.address}</span>
          </div>
        </CardHeader>

        <CardContent className="relative h-[220px] w-full bg-muted p-0 sm:h-[240px] md:h-[265px]">
          {location.imageSrc ? (
            <Image
              src={location.imageSrc}
              alt={location.imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={location.id === "1"}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-gradient-to-b from-sky-100/90 to-background dark:from-sky-950/40 dark:to-card"
              aria-hidden
            >
              <Image
                src={fallbackBusinessAvatarSrc}
                alt=""
                fill
                className="object-cover dark:hidden"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={location.id === "1"}
              />
              <Image
                src={fallbackBusinessAvatarDarkSrc}
                alt=""
                fill
                className="hidden object-cover dark:block"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={location.id === "1"}
              />
            </div>
          )}
        </CardContent>

        <CardFooter className="flex border-t border-border p-0">
          <IncomingStatCell count={location.left.count} />
          <div
            className="my-4 w-px shrink-0 self-stretch bg-border"
            aria-hidden
          />
          <OutgoingStatCell count={location.right.count} />
        </CardFooter>
      </Card>
    </Link>
  );
}
