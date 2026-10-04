# Döda länkar 2026-10-04 — förslag, inget ändrat

`npm run check:links`: 3 av 302 länkar svarar inte (utanför `BOT_BLOCKED`).
Inget av det nedan är applicerat — `registrationUrl`/`infoUrl` ändras inte
utan att du sett diffen först.

Gemensamt för alla tre: länken dog när omgången stängde, inte för att datan
pekar fel. Alvis och kommunernas e-tjänster plockar bort anmälningsvägen när
ingen period är öppen. Frågan är därför inte "vilken URL är rätt" utan "ska
kortet peka på en väg som kommer tillbaka, eller på den som finns i dag".

---

## 1. Kunskapsförbundet Väst (Vänersborg) + Vuxenutbildningen Trollhättan

`[404] https://minasidor.kunskapsforbundet.se/179` (`registrationUrl`, 2 listningar)

Anordnarens sida skriver i dag **"Ansökan om prövning till hösten 2026 är
stängd"**, och den enda anmälningsväg som ligger ute är en PDF-blankett som
postas till Vänersborg. E-tjänsten på `/179` kommer sannolikt tillbaka när
vårens period öppnar (sista ansökningsdag 1 februari 2027).

**Förslag A** (pekar på det som finns i dag):

```diff
-    registrationUrl: 'https://minasidor.kunskapsforbundet.se/179',
+    registrationUrl:
+      'https://kunskapsforbundet.se/app/uploads/sites/6/2021/02/vux_ansokan-om-provning-for-betyg_skrivbarver02.pdf',
+    registration: { kind: 'pdf' },
```

(URL kontrollerad: 200. Blanketten heter "Ansökan Om Prövning För Betyg" på
anordnarens egen blankettsida.)

**Förslag B** (behåller e-tjänsten, säger när den kommer):

```diff
     registrationUrl: 'https://minasidor.kunskapsforbundet.se/179',
+    registration: publishedOnPage('länken till e-tjänsten', 'när vårens period öppnar'),
```

Jag lutar åt **A**: blanketten _är_ anmälan hos dem i dag, och B lämnar kvar en
länk som 404:ar om någon trycker på den.

---

## 2. Vuxenutbildningen Motala (Carlsund utbildningscentrum)

`[404] https://etjanst.motala.se/provning` (`registrationUrl`)

Motalas egen sida förklarar 404:an rakt ut: **"Blanketten är endast tillgänglig
när vi har en öppen anmälningsperiod."** Vårens period är 2 januari –
15 februari 2027 (redan inlagt i `nextPeriod` i dagens svep).

Det här är precis vad `publishedOnPage` finns till för.

**Förslag:**

```diff
     registrationUrl: 'https://etjanst.motala.se/provning',
+    registration: publishedOnPage('anmälningsblanketten', 'den 2 januari'),
```

---

## 3. VuxenUtbildningsCentrum Västerås

`[soft-404] https://vasteras.alvis.se/provning/amnesomrade` (`registrationUrl`)

Alvis svarar 200 men redirectar till `/StatusCode/404`: prövningsanmälan-rutten
finns inte medan ingen period är öppen. Listningen står redan som `full: true`
("Prövningsperioden för 2026 är fullbokad enligt Västerås stad"), så kortet
visar ingen bokningsknapp — men den lilla "se formuläret"-knappen leder till
en felsida.

**Förslag A** (kurskatalogen, som kommunsidan själv länkar till):

```diff
-    registrationUrl: 'https://vasteras.alvis.se/provning/amnesomrade',
+    registrationUrl: 'https://vasteras.alvis.se/hittakurser',
```

(Kontrollerad: 200.)

**Förslag B**: låt den ligga och lägg den inte i `BOT_BLOCKED` — den är en
verklig 404, och priset för en rad i `BOT_BLOCKED` är att en länk som faktiskt
dör där måste upptäckas för hand.

Jag lutar åt **A**: djuplänken kommer tillbaka när nästa period öppnar, men
till dess är `/hittakurser` den sida anmälan faktiskt görs från.

---

## Kvar att kolla för hand

`[503] https://www.landskrona.se/.../provning/` (`infoUrl`) står i
`BOT_BLOCKED` och rapporteras som "kunde inte kontrolleras". Den behöver ett
par ögon i en webbläsare — sweepen kan inte se om den dör.
