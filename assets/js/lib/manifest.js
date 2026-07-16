// Event manifest handling: validation (FR-005 — a broken entry never takes
// down the index) and the Upcoming/Past split (FR-018).

const ID_RE = /^[a-z0-9-]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{1,2}:\d{2}$/;
const MODES = ['brevet', 'pace'];

// Reason an entry is invalid, or null when it is usable.
export function entryProblem(entry) {
  if (!entry || typeof entry !== 'object') return 'not an object';
  if (typeof entry.id !== 'string' || !ID_RE.test(entry.id)) return 'bad id';
  if (typeof entry.name !== 'string' || entry.name.trim() === '') return 'missing name';
  if (typeof entry.gpx !== 'string' || entry.gpx.trim() === '') return 'missing gpx';
  if (typeof entry.date !== 'string' || !DATE_RE.test(entry.date)) return 'bad date';
  if (typeof entry.start !== 'string' || !TIME_RE.test(entry.start)) return 'bad start';
  if (!MODES.includes(entry.mode)) return 'bad mode';
  return null;
}

// Keep valid entries; report skipped ones via onSkip(entry, problem).
export function validEvents(manifest, onSkip = () => {}) {
  const events = manifest && Array.isArray(manifest.events) ? manifest.events : [];
  return events.filter((entry) => {
    const problem = entryProblem(entry);
    if (problem) onSkip(entry, problem);
    return !problem;
  });
}

// Split by event-local date: past = strictly before today; an event on
// today's date is still upcoming/in progress (spec edge case). Both groups
// newest date first (FR-018). `todayByZone(tz)` supplies today's YYYY-MM-DD
// in an IANA timezone so the split respects each event's timezone.
export function splitEvents(events, todayByZone) {
  const byDateDesc = (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id);
  const upcoming = [];
  const past = [];
  for (const e of events) {
    (e.date < todayByZone(e.timezone) ? past : upcoming).push(e);
  }
  upcoming.sort(byDateDesc);
  past.sort(byDateDesc);
  return { upcoming, past };
}
