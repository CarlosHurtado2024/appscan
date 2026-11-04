import { useMemo } from 'react';

const WIDTH = 800;
const HEIGHT = 96;
const STEP = 4;

/** Interlaced sine waves, the rosette line work printed on cheques to make them hard to forge. */
function wavePaths(): string[] {
  const paths: string[] = [];
  for (let line = 0; line < 14; line++) {
    const phase = (line / 14) * Math.PI * 2;
    let d = '';
    for (let x = 0; x <= WIDTH; x += STEP) {
      const t = x / WIDTH;
      const envelope = 30 + 12 * Math.sin(t * Math.PI * 6 + phase * 0.5);
      const y = HEIGHT / 2 + envelope * Math.sin(t * Math.PI * 22 + phase) * Math.cos(t * Math.PI * 3 + phase * 0.25);
      d += `${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`;
    }
    paths.push(d);
  }
  return paths;
}

export function Guilloche({ active = false }: { active?: boolean }) {
  const paths = useMemo(wavePaths, []);
  return (
    <svg className={`guilloche${active ? ' guilloche--active' : ''}`} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {paths.map((d) => <path key={d} d={d} />)}
    </svg>
  );
}
