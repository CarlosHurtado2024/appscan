import { useCallback, useEffect, useState } from 'react';
import type { Doc, Page } from '../../core/types';
import { deleteDoc, deletePage, getDoc, getPages, renameDoc, reorderPages } from '../../storage/db';
import { BlobImage } from '../components/BlobImage';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { serial } from '../components/DocThumb';
import { Guilloche } from '../components/Guilloche';
import { Icon } from '../components/Icon';
import { ImportButton } from '../components/ImportButton';
import { useToast } from '../components/Toast';
import { sharePdf } from '../../core/share';
import { buildDocPdf } from '../exportDoc';
import { navigate } from '../router';

type Pending = { kind: 'page'; page: Page; index: number } | { kind: 'doc' };

export function DocumentScreen({ id }: { id: string }) {
  const [doc, setDoc] = useState<Doc | null | undefined>();
  const [pages, setPages] = useState<Page[]>([]);
  const [title, setTitle] = useState('');
  const [pageSize, setPageSize] = useState<'a4' | 'fit'>('a4');
  const [pending, setPending] = useState<Pending | null>(null);
  const [exporting, setExporting] = useState(false);
  const [readyPdf, setReadyPdf] = useState<Uint8Array | null>(null);
  const toast = useToast();

  const reload = useCallback(async () => {
    setReadyPdf(null);
    const d = (await getDoc(id)) ?? null;
    setDoc(d);
    setTitle((t) => t || d?.title || '');
    setPages(d ? await getPages(id) : []);
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function move(index: number, delta: number) {
    const ids = pages.map((p) => p.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    await reorderPages(id, ids);
    await reload();
  }

  async function saveTitle() {
    const clean = title.trim();
    if (!clean) {
      setTitle(doc?.title ?? '');
      return;
    }
    if (clean !== doc?.title) {
      await renameDoc(id, clean);
      await reload();
    }
  }

  async function confirmDelete() {
    if (!pending) return;
    setPending(null);
    if (pending.kind === 'doc') {
      await deleteDoc(id);
      navigate('/', { replace: true });
      return;
    }
    const { docDeleted } = await deletePage(pending.page.id);
    if (docDeleted) navigate('/', { replace: true });
    else await reload();
  }

  async function onExport() {
    if (!doc) return;
    setExporting(true);
    try {
      const name = title.trim() || doc.title;
      const bytes = await buildDocPdf(doc, pages, pageSize);
      const result = await sharePdf(bytes, name);
      if (result === 'blocked') setReadyPdf(bytes);
      if (result === 'downloaded') toast.show('PDF guardado en Descargas.');
    } catch {
      toast.show('No se pudo crear el PDF. Inténtalo de nuevo.');
    } finally {
      setExporting(false);
    }
  }

  async function shareReady() {
    if (!readyPdf || !doc) return;
    const bytes = readyPdf;
    setReadyPdf(null);
    const result = await sharePdf(bytes, title.trim() || doc.title, { retried: true });
    if (result === 'downloaded') toast.show('PDF guardado en Descargas.');
  }

  if (doc === undefined) return <div className="screen" />;
  if (doc === null) {
    return (
      <div className="screen">
        <main className="screen__body empty">
          <h2>Este documento ya no existe</h2>
          <a className="btn" href="#/">Ir a la biblioteca</a>
        </main>
      </div>
    );
  }

  const isIdCard = doc.kind === 'id-card' && pages.length === 2;

  return (
    <div className="screen">
      <header className="toolbar">
        <Guilloche />
        <a className="icon-btn" href="#/" aria-label="Volver"><Icon name="back" /></a>
        <input
          className="title-input"
          aria-label="Título del documento"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
        />
        <button type="button" className="icon-btn" aria-label="Eliminar documento" onClick={() => setPending({ kind: 'doc' })}>
          <Icon name="trash" />
        </button>
      </header>

      <main className="screen__body">
        <p className="doc-meta">
          <span className="serial">N.º {serial(doc.id)}</span>
          <span className="muted">{pages.length} {pages.length === 1 ? 'página' : 'páginas'}</span>
        </p>

        {isIdCard && <p className="muted">Se exporta como una hoja A4 con las dos caras a tamaño real.</p>}

        <ul className="page-grid">
          {pages.map((page, i) => (
            <li key={page.id} className="page-tile" data-testid="page-tile" data-page-id={page.id}>
              <a href={`#/page/${page.id}`} aria-label={`Editar página ${i + 1}`}>
                <BlobImage blob={page.thumb} alt={`Página ${i + 1}`} />
              </a>
              <div className="page-tile__bar">
                <button type="button" className="icon-btn" aria-label={`Mover página ${i + 1} antes`} disabled={i === 0} onClick={() => move(i, -1)}>
                  <Icon name="before" size={20} />
                </button>
                <span className="page-tile__number">{i + 1}</span>
                <button type="button" className="icon-btn" aria-label={`Mover página ${i + 1} después`} disabled={i === pages.length - 1} onClick={() => move(i, 1)}>
                  <Icon name="after" size={20} />
                </button>
                <button type="button" className="icon-btn" aria-label={`Eliminar página ${i + 1}`} onClick={() => setPending({ kind: 'page', page, index: i })}>
                  <Icon name="trash" size={20} />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="row">
          <a className="btn" href={`#/scan?doc=${id}`}><Icon name="plus" /> Escanear más</a>
          <ImportButton docId={id} onDone={reload}><Icon name="gallery" /> Importar</ImportButton>
        </div>

        {!isIdCard && (
          <fieldset className="segmented segmented--grid">
            <legend>Tamaño del PDF</legend>
            <label><input type="radio" name="size" checked={pageSize === 'a4'} onChange={() => setPageSize('a4')} /><span>A4</span></label>
            <label><input type="radio" name="size" checked={pageSize === 'fit'} onChange={() => setPageSize('fit')} /><span>Ajustado a la imagen</span></label>
          </fieldset>
        )}
      </main>

      <footer className="action-bar">
        {readyPdf ? (
          <button type="button" className="btn btn--primary btn--wide" onClick={shareReady}>
            <Icon name="share" /> Compartir ahora
          </button>
        ) : (
          <button type="button" className="btn btn--primary btn--wide" disabled={exporting || pages.length === 0} onClick={onExport}>
            <Icon name="share" /> {exporting ? 'Creando PDF…' : 'Compartir PDF'}
          </button>
        )}
      </footer>

      {pending && (
        <ConfirmDialog
          title={pending.kind === 'doc' ? '¿Eliminar este documento?' : `¿Eliminar la página ${pending.index + 1}?`}
          body={pending.kind === 'doc' || pages.length === 1
            ? 'También se eliminará el documento. Esta acción no se puede deshacer.'
            : 'Esta acción no se puede deshacer.'}
          confirmLabel="Eliminar"
          onConfirm={confirmDelete}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}
