import Image from "next/image";

import googleSrc from "@/public/dashboard/google.png";
import tripAdvisorSrc from "@/public/dashboard/tripadvisor.png";
import yelpSrc from "@/public/dashboard/yelp.svg";
import { PlatformNames } from "@/constants/shared";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PlatformProps {
  name: string;
}
export function Platform({ name }: PlatformProps) {
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

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="p-1 bg-white rounded-full overflow-hidden">
            <Image
              src={src}
              alt={description}
              width={16}
              height={16}
              className="w-4 h-4"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
