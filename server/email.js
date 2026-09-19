// ─────────────────────────────────────────────
// frea — Transactional email
// ─────────────────────────────────────────────

import nodemailer from 'nodemailer';
import { toLongDisplayDate, toDisplayTime } from './time.js';
import { calendarLinks } from './ics.js';

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
  return ['auto', 'ethereal', 'smtp'].includes(mode) ? mode : 'auto';
}

/**
 * What mail will actually do, without building a transporter or touching the
 * network. Exposed on /api/health because the failure this catches is silent:
 * with MAIL_TRANSPORT=auto and SMTP_* incomplete, sends go to a throwaway
 * Ethereal inbox, the API reports success, and nothing is ever delivered.
 */
export function mailStatus() {
  const mode = transportMode();
  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  if (mode === 'ethereal') return { transport: 'test-inbox', delivers: false, reason: 'MAIL_TRANSPORT=ethereal' };
  if (mode === 'smtp' && !smtpConfigured) return { transport: 'misconfigured', delivers: false, reason: 'MAIL_TRANSPORT=smtp but SMTP_HOST/USER/PASS incomplete' };
  if (smtpConfigured) {
    return {
      transport: 'smtp',
      delivers: true,
      host: process.env.SMTP_HOST,
      from: (mailFrom().match(/@([^>\s]+)/) || [])[1] || null
    };
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

async function send(mailOptions) {
  const mailer = await getEmailTransporter();
  const info = await mailer.sendMail({ from: mailFrom(), ...mailOptions });
  let previewUrl = null;
  try {
    previewUrl = nodemailer.getTestMessageUrl(info) || null;
    if (previewUrl) console.log(`[frea email] Preview: ${previewUrl}`);
  } catch (_) { /* not an Ethereal transport */ }
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

export async function sendVerificationEmail({ email, code, token, universityName = '' }) {
  const verifyUrl = `${baseUrl()}/verify?token=${token}&email=${encodeURIComponent(email)}`;

  return send({
    to: email,
    subject: `Your frea verification code: ${code}`,
    html: shell(`
      <h1 style="font-size: 22px; font-weight: 700; color: #171717; margin: 0 0 10px;">Verify your UK student email</h1>
      <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
        ${universityName ? `We detected your institution as <strong>${universityName}</strong>. ` : ''}Use the six-digit code below, or tap the button.
      </p>
      <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 22px; text-align: center; margin-bottom: 8px;">
        <span style="font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #0f172a; display: block;">${code}</span>
        <div style="font-size: 12px; color: #64748b; margin-top: 8px;">Valid for 24 hours · single use</div>
      </div>
      ${button(verifyUrl, 'Verify email instantly →')}
      <div style="font-size: 13px; color: #64748b; background: #fff7ed; border-left: 3px solid #ff6f1e; padding: 12px 16px; border-radius: 6px;">
        🔒 <strong>Why we verify:</strong> frea checks every .ac.uk address so mentoring stays between genuine UK students — and stays free.
      </div>
      <p style="font-size: 12.5px; color: #94a3b8; margin-top: 18px;">If you didn't request this, you can safely ignore this email — nothing will happen.</p>
    `),
  });
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
        All your bookings live at <a href="${baseUrl()}/my-sessions" style="color: #ff6f1e; font-weight: 700;">my sessions</a> —
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
  });
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
  });
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
  });
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
  });
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
  });
}
