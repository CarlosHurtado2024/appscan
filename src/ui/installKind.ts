export type InstallKind = 'prompt' | 'ios' | 'android-menu' | 'none';

type Input = {
  userAgent: string;
  maxTouchPoints: number;
  standalone: boolean;
  /** The browser offered its own install prompt. */
  hasPrompt: boolean;
  /** Enough time has passed that the browser's prompt is unlikely to arrive. */
  waited: boolean;
};

/** Which way of installing this browser supports, if any. */
export function installKind({ userAgent, maxTouchPoints, standalone, hasPrompt, waited }: Input): InstallKind {
  if (standalone) return 'none';
  if (hasPrompt) return 'prompt';
  // iPadOS reports itself as a Mac; only the touch screen tells them apart.
  if (/iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)) return 'ios';
  if (/Android/.test(userAgent) && waited) return 'android-menu';
  return 'none';
}
