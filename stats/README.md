# Statistik

Så här används [Prövningar](https://xn--prvningar-17a.se). Siffrorna samlas in av
appens egen räknare (`collector/`) och skrivs hit av
[`.github/workflows/stats.yml`](../.github/workflows/stats.yml) en gång per dygn — det
finns ingen instrumentpanel någon annanstans, och ingen tredje part som ser besökarna.

**Filen är genererad.** Ändringar här skrivs över vid nästa körning; räkningen ändras i
`collector/worker.js` och i `src/lib/analytics.ts`.

## Senaste 30 dygnen (t.o.m. 2026-10-29)

| Besök | Sidvisningar | Till anmälan |
| ----- | ------------ | ------------ |
| 89 | 255 | 70 |

### Per dygn

| Dygn | Besök | Sidvisningar | Till anmälan |
| ---- | ----- | ------------ | ------------ |
| 2026-10-29 | 1 | 3 | 0 |
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

### Flikar

| Namn | Antal |
| ---- | ----- |
| Upptäck | 147 |
| Community | 34 |
| Mina prövningar | 32 |
| Historik | 25 |
| AI-prövning | 15 |
| Profil | 2 |

### Händelser

| Namn | Antal |
| ---- | ----- |
| Prövning öppnad | 152 |
| Till anmälan | 70 |
| AI-fråga ställd | 12 |
| Bevakning skapad | 2 |
| Kalenderfil hämtad | 1 |

### Kommuner i öppnade prövningar

| Namn | Antal |
| ---- | ----- |
| Stockholm | 50 |
| Göteborg | 44 |
| Södertälje | 19 |
| Eskilstuna | 12 |
| Linköping | 12 |
| Sollentuna | 11 |
| Laholm | 10 |
| Kristianstad | 9 |
| Varberg | 7 |
| Solna | 6 |

### Ämnen

| Namn | Antal |
| ---- | ----- |
| Flera ämnen | 54 |
| Matematik | 41 |
| Fysik | 21 |
| Engelska | 16 |
| Kemi | 11 |
| Svenska | 4 |
| Naturkunskap | 3 |
| Vård och omsorg | 2 |
| Historia | 1 |
| Religionskunskap | 1 |

## Vad som inte står här

Inga besökar-id, inga IP-adresser, ingen user agent och ingen fritext — det som skrivs i
sökrutan eller till AI-prövning lämnar aldrig enheten. Raderna är summor per dygn, så två
besök går inte att skilja åt ens i råtabellen, och "besök" räknas en gång per
webbläsarsession utan något som följer med till nästa. Statistiken finns bara för dem som
sagt ja i appens samtyckesruta.

<sub>Uppdaterad 2026-10-29T08:37:06.200Z.</sub>
