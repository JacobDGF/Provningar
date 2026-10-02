# Statistik

Så här används [Prövningar](https://xn--prvningar-17a.se). Siffrorna samlas in av
appens egen räknare (`collector/`) och skrivs hit av
[`.github/workflows/stats.yml`](../.github/workflows/stats.yml) en gång per dygn — det
finns ingen instrumentpanel någon annanstans, och ingen tredje part som ser besökarna.

**Filen är genererad.** Ändringar här skrivs över vid nästa körning; räkningen ändras i
`collector/worker.js` och i `src/lib/analytics.ts`.

## Senaste 30 dygnen (t.o.m. 2026-10-02)

| Besök | Sidvisningar | Till anmälan |
| ----- | ------------ | ------------ |
| 69 | 202 | 37 |

### Per dygn

| Dygn | Besök | Sidvisningar | Till anmälan |
| ---- | ----- | ------------ | ------------ |
| 2026-10-01 | 5 | 16 | 8 |
| 2026-09-30 | 3 | 12 | 0 |
| 2026-09-28 | 1 | 2 | 1 |
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
| Upptäck | 122 |
| Mina prövningar | 22 |
| Community | 19 |
| AI-prövning | 17 |
| Historik | 12 |
| Profil | 10 |

### Händelser

| Namn | Antal |
| ---- | ----- |
| Prövning öppnad | 108 |
| Till anmälan | 37 |
| AI-fråga ställd | 6 |
| Bevakning skapad | 2 |
| Prövning sparad | 1 |

### Kommuner i öppnade prövningar

| Namn | Antal |
| ---- | ----- |
| Örebro | 48 |
| Stockholm | 19 |
| Malmö | 18 |
| Göteborg | 15 |
| Mora | 6 |
| Norrköping | 5 |
| Skellefteå | 5 |
| Sollentuna | 5 |
| Södertälje | 4 |
| Varberg | 4 |

### Ämnen

| Namn | Antal |
| ---- | ----- |
| Kemi | 27 |
| Matematik | 19 |
| Svenska | 15 |
| Engelska | 14 |
| Fysik | 13 |
| Flera ämnen | 11 |
| Psykologi | 5 |
| Biologi | 1 |
| Juridik | 1 |
| Naturkunskap | 1 |

## Vad som inte står här

Inga besökar-id, inga IP-adresser, ingen user agent och ingen fritext — det som skrivs i
sökrutan eller till AI-prövning lämnar aldrig enheten. Raderna är summor per dygn, så två
besök går inte att skilja åt ens i råtabellen, och "besök" räknas en gång per
webbläsarsession utan något som följer med till nästa. Statistiken finns bara för dem som
sagt ja i appens samtyckesruta.

<sub>Uppdaterad 2026-10-02T08:37:51.711Z.</sub>
