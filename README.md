# Prövningar

En karta över Sveriges prövningstillfällen — för dig som behöver läsa upp ett
betyg för att komma in på universitetet.

En prövning är enda sättet att höja ett betyg du redan har godkänt i. Problemet
är inte att plugga, utan att hitta tillfället: varje kommun och anordnare
publicerar sina egna datum på sin egen webbplats, anmälan öppnar ett bestämt
klockslag och gäller först till kvarn. Missar du fönstret får du vänta till
nästa period. Den här sidan samlar tillfällena på en karta och visar exakt när
anmälan öppnar och stänger.

## Så är projektet byggt

Statisk sajt utan byggsteg. Sidorna är exporter från ett designverktyg
(`*.dc.html`) som renderas i webbläsaren av `support.js`, med
designsystemet i `styles.css` och all data i `data.js`. Öppna vilken
`.dc.html` som helst via en webbserver så funkar den — det finns inget att
kompilera.

| Fil | Roll |
| --- | --- |
| `Provningar Landing.dc.html` | Startsida: karta, sökning, tillfällen som öppnar snart |
| `Stad.dc.html?stad=…` | Alla tillfällen i en stad, sorterade efter närmaste anmälan |
| `Provning.dc.html?id=…` | Ett enskilt tillfälle: datum, anordnare, avgift, påminnelse |
| `Om oss.dc.html` | Om projektet och FAQ |
| `Skapa konto.dc.html` | Registrering (demo — ingen server bakom) |
| `data.js` | Städer, perioder, ämnen, statuslogik och påminnelser |
| `styles.css` | Designsystem: tokens, komponenter, responsiv layout |
| `support.js` | Genererad runtime från designverktyget — redigeras inte för hand |

`_ds_*`, `_adherence.oxlintrc.json` och `_probe.html` hör till designverktygets
synkronisering och ska ligga kvar.

## Köra lokalt

Sidorna måste serveras över HTTP (de laddar `data.js` och `styles.css`
relativt):

```sh
npm run serve      # http://localhost:8080/
```

Eller vad som helst som serverar mappen, t.ex. `python3 -m http.server`.

## Tester

Testerna startar en server och kör en riktig webbläsare mot alla fem sidorna.
De kontrollerar det som faktiskt har gått sönder tidigare: döda länkar,
`{{ }}`-hål som aldrig fylls i, layout som spräcker en mobilskärm, och
textfärger som inte klarar WCAG AA.

```sh
npm install        # hämtar playwright
npx playwright install chromium
npm test
```

Sidorna hämtar React och Leaflet från CDN. Vill du kunna köra testerna offline
och helt deterministiskt:

```sh
npm run test:vendor   # sparar biblioteken i tests/vendor/ (gitignorerad)
```

## Data

Datat i `data.js` är påhittat men realistiskt: två prövningsperioder per termin,
500 kr i avgift, anmälan som öppnar ett par veckor innan och stänger ungefär
två veckor före provdatum. Datum lagras som ISO så att nedräkningar och
sortering räknas fram i stället för att skrivas som text.

**Anmälningslänkar (`regUrl`) är avsiktligt tomma.** Vi länkar först när någon
manuellt kontrollerat att länken går till anordnarens riktiga anmälningssida —
en gissad länk kan kosta någon hela anmälningsfönstret. Tills dess visar
detaljsidan konkreta instruktioner i stället för en länk.

## Bidra

Rapportera gärna felaktiga datum eller anordnare. Prövningar är ett fristående,
kostnadsfritt projekt — vi är inte en prövningsanordnare, och anmälan och
betalning sker alltid direkt hos kommunen eller skolan.
