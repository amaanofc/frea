// ─────────────────────────────────────────────
// frea — where persistent data lives
// ─────────────────────────────────────────────
//
// Everything frea stores is on disk: the database is one JSON file, and
// uploads are real files. On a host like Railway that means writing to a
// mounted volume, not into the app directory — a deploy replaces the app
// directory, so anything written there is lost on the next release.
//
//   DATA_DIR=/data   (Railway, Render, Fly: the volume mount path)
//   unset            (local: server/, as before)
//
// The seed catalogue ships with the code and is read-only, so it always comes
// from the repo rather than the volume.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Writable root. A volume mount in production, the server dir locally. */
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : __dirname;

export const DB_FILE = path.join(DATA_DIR, 'data.json');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads', 'digital_products');
export const VIDEO_DIR = path.join(DATA_DIR, 'uploads', 'pitch_videos');

/** Ships with the code and is never written to. */
export const SEED_FILE = path.join(__dirname, 'data.seed.json');

export const DIST_DIR = path.join(__dirname, '..', 'dist');

/** Creates the writable tree. Called once at startup. */
export function ensureDataDirs() {
  for (const dir of [DATA_DIR, UPLOADS_DIR, VIDEO_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  // A volume that is not actually writable is the failure worth catching at
  // boot rather than when the first student tries to sign up.
  const probe = path.join(DATA_DIR, '.write-probe');
  try {
    fs.writeFileSync(probe, String(Date.now()));
    fs.unlinkSync(probe);
  } catch (err) {
    throw new Error(
      `DATA_DIR (${DATA_DIR}) is not writable: ${err.message}\n`
      + 'On Railway/Render/Fly, attach a volume and set DATA_DIR to its mount path.'
    );
  }

  return { DATA_DIR, DB_FILE, UPLOADS_DIR, VIDEO_DIR };
}
