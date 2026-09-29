// ─────────────────────────────────────────────
// frea — output escaping
// ─────────────────────────────────────────────
//
// The front end builds markup as HTML strings and assigns innerHTML, so every
// interpolation of user text has to be escaped at the sink. These two live in
// their own module because more than one renderer needs them: avatars.js used
// to interpolate a mentor-supplied photo URL into an <img src> with no escape
// at all, and a second copy of this function is exactly how that drifts apart
// again.

export function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * A value destined for a JS string literal inside an HTML attribute, e.g.
 * onclick="fn(${jsArg(name)})". Both escapes are required and the order
 * matters — escapeHtml on its own renders ' as &#39;, which the HTML parser
 * decodes back to ' before the JS is parsed, reopening the literal.
 * Returns its own quotes; do not add more.
 */
export function jsArg(value) {
  return escapeHtml(JSON.stringify(String(value == null ? '' : value)));
}
