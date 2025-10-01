export function getVerifiedRate(verified_count: number, total_count: number) {
  if (total_count === 0) return 0;
  if (verified_count < 0 || total_count < 0) return 0;
  return Math.floor((verified_count / total_count) * 100);
}
