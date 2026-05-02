import { cn } from "@/lib/utils";

/** Static skeleton block — use inside route `loading.tsx` shells. */
export function Pulse({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted", className)} aria-hidden />
  );
}
