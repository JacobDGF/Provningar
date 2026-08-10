#!/usr/bin/env node
/**
 * Link health check for the prövning dataset.
 *
 * Every listing promises to take the user somewhere they can actually book.
 * Municipal sites reorganise constantly, so this walks every registrationUrl
 * and infoUrl in src/data/exams.ts and reports the ones that no longer resolve.
 *
 *   npm run check:links            # check everything
 *   npm run check:links -- --json  # machine-readable output
 *
 * Exit codes: 0 = all good (network failures are warnings, see below),
 *             1 = at least one URL returned a definitive 4xx/5xx.
 *
 * Transport errors (DNS, TLS, timeouts) are reported but do NOT fail the run:
 * they are as often a proxy or rate-limit artefact as a real outage, and a
 * flaky checker that cries wolf gets ignored. A 404 from a server that
 * answered is unambiguous, so that is what we gate on.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Node's fetch ignores HTTPS_PROXY unless told otherwise, and in a proxied
// environment (CI runners, sandboxes) that turns every request into a 503 that
// looks exactly like a dead site. Re-exec once with the flag when a proxy is
// configured; harmless no-op everywhere else. Guarded so an old Node that
// rejects the flag degrades to a direct run rather than crashing.
if (!process.env.NODE_USE_ENV_PROXY && (process.env.HTTPS_PROXY || process.env.https_proxy)) {
  const child = spawnSync(
    process.execPath,
    ['--use-env-proxy', fileURLToPath(import.meta.url), ...process.argv.slice(2)],
    { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1' } },
  );
  // Exit code 9 is Node's "bad option" — this runtime predates the flag, so
  // fall through and run unproxied rather than failing the check outright.
  if (child.status !== 9) process.exit(child.status ?? 1);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_FILE = join(ROOT, 'src/data/exams.ts');

const CONCURRENCY = 6;
const TIMEOUT_MS = 25_000;
const RETRIES = 2;

// Municipal sites and WAFs routinely 403/404 anything that does not look like
// a browser, which produces false alarms. Ask like a browser.
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8',
};

/** Pull the URLs out of the data file without needing a TS toolchain. */
async function collectUrls() {
  const source = await readFile(DATA_FILE, 'utf8');
  const byUrl = new Map();

  for (const match of source.matchAll(/(registrationUrl|infoUrl):\s*'([^']+)'/g)) {
    const [, field, url] = match;
    const line = source.slice(0, match.index).split('\n').length;
    if (!byUrl.has(url)) byUrl.set(url, { url, fields: new Set(), lines: [] });
    byUrl.get(url).fields.add(field);
    byUrl.get(url).lines.push(line);
  }

  return [...byUrl.values()];
}

async function fetchOnce(url, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method,
      redirect: 'follow',
      headers: HEADERS,
      signal: controller.signal,
    });
    // Drain so the socket can be reused / released.
    if (res.body) await res.body.cancel().catch(() => {});
    return { status: res.status, finalUrl: res.url };
  } finally {
    clearTimeout(timer);
  }
}

async function check(entry) {
  let lastError;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 800 * attempt));
    try {
      // Some Swedish municipal platforms answer HEAD with 405 while GET is
      // fine, so go straight to GET and let redirect following do the work.
      const { status, finalUrl } = await fetchOnce(entry.url, 'GET');
      const redirected = finalUrl && finalUrl !== entry.url;
      // A redirect into a 404 page still reports 200 on some CMSes.
      const softFail = /\/statuscode\/404|\/404(\/|$)/i.test(finalUrl ?? '');
      return {
        ...entry,
        status,
        finalUrl,
        redirected,
        state: status >= 400 || softFail ? 'broken' : redirected ? 'redirected' : 'ok',
      };
    } catch (err) {
      lastError = err;
    }
  }
  return { ...entry, status: 0, state: 'unreachable', error: String(lastError?.message ?? lastError) };
}

async function mapWithLimit(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        results[i] = await fn(items[i]);
      }
    }),
  );
  return results;
}

const entries = await collectUrls();
const asJson = process.argv.includes('--json');

if (!asJson) console.log(`Checking ${entries.length} unique URLs from src/data/exams.ts…\n`);

const results = await mapWithLimit(entries, CONCURRENCY, check);

const broken = results.filter(r => r.state === 'broken');
const unreachable = results.filter(r => r.state === 'unreachable');
const redirected = results.filter(r => r.state === 'redirected');

if (asJson) {
  console.log(JSON.stringify({ broken, unreachable, redirected, total: results.length }, null, 2));
} else {
  if (broken.length) {
    console.log(`✗ ${broken.length} broken:`);
    for (const r of broken) {
      console.log(`  [${r.status}] ${r.url}`);
      console.log(`        exams.ts:${r.lines.join(', ')} (${[...r.fields].join(', ')})`);
      if (r.redirected) console.log(`        → ${r.finalUrl}`);
    }
    console.log('');
  }
  if (unreachable.length) {
    console.log(`! ${unreachable.length} unreachable (network/TLS — not treated as a failure):`);
    for (const r of unreachable) console.log(`  ${r.url}\n        ${r.error}`);
    console.log('');
  }
  if (redirected.length) {
    console.log(`~ ${redirected.length} redirected (still 2xx — check the target is still the right page):`);
    for (const r of redirected) console.log(`  ${r.url}\n        → ${r.finalUrl}`);
    console.log('');
  }
  const ok = results.length - broken.length - unreachable.length - redirected.length;
  console.log(`${ok}/${results.length} resolved directly, ${redirected.length} via redirect, ${broken.length} broken, ${unreachable.length} unreachable.`);
}

process.exit(broken.length ? 1 : 0);
