# Progetto: Allenamenti PWA (Pixel 8)

## Obiettivo
PWA installabile su Pixel 8 (schermata Home, offline, senza store) per:
1. Visualizzare allenamenti (nuoto/casa) uno alla volta con navigazione
2. Segnare allenamenti come completati (con data)
3. Importare nuovi allenamenti da un blob JSON incollato in chat

## Decisioni chiave (NON cambiare senza motivo)
- **Storage**: IndexedDB, DB name `allenamenti-db`, versionato. Dati SEPARATI dal codice:
  aggiornare i file dell'app non tocca mai i dati salvati.
- **Formato import**: JSON compatto (chiavi corte), non CSV — più efficiente per struttura annidata.
  Schema definito in `SCHEMA.md`.
- **Stack**: HTML/CSS/JS vanilla, no build step, no framework (così è un singolo set di file
  statici facili da aggiornare a mano o rigenerare in chat).
- **Nessuna pubblicazione store**: installazione via "Aggiungi a schermata Home" da Chrome Android.

## Struttura file (in /mnt/user-data/outputs/allenamenti-app/)
- `index.html` — shell app (header, nav, container)
- `app.js` — logica: routing view, rendering schede, storage, import
- `db.js` — wrapper IndexedDB (get/set allenamenti, get/set completamenti, versioning)
- `style.css` — stile (ripulito dall'HTML originale, essenziale)
- `manifest.json` — manifest PWA (nome, icone, colori, display standalone)
- `sw.js` — service worker (cache offline, no perdita funzionalità senza rete)
- `icons/` — icone PWA (192, 512)
- `seed-data.json` — i 10 allenamenti originali, formato JSON schema definito

## Stato avanzamento
- [x] Architettura definita
- [x] db.js (wrapper IndexedDB + versioning/migrazioni)
- [x] seed-data.json (conversione dei 10 allenamenti esistenti nel nuovo schema, validato)
- [x] style.css (ripulito, mobile-first, essenziale)
- [x] index.html (shell + view singolo allenamento + tabbar Import)
- [x] app.js (rendering, navigazione, swipe, completamento, import con conferma sovrascrittura)
- [x] manifest.json + icone (192/512, placeholder semplice — sostituibili in futuro)
- [x] sw.js (offline, cache versionata v1 — NON tocca mai IndexedDB)
- [x] Test: file serviti correttamente via http.server locale, sintassi JS validata
- [x] Istruzioni installazione su Pixel 8 (vedi risposta in chat / README)

## Stato: v1 consegnata, v2 completata
v2 (dopo hosting su GitHub):
- [x] Cancellazione allenamento (db.js: deleteAllenamento, rimuove anche il completamento associato)
- [x] Filtro/distinzione netta Nuoto/Casa: tab filtro Tutti/Nuoto/Casa + bordo superiore colorato sulla scheda (blu=nuoto, verde=casa)
- [x] Schema import salvato in memoria di progetto in un file dedicato e autosufficiente
  (area "allenamenti-import-schema"), cosicché un'altra chat del progetto possa generare
  correttamente i JSON da importare senza dover rileggere questo progetto intero
- [x] Service worker cache bump a v2 (necessario perché l'app è ora hostata su GitHub Pages:
  senza il bump gli utenti vedrebbero ancora i file vecchi cacheati)

Prossimi possibili sviluppi (non richiesti ora, solo annotati):
- Icone più curate (attuali sono placeholder geometrici semplici)
- Ricerca allenamenti se la lista cresce molto
- Export dati (backup manuale dei completamenti)

## Come riprendere se la sessione si interrompe
Nella prossima chat di questo progetto: leggere questo file (`PROGRESS.md`) e `SCHEMA.md`,
controllare quali file esistono già in outputs, continuare dal primo step non spuntato.
