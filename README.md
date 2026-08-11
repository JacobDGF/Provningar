# Prövningar

En app som hjälper folk hitta och anmäla sig till betygsprövningar i hela
Sverige. Alla listningar länkar vidare till anordnarens egen anmälan — appen
tar aldrig emot en anmälan själv.

## Kom igång

```sh
npm ci
npm run dev           # utvecklingsserver
npm test              # dataset- och logiktester
npm run typecheck     # tsc -b
npm run lint          # eslint
npm run format:check  # prettier --check
npm run build         # produktionsbygge till dist/
```

## Datan är produkten

Allt innehåll bor i [`src/data/exams.ts`](src/data/exams.ts). Varje listning är
kontrollerad mot anordnarens egen webbplats, och `verifiedAt` säger när.

Två regler styr datan, och båda testas i
[`src/data/exams.test.ts`](src/data/exams.test.ts):

- **Inga gissade datum.** `nextPeriod.confirmed` är `false` när anordnaren inte
  har publicerat datum. Då visar appen ingen period alls, utan länkar vidare.
- **Länken ska leda till anmälan.** `registrationUrl` pekar så nära själva
  bokningen som anordnaren tillåter — e-tjänsten, kurslistan eller kassan, inte
  en informationssida, när ett djupare mål finns.

### Två vägar ut ur varje listning

[`src/lib/providerLinks.ts`](src/lib/providerLinks.ts) ger varje listning två mål,
och appen visar båda som egna knappar: `booking` är den verifierade djuplänken
in i anordnarens bokning, och `site` är anordnarens egen sida för den som hellre
läser först och gör allt själv. När `infoUrl` och `registrationUrl` är samma sida
härleds `site` till anordnarens startsida — alltid ur `infoUrl`, aldrig ur
bokningslänken, eftersom "skolans webbplats" inte betyder alvis.se.

### Anmälningsflöden

[`src/lib/registrationFlow.ts`](src/lib/registrationFlow.ts) härleder ur
`registrationUrl` vad användaren möts av — formulär, kurslista, kommunal
e-tjänst, webbshop, PDF-blankett, e-post eller informationssida — och vilka steg
som återstår. Appen visar stegen innan användaren klickar vidare. En listning
kan sätta `registration: { kind: … }` när en anordnare gör något som URL:en inte
avslöjar (t.ex. anmälan per e-post).

### Kontrollera länkarna

```sh
npm run check:links          # rapporterar döda länkar
npm run check:links -- --all # visar även omdirigeringar
```

Skriptet ingår medvetet inte i `npm test` — det beror på att ~90 externa
webbplatser svarar. Vissa kommunplattformar blockerar automatiserade anrop och
rapporteras som fel även när de fungerar i webbläsaren; kontrollera manuellt
innan du ändrar datan.

Får du plötsligt fel på nästan alla länkar samtidigt är det nästan aldrig datan.
Bakom en TLS-inspekterande proxy litar Node inte på proxyns certifikat och varje
https-anrop faller:

```sh
NODE_EXTRA_CA_CERTS=/sökväg/till/ca-bundle.crt npm run check:links
```

## Profilbilder och community

Appen visar aldrig färdiga porträtt av påhittade personer. En profilbild är en
bild användaren själv tar eller väljer, den skalas ned och sparas som `data:`-URL
i webbläsaren, och den lämnar aldrig enheten. Alla andra visas som ett ritat
monogram. [`src/lib/avatar.ts`](src/lib/avatar.ts) vägrar därför bild-URL:er som
pekar utanför enheten — vilket också rensar bort de gamla stockbilderna ur
localStorage hos återvändande användare (`persist` v0 → v1).

## Deploy

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) kör lint,
formatkontroll, typkontroll, tester och bygge på varje push och pull request,
och publicerar `dist/` till `gh-pages` vid push till `main`.
