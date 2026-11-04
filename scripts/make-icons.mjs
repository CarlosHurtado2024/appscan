// Generates the PWA icons from public/icon.svg. Run: node scripts/make-icons.mjs
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const svg = readFileSync('public/icon.svg');
const render = (size, name) => sharp(svg, { density: 300 }).resize(size, size).png().toFile(`public/${name}`);

await render(192, 'icon-192.png');
await render(512, 'icon-512.png');
await render(180, 'apple-touch-icon.png');
console.log('icons ready');
