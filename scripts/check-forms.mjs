#!/usr/bin/env node
/**
 * Reports listings the app calls bookable whose booking page says otherwise.
 *
 * The third kind of rot, after `check:links` (the URL dies) and `check:dates`
 * (the round expires). This one is the hardest to see from the outside: the
 * link works, the dates are still ahead, and the card is green — but the form
 * on the far side answers "Formuläret är just nu stängt. Antingen har det inte
 * öppnat eller så har vi redan har fått in det maximala antalet ansökningar."
 *
 * It is not a rare edge. Several providers run first-come-first-served rounds
 * where the seats go in minutes: JENSEN opens a Typeform at 11:00 and it shuts
 * itself when it hits the cap, Iris and Medlearn sell seats as a webshop
 * product that flips to "slut i lager". Nothing on their information pages
 * changes when that happens, so the only place the truth exists is the booking
 * page itself — which is exactly the page the dataset never re-reads.
 *
 *   npm run check:forms          probe the bookable listings
 *   npm run check:forms -- --all also list the ones that answered fine
 *
 * A hit means the listing wants `full: true` (or a moved period). Set it from
 * the provider's own wording, per the rule in README — this script finds the
 * candidates, it does not get to edit the dataset.
 *
 * Deliberately not part of `npm test`: it depends on ~85 external sites and on
 * what day it is, the same reasons `check:links` and `check:dates` stay out.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'src/data/exams.ts');

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const TIMEOUT_MS = 25_000;
const CONCURRENCY = 4;
const showAll = process.argv.includes('--all');

/**
 * What "this form is shut" looks like in the wild.
 *
 * Typeform states it as data, which is the reliable one. The webshops only say
 * it in prose, so those patterns are deliberately narrow — "slut i lager" as a
 * bare phrase also appears on unrelated products further down a page, and a
 * sweep that cries wolf gets ignored, which is worse than not running it.
 */
const CLOSED_MARKERS = [
  [/"isFormClosed"\s*:\s*true/i, 'Typeform: isFormClosed = true'],
  [/Formuläret är (just nu )?stängt/i, '"Formuläret är stängt"'],
  [/accepterar inte nya svar|not accepting (new )?responses/i, '"accepterar inte nya svar"'],
  [/slut i lager|utsålt|out of stock/i, '"slut i lager"'],
];

/**
 * Read the listings out of the source text rather than importing it, for the
 * same reason the other two scripts do: no build step and no TS runtime to
 * keep in sync.
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
    const url = block.match(/^ {4}registrationUrl:\s*\n?\s*'([^']+)'/m)?.[1];
    if (!url) continue;
    if (!/^ {4}nextPeriod: \{/m.test(block)) {
      if (/^ {4}nextPeriod:/m.test(block)) unreadable.push({ id, school });
      continue;
    }
    const period = block.match(/^ {4}nextPeriod: \{([\s\S]*?)^ {4}\},/m)?.[1] ?? '';
    const field = (name) => period.match(new RegExp(`${name}: '([\\d-]+)'`))?.[1];
    listings.push({
      id,
      school,
      url,
      confirmed: /confirmed: true/.test(period),
      full: /full: true/.test(period),
      applicationStart: field('applicationStart'),
      applicationEnd: field('applicationEnd'),
    });
  }
  return { listings, unreadable };
}

/**
 * Only the listings the app presents as bookable *today*.
 *
 * A round that hasn't opened yet is the important exclusion: a webshop product
 * that goes on sale on the anmälningsdag reads "slut i lager" for every day
 * before it, and flagging that would be reporting the app's own correct
 * "Öppnar 27 aug." as a bug. A closed form only contradicts the app when the
 * app is claiming you can book right now.
 */
function isClaimedOpen(l, today) {
  if (l.full) return false;
  if (!l.confirmed) return false;
  if (!l.applicationStart && !l.applicationEnd) return false;
  if (l.applicationStart && today < l.applicationStart) return false;
  if (l.applicationEnd && today > l.applicationEnd) return false;
  return true;
}

async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA, 'accept-language': 'sv-SE,sv;q=0.9' },
      redirect: 'follow',
      signal: controller.signal,
    });
    if (!res.ok) return { unreachable: `HTTP ${res.status}` };
    const html = await res.text();
    const hit = CLOSED_MARKERS.find(([re]) => re.test(html));
    return hit ? { closed: hit[1] } : { open: true };
  } catch (err) {
    return { unreachable: err.name === 'AbortError' ? 'timeout' : err.message };
  } finally {
    clearTimeout(timer);
  }
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
      }
    }),
  );
  return results;
}

const TODAY = new Date().toISOString().slice(0, 10);
const { listings, unreadable } = collectListings();
const claimedOpen = listings.filter((l) => isClaimedOpen(l, TODAY));

// One request per URL: several listings share a booking page (JENSEN puts
// three courses behind one Typeform), and asking four times would be four
// chances to trip a rate limiter for one answer.
const byUrl = new Map();
for (const l of claimedOpen) {
  if (!byUrl.has(l.url)) byUrl.set(l.url, []);
  byUrl.get(l.url).push(l);
}
const urls = [...byUrl.keys()];

console.log(
  `Sonderar ${urls.length} bokningslänkar från ${claimedOpen.length} listningar som appen säger går att boka i dag (${TODAY}).`,
);
if (unreadable.length) {
  console.log(
    `⃠ ${unreadable.length} bygger sin period i kod och kan inte läsas ur källtexten: ` +
      unreadable.map((l) => l.id).join(', '),
  );
}
console.log('');

/**
 * Same backoff the link sweep uses, and for the same reason.
 *
 * A booking page that answers 503 or 500 tells us nothing about whether the
 * form behind it is open, and "kunde inte läsas" is the least useful line this
 * report can print. Several of these hosts rate-limit over a window rather than
 * per request, so the answer is to wait rather than to give up: on 2026-08-21
 * five URLs came back unreachable here and every one of them served 200 by hand
 * a minute later.
 *
 * Only the unreachable ones are re-asked. A page that answered is a page we
 * have read, and asking it twice would just be two chances to be throttled.
 */
const RETRY_ROUNDS = [
  { before: 5_000, between: 2_000 },
  { before: 30_000, between: 3_000 },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const results = await mapLimit(urls, CONCURRENCY, probe);

let stragglers = urls.filter((_, i) => results[i].unreachable);
for (const [round, { before, between }] of RETRY_ROUNDS.entries()) {
  if (!stragglers.length) break;
  console.log(
    `↻ ${stragglers.length} svarade inte — väntar ${before / 1000} s och frågar igen ` +
      `(omgång ${round + 1} av ${RETRY_ROUNDS.length})…\n`,
  );
  await sleep(before);
  const next = [];
  for (const url of stragglers) {
    const again = await probe(url);
    if (again.unreachable) next.push(url);
    else results[urls.indexOf(url)] = again;
    await sleep(between);
  }
  stragglers = next;
}

const closed = [];
const unreached = [];
let openCount = 0;
urls.forEach((url, i) => {
  const r = results[i];
  if (r.closed) closed.push({ url, reason: r.closed, listings: byUrl.get(url) });
  else if (r.unreachable) unreached.push({ url, reason: r.unreachable });
  else openCount++;
});

if (closed.length) {
  console.log(
    `✗ ${closed.length} bokningssidor är stängda men listningarna säger "gå och boka":\n`,
  );
  for (const c of closed) {
    console.log(`   ${c.reason}`);
    console.log(`   ${c.url}`);
    for (const l of c.listings) console.log(`      ${l.id}  —  ${l.school}`);
    console.log('');
  }
  console.log(
    'Sätt full: true på de listningarna, eller flytta perioden, om anordnarens\n' +
      'egna ord bekräftar det. Skriptet hittar kandidater — det avgör inte datan.\n',
  );
}

if (unreached.length) {
  console.log(`⃠ ${unreached.length} gick inte att läsa (värden blockerar eller svarar inte):`);
  for (const u of unreached) console.log(`   [${u.reason}] ${u.url}`);
  console.log('');
}

if (showAll) {
  console.log(`✓ ${openCount} svarade som öppna.`);
}

console.log(`${openCount} öppna · ${closed.length} stängda · ${unreached.length} okontrollerbara.`);
process.exit(closed.length > 0 ? 1 : 0);
