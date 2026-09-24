# Deploying frea to Railway

`numReplicas` is pinned to **1** in `railway.json`, deliberately. frea's
database is a single JSON file with atomic writes — safe for one process,
corruptible across several. Do not scale this up without migrating to Postgres
first.

---

## If the build fails

Two failures are worth recognising on sight.

**`EBUSY: resource busy or locked, rmdir '/app/node_modules/.cache'`**

The build command ran `npm ci` a second time. Nixpacks already installs
dependencies before your build command runs, and Railway mounts a cache volume
inside `node_modules` — `npm ci` wipes `node_modules` first, and cannot remove a
live mount. `buildCommand` must be **`npm run build`** alone. Already fixed in
`railway.json`; don't add `npm ci` back.

**`vite: not found` or `Cannot find module 'sharp'`**

`NODE_ENV=production` makes npm skip devDependencies, and the build needs vite,
sharp and jszip. They're listed under `dependencies` for exactly this reason —
Railway keeps `node_modules` from the install step in the final image, so it
costs nothing. Leave them there.

---

## 1. Create the project

```bash
npm install -g @railway/cli
railway login
railway init            # in this directory
```

Or via the dashboard: **New Project → Deploy from GitHub repo**, which gives you
automatic deploys on push.

---

## 2. Attach a volume — do this before the first deploy

This is the step that matters. Without it, every deploy wipes every booking,
mentor profile and uploaded file, because Railway replaces the app directory on
each release.

**Dashboard → your service → Variables → + Volume**

| Setting | Value |
|---|---|
| Mount path | `/data` |
| Size | 1 GB is plenty to start |

Then set `DATA_DIR=/data` in the variables below. The server refuses to start if
that path isn't writable, so a misconfigured volume fails loudly at boot rather
than silently losing data later.

---

## 3. Environment variables

**Dashboard → Variables → Raw Editor**, paste and fill in:

```
DATA_DIR=/data
NODE_ENV=production
PUBLIC_BASE_URL=https://joinfrea.com

ADMIN_EMAILS=amaankauji@outlook.com
FREA_FEE_RATE=0.05

MAIL_TRANSPORT=auto
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=re_your_resend_key
MAIL_FROM="frea <hello@joinfrea.com>"

STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_snapshot,whsec_thin
```

Notes that bite:

- **`PORT` is set by Railway.** Don't add it — the server already reads it.
- **`PUBLIC_BASE_URL` must be your real domain.** Every emailed link, Stripe
  redirect and sitemap URL derives from it. Get this wrong and verification
  emails point at localhost. It is also the URL university sign-in returns
  students to, so a localhost value there means nobody can register at all —
  Studid will not send a student back to a host only the container can reach.
  The server says so at boot when `NODE_ENV=production`; the only other clue is
  `[studid] create failed` in the log.
- **`STRIPE_WEBHOOK_SECRET` is not the one from `stripe listen`.** That secret
  is local-only — and it is a different shape, so you can tell them apart: the
  CLI secret is `whsec_` + 64 hex characters, a Dashboard secret is about half
  that. Create Dashboard destinations (step 5) and use their signing secrets,
  comma-separated.
- **`PUBLIC_BASE_URL` should be a literal**, not `https://${{RAILWAY_PUBLIC_DOMAIN}}`.
  That template resolves to whichever domain Railway feels like, and it feeds
  every email link and Stripe redirect.
- **`MAIL_TRANSPORT=auto`**, not `ethereal`. Ethereal is for local testing.

---

## 4. Point the domain

**Railway → Settings → Networking → Custom Domain**

Add **both** `joinfrea.com` and `www.joinfrea.com` as separate custom domains.
Railway treats them independently: each gets its own CNAME target and its own
verification TXT. They are not interchangeable — using one domain's target for
the other leaves it stuck on "Waiting for DNS update" forever.

For each domain Railway shows two records under **Show DNS records**:

| Type | Name | Value |
|---|---|---|
| CNAME | `@` (apex) or `www` | `<per-domain>.up.railway.app` |
| TXT | `_railway-verify` or `_railway-verify.www` | `railway-verify=<per-domain hash>` |

**Read the TXT Name column literally.** It is `_railway-verify`, *not* `@`.
Putting the apex verification on `@` looks plausible, resolves fine, and never
verifies — that mistake cost an afternoon.

**Both domains being live is why university sign-in cannot just use
`PUBLIC_BASE_URL` to come back to.** The popup hands its result to the page that
opened it, and the browser drops that hand-off across origins without a word, so
a student who arrived on `www` and was returned to the apex completed their
university login and saw nothing happen. The server now returns them to the
origin they left from, accepting either domain and nothing else — so if you add a
third hostname that serves the app, either redirect it to the canonical one or
teach `studidReturnBase` in `server/index.js` about it.

### DNS must be on Cloudflare, not Namecheap

Railway wants a **CNAME** on the apex. DNS forbids a plain CNAME on a root
domain, so the registrar has to fake it. Namecheap's ALIAS record flattens to
an A record, which browsers accept but Railway's verifier may not. Cloudflare's
CNAME flattening is the one that works, and it is free.

1. Cloudflare → **Add a site** → `joinfrea.com` → Free plan.
2. Recreate the records below. Cloudflare's import scan **misses subdomain TXT
   records** like `_railway-verify.www`, so check for it by hand.
3. Namecheap → **Nameservers → Custom DNS** → Cloudflare's two.

Target zone:

| Type | Name | Content | Proxy |
|---|---|---|---|
| CNAME | `@` | apex target from Railway | **DNS only** |
| CNAME | `www` | www target from Railway | **DNS only** |
| TXT | `_railway-verify` | apex verify string | — |
| TXT | `_railway-verify.www` | www verify string | — |
| TXT | `@` | `v=spf1 include:spf.efwd.registrar-servers.com ~all` | — |
| MX ×5 | `@` | `eforward1-5.registrar-servers.com` (10,10,10,15,20) | — |

**Keep the proxy off (grey cloud).** Proxied means Cloudflare terminates TLS
itself, and Railway can then no longer renew its certificate. That failure is
invisible for 90 days and then takes the site down. A new Cloudflare zone also
often defaults to SSL mode *Flexible*, which talks to the origin over plain
HTTP and produces an infinite redirect loop. If you ever do want the proxy,
set SSL to **Full** first and verify renewal actually works.

Railway may offer to write these records into Cloudflare for you. Read that
screen carefully — it sets **Proxied**, which is the one thing you don't want.

TLS is issued a few minutes after DNS resolves. Both hostnames end up with
their own Let's Encrypt certificate, and both redirect HTTP to HTTPS.

Don't delete the generated `*.up.railway.app` domain. It costs nothing and is
how you tell "the app is broken" from "DNS is broken" — it was the only way to
confirm the webhook secrets were right while the custom domain was still dark.

---

## 5. Stripe webhook endpoint

**https://dashboard.stripe.com/webhooks → Add endpoint**

- URL: `https://joinfrea.com/api/stripe/webhook`
- Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
  `v2.core.account.updated`

Stripe does **not** follow redirects on webhook delivery. The URL has to be the
hostname that serves the app directly, not one that redirects to it.

### You need TWO destinations

Stripe splits events into two payload styles and requires a separate
destination — and separate signing secret — for each. frea subscribes to both.

| Destination | Scope | Events |
|---|---|---|
| **Snapshot** | Your account | `checkout.session.completed`, `checkout.session.async_payment_succeeded` |
| **Thin** | Your account | `v2.core.account.updated` (take the other `v2.core.account.*` too) |

Scope is **Your account**, not Connected accounts: with Accounts v2, mentor
accounts belong directly to your platform, so their events route there.

There is no `account.updated` in v2 — that is the v1 name, which is why it does
not appear in the picker. Note the event list defaults to a **Suggested** tab;
switch to **All events** or the Checkout events will not appear either.

### Both secrets go in one variable

`STRIPE_WEBHOOK_SECRET` accepts a comma-separated list:

```
STRIPE_WEBHOOK_SECRET=whsec_from_snapshot,whsec_from_thin
```

Each is tried in turn. Without the thin one, a mentor finishes payout
onboarding and stays blocked from pricing until something else refreshes their
status.

Do **not** put the `stripe listen` secret in the production variable. It is a
valid signing key, and production has no business trusting it. Locally it is
fine to list all three — the handler tries each in turn.

### Verifying it without waiting for a real event

The handler ignores event types it doesn't recognise, so a correctly signed
`ping` is inert: it proves a secret is loaded without touching any data.

```
node test/webhooks.e2e.mjs          # both payload styles, all secrets, forgeries
```

---

## 6. Resend DNS

**resend.com → Domains → Add Domain →** `joinfrea.com`

Resend generates three or four records. They look like this — **use the values
Resend gives you, not these**:

| Type | Name | Purpose |
|---|---|---|
| MX | `send` | bounce handling |
| TXT | `send` | SPF — authorises Resend to send as you |
| TXT | `resend._domainkey` | DKIM — cryptographically signs your mail |
| TXT | `_dmarc` | DMARC — tells receivers what to do with failures |

Add all of them, then click **Verify**. Usually minutes; DNS can take an hour.

Skipping this means Resend refuses to send at all (`550 domain is not
verified`), and even if it didn't, unsigned mail from a new domain lands in
spam. A verification code in spam is the same as no code.

**One caveat:** a brand-new domain has no sending reputation. Your first emails
are more likely to be filtered. Send yourself a few, mark them *not spam*, and
ramp gradually rather than emailing a thousand students on day one.

### DMARC reporting — do not leave this off

The record Resend generates is `v=DMARC1; p=none;` and nothing else. That
publishes a policy and asks for **no reports**, so the only feed of what
receivers actually do with our mail is switched off. Add `rua`:

```
v=DMARC1; p=none; rua=mailto:dmarc@joinfrea.com; fo=1; adkim=r; aspf=r
```

Microsoft and Google both send daily aggregate XML to that address, per
receiving domain — which is the only free, per-university view of whether mail
is passing authentication and being accepted. It is the data you want *before*
anyone asks why a code was slow, because it cannot be backfilled.

`fo=1` asks for a failure report when either SPF or DKIM fails, rather than
only when both do. `adkim=r` / `aspf=r` are the defaults spelled out: relaxed
alignment, which is what makes `send.joinfrea.com` (Resend's envelope domain)
align with `joinfrea.com` in the From header.

Leave `p=none` for now. Moving to `p=quarantine` measurably helps reputation
with Microsoft and Google, but only do it once a few weeks of `rua` reports
show nothing legitimate is failing — an enforced policy on a misconfiguration
you cannot yet see means silently losing mail you currently deliver.

**Deliverability to `.ac.uk` is dominated by one receiver.** Of 24 UK
universities surveyed, 15 point MX straight at Microsoft (`mail.protection.
outlook.com`), 4 sit behind a commercial filtering gateway (Proofpoint,
Trend Micro) that itself usually fronts Microsoft 365, 3 self-host, and 2 use
Google. So roughly four in five student addresses are filtered by Microsoft or
a security gateway, both of which defer unfamiliar low-volume senders and
detonate links before release. That is the cause of multi-minute verification
codes, and it is downstream of us — see `/api/admin/mail-log` for our own
hand-off times, which should stay well under a second.

---

## 6b. Sign in with Microsoft (Entra ID)

Optional, and the single biggest lever on verification speed. Of 24 UK
universities surveyed, 15 point MX straight at Microsoft and 4 more sit behind
a filtering gateway that fronts Microsoft 365 — so for about four in five
students, the verification email is judged by Exchange Online. It defers
unfamiliar low-volume senders and detonates links before releasing them, which
is where multi-minute codes come from. Signing in through the student's own
tenant never touches an inbox.

It is also a **stronger** proof than the emailed code. Entra will not let a
tenant issue user principal names on a domain it has not verified ownership of,
so a UPN ending in `.ac.uk` is Microsoft asserting that the university controls
that domain and that this user is theirs. The emailed code only ever proved
that somebody could read one inbox.

Email codes stay as the fallback and must not be removed: three of the 24
self-host their mail (Edinburgh, Glasgow, St Andrews), and some tenants refuse
third-party apps without an admin's consent.

### Registering the app

**portal.azure.com → Microsoft Entra ID → App registrations → New registration**

| Field | Value |
|---|---|
| Name | `frea` |
| Supported account types | **Accounts in any organizational directory (Any Microsoft Entra ID tenant — Multitenant)** |
| Redirect URI | **Web** → `https://joinfrea.com/api/auth/microsoft/callback` |

Multitenant is the whole point — single-tenant would only admit your own
directory. Do **not** pick the option that also includes personal Microsoft
accounts: the code requests the `organizations` authority precisely to keep
outlook.com logins out, and mismatched settings fail confusingly.

Then **Certificates & secrets → New client secret**. Copy the *Value*, not the
Secret ID — the value is shown once and is unrecoverable afterwards. Note the
expiry; Entra caps secrets at 24 months and a lapsed one fails every sign-in at
once. Set a calendar reminder.

From **Overview**, copy the *Application (client) ID*.

### Railway variables

```
MS_CLIENT_ID=<Application (client) ID>
MS_CLIENT_SECRET=<the secret Value>
```

`MS_REDIRECT_URI` is only needed when the callback is not
`<PUBLIC_BASE_URL>/api/auth/microsoft/callback`. Whatever it resolves to must
match a registered redirect URI **character for character** — Entra compares it
as a string, and a trailing slash alone fails with `AADSTS50011`.

For local work, register a second redirect URI of
`http://localhost:5173/api/auth/microsoft/callback` on the same app.

### Checking it

`GET /api/auth/microsoft/status` reports `{ available: true }` once both
variables are set, and the front end only draws the button when it does — so an
unconfigured deploy looks exactly as it did before.

### Admin consent

Some university tenants block third-party apps until an administrator approves
them. The student sees "needs admin approval" and the email fallback carries
them. Completing **Microsoft Publisher Verification** (a verified MPN account,
then Branding & properties → Publisher domain) makes that prompt far less
likely and is worth doing before any campus push.


---

## 7. First deploy

```bash
railway up
```

Then verify, against the real URL:

```bash
npm run test:smoke https://joinfrea.com
```

That checks the deployment end to end — health, security headers, that admin is
locked, that resource files aren't publicly reachable, that the sitemap and
social preview resolve. Run it after every deploy.

Then work through **[QA.md](QA.md)** once by hand for the flows that need a real
human and a real inbox.

---

## 8. Before real students

```bash
railway run npm run reset:launch
```

Clears the demo mentors and resources. It asks first and writes a backup.

### Going live on Stripe

Switching from test to live is not a key swap — four things move together:

1. `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` → `sk_live_` / `pk_live_`.
2. **Both webhook destinations recreated in live mode.** Live and test are
   separate, with separate signing secrets, so `STRIPE_WEBHOOK_SECRET` gets two
   new values.
3. **Mentors re-onboard.** Test-mode connected accounts do not exist in live
   mode, so every mentor redoes payout onboarding with real details.
4. **`reset:launch`.** Orders and bookings reference test-mode Stripe objects
   that mean nothing in live mode.

Stripe account activation (business details, bank account, identity) has a
review period. Start it well before you need it.

---

## Security headers

`server/index.js` sets HSTS, `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy` and a CSP. Hand-rolled rather than
helmet — the set is small and every value was chosen deliberately.

HSTS is only sent when `req.secure`, so local http development is unaffected
and no one pins `localhost` to https for a year.

**Two known weaknesses, both structural, both still open:**

1. `script-src` carries `'unsafe-inline'`. The front end builds markup as HTML
   strings and wires behaviour with `onclick=` attributes — 177 of them in
   `src/main.js` — so removing it blanks the app. That costs most of CSP's XSS
   protection. Moving those to `addEventListener` and tightening `script-src`
   to `'self'` is the highest-value change left; the rest of the policy does
   not depend on it. Best done alongside a front-end rework rather than before.
2. The session bearer token lives in `localStorage` (`src/api.js`), so any
   successful XSS is account takeover rather than a defacement. An httpOnly
   cookie would blunt that, but cookies are sent automatically, so it means
   adding CSRF protection at the same time — the current header-based scheme is
   immune to CSRF by construction. Do it as one deliberate change, not a swap.

### Rules that are easy to break by accident

- **User text is escaped at the sink, not at the source.** `escapeHtml` for
  element content and quoted attributes; `jsArg` when the value lands inside a
  JS string in an attribute (`onclick="fn(${jsArg(x)})"`). `escapeHtml` alone
  is wrong there — it renders `'` as `&#39;`, the HTML parser turns that back
  into `'` before the JS is parsed, and the literal reopens.
- **Uploads are named after their owner** — `doc-<mentorId>-…`,
  `pitch-<mentorId>-…` — and the server checks that prefix before publishing a
  resource or deleting a file. The stored `fileName`/`pitchVideoUrl` come back
  from the client, so they are untrusted even though they live in our record.
- **Emails escape with `esc()` in `server/email.js`.** Mail leaves frea's
  domain with valid SPF and DKIM; injected markup there is a phishing tool.

---

## Keeping data safe

`/data/data.json` is the entire platform — every mentor, student, booking,
order and entitlement. Railway volumes are not snapshotted, so the copy on the
volume is the only copy unless you make another.

Writes are already atomic: `saveDb` writes a temp file and renames over the
target, so an interrupted write cannot leave a half-written database. That is
not the risk. The risks are a **logical** mistake — `reset:launch` against the
wrong target, a bug deleting records — where the file is perfectly valid and
the contents are wrong, and **losing the volume**.

### Rotation on the volume

The server snapshots to `/data/backups/` at boot and every few hours after.
Identical databases are not re-snapshotted, so a quiet week cannot rotate every
useful restore point out of the window.

| Variable | Default | |
|---|---|---|
| `BACKUP_INTERVAL_HOURS` | `6` | how often to snapshot |
| `BACKUP_KEEP` | `20` | snapshots retained before the oldest is pruned |

At the defaults that is five days of history.

### Getting a copy off the box

Rotation does not survive losing the volume. For that the copy has to leave,
and the download route is the way:

```bash
curl -fsS -H "Authorization: Bearer $TOKEN"      https://joinfrea.com/api/admin/backup -o frea-$(date +%F).json
```

`$TOKEN` is an admin session token — sign in with an address in `ADMIN_EMAILS`.
Run it from anywhere that runs on a schedule: your machine, a GitHub Action, a
cron box. **The file contains live session tokens. Treat it as a credential.**

Two more admin routes: `GET /api/admin/backups` lists what is on the volume,
`POST /api/admin/backups` takes one immediately — worth doing by hand before
anything irreversible, a schema change or a `reset:launch`.

### Restoring

A snapshot is the database, unmodified. There is no format to decode:

```bash
railway run cp /data/backups/data-<stamp>.json /data/data.json
```

Then restart. Everyone is signed out — sessions live in that file, and a
restored one predates their current tokens — but nothing else is lost.
`npm run test:backup` covers this path, restore included.

---

## When to move off the JSON store

Migrate to Postgres when any of these become true:

- you need more than one instance (traffic, or zero-downtime deploys)
- `data.json` passes a few megabytes — it is fully rewritten on every change
- you want real backups, point-in-time recovery or analytics queries

Until then a single file with atomic writes is genuinely fine, and simpler to
reason about than a database you're not yet using properly.
