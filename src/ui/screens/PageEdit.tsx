import { useEffect, useState } from 'react';
import type { Doc, FilterName, Page } from '../../core/types';
import { StorageFullError, getDoc, getPage } from '../../storage/db';
import { BlobImage } from '../components/BlobImage';
import { Guilloche } from '../components/Guilloche';
import { Icon } from '../components/Icon';
import { OcrPanel } from '../components/OcrPanel';
import { useToast } from '../components/Toast';
import { editPage, rotatePage } from '../pageActions';

const FILTERS: { value: FilterName; label: string }[] = [
  { value: 'enhanced', label: 'Mejorado' },
  { value: 'original', label: 'Original' },
  { value: 'gray', label: 'Grises' },
  { value: 'bw', label: 'Blanco y negro' },
];

export function PageEditScreen({ id }: { id: string }) {
  const [page, setPage] = useState<Page | null>();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    getPage(id).then(async (p) => {
      setPage(p ?? null);
      if (p) setDoc((await getDoc(p.docId)) ?? null);
    });
  }, [id]);

  async function run(action: () => Promise<Page>) {
    setBusy(true);
    try {
      setPage(await action());
    } catch (e) {
      toast.show(e instanceof StorageFullError
        ? 'El celular no tiene espacio. Borra algunos documentos e inténtalo de nuevo.'
        : 'No se pudo actualizar la página. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  if (page === undefined) return <div className="screen" />;
  if (page === null) {
    return (
      <div className="screen">
        <main className="screen__body empty">
          <h2>Esta página ya no existe</h2>
          <a className="btn" href="#/">Ir a la biblioteca</a>
        </main>
      </div>
    );
  }

  const number = (doc?.pageIds.indexOf(id) ?? 0) + 1;

  return (
    <div className="screen">
      <header className="toolbar">
        <Guilloche />
        <a className="icon-btn" href={`#/doc/${page.docId}`} aria-label="Volver"><Icon name="back" /></a>
        <h1 className="toolbar__title">Página {number}</h1>
      </header>

      <main className="screen__body page-edit">
        <div className={busy ? 'page-preview page-preview--busy' : 'page-preview'} aria-busy={busy}>
          <BlobImage blob={page.rendered} alt={`Vista previa de la página ${number}`} className="page-preview__img" testId="page-preview" />
        </div>

        <fieldset className="segmented segmented--grid" disabled={busy}>
          <legend>Filtro</legend>
          {FILTERS.map((f) => (
            <label key={f.value}>
              <input type="radio" name="filter" checked={page.filter === f.value} aria-label={f.label} onChange={() => run(() => editPage(page, { filter: f.value }))} />
              <span>{f.label}</span>
            </label>
          ))}
        </fieldset>

        <OcrPanel page={page} onSaved={setPage} />
      </main>

      <footer className="action-bar action-bar--tools">
        <a className="tool" href={`#/crop/${id}`}><Icon name="crop" /> Recortar</a>
        <a className="tool" href={`#/annotate/${id}`}><Icon name="pen" /> Anotar</a>
        <button type="button" className="tool" disabled={busy} onClick={() => run(() => rotatePage(page))}><Icon name="rotate" /> Girar</button>
      </footer>
    </div>
  );
}
