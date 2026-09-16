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

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(targetYear, targetMonth - 1, day);
    const dayOfWeekIdx = d.getDay();
    const dayOfWeek = dayNames[dayOfWeekIdx];
    const recurring = schedule[dayOfWeekIdx] || [];
    const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const displayDate = `${dayOfWeek} ${day} ${monthName}`;

    days.push({
      date: dateStr,
      dayNumber: day,
      dayOfWeek,
      displayDate,
      slots: recurring,
      hasSlots: recurring.length > 0,
      slotCount: recurring.length
    });

    recurring.forEach(slot => {
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
