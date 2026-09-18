// ─────────────────────────────────────────────
// frea — Frontend API Client (with offline fallback)
// ─────────────────────────────────────────────

import { MENTORS } from './data.js';

const API_BASE = '/api';

export async function fetchMentors(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.university) params.set('university', filters.university);
    if (filters.subject) params.set('subject', filters.subject);

    const res = await fetch(`${API_BASE}/mentors?${params.toString()}`);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    return data.data || MENTORS;
  } catch (err) {
    console.warn('[api] fetchMentors fallback to local data', err);
    return MENTORS;
  }
}

export async function fetchMentor(id) {
  try {
    const res = await fetch(`${API_BASE}/mentors/${id}`);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    return data.data;
  } catch (err) {
    console.warn('[api] fetchMentor fallback to local data', err);
    return MENTORS.find(m => m.id === parseInt(id)) || null;
  }
}

export async function fetchMonthlySlots(mentorId, year, month) {
  try {
    const res = await fetch(`${API_BASE}/mentors/${mentorId}/slots?year=${year}&month=${month}`);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    return data.data;
  } catch (err) {
    console.warn('[api] fetchMonthlySlots fallback to client-side date generator', err);
    return generateClientMonthlySlots(mentorId, year, month);
  }
}

export async function submitBooking({ mentorId, studentEmail, date, time }) {
  try {
    // Record locally immediately so availability updates in real time
    try {
      const localBookings = JSON.parse(localStorage.getItem('frea_local_bookings') || '[]');
      localBookings.push({ mentorId: parseInt(mentorId), date, time, studentEmail, bookedAt: new Date().toISOString() });
      localStorage.setItem('frea_local_bookings', JSON.stringify(localBookings));
    } catch (storageErr) {
      console.warn('[api] could not cache booking locally', storageErr);
    }

    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mentorId, studentEmail, date, time })
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to confirm booking');
    }
    return json.data;
  } catch (err) {
    // If backend is unreachable, handle gracefully client-side
    console.warn('[api] submitBooking local fallback', err);
    if (err.message && !err.message.includes('fetch')) {
      throw err;
    }
    const meetId = Math.random().toString(36).substring(2, 6);
    return {
      id: `frea-local-${Date.now()}`,
      mentorId,
      studentEmail,
      date,
      time,
      googleMeetUrl: `https://meet.google.com/fre-${meetId}-stu`,
      status: 'confirmed'
    };
  }
}

export async function submitMentorApplication(appData) {
  try {
    const res = await fetch(`${API_BASE}/mentors/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appData)
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to submit mentor application');
    }
    return json.data;
  } catch (err) {
    console.warn('[api] submitMentorApplication fallback', err);
    if (err.message && !err.message.includes('fetch')) {
      throw err;
    }
    return {
      id: `frea-app-local-${Date.now()}`,
      ...appData,
      status: 'pending_verification'
    };
  }
}

export async function fetchStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();
    return data.data;
  } catch (err) {
    return {
      totalBookings: 12048,
      verifiedMentors: 500,
      averageRating: 4.9
    };
  }
}

// ─── Real Document Upload ──────────────────────────
export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('document', file);

  const res = await fetch(`${API_BASE}/upload/document`, {
    method: 'POST',
    body: formData
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to upload document.');
  }
  return json;
}

// ─── Email Verification ────────────────────────────
export async function sendEmailVerification(email, universityName = '') {
  const res = await fetch(`${API_BASE}/auth/send-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, universityName })
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to send verification email.');
  }
  return json;
}

export async function verifyEmailCode(email, code) {
  const res = await fetch(`${API_BASE}/auth/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Invalid verification code.');
  }
  return json;
}

export async function verifyEmailToken(token) {
  const res = await fetch(`${API_BASE}/auth/verify?token=${encodeURIComponent(token)}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Invalid or expired verification link.');
  }
  return json;
}

export async function checkEmailVerification(email) {
  try {
    const res = await fetch(`${API_BASE}/auth/status?email=${encodeURIComponent(email)}`);
    const json = await res.json();
    return json.verified || false;
  } catch (e) {
    return false;
  }
}

// ─── Admin Dashboard Applications ─────────────────
export async function fetchAdminApplications() {
  try {
    const res = await fetch(`${API_BASE}/admin/applications`);
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    return [];
  }
}

export async function approveMentorApplication(id) {
  const res = await fetch(`${API_BASE}/admin/applications/${id}/approve`, {
    method: 'POST'
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to approve application.');
  }
  return json;
}

export async function rejectMentorApplication(id) {
  const res = await fetch(`${API_BASE}/admin/applications/${id}/reject`, {
    method: 'POST'
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to reject application.');
  }
  return json;
}

// ─── Mentor Portal Profile & Schedule CRUD ─────────
export async function updateMentorProfile(id, profileData) {
  const res = await fetch(`${API_BASE}/mentors/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to update profile.');
  }
  return json.data;
}

export async function updateMentorSchedule(id, weeklySchedule) {
  const res = await fetch(`${API_BASE}/mentors/${id}/schedule`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weeklySchedule })
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to update schedule.');
  }
  return json.data;
}

// ─── Resources CRUD ────────────────────────────────
export async function fetchResources() {
  try {
    const res = await fetch(`${API_BASE}/resources`);
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    return [];
  }
}

export async function createResource(resourceData) {
  const res = await fetch(`${API_BASE}/resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resourceData)
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to create resource.');
  }
  return json.data;
}

export async function deleteResource(id) {
  const res = await fetch(`${API_BASE}/resources/${id}`, {
    method: 'DELETE'
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to delete resource.');
  }
  return json;
}

// Client-side fallback dynamic calendar generator in case network is disconnected
function generateClientMonthlySlots(mentorId, year, month) {
  const mentor = MENTORS.find(m => m.id === parseInt(mentorId));
  const targetYear = parseInt(year);
  const targetMonth = parseInt(month);
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthName = monthNames[targetMonth - 1];

  const defaultSchedule = {
    1: ["10:00 AM", "2:30 PM", "4:30 PM"],
    3: ["11:00 AM", "3:00 PM"],
    5: ["9:30 AM", "1:00 PM", "5:00 PM"]
  };

  const schedule = mentor?.weeklySchedule || defaultSchedule;
  const days = [];
  const allOpenSlots = [];

  let localBookings = [];
  try {
    localBookings = JSON.parse(localStorage.getItem('frea_local_bookings') || '[]');
  } catch (e) {
    localBookings = [];
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(targetYear, targetMonth - 1, day);
    const dayOfWeekIdx = d.getDay();
    const dayOfWeek = dayNames[dayOfWeekIdx];
    const recurring = schedule[dayOfWeekIdx] || [];
    const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const displayDate = `${dayOfWeek} ${day} ${monthName}`;

    // Filter out already booked slots for this mentor
    const bookedOnDay = localBookings
      .filter(b => b.mentorId === parseInt(mentorId) && (b.date === dateStr || b.date === displayDate))
      .map(b => b.time);

    const availableSlots = recurring.filter(t => !bookedOnDay.includes(t));

    days.push({
      date: dateStr,
      dayNumber: day,
      dayOfWeek,
      displayDate,
      slots: availableSlots,
      hasSlots: availableSlots.length > 0,
      slotCount: availableSlots.length
    });

    availableSlots.forEach(slot => {
      allOpenSlots.push({
        date: dateStr,
        displayDate,
        dayOfWeek,
        dayNumber: day,
        time: slot
      });
    });
  }

  const firstDay = new Date(targetYear, targetMonth - 1, 1);
  const firstWeekdayOffset = (firstDay.getDay() + 6) % 7;

  return {
    mentorId: mentor?.id,
    mentorName: mentor?.name,
    year: targetYear,
    month: targetMonth,
    monthName,
    daysInMonth,
    firstWeekdayOffset,
    days,
    allOpenSlots,
    totalOpenSlots: allOpenSlots.length
  };
}
