// ─────────────────────────────────────────────
// frea — Growth Engine & Event Tracking
// ─────────────────────────────────────────────

const STORAGE_KEY = 'frea_growth_events';
const METRICS_KEY = 'frea_growth_metrics';

// Initialize growth analytics
export function initAnalytics() {
  if (!localStorage.getItem(METRICS_KEY)) {
    localStorage.setItem(METRICS_KEY, JSON.stringify({
      visits: 1,
      firstSeen: new Date().toISOString(),
      bookingsCompleted: 0,
      mentorApplications: 0,
      filtersUsed: 0
    }));
  } else {
    try {
      const metrics = JSON.parse(localStorage.getItem(METRICS_KEY));
      metrics.visits = (metrics.visits || 0) + 1;
      localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
    } catch (e) {
      console.warn('Analytics parse error', e);
    }
  }
}

// Track custom event with properties
export function trackEvent(eventName, properties = {}) {
  const event = {
    event: eventName,
    properties,
    timestamp: new Date().toISOString(),
    url: window.location.hash || '#/',
    referrer: document.referrer || 'direct'
  };

  try {
    // Local persistence
    const events = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    events.push(event);
    // Keep last 150 events locally
    if (events.length > 150) events.shift();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));

    // Update aggregate metrics
    const metrics = JSON.parse(localStorage.getItem(METRICS_KEY) || '{}');
    if (eventName === 'booking_completed') {
      metrics.bookingsCompleted = (metrics.bookingsCompleted || 0) + 1;
    } else if (eventName === 'mentor_application_submitted') {
      metrics.mentorApplications = (metrics.mentorApplications || 0) + 1;
    } else if (eventName === 'filter_applied') {
      metrics.filtersUsed = (metrics.filtersUsed || 0) + 1;
    }
    localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));

    // Console logging in dev mode
    console.log(`[frea growth 📈] ${eventName}`, properties);

    // If external trackers like Plausible or Google Analytics are installed on window:
    if (window.plausible) {
      window.plausible(eventName, { props: properties });
    }
    if (window.gtag) {
      window.gtag('event', eventName, properties);
    }
  } catch (err) {
    console.warn('[frea analytics error]', err);
  }
}

// Get aggregate metrics for admin or growth debugging
export function getGrowthMetrics() {
  try {
    return JSON.parse(localStorage.getItem(METRICS_KEY) || '{}');
  } catch (e) {
    return {};
  }
}
