import { useEffect, useRef } from 'react';

const confirmClass =
  'rounded bg-brand px-4 py-1 text-lg text-panel hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40';
const cancelClass =
  'rounded border border-line bg-brand-soft px-4 py-1 text-lg text-ink hover:bg-line disabled:cursor-not-allowed disabled:opacity-40';

// Popup that asks "are you sure?" over the page.
// Uses the built in <dialog>, so Escape and the dark backdrop come for free.
export default function ConfirmModal({
  open,
  title,
  children,
  confirmLabel = 'Yes',
  cancelLabel = 'Cancel',
  busy = false,
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);

  // Open or close the real dialog when the prop changes.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-modal-title"
      // Escape fires "cancel". Block it while busy, otherwise treat it like Cancel.
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      // Clicking the dark area outside the box also cancels.
      onClick={(event) => {
        if (event.target === dialogRef.current && !busy) onCancel();
      }}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] bg-transparent p-0 backdrop:bg-black/60"
    >
      <div className="parchment px-6 py-5 text-center text-ink">
        <h2 id="confirm-modal-title" className="title-shadow mb-2 font-display text-2xl font-bold">
          {title}
        </h2>
        <div className="mb-4 text-lg">{children}</div>
        <div className="flex justify-center gap-3">
          <button type="button" className={cancelClass} onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" className={confirmClass} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
