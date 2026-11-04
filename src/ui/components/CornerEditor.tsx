import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import type { Quad } from '../../core/types';

const LENS_SIZE = 112;
const LENS_ZOOM = 2.5;
const LABELS = ['superior izquierda', 'superior derecha', 'inferior derecha', 'inferior izquierda'];
const KEY_STEP = 0.01;

const clamp = (v: number) => Math.min(1, Math.max(0, v));

type Props = {
  src: string;
  aspect: number;
  quad: Quad;
  valid: boolean;
  onChange: (q: Quad) => void;
};

export function CornerEditor({ src, aspect, quad, valid, onChange }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  function moveTo(index: number, e: ReactPointerEvent) {
    const rect = stage.current!.getBoundingClientRect();
    const next = quad.map((p) => ({ ...p })) as Quad;
    next[index] = { x: clamp((e.clientX - rect.left) / rect.width), y: clamp((e.clientY - rect.top) / rect.height) };
    onChange(next);
  }

  function nudge(index: number, dx: number, dy: number) {
    const next = quad.map((p) => ({ ...p })) as Quad;
    next[index] = { x: clamp(next[index].x + dx), y: clamp(next[index].y + dy) };
    onChange(next);
  }

  const points = quad.map((p) => `${p.x * 100},${p.y * 100}`).join(' ');
  const focus = active === null ? null : quad[active];
  const rect = stage.current?.getBoundingClientRect();

  return (
    <div className="crop-stage" ref={stage} data-testid="crop-stage" style={{ aspectRatio: aspect, '--crop-aspect': aspect } as CSSProperties}>
      <img src={src} alt="Foto original" draggable={false} />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polygon className={valid ? 'crop-outline' : 'crop-outline crop-outline--bad'} points={points} vectorEffect="non-scaling-stroke" />
      </svg>
      {quad.map((p, i) => (
        <button
          key={LABELS[i]}
          type="button"
          className="crop-handle"
          data-testid={`handle-${i}`}
          data-x={p.x}
          data-y={p.y}
          aria-label={`Esquina ${LABELS[i]}. Usa las flechas para moverla.`}
          style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            setActive(i);
          }}
          onPointerMove={(e) => { if (active === i) moveTo(i, e); }}
          onPointerUp={() => setActive(null)}
          onPointerCancel={() => setActive(null)}
          onKeyDown={(e) => {
            const delta = { ArrowLeft: [-KEY_STEP, 0], ArrowRight: [KEY_STEP, 0], ArrowUp: [0, -KEY_STEP], ArrowDown: [0, KEY_STEP] }[e.key];
            if (!delta) return;
            e.preventDefault();
            nudge(i, delta[0], delta[1]);
          }}
        />
      ))}
      {focus && rect && (
        <div
          className="crop-lens"
          aria-hidden="true"
          style={{
            // Sits away from the finger: on the opposite half of the image.
            left: focus.x < 0.5 ? `calc(100% - ${LENS_SIZE + 8}px)` : '8px',
            backgroundImage: `url("${src}")`,
            backgroundSize: `${rect.width * LENS_ZOOM}px ${rect.height * LENS_ZOOM}px`,
            backgroundPosition: `${LENS_SIZE / 2 - focus.x * rect.width * LENS_ZOOM}px ${LENS_SIZE / 2 - focus.y * rect.height * LENS_ZOOM}px`,
          }}
        />
      )}
    </div>
  );
}
