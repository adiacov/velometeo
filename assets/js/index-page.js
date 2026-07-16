// Index page controller: manifest → validated events → Upcoming/Past lists.
import { validEvents, splitEvents } from './lib/manifest.js';
import { nowInTimeZone } from './lib/weather-api.js';
import { initI18n, t } from './i18n.js';

const DEFAULT_TIMEZONE = 'Europe/Chisinau';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}

function listHtml(events) {
  return `<ul class="event-list">${events
    .map((e) => `<li><a class="event-link" href="event.html?event=${encodeURIComponent(e.id)}">
      <b>${escapeHtml(e.name)}</b><span class="event-date">${escapeHtml(e.date)}</span></a></li>`)
    .join('')}</ul>`;
}

async function main() {
  await initI18n();

  const container = document.querySelector('[data-events]');
  let manifest = null;
  try {
    const res = await fetch('routes/index.json');
    if (!res.ok) throw new Error(String(res.status));
    manifest = await res.json();
  } catch (err) {
    console.warn('velometeo: cannot load event manifest', err);
  }

  const events = validEvents(manifest, (entry, problem) => {
    console.warn(`velometeo: skipping manifest entry (${problem})`, entry);
  });

  if (events.length === 0) {
    container.innerHTML = `<div class="note">${escapeHtml(t('index.empty'))}</div>`;
    return;
  }

  const { upcoming, past } = splitEvents(events, (tz) => nowInTimeZone(tz || DEFAULT_TIMEZONE).date);

  // Empty groups are hidden rather than shown as empty headings (CHK024).
  container.innerHTML = [
    upcoming.length ? `<section class="section"><h2>${escapeHtml(t('index.upcoming'))}</h2>${listHtml(upcoming)}</section>` : '',
    past.length ? `<section class="section"><h2>${escapeHtml(t('index.past'))}</h2>${listHtml(past)}</section>` : '',
  ].join('');
}

main().catch((err) => {
  console.error('velometeo: unexpected failure', err);
});
