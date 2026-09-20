// ─────────────────────────────────────────────
// frea — email shape
// ─────────────────────────────────────────────
//
//   node --test test/email.test.mjs
//
// Deliverability, not delivery. HTML-only mail scores badly with the filters
// every .ac.uk address sits behind, so every message must carry a readable
// text part — and that part has to contain the thing the email is for.

import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.MAIL_TRANSPORT = 'ethereal';   // never touches a real provider
const { htmlToText } = await import('../server/email.js');

test('tags are stripped and text survives', () => {
  const out = htmlToText('<h1>Verify your email</h1><p>Use the code below.</p>');
  assert.match(out, /Verify your email/);
  assert.match(out, /Use the code below\./);
  assert.ok(!out.includes('<'), 'no markup should remain');
});

test('a link keeps its destination, not just its label', () => {
  const out = htmlToText('<a href="https://joinfrea.com/verify?token=abc">tap here</a>');
  assert.match(out, /tap here: https:\/\/joinfrea\.com\/verify\?token=abc/,
    'the URL must survive — it is the whole point of the email');
});

test('entities are decoded', () => {
  const out = htmlToText('<p>Valid 24 hours &amp; single use &mdash; don&#39;t share it</p>');
  assert.match(out, /&/);
  assert.match(out, /don't share it/);
  assert.ok(!out.includes('&amp;'), 'raw entities should not reach the reader');
});

test('style and head blocks are dropped whole', () => {
  const out = htmlToText('<head><style>.x{color:red}</style></head><p>Body text</p>');
  assert.equal(out, 'Body text');
});

test('block elements become line breaks, without runs of blank lines', () => {
  const out = htmlToText('<p>One</p><p>Two</p><br><br><br><p>Three</p>');
  assert.match(out, /One\nTwo/);
  assert.ok(!/\n{3,}/.test(out), 'no more than one blank line in a row');
});

test('empty and missing input do not throw', () => {
  assert.equal(htmlToText(''), '');
  assert.equal(htmlToText(null), '');
  assert.equal(htmlToText(undefined), '');
});

test('the verification email carries an explicit text part with the code', async () => {
  // The derived fallback is fine for most mail, but the code is the payload
  // and must not depend on how a tag-stripper lays the page out.
  const src = await import('node:fs').then(fs =>
    fs.readFileSync(new URL('../server/email.js', import.meta.url), 'utf8'));

  const fn = src.slice(src.indexOf('export async function sendVerificationEmail'));
  const body = fn.slice(0, fn.indexOf('\n}'));

  assert.match(body, /text: \[/, 'sendVerificationEmail should set text explicitly');
  assert.match(body, /Your frea verification code is: \$\{code\}/,
    'the plain-text part must contain the code');
  assert.match(body, /verifyUrl/, 'the plain-text part must contain the verify link');
});

test('send() fills in a text part when one is not supplied', async () => {
  const src = await import('node:fs').then(fs =>
    fs.readFileSync(new URL('../server/email.js', import.meta.url), 'utf8'));

  assert.match(src, /if \(!mailOptions\.text\)/,
    'send() must derive a text part rather than sending HTML alone');
});
