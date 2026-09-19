# frea

Free peer mentoring for UK university students. Verified `.ac.uk` students book
20-minute 1-on-1 calls with senior students, and seniors publish free study
resources ("freabies") or priced playbooks.

- **Frontend** — vanilla JS SPA, hash router, Vite 8, hand-written CSS design system
- **Backend** — Express 5, JSON file store, nodemailer, Stripe Checkout
- **Auth** — one-time codes to a `.ac.uk` address; server-side sessions

---

| Guide | For |
|---|---|
| **[SETUP.md](SETUP.md)** | Stripe, Resend, payouts — the credentials and how to verify each |
| **[DEPLOY.md](DEPLOY.md)** | Railway, the volume, DNS and the Stripe webhook endpoint |
| **[QA.md](QA.md)** | Manual test pass — everything automation can't reach |

> **Deploying?** frea writes to disk (one JSON database, real uploaded files),
> so it needs a **persistent volume**. Serverless hosts like Vercel have an
> ephemeral filesystem — nothing you save there survives the next request.
> See [DEPLOY.md](DEPLOY.md).

## Running it

```bash
npm install
cp .env.example .env        # then fill in the values below
npm run dev:all             # API on :3001, Vite on :5173
```

Open http://localhost:5173.

With no `SMTP_*` configured, verification emails go to an
[Ethereal](https://ethereal.email) test inbox and the UI shows a link to open
it. The six-digit code is **never** returned to the browser.

### Production

```bash
npm start                   # builds the SPA, then serves it + the API on one origin
```

Express serves `dist/` when it exists. Single-origin is required: resource
downloads are authenticated, so they must share the API's origin.

---

## Configuration

| Variable | Purpose |
|---|---|
| `PUBLIC_BASE_URL` | Base URL used in emails, verification links, Stripe redirects |
| `PORT` | API port (default 3001) |
| `ADMIN_EMAILS` | Comma-separated `.ac.uk` addresses allowed into `#/admin` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` | Real mail. Omit for the dev test inbox |
| `MAIL_FROM` | From header, e.g. `"frea <hello@joinfrea.com>"` |
| `STRIPE_SECRET_KEY` | Enables playbook checkout. Without it, paid checkout is refused cleanly |
| `STRIPE_WEBHOOK_SECRET` | Required to accept webhooks — unsigned webhooks are rejected. Comma-separated list; Stripe needs one destination per payload style |
| `FREA_FEE_RATE` | frea's cut, deducted from the mentor's payout. `0.05` = 5% |

### Stripe in development

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

Copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`. Test card `4242 4242
4242 4242`, any future expiry and CVC.

In production that variable holds **two** secrets, comma-separated — Stripe
requires a separate destination for snapshot (Checkout) and thin (Accounts v2)
payloads. See `DEPLOY.md` section 5.

---

## How the money works

The student pays **exactly the listed price**. frea's fee comes out of the
mentor's payout, never on top of the student's price:

```
£10.00  student pays
−£0.50  frea fee (5%, deducted from the mentor)
 £9.50  mentor payout
```

`test/payments.test.mjs` pins this down, including the Stripe line item, so it
cannot regress into a surcharge.

Access is granted only when Stripe confirms payment — via the webhook, or by
the server re-checking the session on the browser's return. A student cannot
unlock a playbook by editing a URL or replaying a redirect.

---

## Data formats

One canonical shape, enforced by `server/time.js` and mirrored in the client:

| Field | Format |
|---|---|
| date | `"2026-09-21"` (ISO, always) |
| time | `"17:30"` (24-hour, always) |
| `weeklySchedule` | `{ "0".."6": ["17:30", …] }` — 0 = Sunday |

Human-facing strings (`"Mon 21 Sep"`, `"5:30 PM"`) are derived at the edge and
never stored. `normaliseSchedule()` heals legacy records on read, so an older
`data.json` migrates itself in place.

---

## Testing

```bash
npm run server        # in one terminal
npm run build
npm run test:all      # everything — 223 checks
```

| Suite | Checks | Covers |
|---|---|---|
| `npm test` | 21 | payment split, front-end routes in jsdom |
| `npm run test:api` | 62 | auth, booking, entitlements, ownership |
| `npm run test:journeys` | 55 | the four user journeys end to end |
| `npm run test:regressions` | 41 | one guard per previously-shipped defect |
| `npm run test:pitch` | 22 | video record/upload, serving, removal |
| `npm run test:connect` | 22 | Stripe Connect against the live test API |
| `npm run test:unit` | 7 | payment maths only, no server needed |
| `npm run test:smoke <url>` | 34 | post-deploy check against any URL, safe on production |

`test:api` exercises verification, booking, double-booking, cancellation,
mentor auth and ownership, entitlements and downloads, and the payment split.
It reads one-time codes out of `server/data.json` the way an operator would,
since the API no longer returns them.

---

## Security notes

- Resource files are **never** publicly served. `/uploads` is an explicit dead
  end; downloads go through `/api/resources/:id/download`, which checks a
  server-side entitlement keyed to the verified email.
- Every mutating route is guarded: mentors can only edit their own profile,
  schedule and resources; the admin queue requires an `ADMIN_EMAILS` address.
- One-time codes are single-use, constant-time compared, and burn after five
  wrong attempts.
- OTP and booking rate limits key on **email**, not IP — UK universities NAT
  thousands of students behind a handful of addresses.
- Uploads are whitelisted to `.pdf`, `.md`, `.tex`, `.pptx`, capped at 10 MB,
  with sanitised filenames.

## Payouts (Stripe Connect)

Mentors are paid for real, not just tracked. On **Accounts v2** — Stripe
deprecated the v1 `type: 'express'` archetype and now refuses it for new
integrations — configured as a marketplace: `dashboard: 'express'` with the
platform owning both fees and losses, which Express requires.

A mentor clicks **set up payouts**, completes Stripe's hosted onboarding (bank
details and ID go to Stripe, never to frea), and can then price playbooks.
Sales use a **destination charge**: the student is charged the listed price on
frea's account, the mentor's 95% is routed to their connected account, and
frea's 5% arrives as the application fee. Stripe does the split.

Two gates keep this honest:
- A mentor **cannot price** a playbook until `payoutsEnabled` — otherwise we'd
  be selling something nobody can be paid for. Free freabies publish instantly.
- **Checkout refuses** if the mentor still can't receive money, rather than
  taking a payment we can't forward.

`account.updated` webhooks keep payout readiness current, since Stripe can
verify (or restrict) an account hours after onboarding finishes.

## Content safety

Publishing is instant and unreviewed — that's the point. The safety net is a
**report** control on every profile and resource, visible to any verified
student, feeding the admin view. Reports are a signal, not an automatic
takedown, and one person can't flood the queue for the same target.

## Known limitations

- **Storage is a JSON file.** Writes are atomic (temp file + rename, with retry
  on Windows contention), but this suits a single process, not a cluster. Move
  to Postgres before scaling out.
- **Stripe runs in test mode** until you swap in live keys and Stripe completes
  its account review.
- **Video calls use Jitsi** (`meet.jit.si`), which needs no account on either
  side. Swap for Google Meet via the Calendar API if you want Meet links.
- **Pitch videos are stored on local disk.** Fine for one box; move to object
  storage (S3/R2) before running more than one instance.
