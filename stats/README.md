# Statistik

Så här används [Prövningar](https://xn--prvningar-17a.se). Siffrorna samlas in av
appens egen räknare (`collector/`) och skrivs hit av
[`.github/workflows/stats.yml`](../.github/workflows/stats.yml) en gång per dygn — det
finns ingen instrumentpanel någon annanstans, och ingen tredje part som ser besökarna.

**Filen är genererad.** Ändringar här skrivs över vid nästa körning; räkningen ändras i
`collector/worker.js` och i `src/lib/analytics.ts`.

## Senaste 30 dygnen (t.o.m. 2026-10-23)

| Besök | Sidvisningar | Till anmälan |
| ----- | ------------ | ------------ |
| 86 | 213 | 68 |

### Per dygn

| Dygn | Besök | Sidvisningar | Till anmälan |
| ---- | ----- | ------------ | ------------ |
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

### Flikar

| Namn | Antal |
| ---- | ----- |
| Upptäck | 130 |
| Mina prövningar | 28 |
| Community | 24 |
| Historik | 16 |
| AI-prövning | 14 |
| Profil | 1 |

### Händelser

| Namn | Antal |
| ---- | ----- |
| Prövning öppnad | 145 |
| Till anmälan | 68 |
| AI-fråga ställd | 11 |
| Bevakning skapad | 2 |
| Kalenderfil hämtad | 1 |
| Prövning sparad | 1 |

### Kommuner i öppnade prövningar

| Namn | Antal |
| ---- | ----- |
| Stockholm | 48 |
| Göteborg | 35 |
| Örebro | 17 |
| Södertälje | 16 |
| Laholm | 11 |
| Linköping | 11 |
| Eskilstuna | 9 |
| Kristianstad | 9 |
| Sollentuna | 9 |
| Varberg | 9 |

### Ämnen

| Namn | Antal |
| ---- | ----- |
| Flera ämnen | 49 |
| Matematik | 33 |
| Fysik | 26 |
| Kemi | 14 |
| Engelska | 13 |
| Naturkunskap | 4 |
| Svenska | 4 |
| Psykologi | 2 |
| Biologi | 1 |
| Historia | 1 |

## Vad som inte står här

Inga besökar-id, inga IP-adresser, ingen user agent och ingen fritext — det som skrivs i
sökrutan eller till AI-prövning lämnar aldrig enheten. Raderna är summor per dygn, så två
besök går inte att skilja åt ens i råtabellen, och "besök" räknas en gång per
webbläsarsession utan något som följer med till nästa. Statistiken finns bara för dem som
sagt ja i appens samtyckesruta.

<sub>Uppdaterad 2026-10-23T07:39:10.668Z.</sub>
