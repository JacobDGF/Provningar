# Länkrapport 2026-10-10

`npm run check:links` — 302 unika länkar, 3 svarar inte, 1 kunde inte kontrolleras.
Inga `registrationUrl`/`infoUrl` är ändrade i `src/data/exams.ts`; nedan är
förslagen med diff, att godkänna eller avslå.

---

## 1. Västerås — äkta död länk, fix finns

**Listning:** `vuxenutbildningscentrum-vasteras-edstromska-m-fl-vasteras-fl`
**Fält:** `registrationUrl`
**Nu:** `https://vasteras.alvis.se/provning/amnesomrade` → **302 till `/StatusCode/404`**

Alvis har bytt sökväg hos Västerås. `/hittakurser/amnesomrade` svarar 200 och är
kurssöket (just nu "Antal träffar: 0", alltså inget aktuellt utbud — samma
mellansäsongsläge som andra anordnare). Kontrollerade sökvägar:

| Sökväg                     | Svar                  |
| -------------------------- | --------------------- |
| `/provning/amnesomrade`    | 302 → `/StatusCode/404` |
| `/hittakurser/amnesomrade` | 200, kurssöket         |
| `/provning`                | 404                    |

**Förslag:**

```diff
     id: 'vuxenutbildningscentrum-vasteras-edstromska-m-fl-vasteras-fl',
-    registrationUrl: 'https://vasteras.alvis.se/provning/amnesomrade',
+    registrationUrl: 'https://vasteras.alvis.se/hittakurser/amnesomrade',
```

---

## 2. Motala — 404 är väntat, ingen länkändring föreslås

**Listning:** `vuxenutbildningen-motala-carlsund-utbildningscentrum-motala-`
**Fält:** `registrationUrl`
**Nu:** `https://etjanst.motala.se/provning` → **404**

Länken är **inte** fel. Motalas egen prövningssida länkar till exakt den
adressen, och skriver själv varför den är tom:

> "Blanketten är endast tillgänglig när vi har en öppen anmälningsperiod."

Höstens period stängde 15 september. Nästa fönster är **2 januari – 15 februari
2027**, och då kommer blanketten tillbaka. Att peka om länken skulle flytta
användaren bort från den adress anordnaren själv annonserar.

**Förslag:** lämna URL:en. Däremot är det precis det mönster `publishedOnPage`
finns för — den skulle säga "blanketten publiceras 2 januari" i stället för att
låta användaren möta en 404:

```diff
     id: 'vuxenutbildningen-motala-carlsund-utbildningscentrum-motala-',
+    publishedOnPage: '2027-01-02',
```

Säg till om du vill ha den, så kontrollerar jag först hur `publishedOnPage`
renderas för en `eservice`-länk.

---

## 3. Viadidakt (Katrineholm) — nådde inte värden, behöver webbläsarkoll

**Listning:** `komvux-katrineholm-flera-kurser`
**Fält:** `infoUrl`
**Nu:** `https://www.viadidakt.se/vuxenutbildning/start/komvux/validering-och-provning.html`
→ **`fetch failed`** i sweepen, och `Connection reset by peer` på tre curl-försök
med webbläsar-user-agent.

Mönstret (reset i stället för status) ser ut som klientfingeravtryck snarare än
en död sida, alltså en `BOT_BLOCKED`-kandidat — men README:s pris för en rad i
listan är att en länk som verkligen dör där måste hittas för hand, så den ska
inte läggas in på en gissning. **Kolla den i webbläsare**, och säg vilket det är:

- Sidan lever → lägg `www.viadidakt.se` i `BOT_BLOCKED`.
- Sidan är borta → då behöver `infoUrl` ett nytt mål.

Datan i listningen är oberoende av det här: bokningssidan
`katrineholm.alvis.se/provning/amnesomrade` svarar och säger "Det finns inga
aktuella prövningar just nu", vilket är varför listningen nu står
`confirmed: false`.

---

## 4. Landskrona — känd `BOT_BLOCKED`, ingen åtgärd

`https://www.landskrona.se/.../provning/` svarade 503. Värden står redan i
`BOT_BLOCKED` sedan 2026-08-13 och rapporteras som "kunde inte kontrolleras".
Kvarstår att kolla för hand vid behov.

---

## Kvar att kolla för hand

| # | Vad                      | Varför |
| - | ------------------------ | ------ |
| 1 | Västerås `registrationUrl` | Fix föreslagen ovan, väntar på godkännande |
| 2 | Viadidakt `infoUrl`        | Nås inte härifrån — webbläsarkoll avgör `BOT_BLOCKED` eller nytt mål |
| 3 | Landskrona `infoUrl`       | `BOT_BLOCKED`, aldrig automatiskt kontrollerad |

Motalas 404 räknas inte som kvarstående — den är förklarad och väntad.

## Fotnot: Värnamo

`kommun.varnamo.se` svarade 503 på varje försök (WebFetch ×2, curl ×3), så
listningen `varnamo-vuxenutbildning-flera-kurser` kunde inte verifieras mot
anordnarens sida. Den står nu `confirmed: false` i stället för att visa en
deadline som gick ut 28 augusti. En webbsökning påstår att sista ansökningsdag
för VT27 är 29 januari, men det är andrahandsuppgift och inte läst på
anordnarens egen sida — därför inte infört.
