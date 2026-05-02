import { Pulse } from "@/components/ui/pulse";

export default function Loading() {
  return (
    <div
      className="space-y-10 pb-16 pt-6 md:pt-8"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading billing…</span>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Pulse className="h-3 w-14" />
          <Pulse className="h-8 w-72 max-w-full" />
          <Pulse className="h-4 w-full max-w-md" />
        </div>
        <Pulse className="h-4 w-36 shrink-0 sm:mt-2" />
      </div>

      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col space-y-1.5 border-b border-border p-6 pb-4">
          <Pulse className="h-5 w-36" />
          <Pulse className="h-4 w-full max-w-lg" />
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-4 p-6 pt-4">
          <div className="space-y-2">
            <Pulse className="h-4 w-44" />
            <Pulse className="h-10 w-32" />
          </div>
          <div className="space-y-2 text-right">
            <Pulse className="ml-auto h-4 w-24" />
            <Pulse className="ml-auto h-7 w-40" />
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <Pulse className="h-4 w-44" />
        <div className="overflow-hidden rounded-md border border-border">
          <div className="flex gap-6 border-b border-border bg-muted/40 px-4 py-3">
            <Pulse className="h-4 w-24" />
            <Pulse className="h-4 w-16" />
            <Pulse className="h-4 w-20" />
            <Pulse className="ml-auto h-4 w-14" />
            <Pulse className="h-4 w-16" />
          </div>
          {[1, 2, 3].map((row) => (
            <div
              key={row}
              className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-4 last:border-b-0"
            >
              <Pulse className="h-4 w-40" />
              <Pulse className="h-6 w-24 rounded-full" />
              <Pulse className="h-4 w-16" />
              <Pulse className="ml-auto h-4 w-14 sm:ml-0" />
              <Pulse className="h-8 w-[88px] shrink-0 rounded-md" />
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="space-y-2">
            <Pulse className="h-5 w-40" />
            <Pulse className="h-4 w-full max-w-md" />
          </div>
          <Pulse className="h-9 w-[118px] shrink-0 rounded-md" />
        </div>
        <div className="p-6 pt-4">
          <Pulse className="h-4 w-64 max-w-full" />
        </div>
      </div>

      <section className="space-y-3">
        <Pulse className="h-4 w-28" />
        <div className="overflow-hidden rounded-md border border-border">
          <div className="flex gap-6 border-b border-border bg-muted/40 px-4 py-3">
            <Pulse className="h-4 w-16" />
            <Pulse className="ml-auto h-4 w-16 sm:ml-0" />
            <Pulse className="h-4 w-20" />
            <Pulse className="h-4 w-12" />
          </div>
          {[1, 2].map((row) => (
            <div
              key={row}
              className="flex flex-wrap items-center gap-4 border-b border-border px-4 py-3 last:border-b-0"
            >
              <Pulse className="h-4 w-28" />
              <Pulse className="ml-auto h-4 w-16 sm:ml-0" />
              <Pulse className="h-5 w-16 rounded-full" />
              <Pulse className="h-4 w-10" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
