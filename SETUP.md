# frea — setup

Everything that needs *your* account or credentials. Work top to bottom; each
step says how to prove it worked.

Current state:

| | Status |
|---|---|
| Stripe keys | ✅ in `.env` (test mode) |
| Stripe CLI | ✅ installed at `tools/stripe/` |
| Stripe webhook secret | ✅ in `.env` — signature verified working |
| Resend API key | ✅ verified working — a test email was delivered |
| Resend sending domain | ⬜ step 2 — verify `joinfrea.com` at resend.com/domains |
| Admin access | ✅ `amaankauji@outlook.com` |
| Domain | ✅ `joinfrea.com` bought, wired through the codebase |
| Social preview image | ✅ generated at `public/og-preview.png` |
| Production URL | ⬜ step 4, when you deploy |

---

## 1. Stripe webhook secret — done

Your secret is in `.env` and **verified working**. Tested directly:

| Request | Result |
|---|---|
| Correctly signed with your secret | `200 {"received":true}` |
| Signed with a different secret | `400` rejected |
| No signature header | `400` rejected |
| Replayed from an hour ago | `400` outside tolerance |

That last one matters: a captured webhook cannot be replayed later to fake a
second purchase.

### Local development (for reference)

```bash
npm run stripe:login      # opens a browser, press enter to confirm the code
npm run stripe:listen     # prints: whsec_...
```

Copy that `whsec_…` into `.env`:

```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

`STRIPE_WEBHOOK_SECRET` takes a comma-separated list, so locally you can hold
the CLI secret alongside the two Dashboard ones and test either path. Keep the
CLI secret out of production — it is a valid signing key that production should
not trust.

Leave `stripe:listen` running in its own terminal while you test. Restart the
API server so it picks up the new value.

### Production

The CLI is for local only. On your server:

1. https://dashboard.stripe.com/webhooks → **Add endpoint**
2. URL: `https://joinfrea.com/api/stripe/webhook` — the host that serves the app
   directly. Stripe does not follow redirects on delivery.
3. Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `v2.core.account.updated`
4. Stripe will split these into **two destinations** — Checkout events use the
   snapshot payload style, `v2.core.*` events use thin. Each gets its own
   signing secret.
5. Put **both** secrets in `STRIPE_WEBHOOK_SECRET`, comma-separated. The handler
   tries each in turn.

There is no `account.updated` in Accounts v2 — that is the v1 name. The event
picker also opens on a **Suggested** tab; switch to **All events**.

See `DEPLOY.md` section 5 for the full walkthrough.

### Proving it works

```bash
npm run test:connect      # 22 checks against Stripe's live test API
```

Then a real purchase: sign in as a mentor, complete payout onboarding
(step 3), price a playbook, and buy it as a student with card
`4242 4242 4242 4242`, any future expiry, any CVC.

---

## 2. Resend — the sending domain

Your **API key is in and confirmed working** — a test email was delivered to
`amaankauji@outlook.com`. What's left is the sending domain, and that needs the
domain bought first.

### Why it's still blocked

Resend refuses to send as `@frea.co.uk` because you don't own it:

```
550 The frea.co.uk domain is not verified
```

Resend's shared sender `onboarding@resend.dev` works without any domain, but
**only delivers to your own account email** — useless for real students.

### Once `joinfrea.com` is yours

1. **Domains → Add Domain →** `joinfrea.com`
2. Add the DNS records Resend gives you (SPF, DKIM, usually DMARC) at your
   registrar. **Don't skip this.** Unverified means spam, and a verification
   code in spam is the same as no code.
3. Wait for *Verified* — usually minutes, occasionally an hour for DNS.
4. In `.env`:

```
MAIL_FROM="frea <hello@joinfrea.com>"
MAIL_TRANSPORT=auto
```

### Why local dev uses a test inbox

`.env` currently has `MAIL_TRANSPORT=ethereal`. That's deliberate: the test
suites send to dozens of throwaway `@ed.ac.uk` addresses, and no real provider
will deliver to those. Ethereal accepts anything and the UI links straight to
the message, so you can click through the whole product.

| Value | Behaviour |
|---|---|
| `ethereal` | Always the test inbox. Use locally. |
| `auto` | Real SMTP when configured, test inbox otherwise. Use in production. |
| `smtp` | Always real SMTP; fails loudly if unconfigured. |

### Proving it works

The startup log says which path is live:

```
[frea email] Using configured SMTP server: smtp.resend.com     ← real
[frea email] Using Ethereal test inbox (MAIL_TRANSPORT=ethereal)  ← local
```

If you send as an unverified domain, the server warns you at startup rather
than letting you discover it one failed signup at a time.

---

## 3. Mentor payouts — your own test run

Mentors can publish free freabies immediately. Pricing a playbook requires
payout onboarding, because otherwise frea would be selling something nobody can
be paid for.

Walk it once yourself so you know what mentors see:

1. Sign up as a mentor with a `.ac.uk` address
2. Mentor portal → **set up payouts** → Stripe's hosted onboarding
3. In test mode, use Stripe's test values: sort code `10-88-00`, account
   `00012345`, and any plausible name, address and date of birth
4. Return to the portal — it will say verifying, then ready

Only then can you set a price. That's the intended gate, not a bug.

---

## 4. Going live

**Before real students:**

```bash
npm run reset:launch      # clears all demo content, asks first, backs up
```

Then in production `.env`:

| Variable | Change to |
|---|---|
| `PUBLIC_BASE_URL` | `https://joinfrea.com` — otherwise every emailed link points at localhost |
| `MAIL_FROM` | an address on your verified domain |
| `MAIL_TRANSPORT` | `auto` (or remove the line) |
| `STRIPE_WEBHOOK_SECRET` | from the Dashboard endpoint, not the CLI |
| `ADMIN_EMAILS` | already `amaankauji@outlook.com` |

Switching to **live** Stripe keys additionally needs Stripe to complete their
account review, and Connect needs to be enabled on the account. Do the whole
test-card flow first.

```bash
npm start                 # builds the SPA and serves it with the API on one origin
```

Single origin matters: resource downloads are authenticated, so they must share
the API's origin.

---

## 5. Anything else

**Hosting.** Any Node host works (Railway, Render, Fly, a VPS). Two constraints:

- **Persistent disk.** `server/data.json` and `server/uploads/` must survive
  restarts. Platforms with ephemeral filesystems will silently lose every
  booking and uploaded file on each deploy.
- **One instance.** The JSON store is single-process. Don't scale horizontally
  until it's on Postgres.

**DNS.** Point your domain at the host, and add Resend's records from step 2.

**Backups.** `server/data.json` is the entire platform. Copy it somewhere
off-box on a schedule — a cron job doing `cp` to object storage is enough at
this size.

---

## 6. SEO — what's done and what's on you

frea used to have **one indexable page**. Hash routes (`/#/browse`) collapse to
a single URL for a crawler, so no mentor, resource or future course page could
ever appear in search — which is exactly the traffic your growth depends on.

That's fixed. Now on real URLs, with:

- a unique title, description and canonical per route
- `robots.txt` and a live `sitemap.xml` (regenerated from real data — every
  mentor gets a URL, currently **22**)
- `noindex` on personal and transactional pages
- JSON-LD per page: `Person` on a profile, `ItemList` on browse and resources
- legacy `#/` links rewritten to real paths, so anything already shared works

### Once the domain is live

1. **Set `PUBLIC_BASE_URL`** — the sitemap and every emailed link derive from it.
2. **Google Search Console** — add the property, verify by DNS, submit
   `https://joinfrea.com/sitemap.xml`. Same again at Bing Webmaster Tools.
3. **Check what Google actually sees** — URL Inspection → *Test live URL* on a
   mentor profile. It renders JavaScript, but confirm rather than assume.

### On ranking for "frea"

Be realistic: you won't win it soon. "frea" collides with *Freya* — a Norse
goddess and a top-20 UK baby name — and with "free". No technical change moves
that; it comes from brand search volume built over time.

What you can win now is the long tail, which is where students actually are:
*"COMP26120 past papers"*, *"Imperial spring week guide"*, *"how to get a
vacation scheme from a non-target"*. Those queries have real volume, low
competition, and match resources mentors are already writing.

Two things that would help most, in order:

- **Course-level pages.** A page per module with its seniors and its resources.
  Intensely shareable inside a cohort, and it repeats every term. This is the
  single highest-leverage SEO *and* retention build.
- **Real content.** Four demo resources rank for nothing. Fifty genuine ones
  written by real students rank for a lot.

`getfrea.com` should 301 to `joinfrea.com` rather than serve a copy — two live
copies split your ranking signals between them.

---

## Quick reference

```bash
npm run dev:all           # API :3001 + Vite :5173  →  http://localhost:5173
npm start                 # production, one origin  →  http://localhost:3001

npm run stripe:login      # once
npm run stripe:listen     # keep running while testing payments

npm run test:all          # 223 checks (needs the server running)
npm run reset:dev         # restore demo content after a test run
npm run reset:launch      # clear everything before real users
```

### Health check

```bash
curl -s localhost:3001/api/health
```

`"payments":"stripe"` means Stripe is wired; `"not-configured"` means paid
checkout will refuse cleanly and freabies still work.
