# Connection system — follow-ups (not in MVP)

See [connection-spec.md](./connection-spec.md) and `lib/connections/`, `app/(protected)/business/[id]/connection-actions.ts`.

- **Geo / proximity:** Add coordinates to `businesses` (or geocode) and sort match candidates by distance instead of same-state / first-available.
- **Reputation score:** Factor into matching order (spec §4.1).
- **Cooldown / “not recently connected”:** Exclude pairs with a recent `connections` row (completed or time-windowed).
- **Partner timeout / expiry:** Background job or manual cancel when a partner never submits (spec §10.3).
- **Concurrency:** Replace optimistic candidate scan with `SELECT … FOR UPDATE SKIP LOCKED` or a dedicated queue if match volume grows.
- **Multi-platform parity:** User-driven matching creates one invitation per direction with the business’s first platform; some flows may still create one row per platform — align if product requires all platforms.
