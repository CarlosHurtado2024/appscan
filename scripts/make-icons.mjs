// Draws the app icon and exports every size. Run: node scripts/make-icons.mjs
// Everything is authored here as vectors: no external artwork is used.
import { writeFileSync } from 'node:fs';
import sharp from 'sharp';

const SIZE = 512;
const CENTER = SIZE / 2;

/** Closed, interlaced security line work, the same family as the app's rosette. */
function rosette(radius, depth, petals, loops) {
  const paths = [];
  for (let loop = 0; loop < loops; loop++) {
    const offset = (loop / loops) * ((Math.PI * 2) / petals);
    let d = '';
    for (let i = 0; i <= 480; i++) {
      const t = (i / 480) * Math.PI * 2;
      const r = radius + depth * Math.cos(petals * t);
      d += `${i === 0 ? 'M' : 'L'}${(CENTER + r * Math.cos(t + offset)).toFixed(1)} ${(CENTER + r * Math.sin(t + offset)).toFixed(1)}`;
    }
    paths.push(`<path d="${d}Z"/>`);
  }
  return paths.join('');
}

const DEFS = `<defs>
  <linearGradient id="ground" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#3a3cc0"/>
    <stop offset="0.55" stop-color="#23246b"/>
    <stop offset="1" stop-color="#14154a"/>
  </linearGradient>
  <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#8f93ff" stop-opacity="0"/>
    <stop offset="0.5" stop-color="#5c60f2"/>
    <stop offset="1" stop-color="#8f93ff" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="sheet" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffffff"/>
    <stop offset="1" stop-color="#ecebfb"/>
  </linearGradient>
  <filter id="lift" x="-30%" y="-30%" width="160%" height="160%">
    <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#0b0c33" flood-opacity="0.55"/>
  </filter>
</defs>`;

/** The motif stays inside the central 80% circle that maskable icons guarantee. */
const MOTIF = `
  <g fill="none" stroke="#a9acf5" stroke-width="1.6" opacity="0.32">${rosette(176, 58, 16, 5)}</g>
  <g transform="rotate(-5 256 256)" filter="url(#lift)">
    <path d="M178 124h116l50 50v214a12 12 0 0 1-12 12H178a12 12 0 0 1-12-12V136a12 12 0 0 1 12-12Z" fill="url(#sheet)"/>
    <path d="M294 124l50 50h-38a12 12 0 0 1-12-12Z" fill="#c4c5f0"/>
    <g stroke="#23246b" stroke-width="13" stroke-linecap="round">
      <path d="M198 196h82"/>
      <path d="M198 234h116"/>
      <path d="M198 310h116"/>
    </g>
    <path d="M198 352h56" stroke="#b3123c" stroke-width="13" stroke-linecap="round"/>
  </g>
  <path d="M116 269h280" stroke="url(#beam)" stroke-width="9" stroke-linecap="round"/>
  <g fill="none" stroke="#ffffff" stroke-width="15" stroke-linecap="round" stroke-linejoin="round">
    <path d="M122 158v-30a20 20 0 0 1 20-20h30"/>
    <path d="M340 108h30a20 20 0 0 1 20 20v30"/>
    <path d="M390 354v30a20 20 0 0 1-20 20h-30"/>
    <path d="M172 404h-30a20 20 0 0 1-20-20v-30"/>
  </g>`;

const svg = (ground) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">${DEFS}${ground}${MOTIF}</svg>`;

// Rounded for browsers and desktops; full bleed where the system applies its own mask.
const rounded = svg(`<rect width="${SIZE}" height="${SIZE}" rx="112" fill="url(#ground)"/>`);
const fullBleed = svg(`<rect width="${SIZE}" height="${SIZE}" fill="url(#ground)"/>`);

writeFileSync('public/icon.svg', rounded);

const png = (source, size, name) => sharp(Buffer.from(source), { density: 300 }).resize(size, size).png({ compressionLevel: 9 }).toFile(`public/${name}`);

await png(rounded, 192, 'icon-192.png');
await png(rounded, 512, 'icon-512.png');
await png(fullBleed, 192, 'icon-maskable-192.png');
await png(fullBleed, 512, 'icon-maskable-512.png');
await png(fullBleed, 180, 'apple-touch-icon.png');
console.log('icons ready');
