// ─────────────────────────────────────────────
// frea — Real Email Verification & Notification Engine
// ─────────────────────────────────────────────

import nodemailer from 'nodemailer';

let transporter = null;

export async function getEmailTransporter() {
  if (transporter) return transporter;

  // Real SMTP credentials from environment (if provided)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log(`[frea email] Using configured SMTP server: ${process.env.SMTP_HOST}`);
    return transporter;
  }

  // Development & testing fallback: Ethereal test account
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[frea email] Initialized Ethereal test account: ${testAccount.user}`);
    return transporter;
  } catch (err) {
    console.warn('[frea email] Fallback to simulated JSON transport', err.message);
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return transporter;
  }
}

/**
 * Send 6-digit OTP and 1-click verification link to university email
 */
export async function sendVerificationEmail({ email, code, token, universityName = '' }) {
  const mailer = await getEmailTransporter();
  const verifyUrl = `http://localhost:5173/#/verify?token=${token}&email=${encodeURIComponent(email)}`;

  const mailOptions = {
    from: '"frea UK Peer Mentoring" <verify@frea.ac.uk>',
    to: email,
    subject: `Your frea verification code: ${code}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
          <div style="font-size: 28px; font-weight: 800; color: #171717; letter-spacing: -0.03em;">frea<span style="color: #ff6f1e;">.</span></div>
        </div>
        <h1 style="font-size: 22px; font-weight: 700; color: #171717; margin-bottom: 10px;">Verify your UK student email</h1>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
          Welcome to frea. ${universityName ? `We detected your institution as <strong>${universityName}</strong>.` : ''} Please use your 6-digit security code or click the direct verification button below:
        </p>

        <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 22px; text-align: center; margin-bottom: 24px;">
          <span style="font-family: monospace; font-size: 34px; font-weight: 800; letter-spacing: 6px; color: #0f172a; display: block;">${code}</span>
          <div style="font-size: 12px; color: #64748b; margin-top: 8px;">Valid for 24 hours · Single-use authorization</div>
        </div>

        <div style="text-align: center; margin-bottom: 28px;">
          <a href="${verifyUrl}" target="_blank" style="display: inline-block; background: #ff6f1e; color: #ffffff; padding: 14px 34px; border-radius: 9999px; font-weight: 700; font-size: 15px; text-decoration: none; box-shadow: 0 4px 14px rgba(255, 111, 30, 0.28);">
            Verify Email Instantly →
          </a>
        </div>

        <div style="font-size: 13px; color: #64748b; background: #fff7ed; border-left: 3px solid #ff6f1e; padding: 12px 16px; border-radius: 6px; margin-bottom: 24px;">
          🔒 <strong>Why we verify:</strong> frea strictly enforces .ac.uk validation to keep commercial recruiters off the platform and guarantee 100% free mentoring for genuine UK students.
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
          If you didn't request this verification code, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  const info = await mailer.sendMail(mailOptions);
  let previewUrl = null;
  try {
    previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[frea email] Dev test inbox preview: ${previewUrl}`);
    }
  } catch (e) {}

  return {
    messageId: info.messageId,
    previewUrl: previewUrl || null,
  };
}

/**
 * Send booking confirmation with attached .ics calendar invite
 */
export async function sendBookingConfirmationEmail({ booking, mentor, icsContent }) {
  const mailer = await getEmailTransporter();

  const mailOptions = {
    from: '"frea UK Peer Mentoring" <sessions@frea.ac.uk>',
    to: booking.studentEmail,
    subject: `Confirmed: 20-min Mentoring with ${mentor.name} (${booking.date})`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
        <div style="font-size: 28px; font-weight: 800; color: #171717; letter-spacing: -0.03em; margin-bottom: 20px;">frea<span style="color: #ff6f1e;">.</span></div>
        <h2 style="font-size: 22px; font-weight: 700; color: #171717; margin: 0 0 12px;">You're Booked In! 🎉</h2>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 20px;">
          Your 20-minute 1-on-1 session with <strong>${mentor.name}</strong> (${mentor.major}, ${mentor.university}) is confirmed.
        </p>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
          <div style="font-size: 15px; font-weight: 700; color: #1e3a8a; margin-bottom: 6px;">📅 ${booking.date} at ${booking.time} (BST)</div>
          <div style="font-size: 14px; color: #1e40af; margin-bottom: 10px;">
            📹 <strong>Google Meet:</strong> <a href="${booking.googleMeetUrl}" target="_blank" style="color: #2563eb; font-weight: 700; text-decoration: underline;">${booking.googleMeetUrl}</a>
          </div>
          <div style="font-size: 13px; color: #475569; background: #ffffff; padding: 10px 14px; border-radius: 8px; border-left: 3px solid #ff6f1e;">
            <strong>Senior Tip from ${mentor.name}:</strong> <em>${mentor.topTip || 'Bring 2-3 specific questions for the call!'}</em>
          </div>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          📎 <strong>Calendar invite attached:</strong> An official iCalendar (.ics) invite has been attached to this email. Open it to sync directly to Apple Calendar, Microsoft Outlook, or Google Calendar.
        </p>
      </div>
    `,
    attachments: [
      {
        filename: `frea-mentoring-${booking.mentorId}.ics`,
        content: icsContent,
        contentType: 'text/calendar; charset=utf-8; method=REQUEST',
      },
    ],
  };

  const info = await mailer.sendMail(mailOptions);
  let previewUrl = null;
  try {
    previewUrl = nodemailer.getTestMessageUrl(info);
  } catch (e) {}

  return {
    messageId: info.messageId,
    previewUrl: previewUrl || null,
  };
}
