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

## One account home

`/my-space` is the only account destination. A mentor is also a student — they
book chats of their own — so it carries two role tabs, `activeSpaceTab`:
`mentee` (what they booked, their freabies) and `mentor` (`renderMentorPanels`:
availability, profile, products). Anything belonging to the person rather than
to either role — the contact address, a legacy claim — sits outside the tabs,
once.

There used to be a separate mentor portal, and the split was its own bug: two
"sessions" lists where neither name said whose, one contact address rendered in
both places, and two navbar entries with nothing to tell them apart.
`/mentor-dashboard` still resolves — bookmarks and old links use it — and
redirects to the mentor tab.

**One mentor profile form.** `mentorProfileFields({ mode, mentor })` renders it
for signup and for editing, prefilled when editing, and `initMentorProfileFields`
seeds the links and pitch controls. The portal used to have a shorter copy that
could only reach the bio, three achievements and the tip, so a mentor could not
fix their degree, year, photo or LinkedIn anywhere. Ids are shared because only
one of the two is ever on screen — the signup page shows a signpost, not a
form, once you have a profile.

**The availability editor speaks windows; the store speaks slots.** A mentor
sets "Monday 17:00–19:00" and `src/schedule.js` expands it to the six starts
the booking engine already reads, rebuilding windows from contiguous runs when
the editor reopens. Nothing on the server changed for this. Asking a mentor to
type every twenty-minute start is what made the old editor unusable, so do not
reintroduce a control that adds one slot at a time.

**A mentor sub-tab repaint must hold `activeSpaceTab`.** `switchMentorPortalTab`
calls `renderPage`, so without setting it back to `mentor` a mentor editing
their profile is dropped into their student view mid-edit.

**`/api/my-space` nests sessions: `{ sessions: { upcoming, past }, products }`.**
The client read `upcoming` and `past` flat for as long as the page existed, so
every student was told they had no sessions while their booking sat in the
database. `products` is flat, which is why the vault worked and hid it, and why
the only test here passed.

## Availability

A mentor has a **weekly pattern** (`weeklySchedule`, keyed by weekday) and
**dated exceptions** (`scheduleOverrides`, keyed by `YYYY-MM-DD`). An exception
replaces that date outright.

**An empty exception is a value, not an absence.** `{"2026-10-02": []}` is a day
off and must outrank the pattern. `normaliseSchedule` drops empty weekdays —
correct for the pattern, catastrophic for an exception — so overrides go
through `normaliseOverrides`, and the two never share a code path.

**`slotsForDate` is the only answer to "is this bookable".** The month a student
sees and the check in `createBooking` both call it. A second implementation
would be a second answer, and the one that matters is on the booking path.

**A save that omits `scheduleOverrides` leaves them alone.** The profile form
saves a schedule without knowing exceptions exist; sending `{}` would clear
every day off a mentor had set.

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
