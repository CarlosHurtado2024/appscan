import { useRef, useState, type ReactNode } from 'react';
import { StorageFullError } from '../../storage/db';
import { navigate } from '../router';
import { importFiles } from '../useImport';
import { useToast } from './Toast';

type Props = {
  docId?: string;
  className?: string;
  children: ReactNode;
  onDone?: () => void;
};

export function ImportButton({ docId, className = 'btn', children, onDone }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function onFiles(list: FileList | null) {
    const files = [...(list ?? [])];
    if (input.current) input.current.value = '';
    if (files.length === 0) return;
    setBusy(true);
    try {
      const { doc, failed } = await importFiles(files, docId);
      if (failed.length > 0) toast.show(`No se pudo abrir: ${failed.join(', ')}. Prueba con una foto JPG o PNG.`);
      if (doc && !docId) navigate(`/doc/${doc.id}`);
      onDone?.();
    } catch (e) {
      toast.show(e instanceof StorageFullError
        ? 'El celular no tiene espacio. Borra algunos documentos e inténtalo de nuevo.'
        : 'No se pudo guardar la imagen. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className={className} disabled={busy} onClick={() => input.current?.click()}>
        {children}
      </button>
      <input
        ref={input}
        data-testid="import-input"
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => onFiles(e.target.files)}
      />
    </>
  );
}
