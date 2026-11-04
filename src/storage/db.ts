import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Doc, Page, Signature } from '../core/types';

export type PageInput = Omit<Page, 'id' | 'docId'>;

export class StorageFullError extends Error {
  constructor() {
    super('El almacenamiento del dispositivo está lleno.');
    this.name = 'StorageFullError';
  }
}

export class SignatureInUseError extends Error {
  constructor(readonly count: number) {
    super(`La firma está en uso en ${count} ${count === 1 ? 'página' : 'páginas'}.`);
    this.name = 'SignatureInUseError';
  }
}

interface Schema extends DBSchema {
  docs: { key: string; value: Doc };
  pages: { key: string; value: Page; indexes: { docId: string } };
  signatures: { key: string; value: Signature };
}

let dbPromise: Promise<IDBPDatabase<Schema>> | null = null;

function db() {
  dbPromise ??= openDB<Schema>('appscan', 1, {
    upgrade(d) {
      d.createObjectStore('docs', { keyPath: 'id' });
      d.createObjectStore('pages', { keyPath: 'id' }).createIndex('docId', 'docId');
      d.createObjectStore('signatures', { keyPath: 'id' });
    },
  });
  return dbPromise;
}

export async function closeDb(): Promise<void> {
  if (dbPromise) (await dbPromise).close();
  dbPromise = null;
}

async function guarded<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if ((e as DOMException)?.name === 'QuotaExceededError') throw new StorageFullError();
    throw e;
  }
}

/** A failed write inside a transaction leaves it open; abort so it cannot commit partial work. */
function abortQuietly(tx: { abort(): void; done: Promise<unknown> }) {
  tx.done.catch(() => {});
  try { tx.abort(); } catch { /* already finished */ }
}

export async function createDoc(title: string, kind: Doc['kind'] = 'normal'): Promise<Doc> {
  const now = Date.now();
  const doc: Doc = { id: crypto.randomUUID(), title, kind, pageIds: [], createdAt: now, updatedAt: now };
  await guarded(async () => (await db()).put('docs', doc));
  return doc;
}

export async function getDoc(id: string): Promise<Doc | undefined> {
  return (await db()).get('docs', id);
}

export async function listDocs(): Promise<Doc[]> {
  const docs = await (await db()).getAll('docs');
  return docs.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function renameDoc(id: string, title: string): Promise<void> {
  const tx = (await db()).transaction('docs', 'readwrite');
  const doc = await tx.store.get(id);
  if (!doc) throw new Error('Documento no encontrado');
  await tx.store.put({ ...doc, title, updatedAt: Date.now() });
  await tx.done;
}

export async function deleteDoc(id: string): Promise<void> {
  const tx = (await db()).transaction(['docs', 'pages'], 'readwrite');
  const keys = await tx.objectStore('pages').index('docId').getAllKeys(id);
  await Promise.all(keys.map((k) => tx.objectStore('pages').delete(k)));
  await tx.objectStore('docs').delete(id);
  await tx.done;
}

export async function addPage(docId: string, input: PageInput): Promise<Page> {
  return guarded(async () => {
    const page: Page = { ...input, id: crypto.randomUUID(), docId };
    const tx = (await db()).transaction(['docs', 'pages'], 'readwrite');
    try {
      const doc = await tx.objectStore('docs').get(docId);
      if (!doc) throw new Error('Documento no encontrado');
      await tx.objectStore('pages').put(page);
      await tx.objectStore('docs').put({ ...doc, pageIds: [...doc.pageIds, page.id], updatedAt: Date.now() });
      await tx.done;
    } catch (e) {
      abortQuietly(tx);
      throw e;
    }
    return page;
  });
}

export async function getPage(id: string): Promise<Page | undefined> {
  return (await db()).get('pages', id);
}

export async function getPages(docId: string): Promise<Page[]> {
  const tx = (await db()).transaction(['docs', 'pages']);
  const doc = await tx.objectStore('docs').get(docId);
  if (!doc) return [];
  const pages = await Promise.all(doc.pageIds.map((id) => tx.objectStore('pages').get(id)));
  return pages.filter((p): p is Page => Boolean(p));
}

export async function updatePage(id: string, patch: Partial<PageInput>): Promise<Page> {
  return guarded(async () => {
    const tx = (await db()).transaction(['docs', 'pages'], 'readwrite');
    try {
      const page = await tx.objectStore('pages').get(id);
      if (!page) throw new Error('Página no encontrada');
      const next = { ...page, ...patch };
      await tx.objectStore('pages').put(next);
      const doc = await tx.objectStore('docs').get(page.docId);
      if (doc) await tx.objectStore('docs').put({ ...doc, updatedAt: Date.now() });
      await tx.done;
      return next;
    } catch (e) {
      abortQuietly(tx);
      throw e;
    }
  });
}

export async function deletePage(id: string): Promise<{ docDeleted: boolean }> {
  const tx = (await db()).transaction(['docs', 'pages'], 'readwrite');
  const page = await tx.objectStore('pages').get(id);
  if (!page) {
    await tx.done;
    return { docDeleted: false };
  }
  const doc = await tx.objectStore('docs').get(page.docId);
  await tx.objectStore('pages').delete(id);
  const remaining = doc ? doc.pageIds.filter((p) => p !== id) : [];
  if (doc && remaining.length === 0) {
    await tx.objectStore('docs').delete(doc.id);
  } else if (doc) {
    await tx.objectStore('docs').put({ ...doc, pageIds: remaining, updatedAt: Date.now() });
  }
  await tx.done;
  return { docDeleted: Boolean(doc) && remaining.length === 0 };
}

export async function reorderPages(docId: string, ids: string[]): Promise<void> {
  const tx = (await db()).transaction('docs', 'readwrite');
  const doc = await tx.store.get(docId);
  if (!doc) throw new Error('Documento no encontrado');
  const samePages = ids.length === doc.pageIds.length && new Set(ids).size === ids.length
    && ids.every((id) => doc.pageIds.includes(id));
  if (!samePages) {
    abortQuietly(tx);
    throw new Error('El nuevo orden no coincide con las páginas del documento');
  }
  await tx.store.put({ ...doc, pageIds: ids, updatedAt: Date.now() });
  await tx.done;
}

export async function mergeDocs(ids: string[], title: string): Promise<Doc> {
  return guarded(async () => {
    const tx = (await db()).transaction(['docs', 'pages'], 'readwrite');
    try {
      const now = Date.now();
      const merged: Doc = { id: crypto.randomUUID(), title, kind: 'normal', pageIds: [], createdAt: now, updatedAt: now };
      for (const id of ids) {
        const doc = await tx.objectStore('docs').get(id);
        if (!doc) throw new Error('Documento no encontrado');
        for (const pageId of doc.pageIds) {
          const page = await tx.objectStore('pages').get(pageId);
          if (!page) continue;
          const copy: Page = { ...page, id: crypto.randomUUID(), docId: merged.id };
          await tx.objectStore('pages').put(copy);
          merged.pageIds.push(copy.id);
        }
      }
      await tx.objectStore('docs').put(merged);
      await tx.done;
      return merged;
    } catch (e) {
      abortQuietly(tx);
      throw e;
    }
  });
}

export async function addSignature(image: Blob): Promise<Signature> {
  const sig: Signature = { id: crypto.randomUUID(), image, createdAt: Date.now() };
  await guarded(async () => (await db()).put('signatures', sig));
  return sig;
}

export async function listSignatures(): Promise<Signature[]> {
  return (await db()).getAll('signatures');
}

export async function getSignature(id: string): Promise<Signature | undefined> {
  return (await db()).get('signatures', id);
}

export async function deleteSignature(id: string): Promise<void> {
  const tx = (await db()).transaction(['pages', 'signatures'], 'readwrite');
  let count = 0;
  let cursor = await tx.objectStore('pages').openCursor();
  while (cursor) {
    if (cursor.value.annotations.some((a) => a.type === 'signature' && a.signatureId === id)) count++;
    cursor = await cursor.continue();
  }
  if (count > 0) {
    abortQuietly(tx);
    throw new SignatureInUseError(count);
  }
  await tx.objectStore('signatures').delete(id);
  await tx.done;
}
