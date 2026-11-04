import { useState } from 'react';
import { recognize } from '../../core/ocr';
import type { Page } from '../../core/types';
import { updatePage } from '../../storage/db';
import { Icon } from './Icon';
import { useToast } from './Toast';

export function OcrPanel({ page, onSaved }: { page: Page; onSaved: (p: Page) => void }) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [text, setText] = useState(page.ocrText ?? '');
  const toast = useToast();

  async function run() {
    setError('');
    setProgress(0);
    try {
      const found = await recognize(page.rendered, setProgress);
      setText(found);
      onSaved(await updatePage(page.id, { ocrText: found }));
      if (!found) toast.show('No se encontró texto en esta página.');
    } catch (e) {
      setError(e instanceof Error && e.name === 'OcrUnavailableError'
        ? e.message
        : 'No se pudo reconocer el texto. Inténtalo de nuevo.');
    } finally {
      setProgress(null);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.show('Texto copiado.');
    } catch {
      toast.show('No se pudo copiar. Selecciona el texto y cópialo a mano.');
    }
  }

  const running = progress !== null;

  return (
    <section className="ocr">
      <button type="button" className="btn" disabled={running} onClick={run}>
        <Icon name="text" /> {text ? 'Volver a extraer texto' : 'Extraer texto'}
      </button>

      {running && (
        <div className="ocr__progress">
          <progress value={progress} max={1} aria-label="Reconociendo texto" />
          <p className="muted">La primera vez descarga los archivos necesarios. Después funciona sin conexión.</p>
        </div>
      )}

      {error && <p className="error-text" role="alert">{error}</p>}

      {text && !running && (
        <>
          <textarea
            className="field ocr__text"
            aria-label="Texto reconocido"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => updatePage(page.id, { ocrText: text }).then(onSaved).catch(() => {})}
          />
          <button type="button" className="btn" onClick={copy}><Icon name="copy" /> Copiar texto</button>
        </>
      )}
    </section>
  );
}
