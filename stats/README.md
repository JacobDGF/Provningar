# Statistik

Så här används [Prövningar](https://xn--prvningar-17a.se). Siffrorna samlas in av
appens egen räknare (`collector/`) och skrivs hit av
[`.github/workflows/stats.yml`](../.github/workflows/stats.yml) en gång per dygn — det
finns ingen instrumentpanel någon annanstans, och ingen tredje part som ser besökarna.

**Filen är genererad.** Ändringar här skrivs över vid nästa körning; räkningen ändras i
`collector/worker.js` och i `src/lib/analytics.ts`.

## Senaste 30 dygnen (t.o.m. 2026-09-16)

| Besök | Sidvisningar | Till anmälan |
| ----- | ------------ | ------------ |
| 26 | 72 | 16 |

### Per dygn

| Dygn | Besök | Sidvisningar | Till anmälan |
| ---- | ----- | ------------ | ------------ |
| 2026-09-15 | 5 | 36 | 7 |
| 2026-09-14 | 13 | 21 | 7 |
| 2026-09-13 | 4 | 12 | 1 |
| 2026-09-11 | 4 | 3 | 1 |

### Flikar

| Namn | Antal |
| ---- | ----- |
| Upptäck | 49 |
| Community | 8 |
| Mina prövningar | 5 |
| Historik | 4 |
| AI-prövning | 3 |
| Profil | 3 |

### Händelser

| Namn | Antal |
| ---- | ----- |
| Prövning öppnad | 41 |
| Till anmälan | 16 |
| Bevakning skapad | 2 |

### Kommuner i öppnade prövningar

| Namn | Antal |
| ---- | ----- |
| Örebro | 22 |
| Malmö | 9 |
| Stockholm | 8 |
| Mora | 6 |
| Skellefteå | 4 |
| Sollentuna | 3 |
| Linköping | 2 |
| Motala | 2 |
| Norrköping | 2 |
| Södertälje | 1 |

### Ämnen

| Namn | Antal |
| ---- | ----- |
| Kemi | 13 |
| Engelska | 12 |
| Svenska | 10 |
| Fysik | 3 |
| Matematik | 2 |
| Flera ämnen | 1 |

## Vad som inte står här

Inga besökar-id, inga IP-adresser, ingen user agent och ingen fritext — det som skrivs i
sökrutan eller till AI-prövning lämnar aldrig enheten. Raderna är summor per dygn, så två
besök går inte att skilja åt ens i råtabellen, och "besök" räknas en gång per
webbläsarsession utan något som följer med till nästa. Statistiken finns bara för dem som
sagt ja i appens samtyckesruta.

<sub>Uppdaterad 2026-09-16T07:45:02.831Z.</sub>
