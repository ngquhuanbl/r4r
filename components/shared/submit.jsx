"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFormStatus } from "react-dom";

// Example usage:
{/*
// Basic usage
<Submit text="Save Changes" />

// With custom styling that overrides defaults
<Submit 
  text="Delete"
  variant="destructive"
  className="rounded-lg border-red-500"
  loadingText="Deleting..."
/>

// With children
<Submit>
  <span className="flex items-center gap-2">
    <Icon /> Save Changes
  </span>
</Submit>
*/}

export function Submit({ 
  className, 
  text = "Submit",
  loadingText = "Working...",
  children,
  disabled,
  variant = "default",
  size = "default",
  ...props 
}) {
  const { pending } = useFormStatus();
  
  const isDisabled = disabled || pending;
  
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={cn(
        "text-sm rounded-none border-zinc-300 disabled:cursor-not-allowed",
        pending && "animate-pulse",
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {pending ? loadingText : (children || text)}
    </Button>
  );
}
