# Statistik

Så här används [Prövningar](https://xn--prvningar-17a.se). Siffrorna samlas in av
appens egen räknare (`collector/`) och skrivs hit av
[`.github/workflows/stats.yml`](../.github/workflows/stats.yml) en gång per dygn — det
finns ingen instrumentpanel någon annanstans, och ingen tredje part som ser besökarna.

**Filen är genererad.** Ändringar här skrivs över vid nästa körning; räkningen ändras i
`collector/worker.js` och i `src/lib/analytics.ts`.

## Senaste 30 dygnen (t.o.m. 2026-09-28)

| Besök | Sidvisningar | Till anmälan |
| ----- | ------------ | ------------ |
| 60 | 172 | 28 |

### Per dygn

| Dygn | Besök | Sidvisningar | Till anmälan |
| ---- | ----- | ------------ | ------------ |
| 2026-09-27 | 6 | 8 | 3 |
| 2026-09-26 | 3 | 3 | 3 |
| 2026-09-25 | 4 | 7 | 0 |
| 2026-09-24 | 2 | 2 | 1 |
| 2026-09-23 | 1 | 1 | 0 |
| 2026-09-22 | 7 | 39 | 0 |
| 2026-09-21 | 3 | 10 | 0 |
| 2026-09-20 | 1 | 15 | 0 |
| 2026-09-18 | 4 | 8 | 3 |
| 2026-09-17 | 2 | 2 | 2 |
| 2026-09-16 | 1 | 5 | 0 |
| 2026-09-15 | 5 | 36 | 7 |
| 2026-09-14 | 13 | 21 | 7 |
| 2026-09-13 | 4 | 12 | 1 |
| 2026-09-11 | 4 | 3 | 1 |

### Flikar

| Namn | Antal |
| ---- | ----- |
| Upptäck | 104 |
| Mina prövningar | 19 |
| Community | 15 |
| AI-prövning | 14 |
| Historik | 10 |
| Profil | 10 |

### Händelser

| Namn | Antal |
| ---- | ----- |
| Prövning öppnad | 92 |
| Till anmälan | 28 |
| AI-fråga ställd | 2 |
| Bevakning skapad | 2 |
| Prövning sparad | 1 |

### Kommuner i öppnade prövningar

| Namn | Antal |
| ---- | ----- |
| Örebro | 48 |
| Malmö | 17 |
| Stockholm | 17 |
| Göteborg | 9 |
| Mora | 6 |
| Norrköping | 5 |
| Skellefteå | 5 |
| Sollentuna | 5 |
| Laholm | 2 |
| Linköping | 2 |

### Ämnen

| Namn | Antal |
| ---- | ----- |
| Kemi | 25 |
| Matematik | 18 |
| Svenska | 14 |
| Engelska | 13 |
| Fysik | 12 |
| Flera ämnen | 4 |
| Psykologi | 3 |
| Biologi | 1 |
| Juridik | 1 |
| Naturkunskap | 1 |

## Vad som inte står här

Inga besökar-id, inga IP-adresser, ingen user agent och ingen fritext — det som skrivs i
sökrutan eller till AI-prövning lämnar aldrig enheten. Raderna är summor per dygn, så två
besök går inte att skilja åt ens i råtabellen, och "besök" räknas en gång per
webbläsarsession utan något som följer med till nästa. Statistiken finns bara för dem som
sagt ja i appens samtyckesruta.

<sub>Uppdaterad 2026-09-28T08:45:58.070Z.</sub>
