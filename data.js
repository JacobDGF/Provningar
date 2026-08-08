// Delad data för Prövningar — läses av alla sidor via window.PROVNINGAR
//
// Fakta som modellen bygger på: prövningsavgiften är 500 kr och återbetalas
// inte; Åsö vuxengymnasium ansvarar för prövningar i Stockholm; anordnarna
// kör återkommande prövningsperioder (ex. en i september och en i november)
// där anmälan öppnar ett par veckor innan och stänger ca två veckor före
// provdatum. Först till kvarn gäller.
//
// OBS om anmälningslänkar: `regUrl` är avsiktligt null tills någon manuellt
// har verifierat anordnarens riktiga anmälningssida. Vi gissar aldrig fram
// en URL — en felaktig länk är sämre än ingen länk, eftersom användaren kan
// missa sin anmälan. Fyll i när länken är kontrollerad.
(function () {
  const cities = [
    { name: "Stockholm", count: 24, lat: 59.3293, lng: 18.0686 },
    { name: "Göteborg", count: 11, lat: 57.7089, lng: 11.9746 },
    { name: "Malmö", count: 9, lat: 55.605, lng: 13.0038 },
    { name: "Uppsala", count: 6, lat: 59.8586, lng: 17.6389 },
    { name: "Linköping", count: 5, lat: 58.4108, lng: 15.6214 },
    { name: "Örebro", count: 4, lat: 59.2753, lng: 15.2134 },
    { name: "Västerås", count: 4, lat: 59.6099, lng: 16.5448 },
    { name: "Helsingborg", count: 3, lat: 56.0465, lng: 12.6945 },
  ];

  const SUBJECTS = ["Matematik 3c", "Svenska 3", "Engelska 6", "Kemi 1", "Fysik 2", "Historia 1b", "Biologi 2", "Samhällskunskap 1b", "Matematik 4", "Engelska 5", "Naturkunskap 2", "Psykologi 1"];

  // Prövningsperioder höst 2026. Datum lagras som ISO så att nedräkningar och
  // sortering kan räknas fram i stället för att skrivas som text.
  const PERIODS = [
    { examStart: "2026-09-01", examEnd: "2026-09-04", opens: "2026-08-12T10:00", closes: "2026-08-21T23:59" },
    { examStart: "2026-11-10", examEnd: "2026-11-13", opens: "2026-10-21T10:00", closes: "2026-10-30T23:59" },
  ];

  const ORGS = {
    Stockholm: [
      { name: "Åsö vuxengymnasium", regUrl: null },
      { name: "Komvux Södermalm", regUrl: null },
    ],
  };

  function orgsFor(city) {
    return ORGS[city] || [
      { name: "Komvux " + city, regUrl: null },
      { name: "Vuxenutbildningen " + city, regUrl: null },
    ];
  }

  const MONTHS = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];

  function parse(iso) {
    // Tolkas som lokal tid — prövningsdatum är alltid lokala datum, och
    // new Date("2026-09-01") skulle annars bli UTC och kunna hamna fel dygn.
    const [datePart, timePart] = String(iso).split("T");
    const [y, m, d] = datePart.split("-").map(Number);
    const [hh, mm] = (timePart || "00:00").split(":").map(Number);
    return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  // Hela dygn kvar till `iso`, räknat från dagens datum (inte klockslag) så
  // att "om 1 dag" betyder i morgon oavsett om klockan är 08 eller 23.
  function daysUntil(iso, now) {
    const then = startOfDay(parse(iso));
    const today = startOfDay(now || new Date());
    return Math.round((then - today) / 86400000);
  }

  function formatRange(startIso, endIso) {
    const a = parse(startIso);
    const b = parse(endIso);
    if (a.getMonth() === b.getMonth()) {
      return a.getDate() + "–" + b.getDate() + " " + MONTHS[b.getMonth()] + " " + b.getFullYear();
    }
    return a.getDate() + " " + MONTHS[a.getMonth()] + " – " + b.getDate() + " " + MONTHS[b.getMonth()] + " " + b.getFullYear();
  }

  function formatDateTime(iso) {
    const d = parse(iso);
    const time = String(d.getHours()).padStart(2, "0") + "." + String(d.getMinutes()).padStart(2, "0");
    return d.getDate() + " " + MONTHS[d.getMonth()] + " kl " + time;
  }

  function plural(n, one, many) {
    return n === 1 ? one : many;
  }

  // Anmälningsstatus — den enda uppgift som faktiskt får någon att agera.
  // key används för CSS-klass, label är färdig text, tone styr färg.
  function statusFor(t, now) {
    const at = now || new Date();
    const toOpen = daysUntil(t.opensIso, at);
    const toClose = daysUntil(t.closesIso, at);

    if (toClose < 0) {
      return { key: "closed", tone: "closed", label: "Anmälan stängd", sort: 4, days: toClose };
    }
    if (toOpen > 0) {
      const soon = toOpen <= 14;
      return {
        key: soon ? "opens-soon" : "opens-later",
        tone: soon ? "soon" : "neutral",
        label: "Öppnar om " + toOpen + " " + plural(toOpen, "dag", "dagar"),
        sort: soon ? 1 : 3,
        days: toOpen,
      };
    }
    if (toClose <= 7) {
      return {
        key: "closing-soon",
        tone: "urgent",
        label: toClose === 0 ? "Stänger idag" : "Stänger om " + toClose + " " + plural(toClose, "dag", "dagar"),
        sort: 0,
        days: toClose,
      };
    }
    return { key: "open", tone: "open", label: "Anmälan öppen", sort: 2, days: toClose };
  }

  function hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997;
    return h;
  }

  function getTillfallen(cityName) {
    const city = cities.find((c) => c.name === cityName);
    if (!city) return [];
    const h = hash(cityName);
    const orgs = orgsFor(cityName);
    const list = [];
    for (let i = 0; i < city.count; i++) {
      // Ämnet cyklar per rad, perioden per varv genom ämneslistan. Om båda
      // följde samma index skulle varje ämne dyka upp två gånger med exakt
      // samma datum och anordnare — samma rad två gånger, vilket ser ut som
      // ett fel. Nu erbjuds ämnet i stället en gång per period, vilket också
      // är så anordnarna faktiskt lägger sina scheman.
      const p = PERIODS[Math.floor((i + h) / SUBJECTS.length) % PERIODS.length];
      const org = orgs[i % orgs.length];
      list.push({
        id: cityName + "-" + i,
        city: cityName,
        subject: SUBJECTS[(i + h) % SUBJECTS.length],
        examStartIso: p.examStart,
        examEndIso: p.examEnd,
        opensIso: p.opens,
        closesIso: p.closes,
        date: formatRange(p.examStart, p.examEnd),
        opensLabel: "Anmälan öppnar " + formatDateTime(p.opens),
        closesLabel: "Sista anmälan " + formatDateTime(p.closes),
        org: org.name,
        regUrl: org.regUrl,
        place: "Meddelas i kallelsen",
        fee: "500 kr",
      });
    }
    return list;
  }

  function getTillfalle(id) {
    if (!id) return null;
    const cityName = id.slice(0, id.lastIndexOf("-"));
    return getTillfallen(cityName).find((t) => t.id === id) || null;
  }

  // Alla tillfällen i landet, mest brådskande först. Driver "stänger snart"-
  // ytorna: det är deadlines som får folk att faktiskt anmäla sig.
  function getUrgent(limit, now) {
    const all = [];
    cities.forEach((c) => {
      getTillfallen(c.name).forEach((t) => all.push(t));
    });
    const at = now || new Date();
    const ranked = all
      .map((t) => ({ t, s: statusFor(t, at) }))
      .filter((x) => x.s.key !== "closed")
      .sort((a, b) => a.s.sort - b.s.sort || a.s.days - b.s.days || a.t.city.localeCompare(b.t.city, "sv"));

    // Varva städerna. Utan detta fylls listan av samma stad, eftersom alla
    // tillfällen i en period delar deadline — och en lista med åtta rader
    // Göteborg hjälper ingen som bor i Malmö.
    const byCity = new Map();
    ranked.forEach((x) => {
      if (!byCity.has(x.t.city)) byCity.set(x.t.city, []);
      byCity.get(x.t.city).push(x);
    });
    const queues = [...byCity.values()];
    const out = [];
    const max = limit || 6;
    let round = 0;
    while (out.length < max) {
      let added = false;
      for (const q of queues) {
        if (q.length > round) {
          out.push(q[round]);
          added = true;
          if (out.length >= max) break;
        }
      }
      if (!added) break;
      round++;
    }
    return out.sort((a, b) => a.s.sort - b.s.sort || a.s.days - b.s.days).map((x) => x.t);
  }

  // Påminnelser sparas lokalt i webbläsaren. Ingen server, inget konto och
  // inget som lämnar enheten — gränssnittet säger det rakt ut i stället för
  // att antyda att vi skickar mejl.
  const REMINDER_KEY = "provningar.reminders.v1";

  function readReminders() {
    try {
      const raw = window.localStorage.getItem(REMINDER_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function isReminded(id) {
    return readReminders().indexOf(id) !== -1;
  }

  function toggleReminder(id) {
    const list = readReminders();
    const i = list.indexOf(id);
    if (i === -1) list.push(id);
    else list.splice(i, 1);
    try {
      window.localStorage.setItem(REMINDER_KEY, JSON.stringify(list));
    } catch (e) {
      // Privat läge eller full lagring — påminnelsen gäller då bara sessionen.
    }
    return i === -1;
  }

  window.PROVNINGAR = {
    cities,
    getTillfallen,
    getTillfalle,
    getUrgent,
    statusFor,
    daysUntil,
    isReminded,
    toggleReminder,
    readReminders,
  };
})();
