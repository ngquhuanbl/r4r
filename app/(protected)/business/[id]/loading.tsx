import { Pulse } from "@/components/ui/pulse";

export default function Loading() {
  return (
    <div
      className="grid w-full grid-cols-1 gap-8 pt-8 pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start lg:gap-x-10 lg:gap-y-0"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading business profile…</span>

      {/* Left column — mirrors BusinessLeftPanel */}
      <div className="min-w-0 space-y-6 lg:max-w-sm">
        <div className="flex items-center gap-3">
          <Pulse className="h-9 w-24 shrink-0" />
          <Pulse className="h-9 flex-1 max-w-[140px]" />
        </div>

        <Pulse className="aspect-[16/10] w-full rounded-xl" />

        <div className="space-y-3">
          <Pulse className="h-8 w-[85%]" />
          <Pulse className="h-4 w-full" />
          <Pulse className="h-4 w-2/3" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Pulse className="h-10 flex-1 min-w-[7rem] rounded-lg" />
          <Pulse className="h-10 flex-1 min-w-[7rem] rounded-lg" />
        </div>

        <div className="space-y-3 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card/80 to-violet-500/[0.05] p-4 shadow-sm ring-1 ring-primary/10 dark:border-primary/25 dark:from-primary/[0.1] dark:via-card/60 dark:to-violet-500/10 dark:ring-primary/15">
          <div className="flex items-center justify-between gap-2">
            <Pulse className="h-3 w-36" />
            <Pulse className="h-8 w-8 shrink-0 rounded-full" />
          </div>
          <Pulse className="h-2.5 w-full rounded-full" />
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <Pulse className="h-5 w-40" />
            <Pulse className="h-9 w-24 rounded-full" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <Pulse className="mx-auto mb-4 h-4 w-32" />
          <Pulse className="mx-auto aspect-square max-w-[200px] rounded-full" />
          <div className="mt-4 flex justify-center gap-4">
            <Pulse className="h-8 w-16" />
            <Pulse className="h-8 w-16" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-4">
          {[1, 2, 3].map((k) => (
            <Pulse key={k} className="h-10 w-10 shrink-0 rounded-full" />
          ))}
        </div>
      </div>

      {/* Right column — mirrors BusinessReviewsWorkspace (tabs + table) */}
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          <Pulse className="h-9 w-36 rounded-md" />
          <Pulse className="h-9 w-36 rounded-md" />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Pulse className="h-9 w-full max-w-[200px] rounded-md" />
          <Pulse className="h-9 w-full max-w-[180px] rounded-md sm:ml-auto" />
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex gap-4 border-b border-border bg-muted/30 px-3 py-3">
            <Pulse className="h-4 w-24" />
            <Pulse className="h-4 w-20" />
            <Pulse className="h-4 w-28" />
            <Pulse className="ml-auto hidden h-4 w-16 sm:block" />
          </div>
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((row) => (
              <div
                key={row}
                className="flex flex-wrap items-center gap-3 px-3 py-4 sm:flex-nowrap"
              >
                <Pulse className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Pulse className="h-4 w-[70%] max-w-xs" />
                  <Pulse className="h-3 w-24" />
                </div>
                <Pulse className="h-8 w-24 shrink-0 rounded-md sm:ml-auto" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Pulse className="h-9 w-9 rounded-md" />
          <Pulse className="h-9 w-9 rounded-md" />
        </div>
      </div>
    </div>
  );
}
