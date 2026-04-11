import { PlatformNames } from "@/constants/shared";
import { Tables } from "@/types/database";

const ORDER: string[] = [
  PlatformNames.Google,
  PlatformNames.Yelp,
  PlatformNames.TripAdvisor,
];

export function sortPlatformsBySpec(
  platforms: Pick<Tables<"platforms">, "id" | "name">[],
): Pick<Tables<"platforms">, "id" | "name">[] {
  return [...platforms].sort(
    (a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name),
  );
}
