# Statistik

Så här används [Prövningar](https://xn--prvningar-17a.se). Siffrorna samlas in av
appens egen räknare (`collector/`) och skrivs hit av
[`.github/workflows/stats.yml`](../.github/workflows/stats.yml) en gång per dygn — det
finns ingen instrumentpanel någon annanstans, och ingen tredje part som ser besökarna.

**Filen är genererad.** Ändringar här skrivs över vid nästa körning; räkningen ändras i
`collector/worker.js` och i `src/lib/analytics.ts`.

## Senaste 30 dygnen (t.o.m. 2026-11-09)

| Besök | Sidvisningar | Till anmälan |
| ----- | ------------ | ------------ |
| 636 | 863 | 60 |

### Per dygn

| Dygn | Besök | Sidvisningar | Till anmälan |
| ---- | ----- | ------------ | ------------ |
| 2026-11-08 | 1 | 1 | 0 |
| 2026-11-07 | 1 | 1 | 0 |
| 2026-11-06 | 2 | 4 | 2 |
| 2026-11-05 | 8 | 20 | 4 |
| 2026-11-04 | 3 | 3 | 2 |
| 2026-11-03 | 1 | 1 | 0 |
| 2026-11-02 | 2 | 100 | 1 |
| 2026-11-01 | 2 | 4 | 2 |
| 2026-10-31 | 3 | 13 | 0 |
| 2026-10-30 | 553 | 553 | 1 |
| 2026-10-29 | 4 | 10 | 5 |
| 2026-10-28 | 7 | 34 | 5 |
| 2026-10-27 | 4 | 6 | 4 |
| 2026-10-26 | 4 | 15 | 0 |
| 2026-10-25 | 1 | 2 | 1 |
| 2026-10-24 | 1 | 1 | 0 |
| 2026-10-23 | 1 | 3 | 0 |
| 2026-10-22 | 5 | 11 | 2 |
| 2026-10-21 | 9 | 18 | 8 |
| 2026-10-20 | 5 | 8 | 4 |
| 2026-10-19 | 3 | 8 | 5 |
| 2026-10-18 | 1 | 1 | 0 |
| 2026-10-17 | 0 | 1 | 0 |
| 2026-10-16 | 1 | 1 | 11 |
| 2026-10-14 | 1 | 6 | 0 |
| 2026-10-13 | 4 | 16 | 2 |
| 2026-10-12 | 6 | 16 | 1 |
| 2026-10-11 | 3 | 6 | 0 |

### Flikar

| Namn | Antal |
| ---- | ----- |
| Upptäck | 692 |
| Community | 51 |
| Mina prövningar | 47 |
| Historik | 40 |
| AI-prövning | 27 |
| Profil | 6 |

### Händelser

| Namn | Antal |
| ---- | ----- |
| Prövning öppnad | 138 |
| Till anmälan | 60 |
| AI-fråga ställd | 5 |
| Bevakning skapad | 3 |

### Kommuner i öppnade prövningar

| Namn | Antal |
| ---- | ----- |
| Stockholm | 60 |
| Göteborg | 26 |
| Sollentuna | 21 |
| Södertälje | 18 |
| Laholm | 15 |
| Eskilstuna | 14 |
| Solna | 6 |
| Linköping | 5 |
| Örebro | 4 |
| Enköping | 3 |

### Ämnen

| Namn | Antal |
| ---- | ----- |
| Flera ämnen | 51 |
| Matematik | 43 |
| Engelska | 16 |
| Fysik | 15 |
| Kemi | 8 |
| Naturkunskap | 4 |
| Vård och omsorg | 2 |
| Svenska | 1 |

## Vad som inte står här

Inga besökar-id, inga IP-adresser, ingen user agent och ingen fritext — det som skrivs i
sökrutan eller till AI-prövning lämnar aldrig enheten. Raderna är summor per dygn, så två
besök går inte att skilja åt ens i råtabellen, och "besök" räknas en gång per
webbläsarsession utan något som följer med till nästa. Statistiken finns bara för dem som
sagt ja i appens samtyckesruta.

<sub>Uppdaterad 2026-11-09T09:54:37.617Z.</sub>
