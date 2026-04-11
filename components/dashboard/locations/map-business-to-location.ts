import { FetchedBusiness } from "@/types/dashboard";
import { getAddress } from "@/utils/shared";

import type { DashboardLocation } from "./types";

/** Placeholder stats until dashboard metrics are wired to the API */
export function mapBusinessToLocation(
  b: FetchedBusiness,
  index: number,
): DashboardLocation {
  const ready = index % 3 !== 1;
  return {
    id: String(b.id),
    name: b.business_name,
    status: ready ? "ready" : "full",
    address: getAddress(b),
    imageSrc: null,
    imageAlt: "",
    left:
      index % 2 === 0
        ? { icon: "down", label: "3 to verify" }
        : { icon: "up", label: "1 to submit" },
    right:
      index % 2 === 0
        ? { icon: "up", label: "1 to submit" }
        : { icon: "down", label: "3 to verify" },
  };
}
