import { useEffect, useState } from 'react';
import type { Doc, Page } from '../../core/types';
import { getPage, listDocs } from '../../storage/db';
import { BlobImage } from '../components/BlobImage';
import { Guilloche } from '../components/Guilloche';
import { Icon } from '../components/Icon';
import { ImportButton } from '../components/ImportButton';
import { InstallHint } from '../components/InstallHint';

const NOTICE_KEY = 'appscan.backupNoticeDismissed';

function readNoticeDismissed() {
  try {
    return localStorage.getItem(NOTICE_KEY) === '1';
  } catch {
    return false;
  }
}

function dismissNotice() {
  try {
    localStorage.setItem(NOTICE_KEY, '1');
  } catch { /* the notice simply returns next time */ }
}

export const serial = (id: string) => id.replace(/-/g, '').slice(0, 6).toUpperCase();

const formatDate = (ms: number) =>
  new Date(ms).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });

function Stub({ doc }: { doc: Doc }) {
  const [cover, setCover] = useState<Page>();
  useEffect(() => {
    if (doc.pageIds[0]) getPage(doc.pageIds[0]).then(setCover);
  }, [doc.pageIds]);
  const count = doc.pageIds.length;

  return (
    <li>
      <a className="stub" data-testid="doc-stub" href={`#/doc/${doc.id}`}>
        <span className="stub__thumb">
          {cover && <BlobImage blob={cover.thumb} alt={`Primera página de ${doc.title}`} />}
        </span>
        <span className="stub__body">
          <span className="stub__title">{doc.title}</span>
          <span className="stub__meta">
            {count} {count === 1 ? 'página' : 'páginas'} · {formatDate(doc.updatedAt)}
          </span>
          <span className="serial">N.º {serial(doc.id)}</span>
        </span>
      </a>
    </li>
  );
}

export function LibraryScreen() {
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [query, setQuery] = useState('');
  const [noticeDismissed, setNoticeDismissed] = useState(readNoticeDismissed);

  useEffect(() => {
    listDocs().then(setDocs);
  }, []);

  const filtered = (docs ?? []).filter((d) => d.title.toLowerCase().includes(query.trim().toLowerCase()));
  const hasDocs = (docs?.length ?? 0) > 0;

  return (
    <div className="screen">
      <header className="masthead">
        <Guilloche />
        <div className="masthead__row">
          <h1 className="wordmark">AppScan</h1>
          <a className="icon-btn" href="#/merge" aria-label="Unir documentos"><Icon name="merge" /></a>
        </div>
      </header>

      <main className="screen__body">
        <InstallHint />

        {hasDocs && (
          <label className="search">
            <Icon name="search" size={20} />
            <input type="search" placeholder="Buscar por título" aria-label="Buscar por título" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        )}

        {hasDocs && !noticeDismissed && (
          <aside className="notice">
            <div>
              <strong>Sin copia de seguridad</strong>
              <p>Tus documentos solo están en este celular. Si borras los datos del navegador o lo pierdes, se pierden. Comparte los PDF importantes.</p>
            </div>
            <button type="button" className="btn btn--small" onClick={() => { dismissNotice(); setNoticeDismissed(true); }}>Entendido</button>
          </aside>
        )}

        {docs && !hasDocs && (
          <div className="empty">
            <h2>Aún no tienes documentos</h2>
            <p>Pon una hoja sobre una mesa, toca <strong>Escanear</strong> y encuádrala. AppScan recorta y endereza la página por ti.</p>
            <p>Todo se queda en este celular. No hay cuentas ni servidores.</p>
            <a className="text-link" href="#/scan?mode=id"><Icon name="card" size={20} /> Escanear una cédula</a>
          </div>
        )}

        {hasDocs && filtered.length === 0 && <p className="muted">Ningún documento coincide con «{query}».</p>}

        {filtered.length > 0 && (
          <ul className="stubs">
            {filtered.map((d) => <Stub key={d.id} doc={d} />)}
          </ul>
        )}

        {hasDocs && (
          <a className="text-link" href="#/scan?mode=id"><Icon name="card" size={20} /> Escanear una cédula</a>
        )}
      </main>

      <footer className="action-bar">
        <a className="btn btn--primary btn--wide" href="#/scan"><Icon name="scan" /> Escanear</a>
        <ImportButton className="btn"><Icon name="gallery" /> Importar</ImportButton>
      </footer>
    </div>
  );
}
