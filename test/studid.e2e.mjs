// ─────────────────────────────────────────────
// frea — university sign-in, end to end
// ─────────────────────────────────────────────
//
//   npm run test:studid        # starts everything it needs
//
// Unlike the other suites this one starts its own server, on its own port and
// its own DATA_DIR, pointed at a stub Studid via STUDID_API_BASE. That is the
// only way to test anything but the failure path: Studid is a live third party
// operated by one person for free, and hammering it from a test suite would be
// both rude and useless — it cannot mint us a Manchester student on demand.
//
// What broke before this suite existed was never the part that talks to
// Studid. It was the two hand-offs either side of it:
//
//   • The state went out as `?state=…` on the redirect URL. Studid returns the
//     student to `<redirectUrl>?verificationId=…` — it appends a query string
//     rather than merging one — so the state came back as
//     `abc?verificationId=123`, matched no stored row, and every student who
//     finished their university login was told the attempt had expired.
//
//   • The popup posted its result to PUBLIC_BASE_URL. Both joinfrea.com and
//     www.joinfrea.com serve the app, so for everyone who arrived on the other
//     one the message was dropped by the browser, in silence, and clicking
//     "verify with your university" appeared to do nothing at all.
//
// Both are invisible to a unit test and invisible to a human clicking through
// on the domain that happens to work, which is why they are asserted here.

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

let pass = 0, fail = 0;
const ok = (label, cond, detail = '') => {
  if (cond) { pass++; console.log(`   ✓ ${label}`); }
  else { fail++; console.log(`   ✗ ${label}${detail ? '  — ' + detail : ''}`); }
};
const group = (n) => console.log(`\n${n}`);

// ─── The stub federation gateway ────────────────────────
//
// Records what we asked it for, so the suite can assert on the redirect URL we
// sent rather than only on what comes back.

const created = [];
let nextSession = null;      // what the next poll reports
let createStatus = 200;      // flip to 403 to test the outage path

const studid = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://stub');
  const json = (status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  if (req.method === 'POST' && url.pathname === '/auth/verification') {
    let body = '';
    req.on('data', c => { body += c; });
    req.on('end', () => {
      if (createStatus !== 200) return json(createStatus, {});
      const parsed = JSON.parse(body || '{}');
      const id = `ver-${created.length + 1}`;
      created.push({ id, ...parsed });
      // Studid appends its own query string to whatever it was given.
      json(200, { id, link: `${parsed.redirectUrl}?verificationId=${id}` });
    });
    return;
  }

  const poll = url.pathname.match(/^\/auth\/verification\/(.+)$/);
  if (req.method === 'GET' && poll) {
    const row = created.find(c => c.id === decodeURIComponent(poll[1]));
    if (!row) return json(404, {});
    if (req.headers.authorization !== `Bearer ${row.secretToken}`) return json(401, {});
    return json(200, { session: nextSession });
  }

  if (req.method === 'GET' && url.pathname === '/search') {
    return json(200, { hits: [{ entityId: 'https://idp.manchester.ac.uk/shibboleth', displayName: 'The University of Manchester' }] });
  }

  json(404, {});
});

await new Promise(r => studid.listen(0, '127.0.0.1', r));
const STUDID_PORT = studid.address().port;

// ─── The server under test ─────────────────────────────

const PORT = 3457;
const BASE = `http://localhost:${PORT}`;
const API = `${BASE}/api`;
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'frea-studid-'));

const server = spawn(process.execPath, ['server/index.js'], {
  cwd: new URL('..', import.meta.url).pathname,
  env: {
    ...process.env,
    PORT: String(PORT),
    DATA_DIR,
    PUBLIC_BASE_URL: BASE,
    STUDID_API_BASE: `http://127.0.0.1:${STUDID_PORT}`,
    // Nothing here may reach a real inbox: the addresses are invented.
    MAIL_TRANSPORT: 'ethereal',
    SMTP_HOST: '', SMTP_USER: '', SMTP_PASS: '',
    ADMIN_EMAILS: ''
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverLog = '';
server.stdout.on('data', d => { serverLog += d; });
server.stderr.on('data', d => { serverLog += d; });

const shutdown = () => { try { server.kill(); } catch (_) {} try { studid.close(); } catch (_) {} };
process.on('exit', shutdown);

const ready = async () => {
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`${API}/health`);
      if (res.ok) return true;
    } catch (_) { /* not up yet */ }
    await new Promise(r => setTimeout(r, 200));
  }
  return false;
};

if (!await ready()) {
  console.log(`\nServer did not start on ${PORT}:\n${serverLog}`);
  process.exit(1);
}

console.log(`\nfrea university sign-in → ${API}`);

/**
 * Starts a verification and follows nothing: the redirect target is the
 * assertion.
 *
 * Raw http rather than fetch because the Host header is the point of half of
 * these cases, and fetch refuses to let a caller set it.
 */
const start = (host, referer) => new Promise((resolve, reject) => {
  const req = http.request({
    host: '127.0.0.1',
    port: PORT,
    path: '/api/auth/studid/start',
    method: 'GET',
    headers: {
      Host: host || `localhost:${PORT}`,
      ...(referer ? { Referer: referer } : {})
    }
  }, (res) => {
    let body = '';
    res.on('data', c => { body += c; });
    res.on('end', () => resolve({
      status: res.statusCode,
      location: res.headers.location || null,
      contentType: res.headers['content-type'] || '',
      body
    }));
  });
  req.on('error', reject);
  req.end();
});

const readDb = () => JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'data.json'), 'utf8'));

// ─── 1. The redirect URL we hand Studid ─────────────────

group('THE RETURN URL SURVIVES STUDID APPENDING TO IT');
{
  const res = await start();
  const link = res.location;
  ok('start redirects to the university chooser', res.status === 302 && Boolean(link), `status ${res.status}`);

  const sent = created.at(-1);
  ok('the state is in the path, not the query string',
    /\/api\/auth\/studid\/callback\/[0-9a-f]{48}$/.test(sent.redirectUrl),
    sent.redirectUrl);
  ok('so nothing we sent can be swallowed by an appended ?verificationId',
    !sent.redirectUrl.includes('?'),
    sent.redirectUrl);
  ok('serviceName is what the student sees on the Studid pages', sent.serviceName === 'frea');
  ok('the secret that reads the result back is per-verification',
    typeof sent.secretToken === 'string' && sent.secretToken.length >= 32);

  // What Studid actually sends them back to.
  nextSession = {
    test: false,
    entityId: 'https://idp.manchester.ac.uk/shibboleth',
    authIdentifier: 'opaque-abc@manchester.ac.uk',
    affiliations: ['student']
  };
  const back = await fetch(link);
  const html = await back.text();
  ok('the callback answers with the popup bridge, not JSON', back.ok && /postMessage/.test(html), `status ${back.status}`);
  ok('it reports a first-time student', /"needsEmail":true/.test(html), html.slice(0, 300));
  ok('with the institution the IdP vouched for',
    /The University of Manchester/.test(html), html.slice(0, 400));
  ok('and posts to its own origin, so www vs apex cannot drop it',
    /postMessage\([^)]*window\.location\.origin\)/.test(html));

  // The rest of registration, from the ticket the bridge page carried.
  const ticket = JSON.parse(html.match(/var payload = (\{.*\});/)[1]).ticket;
  ok('a first-time student gets a ticket, not a session', typeof ticket === 'string' && ticket.length > 20);

  const contact = `studid-e2e-${Date.now()}@example.com`;
  const complete = await fetch(`${API}/auth/studid/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticket, email: contact })
  });
  const completeJson = await complete.json();
  ok('nominating a contact address sends a code rather than opening a session',
    complete.ok && completeJson.needsCode === true && !completeJson.sessionToken,
    JSON.stringify(completeJson).slice(0, 200));

  const code = (readDb().verificationTokens || []).find(t => t.email === contact)?.code;
  ok('a code was issued to that address', Boolean(code));

  const signedIn = await fetch(`${API}/auth/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: contact, code })
  }).then(r => r.json());
  ok('proving the code opens a university-verified session',
    signedIn.success === true && signedIn.universityVerified === true,
    JSON.stringify(signedIn).slice(0, 200));

  // ── And again, as a returning student.
  const again = await start();
  const link2 = again.location;
  const html2 = await fetch(link2).then(r => r.text());
  const payload2 = JSON.parse(html2.match(/var payload = (\{.*\});/)[1]);
  ok('a returning student is signed straight in',
    payload2.ok === true && payload2.needsEmail === false && Boolean(payload2.sessionToken),
    JSON.stringify(payload2).slice(0, 200));
  ok('on the address they nominated', payload2.email === contact);
  ok('and the session is flagged university-verified', payload2.universityVerified === true);
}

// ─── 2. The student comes back to the origin they left ──

group('THE STUDENT COMES BACK TO THE DOMAIN THEY STARTED ON');
{
  await start(`www.localhost:${PORT}`);
  ok('a www visitor is returned to www, not to the apex in PUBLIC_BASE_URL',
    created.at(-1).redirectUrl.startsWith(`http://www.localhost:${PORT}/`),
    created.at(-1).redirectUrl);

  await start('evil.example.com');
  ok('an unrecognised Host falls back to PUBLIC_BASE_URL',
    created.at(-1).redirectUrl.startsWith(`${BASE}/`),
    created.at(-1).redirectUrl);

  await start('evil.example.com', 'http://www.example.org/sign-in');
  ok('and so does an unrecognised referrer',
    created.at(-1).redirectUrl.startsWith(`${BASE}/`),
    created.at(-1).redirectUrl);

  // A proxy that rewrites Host — Vite's dev proxy does exactly this — leaves
  // the referring page as the only thing that still names where the student is.
  await start('internal.railway.internal:8080', `http://www.localhost:${PORT}/sign-in`);
  ok('a rewritten Host falls through to the referring page',
    created.at(-1).redirectUrl.startsWith(`http://www.localhost:${PORT}/`),
    created.at(-1).redirectUrl);

  await start(`localhost:9999`);
  ok('a host on the right name but the wrong port is not trusted either',
    created.at(-1).redirectUrl.startsWith(`${BASE}/`),
    created.at(-1).redirectUrl);
}

// ─── 3. The old query-string callback still lands ───────

group('AN ATTEMPT IN FLIGHT ACROSS A DEPLOY');
{
  await start();
  const state = created.at(-1).redirectUrl.split('/').pop();
  nextSession = {
    test: false,
    entityId: 'https://idp.manchester.ac.uk/shibboleth',
    authIdentifier: 'opaque-legacy@manchester.ac.uk',
    affiliations: ['student']
  };
  // The shape the old redirect URL produced, mangled exactly as Studid mangles
  // it: our query parameter, then theirs, appended with a second '?'.
  const html = await fetch(`${API}/auth/studid/callback?state=${state}?verificationId=ver-x`).then(r => r.text());
  ok('the query form is still accepted, and the appended junk is ignored',
    /"ok":true/.test(html), html.slice(0, 300));
}

// ─── 4. Nothing about the flow is a dead end ────────────

group('AN OUTAGE REACHES THE PAGE THAT OPENED THE POPUP');
{
  createStatus = 403;
  const res = await start();
  const html = res.body;
  ok('a failed start answers with HTML, not a JSON body nobody can read',
    res.contentType.includes('text/html'), res.contentType);
  ok('it posts the failure to the opener',
    /postMessage/.test(html) && /"ok":false/.test(html),
    html.slice(0, 300));
  ok('and says what to tell the student',
    /unavailable right now/.test(html), html.slice(0, 400));
  ok('the redirect URL is logged with the failure, since that is the field Studid rejects',
    /create failed:.*redirectUrl:/.test(serverLog));
  createStatus = 200;
}

// ─── 5. What the verification has to assert ─────────────

group('WHAT IS REFUSED');
{
  const testRun = async (session, expected) => {
    const res = await start();
    nextSession = session;
    const html = await fetch(res.location).then(r => r.text());
    return { ok: /"ok":true/.test(html), html, matched: expected.test(html) };
  };

  let r = await testRun({ test: true, entityId: 'https://idp.test.ac.uk/shibboleth', authIdentifier: 'x@test.ac.uk' }, /test sign-in/);
  ok('a run against the practice IdP opens nothing', !r.ok && r.matched, r.html.slice(0, 300));

  r = await testRun({ test: false, entityId: 'https://idp.manchester.ac.uk/shibboleth', authIdentifier: '' }, /stable identifier/);
  ok('an IdP that releases no pseudonym is refused', !r.ok && r.matched, r.html.slice(0, 300));

  r = await testRun({ test: false, entityId: '', authIdentifier: 'y@manchester.ac.uk' }, /did not identify itself/);
  ok('an unidentified institution is refused', !r.ok && r.matched, r.html.slice(0, 300));

  r = await testRun({
    test: false,
    entityId: 'https://idp.manchester.ac.uk/shibboleth',
    authIdentifier: 'staff@manchester.ac.uk',
    affiliations: ['staff']
  }, /for current students/);
  ok('an account the university says is staff is refused', !r.ok && r.matched, r.html.slice(0, 300));

  // A replayed callback must not mint a second session from one sign-in.
  const res = await start();
  nextSession = {
    test: false,
    entityId: 'https://idp.manchester.ac.uk/shibboleth',
    authIdentifier: 'replay@manchester.ac.uk',
    affiliations: ['student']
  };
  const link = res.location;
  await fetch(link);
  const replay = await fetch(link).then(r => r.text());
  ok('the callback is single use', /"ok":false/.test(replay) && /expired or was already used/.test(replay), replay.slice(0, 300));
}

// ─── 6. The contact address rules ───────────────────────

group('THE CONTACT ADDRESS');
{
  const res = await start();
  nextSession = {
    test: false,
    entityId: 'https://idp.manchester.ac.uk/shibboleth',
    authIdentifier: `contact-${Date.now()}@manchester.ac.uk`,
    affiliations: ['student']
  };
  const html = await fetch(res.location).then(r => r.text());
  const ticket = JSON.parse(html.match(/var payload = (\{.*\});/)[1]).ticket;

  const refuse = await fetch(`${API}/auth/studid/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticket, email: 'someone@manchester.ac.uk' })
  });
  ok('an .ac.uk contact address is refused — that mail is what does not arrive', refuse.status === 400);

  // And the ticket survives it, so they need not verify again.
  const accept = await fetch(`${API}/auth/studid/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticket, email: `retry-${Date.now()}@example.com` })
  });
  ok('the ticket is not spent by that refusal', accept.ok, `status ${accept.status}`);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
shutdown();
fs.rmSync(DATA_DIR, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
