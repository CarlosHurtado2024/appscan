# AppScan PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and publish AppScan, an installable, offline, device-only document scanner PWA in Spanish.

**Architecture:** Static Vite + React app with no backend. Pure logic lives in `src/core` and has no React. OpenCV runs in a Web Worker. Documents live in IndexedDB. Edits are non-destructive: each page keeps its original photo plus parameters, and the output is regenerated from them.

**Tech Stack:** Vite 8, React 19, TypeScript, `@techstark/opencv-js@4.12.0-release.1` (pinned; 5.0 is too new), `pdf-lib`, `tesseract.js` 7, `@tesseract.js-data/spa`, `idb`, `vite-plugin-pwa`. Dev: Vitest, `fake-indexeddb`, `@playwright/test` (`channel: 'chrome'`, no browser download), `sharp` (fixtures and icons only).

**Spec:** `docs/superpowers/specs/2026-11-03-appscan-pwa-design.md`

## Global Constraints

- All user-facing text is in Spanish. OCR language is `spa`.
- App name "AppScan" with its own icon. No code, text, icons, name or visual design from CamScanner; do not use its green-and-white look.
- No analytics, no accounts, no images uploaded, no third-party requests at runtime. CSP `connect-src` is limited to our own origin.
- Vite `base: '/appscan/'`. Target URL: `https://carloshurtado2024.github.io/appscan/`.
- Originals are limited to 4000 px on the longest side. Default filter is `enhanced`.
- ID sheet: A4 with both sides at real size, 85.6 × 54 mm.
- Annotation and corner coordinates are relative (0 to 1).
- Detected corners must land within 3 % of the longest side on the synthetic images.
- OpenCV and Tesseract load only when needed and are cached. Tesseract assets are served from our own domain.
- If compressed OpenCV exceeds 15 MB, stop and report it (spec section 10).
- Every commit ends with: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

## Review Focus

Each line has a test in the owning task.

1. Gallery photo in portrait with EXIF rotation must appear upright, not sideways (Task 4, `e2e/import.spec.ts`).
2. A file the browser cannot decode (HEIC, PDF, corrupt) in a batch must show a clear message and still import the other files (Task 6).
3. Closing the app halfway through a multi-page scan must keep the pages already captured (Task 8).
4. Dragging crop corners into a crossed or collapsed shape must block "Aplicar" rather than produce a garbage page (Tasks 1 and 7).
5. Rotating an annotated page must keep marks on the same content, and deleting a signature used on a page must be refused (Tasks 1, 3 and 9).

---

## File Structure

```
index.html                     CSP meta, root
vite.config.ts                 base, PWA plugin, worker config
scripts/copy-ocr-assets.mjs    copies OCR files to public/ocr (predev, prebuild)
scripts/make-icons.mjs         icons from public/icon.svg
scripts/make-fixtures.mjs      JPEG fixtures for e2e
src/core/types.ts              shared types
src/core/geometry.ts           corner math
src/core/annotations.ts        annotation transforms
src/core/filters.ts            pixel filters
src/core/image.ts              decode, orient, resize, encode
src/core/vision/detect.ts      OpenCV algorithms (takes cv as argument)
src/core/vision/vision.worker.ts  loads OpenCV, answers messages
src/core/vision/client.ts      promise API over the worker
src/core/render.ts             page + parameters to output images
src/core/pdf.ts                PDF and ID sheet
src/core/share.ts              share or download
src/core/ocr.ts                Tesseract wrapper
src/storage/db.ts              IndexedDB
src/ui/router.ts               hash routes
src/ui/screens/*.tsx           one file per screen
src/ui/components/*.tsx        shared widgets
src/ui/theme.css               design tokens and base styles
src/App.tsx, src/main.tsx      entry
e2e/*.spec.ts                  Playwright, mobile viewport
.github/workflows/deploy.yml   test, build, publish to Pages
```

---

### Task 1: Project setup and pure page math

**Files:**
- Create: project config (`package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `.gitignore`), `src/core/types.ts`, `src/core/geometry.ts`, `src/core/annotations.ts`
- Test: `src/core/geometry.test.ts`, `src/core/annotations.test.ts`

**Interfaces:**
- Produces, in `types.ts`:
  - `Point = {x:number;y:number}`; `Box = {x:number;y:number;w:number;h:number}`
  - `Quad = [Point,Point,Point,Point]`, ordered top-left, top-right, bottom-right, bottom-left, relative to the oriented original
  - `Raster = {width:number;height:number;data:Uint8ClampedArray}` (RGBA, compatible with `ImageData`)
  - `FilterName`, `Rotation`, `Annotation`, `Doc`, `Page`, `Signature` exactly as in spec section 4
- Produces, in `geometry.ts`: `fullQuad(): Quad`, `orderCorners(pts: Point[]): Quad`, `isValidQuad(q: Quad): boolean`, `outputSize(q: Quad, srcW: number, srcH: number): {width:number;height:number}`, `boundsOf(q: Quad): Box`
- Produces, in `annotations.ts`: `rotateAnnotations(a: Annotation[], delta: 90|180|270): Annotation[]`

- [ ] **Step 1: Scaffold.** Create the Vite React TS project in the repo root and install the Tech Stack. Set `base: '/appscan/'`. Add scripts `dev`, `build`, `preview`, `test` (`vitest run`), `e2e` (`playwright test`).

- [ ] **Step 2: Write failing tests**

```ts
// geometry.test.ts
test('orderCorners sorts any input order to TL,TR,BR,BL')
test('fullQuad is the unit square and valid')
test('isValidQuad rejects a crossed quad', () =>
  expect(isValidQuad([p(0,0),p(1,1),p(1,0),p(0,1)])).toBe(false))
test('isValidQuad rejects concave quads')
test('isValidQuad rejects area below 2% of the image')
test('isValidQuad rejects points outside 0..1')
test('outputSize uses longest opposite edges in pixels', () =>
  expect(outputSize(fullQuad(), 2000, 1000)).toEqual({width:2000,height:1000}))
// annotations.test.ts
test('rotating a stroke 90° four times returns the original points')
test('rotating 90° maps relative point (x,y) to (1-y,x)')
test('rotating a box keeps it inside 0..1 and swaps w and h')
test('rotateAnnotations leaves the input array unchanged')
```

- [ ] **Step 3: Run `npm test`.** Expected: FAIL, functions not defined.
- [ ] **Step 4: Implement both modules.** Text and signature boxes move with the page but stay upright; only their position and box change.
- [ ] **Step 5: Run `npm test`.** Expected: PASS.
- [ ] **Step 6: Commit** `feat: scaffold project and add page geometry`.

### Task 2: Filters

**Files:** Create `src/core/filters.ts`; test `src/core/filters.test.ts`

**Interfaces:**
- Consumes: `Raster`, `FilterName`
- Produces: `applyFilter(src: Raster, filter: FilterName): Raster`

- [ ] **Step 1: Write failing tests**, using a synthetic page: a light gradient background (uneven lighting, 180 to 240) with dark text-like bars.

```ts
test('original returns equal pixels')
test('no filter mutates its input')
test('gray output has R=G=B and same dimensions')
test('bw output contains only 0 and 255')
test('bw keeps >95% of background white under uneven lighting')
test('bw keeps >90% of the bar pixels black')
test('enhanced raises background brightness above 235 on average')
test('enhanced keeps bars darker than 100 on average')
test('all filters handle a 1x1 raster')
test('all filters handle a uniform raster without NaN')
```

- [ ] **Step 2: Run** `npm test -- filters`. Expected: FAIL.
- [ ] **Step 3: Implement.** `bw`: Bradley adaptive threshold with an integral image, window = `max(w,h)/16`, t = 15 %. `enhanced`: per-channel division by a heavily downsampled, blurred background estimate, then a 1 %–99 % contrast stretch.
- [ ] **Step 4: Run** `npm test -- filters`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add document filters`.

### Task 3: Storage

**Files:** Create `src/storage/db.ts`; test `src/storage/db.test.ts` (with `fake-indexeddb/auto`)

**Interfaces:**
- Consumes: `Doc`, `Page`, `Signature`
- Produces:
  - `type PageInput = Omit<Page,'id'|'docId'>`
  - `createDoc(title: string, kind?: Doc['kind']): Promise<Doc>`, `getDoc(id)`, `listDocs(): Promise<Doc[]>` (newest `updatedAt` first), `renameDoc(id, title)`, `deleteDoc(id)`
  - `addPage(docId, input: PageInput): Promise<Page>`, `getPage(id)`, `getPages(docId): Promise<Page[]>` (in `pageIds` order), `updatePage(id, patch: Partial<PageInput>): Promise<Page>`
  - `deletePage(id): Promise<{docDeleted:boolean}>`, `reorderPages(docId, ids: string[])`
  - `mergeDocs(ids: string[], title: string): Promise<Doc>`
  - `addSignature(image: Blob): Promise<Signature>`, `listSignatures()`, `getSignature(id)`, `deleteSignature(id)`
  - Errors: `StorageFullError`, `SignatureInUseError` (with `count`)

- [ ] **Step 1: Write failing tests**

```ts
test('page survives reopening the database')
test('addPage appends to pageIds and bumps updatedAt')
test('getPages follows reorderPages order')
test('reorderPages rejects ids that are not an exact permutation')
test('deleteDoc removes its pages')
test('deleting the last page deletes the doc and reports docDeleted')
test('mergeDocs copies pages in the given order with new ids')
test('mergeDocs leaves source docs unchanged')
test('deleteSignature throws SignatureInUseError with count when a page uses it')
test('deleteSignature succeeds when unused')
test('QuotaExceededError is surfaced as StorageFullError')
```

- [ ] **Step 2: Run** `npm test -- db`. Expected: FAIL.
- [ ] **Step 3: Implement with `idb`.** Stores: `docs`, `pages` (index `docId`), `signatures`. Multi-store changes use one transaction.
- [ ] **Step 4: Run** `npm test -- db`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add local document storage`.

### Task 4: Vision, image loading and render

**Files:**
- Create: `src/core/vision/detect.ts`, `src/core/vision/vision.worker.ts`, `src/core/vision/client.ts`, `src/core/image.ts`, `src/core/render.ts`, `scripts/make-fixtures.mjs`, `playwright.config.ts`
- Test: `src/core/vision/detect.test.ts`, `e2e/import.spec.ts`

**Interfaces:**
- Consumes: `Quad`, `Raster`, `applyFilter`, `outputSize`, `boundsOf`
- Produces:
  - `detectCorners(cv, src: Raster): Quad | null`; `warpPerspective(cv, src: Raster, q: Quad, size): Raster`
  - `vision.detect(r: Raster): Promise<Quad|null>`, `vision.warp(r, q): Promise<Raster>`, `vision.warmUp(): void`; rejects with `VisionUnavailableError` if OpenCV fails to load
  - `normalizeImage(file: Blob): Promise<{blob:Blob;width:number;height:number}>` (applies EXIF orientation, caps at 4000 px, JPEG 0.92); throws `UnsupportedImageError`
  - `blobToRaster(b: Blob, maxSide?: number): Promise<Raster>`, `rasterToBlob(r: Raster, quality?: number): Promise<Blob>`
  - `renderPage(p: Pick<Page,'original'|'corners'|'rotation'|'filter'|'annotations'>, sigs: Map<string,Blob>): Promise<{rendered:Blob;thumb:Blob}>`

- [ ] **Step 1: Write failing tests** with synthetic rasters drawn by point-in-polygon, running real OpenCV in Node.

```ts
test('detects a white sheet with perspective on a dark table within 3% of the longest side')
test('detects a white sheet on a mid-gray table within 3%')
test('returns null on uniform noise, without throwing')
test('returns null when the largest shape covers under 20% of the frame')
test('warp rectifies a known quad: output corners match the sheet color')
```

```ts
// e2e/import.spec.ts — portrait fixture with EXIF orientation 6
test('normalizeImage returns a portrait image from an EXIF-rotated JPEG', ...)
```

- [ ] **Step 2: Run** `npm test -- detect`. Expected: FAIL.
- [ ] **Step 3: Implement `detect.ts`.** Downscale to at most 500 px, gray, Gaussian blur, Canny, dilate, `findContours`, `approxPolyDP`. Keep the largest convex 4-point contour covering at least 20 %. If none, retry with an Otsu threshold. Free every `Mat`.
- [ ] **Step 4: Run** `npm test -- detect`. Expected: PASS.
- [ ] **Step 5: Implement the worker and client.** Use a dynamic import inside the worker so OpenCV is a separate chunk, and transfer pixel buffers rather than copying them. Process one job at a time.
- [ ] **Step 6: Implement `image.ts` and `render.ts`.** Pipeline order: warp → rotate → filter → annotations → encode (JPEG 0.85), thumb at 320 px. On `VisionUnavailableError`, crop with `boundsOf` (rectangular). On an allocation failure, retry once at 2000 px.
- [ ] **Step 7: Generate fixtures and run** `npx playwright test import`. Expected: PASS. Add `e2e/render.spec.ts`: rendering a fixture with a stored quad returns a non-empty JPEG with the expected dimensions.
- [ ] **Step 8: Measure** the compressed OpenCV chunk from `npm run build`. Expected: 15 MB or less; otherwise stop and report.
- [ ] **Step 9: Commit** `feat: add vision worker and page rendering`.

### Task 5: PDF and sharing

**Files:** Create `src/core/pdf.ts`, `src/core/share.ts`; test `src/core/pdf.test.ts`, `src/core/share.test.ts`

**Interfaces:**
- Produces:
  - `type PdfImage = {bytes:Uint8Array;width:number;height:number}`
  - `buildPdf(images: PdfImage[], opts: {pageSize:'a4'|'fit'}): Promise<Uint8Array>`
  - `idCardLayout(): {front:Box;back:Box}` (PDF points on A4)
  - `buildIdCardSheet(front: PdfImage, back: PdfImage): Promise<Uint8Array>`
  - `safeFilename(title: string): string`
  - `sharePdf(bytes: Uint8Array, title: string): Promise<'shared'|'downloaded'|'cancelled'>`

- [ ] **Step 1: Write failing tests** (reload the output with `pdf-lib`).

```ts
test('buildPdf has one page per image')
test('a4 pages measure 595.28 x 841.89 points')
test('a landscape image gets a landscape A4 page')
test('fit pages match the image aspect ratio')
test('buildPdf rejects an empty list')
test('idCardLayout sizes are 242.65 x 153.07 points, centred, not overlapping')
test('buildIdCardSheet returns one A4 page')
test('safeFilename strips / \\ : * ? " < > | and falls back to "documento"')
test('sharePdf returns cancelled on AbortError and does not download')
test('sharePdf downloads when files cannot be shared')
```

- [ ] **Step 2: Run** `npm test -- pdf share`. Expected: FAIL.
- [ ] **Step 3: Implement both modules.**
- [ ] **Step 4: Run** `npm test -- pdf share`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add PDF export and sharing`.

### Task 6: App shell, library, import and document screen

**Files:**
- Create: `src/main.tsx`, `src/App.tsx`, `src/ui/router.ts`, `src/ui/theme.css`, `src/ui/screens/Library.tsx`, `src/ui/screens/Document.tsx`, `src/ui/components/Toast.tsx`, `src/ui/useImport.ts`
- Test: `e2e/library.spec.ts`

**Interfaces:**
- Consumes: `storage/db`, `normalizeImage`, `vision`, `renderPage`, `buildPdf`, `sharePdf`
- Produces:
  - Hash routes: `#/`, `#/doc/:id`, `#/scan?doc=:id&mode=normal|id`, `#/crop/:pageId`, `#/page/:pageId`, `#/annotate/:pageId`, `#/merge`
  - `useRoute(): {path; params; navigate(to)}`
  - `importFiles(files: File[], docId?: string): Promise<{doc:Doc; failed:string[]}>`

- [ ] **Step 1: Set the visual direction.** Invoke the `impeccable` skill for tokens and layout in `theme.css`. Mobile first, touch targets of at least 44 px, light and dark modes, within Global Constraints.
- [ ] **Step 2: Write failing e2e tests**

```ts
test('empty library explains how to start and offers Escanear and Importar')
test('importing an image creates a document with a thumbnail')
test('documents persist after a page reload')
test('search filters documents by title')
test('importing a corrupt file plus a valid one reports the bad file and keeps the good one')
test('pages can be moved earlier and later, and order survives reload')
test('deleting the last page asks for confirmation, then removes the document')
test('export produces a PDF download named after the document')
```

- [ ] **Step 3: Run** `npm run e2e -- library`. Expected: FAIL.
- [ ] **Step 4: Implement the screens.** Reordering uses "mover antes/después" buttons on each page, which are reliable on touch and accessible. Show a storage warning for `StorageFullError`, and show the no-backup notice once.
- [ ] **Step 5: Run** `npm run e2e -- library`. Expected: PASS.
- [ ] **Step 6: Commit** `feat: add library and document screens`.

### Task 7: Crop and page editing

**Files:** Create `src/ui/screens/Crop.tsx`, `src/ui/screens/PageEdit.tsx`, `src/ui/components/CornerEditor.tsx`; test `e2e/edit.spec.ts`

**Interfaces:**
- Consumes: `isValidQuad`, `fullQuad`, `vision.detect`, `renderPage`, `updatePage`, `rotateAnnotations`

- [ ] **Step 1: Write failing e2e tests**

```ts
test('crop opens with detected corners on a document photo')
test('a photo with no document proposes the full image and still allows Aplicar')
test('dragging a corner across the opposite edge disables Aplicar and explains why')
test('Volver a detectar restores detected corners')
test('changing the filter updates the page and survives reload')
test('reopening crop shows saved corners; the original photo is intact')
test('rotation changes page dimensions')
```

- [ ] **Step 2: Run** `npm run e2e -- edit`. Expected: FAIL.
- [ ] **Step 3: Implement.** Corners use pointer events with a magnifier while dragging. Rotation calls `rotateAnnotations` and re-renders. If vision is unavailable, show a notice and allow rectangular crop.
- [ ] **Step 4: Run** `npm run e2e -- edit`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add crop and page editing`.

### Task 8: Camera, multi-page and ID mode

**Files:** Create `src/ui/screens/Scan.tsx`, `src/ui/useCamera.ts`, `src/ui/useLiveDetection.ts`; test `e2e/scan.spec.ts`

**Interfaces:**
- Consumes: `vision`, `addPage`, `createDoc`, `renderPage`, `buildIdCardSheet`
- Produces: `useCamera(): {videoRef; status:'starting'|'ready'|'denied'|'unavailable'; capture(): Promise<Blob>}`

- [ ] **Step 1: Write failing e2e tests**, using Chrome's `--use-fake-device-for-media-stream` and `--use-fake-ui-for-media-stream`.

```ts
test('capture creates a page and opens crop')
test('multi-page mode adds pages to the same document in order')
test('reloading mid-scan keeps pages already captured')
test('camera denied shows instructions and a gallery option')
test('leaving the scan screen stops all camera tracks')
test('ID mode asks for front, then back, and creates an id-card document with 2 pages')
test('exporting an id-card document yields a one-page A4 PDF')
```

- [ ] **Step 2: Run** `npm run e2e -- scan`. Expected: FAIL.
- [ ] **Step 3: Implement.** Request the rear camera at the highest resolution (`facingMode: environment`, ideal 3840×2160). Live detection runs about 4 fps on a frame of at most 500 px, skipping frames while a job is running. Save each capture right away. Fallback input: `<input type=file accept=image/* capture=environment>`.
- [ ] **Step 4: Run** `npm run e2e -- scan`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add camera scanning and ID card mode`.

### Task 9: Annotations and signatures

**Files:** Create `src/ui/screens/Annotate.tsx`, `src/ui/components/SignaturePad.tsx`; test `e2e/annotate.spec.ts`

**Interfaces:**
- Consumes: `addSignature`, `listSignatures`, `deleteSignature`, `getSignature`, `SignatureInUseError`, `renderPage`, `updatePage`

- [ ] **Step 1: Write failing e2e tests**

```ts
test('a drawn signature is saved and listed for reuse')
test('a saved signature can be placed, moved and resized on a page')
test('text and freehand marks appear in the rendered page')
test('annotations survive reload and can be undone')
test('annotations stay on the same content after rotating the page')
test('deleting a signature in use is refused with the page count')
test('an empty signature cannot be saved')
```

- [ ] **Step 2: Run** `npm run e2e -- annotate`. Expected: FAIL.
- [ ] **Step 3: Implement.** Signature strokes export as PNG with transparency. Under `bw`, annotations still render on top, so they are never thresholded.
- [ ] **Step 4: Run** `npm run e2e -- annotate`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add annotations and signatures`.

### Task 10: OCR and merge

**Files:** Create `src/core/ocr.ts`, `scripts/copy-ocr-assets.mjs`, `src/ui/components/OcrPanel.tsx`, `src/ui/screens/Merge.tsx`; test `e2e/ocr.spec.ts`, `e2e/merge.spec.ts`

**Interfaces:**
- Consumes: `updatePage`, `mergeDocs`
- Produces: `recognize(image: Blob, onProgress: (p:number)=>void): Promise<string>`; `OcrUnavailableError`

- [ ] **Step 1: Write failing e2e tests**

```ts
test('OCR extracts Spanish text, with accents, from a rendered fixture')
test('recognized text is saved on the page and can be copied')
test('OCR shows progress during the first download')
test('OCR while offline before download shows a message and leaves the page intact')
test('OCR requests only same-origin URLs')
test('merge creates a new document in selection order; sources are unchanged')
test('merge needs at least two documents selected')
```

- [ ] **Step 2: Run** `npm run e2e -- ocr merge`. Expected: FAIL.
- [ ] **Step 3: Implement.** The copy script puts the Tesseract worker, core and `spa.traineddata.gz` in `public/ocr/` (git-ignored). Call `createWorker('spa', 1, {workerPath, corePath, langPath, workerBlobURL:false})` with paths under `import.meta.env.BASE_URL + 'ocr/'`.
- [ ] **Step 4: Run** `npm run e2e -- ocr merge`. Expected: PASS.
- [ ] **Step 5: Measure** the OCR download and record the real size in the README.
- [ ] **Step 6: Commit** `feat: add OCR and document merge`.

### Task 11: Installable and offline

**Files:** Modify `vite.config.ts`, `index.html`, `src/main.tsx`; create `public/icon.svg`, `scripts/make-icons.mjs`, `src/ui/components/UpdatePrompt.tsx`; test `e2e/pwa.spec.ts`

**Interfaces:**
- Consumes: `vision.warmUp`

- [ ] **Step 1: Write failing e2e tests** against `npm run preview`.

```ts
test('manifest has name, start_url, scope /appscan/, standalone display, 192 and 512 icons incl. maskable')
test('service worker activates and controls the page after reload')
test('after first load, offline: app opens and an imported image reaches a PDF')
test('after first OCR, offline: OCR still works')
test('no request leaves our origin during a full scan-to-PDF flow')
test('the update prompt appears on a new version and does not reload by itself')
test('all features work under the CSP, with no violations in the console')
```

- [ ] **Step 2: Run** `npm run e2e -- pwa`. Expected: FAIL.
- [ ] **Step 3: Implement.** `vite-plugin-pwa` with `registerType:'prompt'`. Precache the app shell and exclude OpenCV and `ocr/`. Add `CacheFirst` runtime caching for those. Call `vision.warmUp()` when idle after the first launch so scanning works offline afterward. Call `navigator.storage.persist()` at startup. Show an install hint for iPhone recommending the installed app. CSP meta:

```
default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self';
connect-src 'self'; img-src 'self' blob: data:; media-src 'self' blob: mediastream:;
style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'
```

If OpenCV needs `'unsafe-eval'`, add it only if the OpenCV build cannot run without it, and report that in the commit message.

- [ ] **Step 4: Run** `npm run e2e -- pwa`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: make the app installable and offline`.

### Task 12: REA audit, publish and hand-off

**Files:** Create `.github/workflows/deploy.yml`, `README.md`, `docs/rea-audit.md`

- [ ] **Step 1: Write the workflow.** On push to `main`: `npm ci`, `npm test`, `npm run build`, `actions/upload-pages-artifact`, `actions/deploy-pages`. Permissions: `pages: write`, `id-token: write`. The e2e suite runs locally, not in CI.
- [ ] **Step 2: Write the README in Spanish.** Include what it is, how to install on Android and iPhone, privacy, the no-backup warning, measured download sizes, how to develop, and third-party licences (OpenCV and Tesseract, Apache-2.0).
- [ ] **Step 3: Run everything.** `npm test && npm run build && npm run e2e`. Expected: all pass.
- [ ] **Step 4: Audit the local build with REA.** Run `capture_browser_scenario` (Chrome launch mode) against `npm run preview`. Set `environment` to allow service workers, and capture `events: ["network","workers","console","page-errors"]` and final `storage`. Expected: service worker observed, every network host is the preview origin, no page errors. Also run `analyze_web_bundle` on `dist/`; expected: only declared dependencies.
- [ ] **Step 5: Commit and push.** `git push -u origin main`. If the push is refused, stop and tell the user: it means the GitHub account on this machine lacks write access to `CarlosHurtado2024/appscan`. Do not change remotes or credentials.
- [ ] **Step 6: Check Pages.** Fetch the target URL after the workflow finishes. If it is not published, ask the user to set Settings → Pages → Source to "GitHub Actions" in the repository, then re-run.
- [ ] **Step 7: Audit the published site with REA,** using the same scenario as Step 4 against the target URL, plus an offline reload. Record observations, Evidence IDs and limitations in `docs/rea-audit.md`. Commit and push it.
- [ ] **Step 8: Hand off.** Give the user the URL and a short real-phone checklist: install, camera, multi-page scan, share PDF, airplane mode. Report these as not verified until the user runs them.
