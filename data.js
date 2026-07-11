// Delad data för Prövningar — läses av alla sidor via window.PROVNINGAR
// Fakta: prövningsavgift 500 kr (återbetalas ej), Åsö vuxengymnasium ansvarar för
// prövningar i Stockholm, prövningsperioder ex. 1–4 sep & 10–13 nov (Komvux Södermalm).
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

  // Prövningsperioder höst 2026 (mönster från kommunala anordnare: en period
  // i september och en i november; anmälan öppnar ett par veckor innan).
  const PERIODS = [
    { date: "1–4 september 2026", opens: "Anmälan öppnar 12 augusti kl 10.00" },
    { date: "10–13 november 2026", opens: "Anmälan öppnar 21 oktober kl 10.00" },
  ];

  const ORGS = {
    Stockholm: ["Åsö vuxengymnasium", "Komvux Södermalm"],
  };

  function orgsFor(city) {
    return ORGS[city] || ["Komvux " + city, "Vuxenutbildningen " + city];
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
      const p = PERIODS[(i + h) % PERIODS.length];
      list.push({
        id: cityName + "-" + i,
        city: cityName,
        subject: SUBJECTS[(i + h) % SUBJECTS.length],
        date: p.date,
        deadline: p.opens,
        org: orgs[i % orgs.length],
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

  window.PROVNINGAR = { cities, getTillfallen, getTillfalle };
})();
