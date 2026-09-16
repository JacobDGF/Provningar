#!/usr/bin/env node
/**
 * Regenerates `src/lib/courseSystemIndex.ts` from Skolverket's own syllabus API.
 *
 * Every listing in the dataset belongs to one of two curricula — the Gy11
 * kursplan or the Gy25 ämnesplan — and picking the wrong one is an anmälan the
 * provider rejects. The app therefore has to know which, for every listing, and
 * the one place that knows for certain is Skolverket: each subject in the API
 * is labelled `SUBJECT_SYLLABUS` (Gy11) or `GRADE_SUBJECT_SYLLABUS` (Gy25), and
 * every course code hangs off a subject.
 *
 * The answer is written to a checked-in file rather than fetched at runtime, so
 * the app works offline and a reviewer can read the whole mapping in the diff.
 *
 *   npm run update:course-systems
 *
 * Codes the API does not know stay out of the file, and the app then says
 * nothing about that listing's system rather than guessing — see
 * `courseSystemOf` in src/lib/courseSystems.ts. That is the correct answer for
 * the grundläggande- and sfi-kurser (GRN…, SFI…), which belong to neither
 * curriculum, and for the "Varierar" rows that cover several courses at once.
 *
 * Behind a TLS-intercepting proxy, point Node at the bundle first:
 *
 *   NODE_EXTRA_CA_CERTS=/path/to/ca-bundle.crt npm run update:course-systems
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'src/data/exams.ts');
const TARGET = join(ROOT, 'src/lib/courseSystemIndex.ts');

const API = 'https://api.skolverket.se/syllabus/v1/subjects';
/** GY is the gymnasieskola's catalogue, VUXGY komvux's; the dataset holds both. */
const SCHOOL_TYPES = ['GY', 'VUXGY'];

async function fetchSubjects(schoolType) {
  const res = await fetch(`${API}?schooltype=${schoolType}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`${schoolType}: ${res.status} ${res.statusText}`);
  const body = await res.json();
  const subjects = body.subjects ?? body;
  if (!Array.isArray(subjects)) throw new Error(`${schoolType}: oväntat svar`);
  return subjects;
}

/**
 * Moderna språk and modersmål are one syllabus per language, but Skolverket
 * publishes the syllabus once with the language written as a placeholder —
 * `MODXXX01` in Gy11, a bare `MODO1000X` in Gy25 — while the providers append
 * or substitute the language code. Both rewrites below are Skolverket's own
 * convention, and each only counts when the rewritten code is itself a code the
 * API published; anything else falls through as unknown.
 */
function resolve(code, known) {
  if (known.has(code)) return known.get(code);
  // Gy25: MODO1000XSPA → MODO1000X. Three trailing letters after a level code.
  const gy25 = code.match(/^([A-ZÅÄÖ]+\d[A-Z0-9]*X)[A-ZÅÄÖ]{3}$/);
  if (gy25 && known.has(gy25[1])) return known.get(gy25[1]);
  // Gy11: MODSPA01 → MODXXX01. The language sits inside the code, not after it.
  const gy11 = code.match(/^MOD[A-ZÅÄÖ]{3}(\d{2})$/);
  if (gy11 && known.has(`MODXXX${gy11[1]}`)) return known.get(`MODXXX${gy11[1]}`);
  return undefined;
}

const known = new Map();
for (const schoolType of SCHOOL_TYPES) {
  for (const subject of await fetchSubjects(schoolType)) {
    const system = subject.typeOfSyllabus === 'GRADE_SUBJECT_SYLLABUS' ? 'gy25' : 'gy11';
    for (const course of subject.courses ?? []) {
      const seen = known.get(course.code);
      if (seen && seen !== system) {
        throw new Error(`${course.code} är både ${seen} och ${system} hos Skolverket`);
      }
      known.set(course.code, system);
    }
  }
}

const used = [
  ...new Set([...readFileSync(SOURCE, 'utf8').matchAll(/courseCode: '([^']*)'/g)].map((m) => m[1])),
].sort((a, b) => a.localeCompare(b, 'sv'));

const resolved = [];
const unresolved = [];
for (const code of used) {
  const system = resolve(code, known);
  if (system) resolved.push([code, system]);
  else unresolved.push(code);
}

const today = new Date().toISOString().slice(0, 10);
const body = `/**
 * Vilken läroplan varje kurskod i datan tillhör — Gy11-kursplanen eller
 * Gy25-ämnesplanen.
 *
 * GENERERAD FIL. Ändra inte för hand: kör \`npm run update:course-systems\`,
 * som läser Skolverkets eget kursplane-API (api.skolverket.se/syllabus) och
 * skriver om hela tabellen. Varje ämne där är märkt \`SUBJECT_SYLLABUS\` (Gy11)
 * eller \`GRADE_SUBJECT_SYLLABUS\` (Gy25), och varje kurskod hänger under ett
 * ämne — svaret är alltså läst, aldrig gissat ur kodens utseende.
 *
 * ${resolved.length} av datans ${used.length} kurskoder går att slå upp. De ${unresolved.length} som
 * inte gör det står inte här, och appen säger då ingenting om listningens
 * läroplan i stället för att chansa: grundläggande kurser (GRN…) och sfi
 * (SFI…) tillhör ingen av de två, och en rad som täcker flera kurser på en
 * gång tillhör bägge.
 *
 * Källa: Skolverkets syllabus-API, skolform GY och VUXGY, läst ${today}.
 */

import { CourseSystem } from './courseSystems';

export const COURSE_SYSTEM_BY_CODE: Readonly<Record<string, CourseSystem>> = {
${resolved.map(([code, system]) => `  '${code}': '${system}',`).join('\n')}
};

/** Koderna Skolverket inte känner igen, bevarade så en granskare ser vilka. */
export const UNCLASSIFIED_CODES: readonly string[] = [
${unresolved.map((code) => `  '${code}',`).join('\n')}
];
`;

writeFileSync(TARGET, body);
console.log(
  `${resolved.length} kurskoder klassade (${resolved.filter(([, s]) => s === 'gy11').length} Gy11, ` +
    `${resolved.filter(([, s]) => s === 'gy25').length} Gy25), ${unresolved.length} utan svar:`,
);
for (const code of unresolved) console.log(`  ${code}`);
