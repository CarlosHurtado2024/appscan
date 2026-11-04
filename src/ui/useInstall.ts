import { useEffect, useState, useSyncExternalStore } from 'react';
import { installKind, type InstallKind } from './installKind';

type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

/** Android browsers fire their prompt soon after load; after this, explain the menu instead. */
const PROMPT_WAIT_MS = 4000;
const OFFER_KEY = 'appscan.installOffered';

let promptEvent: PromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

// Registered on import, before the first render, because the browser fires these only once.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  promptEvent = e as PromptEvent;
  notify();
});
window.addEventListener('appinstalled', () => {
  installed = true;
  promptEvent = null;
  notify();
});

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};

const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches
  || (navigator as Navigator & { standalone?: boolean }).standalone === true;

function readOfferAnswered() {
  try {
    return localStorage.getItem(OFFER_KEY) === '1';
  } catch {
    return false;
  }
}

function rememberOfferAnswered() {
  try {
    localStorage.setItem(OFFER_KEY, '1');
  } catch { /* the offer simply returns next time */ }
}

export function useInstall(): {
  kind: InstallKind;
  offerOpen: boolean;
  openOffer: () => void;
  closeOffer: () => void;
  install: () => Promise<void>;
} {
  const hasPrompt = useSyncExternalStore(subscribe, () => promptEvent !== null);
  const isInstalled = useSyncExternalStore(subscribe, () => installed);
  const [waited, setWaited] = useState(false);
  const [answered, setAnswered] = useState(readOfferAnswered);
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setWaited(true), PROMPT_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const kind = installKind({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    standalone: isInstalled || isStandalone(),
    hasPrompt,
    waited,
  });

  function closeOffer() {
    rememberOfferAnswered();
    setAnswered(true);
    setReopened(false);
  }

  async function install() {
    const event = promptEvent;
    closeOffer();
    if (!event) return;
    // A prompt can be used only once; the browser fires a new event if it may be offered again.
    promptEvent = null;
    notify();
    await event.prompt();
    await event.userChoice;
  }

  return {
    kind,
    offerOpen: kind !== 'none' && (!answered || reopened),
    openOffer: () => setReopened(true),
    closeOffer,
    install,
  };
}
