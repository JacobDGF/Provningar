#!/usr/bin/env node
/**
 * Reports listings whose published round has run out.
 *
 * `check:links` catches a URL that dies. This catches the other half of the
 * same rot, which is quieter and more common: the link still works, the page
 * still loads, and the dates the app shows belong to a round that closed weeks
 * ago. Nobody notices, because a listing looks exactly as healthy the day after
 * its deadline as the day before.
 *
 *   npm run check:dates                 what has expired as of today
 *   npm run check:dates -- --soon       also what expires within 21 days
 *   npm run check:dates -- --on 2026-12-01   pretend it is that date
 *
 * Deliberately not part of `npm test`: it depends on today's date, so wiring it
 * into CI would turn main red on a Tuesday morning for reasons no commit
 * caused. It is the thing to run before touching the dataset — the exit code is
 * non-zero when something has expired, so it also works as a cron.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'src/data/exams.ts');

const SOON_DAYS = 21;
const showSoon = process.argv.includes('--soon');
const onIndex = process.argv.indexOf('--on');
const TODAY = onIndex !== -1 ? process.argv[onIndex + 1] : new Date().toISOString().slice(0, 10);

if (!/^\d{4}-\d{2}-\d{2}$/.test(TODAY)) {
  console.error(`Ogiltigt datum: ${TODAY}. Använd --on YYYY-MM-DD.`);
  process.exit(2);
}

/**
 * Reads the listings out of the source text rather than importing it, for the
 * same reason `check-links.mjs` does: no build step and no TS runtime to keep
 * in sync. Each entry is one `{ … }` block at the array's top level, so
 * splitting on the four-space `id:` line is enough to isolate them.
 */
function collectListings() {
  const src = readFileSync(SOURCE, 'utf8');
  const blocks = src.split(/\n {2}\{\n/).slice(1);
  const listings = [];
  const unreadable = [];
  for (const block of blocks) {
    const id = block.match(/^ {4}id: '([^']+)'/m)?.[1];
    if (!id) continue;
    const school = block.match(/^ {4}schoolName: '([^']+)'/m)?.[1] ?? id;
    // A few listings build their period from a helper rather than writing the
    // object out. Reading text can't follow a function call, and quietly
    // skipping them would make this report say "allt är i sin ordning" about
    // listings it never looked at — so they get named instead.
    if (!/^ {4}nextPeriod: \{/m.test(block)) {
      if (/^ {4}nextPeriod:/m.test(block)) unreadable.push({ id, school });
      continue;
    }
    const period = block.match(/^ {4}nextPeriod: \{([\s\S]*?)^ {4}\},/m)?.[1] ?? '';
    if (!/confirmed: true/.test(period)) continue;
    const field = (name) => period.match(new RegExp(`${name}: '([\\d-]+)'`))?.[1];
    listings.push({
      id,
      school,
      applicationEnd: field('applicationEnd'),
      examWindowEnd: field('examWindowEnd') ?? field('examWindowStart'),
      full: /full: true/.test(period),
    });
  }
  return { listings, unreadable };
}

function daysBetween(from, to) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
}

const { listings, unreadable } = collectListings();
const expired = [];
const closed = [];
const soon = [];

for (const l of listings) {
  // Two different states, and the difference matters to whoever fixes it. A
  // round where everything is behind us is dead data. A round where the
  // application closed but the exam is still ahead is a round in progress —
  // the app labels it correctly either way, but only the second one might come
  // back with a later round on the same page.
  const last = l.examWindowEnd ?? l.applicationEnd;
  if (last && last < TODAY) {
    expired.push({ ...l, days: daysBetween(last, TODAY), on: last });
  } else if (l.applicationEnd && l.applicationEnd < TODAY) {
    closed.push({ ...l, days: daysBetween(l.applicationEnd, TODAY), on: l.applicationEnd });
  } else if (l.applicationEnd && daysBetween(TODAY, l.applicationEnd) <= SOON_DAYS) {
    soon.push({ ...l, days: daysBetween(TODAY, l.applicationEnd), on: l.applicationEnd });
  }
}

expired.sort((a, b) => b.days - a.days);
closed.sort((a, b) => b.days - a.days);
soon.sort((a, b) => a.days - b.days);

const line = (l) =>
  `   ${String(l.days).padStart(3)} d sedan  ${l.on}  ${l.school}${l.full ? ' (fullbokad)' : ''}\n              ${l.id}`;

console.log(`Kontrollerar ${listings.length} listningar med bekräftad period, per ${TODAY}.`);
if (unreadable.length) {
  console.log(
    `⃠ ${unreadable.length} bygger sin period i kod och måste kontrolleras för hand: ` +
      unreadable.map((l) => l.id).join(', '),
  );
}
console.log('');

if (soon.length && showSoon) {
  console.log(`◷ ${soon.length} stänger inom ${SOON_DAYS} dagar:`);
  for (const l of soon) console.log(`   om ${String(l.days).padStart(2)} d  ${l.on}  ${l.school}`);
  console.log('');
}

if (!expired.length && !closed.length) {
  console.log('✓ Ingen listnings omgång har gått ut.');
  process.exit(0);
}

if (expired.length) {
  console.error(`✗ ${expired.length} listningar visar en omgång som är helt förbi:\n`);
  for (const l of expired) console.error(line(l));
  console.error('');
}

if (closed.length) {
  console.error(`◑ ${closed.length} har stängd anmälan men prövningen kvar:\n`);
  for (const l of closed) console.error(line(l));
  console.error('');
}

console.error(
  'Läs om anordnarens sida och flytta fram perioden. Publicerar de ingen ny,\n' +
    'sätt confirmed: false med en etikett som säger vad som gäller i stället —\n' +
    'appen hellre säger "se hos skolan" än visar ett datum som varit.',
);
process.exit(1);
