// ─────────────────────────────────────────────
// frea — per-route metadata
// ─────────────────────────────────────────────
//
// A single-page app serves one HTML document, so without this every route
// shares the landing page's title, description and canonical. Search engines
// then have nothing to distinguish a mentor profile from the homepage, and
// social shares of any page show the homepage preview.
//
// The origin is read from wherever the app is actually served, so nothing here
// hardcodes a domain — the same build works on localhost and in production.

const SITE_NAME = 'frea';
const DEFAULT_DESCRIPTION =
  'Book a free 20-minute 1-on-1 with a senior UK university student who has already '
  + 'done what you are trying to do. Free for verified UK university students.';

/** Absolute URL for a path, based on where this page is actually served. */
export function absoluteUrl(path = '/') {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${path.startsWith('/') ? path : '/' + path}`;
}

/**
 * Metadata for a route. Dynamic routes (a mentor, a resource) pass the record
 * so the title can name the actual person or document.
 */
export function metaForRoute(path, context = {}) {
  const clean = (path || '/').split('?')[0];

  if (clean.startsWith('/mentor/')) {
    const m = context.mentor;
    if (m) {
      const helps = (m.helpsWith || []).slice(0, 3).join(', ');
      return {
        title: `${m.name} — ${m.major} at ${m.university} · ${SITE_NAME}`,
        description: (m.bio || '').slice(0, 155)
          || `Book a free 20-minute chat with ${m.name}, ${m.year} ${m.major} at ${m.university}`
            + (helps ? `. Helps with ${helps}.` : '.'),
        type: 'profile'
      };
    }
    return { title: `Mentor · ${SITE_NAME}`, description: DEFAULT_DESCRIPTION };
  }

  const ROUTES = {
    '/': {
      title: 'frea — free peer mentoring for UK university students',
      description: DEFAULT_DESCRIPTION
    },
    '/browse': {
      title: 'Find a senior mentor at your university · frea',
      description:
        'Browse verified senior students across UK universities. Filter by course, '
        + 'university and what you need help with, then book a free 20-minute call.'
    },
    '/resources': {
      title: 'Freabies & playbooks — free study resources by UK students · frea',
      description:
        'Revision guides, CV templates, past-paper walkthroughs and interview prep, '
        + 'written by senior students who actually sat the exams. Most are free.'
    },
    '/become-a-mentor': {
      title: 'Become a mentor — share what you learned · frea',
      description:
        'Sign in through your university and your profile goes live immediately. No interview. '
        + 'Set your own availability, publish resources, keep 95% of anything you sell.'
    },
    '/my-space': {
      title: 'My space · frea',
      description: 'Your mentoring sessions and obtained freabies and playbooks.',
      noindex: true
    },
    '/my-sessions': {
      title: 'My space · frea',
      description: 'Your mentoring sessions and obtained freabies and playbooks.',
      noindex: true
    },
    '/mentor-dashboard': {
      title: 'Mentor portal · frea',
      description: 'Manage your availability, profile, resources and payouts.',
      noindex: true
    },
    '/admin': { title: 'Admin · frea', description: '', noindex: true },
    '/sign-in': { title: 'Sign in · frea', description: '', noindex: true },
    '/verify': { title: 'Verify your email · frea', description: '', noindex: true },
    '/cancel': { title: 'Cancel session · frea', description: '', noindex: true },
    '/checkout-complete': { title: 'Order complete · frea', description: '', noindex: true }
  };

  // Aliases that render the same page.
  if (clean === '/docs' || clean === '/freabies') return ROUTES['/resources'];

  return ROUTES[clean] || ROUTES['/'];
}

/** Routes worth indexing. Anything personal or transactional is excluded. */
export const INDEXABLE_ROUTES = ['/', '/browse', '/resources', '/become-a-mentor'];

function setTag(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
    const match = selector.match(/\[(?:name|property|rel)="([^"]+)"\]/);
    if (match) {
      if (selector.startsWith('link')) el.setAttribute('rel', match[1]);
      else if (selector.includes('property=')) el.setAttribute('property', match[1]);
      else el.setAttribute('name', match[1]);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

/** Applies a route's metadata to the document. Call on every navigation. */
export function applyRouteMeta(path, context = {}) {
  if (typeof document === 'undefined') return;

  const meta = metaForRoute(path, context);
  const url = absoluteUrl(path.split('?')[0]);

  document.title = meta.title;
  setTag('meta[name="description"]', 'content', meta.description);
  setTag('link[rel="canonical"]', 'href', url);

  setTag('meta[property="og:title"]', 'content', meta.title);
  setTag('meta[property="og:description"]', 'content', meta.description);
  setTag('meta[property="og:url"]', 'content', url);
  setTag('meta[property="og:type"]', 'content', meta.type === 'profile' ? 'profile' : 'website');

  setTag('meta[name="twitter:title"]', 'content', meta.title);
  setTag('meta[name="twitter:description"]', 'content', meta.description);

  // Keep personal and transactional pages out of the index entirely.
  const robots = document.head.querySelector('meta[name="robots"]');
  if (meta.noindex) {
    setTag('meta[name="robots"]', 'content', 'noindex, nofollow');
  } else if (robots) {
    robots.setAttribute('content', 'index, follow');
  }

  applyStructuredData(path, context, meta);
}

/**
 * Per-page JSON-LD. The static graph in index.html describes the organisation;
 * this adds the specific thing on the page, which is what earns rich results.
 */
function applyStructuredData(path, context, meta) {
  const existing = document.getElementById('route-jsonld');
  if (existing) existing.remove();

  let data = null;
  const clean = (path || '/').split('?')[0];

  if (clean.startsWith('/mentor/') && context.mentor) {
    const m = context.mentor;
    data = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: m.name,
      description: m.bio || undefined,
      affiliation: { '@type': 'CollegeOrUniversity', name: m.university },
      knowsAbout: (m.helpsWith || []).length ? m.helpsWith : undefined,
      url: absoluteUrl(clean),
      makesOffer: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'GBP',
        itemOffered: {
          '@type': 'Service',
          name: '20-minute 1-on-1 peer mentoring call',
          provider: { '@type': 'Person', name: m.name }
        }
      }
    };
  } else if (clean === '/browse') {
    const mentors = (context.mentors || []).slice(0, 20);
    if (mentors.length) {
      data = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Senior student mentors on frea',
        numberOfItems: mentors.length,
        itemListElement: mentors.map((m, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: absoluteUrl(`/mentor/${m.id}`),
          name: `${m.name} — ${m.major}, ${m.university}`
        }))
      };
    }
  } else if (clean === '/resources' || clean === '/docs' || clean === '/freabies') {
    const docs = (context.docs || []).slice(0, 20);
    if (docs.length) {
      data = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Study resources shared by UK students',
        numberOfItems: docs.length,
        itemListElement: docs.map((d, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: d.title,
          item: {
            '@type': 'LearningResource',
            name: d.title,
            description: d.subtitle || undefined,
            author: { '@type': 'Person', name: d.mentorName },
            learningResourceType: 'Study guide',
            isAccessibleForFree: d.type !== 'paid'
          }
        }))
      };
    }
  }

  if (!data) return;

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'route-jsonld';
  script.textContent = JSON.stringify(data, (k, v) => (v === undefined ? undefined : v));
  document.head.appendChild(script);
}
