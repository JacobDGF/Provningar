// Smoke tests for the static Prövningar site.
//
//   npm test
//
// There is no build step and no framework here — the pages are static
// design-tool exports rendered client-side — so these tests drive a real
// browser against a real server and assert the things that have actually
// broken before: dead controls, template holes that never resolve, layout
// that overflows a phone, and text that fails contrast.
//
// The pages load React/Babel/Leaflet from a CDN. If tests/vendor/ has been
// populated (npm run test:vendor) those requests are served from disk, which
// makes the run offline-capable and deterministic; otherwise they go to the
// network as normal.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const VENDOR = path.join(__dirname, "vendor");

export const CDN_FILES = {
  "https://unpkg.com/react@18.3.1/umd/react.production.min.js": "react.js",
  "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js": "react-dom.js",
  "https://unpkg.com/@babel/standalone@7.29.0/babel.min.js": "babel.js",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css": "leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js": "leaflet.js",
};

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml" };

function serve() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "");
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

const results = [];
const check = (name, condition, detail = "") => results.push({ name, ok: !!condition, detail });

// Composite the text color over its backdrop before measuring: the muted
// greys are color-mix()'d and semi-transparent, and ignoring alpha reports a
// far better ratio than what a reader actually sees.
function contrastProbe(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  const parts = (c) => {
    const n = c.match(/[\d.]+/g).map(Number);
    return [n[0], n[1], n[2], n.length > 3 ? n[3] : 1];
  };
  const linear = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = ([r, g, b]) => 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

  let bg = null, node = el;
  while (node) {
    const c = getComputedStyle(node).backgroundColor;
    if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) { const q = parts(c); bg = [q[0], q[1], q[2]]; break; }
    node = node.parentElement;
  }
  bg = bg || [255, 255, 255];
  const f = parts(getComputedStyle(el).color);
  const fg = [0, 1, 2].map((i) => f[3] * f[i] + (1 - f[3]) * bg[i]);
  const style = getComputedStyle(el);
  const size = parseFloat(style.fontSize);
  const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
  const [a, b] = [lum(fg), lum(bg)];
  return {
    ratio: +(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2)),
    required: large ? 3 : 4.5,
    size,
  };
}

async function main() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.error("playwright is not installed. Run: npm install\n");
    process.exit(2);
  }

  const server = await serve();
  const base = `http://localhost:${server.address().port}/`;
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  const haveVendor = fs.existsSync(VENDOR);
  // Map tiles and webfonts are decorative and nothing here asserts on them;
  // blocking keeps the run fast and identical with or without a network.
  const DECORATIVE = /cartocdn\.com|basemaps|fonts\.googleapis\.com|fonts\.gstatic\.com|openstreetmap\.org/;
  await context.route("**/*", (route) => {
    const url = route.request().url();
    const local = CDN_FILES[url];
    if (haveVendor && local && fs.existsSync(path.join(VENDOR, local))) {
      return route.fulfill({ path: path.join(VENDOR, local) });
    }
    if (DECORATIVE.test(url)) return route.abort();
    return route.continue();
  });

  const pageErrors = [];
  const open = async (url, viewport) => {
    const page = await context.newPage();
    if (viewport) await page.setViewportSize(viewport);
    page.on("pageerror", (e) => pageErrors.push(`${url}: ${e.message}`));
    page.on("console", (m) => {
      // CDN/tile requests may legitimately fail offline; only script errors matter.
      if (m.type() === "error" && !m.text().includes("Failed to load resource")) pageErrors.push(`${url}: ${m.text()}`);
    });
    await page.goto(base + url, { waitUntil: "domcontentloaded", timeout: 30000 });
    // The pages boot React from a script tag and render client-side; give the
    // runtime a moment to mount before asserting on the DOM.
    await page.waitForTimeout(1200);
    return page;
  };

  const PAGES = [
    ["Provningar%20Landing.dc.html", "landing"],
    ["Stad.dc.html?stad=Stockholm", "city"],
    ["Provning.dc.html?id=Stockholm-0", "detail"],
    ["Om%20oss.dc.html", "about"],
    ["Skapa%20konto.dc.html", "signup"],
  ];

  // Every page renders, on a phone and on a desktop, with no unresolved
  // template holes and without forcing the document sideways.
  for (const [url, label] of PAGES) {
    for (const [w, h, size] of [[390, 844, "mobile"], [1280, 900, "desktop"]]) {
      const page = await open(url, { width: w, height: h });
      const info = await page.evaluate(() => ({
        docW: document.documentElement.scrollWidth,
        winW: window.innerWidth,
        holes: document.body.innerText.includes("{{"),
        title: document.title,
      }));
      check(`${label} @${size}: no horizontal overflow`, info.docW <= info.winW + 1, `${info.docW}px in ${info.winW}px`);
      check(`${label} @${size}: no unresolved {{ }} holes`, !info.holes);
      check(`${label} @${size}: has a title`, info.title.length > 0);
      await page.close();
    }
  }

  // No dead links anywhere — an href="#" on a call to action reads as
  // working and silently isn't.
  for (const [url, label] of PAGES) {
    const page = await open(url);
    // Leaflet's own zoom controls are legitimately href="#"; only our markup
    // is under test here.
    const dead = await page.$$eval('a[href="#"], a[href=""]', (a) =>
      a.filter((el) => !el.closest(".leaflet-container")).length);
    check(`${label}: no dead links`, dead === 0, `${dead} found`);
    await page.close();
  }

  // City page: urgency ordering, filtering, and a graceful unknown city.
  {
    const page = await open("Stad.dc.html?stad=Stockholm");
    const rows = await page.$$eval("tbody tr", (r) => r.length);
    check("city: lists every session", rows > 0, `${rows} rows`);

    const days = await page.$$eval("tbody tr .status", (els) =>
      els.map((e) => { const m = e.textContent.match(/(\d+)/); return m ? +m[1] : 0; }));
    check("city: soonest deadline first", days.every((d, i) => i === 0 || days[i - 1] <= d), days.slice(0, 5).join(","));

    await page.click('button.chip:has-text("Fysik 2")');
    await page.waitForTimeout(400);
    const subjects = await page.$$eval("tbody tr td:first-child", (e) => [...new Set(e.map((x) => x.textContent.trim()))]);
    check("city: subject filter narrows the table", subjects.length === 1 && subjects[0] === "Fysik 2", JSON.stringify(subjects));

    const pressed = await page.$$eval('button.chip[aria-pressed="true"]', (e) => e.length);
    check("city: active filter is exposed via aria-pressed", pressed === 1);

    await page.click('button.chip:has-text("Alla ämnen")');
    await page.waitForTimeout(300);
    check("city: filter resets", (await page.$$eval("tbody tr", (r) => r.length)) === rows);
    await page.close();

    const unknown = await open("Stad.dc.html?stad=Atlantis");
    const heading = await unknown.$eval("h1", (e) => e.textContent.trim());
    check("city: unknown ?stad= falls back to a real city", heading.length > 0, heading);
    await unknown.close();
  }

  // Detail page: honest registration CTA and a reminder that survives reload.
  {
    const page = await open("Provning.dc.html?id=Stockholm-0");
    check("detail: shows registration status", /dagar|öppen|stäng/i.test(await page.$eval(".status", (e) => e.textContent)));
    check("detail: unverified organiser link becomes instructions", !!(await page.$("text=Så anmäler du dig")));

    await page.click('button:has-text("Påminn mig")');
    await page.waitForTimeout(300);
    check("detail: reminder can be set", /sparad/i.test(await page.$eval("button[aria-pressed]", (e) => e.textContent)));

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    check("detail: reminder survives a reload", /sparad/i.test(await page.$eval("button[aria-pressed]", (e) => e.textContent)));

    await page.click('button[aria-pressed="true"]');
    await page.waitForTimeout(300);
    const stored = await page.evaluate(() => localStorage.getItem("provningar.reminders.v1"));
    check("detail: reminder can be removed", stored === "[]", String(stored));
    await page.close();
  }

  // Landing: the urgency section points at real sessions.
  {
    const page = await open("Provningar%20Landing.dc.html");
    const cards = await page.$$eval("#oppnar-snart a.card", (a) => a.map((x) => x.getAttribute("href")));
    check("landing: urgency section is populated", cards.length > 0, `${cards.length} cards`);
    check("landing: urgency cards link to detail pages", cards.every((h) => /^Provning\.dc\.html\?id=/.test(h)));

    const search = await page.$('input[aria-label="Sök stad"]');
    await search.fill("Uppsala");
    await page.click('button[type=submit]');
    await page.waitForURL("**/Stad.dc.html*", { timeout: 5000 }).catch(() => {});
    check("landing: search navigates to the city", /Stad\.dc\.html/.test(page.url()), page.url());
    await page.close();
  }

  // Contrast — every role that carries text, measured as rendered.
  {
    const PROBES = [
      ["Provningar%20Landing.dc.html", ".text-muted", "muted text"],
      ["Provningar%20Landing.dc.html", ".btn-primary", "primary button"],
      ["Provningar%20Landing.dc.html", ".card-meta", "card meta"],
      ["Provningar%20Landing.dc.html", ".card-kicker", "card kicker"],
      ["Provningar%20Landing.dc.html", ".status", "status badge"],
      ["Provningar%20Landing.dc.html", '.chip[aria-pressed="true"]', "active chip"],
      ["Stad.dc.html?stad=Stockholm", ".table th", "table header"],
      ["Stad.dc.html?stad=Stockholm", ".btn-ghost", "ghost button"],
    ];
    for (const [url, selector, label] of PROBES) {
      const page = await open(url);
      const r = await page.evaluate(contrastProbe, selector);
      if (!r) check(`contrast: ${label}`, false, "selector not found");
      else check(`contrast: ${label} ≥ ${r.required}:1`, r.ratio >= r.required, `${r.ratio}:1 at ${r.size}px`);
      await page.close();
    }
  }

  check("no uncaught page errors", pageErrors.length === 0, pageErrors.join(" | "));

  await browser.close();
  server.close();

  const failed = results.filter((r) => !r.ok);
  for (const r of results) {
    if (!r.ok) console.log(`  FAIL  ${r.name}${r.detail ? "  — " + r.detail : ""}`);
  }
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  process.exit(failed.length ? 1 : 0);
}

// Only run when invoked directly — fetch-vendor.mjs imports CDN_FILES from
// this module and must not kick off the whole suite by doing so.
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
