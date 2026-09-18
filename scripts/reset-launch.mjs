// ─────────────────────────────────────────────
// frea — clear all demo content, ready for real users
// ─────────────────────────────────────────────
//
//   npm run reset:launch
//
// Wipes every mentor, resource, booking, order, entitlement, session, report
// and uploaded file, leaving the schema and platform settings intact. Run this
// once, immediately before pointing real students at the site.
//
// This is destructive and cannot be undone — it asks first, and writes a
// timestamped backup beside data.json regardless.

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DB_FILE = path.join(ROOT, 'server', 'data.json');
const UPLOAD_DIRS = [
  path.join(ROOT, 'server', 'uploads', 'digital_products'),
  path.join(ROOT, 'server', 'uploads', 'pitch_videos')
];

const FORCE = process.argv.includes('--force') || process.argv.includes('-y');

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(f => !f.startsWith('.')).length;
}

async function confirm(summary) {
  if (FORCE) return true;

  console.log('\nThis will permanently delete:\n');
  for (const [label, n] of summary) {
    console.log(`   ${String(n).padStart(5)}  ${label}`);
  }
  console.log('\nPlatform settings and the schema are kept. This cannot be undone.');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise(resolve =>
    rl.question('\nType RESET to confirm: ', a => { rl.close(); resolve(a); })
  );
  return answer.trim() === 'RESET';
}

async function main() {
  if (!fs.existsSync(DB_FILE)) {
    console.error('No server/data.json found — nothing to reset.');
    process.exit(1);
  }

  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

  const summary = [
    ['mentors', (db.mentors || []).length],
    ['resources', (db.resources || []).length],
    ['bookings', (db.bookings || []).length],
    ['orders', (db.orders || []).length],
    ['entitlements', (db.entitlements || []).length],
    ['sessions', (db.sessions || []).length],
    ['mentor sign-up records', (db.mentorApplications || []).length],
    ['student requests', (db.suggestions || []).length],
    ['reports', (db.reports || []).length],
    ['uploaded files', UPLOAD_DIRS.reduce((n, d) => n + countFiles(d), 0)]
  ];

  if (!(await confirm(summary))) {
    console.log('\nCancelled. Nothing was changed.');
    process.exit(0);
  }

  // Back up first — cheap insurance against a mistimed run.
  const backup = `${DB_FILE}.backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  fs.copyFileSync(DB_FILE, backup);

  const fresh = {
    mentors: [],
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
    stats: {
      totalBookings: 0,
      verifiedMentors: 0,
      averageRating: 5.0
    }
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2), 'utf8');

  let filesRemoved = 0;
  for (const dir of UPLOAD_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (f.startsWith('.')) continue;
      try {
        fs.unlinkSync(path.join(dir, f));
        filesRemoved += 1;
      } catch (err) {
        console.warn(`   could not delete ${f}: ${err.message}`);
      }
    }
  }

  console.log(`\n✓ Platform cleared. ${filesRemoved} uploaded file(s) removed.`);
  console.log(`  Backup written to ${path.basename(backup)}`);
  console.log('\nBefore real students arrive, confirm:');
  console.log('   · SMTP_* is set, or nobody receives a verification code');
  console.log('   · PUBLIC_BASE_URL points at your real domain, not localhost');
  console.log('   · ADMIN_EMAILS contains an address you can actually receive mail at');
  console.log('\nRestart the server so it picks up the empty database.\n');
}

main().catch(err => {
  console.error('Reset failed:', err);
  process.exit(1);
});
