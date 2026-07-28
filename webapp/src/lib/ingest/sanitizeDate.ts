// Upstream APIs (arXiv, CORE, CrossRef, OpenAlex) occasionally carry bad
// metadata — unparsable strings, or dates decades in the future/past due to
// publisher typos. Reject anything that couldn't plausibly be a real
// publication date rather than showing it to users.
const MIN_YEAR = 1900;
const FUTURE_SLACK_DAYS = 30;

export function sanitizeDate(iso: string | null | undefined): string | null {
  if (!iso) return null;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  if (date.getUTCFullYear() < MIN_YEAR) return null;

  const maxAllowed = new Date();
  maxAllowed.setUTCDate(maxAllowed.getUTCDate() + FUTURE_SLACK_DAYS);
  if (date > maxAllowed) return null;

  return iso;
}
