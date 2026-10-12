# Föreslagna länkfixar — INTE committade

## 1. Viadidakt-domänen finns inte längre (check:links: `[error] fetch failed`)

`www.viadidakt.se` har ingen DNS alls — varken `www.viadidakt.se` eller
`viadidakt.se` slår upp. Katrineholms kommun länkar numera till
`katrineholm.se/vuxenutbildning/`, och den gamla sökvägen ligger kvar en-till-en
under den nya domänen (HTTP 200, och sidan skriver ut anmälningsperioderna
1–26 januari och 1 augusti – 1 september, som redan ligger i datan).

```diff
   id: 'komvux-katrineholm-flera-kurser',
-    infoUrl: 'https://www.viadidakt.se/vuxenutbildning/start/komvux/validering-och-provning.html',
+    infoUrl:
+      'https://www.katrineholm.se/vuxenutbildning/start/komvux/validering-och-provning.html',
```

## 2. Västerås' Alvis-sökväg svarar med en 404-sida (check:links: `soft-404`)

`https://vasteras.alvis.se/provning/amnesomrade` svarar HTTP 200 med texten
"Oväntat fel 404 — Vi kunde inte hitta sidan du letade efter". Alvis har bytt
sökväg till `/hittakurser`, som svarar 200 med den riktiga kurskatalogen — och
det är kurskatalogen kommentaren i datan redan säger att länken ska peka på.

```diff
   (Västerås, VuxenUtbildningsCentrum)
-    registrationUrl: 'https://vasteras.alvis.se/provning/amnesomrade',
+    registrationUrl: 'https://vasteras.alvis.se/hittakurser',
```

## 3. Motalas e-tjänst är inte död — den finns bara under anmälningsperioden

`https://etjanst.motala.se/provning` svarar 404, men värden lever och kommunen
länkar fortfarande dit. Motalas egen sida förklarar varför: _"Blanketten är
endast tillgänglig när vi har en öppen anmälningsperiod."_ Nästa period är
2 januari – 15 februari 2027. Det är alltså samma mönster som `publishedOnPage`
redan finns till för, inte en länk att byta ut.

```diff
   id: 'vuxenutbildningen-motala-carlsund-utbildningscentrum-motala-',
+    registration: publishedOnPage('blanketten för anmälan', 'den 2 januari'),
     registrationUrl: 'https://etjanst.motala.se/provning',
```

Alternativet är att låta `registrationUrl` peka på informationssidan i stället,
men då tappar vi den djupa länken de veckor den faktiskt fungerar — och testet
_"names every listing that only reaches an information page"_ skulle behöva en
ny rad för hand.

## 4. Landskrona: kunde inte kontrolleras (står redan i `BOT_BLOCKED`)

`https://www.landskrona.se/.../provning/` svarar 503 för sweepen och timeout för
curl härifrån. Den ligger redan i `BOT_BLOCKED`, så inget att ändra — men den är
kvar på listan "kontrollera i webbläsare för hand".
