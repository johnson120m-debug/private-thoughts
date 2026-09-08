export type Note = {
  id: string;
  title: string;
  createdAt: number;
  duration: number;
  mimeType: string;
  blob: Blob;
};

const DB_NAME = "thoughts";
const DB_VERSION = 1;
const NOTES = "notes";
const META = "meta";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(NOTES)) db.createObjectStore(NOTES, { keyPath: "id" });
        if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export const listNotes = async (): Promise<Note[]> => {
  const all = await tx<Note[]>(NOTES, "readonly", (s) => s.getAll() as IDBRequest<Note[]>);
  return all.sort((a, b) => b.createdAt - a.createdAt);
};

export const putNote = (note: Note) =>
  tx<IDBValidKey>(NOTES, "readwrite", (s) => s.put(note) as IDBRequest<IDBValidKey>);

export const deleteNote = (id: string) =>
  tx<undefined>(NOTES, "readwrite", (s) => s.delete(id) as IDBRequest<undefined>);

export const getMeta = <T,>(key: string) =>
  tx<T | undefined>(META, "readonly", (s) => s.get(key) as IDBRequest<T | undefined>);

export const setMeta = (key: string, value: unknown) =>
  tx<IDBValidKey>(META, "readwrite", (s) => s.put(value, key) as IDBRequest<IDBValidKey>);
