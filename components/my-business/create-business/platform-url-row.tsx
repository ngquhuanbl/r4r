"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Platform } from "@/components/dashboard/Platform";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  classifyPlatformUrl,
  platformLabelForMessage,
} from "@/lib/validation/platform-urls";
import { Tables } from "@/types/database";

type PlatformRowProps = {
  platform: Pick<Tables<"platforms">, "id" | "name">;
  value: string;
  onChange: (value: string) => void;
};

export function PlatformUrlRow({
  platform,
  value,
  onChange,
}: PlatformRowProps) {
  const fieldId = `platform-url-${platform.id}`;
  const kind = classifyPlatformUrl(value, platform.name);
  const label = platformLabelForMessage(platform.name);

  return (
    <div className="flex w-full items-start gap-2 sm:items-center">
      <Label
        htmlFor={fieldId}
        className="flex shrink-0 items-center gap-2 pt-2 sm:w-40 sm:pt-0"
      >
        <Platform name={platform.name} />
        <span className="hidden text-sm sm:inline">{platform.name}</span>
      </Label>
      <div className="relative min-w-0 flex-1">
        <Input
          id={fieldId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          placeholder="Paste link…"
          className={cn(
            "pr-10 text-sm ",
            kind === "invalid" &&
              "border-amber-400 focus-visible:ring-amber-400",
            kind === "valid" &&
              "border-green-600/50 focus-visible:ring-green-600",
          )}
        />
        <span className="pointer-events-none absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center">
          {kind === "valid" && (
            <CheckCircle2 className="h-5 w-5 text-green-600" aria-hidden />
          )}
          {kind === "invalid" && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="pointer-events-auto text-amber-500"
                    aria-label={`Warning: URL may not be a ${label} link`}
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  This doesn&apos;t look like a {label} link.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </span>
      </div>
    </div>
  );
}
