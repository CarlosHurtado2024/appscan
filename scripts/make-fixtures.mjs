// Generates the images used by the e2e tests. Run: node scripts/make-fixtures.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const OUT = 'e2e/fixtures';
mkdirSync(OUT, { recursive: true });

const QUAD = [[0.18, 0.12], [0.84, 0.17], [0.9, 0.86], [0.11, 0.9]];

function inside(x, y) {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = QUAD[i], [bx, by] = QUAD[(i + 1) % 4];
    const s = Math.sign((bx - ax) * (y - ay) - (by - ay) * (x - ax));
    if (s === 0) continue;
    if (sign !== 0 && s !== sign) return false;
    sign = s;
  }
  return true;
}

function documentPixels(w, h) {
  const data = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = 55 + ((x * 7 + y * 13) % 11);
    if (inside(x / w, y / h)) {
      v = 232;
      if (y % 60 > 30 && y % 60 < 40 && x / w > 0.28 && x / w < 0.78) v = 40;
    }
    const i = (y * w + x) * 3;
    data[i] = v; data[i + 1] = v; data[i + 2] = v - 4;
  }
  return { data, raw: { width: w, height: h, channels: 3 } };
}

function encode(w, h) {
  const { data, raw } = documentPixels(w, h);
  return sharp(data, { raw }).jpeg({ quality: 80 });
}

await encode(900, 1200).toFile(`${OUT}/document.jpg`);

// Stored sideways (1200x900) with EXIF orientation 6: viewers must show it as 900x1200.
await sharp(await encode(900, 1200).toBuffer())
  .rotate(-90)
  .withMetadata({ orientation: 6 })
  .jpeg({ quality: 80 })
  .toFile(`${OUT}/exif-portrait.jpg`);

await sharp({ create: { width: 800, height: 1000, channels: 3, background: { r: 120, g: 120, b: 120 } } })
  .jpeg().toFile(`${OUT}/blank.jpg`);

const text = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600">
  <rect width="1200" height="600" fill="#fff"/>
  <text x="60" y="160" font-family="Arial" font-size="64" fill="#000">Factura número 1234</text>
  <text x="60" y="280" font-family="Arial" font-size="64" fill="#000">Señor Muñoz, año 2026</text>
  <text x="60" y="400" font-family="Arial" font-size="64" fill="#000">Dirección de envío</text>
</svg>`;
await sharp(Buffer.from(text)).jpeg({ quality: 90 }).toFile(`${OUT}/text-es.jpg`);

writeFileSync(`${OUT}/corrupt.jpg`, Buffer.from('esto no es una imagen'));
console.log('fixtures ready');
