import { Pulse } from "@/components/ui/pulse";

export function BusinessMetricsSkeleton() {
  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-3" aria-busy="true">
      <Pulse className="mx-auto mb-3 h-4 w-32" />
      <Pulse className="h-[190px] w-full rounded-md" />
    </div>
  );
}
