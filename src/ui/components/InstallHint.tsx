import { useState } from 'react';

const KEY = 'appscan.installHintDismissed';

function shouldShow() {
  const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const installed = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (!isIos || installed) return false;
  try {
    return localStorage.getItem(KEY) !== '1';
  } catch {
    return true;
  }
}

/** iOS has no install prompt, and can erase data of sites that are not installed. */
export function InstallHint() {
  const [visible, setVisible] = useState(shouldShow);
  if (!visible) return null;

  return (
    <aside className="notice">
      <div>
        <strong>Instala AppScan en tu iPhone</strong>
        <p>En Safari toca Compartir y luego «Agregar a inicio». Úsala siempre desde ese icono para que iOS no borre tus documentos.</p>
      </div>
      <button
        type="button"
        className="btn btn--small"
        onClick={() => {
          try {
            localStorage.setItem(KEY, '1');
          } catch { /* the hint simply returns next time */ }
          setVisible(false);
        }}
      >
        Ocultar
      </button>
    </aside>
  );
}
