// Copies the OCR engine and Spanish data to public/ocr so they are served from our own origin.
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'public/ocr';
mkdirSync(OUT, { recursive: true });

const worker = 'node_modules/tesseract.js/dist/worker.min.js';
const core = 'node_modules/tesseract.js-core';
const lang = 'node_modules/@tesseract.js-data/spa/4.0.0_best_int/spa.traineddata.gz';

for (const required of [worker, core, lang]) {
  if (!existsSync(required)) throw new Error(`Falta ${required}. Ejecuta npm install.`);
}

copyFileSync(worker, join(OUT, 'worker.min.js'));
copyFileSync(lang, join(OUT, 'spa.traineddata.gz'));
// LSTM-only builds fit the *_best_int data. Each .wasm.js embeds its own WebAssembly.
for (const file of readdirSync(core)) {
  if (/^tesseract-core.*lstm\.wasm\.js$/.test(file)) copyFileSync(join(core, file), join(OUT, file));
}
console.log('OCR assets ready in', OUT);
