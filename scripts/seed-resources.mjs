// ─────────────────────────────────────────────
// frea — replace the fake catalogue with real, downloadable resources
// ─────────────────────────────────────────────
//
//   node scripts/seed-resources.mjs
//
// The previous 25 seeded records had no files at all, so every download 404'd.
// This writes one genuine document per supported format and records it through
// the canonical product/version shape used by the API.
//
// This is demo content. `npm run reset:launch` removes it.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { makeMarkdown, makeLatex, makePdf, makePptx } from './lib/make-files.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Same resolution as the server: a mounted volume in production, server/ locally.
const DATA_ROOT = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(ROOT, 'server');
const DB_FILE = path.join(DATA_ROOT, 'data.json');
const UPLOADS = path.join(DATA_ROOT, 'uploads', 'digital_products');

const SEEDS = [
  {
    format: 'Markdown',
    ext: '.md',
    mentorId: 1,
    category: 'Tech & Coding',
    type: 'free',
    price: 0,
    title: 'The 2-Project Tech CV',
    subtitle: 'The single-page CV structure that got me technical screens at Stripe, Palantir and Meta.',
    bullets: [
      'Why two defensible projects beat a list of ten you cannot discuss',
      'The exact bullet formula: what you built, the constraint, the measured result',
      'Six phrases recruiters skim past, and what to write instead',
      'How to describe a group project without hiding your own contribution',
      'A worked before-and-after on a real first-year CV'
    ]
  },
  {
    format: 'LaTeX',
    ext: '.tex',
    mentorId: 8,
    category: 'Maths & Stats',
    type: 'free',
    price: 0,
    title: 'Probability Problem Sheet Template',
    subtitle: 'A LaTeX scaffold for writing up problem sheets that actually earn method marks.',
    bullets: [
      'A preamble that handles expectation, variance and conditioning cleanly',
      'Where markers give method marks, and how to make yours visible',
      'Laying out a proof so the examiner can follow it under time pressure',
      'Common notation slips that quietly cost marks every year',
      'Two fully worked solutions you can pattern-match against'
    ]
  },
  {
    format: 'PDF',
    ext: '.pdf',
    mentorId: 2,
    category: 'Finance & Banking',
    type: 'free',
    price: 0,
    title: 'Spring Week Application Timeline',
    subtitle: 'Month-by-month plan from a non-target first year to a converted summer analyst offer.',
    bullets: [
      'Why September matters far more than January for spring weeks',
      'The cold email that got replies, and the three that did not',
      'Numerical test practice: what to drill and what to ignore',
      'Commercial awareness without reading the FT for two hours a day',
      'What actually gets asked at assessment centres'
    ]
  },
  {
    format: 'PowerPoint',
    ext: '.pptx',
    mentorId: 4,
    category: 'Engineering',
    type: 'paid',
    price: 4.99,
    title: 'Exam Comeback Masterclass',
    subtitle: 'The revision system that took me from a 38% resit to an 81% first, as a deck you can work through.',
    bullets: [
      'Why rereading lecture slides feels productive and is not',
      'Active recall on a realistic timetable, not an idealised one',
      'Starting past papers in week 3, before you feel ready',
      'Building an error log that actually changes your next attempt',
      'The fortnight before: what to cut and what to protect'
    ]
  }
];

export async function seedDemoResources({ quiet = false } = {}) {
  const log = quiet ? () => {} : console.log;
  if (!fs.existsSync(DB_FILE)) {
    console.error('No server/data.json — start the server once to create it.');
    process.exit(1);
  }
  fs.mkdirSync(UPLOADS, { recursive: true });

  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

  // Clear the fake catalogue and any files it never had.
  const removed = (db.resources || []).length + (db.resourceVersions || []).length;
  db.resources = [];
  db.resourceVersions = [];
  db.entitlements = [];

  log(`Cleared ${removed} catalogue entries (none had files attached).\n`);

  for (const seed of SEEDS) {
    const mentor = db.mentors.find(m => m.id === seed.mentorId);
    if (!mentor) {
      console.warn(`  skipped "${seed.title}" — mentor ${seed.mentorId} not found`);
      continue;
    }

    const meta = {
      title: seed.title,
      subtitle: seed.subtitle,
      author: mentor.name,
      university: mentor.university,
      bullets: seed.bullets
    };

    let contents;
    if (seed.ext === '.md') contents = makeMarkdown(meta);
    else if (seed.ext === '.tex') contents = makeLatex(meta);
    else if (seed.ext === '.pdf') contents = makePdf(meta);
    else if (seed.ext === '.pptx') contents = await makePptx(meta);

    const slug = seed.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '').slice(0, 40);
    const fileName = `${slug}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${seed.ext}`;
    fs.writeFileSync(path.join(UPLOADS, fileName), contents);

    const bytes = Buffer.isBuffer(contents) ? contents.length : Buffer.byteLength(contents, 'utf8');

    const resource = {
      id: `doc-${mentor.id}-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      mentorId: mentor.id,
      mentorName: mentor.name,
      mentorUniversity: mentor.university,
      mentorMajor: mentor.major,
      title: seed.title,
      subtitle: seed.subtitle,
      type: seed.type,
      price: seed.price,
      format: seed.format,
      pages: seed.ext === '.pptx' ? '2 slides' : 'Self-contained document',
      category: seed.category,
      previewBullets: seed.bullets,
      downloads: 0,
      rating: 5.0,
      currentVersionId: null,
      createdAt: new Date().toISOString()
    };

    const version = {
      id: `${resource.id}-v1`,
      resourceId: resource.id,
      versionNumber: 1,
      fileName,
      format: resource.format,
      pages: resource.pages,
      createdAt: resource.createdAt
    };
    resource.currentVersionId = version.id;
    db.resourceVersions.unshift(version);
    db.resources.unshift(resource);

    log(`  ✓ ${seed.format.padEnd(11)} ${fileName}  (${(bytes / 1024).toFixed(1)} KB)  —  ${mentor.name}`);
  }

  db.stats = db.stats || {};
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');

  log(`\nSeeded ${db.resources.length} real resources, every one downloadable.`);
}

// Run directly: node scripts/seed-resources.mjs
const invokedDirectly = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  seedDemoResources().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}
