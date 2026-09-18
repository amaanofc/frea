# frea — build tasklist

Ticked as each lands. Verified means a test asserts it, not that it looked fine.

## Phase 1 — make it work

- [x] 1. Real seed resources, one per format (.md, .tex, .pdf, .pptx) with real `fileName`
- [x] 2. Fix resource drop for mentors not in the static array + close the init race
- [x] 3. Fix portal misattribution (`|| MENTORS[0]`)
- [x] 4. One source of truth for the fee — kill hardcoded 99%/1%
- [x] 5. Escape user content (stored XSS) + server-side length caps

## Phase 2 — product asks

- [x] 6. Delete the review queue (fixes duplicate-mentor bug)
- [x] 7. Record-or-upload pitch video, 90s cap, live preview
- [x] 8. Live payout calculator in the publish form
- [x] 9. Report button + admin surface
- [x] 10. Resend SMTP wiring
- [x] 11. `npm run reset:launch`
- [x] 12. Nav to my-sessions; drop public /admin footer link
- [x] 13. Mobile navbar (CTA reachable at 375px)

## Phase 2.5 — Stripe Connect

- [x] 14. Stripe plugin + MCP, run implementation planner
- [x] 15. Fix env var wiring (`STRIPE_SECRET_KEY`, webhook secret)
- [x] 16. Express connected accounts + hosted onboarding
- [x] 17. Destination charges with 5% application fee
- [x] 18. Gate paid publishing on payout readiness
- [x] 19. `account.updated` webhook
- [x] 20. Real test-card purchase end to end

## Phase 3 — polish

- [x] 21. "What's inside" field on publish form
- [x] 22. Optional steps clearly optional on signup
- [x] 23. Guard `£NaN` price path
- [x] 24. Remove dead code
- [x] 25. Portal tab labels wrapping

## Phase 4 — verify

- [x] 26. All three suites green
- [x] 27. New tests for each fix above
- [x] 28. 375px manual pass
- [x] 29. Clean test data, rebuild

---

## Result

All six suites green — **223 checks, 0 failures**.

| Suite | Checks | Covers |
|---|---|---|
| `npm test` | 21 | payment split, front-end routes in jsdom |
| `npm run test:api` | 62 | auth, booking, entitlements, ownership |
| `npm run test:journeys` | 55 | the four user journeys end to end |
| `npm run test:regressions` | 41 | one guard per audited defect |
| `npm run test:pitch` | 22 | video record/upload, serving, removal |
| `npm run test:connect` | 22 | Stripe Connect against the live test API |

`npm run test:all` runs the lot (needs `npm run server` first).

### Found while building, not in the original audit

- **Every mentor who signed up through the platform had a broken profile page.**
  `renderProfile` read `mentor.availability[0]`, a pre-API shape only the bundled
  seed mentors had. The page threw before the calendar rendered, so a real mentor
  could never be booked. Guarded by `test:regressions`.
- **MediaRecorder's MIME breaks multipart parsing.** `video/webm;codecs=vp9,opus`
  has an unquoted comma, so busboy reports `text/plain` and the upload was
  rejected. Now validated by magic bytes, which also rejects a renamed `.exe`.
- **Stripe deprecated Accounts v1 mid-build.** The API refused `type: 'express'`
  outright. Rebuilt on Accounts v2 and verified live.
- **Atomic writes fail on Windows** when a reader holds `data.json` — now retries.
