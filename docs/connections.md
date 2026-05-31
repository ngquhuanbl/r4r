# Connections domain

This document describes **what a “connection” is in R4R**, how **slots** relate to billing, how **matching** works in the current implementation, and how a connection **ends**. It replaces earlier narrative-only specs with pointers to real code.

## Concepts

| Term | Meaning |
|------|--------|
| **Connection** | A row in `connections` linking two businesses (`business_a_id`, `business_b_id`, canonical low/high ordering in code). Pairing is lifetime-unique (`UNIQUE (business_a_id, business_b_id)`). |
| **Slot** | Billing-derived limit checked via `business_billing.slot_limit`; current usage is denormalized in `business_billing.slots_used` (source of truth is DRAFT outgoing `reviews`). |
| **Connection review** | A row in `reviews` tied to a `connection_id` — two per connection (one per direction: each party reviews the other’s business). Created as `DRAFT` at match time. |
| **Review status** | Draft/submitted/verified/rejected flow on each `reviews` row; statuses join `review_statuses`. |

The UI copy on the business page describes slots as “live connection” capacity — that maps to the same billing checks.

## User-facing flow (LET’S CONNECT)

1. User opens **`/business/[id]`** for a business they own.
2. **Connection capacity** is derived from subscription tier + `slots_used` (see left panel and `ConnectionCapacityInfoDialog`).
3. **`startConnectionMatch`** (`app/(protected)/(workspace)/business/[id]/connection-actions.ts`) runs on the server when the user triggers the CTA (from `components/business/business-left-panel.tsx`).
4. If the initiator has **no free slot**, the action returns summary `{ matchedCount: 0, reason: "no_capacity" }` and the UI shows capacity messaging.
5. With free slots, one click can allocate **multiple new connections** in one server request (up to remaining capacity).
6. For each successful pair, the server creates a `connections` row and **two `reviews` rows** (`DRAFT`, one per direction), then increments `business_billing.slots_used` for both businesses.
7. Response is summary-only (`matchedCount`, `remainingCapacity`, `reason`) and the UI uses that toasts + optimistic capacity updates.

## Matching (implemented)

Code: `listMatchCandidates` and `startConnectionMatch` in **`connection-actions.ts`**.

Rough algorithm:

1. Load initiator business (`user_id`, `state`).
2. Prefer candidates in the **same `state`** as the initiator (simple geographic stub), ordered by `id`, scan up to a limit.
3. If none qualify, **fallback:** any other user’s business (again ordered, limited scan).
4. For each candidate, require:
   - `assertBusinessHasAvailableSlot` passes for the candidate.
   - **No existing connection row at all** between the initiator and that business (`hasConnectionBetween` uses canonical low/high pair).
5. The action loops candidates until initiator capacity is filled or candidate supply is exhausted.
6. Duplicate lifetime-pair conflicts (`23505`) are skipped and matching continues.
7. No pause toggle is implemented yet; eligibility remains slot-based + uniqueness checks.

This is intentionally **MVP**: no reputation score, no distance beyond same-state preference, no `FOR UPDATE SKIP LOCKED` queue.

## Lifecycle timestamps and slot accounting (implemented)

Lifecycle helpers live in **`lib/connections/complete-connection.ts`** and are invoked from review server actions (see `app/(protected)/actions/incoming-reviews.ts`, `outgoing-reviews.ts`).

1. **`tryCloseConnectionWhenBothSubmitted` / `tryCloseConnectionForReview`**  
   When both reviews on a connection are no longer `DRAFT`, set `connections.closed_at` once.

2. **`tryResolveConnection` / `tryResolveConnectionForReview`**  
   When both reviews are terminal (`VERIFIED`/`REJECTED`), set `connections.resolved_at` once.

3. **Slot release is immediate on outgoing submit**  
   `submitOutgoingReview` decrements `business_billing.slots_used` for `reviewer_business_id` when a review leaves `DRAFT`. `closed_at` / `resolved_at` are monitoring timestamps only and do not affect slot math.

## Realtime notifications

Partner/new-task notification UX is now client-side and cursor-based:

- Realtime events drive new task detection.
- `lastCursor` in localStorage dedupes and supports reconnect catch-up queries.
- No DB `partner_acknowledged_at` persistence is required.

## UI surfaces

- **Business workspace:** `components/business/business-left-panel.tsx` — CTA labels, searching state, summary-driven toasts, optimistic `slotsDelta`.
- **Dashboard cards:** `components/dashboard/locations/location-card.tsx` and related grid fetch (`app/(protected)/(workspace)/dashboard/actions.ts`) expose **`connectionFull`** for badge/tooltip parity with the business page.

## Schema

Table definitions, columns, and review checklist: **[schema-design.md](./schema-design.md)**. Regenerate or update **`types/database.ts`** when migrations change.

## Roadmap / not implemented (product backlog)

Ideas previously tracked separately; **not** in the current MVP code path unless noted:

- **Geo / proximity:** Replace same-state stub with coordinates + distance sort.
- **Reputation-aware matching:** Order candidates by score.
- **Cooldown:** Exclude pairs with a recent connection in a time window.
- **Timeouts:** Auto-cancel or expire when a partner never submits.
- **Concurrency:** Replace optimistic scan with `SELECT … FOR UPDATE SKIP LOCKED` or a job queue at scale.
- **Multi-platform parity:** One review leg per platform per connection if product requires all platforms.

When implementing any of the above, update this file and the relevant migration + `connection-actions.ts` tests.
