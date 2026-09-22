// Shared test fixture: register a student the way university sign-in does.
//
// Verification codes now go only to addresses frea already knows. The
// university proves who someone is once, at registration, and the email is
// the sign-in handle from then on — so a suite cannot simply ask for a code
// against an address nobody has registered.
//
// None of these suites can drive a real Shibboleth login, so this writes the
// identity that registration would have written and lets them sign in as a
// returning user. That is the path they were always really exercising: the
// code step, not the institutional proof.

import fs from 'fs';

const DB = new URL('../server/data.json', import.meta.url).pathname
  .replace(/^\/([A-Za-z]:)/, '$1');

export function seedIdentity(email) {
  const clean = String(email || '').trim().toLowerCase();
  if (!clean) return;

  const db = JSON.parse(fs.readFileSync(DB, 'utf8'));
  db.studentIdentities = Array.isArray(db.studentIdentities) ? db.studentIdentities : [];
  if (!db.studentIdentities.some(i => i.contactEmail === clean)) {
    db.studentIdentities.push({
      authIdentifier: `e2e-${clean}@test.ac.uk`,
      entityId: 'https://idp.test.ac.uk/shibboleth',
      affiliations: ['student'],
      contactEmail: clean,
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString()
    });
  }
  db.verifiedEmails = Array.isArray(db.verifiedEmails) ? db.verifiedEmails : [];
  if (!db.verifiedEmails.includes(clean)) db.verifiedEmails.push(clean);

  fs.writeFileSync(DB, JSON.stringify(db, null, 2));
}
