// ─────────────────────────────────────────────
// frea — snapshots of the database
// ─────────────────────────────────────────────
//
// data.json is the entire platform: every mentor, student, booking, order and
// entitlement. Railway volumes are not snapshotted, so without this there is
// exactly one copy of everything.
//
// Writes are already atomic (saveDb writes a temp file and renames), so a
// half-written database is not the risk. The risks this covers are:
//
//   · a logical mistake — reset:launch against the wrong target, or a bug that
//     deletes records — where the file is intact but the contents are wrong
//   · losing the volume, which needs a copy that is not on the volume
//
// Local rotation handles the first. The second needs the copy pulled off the
// box, which is what the admin download route is for.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DATA_DIR, DB_FILE } from './paths.js';

export const BACKUP_DIR = path.join(DATA_DIR, 'backups');

const HOURS = 60 * 60 * 1000;

function intervalMs() {
  const raw = parseFloat(process.env.BACKUP_INTERVAL_HOURS || '6');
  return (Number.isFinite(raw) && raw > 0 ? raw : 6) * HOURS;
}

function keepCount() {
  const raw = parseInt(process.env.BACKUP_KEEP || '20', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 20;
}

function hashOf(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 12);
}

/** Snapshots on disk, newest first. */
export function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs.readdirSync(BACKUP_DIR)
    .filter(n => n.startsWith('data-') && n.endsWith('.json'))
    .map(name => {
      const full = path.join(BACKUP_DIR, name);
      const stat = fs.statSync(full);
      return { name, size: stat.size, takenAt: stat.mtime.toISOString() };
    })
    .sort((a, b) => b.takenAt.localeCompare(a.takenAt));
}

/**
 * Writes a snapshot unless the database is byte-identical to the newest one.
 *
 * Skipping unchanged data matters more than it looks: a quiet platform would
 * otherwise rotate every real snapshot out of the window with copies of the
 * same bytes, and the oldest useful state you could return to would only be as
 * far back as the retention count times the interval.
 */
export function takeBackup({ force = false } = {}) {
  if (!fs.existsSync(DB_FILE)) return { skipped: 'no database yet' };

  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const payload = fs.readFileSync(DB_FILE);
  const digest = hashOf(payload);

  if (!force) {
    const [newest] = listBackups();
    if (newest && newest.name.includes(digest)) {
      return { skipped: 'unchanged since last snapshot', name: newest.name };
    }
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const name = `data-${stamp}-${digest}.json`;
  const full = path.join(BACKUP_DIR, name);

  // Same temp-then-rename dance as saveDb: a snapshot half-written during a
  // restart should not look like a valid restore point.
  const tmp = `${full}.tmp`;
  fs.writeFileSync(tmp, payload);
  fs.renameSync(tmp, full);

  const pruned = prune();
  return { name, size: payload.length, pruned };
}

/** Drops the oldest snapshots beyond the retention count. */
function prune() {
  const keep = keepCount();
  const all = listBackups();
  let pruned = 0;

  for (const b of all.slice(keep)) {
    try {
      fs.unlinkSync(path.join(BACKUP_DIR, b.name));
      pruned += 1;
    } catch (_) { /* a snapshot that vanished is already pruned */ }
  }
  return pruned;
}

/**
 * Starts the rotation. Returns the timer so tests can stop it.
 *
 * The first snapshot is taken immediately: a deploy that crashes an hour in
 * should still have left a copy of whatever it started with.
 */
export function startBackupSchedule() {
  try {
    const first = takeBackup();
    if (first.skipped) console.log(`[backup] no change since ${first.name} — nothing written`);
    else if (first.name) console.log(`[backup] ${first.name} (${first.size} bytes)`);
  } catch (err) {
    console.warn('[backup] initial snapshot failed:', err.message);
  }

  const timer = setInterval(() => {
    try {
      const result = takeBackup();

      // A skip carries the name of the snapshot it matched, so testing for
      // `name` alone reported "backup written" every interval on a quiet
      // platform — a log that says the thing you most want to be true, while
      // nothing is happening. Say which it was.
      if (result.skipped) {
        console.log(`[backup] no change since ${result.name} — nothing written`);
      } else if (result.name) {
        console.log(`[backup] ${result.name} (${result.size} bytes)${result.pruned ? ` — pruned ${result.pruned}` : ''}`);
      }
    } catch (err) {
      console.warn('[backup] snapshot failed:', err.message);
    }
  }, intervalMs());

  timer.unref();
  return timer;
}
