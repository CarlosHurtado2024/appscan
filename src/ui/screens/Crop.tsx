import { useEffect, useState } from 'react';
import { fullQuad, isValidQuad } from '../../core/geometry';
import { blobToRaster } from '../../core/image';
import type { Page, Quad } from '../../core/types';
import { vision } from '../../core/vision/client';
import { getPage } from '../../storage/db';
import { useBlobUrl } from '../components/BlobImage';
import { CornerEditor } from '../components/CornerEditor';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { editPage } from '../pageActions';
import { navigate } from '../router';

const DETECT_SIDE = 1000;

export function CropScreen({ id }: { id: string }) {
  const [page, setPage] = useState<Page | null>();
  const [quad, setQuad] = useState<Quad>(fullQuad());
  const [aspect, setAspect] = useState(3 / 4);
  const [visionOff, setVisionOff] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const src = useBlobUrl(page?.original);

  useEffect(() => {
    getPage(id).then(async (p) => {
      setPage(p ?? null);
      if (!p) return;
      setQuad(p.corners);
      const bitmap = await createImageBitmap(p.original);
      setAspect(bitmap.width / bitmap.height);
      bitmap.close();
      // Learns early whether detection works, so the notice is visible before any manual crop.
      detect(p.original, () => {}).catch(() => {});
    });
  }, [id]);

  async function detect(original: Blob, apply: (q: Quad) => void) {
    try {
      apply((await vision.detect(await blobToRaster(original, DETECT_SIDE))) ?? fullQuad());
    } catch {
      setVisionOff(true);
    }
  }

  const valid = isValidQuad(quad);

  async function apply() {
    if (!page || !valid) return;
    setBusy(true);
    try {
      await editPage(page, { corners: quad });
      navigate(`/page/${id}`, { replace: true });
    } catch {
      toast.show('No se pudo aplicar el recorte. Inténtalo de nuevo.');
      setBusy(false);
    }
  }

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

  return (
    <div className="screen">
      <header className="toolbar">
        <a className="icon-btn" href={`#/page/${id}`} aria-label="Volver"><Icon name="back" /></a>
        <h1 className="toolbar__title">Recortar</h1>
      </header>

      <main className="crop-body">
        {src && <CornerEditor src={src} aspect={aspect} quad={quad} valid={valid} onChange={setQuad} />}
        <div className="crop-messages">
          {!valid && <p className="error-text" role="alert">Las esquinas se cruzan o el área es muy pequeña. Mueve una esquina para corregirlo.</p>}
          {visionOff && <p className="muted">La detección automática no está disponible. Se recortará en línea recta, sin corregir la perspectiva.</p>}
        </div>
      </main>

      <footer className="action-bar">
        <button type="button" className="btn" disabled={busy || !page} onClick={() => page && detect(page.original, setQuad)}>
          Volver a detectar
        </button>
        <button type="button" className="btn btn--primary btn--wide" disabled={!valid || busy} onClick={apply}>
          <Icon name="check" /> {busy ? 'Aplicando…' : 'Aplicar'}
        </button>
      </footer>
    </div>
  );
}
