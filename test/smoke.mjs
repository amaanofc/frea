// ─────────────────────────────────────────────
// frea — post-deploy smoke test
// ─────────────────────────────────────────────
//
//   npm run test:smoke                       # against localhost:3001
//   npm run test:smoke https://joinfrea.com  # against production
//
// Safe to run against production: it reads, and the only writes it attempts are
// ones that MUST be rejected. It never creates a mentor, booking or order.
//
// Flows needing a real inbox (verification, booking, purchase) can't be
// automated from outside — those are in QA.md.

const TARGET = (process.argv[2] || process.env.SMOKE_URL || 'http://localhost:3001').replace(/\/+$/, '');
const API = `${TARGET}/api`;

let pass = 0, fail = 0, warn = 0;
const ok = (label, cond, detail = '') => {
  if (cond) { pass++; console.log(`   ✓ ${label}`); }
  else { fail++; console.log(`   ✗ ${label}${detail ? '  — ' + detail : ''}`); }
};
const caution = (label, detail = '') => { warn++; console.log(`   ! ${label}${detail ? '  — ' + detail : ''}`); };
const group = (n) => console.log(`\n${n}`);

async function get(path, opts = {}) {
  try {
    const res = await fetch(`${TARGET}${path}`, { redirect: 'manual', ...opts });
    return res;
  } catch (err) {
    return { status: 0, ok: false, error: err.message, headers: new Map(), text: async () => '', json: async () => ({}) };
  }
}

console.log(`\nfrea smoke test → ${TARGET}`);

// ── Is it alive ──────────────────────────────────────────────────────────
group('AVAILABILITY');
let health = {};
{
  const res = await get('/api/health');
  ok('API responds', res.status === 200, res.error || `status ${res.status}`);
  if (res.status !== 200) {
    console.log('\nNothing else can be checked while the API is down.\n');
    process.exit(1);
  }
  health = await res.json();
  ok('reports itself healthy', health.status === 'ok', JSON.stringify(health));

  const spa = await get('/');
  ok('front end is served', spa.status === 200, `status ${spa.status}`);
  const html = await spa.text();
  ok('HTML contains the app root', html.includes('id="app"'));
  ok('HTML references a built bundle', /\/assets\/index-[\w-]+\.js/.test(html));
}

// ── Configuration actually in effect ─────────────────────────────────────
group('CONFIGURATION');
{
  if (health.payments === 'stripe') ok('Stripe is configured', true);
  else caution('Stripe is NOT configured — paid playbooks will refuse at checkout');

  const isProd = TARGET.startsWith('https://');
  if (isProd) {
    ok('served over HTTPS', true);
  } else {
    caution('not HTTPS — expected for local, never acceptable in production');
  }

  // The failure this catches is silent: with SMTP_* incomplete the server
  // falls back to a throwaway Ethereal inbox, every send reports success, and
  // no verification code ever reaches a student.
  const mail = health.mail || {};
  if (isProd) {
    ok('mail actually delivers', mail.delivers === true,
      `transport=${mail.transport}${mail.reason ? ' — ' + mail.reason : ''}`);
    if (mail.delivers) ok('mail sends from the real domain', Boolean(mail.from), String(mail.from));
  } else if (!mail.delivers) {
    caution(`mail goes to a test inbox (${mail.reason || mail.transport}) — expected locally`);
  }

  // A sitemap URL on the wrong host means PUBLIC_BASE_URL is wrong, which also
  // means every emailed link is wrong.
  const sm = await get('/sitemap.xml');
  const smText = await sm.text();
  const firstLoc = (smText.match(/<loc>([^<]+)<\/loc>/) || [])[1] || '';
  if (isProd) {
    ok('PUBLIC_BASE_URL matches the deployed host',
      firstLoc.startsWith(TARGET), `sitemap says ${firstLoc || '(none)'}`);
  } else {
    console.log(`   · sitemap base: ${firstLoc || '(none)'}`);
  }
}

// ── Security ─────────────────────────────────────────────────────────────
group('SECURITY');
{
  const admin = await get('/api/admin/applications');
  ok('admin data requires sign-in', admin.status === 401, `status ${admin.status}`);

  const reports = await get('/api/admin/reports');
  ok('reports require sign-in', reports.status === 401, `status ${reports.status}`);

  const edit = await get('/api/mentors/1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bio: 'smoke-test-should-never-apply' })
  });
  ok('anonymous profile edit refused', edit.status === 401 || edit.status === 403, `status ${edit.status}`);

  const book = await get('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mentorId: 1, date: '2030-01-01', time: '10:00' })
  });
  ok('anonymous booking refused', book.status === 401, `status ${book.status}`);

  const upload = await get('/api/upload/document', { method: 'POST' });
  ok('anonymous upload refused', upload.status === 401 || upload.status === 403, `status ${upload.status}`);

  const files = await get('/uploads/digital_products/anything.pdf');
  ok('resource files are not publicly reachable', files.status === 404, `status ${files.status}`);

  const webhook = await get('/api/stripe/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"type":"checkout.session.completed"}'
  });
  ok('unsigned Stripe webhook refused', webhook.status === 400, `status ${webhook.status}`);

  // Mentor emails must never appear in a public listing.
  const mentors = await (await get('/api/mentors')).json();
  const leaked = (mentors.data || []).filter(m => m.email);
  ok('mentor emails not exposed publicly', leaked.length === 0, `${leaked.length} leaked`);
}

// ── Content is actually there ────────────────────────────────────────────
group('CONTENT');
{
  const mentors = await (await get('/api/mentors')).json();
  const count = mentors.count ?? 0;
  if (count > 0) ok(`mentors are listed (${count})`, true);
  else caution('no mentors on the platform — expected right after reset:launch');

  const resources = await (await get('/api/resources')).json();
  const rCount = resources.count ?? 0;
  if (rCount > 0) ok(`resources are listed (${rCount})`, true);
  else caution('no resources on the platform');

  if (count > 0) {
    const id = mentors.data[0].id;
    const profile = await get(`/api/mentors/${id}`);
    ok('a mentor profile loads', profile.status === 200);

    const now = new Date();
    const slots = await (await get(`/api/mentors/${id}/slots?year=${now.getFullYear()}&month=${now.getMonth() + 2}`)).json();
    const open = slots.data?.totalOpenSlots ?? 0;
    if (open > 0) ok(`mentor has bookable slots next month (${open})`, true);
    else caution('no open slots next month — students cannot book this mentor');
  }

  const stats = await (await get('/api/stats')).json();
  ok('stats endpoint works', stats.success === true);
}

// ── Deep links must resolve, or shared URLs 404 ──────────────────────────
group('ROUTING');
{
  for (const route of ['/browse', '/resources', '/become-a-mentor']) {
    const res = await get(route);
    ok(`${route} serves the app`, res.status === 200, `status ${res.status}`);
  }

  const mentors = await (await get('/api/mentors')).json();
  if ((mentors.count ?? 0) > 0) {
    const res = await get(`/mentor/${mentors.data[0].id}`);
    ok('a deep-linked mentor profile resolves', res.status === 200, `status ${res.status}`);
  }
}

// ── Search engines and social ────────────────────────────────────────────
group('SEO & SHARING');
{
  const robots = await get('/robots.txt');
  const robotsText = await robots.text();
  ok('robots.txt served', robots.status === 200);
  ok('robots.txt names the sitemap', robotsText.includes('Sitemap:'));
  ok('private routes disallowed',
    robotsText.includes('Disallow: /mentor-dashboard') && robotsText.includes('Disallow: /my-space'));

  const sitemap = await get('/sitemap.xml');
  const sitemapText = await sitemap.text();
  const urls = (sitemapText.match(/<url>/g) || []).length;
  ok('sitemap.xml served', sitemap.status === 200);
  ok(`sitemap lists URLs (${urls})`, urls >= 4, `${urls} found`);

  const og = await get('/og-preview.png');
  ok('social preview image resolves', og.status === 200, `status ${og.status}`);
  ok('preview image is a PNG',
    (og.headers.get?.('content-type') || '').includes('image/png'));

  const favicon = await get('/favicon.svg');
  ok('favicon resolves', favicon.status === 200, `status ${favicon.status}`);

  const html = await (await get('/')).text();
  ok('page has a title', /<title>[^<]{10,}<\/title>/.test(html));
  ok('page has a description', /name="description"\s+content="[^"]{40,}"/.test(html));
  ok('canonical URL present', /rel="canonical"/.test(html));
}

// ── Summary ──────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(52)}`);
console.log(`${pass} passed   ${fail} failed   ${warn} to check`);

if (fail > 0) {
  console.log('\nFailures above are deployment problems — fix before sending anyone here.');
} else if (warn > 0) {
  console.log('\nNo failures. Review the "!" lines; some are expected right after a reset.');
} else {
  console.log('\nDeployment looks healthy.');
}
console.log('');

process.exit(fail > 0 ? 1 : 0);
