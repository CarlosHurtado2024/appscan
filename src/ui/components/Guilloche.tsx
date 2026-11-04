import { useMemo } from 'react';

const WIDTH = 800;
const HEIGHT = 96;
const STRANDS = 14;
const SAMPLES = 400;
/** Whole periods, so the cord ends where it started and reads as one continuous band. */
const PERIODS = 11;

/** The interlaced cord printed along the edge of a cheque. Each strand is a full closed loop of phase. */
function cordPaths(): string[] {
  const paths: string[] = [];
  for (let line = 0; line < STRANDS; line++) {
    const phase = (line / STRANDS) * Math.PI * 2;
    let d = '';
    for (let i = 0; i <= SAMPLES; i++) {
      const t = i / SAMPLES;
      const amplitude = (HEIGHT / 2 - 4) * (0.72 + 0.28 * Math.cos(t * Math.PI * 2 * 3 + phase));
      const y = HEIGHT / 2 + amplitude * Math.sin(t * Math.PI * 2 * PERIODS + phase);
      d += `${i === 0 ? 'M' : 'L'}${(t * WIDTH).toFixed(1)} ${y.toFixed(1)}`;
    }
    paths.push(d);
  }
  return paths;
}

/** Stretches to any width instead of clipping; stroke width stays constant. */
export function Guilloche({ active = false }: { active?: boolean }) {
  const paths = useMemo(cordPaths, []);
  return (
    <svg className={`guilloche${active ? ' guilloche--active' : ''}`} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
      {paths.map((d) => <path key={d} d={d} pathLength={1} vectorEffect="non-scaling-stroke" />)}
    </svg>
  );
}

function rosettePaths(): string[] {
  const paths: string[] = [];
  const loops = 6;
  for (let loop = 0; loop < loops; loop++) {
    const offset = (loop / loops) * ((Math.PI * 2) / 18);
    let d = '';
    for (let i = 0; i <= 720; i++) {
      const t = (i / 720) * Math.PI * 2;
      const radius = 62 + 34 * Math.cos(18 * t);
      d += `${i === 0 ? 'M' : 'L'}${(100 + radius * Math.cos(t + offset)).toFixed(1)} ${(100 + radius * Math.sin(t + offset)).toFixed(1)}`;
    }
    paths.push(`${d}Z`);
  }
  return paths;
}

/** A closed rosette, the watermark of security paper. Never placed behind a document preview. */
export function Rosette() {
  const paths = useMemo(rosettePaths, []);
  return (
    <svg className="rosette" viewBox="0 0 200 200" aria-hidden="true">
      {paths.map((d) => <path key={d} d={d} />)}
    </svg>
  );
}
