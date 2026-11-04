export type Point = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };

/** Ordered top-left, top-right, bottom-right, bottom-left; relative (0..1) to the oriented original. */
export type Quad = [Point, Point, Point, Point];

/** RGBA pixels, compatible with ImageData. */
export type Raster = { width: number; height: number; data: Uint8ClampedArray };

export type FilterName = 'original' | 'enhanced' | 'gray' | 'bw';
export type Rotation = 0 | 90 | 180 | 270;

export type Annotation =
  | { type: 'signature'; signatureId: string; box: Box }
  | { type: 'text'; text: string; box: Box; color: string }
  | { type: 'stroke'; points: Point[]; color: string; width: number };

export type Doc = {
  id: string;
  title: string;
  kind: 'normal' | 'id-card';
  pageIds: string[];
  createdAt: number;
  updatedAt: number;
};

export type Page = {
  id: string;
  docId: string;
  original: Blob;
  corners: Quad;
  rotation: Rotation;
  filter: FilterName;
  annotations: Annotation[];
  rendered: Blob;
  thumb: Blob;
  ocrText?: string;
};

export type Signature = { id: string; image: Blob; createdAt: number };
