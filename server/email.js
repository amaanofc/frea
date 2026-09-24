// ─────────────────────────────────────────────
// frea — Transactional email
// ─────────────────────────────────────────────

import nodemailer from 'nodemailer';
import { toLongDisplayDate, toDisplayTime } from './time.js';
import { calendarLinks } from './ics.js';
import { recordMailHandoff } from './db.js';

let transporter = null;

/**
 * Mentor-controlled text reaches these templates verbatim — a name, a top tip,
 * a playbook title. Unescaped, a mentor can close a tag and inject their own
 * markup into mail that leaves frea's domain with valid SPF and DKIM, which is
 * a convincing phishing primitive even though clients strip <script>.
 *
 * Subjects are left alone: nodemailer encodes those, and entities would show
 * up literally in the inbox.
 */
function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function baseUrl() {
  return (process.env.PUBLIC_BASE_URL || 'http://localhost:5173').replace(/\/+$/, '');
}

function mailFrom() {
  return process.env.MAIL_FROM || '"frea UK Peer Mentoring" <hello@joinfrea.com>';
}

/**
 * Which transport to use.
 *
 *   auto (default) — real SMTP when fully configured, otherwise a test inbox
 *   ethereal       — always the test inbox, whatever SMTP_* says
 *   smtp           — always real SMTP; fail loudly if it is not configured
 *
 * `ethereal` exists for local work: a real provider will refuse to send to the
 * arbitrary addresses that tests and manual clicking generate, either because
 * the sending domain is not verified yet or because a shared sender only
 * delivers to the account owner. Keeping the key in .env while forcing the
 * test inbox means dev works without disturbing production config.
 */
function transportMode() {
  const mode = (process.env.MAIL_TRANSPORT || 'auto').trim().toLowerCase();
  return ['auto', 'ethereal', 'smtp', 'resend'].includes(mode) ? mode : 'auto';
}

/**
 * What mail will actually do, without building a transporter or touching the
 * network. Exposed on /api/health because the failure this catches is silent:
 * with MAIL_TRANSPORT=auto and SMTP_* incomplete, sends go to a throwaway
 * Ethereal inbox, the API reports success, and nothing is ever delivered.
 */
let smtpProbe = { checked: false };
let apiProbe = { checked: false };

// The last send failure, so a rejected message is diagnosable from
// /api/health rather than by reading platform logs. Provider messages, no
// addresses and no credentials.
let lastSendError = null;

// How long our own hand-off took, so "the email was slow" can be answered with
// a number instead of a guess. This measures us talking to Resend and nothing
// further: once they have accepted it, delivery time belongs to the receiving
// university, and the commonest cause of a multi-minute delay there is
// greylisting — a deliberate temporary rejection of the first attempt from an
// unfamiliar sender, retried automatically a few minutes later.
let lastSend = null;

/**
 * Opens one connection at boot and remembers the outcome.
 *
 * Whether the host can reach the mail server is otherwise invisible until a
 * student tries to sign up, and the symptom then is a hang rather than an
 * error. Ports are the usual culprit: some platforms block outbound 465, in
 * which case 587 with SMTP_SECURE=false works instead.
 */
export async function probeSmtp() {
  // The API path has its own check: list domains, which proves both that the
  // key is valid and that 443 is open, without sending anything.
  if (usingResendApi()) {
    try {
      const probeKey = resendReadKey() || resendApiKey();
      const res = await fetch('https://api.resend.com/domains', {
        headers: { 'Authorization': `Bearer ${probeKey}` },
        signal: AbortSignal.timeout(10_000)
      });

      // Any HTTP response proves 443 is open and the host resolves, which is
      // the failure this probe exists to catch.
      if (res.ok) {
        apiProbe = { checked: true, ok: true };
        console.log('[frea email] Resend API reachable, key verified');
      } else if (res.status === 401 || res.status === 403) {
        // Listing domains needs a key with read access. A sending-only key
        // sends mail fine and is refused here, so on its own this cannot be
        // treated as broken — only as unverified.
        //
        // With RESEND_READ_API_KEY set, that excuse is gone: the read key is
        // the one being offered, and a 401 means it is genuinely wrong.
        if (resendReadKey()) {
          apiProbe = { checked: true, ok: false, error: `read key rejected (HTTP ${res.status})` };
          console.error(`[frea email] RESEND_READ_API_KEY rejected (HTTP ${res.status}) — check the key.`);
        } else {
          apiProbe = { checked: true, ok: true, unverified: `key cannot list domains (HTTP ${res.status}) — expected for a sending-only key. Set RESEND_READ_API_KEY to remove this ambiguity.` };
          console.warn(`[frea email] Resend API reachable; key could not list domains (HTTP ${res.status}).`);
          console.warn('             Expected for a sending-only key. Set RESEND_READ_API_KEY to verify properly.');
        }
      } else {
        apiProbe = { checked: true, ok: false, error: `HTTP ${res.status}` };
        console.error(`[frea email] Resend API error: HTTP ${res.status}`);
      }
    } catch (err) {
      apiProbe = { checked: true, ok: false, error: err.message };
      console.error(`[frea email] Resend API UNREACHABLE: ${err.message}`);
    }
    return apiProbe;
  }

  const status = mailStatus();
  if (status.transport !== 'smtp') {
    smtpProbe = { checked: true, ok: null, reason: 'not using SMTP' };
    return smtpProbe;
  }
  try {
    const t = await getEmailTransporter();
    await t.verify();
    smtpProbe = { checked: true, ok: true };
    console.log(`[frea email] SMTP reachable: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}`);
  } catch (err) {
    smtpProbe = { checked: true, ok: false, error: err.message };
    console.error(`[frea email] SMTP UNREACHABLE: ${err.message}`);
    console.error('             Outbound SMTP may be blocked. Try SMTP_PORT=587 with SMTP_SECURE=false.');
  }
  return smtpProbe;
}

export function mailStatus() {
  const mode = transportMode();
  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  // Checked before SMTP: when a Resend key is present this is the path taken,
  // over 443, and the SMTP settings are no longer consulted at all.
  if (usingResendApi()) {
    const from = (mailFrom().match(/@([^>\s]+)/) || [])[1] || null;
    const base = { transport: 'resend-api', delivers: true, from };
    if (from && /resend\.dev$/i.test(from)) {
      return { ...base, delivers: false, reason: 'MAIL_FROM uses resend.dev, the Resend sandbox sender, which only reaches the account owner. Verify your domain and send as it.' };
    }
    if (apiProbe.checked && apiProbe.ok === false) {
      return { ...base, delivers: false, reachable: false, reason: `Resend API unreachable: ${apiProbe.error}` };
    }
    if (apiProbe.checked && apiProbe.ok) {
      base.reachable = true;
      if (apiProbe.unverified) base.note = apiProbe.unverified;
    }
    if (lastSendError) base.lastSendError = lastSendError;
    if (lastSend) base.lastSend = lastSend;
    return base;
  }

  if (mode === 'ethereal') return { transport: 'test-inbox', delivers: false, reason: 'MAIL_TRANSPORT=ethereal' };
  if (mode === 'smtp' && !smtpConfigured) return { transport: 'misconfigured', delivers: false, reason: 'MAIL_TRANSPORT=smtp but SMTP_HOST/USER/PASS incomplete' };
  if (smtpConfigured) {
    const host = process.env.SMTP_HOST;
    const from = (mailFrom().match(/@([^>\s]+)/) || [])[1] || null;

    // resend.dev is Resend's shared sandbox sender. It accepts everything and
    // delivers only to the account owner's own address, so a student never
    // receives their code and nothing anywhere reports an error. Sending as
    // your own domain requires verifying it at resend.com/domains first.
    if (from && /resend\.dev$/i.test(from)) {
      return {
        transport: 'smtp',
        delivers: false,
        host,
        from,
        reason: 'MAIL_FROM uses resend.dev, the Resend sandbox sender, which only reaches the account owner. Verify your domain and send as it.'
      };
    }

    const base = { transport: 'smtp', delivers: true, host, from };
    if (smtpProbe.checked && smtpProbe.ok === false) {
      return { ...base, delivers: false, reachable: false, reason: `SMTP unreachable: ${smtpProbe.error}` };
    }
    if (smtpProbe.checked && smtpProbe.ok) base.reachable = true;
    return base;
  }
  return { transport: 'test-inbox', delivers: false, reason: 'SMTP_HOST/USER/PASS not all set — falling back to Ethereal' };
}

export async function getEmailTransporter() {
  if (transporter) return transporter;

  const mode = transportMode();
  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  if (mode === 'smtp' && !smtpConfigured) {
    throw new Error('MAIL_TRANSPORT=smtp but SMTP_HOST / SMTP_USER / SMTP_PASS are not all set.');
  }

  if (mode !== 'ethereal' && smtpConfigured) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      // Without these, nodemailer waits minutes on an unreachable host: the
      // HTTP request never returns and the sign-up screen sits on "sending
      // your code" forever. Failing in seconds turns a hang into an error the
      // student can act on.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    console.log(`[frea email] Using configured SMTP server: ${process.env.SMTP_HOST}`);

    const from = mailFrom();
    const domain = (from.match(/@([^>\s]+)/) || [])[1];
    if (domain && /resend\.com$/.test(process.env.SMTP_HOST || '') && !/resend\.dev$/.test(domain)) {
      console.log(`[frea email] Sending as @${domain} — this domain must be verified at`);
      console.log('             resend.com/domains or every send fails with a 550.');
    }
    return transporter;
  }

  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log(`[frea email] Using Ethereal test inbox (${mode === 'ethereal' ? 'MAIL_TRANSPORT=ethereal' : 'no SMTP configured'}): ${testAccount.user}`);
    return transporter;
  } catch (err) {
    console.warn('[frea email] Falling back to simulated JSON transport:', err.message);
    transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter;
  }
}

/**
 * Resend over HTTPS instead of SMTP.
 *
 * Railway blocks outbound SMTP — 465 and 587 both time out on connect — which
 * is common on container platforms and not something the app can configure its
 * way around. The HTTP API is port 443, so it is never caught by that, and it
 * is the path Resend themselves recommend.
 *
 * The key is the same value SMTP_PASS already holds, so nothing new has to be
 * set for this to work; RESEND_API_KEY is accepted too for clarity.
 */
function resendApiKey() {
  const explicit = (process.env.RESEND_API_KEY || '').trim();
  if (explicit) return explicit;
  const pass = (process.env.SMTP_PASS || '').trim();
  return pass.startsWith('re_') ? pass : '';
}

/**
 * A read-scoped key, if one is configured.
 *
 * The sending key is deliberately restricted — it answers 401
 * "restricted_api_key" to every GET, including the domain check the boot
 * probe makes, which is why that probe cannot tell a sending-only key from an
 * invalid one. A separate read key resolves that ambiguity and is the only way
 * to query delivery events, which is where the answer to "did it actually
 * arrive" lives. Optional: without it everything works exactly as before.
 */
function resendReadKey() {
  return (process.env.RESEND_READ_API_KEY || '').trim();
}

/** True when we should prefer the API over SMTP. */
function usingResendApi() {
  const mode = transportMode();
  if (mode === 'ethereal') return false;
  if (mode === 'resend') return Boolean(resendApiKey());
  // auto: a Resend key means the API is available and strictly more reliable.
  return mode === 'auto' && Boolean(resendApiKey());
}

async function sendViaResendApi(mailOptions) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: mailFrom(),
      to: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
      subject: mailOptions.subject,
      html: mailOptions.html,
      ...(mailOptions.text ? { text: mailOptions.text } : {}),
      ...(mailOptions.attachments ? {
        attachments: mailOptions.attachments.map(a => ({
          filename: a.filename,
          content: Buffer.isBuffer(a.content)
            ? a.content.toString('base64')
            : Buffer.from(String(a.content)).toString('base64')
        }))
      } : {})
    }),
    signal: AbortSignal.timeout(15_000)
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Resend API ${res.status}: ${body.message || body.name || 'send failed'}`);
  }
  return { messageId: body.id || null, previewUrl: null };
}

/**
 * A plain-text alternative, derived from the HTML when none is given.
 *
 * Every message here was HTML-only. Filters treat that as a spam signal —
 * SpamAssassin scores MIME_HTML_ONLY, and Microsoft tenants, which is what
 * most .ac.uk addresses run on, weigh it more heavily still. On a domain with
 * no sending history that alone can be enough to land a message in a
 * quarantine the student never sees.
 *
 * It is also just correct: a multipart message should carry a readable text
 * part for clients that will not render HTML.
 */
export function htmlToText(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    // Keep where a link goes, not just its label.
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) => {
      const label_ = label.replace(/<[^>]+>/g, '').trim();
      return label_ && !href.startsWith('mailto:') ? label_ + ': ' + href : (label_ || href);
    })
    .replace(/<\/(p|div|h[1-6]|tr|li)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n').map(line => line.trim()).join('\n')
    .trim();
}

/**
 * `kind` labels the message in the hand-off log — "verification", "booking",
 * and so on. Without it the log says a send was slow but not which template,
 * and the verification code is the only one where latency actually costs a
 * signup.
 */
async function send(mailOptions, kind = 'unknown') {
  // Never send HTML on its own.
  if (!mailOptions.text) mailOptions = { ...mailOptions, text: htmlToText(mailOptions.html) };
  const recipient = Array.isArray(mailOptions.to) ? mailOptions.to[0] : mailOptions.to;

  if (usingResendApi()) {
    const startedAt = Date.now();
    try {
      const result = await sendViaResendApi(mailOptions);
      const ms = Date.now() - startedAt;
      lastSend = { at: new Date().toISOString(), ms };
      lastSendError = null;
      if (ms > 3000) console.warn(`[frea email] handoff to Resend took ${ms}ms`);
      recordMailHandoff({ to: recipient, kind, ms, ok: true, messageId: result.messageId });
      return result;
    } catch (err) {
      const ms = Date.now() - startedAt;
      lastSend = { at: new Date().toISOString(), ms, failed: true };
      lastSendError = { at: new Date().toISOString(), error: err.message };
      recordMailHandoff({ to: recipient, kind, ms, ok: false, error: err.message });
      throw err;
    }
  }

  const startedAt = Date.now();
  const mailer = await getEmailTransporter();
  const info = await mailer.sendMail({ from: mailFrom(), ...mailOptions });
  let previewUrl = null;
  try {
    previewUrl = nodemailer.getTestMessageUrl(info) || null;
    if (previewUrl) console.log(`[frea email] Preview: ${previewUrl}`);
  } catch (_) { /* not an Ethereal transport */ }
  recordMailHandoff({
    to: recipient, kind, ms: Date.now() - startedAt, ok: true, messageId: info.messageId
  });
  return { messageId: info.messageId, previewUrl };
}

// ─── Shared shell ───────────────────────────────────────

const shell = (body) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
    <div style="font-size: 28px; font-weight: 800; color: #171717; letter-spacing: -0.03em; margin-bottom: 22px;">frea<span style="color: #ff6f1e;">.</span></div>
    ${body}
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 26px 0 16px;">
    <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
      frea — free peer mentoring for UK university students. <a href="${baseUrl()}" style="color: #94a3b8;">${baseUrl().replace(/^https?:\/\//, '')}</a>
    </p>
  </div>
`;

const button = (href, label) => `
  <div style="text-align: center; margin: 24px 0;">
    <a href="${href}" target="_blank" style="display: inline-block; background: #ff6f1e; color: #ffffff; padding: 14px 34px; border-radius: 9999px; font-weight: 700; font-size: 15px; text-decoration: none;">${label}</a>
  </div>
`;

// ─── Email verification ─────────────────────────────────

/**
 * Deliberately plain, and it should stay that way.
 *
 * This message was styled like the rest of the product — brand wordmark, an
 * orange "Verify email instantly →" call-to-action, a dashed code panel, a
 * padlock emoji, a coloured "why we verify" note. Every one of those is a
 * feature that filters score against a sender with no reputation, and the
 * combination (new domain + six digits + a tokenised login link + urgency) is
 * indistinguishable from credential phishing to a scoring engine. Manchester's
 * Proofpoint gateway accepted it and it never reached a mailbox.
 *
 * So: no call-to-action button, no emoji, no brand colour, one short
 * paragraph. It should read like a bank's one-time passcode, because that is
 * the genre of mail that reliably gets through.
 *
 * The one-click verify link is gone too. It was the strongest single signal —
 * a URL carrying a secret, which gateways detonate in a sandbox before
 * releasing the message, adding minutes of delay and often the quarantine
 * decision itself. The code already rides in the subject line, so the link was
 * buying convenience at the cost of arrival. `/api/auth/verify` still accepts
 * tokens, so nothing downstream breaks and this is a one-function revert if
 * the trade turns out to be wrong.
 */
export async function sendVerificationEmail({ email, code }) {
  return send({
    to: email,
    // The code rides in the subject so it is readable from a notification or
    // a preview pane without opening anything.
    subject: `${code} is your frea verification code`,
    // Written out rather than derived: the code is the payload, and it should
    // not depend on how a tag-stripper happens to lay the page out.
    text: [
      `Your frea verification code is ${code}`,
      '',
      'Enter it on joinfrea.com to confirm your university email address.',
      'The code expires in 24 hours and can be used once.',
      '',
      "If you didn't request this, you can ignore this email.",
      '',
      'frea - free peer mentoring for UK university students',
    ].join('\n'),
    html: `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #222222; max-width: 480px;">
    <p style="margin: 0 0 18px;">Your frea verification code is</p>
    <p style="font-family: Consolas, Menlo, monospace; font-size: 32px; font-weight: 700; letter-spacing: 5px; margin: 0 0 18px; color: #111111;">${code}</p>
    <p style="margin: 0 0 18px;">Enter it on joinfrea.com to confirm your university email address. The code expires in 24 hours and can be used once.</p>
    <p style="margin: 0 0 24px;">If you didn't request this, you can ignore this email.</p>
    <p style="margin: 0; font-size: 13px; color: #666666;">frea &mdash; free peer mentoring for UK university students</p>
  </div>`,
  }, 'verification');
}

// ─── Booking confirmations ──────────────────────────────

const meetingBox = (booking, meetingUrl) => `
  <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
    <div style="font-size: 15px; font-weight: 700; color: #1e3a8a; margin-bottom: 8px;">
      📅 ${toLongDisplayDate(booking.date)} at ${toDisplayTime(booking.time)} <span style="font-weight: 500;">(${booking.timezone})</span>
    </div>
    <div style="font-size: 14px; color: #1e40af;">
      📹 <strong>Join here:</strong> <a href="${meetingUrl}" target="_blank" style="color: #2563eb; font-weight: 700;">${meetingUrl}</a>
    </div>
  </div>
`;

const calendarRow = (links) => `
  <p style="font-size: 13.5px; color: #475569; line-height: 1.6; margin: 0 0 6px;">
    📎 An <strong>.ics calendar invite is attached</strong> — open it to add this to Apple Calendar, Outlook, or any calendar app. Or add it directly:
  </p>
  <p style="font-size: 13.5px; margin: 0 0 20px;">
    <a href="${links.google}" target="_blank" style="color: #ff6f1e; font-weight: 700;">Google Calendar</a>
    &nbsp;·&nbsp;
    <a href="${links.outlook}" target="_blank" style="color: #ff6f1e; font-weight: 700;">Outlook</a>
  </p>
`;

/** Confirmation to the student who booked. */
export async function sendBookingConfirmationEmail({ booking, mentor, icsContent }) {
  const meetingUrl = booking.meetingUrl || booking.googleMeetUrl;
  const links = calendarLinks({ booking, mentor });
  const cancelUrl = `${baseUrl()}/cancel?booking=${booking.id}&token=${booking.cancelToken}`;

  return send({
    to: booking.studentEmail,
    subject: `Confirmed: 20-min mentoring with ${mentor.name}, ${toLongDisplayDate(booking.date)}`,
    html: shell(`
      <h2 style="font-size: 22px; font-weight: 700; color: #171717; margin: 0 0 12px;">You're booked in 🎉</h2>
      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 18px;">
        Your 20-minute 1-on-1 with <strong>${esc(mentor.name)}</strong> (${esc(mentor.major)}, ${esc(mentor.university)}) is confirmed.
      </p>
      ${meetingBox(booking, meetingUrl)}
      ${calendarRow(links)}
      ${mentor.topTip ? `
        <div style="font-size: 13.5px; color: #475569; background: #fffbeb; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #ff6f1e; margin-bottom: 20px;">
          <strong>${esc(mentor.name)}'s top tip:</strong> <em>${esc(mentor.topTip)}</em>
        </div>` : ''}
      <p style="font-size: 13.5px; color: #475569; line-height: 1.6;">
        <strong>Make it count:</strong> bring two or three specific questions. Twenty minutes goes quickly.
      </p>
      <p style="font-size: 13.5px; color: #475569; line-height: 1.6;">
        All your bookings live at <a href="${baseUrl()}/my-space" style="color: #ff6f1e; font-weight: 700;">my space</a> —
        the join link and invite are always there.
      </p>
      <p style="font-size: 12.5px; color: #94a3b8; margin-top: 18px;">
        Can't make it? <a href="${cancelUrl}" style="color: #94a3b8;">Cancel this session</a> so the slot frees up for someone else.
      </p>
    `),
    attachments: [{
      filename: `frea-session-${booking.id}.ics`,
      content: icsContent,
      contentType: 'text/calendar; charset=utf-8; method=REQUEST',
    }],
  }, 'booking-confirmation');
}

/** The same session, sent to the mentor so it lands in their calendar too. */
export async function sendMentorBookingNotification({ booking, mentor, icsContent }) {
  if (!mentor.email) return { skipped: true };

  const meetingUrl = booking.meetingUrl || booking.googleMeetUrl;
  const links = calendarLinks({ booking, mentor });
  const cancelUrl = `${baseUrl()}/cancel?booking=${booking.id}&token=${booking.cancelToken}`;

  return send({
    to: mentor.email,
    subject: `New frea booking: ${toLongDisplayDate(booking.date)} at ${toDisplayTime(booking.time)}`,
    html: shell(`
      <h2 style="font-size: 22px; font-weight: 700; color: #171717; margin: 0 0 12px;">Someone booked you 🎓</h2>
      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 18px;">
        A student has booked a 20-minute session with you. Their email is
        <strong>${esc(booking.studentEmail)}</strong> — reply directly if you'd like anything from them beforehand.
      </p>
      ${meetingBox(booking, meetingUrl)}
      ${calendarRow(links)}
      <p style="font-size: 13.5px; color: #475569; line-height: 1.6;">
        Manage your availability any time in your <a href="${baseUrl()}/mentor-dashboard" style="color: #ff6f1e; font-weight: 700;">mentor portal</a>.
      </p>
      <p style="font-size: 12.5px; color: #94a3b8; margin-top: 18px;">
        Something come up? <a href="${cancelUrl}" style="color: #94a3b8;">Cancel this session</a> and we'll let the student know.
      </p>
    `),
    attachments: [{
      filename: `frea-session-${booking.id}.ics`,
      content: icsContent,
      contentType: 'text/calendar; charset=utf-8; method=REQUEST',
    }],
  }, 'mentor-booking-notice');
}

/** Tells the other party when one side cancels. */
export async function sendCancellationEmail({ booking, mentor, icsContent, to }) {
  if (!to) return { skipped: true };

  return send({
    to,
    subject: `Cancelled: frea session on ${toLongDisplayDate(booking.date)}`,
    html: shell(`
      <h2 style="font-size: 22px; font-weight: 700; color: #171717; margin: 0 0 12px;">Session cancelled</h2>
      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 18px;">
        The 20-minute session with <strong>${esc(mentor.name)}</strong> on
        <strong>${toLongDisplayDate(booking.date)} at ${toDisplayTime(booking.time)}</strong> has been cancelled.
        The slot is open again for anyone to book.
      </p>
      ${button(`${baseUrl()}/mentor/${booking.mentorId}`, 'Book another time →')}
      <p style="font-size: 12.5px; color: #94a3b8;">A cancellation invite is attached so your calendar updates automatically.</p>
    `),
    attachments: icsContent ? [{
      filename: `frea-session-${booking.id}-cancelled.ics`,
      content: icsContent,
      contentType: 'text/calendar; charset=utf-8; method=CANCEL',
    }] : [],
  }, 'cancellation');
}

// ─── Purchases ──────────────────────────────────────────

/** Receipt plus download link, sent once Stripe confirms payment. */
export async function sendPurchaseReceiptEmail({ order, resource }) {
  const downloadUrl = `${baseUrl()}/resources?unlocked=${encodeURIComponent(order.resourceId)}`;

  return send({
    to: order.buyerEmail,
    subject: `Your frea playbook: ${resource.title}`,
    html: shell(`
      <h2 style="font-size: 22px; font-weight: 700; color: #171717; margin: 0 0 12px;">Playbook unlocked ✅</h2>
      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 18px;">
        Thanks for supporting a fellow student. You now have lifetime access to
        <strong>${esc(resource.title)}</strong> by ${esc(order.mentorName)}.
      </p>
      ${button(downloadUrl, 'Download your playbook →')}
      <div style="background: #f8fafc; border-radius: 12px; padding: 16px 18px; font-size: 13.5px; color: #475569;">
        <div style="font-weight: 700; color: #171717; margin-bottom: 8px;">Receipt</div>
        <table style="width: 100%; font-size: 13.5px; border-collapse: collapse;">
          <tr><td style="padding: 3px 0;">${esc(resource.title)}</td><td align="right">£${order.totalAmount.toFixed(2)}</td></tr>
          <tr><td style="padding: 3px 0; color: #16a34a;">To ${esc(order.mentorName)}</td><td align="right" style="color: #16a34a;">£${order.mentorPayout.toFixed(2)}</td></tr>
          <tr><td style="padding: 3px 0; color: #94a3b8;">frea fee (${Math.round(order.feeRate * 100)}%, paid by the mentor)</td><td align="right" style="color: #94a3b8;">£${order.freaFee.toFixed(2)}</td></tr>
          <tr><td colspan="2" style="border-top: 1px solid #e2e8f0; padding-top: 8px;"></td></tr>
          <tr><td style="font-weight: 700;">Total charged</td><td align="right" style="font-weight: 700;">£${order.totalAmount.toFixed(2)}</td></tr>
        </table>
        <div style="font-size: 12px; color: #94a3b8; margin-top: 10px;">Order ${order.id}</div>
      </div>
      <p style="font-size: 13.5px; color: #475569; line-height: 1.6; margin-top: 18px;">
        Want feedback on your own work? ${esc(order.mentorName.split(' ')[0])} also offers
        <strong>free 20-minute calls</strong> on frea.
      </p>
    `),
  }, 'purchase-receipt');
}

/** Tells the mentor they made a sale. */
export async function sendSaleNotificationEmail({ order, mentor }) {
  if (!mentor?.email) return { skipped: true };

  return send({
    to: mentor.email,
    subject: `You sold "${order.resourceTitle}" on frea`,
    html: shell(`
      <h2 style="font-size: 22px; font-weight: 700; color: #171717; margin: 0 0 12px;">You made a sale 💸</h2>
      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 18px;">
        A student just bought <strong>${esc(order.resourceTitle)}</strong>.
      </p>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 18px;">
        <div style="font-size: 32px; font-weight: 900; color: #16a34a;">£${order.mentorPayout.toFixed(2)}</div>
        <div style="font-size: 13px; color: #15803d;">your payout · £${order.totalAmount.toFixed(2)} sale less frea's ${Math.round(order.feeRate * 100)}% fee</div>
      </div>
      <p style="font-size: 13.5px; color: #475569; line-height: 1.6;">
        See all your sales in your <a href="${baseUrl()}/mentor-dashboard" style="color: #ff6f1e; font-weight: 700;">mentor portal</a>.
      </p>
    `),
  }, 'sale-notice');
}
