# Connections domain

This document describes **what a “connection” is in R4R**, how **slots** relate to billing, how **matching** works in the current implementation, and how a connection **ends**. It replaces earlier narrative-only specs with pointers to real code.

## Concepts

| Term | Meaning |
|------|--------|
| **Connection** | A row in `connections` linking two businesses (`business_a_id`, `business_b_id`, canonical low/high ordering in code) while `status = active`, until completion rules fire. |
| **Slot** | Billing-derived limit on how many **active** connections a business can participate in; see `lib/billing/tiers.ts` and `lib/billing/check-slots.ts` (`assertBusinessHasAvailableSlot`). |
| **Review invitation** | Rows in `review_invitations` tied to a `connection_id` (two invitations per connection — one per direction). |
| **Review** | Draft/submitted/verified flow per invitation; statuses join `review_statuses`. |

The UI copy on the business page describes slots as “live connection” capacity — that maps to the same billing checks.

## User-facing flow (LET’S CONNECT)

1. User opens **`/business/[id]`** for a business they own.
2. **Connection capacity** is derived from subscription tier + active connections (see left panel and `ConnectionCapacityInfoDialog`).
3. **`startConnectionMatch`** (`app/(protected)/(workspace)/business/[id]/connection-actions.ts`) runs on the server when the user triggers the CTA (from `components/business/business-left-panel.tsx`).
4. If the initiator has **no free slot**, the action fails and the UI can show upgrade / capacity messaging.
5. If a **candidate** business is found (see Matching), the server creates a `connections` row and associated **`review_invitations`** for both sides, then revalidates relevant paths.

## Matching (implemented)

Code: `findMatchCandidate` and `startConnectionMatch` in **`connection-actions.ts`**.

Rough algorithm:

1. Load initiator business (`user_id`, `state`).
2. Prefer candidates in the **same `state`** as the initiator (simple geographic stub), ordered by `id`, scan up to a limit.
3. If none qualify, **fallback:** any other user’s business (again ordered, limited scan).
4. For each candidate, require:
   - `assertBusinessHasAvailableSlot` passes for the candidate.
   - **No existing active connection** between the initiator and that business (`hasActiveConnectionBetween` uses canonical low/high pair).
5. First valid candidate wins; otherwise return `{ matched: false }`.

This is intentionally **MVP**: no reputation score, no distance beyond same-state preference, no `FOR UPDATE SKIP LOCKED` queue.

## Completion and slot release (implemented)

Two complementary mechanisms live in **`lib/connections/complete-connection.ts`**; both are invoked from review server actions when statuses change (see `app/(protected)/actions/incoming-reviews.ts`, `outgoing-reviews.ts`, `invitation-workflows.ts`).

1. **`tryCompleteConnection` / `tryCompleteConnectionForReview`**  
   When both invitations on a connection each have a **review** whose status name is terminal (**verified** or **rejected** — see `ReviewStatusNames` and `isTerminalReview`), the connection is set to **`completed`** with `completed_at`.

2. **`tryReleaseOwnSlotAfterOutgoingSubmit`**  
   Per-business **slot release timestamps** on the connection row (`business_a_slot_released_at` / `business_b_slot_released_at`) are set when the appropriate outgoing-submit rules run (see file comments — tied to `invitee_business_id`). When **both** sides have released under the active connection, the row can be marked **`completed`**.

**Maintainer note:** Read `complete-connection.ts` when changing review or invitation flows; ordering of calls matters and both code paths coexist for historical/schema reasons.

## Partner acknowledgment (browser)

`lib/connections/acknowledge-pending-partner-browser.ts` supports UX that clears “pending partner” states when appropriate; keep in sync with invitation status rules.

## UI surfaces

- **Business workspace:** `components/business/business-left-panel.tsx` — CTA labels, searching state, toasts, post-match tab switch.
- **Dashboard cards:** `components/dashboard/locations/location-card.tsx` and related grid fetch (`app/(protected)/(workspace)/dashboard/actions.ts`) expose **`connectionFull`** for badge/tooltip parity with the business page.

## Schema

Authoritative definitions are in **`supabase/migrations/`** (connections, invitations, per-business slot release columns, RLS). Regenerate or update **`types/database.ts`** when migrations change.

## Roadmap / not implemented (product backlog)

Ideas previously tracked separately; **not** in the current MVP code path unless noted:

- **Geo / proximity:** Replace same-state stub with coordinates + distance sort.
- **Reputation-aware matching:** Order candidates by score.
- **Cooldown:** Exclude pairs with a recent connection in a time window.
- **Timeouts:** Auto-cancel or expire when a partner never submits.
- **Concurrency:** Replace optimistic scan with `SELECT … FOR UPDATE SKIP LOCKED` or a job queue at scale.
- **Multi-platform parity:** Align “one invitation per direction” vs per-platform rows if product requires all platforms.

When implementing any of the above, update this file and the relevant migration + `connection-actions.ts` tests.
