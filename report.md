# frea — Build Report

**Date:** 18 September 2026
**Scope:** every issue from the first audit, plus Stripe payments at a 5% platform fee
**Status:** ✅ build clean · **135 automated checks passing** · ready to ship behind config

---

## 1. What changed, in one paragraph

The four silent failures are fixed and covered by tests: booking dates now use one
canonical format end to end, so double-booking is actually prevented; saving a
schedule no longer wipes a mentor's calendar; every mutating endpoint is
authenticated; and one-time codes are no longer handed to the browser. Payments
are real Stripe Checkout with a 5% fee taken out of the mentor's payout rather
than added to the student's price. Downloads are authorised server-side against a
verified email. Mentors can add unlimited links, see their booking diary, see
real earnings, and re-price resources. Both parties get an email and a calendar
invite for every booking.

---

## 2. The four P0 bugs

### ① Double-booking was not prevented — **fixed**

The UI sent `"Wed 2 Sep"`; the slot engine compared against `"2026-09-02"`. They
never matched, so booked slots stayed bookable forever.

`server/time.js` is now the single source of truth for date and time formats:

| Field | Canonical form | Shown as |
|---|---|---|
| date | `"2026-09-21"` | `"Mon 21 Sep"` |
| time | `"17:30"` | `"5:30 PM"` |
| schedule | `{ "0".."6": ["17:30"] }` | `Monday · 5:30 PM` |

Display strings are derived at the edge and never stored. `migrate()` heals
legacy records on read — your existing booking stored as `"Wed 2 Sep"` / `"3:00 PM"`
is now `2026-09-02` / `15:00` in place.

Covered by: *"booked slot removed from availability"*, *"double-booking refused"*,
*"cancelled slot is bookable again"*.

### ② The schedule editor made mentors unbookable — **fixed**

The portal wrote `{"Monday": ["17:00"]}`; the engine read `schedule[1]` expecting
`"5:00 PM"`. Saving availability silently emptied a mentor's calendar.

`normaliseSchedule()` now accepts day names, short names or indices, and 12- or
24-hour times, and normalises everything to the canonical shape on write. The
editor displays day names and friendly times but never stores them.

Covered by: *"mentor is STILL bookable after saving availability"*,
*"Tuesday slots land on Tuesdays"*, *"12-hour input normalises to the same rota"*.

### ③ No authentication on the API — **fixed**

`server/auth.js` adds one session table covering three roles. Verifying an
`.ac.uk` address opens a session; a session carries a `mentorId` when that email
owns a mentor profile, and admin rights come from the `ADMIN_EMAILS` env list.

| Route | Guard |
|---|---|
| `PUT /api/mentors/:id` (+ `/schedule`) | `requireSelfOrAdmin` |
| `GET /api/mentors/:id/bookings` · `/orders` | `requireSelfOrAdmin` |
| `POST/PUT/DELETE /api/resources` | `requireMentor` + ownership check |
| `POST /api/upload/document` | `requireMentor` |
| `POST /api/bookings` · `/checkout` · downloads | `requireVerified` |
| `GET /api/admin/*` | `requireAdmin` |

Bookings and applications are bound to the **session** email, so a client cannot
act on behalf of an address it hasn't proven.

Covered by: *"cannot edit another mentor's profile"*, *"another user cannot read
earnings"*, *"cannot delete another mentor's resource"*, and a front-end test
asserting no applicant emails leak to a signed-out visitor.

### ④ Anyone could sign in as anyone — **fixed**

`codePreview` is gone from every response. The `123456` master code is deleted
from both server and client. Codes are now single-use, constant-time compared,
and burn after five wrong attempts.

Rate limits on the OTP and booking routes key on **email, not IP** — universities
NAT thousands of students behind a few addresses, so per-IP limits would have
locked out whole campuses.

Covered by: *"master code 123456 no longer works"*, *"code is single-use"*,
*"response does NOT contain the code"*.

---

## 3. Payments

Student pays the listed price. frea's cut comes out of the mentor's share:

```
£10.00   student is charged
−£0.50   frea fee (5%, deducted from the mentor)
 £9.50   mentor payout
```

Flow: pending order → Stripe Checkout → **webhook confirms payment** → entitlement
granted, receipt to student, sale notification to mentor. The browser's return
trip never grants access; the server re-checks the session with Stripe directly,
so a student cannot unlock a playbook by editing a URL or replaying a redirect.
`markOrderPaid` is idempotent, because Stripe retries webhooks.

`test/payments.test.mjs` pins the split across nine price points, asserts every
split reconciles to the penny, and asserts the actual Stripe line item is
**1000 pence for a £10 playbook** — so a refactor cannot quietly introduce a
student-facing surcharge. Unsigned webhooks are refused outright.

**Paid downloads are no longer a localStorage flag.** `/uploads` is an explicit
dead end; files stream through `/api/resources/:id/download`, which checks a
server-side entitlement keyed to the verified email. Entitlements follow the
student across browsers and devices — tested.

---

## 4. The four journeys, verified end to end

`npm run test:journeys` — 54 checks.

**Mentee books a chat.** Browses without signing in (mentor emails never appear in
public listings), picks a slot, is stopped and asked to verify, then books. Gets a
real joinable video room, Google + Outlook links carrying the actual booked time,
and an `.ics` with **both parties as attendees**. The mentor is emailed the same
invite. A stranger holding the booking id cannot fetch the invite.

**Mentee gets resources.** Claims a freabie, downloads it as a real attachment,
is blocked from a playbook with `402 requiresPurchase`, and cannot claim a paid
resource for free. Entitlements survive a switch to a new device.

**Mentee becomes a mentor.** Verified email required; profile goes live instantly
with a session returned, links normalised (`linkedin.com/in/x` → `https://…`,
label auto-derived), a default rota, and immediate bookability.

**Mentor runs their account.** Signs in by emailed code, edits profile, keeps
**five links with no cap**, saves availability in any format and stays bookable,
uploads and publishes a freabie and an £8.99 playbook, re-prices in both
directions, and sees their diary and earnings — while nobody else can.

---

## 5. Everything else from the audit

| # | Issue | Resolution |
|---|---|---|
| 7 | `/uploads` unreachable from the frontend | Vite proxies `/uploads`; Express serves `dist/` for single-origin production |
| 8 | Fake `meet.google.com` links | Real Jitsi rooms — live the moment the invite is sent, no account needed |
| 9 | Calendar invites used `now + 24h` | Server computes from the booked slot, with correct BST/GMT offset |
| 10 | Earnings panel a dead `£0.00` shell | Wired to `/orders`; real totals, per-sale table, 5% labelling |
| 11 | Published resources vanished on refresh | `hydrateResources()` merges server resources on load |
| 12 | Hardcoded landing stats | Real counts from `/api/stats`; the strip stays hidden until genuine numbers arrive |
| 13 | Suggestions went nowhere | `POST /api/suggestions` persists them; visible in the admin dashboard |
| 14 | Admin queue mislabelled "pending" | Relabelled to what it is — mentors activate instantly — with real counts |
| 15 | No booking validation | Past dates and off-rota times rejected; slot must exist in the mentor's schedule |
| 16 | No cancellation | Either party can cancel by link or in-app; the slot reopens and the other side is emailed |
| 17 | Calendar pinned to Sep 2026 | Opens on the current month |
| 18 | Dead React tree, 20 unused deps | Deleted; `@theme` converted to `:root` so the palette survives without Tailwind |
| 19 | No deployment story | `npm start` builds and serves both from one origin |
| 20 | No `.env.example` / README | Both written; `PUBLIC_BASE_URL` replaces the hardcoded `localhost:5173` in emails |
| 21 | JSON store, committed to git | Atomic writes with Windows-contention retry; `data.json` untracked, `data.seed.json` seeds fresh deploys |
| 22 | No tests, no error middleware | 135 checks across three suites; error middleware plus `unhandledRejection` handling |
| 23 | Misc | Duplicate application removed, test artifact deleted, `alert()` replaced with toasts |

---

## 6. Two bugs the tests caught in my own work

Worth recording, because both were invisible by inspection:

1. **`renderCheckoutComplete` was `async`**, so the router assigned
   `[object Promise]` to `innerHTML`. The checkout return page rendered literal
   garbage. Caught by the jsdom suite.
2. **Atomic writes failed on Windows.** `rename` over an open `data.json` throws
   `EPERM` when a reader holds a handle. Now retries with backoff, then falls
   back to an in-place write rather than dropping a booking or a paid order.

---

## 7. Before you ship

Three things need **your** credentials — the code is done, the config is not:

```bash
cp .env.example .env
```

1. **`ADMIN_EMAILS`** — your `.ac.uk` address. Until this is set the admin
   dashboard is closed to everyone, including you.
2. **`SMTP_*`** — without it, verification emails go to an Ethereal test inbox.
   Fine for a demo, **not** for real students: they will never receive a code.
3. **`STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`** — without these, paid
   checkout refuses cleanly with an honest message and freabies keep working. You
   can launch free-only today and switch payments on later with no code change.

Also set **`PUBLIC_BASE_URL`** to your real domain, or every link in every email
will point at `localhost`.

```bash
npm install && npm run build && npm start
```

### Known limitations, stated plainly

- **Storage is a JSON file.** Writes are atomic and retry under contention, but
  this is single-process. Move to Postgres or SQLite before running more than one
  instance.
- **Payouts are recorded, not transferred.** Orders track what each mentor is
  owed; actually moving money to them needs Stripe Connect. Until then you are
  settling manually.
- **Two legacy orders** in `data.json` from the old fake checkout carry
  `status: "completed"` rather than `"paid"`, so they are correctly excluded from
  earnings — they were never really paid.
- **The seeded mentors are fictional.** Real students need to sign up before the
  platform has anything genuine behind it.

---

## 8. Commands

```bash
npm run dev:all         # API :3001 + Vite :5173
npm start               # production: build, then serve both on one origin

npm test                # payment maths + front-end smoke  (21)
npm run test:api        # API integration                   (60)
npm run test:journeys   # the four user journeys            (54)
```
