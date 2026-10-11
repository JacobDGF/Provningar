# Länkar att besluta om — svepet 2026-10-11

`npm run check:links` svarade: 3 av 302 länkar är döda och 1 kunde inte
kontrolleras. Ingen av dem är ändrad i `src/data/exams.ts` — de står här
med diffen jag föreslår, för att `registrationUrl` och `infoUrl` inte ska
byta mål utan att du sett bytet först.

Datumen i samma listningar är redan rättade och pushade; det här är bara
länkarna.

---

## 1. Motala — `registrationUrl` svarar 404

`vuxenutbildningen-motala-carlsund-utbildningscentrum-motala-`

`https://etjanst.motala.se/provning` ger 404. Värden lever
(`etjanst.motala.se` svarar 200), så det är sökvägen som är borta, inte
e-tjänsten. Den närmaste tjänst som finns kvar är "Vuxenutbildningen -
ansökan" på `https://etjanst.motala.se/oversikt/overview/363`, men den
beskriver ansökan till kurser och nämner inte prövning — den är alltså
en sämre länk än den döda, inte en bättre, och jag föreslår den inte.

**Jag hittar ingen verifierad väg in till Motalas prövningsanmälan.**
Kommunens egen prövningssida går inte att hitta via sökning heller.
Två vägar jag ser:

- Du kollar i webbläsaren vad `etjanst.motala.se` har kvar under
  vuxenutbildning, och säger vilken URL som gäller.
- Eller så ringer vi servicecenter (0141-22 50 00) och låter listningen
  bära `registration: { kind: 'email' }` eller `'inperson'` tills vi vet.

Listningen bär sedan i dag `confirmed: false` med en etikett som säger
att tjänsten inte svarar, så ingen skickas just nu in i en 404 med ett
datum i handen.

---

## 2. Västerås — `registrationUrl` svarar soft-404

`vasteras-...` (Vuxenutbildningscentrum Västerås)

`https://vasteras.alvis.se/provning/amnesomrade` redirectar till
`https://vasteras.alvis.se/StatusCode/404`. Alvis-instansen lever och har
två sidor som kan ta över:

| Kandidat                                | Vad den är                                                                   |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| `https://vasteras.alvis.se/hittakurser` | "Till kurskatalogen" — där kursen söks fram och anmälan görs                 |
| `https://vasteras.alvis.se/nyhet/1672`  | "Information om prövning" — avgiften, Swish-numret, kravet att bifoga kvitto |

Jag föreslår kurskatalogen, eftersom den är den av de två som _är_
anmälan:

```diff
     registrationUrl: 'https://vasteras.alvis.se/provning/amnesomrade',
+    registrationUrl: 'https://vasteras.alvis.se/hittakurser',
```

Två saker att väga in innan du säger ja:

- `/nyhet/1672` är den sida som skriver ut avgiftsreglerna listningen
  redan bär i `priceNote`. Den är rätt `infoUrl`-kandidat om du tycker
  att `vasteras.se`-sidan är för grund — men det är ett annat byte, och
  det står inte här.
- Bytet ändrar vilket flöde `registrationFlow.ts` härleder (`page` →
  `coursepicker`), alltså stegen kortet visar. Värt att läsa kortet en
  gång efteråt.

---

## 3. Katrineholm — `infoUrl` svarar inte alls

`komvux-katrineholm-flera-kurser`

`https://www.viadidakt.se/vuxenutbildning/start/komvux/validering-och-provning.html`
svarar inte, och **hela värden `viadidakt.se` svarar inte** — det är
alltså inte en flyttad sida. Förklaringen står i Katrineholms egna
handlingar: viadidaktnämnden är avvecklad, och verksamheten ligger hos
den nya vuxenutbildnings- och arbetsmarknadsnämnden.

Jag hittar ingen ersättande sida på `katrineholm.se` — de URL:er jag
provade ger 404, och sökningen hittar bara nämndhandlingar. Det här är
den som behöver dina ögon mest, eftersom skolans namn i datan
("Komvux Katrineholm (Viadidakt)") också är fel om Viadidakt är borta.

Listningen bär sedan i dag `confirmed: false` med en etikett som säger
att ingen period går att bekräfta. `registrationUrl`
(`https://katrineholm.alvis.se/provning/amnesomrade`) svarar fortfarande
200 och är orörd.

---

## 4. Landskrona — kunde inte kontrolleras

`https://www.landskrona.se/utbildning-barnomsorg/vuxenutbildning/provning/`
(`infoUrl`) svarade 503 i sweepen och ger inget svar alls via curl, inte
ens efter omförsök en i taget. Det ser ut som en värd som känner igen
klienten snarare än takten, alltså en `BOT_BLOCKED`-kandidat — men
priset för en rad där är att en länk som faktiskt dör måste upptäckas
för hand, så den står kvar tills du sett sidan i en webbläsare.

- Lever sidan → lägg `www.landskrona.se` i `BOT_BLOCKED` i
  `scripts/check-links.mjs`.
- Är den borta → då är det datan som ska rättas, och den raden kommer
  tillbaka här nästa dygn.

---

## 5. Järfälla — ingen död länk, men `infoUrl` säger inte datumen

`jarfalla-larcentrum-flera-kurser` stänger anmälan om 2 dagar
(13 oktober), så jag försökte verifiera perioden. Det gick inte:
`https://www.jarfalla.se/larcentrum/elev` listar inga
prövningsperioder alls utan hänvisar vidare till
`jarfalla.alvis.se/viktigadatum`, och den sidan renderar sitt innehåll
med JavaScript (svarar "temp1 temp1 temp1" till en läsare utan
webbläsare).

`infoUrl` ska peka på sidan där anordnaren skriver datumen appen visar,
och den gör den inte i dag. Men jag kan inte föreslå ett bättre mål
förrän någon sett vad `/viktigadatum` faktiskt innehåller i en
webbläsare — så det här är en fråga, inte en diff: **står period 5:s
datum (anmälan 13 oktober, delprov 1 den 10 november, betyg
18 december) kvar där?**
