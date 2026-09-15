/**
 * db.js — wrapper IndexedDB per l'app Allenamenti.
 *
 * PRINCIPIO CHIAVE: questo file può essere sostituito/aggiornato senza MAI
 * perdere i dati già salvati, perché IndexedDB persiste sul dispositivo
 * indipendentemente dai file dell'app (proprio come i dati di un'app nativa
 * sopravvivono a un aggiornamento da Play Store).
 *
 * Store:
 *  - "allenamenti": { id, n, titolo, tipo, durata, volume, fase, sezioni, totale }
 *  - "completamenti": { id (= id allenamento), completato: bool, data: ISOString|null }
 *  - "meta": { key, value }  -> usato per versioning schema e altre info
 */

const DB_NAME = 'allenamenti-db';
const DB_VERSION = 1; // aumentare SOLO se cambia la struttura degli object store
const SCHEMA_VERSION = 1; // versione logica dei dati salvati in "meta", per migrazioni future

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('allenamenti')) {
        db.createObjectStore('allenamenti', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('completamenti')) {
        db.createObjectStore('completamenti', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
      // NOTA per futuri aggiornamenti: qui si aggiungono SOLO nuovi store o
      // migrazioni additive. Non cancellare mai uno store esistente senza
      // prima migrarne i dati altrove.
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, storeName, mode) {
  return db.transaction(storeName, mode).objectStore(storeName);
}

function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const Storage = {
  async init() {
    this.db = await openDB();
    // scrive/verifica la versione schema logica, per eventuali migrazioni future
    const store = tx(this.db, 'meta', 'readwrite');
    const existing = await promisify(store.get('schemaVersion'));
    if (!existing) {
      store.put({ key: 'schemaVersion', value: SCHEMA_VERSION });
    }
    return this;
  },

  // ---- Allenamenti ----
  async getAllAllenamenti() {
    const store = tx(this.db, 'allenamenti', 'readonly');
    const all = await promisify(store.getAll());
    return all.sort((a, b) => a.n - b.n);
  },

  async getAllenamento(id) {
    const store = tx(this.db, 'allenamenti', 'readonly');
    return promisify(store.get(id));
  },

  async saveAllenamento(allenamento) {
    const store = tx(this.db, 'allenamenti', 'readwrite');
    return promisify(store.put(allenamento));
  },

  async saveAllenamentiBulk(allenamenti) {
    const store = tx(this.db, 'allenamenti', 'readwrite');
    for (const a of allenamenti) {
      store.put(a);
    }
    return new Promise((resolve, reject) => {
      store.transaction.oncomplete = () => resolve();
      store.transaction.onerror = () => reject(store.transaction.error);
    });
  },

  async countAllenamenti() {
    const store = tx(this.db, 'allenamenti', 'readonly');
    return promisify(store.count());
  },

  // ---- Completamenti ----
  async getCompletamento(id) {
    const store = tx(this.db, 'completamenti', 'readonly');
    const res = await promisify(store.get(id));
    return res || { id, completato: false, data: null };
  },

  async getAllCompletamenti() {
    const store = tx(this.db, 'completamenti', 'readonly');
    const all = await promisify(store.getAll());
    const map = {};
    all.forEach(c => { map[c.id] = c; });
    return map;
  },

  async setCompletato(id, completato) {
    const store = tx(this.db, 'completamenti', 'readwrite');
    const record = {
      id,
      completato,
      data: completato ? new Date().toISOString() : null
    };
    await promisify(store.put(record));
    return record;
  },

  // ---- Meta / utilità ----
  async getMeta(key) {
    const store = tx(this.db, 'meta', 'readonly');
    const res = await promisify(store.get(key));
    return res ? res.value : null;
  },

  async setMeta(key, value) {
    const store = tx(this.db, 'meta', 'readwrite');
    return promisify(store.put({ key, value }));
  }
};
