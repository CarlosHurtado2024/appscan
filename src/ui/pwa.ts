import { registerSW } from 'virtual:pwa-register';
import { UPDATE_EVENT } from './components/UpdatePrompt';

let applyUpdate: (reload?: boolean) => Promise<void> = async () => {};

export const updateApp = () => applyUpdate(true);

export function startPwa() {
  applyUpdate = registerSW({
    onNeedRefresh: () => window.dispatchEvent(new Event(UPDATE_EVENT)),
  });

  // Asks the browser to keep documents even when the device runs low on space.
  navigator.storage?.persist?.().catch(() => {});
}
