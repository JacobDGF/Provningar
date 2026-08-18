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

Fyra regler styr datan, och de testas i
[`src/data/exams.test.ts`](src/data/exams.test.ts) och
[`src/lib/examStatus.test.ts`](src/lib/examStatus.test.ts):

- **Inga gissade datum.** `nextPeriod.confirmed` är `false` när anordnaren inte
  har publicerat datum. Då visar appen ingen period alls, utan länkar vidare.
- **Länken ska leda till anmälan.** `registrationUrl` pekar så nära själva
  bokningen som anordnaren tillåter — e-tjänsten, kurslistan eller kassan, inte
  en informationssida, när ett djupare mål finns.
- **Anordnarens ord gäller före kalendern.** `nextPeriod.full` sätts när
  anordnaren själv skrivit att omgången är fullbokad. Då är listningen stängd
  för anmälan även om datumen ser öppna ut, och nedräkningen tystnar — en
  röd "3 dagar kvar" på en omgång ingen kan söka till är bara press utan utväg.
- **Ett datum som varit ska synas som ett datum som varit.** När sista
  anmälningsdag passerat säger kortet "Anmälan stängde 4 aug.", datumet stryks
  över, kalenderexporten försvinner och listningen sjunker under de odaterade i
  "närmast i tiden" — en gången deadline sorterar annars först, eftersom ett
  äldre datum är mindre som text.
- **Samma skola och kurs listas en gång.** Datan växer en anordnare i taget, och
  två omgångar hos samma skola hör hemma i samma listnings etikett. Två kort
  läser som två skolor, där den ena råkar vara fullbokad.

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
webbplatser svarar. Värdar som blockerar automatiserade anrop (Alvis, ett par
kommunsajter) står i `BOT_BLOCKED` i skriptet och rapporteras separat som
"kunde inte kontrolleras" i stället för som fel — annars drunknar en verklig
död länk i röd text som alltid är röd. Priset är att en länk som faktiskt dör
på en sådan värd måste upptäckas för hand, så listan gäller bara så länge den
senaste manuella kontrollen håller.

### Kontrollera datumen

```sh
npm run check:dates                    # vad som gått ut idag
npm run check:dates -- --soon          # visar även vad som stänger inom tre veckor
npm run check:dates -- --on 2026-12-01 # låtsas att det är ett annat datum
```

Länksweepen hittar en länk som dör. Det här hittar den andra halvan av samma
förfall, som är tystare: länken lever, sidan laddar, och datumen appen visar
hör till en omgång som stängde för tre veckor sedan. En listning ser precis lika
frisk ut dagen efter sista anmälningsdag som dagen före.

Skriptet skiljer på en omgång som är _helt_ förbi och en där anmälan stängt men
prövningen är kvar — den senare kan komma tillbaka med nya datum på samma sida.
De listningar som bygger sin period i kod i stället för som ett objekt kan inte
läsas ur källtexten, och rapporteras vid namn i stället för att tigande hoppas
över. Skriptet ingår inte i `npm test`: det beror på dagens datum, och skulle
göra `main` röd en tisdag morgon utan att någon commit orsakat det.

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

## Datum, kalender och dina data

Appen påminner ingen om något när den är stängd, och den har ingen server.
Därför två utvägar, båda helt lokala:

- [`src/lib/calendarFile.ts`](src/lib/calendarFile.ts) bygger en `.ics` med
  sista anmälningsdag och provperiod (heldagshändelser, påminnelse dagen före)
  som användaren lägger i telefonens egen kalender. Ingen händelse skapas för en
  period som inte är bekräftad — ett gissat datum i någons kalender är sämre än
  inget datum.
- Profilfliken exporterar allt appen vet om användaren som JSON. Allt ligger i
  en enda webbläsares `localStorage`, så exporten är den enda säkerhetskopia som
  finns — den ligger direkt ovanför knappen som raderar originalet.

## Deploy

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) kör lint,
formatkontroll, typkontroll, tester och bygge på varje push och pull request,
och publicerar `dist/` till `gh-pages` vid push till `main`.
