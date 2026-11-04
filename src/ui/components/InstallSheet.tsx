import type { InstallKind } from '../installKind';
import { AppMark } from './AppMark';
import { Icon } from './Icon';

type Props = {
  kind: Exclude<InstallKind, 'none'>;
  onInstall: () => void;
  onClose: () => void;
};

/** A sheet, not a modal: the person can ignore it and start scanning straight away. */
export function InstallSheet({ kind, onInstall, onClose }: Props) {
  return (
    <aside className="install-sheet" role="dialog" aria-labelledby="install-title">
      <div className="install-sheet__head">
        <AppMark size={56} />
        <div>
          <h2 id="install-title">Descarga AppScan en tu celular</h2>
          <p>Ábrela desde tu pantalla de inicio. Funciona sin conexión.</p>
        </div>
      </div>

      {kind === 'ios' && (
        <ol className="install-steps">
          <li><Icon name="share" size={20} /><span>Toca <strong>Compartir</strong> en Safari</span></li>
          <li><Icon name="plus" size={20} /><span>Elige <strong>Agregar a inicio</strong></span></li>
        </ol>
      )}

      {kind === 'android-menu' && (
        <ol className="install-steps">
          <li><Icon name="menu" size={20} /><span>Abre el <strong>menú</strong> del navegador</span></li>
          <li><Icon name="plus" size={20} /><span>Elige <strong>Agregar a la pantalla principal</strong></span></li>
        </ol>
      )}

      <div className="install-sheet__actions">
        <button type="button" className="btn" onClick={onClose}>Ahora no</button>
        {kind === 'prompt' && (
          <button type="button" className="btn btn--primary btn--wide" onClick={onInstall}>
            <Icon name="download" /> Instalar app
          </button>
        )}
      </div>
    </aside>
  );
}
