// ─────────────────────────────────────────────
// frea — refuse to run a suite against production
// ─────────────────────────────────────────────
//
// The end-to-end suites invent email addresses — scan1789925684676@ed.ac.uk
// and the like — to open sessions with. Locally those go to a test inbox and
// cost nothing. Pointed at production they are sent for real, to addresses
// that do not exist, and they bounce.
//
// Bounces are the single worst signal a sending domain can produce. On a
// domain with months of history a couple are noise; on a three-day-old one
// with nine total sends they are a fifth of everything it has ever sent, and
// they land precisely when its reputation is being formed.
//
// This already happened once. Hence the guard.

export function localOnly(api, { suite = 'This suite' } = {}) {
  if (/localhost|127\.0\.0\.1/.test(api)) return;

  console.log('');
  console.log(`${suite} invents email addresses and opens sessions with them.`);
  console.log(`Against ${api} those would be sent for real and would bounce,`);
  console.log('which damages the sending domain\'s reputation.');
  console.log('');
  console.log('Refusing to run. Use a local server, or test:smoke against production —');
  console.log('it is read-only and safe.');
  console.log('');
  process.exit(0);
}
