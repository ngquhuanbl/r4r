import { Pulse } from "@/components/ui/pulse";

export function BusinessCapacitySkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <Pulse className="h-12 w-full rounded-lg" />
      <div className="rounded-xl border p-4">
        <Pulse className="mb-3 h-4 w-40" />
        <Pulse className="mb-3 h-2.5 w-full" />
        <div className="flex items-center justify-between">
          <Pulse className="h-4 w-24" />
          <Pulse className="h-8 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}
