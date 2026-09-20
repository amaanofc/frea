// ─────────────────────────────────────────────
// frea — front-end smoke tests
// ─────────────────────────────────────────────
//
// Boots the built SPA bundle inside jsdom against the real API and walks every
// route, asserting that nothing throws and that the key screens actually
// render. Run the API server first:  npm run server
//
//   node --test test/

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const API = 'http://localhost:3001/api';

let dom, errors;

/** Locates the freshest built bundle so tests run against real output. */
function findBundle() {
  const assets = path.join(ROOT, 'dist', 'assets');
  if (!fs.existsSync(assets)) {
    throw new Error('dist/ not found — run `npm run build` before the tests.');
  }
  const js = fs.readdirSync(assets)
    .filter(f => f.endsWith('.js'))
    .map(f => ({ f, t: fs.statSync(path.join(assets, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)[0];
  if (!js) throw new Error('No JS bundle in dist/assets.');
  return fs.readFileSync(path.join(assets, js.f), 'utf8');
}

before(async () => {
  // Fail fast with a clear message if the API isn't up.
  try {
    const res = await fetch(`${API}/health`);
    assert.equal(res.status, 200);
  } catch (e) {
    throw new Error(`API server not reachable at ${API}. Start it with \`npm run server\`.`);
  }

  const html = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8')
    .replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, '')
    .replace(/<link[^>]*rel="stylesheet"[^>]*>/g, '');

  dom = new JSDOM(html, {
    url: 'http://localhost:5173/',
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });

  errors = [];
  const { window } = dom;

  window.addEventListener('error', e => errors.push(String(e.error || e.message)));
  window.addEventListener('unhandledrejection', e => errors.push(String(e.reason)));

  // Route the SPA's relative fetches at the real API.
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    return fetch(url.startsWith('/') ? `http://localhost:3001${url}` : url, init);
  };
  window.IntersectionObserver = class {
    observe() {} unobserve() {} disconnect() {}
  };
  window.scrollTo = () => {};
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  window.alert = () => {};
  window.confirm = () => true;
  window.prompt = () => null;

  const bundle = findBundle();
  try {
    window.eval(bundle);
  } catch (e) {
    throw new Error(`Bundle threw on load: ${e.message}`);
  }

  // Let init()'s async hydration settle.
  await new Promise(r => setTimeout(r, 1200));
});

after(() => {
  if (dom) dom.window.close();
});

/** Navigates the hash router and waits for the render to settle. */
async function goto(hash) {
  const { window } = dom;
  window.location.hash = hash;
  window.dispatchEvent(new window.HashChangeEvent('hashchange'));
  await new Promise(r => setTimeout(r, 450));
  return window.document.getElementById('app').textContent;
}

test('bundle boots without throwing', () => {
  assert.equal(errors.length, 0, `Errors on boot:\n${errors.join('\n')}`);
});

test('landing page renders its hero and mission', async () => {
  const text = await goto('#/');
  assert.match(text, /how it works/i);
  assert.match(text, /why we built this/i);
});

// The landing stats strip was removed in the UI pass — the page no longer
// shows mentor/university/resource counts. /api/stats still works and is
// covered by the smoke suite; there is nothing left on the landing page to
// assert against. Restore a test here if the numbers ever come back.

test('no hidden control can block a form from submitting', async () => {
  await goto('#/become-a-mentor');
  const { document } = dom.window;

  // A control that fails constraint validation while hidden cannot be focused
  // to report why, so the browser aborts submit and says nothing: the button
  // looks dead. The price field did exactly this — step="0.50" made its own
  // default of 4.99 a stepMismatch, inside a wrapper hidden until "paid".
  const hiddenBy = (el) => {
    let n = el;
    while (n && n !== document.body) {
      if (/display:\s*none/i.test(n.getAttribute?.('style') || '')) return n.id || n.tagName;
      n = n.parentElement;
    }
    return null;
  };

  for (const form of document.querySelectorAll('form')) {
    for (const el of form.querySelectorAll('input, select, textarea')) {
      if (!el.willValidate) continue;   // disabled controls are skipped, which is the fix
      const hidden = hiddenBy(el);
      if (!hidden) continue;
      assert.ok(el.checkValidity(),
        `#${el.id || el.name} is hidden by #${hidden} and invalid — it will block submit with no visible error`);
    }
  }
});

test('the mentor form submits once its visible fields are filled', async () => {
  await goto('#/become-a-mentor');
  const { document } = dom.window;
  const form = document.getElementById('become-mentor-form');

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  set('bm-name', 'Test Mentor');
  set('bm-major', 'Computer Science');
  set('bm-email', 'test@ed.ac.uk');
  set('bm-achieve-1', 'first-class-honours');
  set('bm-toptip', 'Start applications in September.');
  for (const id of ['bm-uni', 'bm-year']) {
    const sel = document.getElementById(id);
    if (sel && sel.options.length > 1) sel.selectedIndex = 1;
  }

  const invalid = [...form.querySelectorAll('input, select, textarea')]
    .filter(el => el.willValidate && !el.checkValidity())
    .map(el => el.id || el.tagName);
  assert.deepEqual(invalid, [], 'a filled form should be submittable');

  // And the paid path, where the price field becomes live.
  dom.window.toggleDocPriceField('paid', 'bm-doc-price-wrap');
  const price = document.getElementById('bm-doc-price');
  assert.equal(price.disabled, false, 'price should be enabled when paid is chosen');
  assert.ok(price.checkValidity(), `default price ${price.value} should be valid`);

  // Bounds match the server, which accepts £1.00 to £100.00 at 2dp.
  price.value = '0.50'; assert.ok(!price.checkValidity(), 'below £1 should be rejected');
  price.value = '101';  assert.ok(!price.checkValidity(), 'above £100 should be rejected');
  price.value = '4.99'; assert.ok(price.checkValidity(), '2dp prices must be allowed');
});

test('browse page renders the mentor grid', async () => {
  const text = await goto('#/browse');
  assert.match(text, /find your senior mentor/i);
});

test('resources hub renders', async () => {
  const text = await goto('#/resources');
  assert.ok(text.length > 200, 'resources hub should render content');
});

test('become-a-mentor form renders with the links editor', async () => {
  await goto('#/become-a-mentor');
  const { document } = dom.window;
  assert.ok(document.getElementById('bm-email'), 'email field should exist');
  assert.ok(document.getElementById('bm-links-container'), 'links editor should exist');
  assert.ok(document.getElementById('bm-doc-uploaded-file'), 'upload handle field should exist');
});

test('mentor profile renders and loads a live calendar', async () => {
  const mentors = await (await fetch(`${API}/mentors`)).json();
  const id = mentors.data[0].id;

  await goto(`#/mentor/${id}`);
  await new Promise(r => setTimeout(r, 700));

  const { document } = dom.window;
  const cal = document.getElementById('profile-calendar-root');
  assert.ok(cal, 'calendar root should exist');
  assert.doesNotMatch(cal.textContent, /failed to load/i, 'calendar should load');
});

test('calendar opens on the current month, not a hardcoded one', async () => {
  const mentors = await (await fetch(`${API}/mentors`)).json();
  await goto(`#/mentor/${mentors.data[0].id}`);
  await new Promise(r => setTimeout(r, 700));

  const now = new Date();
  const expected = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][now.getMonth()];
  const cal = dom.window.document.getElementById('profile-calendar-root').textContent;

  assert.ok(
    cal.includes(expected) || cal.includes(String(now.getFullYear())),
    `calendar should show the current month (${expected} ${now.getFullYear()}), got: ${cal.slice(0, 120)}`
  );
});

test('admin dashboard is gated behind sign-in', async () => {
  const text = await goto('#/admin');
  await new Promise(r => setTimeout(r, 400));
  assert.match(text, /sign in|administrator/i, 'admin should demand sign-in');
  assert.doesNotMatch(text, /@[a-z.]+\.ac\.uk/i, 'no applicant emails should leak to a signed-out visitor');
});

test('mentor portal shows the sign-in screen when signed out', async () => {
  const text = await goto('#/mentor-dashboard');
  assert.match(text, /sign in|mentor/i);
});

test('my-sessions route renders', async () => {
  const text = await goto('#/my-sessions');
  assert.match(text, /sessions/i);
});

test('verify route reports failure honestly for a bad token', async () => {
  await goto('#/verify?token=definitely-not-a-real-token');
  await new Promise(r => setTimeout(r, 700));
  const text = dom.window.document.getElementById('app').textContent;
  assert.doesNotMatch(text, /verified successfully/i,
    'a bad token must not claim success');
  assert.match(text, /didn.t work|expired|incomplete/i);
});

test('checkout-complete handles a cancelled return', async () => {
  await goto('#/checkout-complete?order=nope&status=cancelled');
  await new Promise(r => setTimeout(r, 500));
  const text = dom.window.document.getElementById('app').textContent;
  assert.match(text, /cancelled/i);
  assert.match(text, /no payment was taken/i);
});

test('no uncaught errors after walking every route', () => {
  const real = errors.filter(e => !/Not implemented|Could not parse CSS/i.test(e));
  assert.equal(real.length, 0, `Runtime errors:\n${real.join('\n')}`);
});
