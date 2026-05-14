
# 🧠 Connection System Spec (`connection-system.md`)

---

## 1. Overview

The **Connection System** powers the core workflow of R4R.

A connection:

> A temporary pairing between two businesses to exchange reviews.

Each connection generates:

* 1 **Outgoing Task**
* 1 **Incoming Task**

---

## 2. Terminology

| Term                 | Meaning                                    |
| -------------------- | ------------------------------------------ |
| Connection           | A pairing between two businesses           |
| Slot                 | Capacity unit allowing 1 active connection |
| Outgoing Task        | User writes a review                       |
| Incoming Task        | User verifies partner review               |
| Active Connection    | A connection not yet completed             |
| Completed Connection | Both tasks finished                        |
| Ready                | Business has available slots               |
| Full                 | Business has no available slots            |

---

## 3. Core Logic

## 3.1 What “LET’S CONNECT” does

When user clicks:

```txt
LET’S CONNECT
```

### Flow:

1. Check business capacity
2. If slots available → start matching
3. If slots full → show upgrade dialog
4. If match found → create connection
5. Generate tasks
6. Update business state

---

## 4. Matching Logic

## 4.1 Matching Criteria

Connections are matched based on:

* Location proximity
* Reputation score (future)
* Availability (must have free slots)
* Not previously connected recently (optional future rule)

---

## 4.2 Matching States

| State     | Meaning              |
| --------- | -------------------- |
| Idle      | No active search     |
| Searching | Matching in progress |
| Matched   | Connection created   |
| Failed    | No match found       |

---

## 4.3 Searching Behavior

When user clicks CTA:

```txt
State: Searching
```

UI:

* Button → "Searching..."
* Disabled

---

## 4.4 Match Success

If match found:

* Create connection record
* Create:

  * 1 outgoing task
  * 1 incoming task

Show:

```txt
Toast:
"Match found! Check your Outgoing tab to start your review."
```

---

## 4.5 Match Failure

If no match available:

```txt
Toast:
"All partners are currently busy. Please try again in a few minutes."
```

Then:

* Reset button → Ready
* No slot consumed

---

## 5. Capacity System

## 5.1 Slot Definition

Each business has:

```txt
slots_total
slots_used
slots_available = total - used
```

---

## 5.2 Tier Capacity

| Tier     | Slots |
| -------- | ----- |
| Starter  | 1     |
| Velocity | 5     |
| Momentum | 15    |

---

## 5.3 Capacity States

| State | Condition           |
| ----- | ------------------- |
| Ready | slots_available > 0 |
| Full  | slots_available = 0 |

---

## 6. Connection Lifecycle

## 6.1 Creation

When matched:

```txt
slots_used += 1
```

---

## 6.2 Active Connection

Connection exists while:

* Outgoing not submitted OR
* Incoming not verified

---

## 6.3 Completion Conditions

A connection is completed when:

```txt
Outgoing Task: submitted
AND
Incoming Task: accepted or rejected
```

---

## 6.4 Slot Release (IMPORTANT)

```txt
slots_used -= 1
```

👉 Happens ONLY when connection is completed

---

## 6.5 Business becomes Ready again when:

```txt
slots_available > 0
```

---

## 7. Task Relationship

Each connection generates:

```txt
Connection
 ├── Outgoing Task
 └── Incoming Task
```

---

## 7.1 Outgoing Task Flow

| State     | Meaning        |
| --------- | -------------- |
| init      | Need to submit |
| submitted | Done           |
| accepted  | Verified       |
| rejected  | Rejected       |

---

## 7.2 Incoming Task Flow

| State     | Meaning         |
| --------- | --------------- |
| init      | Waiting partner |
| submitted | Ready to verify |
| accepted  | Verified        |
| rejected  | Invalid         |

---

## 8. UI State Machine (CTA)

| State     | Label         | Behavior             |
| --------- | ------------- | -------------------- |
| Ready     | LET’S CONNECT | Start matching       |
| Searching | Searching...  | Disabled             |
| Full      | LET’S CONNECT | Opens upgrade dialog |
| Connected | Connected     | Disabled             |

---

## 9. Upgrade Trigger (Revenue Logic)

When:

```txt
slots_available = 0
AND user clicks CTA
```

Show:

```txt
"${Business_Name} is at full capacity."

"You are currently using your X slots.
Want to find partners faster?"

[ Upgrade Plan ]
[ No thanks ]
```

---

## 10. Edge Cases

## 10.1 Multiple Active Connections

Allowed if:

```txt
slots_available > 0
```

---

## 10.2 User abandons task

Connection remains active

👉 Slot NOT freed

---

## 10.3 Partner never submits

System behavior (future):

* Timeout / expiry
* Manual cancel (optional feature)

---

## 10.4 Slot Squeeze (Downgrade)

If:

```txt
active_connections > new_slot_limit
```

Then:

* Existing connections continue
* New connections blocked until below limit

---

## 11. Data Model (Simplified)

```ts
Connection {
  id
  business_a_id
  business_b_id
  status: active | completed
  created_at
}

Task {
  id
  connection_id
  type: outgoing | incoming
  state: init | submitted | accepted | rejected
}
```

---

## 12. UX Intent

The system should feel like:

> "A continuous loop of giving and receiving reviews"

---

## 13. Summary

* User clicks CTA → tries to match
* Match success → tasks created + slot consumed
* Tasks completed → slot released
* No slots → upgrade trigger
* No match → retry later

---

# 🔥 Final note

This is your **core engine**.

If implemented correctly:

* drives engagement
* enforces fairness (give-first)
* powers monetization (slots)

