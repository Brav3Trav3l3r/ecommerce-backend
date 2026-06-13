# Design Decisions

## Decision: nth-order condition check uses total order count modulo

**Context:** The requirement says "every nth order gets a coupon code." I needed to define exactly when the admin can generate a code — and when the auto-generation at checkout fires.

**Options Considered:**
- Option A: Track a per-user order counter and issue a coupon on the user's own nth order
- Option B: Use the global order count (`orders.length % nthOrder === 0`) as the trigger

**Choice:** Option B — global order count modulo.

**Why:** The requirement says "every nth order" without specifying per-user. A global counter is simpler, avoids per-user state, and makes the admin condition deterministic and easy to verify in the stats endpoint. The trade-off is that multiple users placing orders all contribute to the trigger, which is a reasonable store-wide reward mechanic.

---

## Decision: Admin generate endpoint rejects when condition is not met

**Context:** `adminGenerateCode` is an admin-facing API. I had to decide what to do when an admin calls it at a point in time when `orders.length % nthOrder !== 0`.

**Options Considered:**
- Option A: Always generate a code on demand — let the admin override the condition freely
- Option B: Enforce the nth-order condition even for the admin endpoint, throw 409 if not met

**Choice:** Option B — enforce the condition and throw `409 CONDITION_NOT_MET`.

**Why:** The admin API is described as a way to "generate a discount code *if the condition above is satisfied*" (from the requirements). Allowing unconditional generation would let admins bypass the business rule entirely. A 409 Conflict communicates "the request is valid but the current state prevents it" — more precise than a 400 or 422.

---

## Decision: One unused code per user at a time

**Context:** Both the auto-checkout path and the admin path generate codes. I had to decide whether a user can accumulate multiple unused codes.

**Options Considered:**
- Option A: Allow stacking — a user can hold multiple unused codes simultaneously
- Option B: Reject generation if the user already has an unused code (`409 CODE_ALREADY_EXISTS`)

**Choice:** Option B — one unused code per user at a time, enforced only on the admin path.

**Why:** Stacking codes creates a discount abuse vector (users farming orders to accumulate codes). The admin endpoint is the one that needs the guard because it's explicitly triggered; the auto-checkout path fires only on the nth order so natural spacing limits accumulation. The trade-off is that an admin cannot proactively pre-generate a code for a user who already holds one — they must wait for it to be used.

---

## Decision: Discount codes are user-scoped, not global

**Context:** I needed to decide whether a generated code could be used by anyone who had it, or only by the specific user it was issued to.

**Options Considered:**
- Option A: Global codes — any user with the code string can redeem it
- Option B: User-scoped codes — the code is tied to a `userId` and rejected if used by anyone else

**Choice:** Option B — user-scoped via `userId` on the `DiscountCode` record.

**Why:** The requirement says the nth-order customer earns the reward. Allowing code sharing would let a user forward their discount to anyone, undermining the loyalty mechanic. Validation at checkout checks `dc.userId !== userId` and returns `CODE_NOT_YOURS`, making misuse explicit rather than silent.

---

## Decision: Validation happens before any state mutation in checkout

**Context:** In `checkoutService.checkout`, a discount code must be validated before the order is committed. I had to choose where in the function flow to run that check.

**Options Considered:**
- Option A: Validate inline just before applying the discount (mid-function, after subtotal is computed)
- Option B: Validate the code at the top of the function before touching any state

**Choice:** Option B — validate upfront before any mutation.

**Why:** If validation happened mid-way, a failure could leave the store in a partial state (e.g., the cart was cleared but the order was never saved). Running all checks first makes the function fail-fast and keeps the happy path free of rollback logic. This is the "validate then execute" pattern — particularly important in an in-memory store with no transactions.
