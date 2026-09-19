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
STRIPE_WEBHOOK_SECRET=whsec_from_the_dashboard_endpoint
```

Notes that bite:

- **`PORT` is set by Railway.** Don't add it — the server already reads it.
- **`PUBLIC_BASE_URL` must be your real domain.** Every emailed link, Stripe
  redirect and sitemap URL derives from it. Get this wrong and verification
  emails point at localhost.
- **`STRIPE_WEBHOOK_SECRET` is not the one from `stripe listen`.** That secret
  is local-only. Create a Dashboard endpoint (step 5) and use its signing secret.
- **`MAIL_TRANSPORT=auto`**, not `ethereal`. Ethereal is for local testing.

---

## 4. Point the domain

**Railway → Settings → Networking → Custom Domain →** `joinfrea.com`

Railway gives you a CNAME target. At your registrar:

| Type | Name | Value |
|---|---|---|
| CNAME | `www` | `your-app.up.railway.app` |
| ALIAS / ANAME / CNAME flattening | `@` | `your-app.up.railway.app` |

Root domains can't take a plain CNAME under DNS rules. Most registrars offer
ALIAS, ANAME or CNAME flattening — Cloudflare, Namecheap and Porkbun all do. If
yours doesn't, put the site on `www.joinfrea.com` and redirect the root.

TLS is issued automatically once DNS resolves. Usually minutes.

---

## 5. Stripe webhook endpoint

**https://dashboard.stripe.com/webhooks → Add endpoint**

- URL: `https://joinfrea.com/api/stripe/webhook`
- Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `account.updated`

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

---

## Keeping data safe

`/data/data.json` is the entire platform. Railway volumes are not backed up
automatically.

```bash
railway run cat /data/data.json > backup-$(date +%F).json
```

Run it on a schedule. At this size the whole database is a few hundred
kilobytes, so there's no excuse for not having yesterday's copy.

---

## When to move off the JSON store

Migrate to Postgres when any of these become true:

- you need more than one instance (traffic, or zero-downtime deploys)
- `data.json` passes a few megabytes — it is fully rewritten on every change
- you want real backups, point-in-time recovery or analytics queries

Until then a single file with atomic writes is genuinely fine, and simpler to
reason about than a database you're not yet using properly.
