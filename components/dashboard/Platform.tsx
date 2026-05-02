import Image from "next/image";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PlatformNames } from "@/constants/shared";
import googleSrc from "@/public/dashboard/google.png";
import tripAdvisorSrc from "@/public/dashboard/tripadvisor.png";
import yelpSrc from "@/public/dashboard/yelp.svg";

const triggerShellClass =
  "rounded-full overflow-hidden w-max";

interface PlatformProps {
  name: string;
  /** When set, the icon opens this URL in a new tab. */
  href?: string | null;
}

export function Platform({ name, href }: PlatformProps) {
  let src = null;
  let description = null;
  switch (name) {
    case PlatformNames.Yelp:
      src = yelpSrc;
      description = "Yelp";
      break;
    case PlatformNames.Google:
      src = googleSrc;
      description = "Google";
      break;
    case PlatformNames.TripAdvisor:
      src = tripAdvisorSrc;
      description = "TripAdvisor";
      break;
    default:
      break;
  }

  if (src === null || description === null) return null;

  const icon = (
    <Image
      src={src}
      alt={description}
      width={16}
      height={16}
      className="h-4 w-4"
    />
  );

  const trigger =
    href != null && href.trim() !== "" ? (
      <a
        href={href.trim()}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          triggerShellClass,
          "inline-block outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
      >
        {icon}
      </a>
    ) : (
      <div className={triggerShellClass}>{icon}</div>
    );

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger aria-label={name} asChild>
          {trigger}
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {href != null && href.trim() !== ""
              ? `${description} — opens in a new tab`
              : description}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
