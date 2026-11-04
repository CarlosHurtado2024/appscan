import { useEffect, useState } from 'react';
import type { Doc } from '../../core/types';
import { StorageFullError, listDocs, mergeDocs } from '../../storage/db';
import { DocThumb, serial } from '../components/DocThumb';
import { Guilloche } from '../components/Guilloche';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { navigate } from '../router';

export function MergeScreen() {
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  useEffect(() => {
    listDocs().then(setDocs);
  }, []);

  const toggle = (id: string) =>
    setSelected((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const titleOf = (id: string) => docs?.find((d) => d.id === id)?.title ?? '';

  async function merge() {
    setBusy(true);
    try {
      const doc = await mergeDocs(selected, selected.map(titleOf).join(' + '));
      navigate(`/doc/${doc.id}`, { replace: true });
    } catch (e) {
      toast.show(e instanceof StorageFullError
        ? 'El celular no tiene espacio. Borra algunos documentos e inténtalo de nuevo.'
        : 'No se pudieron unir los documentos. Inténtalo de nuevo.');
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <header className="toolbar">
        <Guilloche />
        <a className="icon-btn" href="#/" aria-label="Volver"><Icon name="back" /></a>
        <h1 className="toolbar__title">Unir documentos</h1>
      </header>

      <main className="screen__body">
        {docs && docs.length < 2 ? (
          <div className="empty">
            <h2>Necesitas al menos dos documentos</h2>
            <p>Escanea o importa otro documento y vuelve aquí para unirlos.</p>
            <a className="btn" href="#/">Ir a la biblioteca</a>
          </div>
        ) : (
          <>
            <p className="muted">Tócalos en el orden en que quieres unirlos. Se crea un documento nuevo y los originales no cambian.</p>
            <ul className="merge-list">
              {docs?.map((d) => {
                const position = selected.indexOf(d.id);
                return (
                  <li key={d.id}>
                    <label className="stub merge-row">
                      <input type="checkbox" checked={position >= 0} onChange={() => toggle(d.id)} aria-label={d.title} />
                      <DocThumb doc={d} />
                      <span className="stub__body">
                        <span className="stub__title">{position >= 0 ? `${position + 1}.º ` : ''}{d.title}</span>
                        <span className="stub__meta">{d.pageIds.length} {d.pageIds.length === 1 ? 'página' : 'páginas'}</span>
                        <span className="serial">N.º {serial(d.id)}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </main>

      {docs && docs.length >= 2 && (
        <footer className="action-bar">
          <button type="button" className="btn btn--primary btn--wide" disabled={selected.length < 2 || busy} onClick={merge}>
            <Icon name="merge" /> {busy ? 'Uniendo…' : 'Unir'}
          </button>
        </footer>
      )}
    </div>
  );
}
