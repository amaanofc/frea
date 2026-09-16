// ─────────────────────────────────────────────
// frea — Express API Server
// ─────────────────────────────────────────────

import express from 'express';
import cors from 'cors';
import {
  getAllMentors,
  getMentorById,
  getMonthlySlotsForMentor,
  createBooking,
  createMentorApplication,
  getStats
} from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'frea-api', time: new Date().toISOString() });
});

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

// GET /api/mentors/:id/slots — Dynamic monthly calendar slots
app.get('/api/mentors/:id/slots', (req, res) => {
  try {
    let year = req.query.year;
    let month = req.query.month;

    // Support format: month=2026-09 or year=2026&month=9
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

// POST /api/bookings — Book a 20-minute session
app.post('/api/bookings', (req, res) => {
  try {
    const { mentorId, studentEmail, date, time } = req.body;
    if (!mentorId || !studentEmail || !date || !time) {
      return res.status(400).json({
        success: false,
        error: 'Missing required booking fields: mentorId, studentEmail, date, time'
      });
    }

    const booking = createBooking({ mentorId, studentEmail, date, time });
    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: booking
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

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
  console.log(`[frea backend] 🚀 Server running on http://localhost:${PORT}`);
});
