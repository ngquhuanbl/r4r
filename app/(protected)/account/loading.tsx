import { Pulse } from "@/components/ui/pulse";

export default function Loading() {
  return (
    <div
      className="pb-28 pt-6 md:pt-8"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading account settings…</span>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Pulse className="h-3 w-24" />
          <Pulse className="h-8 w-40" />
          <Pulse className="h-4 w-full max-w-md" />
        </div>
        <Pulse className="h-4 w-14 shrink-0 sm:mt-2" />
      </div>

      <div className="mt-8 max-w-xl space-y-10">
        <section className="space-y-4">
          <Pulse className="h-4 w-32" />
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="relative shrink-0">
              <Pulse className="h-20 w-20 rounded-full border border-border" />
              <Pulse className="absolute bottom-0 right-0 h-8 w-8 rounded-full border border-border shadow-sm" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <Pulse className="h-4 w-24" />
              <Pulse className="h-10 w-full max-w-md rounded-md" />
              <Pulse className="h-3 w-full max-w-sm" />
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <Pulse className="h-4 w-12" />
            <div className="flex flex-wrap items-center gap-2">
              <Pulse className="h-4 w-48" />
              <Pulse className="h-6 w-40 rounded-full" />
            </div>
            <Pulse className="h-3 w-full max-w-xs" />
          </div>
        </section>

        <section className="space-y-3">
          <Pulse className="h-4 w-28" />
          <div className="flex flex-wrap items-center gap-3">
            <Pulse className="h-4 w-14" />
            <Pulse className="h-9 w-[220px] max-w-full rounded-md" />
          </div>
        </section>

        <section className="space-y-2 border-t border-border pt-8">
          <Pulse className="h-4 w-28" />
          <Pulse className="h-4 w-28" />
        </section>
      </div>
    </div>
  );
}
