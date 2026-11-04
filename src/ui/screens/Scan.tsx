import { useRef, useState } from 'react';
import type { Doc } from '../../core/types';
import { StorageFullError, createDoc, getDoc } from '../../storage/db';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { navigate } from '../router';
import { useCamera } from '../useCamera';
import { defaultTitle, importFiles, savePhoto } from '../useImport';
import { useLiveDetection } from '../useLiveDetection';

type Props = { docId?: string; mode: 'normal' | 'id' };

const ID_STEPS = ['Cara frontal', 'Reverso'];

export function ScanScreen({ docId, mode }: Props) {
  const { videoRef, status, capture } = useCamera();
  const quad = useLiveDetection(videoRef, status === 'ready');
  const [doc, setDoc] = useState<Doc | null>(null);
  const [count, setCount] = useState(0);
  const [lastPageId, setLastPageId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const gallery = useRef<HTMLInputElement>(null);

  const isId = mode === 'id';
  const closeHref = doc ? `#/doc/${doc.id}` : docId ? `#/doc/${docId}` : '#/';

  async function ensureDoc(): Promise<Doc> {
    if (doc) return doc;
    const existing = docId ? await getDoc(docId) : undefined;
    const next = existing ?? await createDoc(isId ? `Cédula ${defaultTitle().replace('Documento ', '')}` : defaultTitle(), isId ? 'id-card' : 'normal');
    setDoc(next);
    return next;
  }

  function reportSaveError(e: unknown) {
    toast.show(e instanceof StorageFullError
      ? 'El celular no tiene espacio. Borra algunos documentos para seguir escaneando.'
      : 'No se pudo guardar la foto. Inténtalo de nuevo.');
  }

  async function onCapture() {
    setSaving(true);
    try {
      // Saved right away: closing the app afterwards never loses this page.
      const photo = await capture();
      const target = await ensureDoc();
      setLastPageId((await savePhoto(photo, target.id)).id);
      const total = count + 1;
      setCount(total);
      if (isId && total === ID_STEPS.length) navigate(`/doc/${target.id}`, { replace: true });
    } catch (e) {
      reportSaveError(e);
    } finally {
      setSaving(false);
    }
  }

  async function onPickedFiles(list: FileList | null) {
    const files = [...(list ?? [])];
    if (files.length === 0) return;
    setSaving(true);
    try {
      const { doc: saved, failed } = await importFiles(files, docId ?? doc?.id);
      if (failed.length > 0) toast.show(`No se pudo abrir: ${failed.join(', ')}. Prueba con una foto JPG o PNG.`);
      if (saved) navigate(`/doc/${saved.id}`, { replace: true });
    } catch (e) {
      reportSaveError(e);
    } finally {
      setSaving(false);
    }
  }

  const blocked = status === 'denied' || status === 'unavailable';
  const frameW = videoRef.current?.videoWidth || 100;
  const frameH = videoRef.current?.videoHeight || 100;

  return (
    <div className="camera">
      <video ref={videoRef} className="camera__video" playsInline muted aria-label="Vista de la cámara" hidden={blocked} />

      {quad && !blocked && (
        /* "slice" crops exactly as the video's object-fit: cover does, so the outline stays on the sheet. */
        <svg className="camera__overlay" viewBox={`0 0 ${frameW} ${frameH}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <polygon points={quad.map((p) => `${p.x * frameW},${p.y * frameH}`).join(' ')} vectorEffect="non-scaling-stroke" />
        </svg>
      )}

      <header className="camera__top">
        <a className="icon-btn" href={closeHref} aria-label="Cerrar"><Icon name="close" /></a>
        {isId && <p className="camera__step">{ID_STEPS[Math.min(count, ID_STEPS.length - 1)]}</p>}
        <span className="camera__count" data-testid="captured-count">{count > 0 ? `${count} ${count === 1 ? 'página' : 'páginas'}` : 'Sin páginas'}</span>
      </header>

      {isId && !blocked && <div className="camera__card-guide" aria-hidden="true" />}

      {blocked && (
        <div className="camera__blocked">
          <h1>{status === 'denied' ? 'AppScan no tiene permiso para usar la cámara' : 'No se encontró una cámara disponible'}</h1>
          <p>{status === 'denied'
            ? 'Actívalo en los ajustes del navegador, en los permisos de este sitio, y vuelve a abrir esta pantalla. También puedes usar la cámara del sistema.'
            : 'Puedes tomar la foto con la cámara del sistema o elegir una imagen.'}</p>
          <label className="btn btn--primary">
            <Icon name="camera" /> Usar cámara del sistema
            <input data-testid="system-camera-input" type="file" accept="image/*" capture="environment" hidden onChange={(e) => onPickedFiles(e.target.files)} />
          </label>
        </div>
      )}

      {lastPageId && !isId && !blocked && (
        <a className="btn btn--small camera__adjust" href={`#/crop/${lastPageId}`}><Icon name="crop" size={20} /> Ajustar recorte</a>
      )}

      <footer className="camera__bottom">
        <button type="button" className="btn camera__side" disabled={saving} onClick={() => gallery.current?.click()} aria-label="Elegir de la galería">
          <Icon name="gallery" />
        </button>
        <input ref={gallery} type="file" accept="image/*" multiple hidden onChange={(e) => onPickedFiles(e.target.files)} />

        <button type="button" className="camera__shutter" disabled={status !== 'ready' || saving} onClick={onCapture} aria-label="Capturar" />

        {doc && count > 0
          ? <a className="btn camera__side" href={`#/doc/${doc.id}`}><Icon name="check" /> Terminar</a>
          : <span className="camera__side" />}
      </footer>
    </div>
  );
}
