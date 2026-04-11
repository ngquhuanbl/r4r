/** Keep only digits, max 10 (US national number). */
export function normalizeUsPhoneDigits(input: string): string {
  return input.replace(/\D/g, "").slice(0, 10);
}

/** Display mask: (555) 123-4567 */
export function formatUsPhoneMask(digits: string): string {
  const d = normalizeUsPhoneDigits(digits);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6)
    return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function isCompleteUsPhone(digits: string): boolean {
  return normalizeUsPhoneDigits(digits).length === 10;
}
