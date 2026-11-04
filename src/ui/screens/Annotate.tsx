import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { renderPage } from '../../core/render';
import type { Annotation, Box, Page, Point, Signature } from '../../core/types';
import { SignatureInUseError, addSignature, deleteSignature, getPage, listSignatures } from '../../storage/db';
import { BlobImage } from '../components/BlobImage';
import { Icon } from '../components/Icon';
import { SignaturePad } from '../components/SignaturePad';
import { useToast } from '../components/Toast';
import { editPage } from '../pageActions';
import { navigate } from '../router';

const INK = '#1b1b6b';
/** Thousandths of the page's longest side; see drawAnnotations in core/render. */
const STROKE_WIDTH = 4;
const TEXT_HEIGHT = 0.05;
const SIGNATURE_WIDTH = 0.4;
const MIN_BOX = 0.03;

type Tool = 'none' | 'draw' | 'text' | 'signature';
type Boxed = Exclude<Annotation, { type: 'stroke' }>;
type Gesture = { index: number; mode: 'move' | 'resize'; startX: number; startY: number; box: Box };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function AnnotateScreen({ id }: { id: string }) {
  const [page, setPage] = useState<Page | null>();
  const [base, setBase] = useState<Blob>();
  const [items, setItems] = useState<Annotation[]>([]);
  const [tool, setTool] = useState<Tool>('none');
  const [text, setText] = useState('');
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [padOpen, setPadOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const stage = useRef<HTMLDivElement>(null);
  const stroke = useRef<Point[] | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const toast = useToast();

  useEffect(() => {
    getPage(id).then(async (p) => {
      setPage(p ?? null);
      if (!p) return;
      setItems(p.annotations);
      // The editable marks sit over a clean render, so they are never drawn twice.
      setBase((await renderPage({ ...p, annotations: [] })).rendered);
    });
    listSignatures().then(setSignatures);
  }, [id]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setSize({ width: el.clientWidth || 1, height: el.clientHeight || 1 }));
    observer.observe(el);
    return () => observer.disconnect();
  }, [base]);

  function relative(e: ReactPointerEvent): Point {
    const r = stage.current!.getBoundingClientRect();
    return { x: clamp((e.clientX - r.left) / r.width, 0, 1), y: clamp((e.clientY - r.top) / r.height, 0, 1) };
  }

  function onStageDown(e: ReactPointerEvent) {
    if (tool !== 'draw') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    stroke.current = [relative(e)];
    setItems((list) => [...list, { type: 'stroke', points: stroke.current!, color: INK, width: STROKE_WIDTH }]);
  }

  function onStageMove(e: ReactPointerEvent) {
    if (!stroke.current) return;
    stroke.current = [...stroke.current, relative(e)];
    const points = stroke.current;
    setItems((list) => [...list.slice(0, -1), { type: 'stroke', points, color: INK, width: STROKE_WIDTH }]);
  }

  function onStageUp() {
    stroke.current = null;
  }

  function startGesture(e: ReactPointerEvent, index: number, mode: Gesture['mode']) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { index, mode, startX: e.clientX, startY: e.clientY, box: (items[index] as Boxed).box };
  }

  function moveGesture(e: ReactPointerEvent) {
    const g = gesture.current;
    if (!g) return;
    const r = stage.current!.getBoundingClientRect();
    const dx = (e.clientX - g.startX) / r.width;
    const dy = (e.clientY - g.startY) / r.height;
    const box = g.mode === 'move'
      ? { ...g.box, x: clamp(g.box.x + dx, 0, 1 - g.box.w), y: clamp(g.box.y + dy, 0, 1 - g.box.h) }
      : { ...g.box, w: clamp(g.box.w + dx, MIN_BOX, 1 - g.box.x), h: clamp(g.box.h + dy, MIN_BOX, 1 - g.box.y) };
    setItems((list) => list.map((a, i) => (i === g.index ? { ...(a as Boxed), box } : a)));
  }

  function endGesture() {
    gesture.current = null;
  }

  function addText() {
    const clean = text.trim();
    if (!clean) return;
    const pagePxPerChar = (TEXT_HEIGHT * size.height * 0.8 * 0.6) / size.width;
    const w = Math.min(0.9, Math.max(0.1, clean.length * pagePxPerChar));
    setItems((list) => [...list, { type: 'text', text: clean, color: INK, box: { x: (1 - w) / 2, y: 0.45, w, h: TEXT_HEIGHT } }]);
    setText('');
    setTool('none');
  }

  async function placeSignature(sig: Signature) {
    const bitmap = await createImageBitmap(sig.image);
    const h = (SIGNATURE_WIDTH * size.width * bitmap.height) / bitmap.width / size.height;
    bitmap.close();
    setItems((list) => [...list, { type: 'signature', signatureId: sig.id, box: { x: 0.3, y: 0.6, w: SIGNATURE_WIDTH, h: Math.min(h, 0.35) } }]);
    setTool('none');
  }

  async function saveSignature(image: Blob) {
    try {
      await addSignature(image);
      setSignatures(await listSignatures());
      setPadOpen(false);
    } catch {
      toast.show('No se pudo guardar la firma. Inténtalo de nuevo.');
    }
  }

  async function removeSignature(sig: Signature) {
    const uses = (list: Annotation[]) => list.some((a) => a.type === 'signature' && a.signatureId === sig.id);
    // Placed but not saved yet, so the database cannot know about it.
    if (uses(items) && !uses(page?.annotations ?? [])) {
      toast.show('La firma está en uso en esta página. Quítala primero.');
      return;
    }
    try {
      await deleteSignature(sig.id);
      setSignatures(await listSignatures());
    } catch (e) {
      toast.show(e instanceof SignatureInUseError ? `${e.message} Quítala de ahí antes de eliminarla.` : 'No se pudo eliminar la firma.');
    }
  }

  async function save() {
    if (!page) return;
    setSaving(true);
    try {
      await editPage(page, { annotations: items });
      navigate(`/page/${id}`, { replace: true });
    } catch {
      toast.show('No se pudieron guardar las anotaciones. Inténtalo de nuevo.');
      setSaving(false);
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

  const longest = Math.max(size.width, size.height);

  return (
    <div className="screen">
      <header className="toolbar">
        <a className="icon-btn" href={`#/page/${id}`} aria-label="Volver"><Icon name="back" /></a>
        <h1 className="toolbar__title">Anotar</h1>
        <button type="button" className="btn btn--primary btn--small" disabled={saving || !page} onClick={save}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </header>

      <main className="screen__body annotate-body">
        {base ? (
          <div
            ref={stage}
            className={tool === 'draw' ? 'annotate-stage annotate-stage--draw' : 'annotate-stage'}
            data-testid="annotate-stage"
            onPointerDown={onStageDown}
            onPointerMove={onStageMove}
            onPointerUp={onStageUp}
            onPointerCancel={onStageUp}
          >
            <BlobImage blob={base} alt="Página para anotar" />
            <svg viewBox={`0 0 ${size.width} ${size.height}`} aria-hidden="true">
              {items.map((a, i) => a.type === 'stroke' && (
                <polyline
                  key={i}
                  points={a.points.map((p) => `${p.x * size.width},${p.y * size.height}`).join(' ')}
                  fill="none"
                  stroke={a.color}
                  strokeWidth={(a.width / 1000) * longest}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </svg>
            {items.map((a, i) => a.type !== 'stroke' && (
              <div
                key={i}
                className="annotation"
                data-testid="annotation-item"
                style={{ left: `${a.box.x * 100}%`, top: `${a.box.y * 100}%`, width: `${a.box.w * 100}%`, height: `${a.box.h * 100}%` }}
                onPointerDown={(e) => startGesture(e, i, 'move')}
                onPointerMove={moveGesture}
                onPointerUp={endGesture}
                onPointerCancel={endGesture}
              >
                {a.type === 'text'
                  ? <span style={{ color: a.color, fontSize: a.box.h * size.height * 0.8 }}>{a.text}</span>
                  : <SignaturePreview signature={signatures.find((s) => s.id === a.signatureId)} />}
                <span
                  className="annotation__resize"
                  data-testid="resize-handle"
                  onPointerDown={(e) => startGesture(e, i, 'resize')}
                  onPointerMove={moveGesture}
                  onPointerUp={endGesture}
                  onPointerCancel={endGesture}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="annotate-loading" aria-busy="true">Preparando la página…</div>
        )}

        {tool === 'text' && (
          <form className="tool-panel row" onSubmit={(e) => { e.preventDefault(); addText(); }}>
            <input className="field" aria-label="Texto a añadir" placeholder="Escribe aquí" value={text} onChange={(e) => setText(e.target.value)} autoFocus />
            <button type="submit" className="btn btn--primary" disabled={!text.trim()}>Añadir texto</button>
          </form>
        )}

        {tool === 'signature' && (
          <div className="tool-panel">
            {padOpen ? (
              <SignaturePad onSave={saveSignature} onCancel={() => setPadOpen(false)} />
            ) : (
              <>
                <ul className="signature-list">
                  {signatures.map((s, i) => (
                    <li key={s.id}>
                      <button type="button" className="signature-choice" aria-label={`Colocar firma ${i + 1}`} onClick={() => placeSignature(s)}>
                        <BlobImage blob={s.image} alt="" />
                      </button>
                      <button type="button" className="icon-btn" aria-label={`Eliminar firma ${i + 1}`} onClick={() => removeSignature(s)}>
                        <Icon name="trash" size={20} />
                      </button>
                    </li>
                  ))}
                </ul>
                <button type="button" className="btn" onClick={() => setPadOpen(true)}><Icon name="plus" /> Nueva firma</button>
              </>
            )}
          </div>
        )}
      </main>

      <footer className="action-bar action-bar--tools">
        <button type="button" className="tool" aria-pressed={tool === 'draw'} onClick={() => setTool(tool === 'draw' ? 'none' : 'draw')}><Icon name="pen" /> Dibujar</button>
        <button type="button" className="tool" aria-pressed={tool === 'text'} onClick={() => setTool(tool === 'text' ? 'none' : 'text')}><Icon name="text" /> Texto</button>
        <button type="button" className="tool" aria-pressed={tool === 'signature'} onClick={() => setTool(tool === 'signature' ? 'none' : 'signature')}><Icon name="signature" /> Firma</button>
        <button type="button" className="tool" disabled={items.length === 0} onClick={() => setItems((list) => list.slice(0, -1))}><Icon name="undo" /> Deshacer</button>
      </footer>
    </div>
  );
}

function SignaturePreview({ signature }: { signature?: Signature }) {
  return signature ? <BlobImage blob={signature.image} alt="Firma" className="annotation__signature" /> : null;
}
