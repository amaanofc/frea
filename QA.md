# frea — manual QA

Everything that needs a real human, a real inbox or a real card. The automated
suites cover the backend; this covers what they can't reach.

**Before starting:**

```bash
npm run reset:dev     # clean demo state
npm run dev:all       # API :3001, app :5173
npm run test:smoke    # 34 checks — confirms the build is sane first
```

Open **http://localhost:5173**. Keep DevTools console open throughout — **any
red error is a failure even if the screen looks right.**

You'll need two browser profiles (or one normal + one incognito) to be a
student and a mentor at the same time.

Verification codes go to a test inbox; the UI gives you a direct link to read
yours. No real email needed until you're testing production.

---

## A · First impressions

- [ ] Landing page loads with no console errors
- [ ] Hero, how-it-works, mission and FAQ all render
- [ ] **No fabricated numbers anywhere** — no stats strip, no ratings out of five.
      Counts on the page must come from real data or not appear at all.
- [ ] FAQ items expand and collapse
- [ ] Custom cursor follows the mouse and reacts on buttons *(desktop only)*

**Mobile — resize to 375px wide, or use device emulation:**

- [ ] **The "find a senior mentor" button is visible and tappable.** It used to be clipped off-screen entirely
- [ ] Nothing scrolls sideways
- [ ] Nav wraps to two rows rather than overflowing

---

## A2 · Stars, and things that were broken before

These are recent fixes. They are cheap to check and expensive to get wrong.

- [ ] A mentor profile shows a **star count**, not a rating out of five
- [ ] A brand-new mentor shows **0 stars**, not 5
- [ ] Signed out, pressing the star asks you to verify first
- [ ] Signed in, pressing it increments the count and fills the button
- [ ] Pressing again removes it — the count goes back down, not up
- [ ] Open the same profile in another browser: the count is there, the fill is not
- [ ] A mentor cannot star their own profile

- [ ] A mentor with **no pitch video** shows no video section at all
      (not a grey box with a broken-image icon)
- [ ] No mentor links to a YouTube or Loom URL nobody uploaded
- [ ] `/my-sessions` signed out offers a **verify my email** button, not a dead end
- [ ] Every validation failure appears **inline or as a toast** — a native browser
      alert box is a failure, wherever it appears
- [ ] `/admin` signed out shows a sign-in prompt, and Reports and Student Requests
      say so too rather than sitting on "Loading…" forever
- [ ] Signing in at `/admin` with the address in `ADMIN_EMAILS` works **even though
      it is not a .ac.uk address**

---

## B · Browsing

- [ ] `/browse` lists mentors
- [ ] Search by name, university or keyword filters the list
- [ ] University, goal, subject and year filters work, and combine
- [ ] "Clear all" resets them
- [ ] The live count matches what's shown
- [ ] Clicking a mentor card opens their profile
- [ ] **Open a profile in a new tab** — URL should be `/mentor/3`, not `/#/mentor/3`
- [ ] Back button returns to browse with filters intact

**On a profile:**

- [ ] Bio, achievements, top-tip note and links render
- [ ] Links open in a new tab
- [ ] The calendar loads and shows **the current month**
- [ ] Past days are greyed and unclickable
- [ ] Clicking a day with availability shows time slots
- [ ] Month arrows move forward and back

---

## C · Booking — the core flow

As a **student**, in a clean profile:

- [ ] Pick a slot → the booking bar appears with the right day and time
- [ ] Click book → modal shows the correct mentor, date and time
- [ ] Enter a `.ac.uk` address → prompted for a code
- [ ] Try a **non-.ac.uk** address → rejected with a clear message
- [ ] Open the test-inbox link, copy the code, enter it
- [ ] Enter a **wrong** code first → rejected, doesn't consume your attempt silently
- [ ] Correct code → booking confirms

**On the confirmation:**

- [ ] Date and time match what you picked
- [ ] Video link is a real `meet.jit.si` URL — **click it, a room should open**
- [ ] "Add to Google Calendar" opens with the **correct date and time**, not tomorrow
- [ ] Outlook link likewise
- [ ] `.ics` downloads and opens in your calendar app

**Then confirm the slot is actually held:**

- [ ] Reload the profile — **the slot you booked is gone**
- [ ] In a second browser, try to book the same slot → refused
- [ ] Check the test inbox: **two** emails, one to you and one to the mentor
- [ ] Both contain the same join link and a calendar attachment

**My sessions:**

- [ ] "my sessions" appears in the nav once verified
- [ ] Your booking is listed with join link, `.ics` and cancel
- [ ] Cancel it → confirms, disappears from upcoming
- [ ] Reload the mentor's profile → **the slot is available again**

---

## D · Resources

- [ ] `/resources` lists all four demo resources
- [ ] Search, university, type and subject filters work
- [ ] Opening a resource shows its preview

**Downloads — one per format, all four must produce a real, openable file:**

- [ ] Markdown — opens as text
- [ ] LaTeX — opens as text, contains `\documentclass`
- [ ] PDF — **opens in a PDF reader**
- [ ] PowerPoint — **opens in PowerPoint, Keynote or Google Slides**

- [ ] The paid playbook shows a price and cannot be downloaded free
- [ ] Clicking it opens checkout, not a download

**Access follows the person, not the browser:**

- [ ] Claim a free resource
- [ ] Open the site in a **different browser**, verify the same email
- [ ] The resource shows as unlocked there too

---

## E · Becoming a mentor

In a **second browser**, with a different `.ac.uk` address:

- [ ] `/become-a-mentor` loads
- [ ] Typing an email auto-detects the university
- [ ] Top-tip preview updates live as you type, and enforces 140 characters
- [ ] Post-it colour picker changes the preview
- [ ] Avatar picker works; photo upload shows a preview
- [ ] "add a link" adds rows; a bare `linkedin.com/in/you` is accepted and normalised

**Pitch video — both paths:**

- [ ] **Record now** → camera permission prompt → live preview appears
- [ ] Recording shows a timer, and **stops itself at 90 seconds**
- [ ] Playback appears with a retake option
- [ ] Retake discards and restarts cleanly
- [ ] **Navigate away mid-recording → the camera light goes off**
- [ ] **Upload a file** → preview appears **immediately**, before any upload
- [ ] A non-video file is rejected with a clear message
- [ ] Saving shows a progress bar, then confirms

**Submitting:**

- [ ] Verification required before the profile goes live
- [ ] After verifying, the profile is **live immediately** — no approval step
- [ ] Visit your own public profile — it renders, with the video playing inline
- [ ] **The profile is bookable** *(this was broken for every real sign-up — check it)*

---

## F · Mentor portal

- [ ] `/mentor-dashboard` shows your own profile, not someone else's
- [ ] **Hard-refresh the page** — still your data *(a past bug showed another mentor's)*
- [ ] Availability tab lists your rota
- [ ] Add a slot with `17:30` → appears as 5:30 PM
- [ ] Add one as `5:30 PM` → same result, no duplicate
- [ ] Remove a slot
- [ ] Save → **then open your public profile; those exact slots are bookable**
      *(saving used to wipe a mentor's calendar entirely)*
- [ ] Profile tab: edit bio, achievements, tip, links → save → visible publicly
- [ ] **Saving the profile does not wipe your pitch video**

**Publishing:**

- [ ] Upload a document → filename and size shown
- [ ] Publish as free → appears in `/resources` and downloads
- [ ] Switch it to paid → **blocked, telling you to set up payouts first**
- [ ] Set a price on the form → same block, with a link to onboarding

**Sessions and earnings:**

- [ ] Any booking made against you appears in your diary
- [ ] Join link and `.ics` work from the mentor side
- [ ] Earnings shows **5%** as frea's fee, not 1%

---

## G · Payments

**Payout onboarding:**

- [ ] Mentor portal → "set up payouts" → redirects to Stripe
- [ ] Complete it with Stripe's test values:
      sort code **10-88-00**, account **00012345**, any plausible name/address/DOB
- [ ] Return → status updates (may say "verifying" briefly)
- [ ] Once ready, **pricing a playbook is now allowed**

**A real test purchase:**

- [ ] Price a playbook at £10
- [ ] As a student in another browser, click buy
- [ ] The breakdown says **you pay £10.00**, mentor gets £9.50, frea 50p

> **Note:** that split is 5% of the **gross**, and frea pays Stripe's fee out of
> its own cut — so frea nets about 23p on a £10 sale and *loses* money below
> about £5.71. The agreed model is to take the cut **after** Stripe's fee. Until
> that is built, treat the numbers above as what the code does, not what it
> should do.
- [ ] Checkout opens on Stripe
- [ ] Pay with **4242 4242 4242 4242**, any future expiry, any CVC
- [ ] Returns to frea and confirms
- [ ] **Download the playbook — the real file, not a placeholder**
- [ ] Receipt email arrives; mentor gets a sale notification
- [ ] Stripe Dashboard → Payments shows £10.00 with a £0.50 application fee
- [ ] Connect → the mentor's account shows £9.50 pending

**Then try to break it:**

- [ ] Cancel at Stripe instead of paying → returns cleanly, **nothing unlocked**
- [ ] Card **4000 0000 0000 0002** (declined) → handled gracefully, nothing unlocked
- [ ] Buy the same playbook twice → refused, you already own it

---

## H · Safety and admin

- [ ] "report" appears on a mentor profile and a resource
- [ ] Reporting requires verification, then confirms
- [ ] Reporting the same thing twice → refused

**Admin** *(sign in with the address in `ADMIN_EMAILS`)*:

- [ ] A non-admin `.ac.uk` account sees **no applicant data** at `/admin`
- [ ] Your admin address gets a code even though it isn't `.ac.uk`
- [ ] Sign-ups, reports and student requests all listed
- [ ] Marking a report resolved works

---

## I · Production only

After deploying, with a **real** email address:

- [ ] Verification email arrives from `@joinfrea.com`
- [ ] **Check spam.** If it landed there, DKIM/SPF/DMARC need attention
- [ ] Links in the email point at `joinfrea.com`, not localhost
- [ ] Booking confirmation and `.ics` arrive and open
- [ ] Share a mentor profile in WhatsApp or Discord → **preview card with the frea image**
- [ ] `joinfrea.com/sitemap.xml` lists real URLs on the real domain
- [ ] Stripe webhook shows deliveries succeeding in the Dashboard
- [ ] Deploy again → **your test data is still there** *(proves the volume works)*

---

## Reporting a problem

Note the page, what you did, what you expected, what happened, and anything in
the console. A screenshot of the console beats a description of it.

Re-run `npm run test:smoke <url>` after any fix — it catches regressions in
seconds that would otherwise take you a full pass to find.
