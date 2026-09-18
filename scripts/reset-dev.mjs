// ─────────────────────────────────────────────
// frea — restore the local demo state
// ─────────────────────────────────────────────
//
//   npm run reset:dev
//
// Puts the database back to the seeded demo content and clears everything the
// test suites create: throwaway mentors, bookings, sessions, orders, reports
// and uploaded files.
//
// Unlike `reset:launch`, this *restores* demo data rather than emptying the
// platform. Use it after a test run; use reset:launch before real users.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DB_FILE = path.join(ROOT, 'server', 'data.json');
const SEED_FILE = path.join(ROOT, 'server', 'data.seed.json');
const UPLOAD_DIRS = [
  path.join(ROOT, 'server', 'uploads', 'digital_products'),
  path.join(ROOT, 'server', 'uploads', 'pitch_videos')
];

if (!fs.existsSync(SEED_FILE)) {
  console.error('server/data.seed.json is missing — cannot restore the demo state.');
  process.exit(1);
}

const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
const before = fs.existsSync(DB_FILE)
  ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
  : { mentors: [], resources: [], bookings: [] };

const seedIds = new Set(seed.mentors.map(m => m.id));
const strayMentors = (before.mentors || []).filter(m => !seedIds.has(m.id));

// Rebuild mentors from the seed rather than pruning the live set. Pruning
// meant a seeded mentor got deleted whenever a test wrote a fixture payout
// account onto them — the record looked like test data and was not.
const restored = {
  ...seed,
  mentors: seed.mentors.map(m => ({ ...m, docs: [], payoutsEnabled: false })),
  bookings: [],
  mentorApplications: [],
  verifiedEmails: [],
  verificationTokens: [],
  resources: [],
  orders: [],
  entitlements: [],
  sessions: [],
  suggestions: [],
  reports: [],
  stats: { totalBookings: 0, verifiedMentors: seed.mentors.length, averageRating: 4.9 }
};

fs.writeFileSync(DB_FILE, JSON.stringify(restored, null, 2), 'utf8');

let filesRemoved = 0;
for (const dir of UPLOAD_DIRS) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (f.startsWith('.')) continue;
    try { fs.unlinkSync(path.join(dir, f)); filesRemoved += 1; } catch (_) { /* best effort */ }
  }
}

console.log('Restored the seeded demo state.');
console.log(`  mentors      ${before.mentors?.length ?? 0} → ${restored.mentors.length}`
  + (strayMentors.length ? `  (removed ${strayMentors.length} test mentor(s))` : ''));
console.log(`  bookings     ${before.bookings?.length ?? 0} → 0`);
console.log(`  uploads      ${filesRemoved} file(s) removed`);

// Regenerate the real demo documents so every resource is downloadable again.
console.log('\nRegenerating demo resources…');
const result = spawnSync(process.execPath, [path.join(__dirname, 'seed-resources.mjs')], {
  stdio: 'inherit',
  cwd: ROOT
});

if (result.status !== 0) {
  console.error('\nResource seeding failed — run `npm run seed:resources` manually.');
  process.exit(1);
}

console.log('\nRestart the server so it reads the restored database.\n');
