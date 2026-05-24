import { Pulse } from "@/components/ui/pulse";

export default function Loading() {
  return (
    <section
      className="flex w-full min-w-0 flex-1 flex-col py-7 pb-16"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading dashboard…</span>

      <div className="w-full min-w-0 self-stretch font-inter">
        <div className="flex w-full flex-col gap-8">
          <div className="flex flex-col gap-6">
            <Pulse className="h-10 max-w-md rounded-lg sm:h-12 sm:max-w-xl" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
              <Pulse className="h-9 w-full max-w-[432px] rounded-md" />
              <Pulse className="h-10 w-full max-w-[180px] shrink-0 rounded-md sm:w-auto" />
            </div>
          </div>

          <ul className="grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2 md:gap-6">
            {[1, 2].map((i) => (
              <li key={i}>
                <div className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                  <div className="space-y-3 px-6 pb-3 pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <Pulse className="h-7 w-[70%]" />
                      <Pulse className="h-9 w-16 shrink-0 rounded-full" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Pulse className="h-6 w-6 shrink-0 rounded-full" />
                      <Pulse className="h-4 flex-1 max-w-[240px]" />
                    </div>
                  </div>
                  <Pulse className="h-[220px] w-full shrink-0 rounded-none sm:h-[240px] md:h-[265px]" />
                  <div className="flex border-t border-border">
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-5">
                      <Pulse className="h-6 w-6 rounded-full" />
                      <Pulse className="h-4 w-28" />
                    </div>
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 border-l border-border py-5">
                      <Pulse className="h-6 w-6 rounded-full" />
                      <Pulse className="h-4 w-28" />
                    </div>
                  </div>
                </div>
              </li>
            ))}
            <li className="flex h-full min-h-[320px]">
              <Pulse className="h-full min-h-[320px] w-full rounded-lg border-2 border-dashed border-muted bg-card" />
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
