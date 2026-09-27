# frea

Peer mentoring marketplace for UK university students. Express API + vanilla-JS
front end, JSON file store, Stripe Connect for payouts.

## Running it

```bash
npm run dev:all     # API on :3001 + Vite on :5173
npm run server      # API only
npm run test:all    # full suite — needs the API running on :3001
npm run test:smoke https://joinfrea.com   # against production, read-only
npm run reset:dev   # restore seeded demo data after a test run
```

The e2e and frontend suites talk to a live server on `:3001`. Without it they
fail with "API server not reachable", which looks like a code break but isn't.

`test:all` counts drift upward across runs because the journey suite iterates
over accumulated mentors. `npm run reset:dev` first if the numbers look odd.

## Security invariants

These were each a real vulnerability at some point. Breaking one reopens it.

**Escape at the sink, not the source.** The front end builds markup as HTML
strings and assigns `innerHTML`, so every interpolation of user text needs
`escapeHtml()` — element content and quoted attributes alike.

**`jsArg()` for a JS argument inside an HTML attribute**, e.g.
`onclick="fn(${jsArg(name)})"`. `escapeHtml` is *wrong* there: it renders `'`
as `&#39;`, the HTML parser decodes that back to `'` before the JS is parsed,
and the string literal reopens. `jsArg` is `escapeHtml(JSON.stringify(v))` —
both escapes, in the order that composes. It returns its own quotes.

**Uploads are named after their owner** — `doc-<mentorId>-…`,
`pitch-<mentorId>-…` — and the server checks that prefix before publishing a
resource or deleting a file. `fileName` and `pitchVideoUrl` come back from the
client, so they are untrusted even though they live in our own records. Treating
either as a filesystem key without the ownership check is how one mentor reads
or deletes another's file.

**Sanitise on write, in `server/db.js`.** `createMentorApplication` once stored
`name`, `topTipColor`, `linkedin` and `helpsWith` raw, which is what made the
XSS reachable. New mentor-supplied fields go through `cleanText`, `sanitiseUrl`,
or an allow-list.

**`server/email.js` escapes with `esc()`.** Mail leaves our domain with valid
SPF and DKIM; injected markup there is a phishing tool, not a defacement.
Subjects stay raw — nodemailer encodes those.

## University sign-in (Studid)

The whole flow runs in a popup, and both hand-offs around it have broken before.

**Every exit from `/api/auth/studid/*` that a popup can reach answers with
`studidPopupReply`,** not JSON. The popup has no UI of its own and the app is
waiting on a posted message; a JSON body there is a window of raw text and a page
that hangs on "opening your university sign-in…" forever.

**The student comes back to the origin they left from,** not to
`PUBLIC_BASE_URL`. Apex and `www` both serve the app, and postMessage across
origins is dropped in silence — which looked exactly like a button that did
nothing. `studidReturnBase` picks the origin and the bridge page posts to its
own; the opener's strict origin check in `src/api.js` stays strict.

**The state travels in the callback path, never the query string.** Studid
returns the student to `<redirectUrl>?verificationId=…`, appending rather than
merging, so a `?state=` of ours came back as `state=abc?verificationId=123` and
matched no row. Every student who finished their university login was told the
attempt had expired.

**The result comes back through `localStorage`, not through the opener.** The
bridge page writes `frea:studid:result` and *then* posts the message; the app
reads the key. `window.opener` does not survive this flow: the popup visits
Studid and then the institution's own IdP, and any hop answering with
`Cross-Origin-Opener-Policy: same-origin` moves it into a new browsing context
group and severs the link for good. We do not control those headers and cannot
audit every institution in the federation. localStorage is shared by same-origin
documents however the windows are related. The entry is single-use and carries
a timestamp, so debris from an abandoned attempt cannot sign the next person in.

**`popup.closed` is never a cancel signal.** A severed handle reports itself
closed while the window is still open in front of the student. Rejecting on it
settled the attempt mid-login, removed the listeners, and dropped the real
result when it arrived — and because that reads as an ordinary cancel it was
shown as nothing at all. A completed university login that left the page exactly
as it was is this bug, not a student changing their mind.

`npm run test:studid` covers all of these. It starts its own server against a
stub gateway (`STUDID_API_BASE`), because the real one is a free service run by
one person and cannot mint a test student. What a stub cannot reproduce is the
browsing-context swap, so the two rules above are the ones to re-check by hand
against a real institution.

## Gating an action

**An action on a public page gates in place, with `requireVerifiedSession`.**
It renders the same flow into `#modal-content` and runs `onVerified` where the
student already is. `requireAuth` is only for a route that is private in its own
right — my space, the mentor portal, admin — where the whole page is the thing
being protected.

Booking used to call `requireAuth` and route to `/sign-in`, which took the
mentor, the calendar and the slot off the screen and needed a payload carried
through sign-in to put them back. A mentor profile is public; only the booking
is gated.

**Don't pass an `email` to `requireVerifiedSession` unless the action really is
for that specific address.** A mismatch with the session's address is read as
"this belongs to someone else" and reopens verification.

## The contact address

`/api/mentors/apply` takes the address from `req.session.email` and ignores
anything in the body, because `mentor.email` is an identity key — the legacy
sign-in path matches on it via `findMentorByEmail` — so a form-supplied address
would hand a profile to whoever verifies with it next.

So a form must never ask for it again. The mentor signup form did, validated
it, then threw the answer away; it now shows the verified address read-only.

**Changing it goes through `/api/auth/contact-email/start` then `/confirm`,**
which sends a code to the new inbox and moves nothing until it comes back.
`changeContactEmail` then moves the identity row and `mentor.email` together —
both, or a mentor signs in against one address while booking notices go to the
other — and the session is reissued, since everything is keyed on
`session.email`. `wireContactEmailChange` is the client side of it, offered in
My Space, on the mentor dashboard's profile tab, and on the mentor form.

Do not turn this into a plain text field, and do not add a separate
"notifications only" address that skips the code: booking notices carry a
student's name and meeting link, and an unproven address is also a way to squat
one its real owner has not registered with yet.

## Writing new UI

**No `onclick=` (or any inline `on*=`) in new markup.** Use `addEventListener`,
or delegate from a container with `data-action`.

There are ~178 inline handlers in `src/main.js` from before this rule. They are
the only reason the CSP carries `script-src 'unsafe-inline'`, which is what
stopped it defending against every XSS listed above. The moment the last one is
gone, `script-src` tightens to `'self'` and that whole class of bug stops being
exploitable. Every new handler pushes that further away.

Session tokens live in `localStorage`, so an XSS is account takeover, not a
defacement — which is why this matters more here than it would elsewhere.

## Deploys

Railway, auto-deploying from `main`. DNS on Cloudflare (grey cloud — proxying
breaks Railway's certificate renewal). `DEPLOY.md` has the full setup and the
traps, including that Railway's verification TXT goes at `_railway-verify`,
not `@`.

Stripe is on **test keys**. Going live is not a key swap — see the checklist in
`DEPLOY.md` section 8.
