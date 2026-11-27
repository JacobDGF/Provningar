# Statistik

Så här används [Prövningar](https://xn--prvningar-17a.se). Siffrorna samlas in av
appens egen räknare (`collector/`) och skrivs hit av
[`.github/workflows/stats.yml`](../.github/workflows/stats.yml) en gång per dygn — det
finns ingen instrumentpanel någon annanstans, och ingen tredje part som ser besökarna.

**Filen är genererad.** Ändringar här skrivs över vid nästa körning; räkningen ändras i
`collector/worker.js` och i `src/lib/analytics.ts`.

## Senaste 30 dygnen (t.o.m. 2026-11-27)

| Besök | Sidvisningar | Till anmälan |
| ----- | ------------ | ------------ |
| 642 | 886 | 42 |

### Per dygn

| Dygn | Besök | Sidvisningar | Till anmälan |
| ---- | ----- | ------------ | ------------ |
| 2026-11-27 | 2 | 11 | 1 |
| 2026-11-26 | 5 | 18 | 3 |
| 2026-11-25 | 1 | 2 | 0 |
| 2026-11-24 | 6 | 6 | 1 |
| 2026-11-23 | 4 | 14 | 6 |
| 2026-11-21 | 3 | 5 | 0 |
| 2026-11-20 | 3 | 3 | 0 |
| 2026-11-19 | 3 | 5 | 1 |
| 2026-11-18 | 5 | 13 | 3 |
| 2026-11-17 | 4 | 9 | 1 |
| 2026-11-16 | 1 | 1 | 1 |
| 2026-11-15 | 3 | 5 | 4 |
| 2026-11-14 | 2 | 7 | 1 |
| 2026-11-13 | 4 | 6 | 0 |
| 2026-11-12 | 5 | 32 | 0 |
| 2026-11-11 | 3 | 14 | 0 |
| 2026-11-10 | 6 | 15 | 1 |
| 2026-11-09 | 2 | 10 | 2 |
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

### Flikar

| Namn | Antal |
| ---- | ----- |
| Upptäck | 734 |
| Mina prövningar | 43 |
| Community | 42 |
| AI-prövning | 30 |
| Historik | 29 |
| Profil | 8 |

### Händelser

| Namn | Antal |
| ---- | ----- |
| Prövning öppnad | 116 |
| Till anmälan | 42 |
| AI-fråga ställd | 6 |
| Bevakning skapad | 2 |
| Prövning sparad | 2 |
| Kalenderfil hämtad | 1 |

### Kommuner i öppnade prövningar

| Namn | Antal |
| ---- | ----- |
| Stockholm | 53 |
| Sollentuna | 27 |
| Södertälje | 23 |
| Laholm | 12 |
| Örebro | 11 |
| Göteborg | 9 |
| Eskilstuna | 6 |
| Malmö | 6 |
| Hudiksvall | 2 |
| Linköping | 2 |

### Ämnen

| Namn | Antal |
| ---- | ----- |
| Flera ämnen | 34 |
| Matematik | 31 |
| Engelska | 19 |
| Fysik | 15 |
| Kemi | 11 |
| Naturkunskap | 3 |
| Samhällskunskap | 2 |
| Biologi | 1 |
| Moderna språk | 1 |
| Svenska för invandrare | 1 |

## Vad som inte står här

Inga besökar-id, inga IP-adresser, ingen user agent och ingen fritext — det som skrivs i
sökrutan eller till AI-prövning lämnar aldrig enheten. Raderna är summor per dygn, så två
besök går inte att skilja åt ens i råtabellen, och "besök" räknas en gång per
webbläsarsession utan något som följer med till nästa. Statistiken finns bara för dem som
sagt ja i appens samtyckesruta.

<sub>Uppdaterad 2026-11-27T10:58:33.308Z.</sub>
