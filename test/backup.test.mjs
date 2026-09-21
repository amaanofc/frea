// ─────────────────────────────────────────────
// frea — backup rotation
// ─────────────────────────────────────────────
//
//   node --test test/backup.test.mjs
//
// Runs against a throwaway DATA_DIR so it never touches the real database.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'frea-backup-'));
process.env.DATA_DIR = tmpRoot;

const { takeBackup, listBackups, BACKUP_DIR } = await import('../server/backup.js');
const DB = path.join(tmpRoot, 'data.json');

const write = (obj) => fs.writeFileSync(DB, JSON.stringify(obj, null, 2), 'utf8');

test('no database yet is not an error', () => {
  const result = takeBackup();
  assert.equal(result.skipped, 'no database yet');
  assert.equal(listBackups().length, 0);
});

test('a snapshot captures the database byte for byte', () => {
  write({ mentors: [{ id: 1, name: 'Aanya' }], bookings: [] });

  const result = takeBackup();
  assert.ok(result.name, 'should report the snapshot it wrote');

  const snaps = listBackups();
  assert.equal(snaps.length, 1);

  const restored = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, snaps[0].name), 'utf8'));
  assert.equal(restored.mentors[0].name, 'Aanya');
});

test('an unchanged database does not rotate the window away', () => {
  const before = listBackups().length;
  const result = takeBackup();

  assert.equal(result.skipped, 'unchanged since last snapshot');
  assert.equal(listBackups().length, before, 'should not write a duplicate');
});

test('a changed database produces a new snapshot', () => {
  write({ mentors: [{ id: 1, name: 'Aanya' }, { id: 2, name: 'Callum' }], bookings: [] });

  const result = takeBackup();
  assert.ok(result.name);
  assert.equal(listBackups().length, 2);
});

test('force writes even when nothing changed', () => {
  const before = listBackups().length;
  const result = takeBackup({ force: true });

  assert.ok(result.name);
  assert.equal(listBackups().length, before + 1);
});

test('retention prunes the oldest and keeps the newest', () => {
  process.env.BACKUP_KEEP = '3';

  for (let i = 0; i < 6; i++) {
    write({ mentors: [], bookings: [], marker: i });
    takeBackup();
  }

  const snaps = listBackups();
  assert.equal(snaps.length, 3, 'should keep exactly BACKUP_KEEP snapshots');

  // Newest first, and the newest must be the last state written.
  const newest = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, snaps[0].name), 'utf8'));
  assert.equal(newest.marker, 5, 'the newest snapshot should be the latest state');
});

test('a snapshot is restorable as the database', () => {
  write({ mentors: [{ id: 9, name: 'Priya' }], bookings: [{ id: 'b1' }] });
  const { name } = takeBackup({ force: true });

  // Simulate the disaster: the database is clobbered.
  write({ mentors: [], bookings: [] });
  assert.equal(JSON.parse(fs.readFileSync(DB, 'utf8')).mentors.length, 0);

  // Restore is a file copy — no tooling, no format to decode.
  fs.copyFileSync(path.join(BACKUP_DIR, name), DB);

  const restored = JSON.parse(fs.readFileSync(DB, 'utf8'));
  assert.equal(restored.mentors[0].name, 'Priya');
  assert.equal(restored.bookings.length, 1);
});

test('a skip is distinguishable from a write', () => {
  // The skip result carries the name of the snapshot it matched, so a caller
  // testing only for `name` logs "backup written" every interval on a quiet
  // platform — the log says the thing you most want to be true while nothing
  // is happening.
  write({ mentors: [{ id: 1 }], bookings: [], marker: 'settled' });
  const written = takeBackup();
  assert.ok(written.name && !written.skipped, 'a real write has no skipped flag');
  assert.equal(typeof written.size, 'number', 'a real write reports its size');

  const skipped = takeBackup();
  assert.ok(skipped.skipped, 'an unchanged database reports skipped');
  assert.equal(skipped.size, undefined, 'a skip has no size — it wrote nothing');
});

test('snapshots leave no temp files behind', () => {
  const stray = fs.readdirSync(BACKUP_DIR).filter(n => n.endsWith('.tmp'));
  assert.deepEqual(stray, []);
});

process.on('exit', () => {
  try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch (_) { /* best effort */ }
});
