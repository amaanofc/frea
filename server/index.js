// ─────────────────────────────────────────────
// frea — Express API Server with Real Email, Storage & Admin/Mentor Portals
// ─────────────────────────────────────────────

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import multer from 'multer';

import {
  getAllMentors,
  getMentorById,
  getMonthlySlotsForMentor,
  createBooking,
  createMentorApplication,
  getStats,
  saveVerificationToken,
  verifyEmailCode,
  verifyEmailToken,
  isEmailVerified,
  getMentorApplications,
  approveMentorApplication,
  rejectMentorApplication,
  updateMentorProfile,
  updateMentorSchedule,
  getAllResources,
  createResource,
  deleteResource,
  loadDb
} from './db.js';

import { sendVerificationEmail, sendBookingConfirmationEmail } from './email.js';
import { generateICSContent } from './ics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ─── Static File Serving for Uploaded Digital Products ───
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'digital_products');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Safe File Upload Configuration (Strict Whitelist + 10MB Cap) ───
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.md', '.tex', '.pptx']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/markdown',
  'text/plain',
  'application/x-tex',
  'text/x-tex',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB hard limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new Error(`File type rejected. Only PDF, Markdown (.md), LaTeX (.tex), and PowerPoint (.pptx) are permitted. You uploaded: ${ext}`));
    }
    // Check MIME type with graceful fallback for plain text types
    const mime = (file.mimetype || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mime) && ext !== '.md' && ext !== '.tex') {
      return cb(new Error(`Security policy rejected MIME type: ${file.mimetype}`));
    }
    cb(null, true);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'frea-api', time: new Date().toISOString() });
});

// ─── Real File Upload Endpoint ──────────────────────────
app.post('/api/upload/document', (req, res) => {
  upload.single('document')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'File size exceeds the 10MB limit.' });
      }
      return res.status(400).json({ success: false, error: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file was uploaded.' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    let format = 'PDF';
    if (ext === '.md') format = 'Markdown';
    else if (ext === '.tex') format = 'LaTeX';
    else if (ext === '.pptx') format = 'PowerPoint';

    const fileUrl = `/uploads/digital_products/${req.file.filename}`;

    res.json({
      success: true,
      fileUrl,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      format
    });
  });
});

// ─── Real Email Verification Endpoints ──────────────────

// Send 6-digit OTP and 1-click verification link
app.post('/api/auth/send-verification', async (req, res) => {
  try {
    const { email, universityName } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.endsWith('.ac.uk')) {
      return res.status(400).json({
        success: false,
        error: 'A genuine UK university email ending in ".ac.uk" is required (e.g. s123456@ed.ac.uk, user@ox.ac.uk).'
      });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    saveVerificationToken({ email: cleanEmail, token, code, expiresAt });

    // Send real email in background
    let emailResult = null;
    try {
      emailResult = await sendVerificationEmail({ email: cleanEmail, code, token, universityName });
    } catch (mailErr) {
      console.warn('[auth] Could not send verification email via mailer:', mailErr.message);
    }

    res.json({
      success: true,
      message: `Verification code and link sent to ${cleanEmail}`,
      email: cleanEmail,
      previewUrl: emailResult?.previewUrl || null,
      codePreview: code // Convenient for dev/testing when mail server isn't connected
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verify 6-digit OTP code
app.post('/api/auth/verify-code', (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'Email and verification code are required.' });
    }
    const result = verifyEmailCode(email, code);
    res.json({ success: true, verified: true, email: result.email });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Verify token from 1-click email link
app.get('/api/auth/verify', (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Missing verification token.' });
    }
    const result = verifyEmailToken(token);
    res.json({ success: true, verified: true, email: result.email });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Check if email is verified
app.get('/api/auth/status', (req, res) => {
  try {
    const email = req.query.email;
    const verified = email ? isEmailVerified(email) : false;
    res.json({ success: true, verified });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Mentors Endpoints ───────────────────────────────────

// GET /api/mentors — List mentors with optional filters
app.get('/api/mentors', (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      university: req.query.university,
      subject: req.query.subject
    };
    const mentors = getAllMentors(filters);
    res.json({ success: true, count: mentors.length, data: mentors });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/mentors/:id — Single mentor profile
app.get('/api/mentors/:id', (req, res) => {
  try {
    const mentor = getMentorById(req.params.id);
    if (!mentor) {
      return res.status(404).json({ success: false, error: 'Mentor not found' });
    }
    res.json({ success: true, data: mentor });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/mentors/:id — Update mentor profile (Mentor Portal)
app.put('/api/mentors/:id', (req, res) => {
  try {
    const updated = updateMentorProfile(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/mentors/:id/schedule — Update weekly schedule slots
app.put('/api/mentors/:id/schedule', (req, res) => {
  try {
    const updated = updateMentorSchedule(req.params.id, req.body.weeklySchedule);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/mentors/:id/slots — Dynamic monthly calendar slots
app.get('/api/mentors/:id/slots', (req, res) => {
  try {
    let year = req.query.year;
    let month = req.query.month;

    if (month && month.includes('-')) {
      const parts = month.split('-');
      year = parseInt(parts[0]);
      month = parseInt(parts[1]);
    } else {
      year = parseInt(year) || new Date().getFullYear();
      month = parseInt(month) || (new Date().getMonth() + 1);
    }

    const calendarData = getMonthlySlotsForMentor(req.params.id, year, month);
    if (!calendarData) {
      return res.status(404).json({ success: false, error: 'Mentor not found' });
    }

    res.json({ success: true, data: calendarData });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Bookings Endpoints with Real Calendar & Email ──────

// POST /api/bookings — Book a 20-minute session
app.post('/api/bookings', async (req, res) => {
  try {
    const { mentorId, studentEmail, date, time } = req.body;
    if (!mentorId || !studentEmail || !date || !time) {
      return res.status(400).json({
        success: false,
        error: 'Missing required booking fields: mentorId, studentEmail, date, time'
      });
    }

    const booking = createBooking({ mentorId, studentEmail, date, time });
    const mentor = getMentorById(mentorId);

    // Generate real RFC 5545 .ics calendar invite content
    let icsContent = '';
    if (mentor) {
      try {
        icsContent = generateICSContent({ booking, mentor });
        booking.icsDownloadUrl = `/api/bookings/${booking.id}/ics`;
      } catch (icsErr) {
        console.warn('[calendar] Could not generate .ics', icsErr);
      }

      // Send real email confirmation with attached .ics invite in background
      sendBookingConfirmationEmail({ booking, mentor, icsContent }).catch(err => {
        console.warn('[email] Booking confirmation email error:', err.message);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: booking
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/bookings/:id/ics — Download real .ics calendar invite
app.get('/api/bookings/:id/ics', (req, res) => {
  try {
    const bookingId = req.params.id;
    const db = loadDb();
    const booking = db.bookings.find(b => b.id === bookingId);
    if (!booking) {
      return res.status(404).send('Booking not found');
    }
    const mentor = getMentorById(booking.mentorId) || { name: booking.mentorName || 'Senior Mentor', major: 'Degree', university: 'UK University' };
    const icsContent = generateICSContent({ booking, mentor });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="frea-mentoring-${booking.mentorId}.ics"`);
    res.send(icsContent);
  } catch (err) {
    res.status(500).send('Error generating calendar file');
  }
});

// ─── Mentor Applications & Admin Dashboard ──────────────

// POST /api/mentors/apply — Senior mentor onboarding application
app.post('/api/mentors/apply', (req, res) => {
  try {
    const appData = req.body;
    if (!appData.name || !appData.university || !appData.email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required application fields: name, university, email'
      });
    }

    const application = createMentorApplication(appData);
    res.status(201).json({
      success: true,
      message: 'Mentor application received for verification',
      data: application
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/admin/applications — View all mentor applications
app.get('/api/admin/applications', (req, res) => {
  try {
    const applications = getMentorApplications();
    res.json({ success: true, count: applications.length, data: applications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/applications/:id/approve — Approve application & onboard to platform
app.post('/api/admin/applications/:id/approve', (req, res) => {
  try {
    const result = approveMentorApplication(req.params.id);
    res.json({
      success: true,
      message: `Mentor ${result.mentor.name} has been approved and onboarded to frea!`,
      data: result
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/admin/applications/:id/reject — Reject application
app.post('/api/admin/applications/:id/reject', (req, res) => {
  try {
    const application = rejectMentorApplication(req.params.id);
    res.json({ success: true, message: 'Application rejected', data: application });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── Resources / Freabies CRUD ──────────────────────────

// GET /api/resources — Retrieve all marketplace resources
app.get('/api/resources', (req, res) => {
  try {
    const resources = getAllResources();
    res.json({ success: true, count: resources.length, data: resources });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/resources — Publish new playbook or freabie
app.post('/api/resources', (req, res) => {
  try {
    const resource = createResource(req.body);
    res.status(201).json({ success: true, data: resource });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// DELETE /api/resources/:id — Delete resource
app.delete('/api/resources/:id', (req, res) => {
  try {
    const result = deleteResource(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/stats — Platform metrics
app.get('/api/stats', (req, res) => {
  try {
    const stats = getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[frea backend] Server running on http://localhost:${PORT}`);
});
