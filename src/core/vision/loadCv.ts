// OpenCV's generated bindings are untyped at the level we use them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Cv = any;

/** OpenCV lives in its own chunk, so importing this file does not download it. */
export async function loadCv(): Promise<Cv> {
  const { box } = await import('./opencvEntry');
  const cv: Cv = box.cv;
  await new Promise<void>((resolve) => {
    if (cv.Mat) resolve();
    else cv.onRuntimeInitialized = () => resolve();
  });
  // Otherwise returning it from this async function would await its self-resolving `then`.
  delete cv.then;
  return cv;
}
