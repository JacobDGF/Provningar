#!/usr/bin/env node
/**
 * Walks every registrationUrl / infoUrl in the dataset and reports the ones
 * that no longer resolve.
 *
 * Municipal websites get restructured constantly, and a listing whose "Anmäl
 * dig" button 404s is worse than no listing at all — the user has already
 * decided to book by the time they find out. This is the cheap periodic sweep
 * that catches that drift; it is deliberately not part of `npm test`, since it
 * depends on ~90 third-party sites being up.
 *
 *   npm run check:links              report everything that failed
 *   npm run check:links -- --all     also list the URLs that redirected
 *
 * Behind a TLS-intercepting proxy, every https host fails at once (typically as
 * a wall of 503s) because Node doesn't trust the proxy's CA. That is the
 * environment failing, not ~70 kommuner going down together — point Node at the
 * bundle before blaming the data:
 *
 *   NODE_EXTRA_CA_CERTS=/path/to/ca-bundle.crt npm run check:links
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'src/data/exams.ts');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const CONCURRENCY = 8;
const TIMEOUT_MS = 25_000;
const showAll = process.argv.includes('--all');

/** Read the URLs straight out of the source — no build step, no TS runtime. */
function collectUrls() {
  const src = readFileSync(SOURCE, 'utf8');
  const byUrl = new Map();
  for (const [, field, url] of src.matchAll(/(registrationUrl|infoUrl): '([^']+)'/g)) {
    if (!byUrl.has(url)) byUrl.set(url, new Set());
    byUrl.get(url).add(field);
  }
  return [...byUrl].map(([url, fields]) => ({ url, fields: [...fields].sort().join(', ') }));
}

async function check({ url, fields }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA, 'accept-language': 'sv-SE,sv;q=0.9' },
      redirect: 'follow',
      signal: controller.signal,
    });
    // Some kommun platforms answer 200 while redirecting to their own error
    // page — a dead link that never shows up as a dead status code.
    const softDead = /statuscode\/404|\/404($|[/?#])|sidan-finns-inte|page-not-found/i.test(
      res.url,
    );
    return {
      url,
      fields,
      status: softDead ? 'soft-404' : res.status,
      finalUrl: res.url,
      ok: res.ok && !softDead,
    };
  } catch (err) {
    return {
      url,
      fields,
      status: err.name === 'AbortError' ? 'timeout' : 'error',
      finalUrl: '',
      ok: false,
      detail: err.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Fixed-size worker pool — 90 simultaneous requests gets us rate-limited. */
async function mapPool(items, worker, size) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await worker(items[i]);
      }
    }),
  );
  return results;
}

const urls = collectUrls();
console.log(`Kontrollerar ${urls.length} unika länkar från ${SOURCE.replace(ROOT + '/', '')}…\n`);

const results = await mapPool(urls, check, CONCURRENCY);
const broken = results.filter((r) => !r.ok);
const redirected = results.filter((r) => r.ok && r.finalUrl && r.finalUrl !== r.url);

if (redirected.length && showAll) {
  console.log(`↪ ${redirected.length} omdirigerade (fungerar, men länken kan uppdateras):`);
  for (const r of redirected) console.log(`   ${r.url}\n     → ${r.finalUrl}`);
  console.log('');
}

if (!broken.length) {
  console.log(`✓ Alla ${results.length} länkar svarar. ${redirected.length} omdirigerar.`);
  process.exit(0);
}

console.error(`✗ ${broken.length} av ${results.length} länkar svarar inte:\n`);
for (const r of broken) {
  console.error(`   [${r.status}] ${r.url}  (${r.fields})${r.detail ? `\n     ${r.detail}` : ''}`);
}
console.error(
  '\nNågra värdar blockerar automatiserade anrop — kontrollera i webbläsare innan du ändrar datan.',
);
process.exit(1);
