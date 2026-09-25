/**
 * 照片外部化存储抽象层（可选）。
 *
 * - H5：IndexedDB 实现（容量大，不占 localStorage 配额，适合大量衣物照片）
 * - 原生 / 小程序：可替换为 Capacitor Filesystem 实现同一接口
 * - exportAll / importAll 即「坚果云同步」的对接点：把照片 JSON 导出到网盘，或下载后合并导入
 *
 * 当前 item-edit 仍把压缩后的 dataURL 直接存 Item.photoPath（保证 H5 立即可跑）；
 * 当衣物数量增多、localStorage 接近 5MB 配额时，可切换到此处存储（存 id，渲染时 getPhoto(id)）。
 */

const DB_NAME = 'storage-inventory-photos';
const STORE = 'photos';
const VERSION = 1;

export interface StoredPhoto {
  id: string;
  dataUrl: string;
  bytes: number;
  format: string;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable in this environment'));
      return;
    }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function runTx(db: IDBDatabase, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    fn(t.objectStore(STORE));
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

function runReq<T>(db: IDBDatabase, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const r = fn(t.objectStore(STORE));
    r.onsuccess = () => resolve(r.result as T);
    r.onerror = () => reject(r.error);
  });
}

export async function savePhoto(photo: Omit<StoredPhoto, 'createdAt'> & { createdAt?: number }): Promise<string> {
  const db = await openDB();
  const rec: StoredPhoto = { ...photo, createdAt: photo.createdAt ?? Date.now() };
  await runTx(db, 'readwrite', store => store.put(rec));
  db.close();
  return rec.id;
}

export async function getPhoto(id: string): Promise<string | null> {
  const db = await openDB();
  const rec = await runReq<StoredPhoto | undefined>(db, 'readonly', store => store.get(id));
  db.close();
  return rec?.dataUrl ?? null;
}

export async function listPhotos(): Promise<StoredPhoto[]> {
  const db = await openDB();
  const all = await runReq<StoredPhoto[]>(db, 'readonly', store => store.getAll());
  db.close();
  return all ?? [];
}

/** 导出全部照片为 JSON 字符串，供坚果云等网盘同步（上传方） */
export async function exportAll(): Promise<string> {
  const photos = await listPhotos();
  return JSON.stringify({ app: 'storage-inventory', version: 1, exportedAt: Date.now(), photos }, null, 2);
}

/** 从 JSON 合并导入（按 id 覆盖），返回导入条数。供坚果云同步（下载方） */
export async function importAll(json: string): Promise<number> {
  const data = JSON.parse(json);
  const photos: StoredPhoto[] = Array.isArray(data?.photos) ? data.photos : [];
  const db = await openDB();
  await runTx(db, 'readwrite', store => {
    for (const p of photos) store.put(p);
  });
  db.close();
  return photos.length;
}
