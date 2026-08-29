// db.js — Capa de persistencia (IndexedDB)
const DB_NAME = 'patrimonio_db';
const DB_VERSION = 1;

const STORES = {
  ingresos: 'id',
  gastos: 'id',
  inversiones: 'id',
  activos: 'id',
  deudas: 'id',
  metas: 'id',
  patrimonio_snapshots: 'id', // {id, fecha, activos, pasivos, patrimonio}
  config: 'key' // {key, value} -> fondo_emergencia_meta_meses, tasa_retiro, moneda_base, etc.
};

let _db = null;

export function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      for (const [name, keyPath] of Object.entries(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath, autoIncrement: keyPath === 'id' });
          if (name !== 'config') store.createIndex('fecha', 'fecha', { unique: false });
        }
      }
    };
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror = (e) => reject(e.target.error);
  });
}

function tx(storeName, mode = 'readonly') {
  return openDB().then(db => db.transaction(storeName, mode).objectStore(storeName));
}

export async function dbAdd(storeName, record) {
  const store = await tx(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.add(record);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbPut(storeName, record) {
  const store = await tx(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(record);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbDelete(storeName, key) {
  const store = await tx(storeName, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function dbGetAll(storeName) {
  const store = await tx(storeName, 'readonly');
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function dbGet(storeName, key) {
  const store = await tx(storeName, 'readonly');
  return new Promise((resolve, reject) => {
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function dbClearAll() {
  const db = await openDB();
  const names = Array.from(db.objectStoreNames);
  const t = db.transaction(names, 'readwrite');
  names.forEach(n => t.objectStore(n).clear());
  return new Promise((resolve, reject) => {
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

// ---- Backup / restauración ----
export async function exportBackup() {
  const db = await openDB();
  const names = Array.from(db.objectStoreNames);
  const data = {};
  for (const n of names) data[n] = await dbGetAll(n);
  return {
    meta: { version: DB_VERSION, exportado: new Date().toISOString() },
    data
  };
}

export async function importBackup(backup, { overwrite = false } = {}) {
  if (!backup || !backup.data) throw new Error('Backup inválido');
  if (overwrite) await dbClearAll();
  const db = await openDB();
  for (const [storeName, records] of Object.entries(backup.data)) {
    if (!db.objectStoreNames.contains(storeName)) continue;
    for (const r of records) await dbPut(storeName, r);
  }
}

export { STORES };
