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

test('no hidden control can block a form from submitting', () => {
  const { window } = dom;
  window.localStorage.setItem('frea_session', JSON.stringify({
    email: 'verified.student@example.com',
    sessionToken: 'frontend-hidden-control-token',
    universityVerified: true,
    isMentor: false,
    isAdmin: false
  }));
  const container = window.document.createElement('div');
  container.innerHTML = window.renderBecomeMentor();
  window.document.body.appendChild(container);
  const { document } = window;

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

  const forms = document.querySelectorAll('form');
  assert.equal(forms.length, 1, 'the verified mentor form should be present');
  for (const form of forms) {
    for (const el of form.querySelectorAll('input, select, textarea')) {
      if (!el.willValidate) continue;   // disabled controls are skipped, which is the fix
      const hidden = hiddenBy(el);
      if (!hidden) continue;
      assert.ok(el.checkValidity(),
        `#${el.id || el.name} is hidden by #${hidden} and invalid — it will block submit with no visible error`);
    }
  }

  container.remove();
  window.localStorage.removeItem('frea_session');
});

test('the mentor recruitment pitch is public while the application action is gated', async () => {
  const text = await goto('#/become-a-mentor');
  const { document } = dom.window;
  assert.match(text, /become a senior mentor/i);
  assert.ok(document.getElementById('mentor-gate-start'), 'the university gate should be visible');
  assert.equal(document.getElementById('become-mentor-form'), null,
    'the application form must not be exposed before university verification');
});

test('a university-backed session exposes the application form', () => {
  const { window } = dom;
  window.localStorage.setItem('frea_session', JSON.stringify({
    email: 'verified.student@example.com',
    sessionToken: 'frontend-test-token',
    universityVerified: true,
    isMentor: false,
    isAdmin: false,
    institution: 'University of Leeds'
  }));
  const container = window.document.createElement('div');
  container.innerHTML = window.renderBecomeMentor();
  window.document.body.appendChild(container);
  const form = container.querySelector('#become-mentor-form');
  assert.ok(form, 'verified users should see the application form');
  assert.ok(container.querySelector('#bm-email'), 'the form should collect a contact email');

  const set = (id, value) => { container.querySelector(`#${id}`).value = value; };
  set('bm-name', 'Test Mentor');
  set('bm-major', 'Computer Science');
  set('bm-email', 'test@ed.ac.uk');
  set('bm-achieve-1', 'first-class-honours');
  set('bm-toptip', 'Start applications in September.');
  const invalid = [...form.querySelectorAll('input, select, textarea')]
    .filter(el => el.willValidate && !el.checkValidity())
    .map(el => el.id || el.tagName);
  assert.deepEqual(invalid, [], 'a filled application form should be valid');

  window.toggleDocPriceField('paid', 'bm-doc-price-wrap');
  const price = container.querySelector('#bm-doc-price');
  assert.equal(price.disabled, false, 'price should be enabled when paid is chosen');
  assert.ok(price.checkValidity(), `default price ${price.value} should be valid`);
  price.value = '0.50';
  assert.ok(!price.checkValidity(), 'below £1 should be rejected');
  price.value = '101';
  assert.ok(!price.checkValidity(), 'above £100 should be rejected');
  price.value = '4.99';
  assert.ok(price.checkValidity(), '2dp prices must be allowed');

  container.remove();
  window.localStorage.removeItem('frea_session');
});

test('the footer is never nested inside a narrow content column', async () => {
  // The footer is full-bleed orange. Rendered inside a wrapper with a
  // max-width — become-a-mentor is 860px, admin 1100px — it stops short of
  // both edges and reads as a floating panel rather than the page footer.
  // jsdom has no layout, so this checks the structure that causes it.
  const routes = ['/', '/browse', '/resources', '/become-a-mentor', '/mentor/1',
    '/my-space', '/mentor-dashboard', '/admin', '/faq'];

  for (const route of routes) {
    await goto(`#${route}`);
    const { document } = dom.window;
    const footer = document.querySelector('footer.footer');
    assert.ok(footer, `${route} should render a footer`);

    const parent = footer.parentElement;
    const parentClasses = (parent.className || '').toString();
    assert.ok(
      parent.id === 'app' || !/page-container|become-mentor|admin-dashboard-page|mentor-portal/.test(parentClasses),
      `${route}: footer is inside "${parentClasses || parent.id}", which constrains its width — move it outside that wrapper`
    );
  }
});

test('browse page renders the mentor grid', async () => {
  const text = await goto('#/browse');
  assert.match(text, /find your senior mentor/i);
});

test('resources hub renders', async () => {
  const text = await goto('#/resources');
  assert.ok(text.length > 200, 'resources hub should render content');
});

test('become-a-mentor keeps its recruitment pitch public before the application gate', async () => {
  await goto('#/become-a-mentor');
  const { document } = dom.window;
  assert.ok(document.getElementById('mentor-gate-start'), 'the university gate should be visible');
  assert.match(document.getElementById('app').textContent, /first, your university confirms/i);
  assert.equal(document.getElementById('bm-email'), null,
    'the application form must remain private until the student verifies');
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

test('my space is private and shows the sign-in gate when signed out', async () => {
  const text = await goto('#/my-space');
  assert.match(text, /sign in to frea|open your my space/i);
  assert.doesNotMatch(text, /download v\d+/i, 'private product actions must not render before sign-in');
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
