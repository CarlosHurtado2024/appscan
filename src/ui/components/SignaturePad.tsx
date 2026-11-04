import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

const INK = '#1b1b6b';

type Props = { onSave: (image: Blob) => void; onCancel: () => void };

export function SignaturePad({ onSave, onCancel }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const c = canvas.current!;
    const scale = window.devicePixelRatio || 1;
    c.width = c.clientWidth * scale;
    c.height = c.clientHeight * scale;
    const ctx = c.getContext('2d')!;
    ctx.scale(scale, scale);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const at = (e: ReactPointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };

  function clear() {
    const c = canvas.current!;
    const ctx = c.getContext('2d')!;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.restore();
    setHasInk(false);
  }

  return (
    <div className="signature-pad">
      <p className="muted">Firma con el dedo dentro del recuadro.</p>
      <canvas
        ref={canvas}
        data-testid="signature-pad"
        aria-label="Área de firma"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drawing.current = true;
          const ctx = canvas.current!.getContext('2d')!;
          ctx.beginPath();
          ctx.moveTo(...at(e));
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = canvas.current!.getContext('2d')!;
          ctx.lineTo(...at(e));
          ctx.stroke();
          setHasInk(true);
        }}
        onPointerUp={() => { drawing.current = false; }}
        onPointerCancel={() => { drawing.current = false; }}
      />
      <div className="row">
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        <button type="button" className="btn" disabled={!hasInk} onClick={clear}>Borrar</button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!hasInk}
          onClick={() => canvas.current!.toBlob((b) => { if (b) onSave(b); }, 'image/png')}
        >
          Guardar firma
        </button>
      </div>
    </div>
  );
}
