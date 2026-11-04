import { useEffect, useState } from 'react';
import type { Doc } from '../../core/types';
import { listDocs } from '../../storage/db';
import { DocThumb, serial } from '../components/DocThumb';
import { Guilloche, Rosette } from '../components/Guilloche';
import { Icon } from '../components/Icon';
import { ImportButton } from '../components/ImportButton';
import { InstallHint } from '../components/InstallHint';
import { navigate } from '../router';

/** The line work prints across the band, then the camera opens. */
const SWEEP_MS = 240;
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

const formatDate = (ms: number) =>
  new Date(ms).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' });

function Stub({ doc }: { doc: Doc }) {
  const count = doc.pageIds.length;

  return (
    <li>
      <a className="stub" data-testid="doc-stub" href={`#/doc/${doc.id}`}>
        <DocThumb doc={doc} />
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
  const [sweeping, setSweeping] = useState(false);

  useEffect(() => {
    listDocs().then(setDocs);
  }, []);

  const filtered = (docs ?? []).filter((d) => d.title.toLowerCase().includes(query.trim().toLowerCase()));
  const hasDocs = (docs?.length ?? 0) > 0;

  return (
    <div className="screen">
      <header className="masthead">
        <Guilloche active={sweeping} />
        <div className="masthead__row">
          <div>
            <h1 className="wordmark">AppScan</h1>
            <p className="masthead__note">Tus documentos se quedan en este celular</p>
          </div>
          {(docs?.length ?? 0) >= 2 && <a className="btn btn--small" href="#/merge" aria-label="Unir documentos">Unir</a>}
        </div>
      </header>

      {docs && !hasDocs && <Rosette />}

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
              <p>Si borras los datos del navegador o pierdes el celular, se pierden tus documentos. Comparte los PDF importantes.</p>
            </div>
            <button type="button" className="btn btn--small" onClick={() => { dismissNotice(); setNoticeDismissed(true); }}>Entendido</button>
          </aside>
        )}

        {docs && !hasDocs && (
          <div className="empty">
            <div className="stub stub--blank" aria-hidden="true">
              <span className="stub__thumb"><span className="blank-sheet" /></span>
              <span className="stub__body">
                <span className="blank-line" />
                <span className="blank-line blank-line--short" />
                <span className="serial">N.º ······</span>
              </span>
            </div>
            <h2>Aún no tienes documentos</h2>
            <p>Pon una hoja sobre una mesa, toca <strong>Escanear</strong> y encuádrala. AppScan recorta y endereza la página por ti.</p>
            <p>No hay cuentas ni servidores.</p>
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

      <footer className="action-bar action-bar--lead">
        <a
          className="btn btn--primary btn--wide"
          href="#/scan"
          onClick={(e) => {
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            e.preventDefault();
            setSweeping(true);
            window.setTimeout(() => navigate('/scan'), SWEEP_MS);
          }}
        >
          <Icon name="scan" /> Escanear
        </a>
        <ImportButton className="btn btn--square"><Icon name="gallery" /> Importar</ImportButton>
      </footer>
    </div>
  );
}
