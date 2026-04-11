import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

import { DASHBOARD_ACCENT } from "./constants";
import { AddBusinessTile } from "./add-business-tile";
import { LocationCard } from "./location-card";
import type { DashboardLocation } from "./types";

type LocationsBoardProps = {
  query: string;
  onQueryChange: (value: string) => void;
  filtered: DashboardLocation[];
  onAddBusiness: () => void;
};

export function LocationsBoard({
  query,
  onQueryChange,
  filtered,
  onAddBusiness,
}: LocationsBoardProps) {
  return (
    <div className="w-full min-w-0 self-stretch font-inter">
      <div className="flex w-full flex-col gap-8">
        <div className="flex flex-col gap-6">
          <h2 className="text-4xl font-normal tracking-tight text-neutral-800 sm:text-5xl">
            Pick a business to start
          </h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div className="relative w-full max-w-[432px] flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                aria-hidden
              />
              <Input
                type="search"
                placeholder="Search by business name"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                className="h-9 w-full rounded-md border border-slate-300 bg-white pl-9 text-neutral-900 placeholder:text-neutral-400"
                aria-label="Search by business name"
              />
            </div>
            <Button
              type="button"
              className="h-10 shrink-0 rounded-md px-4 font-medium text-white sm:w-auto"
              style={{ backgroundColor: DASHBOARD_ACCENT }}
              onClick={onAddBusiness}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add a new business
            </Button>
          </div>
        </div>

        <ul className="grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2 md:gap-6">
          {filtered.map((location) => (
            <li key={location.id}>
              <LocationCard location={location} />
            </li>
          ))}
          <AddBusinessTile onClick={onAddBusiness} />
        </ul>
      </div>
    </div>
  );
}
