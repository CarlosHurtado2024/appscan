import { registerSW } from 'virtual:pwa-register';
import { vision } from '../core/vision/client';
import { UPDATE_EVENT } from './components/UpdatePrompt';

const WARM_UP_DELAY_MS = 1500;

let applyUpdate: (reload?: boolean) => Promise<void> = async () => {};

export const updateApp = () => applyUpdate(true);

export function startPwa() {
  applyUpdate = registerSW({
    onNeedRefresh: () => window.dispatchEvent(new Event(UPDATE_EVENT)),
  });

  // Asks the browser to keep documents even when the device runs low on space.
  navigator.storage?.persist?.().catch(() => {});

  // The heavy vision engine is fetched once, soon after opening, so scanning later works offline.
  window.setTimeout(() => vision.warmUp(), WARM_UP_DELAY_MS);
}
