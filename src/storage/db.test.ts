import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import {
  addPage, addSignature, closeDb, createDoc, deleteDoc, deletePage, deleteSignature, getDoc, getPage,
  getPages, listDocs, listSignatures, mergeDocs, reorderPages, SignatureInUseError, StorageFullError,
  updatePage, type PageInput,
} from './db';
import { fullQuad } from '../core/geometry';

const blob = () => new Blob(['x'], { type: 'image/jpeg' });
const input = (over: Partial<PageInput> = {}): PageInput => ({
  original: blob(), corners: fullQuad(), rotation: 0, filter: 'enhanced', annotations: [],
  rendered: blob(), thumb: blob(), ...over,
});

beforeEach(async () => {
  await closeDb();
  globalThis.indexedDB = new IDBFactory();
});

test('page survives reopening the database', async () => {
  const doc = await createDoc('Contrato');
  const page = await addPage(doc.id, input());
  await closeDb();
  expect((await getPage(page.id))?.docId).toBe(doc.id);
  expect((await getDoc(doc.id))?.title).toBe('Contrato');
});

test('addPage appends to pageIds and bumps updatedAt', async () => {
  const doc = await createDoc('A');
  await new Promise((r) => setTimeout(r, 2));
  const p = await addPage(doc.id, input());
  const after = await getDoc(doc.id);
  expect(after?.pageIds).toEqual([p.id]);
  expect(after!.updatedAt).toBeGreaterThan(doc.updatedAt);
});

test('listDocs returns newest first', async () => {
  const a = await createDoc('A');
  await new Promise((r) => setTimeout(r, 2));
  const b = await createDoc('B');
  expect((await listDocs()).map((d) => d.id)).toEqual([b.id, a.id]);
});

test('getPages follows reorderPages order', async () => {
  const doc = await createDoc('A');
  const p1 = await addPage(doc.id, input());
  const p2 = await addPage(doc.id, input());
  await reorderPages(doc.id, [p2.id, p1.id]);
  expect((await getPages(doc.id)).map((p) => p.id)).toEqual([p2.id, p1.id]);
});

test('reorderPages rejects ids that are not an exact permutation', async () => {
  const doc = await createDoc('A');
  const p1 = await addPage(doc.id, input());
  await addPage(doc.id, input());
  await expect(reorderPages(doc.id, [p1.id, p1.id])).rejects.toThrow();
  await expect(reorderPages(doc.id, [p1.id])).rejects.toThrow();
});

test('updatePage merges the patch', async () => {
  const doc = await createDoc('A');
  const p = await addPage(doc.id, input());
  const u = await updatePage(p.id, { filter: 'bw', ocrText: 'hola' });
  expect(u.filter).toBe('bw');
  expect((await getPage(p.id))?.ocrText).toBe('hola');
});

test('deleteDoc removes its pages', async () => {
  const doc = await createDoc('A');
  const p = await addPage(doc.id, input());
  await deleteDoc(doc.id);
  expect(await getDoc(doc.id)).toBeUndefined();
  expect(await getPage(p.id)).toBeUndefined();
});

test('deleting a page that is not the last keeps the doc', async () => {
  const doc = await createDoc('A');
  const p1 = await addPage(doc.id, input());
  const p2 = await addPage(doc.id, input());
  expect(await deletePage(p1.id)).toEqual({ docDeleted: false });
  expect((await getDoc(doc.id))?.pageIds).toEqual([p2.id]);
});

test('deleting the last page deletes the doc and reports docDeleted', async () => {
  const doc = await createDoc('A');
  const p = await addPage(doc.id, input());
  expect(await deletePage(p.id)).toEqual({ docDeleted: true });
  expect(await getDoc(doc.id)).toBeUndefined();
});

test('mergeDocs copies pages in the given order with new ids', async () => {
  const a = await createDoc('A');
  const b = await createDoc('B');
  const pa = await addPage(a.id, input({ ocrText: 'a' }));
  const pb = await addPage(b.id, input({ ocrText: 'b' }));
  const merged = await mergeDocs([b.id, a.id], 'Unido');
  const pages = await getPages(merged.id);
  expect(pages.map((p) => p.ocrText)).toEqual(['b', 'a']);
  expect(pages.map((p) => p.id)).not.toContain(pa.id);
  expect(pages.map((p) => p.id)).not.toContain(pb.id);
  expect(pages.every((p) => p.docId === merged.id)).toBe(true);
});

test('mergeDocs leaves source docs unchanged', async () => {
  const a = await createDoc('A');
  const b = await createDoc('B');
  const pa = await addPage(a.id, input());
  await addPage(b.id, input());
  const before = await getDoc(a.id);
  await mergeDocs([a.id, b.id], 'Unido');
  expect(await getDoc(a.id)).toEqual(before);
  expect((await getPage(pa.id))?.docId).toBe(a.id);
});

test('deleteSignature throws SignatureInUseError with count when a page uses it', async () => {
  const sig = await addSignature(blob());
  const doc = await createDoc('A');
  await addPage(doc.id, input({ annotations: [{ type: 'signature', signatureId: sig.id, box: { x: 0, y: 0, w: 0.2, h: 0.1 } }] }));
  const err = await deleteSignature(sig.id).catch((e) => e);
  expect(err).toBeInstanceOf(SignatureInUseError);
  expect(err.count).toBe(1);
  expect(await listSignatures()).toHaveLength(1);
});

test('deleteSignature succeeds when unused', async () => {
  const sig = await addSignature(blob());
  await deleteSignature(sig.id);
  expect(await listSignatures()).toHaveLength(0);
});

test('QuotaExceededError is surfaced as StorageFullError', async () => {
  const doc = await createDoc('A');
  const spy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
    throw new DOMException('full', 'QuotaExceededError');
  });
  await expect(addPage(doc.id, input())).rejects.toBeInstanceOf(StorageFullError);
  spy.mockRestore();
});
