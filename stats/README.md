# Statistik

Så här används [Prövningar](https://xn--prvningar-17a.se). Siffrorna samlas in av
appens egen räknare (`collector/`) och skrivs hit av
[`.github/workflows/stats.yml`](../.github/workflows/stats.yml) en gång per dygn — det
finns ingen instrumentpanel någon annanstans, och ingen tredje part som ser besökarna.

**Filen är genererad.** Ändringar här skrivs över vid nästa körning; räkningen ändras i
`collector/worker.js` och i `src/lib/analytics.ts`.

## Senaste 30 dygnen (t.o.m. 2026-10-13)

| Besök | Sidvisningar | Till anmälan |
| ----- | ------------ | ------------ |
| 95 | 281 | 55 |

### Per dygn

| Dygn | Besök | Sidvisningar | Till anmälan |
| ---- | ----- | ------------ | ------------ |
| 2026-10-13 | 1 | 1 | 0 |
| 2026-10-12 | 6 | 16 | 1 |
| 2026-10-11 | 3 | 6 | 0 |
| 2026-10-10 | 1 | 5 | 1 |
| 2026-10-09 | 3 | 11 | 0 |
| 2026-10-08 | 5 | 8 | 3 |
| 2026-10-07 | 3 | 4 | 1 |
| 2026-10-06 | 2 | 8 | 0 |
| 2026-10-05 | 2 | 9 | 7 |
| 2026-10-04 | 1 | 7 | 0 |
| 2026-10-03 | 2 | 2 | 2 |
| 2026-10-02 | 5 | 17 | 5 |
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

### Flikar

| Namn | Antal |
| ---- | ----- |
| Upptäck | 168 |
| Mina prövningar | 33 |
| Community | 30 |
| AI-prövning | 23 |
| Historik | 16 |
| Profil | 11 |

### Händelser

| Namn | Antal |
| ---- | ----- |
| Prövning öppnad | 142 |
| Till anmälan | 55 |
| AI-fråga ställd | 10 |
| Bevakning skapad | 2 |
| Kalenderfil hämtad | 1 |
| Prövning sparad | 1 |

### Kommuner i öppnade prövningar

| Namn | Antal |
| ---- | ----- |
| Örebro | 41 |
| Göteborg | 30 |
| Stockholm | 30 |
| Malmö | 17 |
| Kristianstad | 9 |
| Varberg | 9 |
| Linköping | 8 |
| Södertälje | 8 |
| Mora | 6 |
| Skellefteå | 6 |

### Ämnen

| Namn | Antal |
| ---- | ----- |
| Matematik | 29 |
| Kemi | 27 |
| Flera ämnen | 26 |
| Fysik | 21 |
| Svenska | 17 |
| Engelska | 9 |
| Psykologi | 5 |
| Naturkunskap | 4 |
| Biologi | 1 |
| Historia | 1 |

## Vad som inte står här

Inga besökar-id, inga IP-adresser, ingen user agent och ingen fritext — det som skrivs i
sökrutan eller till AI-prövning lämnar aldrig enheten. Raderna är summor per dygn, så två
besök går inte att skilja åt ens i råtabellen, och "besök" räknas en gång per
webbläsarsession utan något som följer med till nästa. Statistiken finns bara för dem som
sagt ja i appens samtyckesruta.

<sub>Uppdaterad 2026-10-13T09:31:32.536Z.</sub>
