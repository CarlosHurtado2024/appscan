import { useEffect, useState } from 'react';

export const UPDATE_EVENT = 'appscan:update-ready';

/** Never reloads on its own: the person could be in the middle of editing a page. */
export function UpdatePrompt({ onUpdate }: { onUpdate: () => void }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const show = () => setReady(true);
    window.addEventListener(UPDATE_EVENT, show);
    return () => window.removeEventListener(UPDATE_EVENT, show);
  }, []);

  if (!ready) return null;

  return (
    <aside className="banner">
      <p>Hay una nueva versión de AppScan.</p>
      <button type="button" className="btn btn--small" onClick={onUpdate}>Actualizar</button>
    </aside>
  );
}
