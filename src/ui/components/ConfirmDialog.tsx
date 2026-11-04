import { useEffect, useRef } from 'react';

type Props = {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Destructive actions cannot be undone, so they earn a protected moment of focus. */
export function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog ref={ref} className="dialog" onCancel={onCancel} aria-labelledby="dialog-title">
      <h2 id="dialog-title">{title}</h2>
      <p>{body}</p>
      <div className="dialog__actions">
        <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
        <button type="button" className="btn btn--danger" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </dialog>
  );
}
