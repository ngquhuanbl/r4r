export const DASH = "—";

export function orDash(value: string | null | undefined): string {
  if (typeof value !== "string") return DASH;
  return value.trim().length > 0 ? value : DASH;
}
