# Daglig rutin – Prövningar, 2026-10-28

Branch: `claude/loving-albattani-e0z342` (pushad)
Commits: `d79ce84` (Göteborg), `8cab3b6` (de 44 övriga)

## Sammanfattning

|                                                      | Antal   |
| ---------------------------------------------------- | ------- |
| Borttagna/arkiverade (satta till `confirmed: false`) | **171** |
| Nya eller uppdaterade perioder                       | **30**  |
| Döda länkar kvar att kolla för hand                  | **3**   |
| Listningar som stänger inom 21 dagar                 | **1**   |

Inget är borttaget ur datasetet. Alla 171 ligger kvar som listningar men utan
datum, enligt regeln i README: `confirmed: false` plus en etikett som säger vad
anordnaren själv skriver i stället. Att radera dem hade tagit bort Göteborg –
datasetets största anordnare – ur appen helt.

## 1. `check:dates`

**Läget vid start:** `src/data/exams.ts` hade inte rörts sedan 2026-09-11, 47
dagar. **201 av 379** listningar med bekräftad period visade en omgång som var
helt förbi. Efter körningen: **0**.

### Prövningsenheten Göteborg – 157 listningar

Hela kurskatalogen är omläst i Alvis, kurs för kurs (217 kurssidor, med
prövningsdatum och sista anmälningsdag från varje). Resultatet:

- **Samtliga 217 kurser** står som "Stängd för anmälan".
- **Inget prövningstillfälle ligger senare än 2026-11-24.** Vårens datum är
  inte publicerade – varken i katalogen eller på goteborg.se, som bara hänvisar
  till Alvis.
- 58 listningar vars prövning fortfarande ligger framåt stämmer **exakt** med
  katalogen och är orörda.
- 157 var helt förbi → `confirmed: false`. 119 har ett tillfälle som passerat,
  38 har inget tillfälle utlagt alls, och etiketten skiljer på de två.
- Avgiften är kontrollerad mot anordnarens avgiftssida (500 kr, oförändrad).

Det här är den stora nyheten i körningen: **Göteborg har just nu ingen bokbar
prövning alls**, och har inte publicerat någon för våren.

### De 44 övriga – 34 anordnare, en sida i taget

**30 fick en ny period ur anordnarens egen tabell:**

Medlearn Täby (11 dec) · Iris Flemingsberg (11 dec) · Iris Upplands Väsby
(8 dec) · Vux Huddinge ×4 (15 mars 2027) · Folkuniversitetet Södertälje
(4–14 dec) · ABF Stockholm ×2 (7–17 dec) · Örebro grundläggande ×4 (2 + 6 nov –
provdagen var opublicerad förra gången och står nu i tabellen) · Falkenberg
(23 mars + 6 april 2027) · Nässjö (14 april 2027) · Falun (v. 13 2027) ·
Härnösand (v. 15 2027) · Gotland (27 jan 2027) · Örnsköldsvik ×2 (18 mars +
15 april 2027) · Linvux (v. 10–11 2027) · Karlskoga ×2 · Motala · Uddevalla ·
Kunskapsförbundet Väst ×2 · Växjö · Ljungby

**14 står som ofastställda, med anordnarens eget besked i etiketten:**

JENSEN ×3 och Umevux ×2 ("datum publiceras när de är fastställda") · Östersund
("prövningsdatum för 2027 är inte fastställda") · Alingsås · Kristinehamn
(sätter inga fasta datum alls – efter överenskommelse med läraren) ·
Kristianstad · Kungsbacka · Sundsvall · Ystad · Värnamo (sidan svarade 503) ·
Katrineholm/Viadidakt (sidan finns inte kvar, se nedan)

Fullbokat-flaggan är borta från JENSEN ×3, Iris Upplands Väsby och Karlskoga
Matematik 3b/3c – den gällde höstens omgång, som är genomförd.

Där ett fält är omräknat eller medvetet saknas står det nu i en kommentar
varför: veckonummer → kalenderdatum, anmälan som stänger när platserna tar slut
i stället för på ett datum, och provdatum som anordnaren sätter först efter
antagning.

### Stänger inom 21 dagar

- **Folkuniversitetet Komvux Södertälje** – sista anmälningsdag **2026-11-12**
  (om 15 dagar). Anmälan öppnar 9 november kl. 08.00 och kan stänga tidigare om
  platserna blir fullbokade. Värd en koll den 9–12 november.

Inget annat i datasetet stänger inom tre veckor, och det är i sig en signal:
nästan allt som gick att boka har redan stängt.

### En rättad beskrivning

Gotlands beskrivning sa "varannan onsdag (jämna veckor)". Regionens egen sida
listar sex bestämda veckor per år (4, 12, 20, 36, 42, 46). Det står där nu.

## 2. `check:links` – 3 döda kvar att kolla för hand

Kör med `NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt` i den här miljön, annars
faller varje https-anrop (står redan i README).

Jag har **inte** ändrat någon `registrationUrl` eller `infoUrl`. Förslagen
nedan är diffar att titta på först.

### a) Katrineholm/Viadidakt – hela domänen är borta

`www.viadidakt.se` slutar svara på DNS (`ESERVFAIL`). Innehållet har flyttat
till `katrineholm.se` **med samma sökväg**, och sidan lever:

```diff
   id: 'komvux-katrineholm-flera-kurser',
-    infoUrl: 'https://www.viadidakt.se/vuxenutbildning/start/komvux/validering-och-provning.html',
+    infoUrl:
+      'https://www.katrineholm.se/vuxenutbildning/start/komvux/validering-och-provning.html',
```

`registrationUrl: 'https://katrineholm.alvis.se/provning/amnesomrade'` svarar
200 och behöver inte ändras.

**Bonus:** den nya sidan publicerar anmälningsperioderna – _"1 januari –
26 januari och 1 augusti – 1 september"_. När du godkänt länkbytet kan
listningen gå från ofastställd till:

```
applicationStart: '2027-01-01',
applicationEnd: '2027-01-26',
confirmed: true,
```

Jag har lämnat den ofastställd så länge, eftersom `infoUrl` ska peka på sidan
där anordnaren skriver datumen appen visar – och den sidan är inte i datan än.

### b) Västerås – anordnarens egen länk är trasig

`https://vasteras.alvis.se/provning/amnesomrade` ger 404 (redirectar till
`/StatusCode/404`). Samma sökväg fungerar hos Huddinge, Katrineholm och
Östersund, så det är Västerås install som bytt. `vasteras.se` länkar
fortfarande dit – alltså deras eget trasiga länk – men länkar också till
Alvis-startsidan, som fungerar:

```diff
   id: 'vuxenutbildningscentrum-vasteras-edstromska-m-fl-vasteras-fl',
-    registrationUrl: 'https://vasteras.alvis.se/provning/amnesomrade',
+    registrationUrl: 'https://vasteras.alvis.se/',
```

Alternativ: `https://vasteras.alvis.se/hittakurser` (880 kurser, kräver att
användaren filtrerar själv). Startsidan är ett grundare men ärligare mål.

### c) Motala – 404 just nu, men troligen bara mellan perioderna

`https://etjanst.motala.se/provning` ger 404. Motalas egen prövningssida länkar
fortfarande dit, och deras anmälningsperiod är 2 januari–15 februari 2027.
Sannolikt stängd e-tjänst snarare än flyttad.

**Mitt förslag: ändra ingenting, kolla igen 2 januari.** Byter vi nu till
e-tjänstindexet tappar vi djuplänken som förmodligen kommer tillbaka.

### d) Östersund – inte död, bara botblockerad

`https://www.larcentrum.se/ostersund/provning/` ger 403 till sweepen men 200
med en vanlig browser-user-agent (jag läste sidan i dag). Det är precis
mönstret som `BOT_BLOCKED` finns för:

```diff
 const BOT_BLOCKED = [
   'komvuxsodermalm.stockholm',
   'www.landskrona.se',
+  // Kontrollerad för hand 2026-10-28: 403 till sweepen, 200 med
+  // browser-user-agent. Sidan lever och uppdaterades 2026-09-28.
+  'www.larcentrum.se',
   'komvuxskarholmen.stockholm',
 ];
```

Priset är det README beskriver: en länk som faktiskt dör där måste upptäckas
för hand. Din kallelse.

### e) Landskrona – oförändrat läge

`www.landskrona.se` ligger redan i `BOT_BLOCKED` och rapporteras som "kunde
inte kontrolleras". Den svarar 503 även med browser-user-agent, så den är
fortfarande inte läsbar maskinellt.

## 3. Nya/ändrade prövningstillfällen för befintliga skolor

Alla 35 anordnare jag läste om i dag är avhandlade under punkt 1 – de nya
terminerna är inlagda i de befintliga listningarna, inte som nya kort, eftersom
"samma skola och kurs listas en gång".

Två saker jag såg men **inte** har rört, för att de är dina beslut:

- **Iris Upplands Väsby** erbjuder från hösten 2026 **två skilda prövningar**
  (en för dig som saknar/vill höja betyg, en för dig som har F från Komvux och
  måste ladda upp betygsutdrag), med 25 platser vardera och olika
  anmälningsflöden. I dag är det ett kort. Två flöden med olika behörighetskrav
  kan vara det som motiverar två kort – men det är samma kurs, så regeln säger
  nej. Vill du att jag delar på dem?
- **Medlearn och Iris publicerar 4–5 tillfällen framåt** (t.o.m. november 2027).
  Datan bär bara `nextPeriod`, så resten går förlorad. Om du vill visa "nästa
  fyra tillfällen" är det en typändring, inte en datauppdatering.

## 4. `npm test && npm run typecheck && npm run lint`

Allt grönt före båda commitarna: **2662 tester**, `tsc -b` rent, `eslint` rent,
`prettier --check` rent.

### En sak du bör titta på

Två testfall i `src/lib/askProvningar.test.ts` föll på den nya datan, och jag
har skrivit om dem:

- `keeps a deadline out of the results it promises are before it`
- `flags the answer when it had to drop the constraints to find anything`

Garantin de skyddar håller fortfarande – jag kontrollerade det innan jag rörde
dem: `fallsBefore` avvisar en ofastställd period, och `widened` sätts sant
precis när strikt sökning är tom. Men frågorna de ställde ("Matematik 1b innan
oktober", "Historia 1b i Göteborg") pekade på omgångar som inte finns kvar.
"Matematik 1b innan december" ger fortfarande `widened=false` med båda träffarna
före gränsen.

De ställer nu samma krav till hela datasetet i stället för till en enskild
listning: alla kurser × "innan december" för deadline-löftet, och alla
kurs/stad-par för vidgningsflaggan. Båda räknar sina träffar och kräver
`> 0`, så de kan inte bli tomma och passera tyst. **Det är den enda ändringen
i körningen som inte är ren data – värd en egen titt.**

Tre `verifiedAt`-konstanter (`THIN_LAN_VERIFIED`, `FULL_SWEEP_VERIFIED`,
`AUG_26_VERIFIED`) blev oanvända när deras sista listningar flyttades till
`OCT_28_VERIFIED`, och är borttagna – `tsc` vägrar annars.

## Vad jag inte gjorde

Engångsbyggena A–D är inte påbörjade. De ska enligt din egen instruktion köras
var för sig, en fråga per session, och tre av dem (B:s integritetstext, C:s
borttagningslista, A:s val av inloggningsmetod) vill ha ett svar från dig först.
