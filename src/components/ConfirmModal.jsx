import { useEffect, useRef } from 'react';

export default function ConfirmModal({
                                         title, body, confirmLabel = 'Confirm', cancelLabel = 'Never mind', busy, onConfirm, onCancel,
                                     }) {
    const confirmRef = useRef(null);

    useEffect(() => {
        confirmRef.current?.focus();
        function onKeyDown(e) {
            if (e.key === 'Escape') onCancel();
        }
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [onCancel]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-5 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            onClick={onCancel}
        >
            <div
                className="w-full max-w-sm rounded-card border border-sand-dark bg-paper p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id="confirm-modal-title" className="font-display text-xl font-semibold text-ink">{title}</h2>
                {body && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>}
                <div className="mt-6 flex justify-end gap-2">
                    <button
                        onClick={onCancel}
                        className="rounded-full border border-sand-dark px-4 py-2 text-sm font-medium text-ink-soft transition hover:text-ink"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        ref={confirmRef}
                        onClick={onConfirm}
                        disabled={busy}
                        className="rounded-full bg-rust px-4 py-2 text-sm font-semibold text-paper transition hover:bg-rust/90 disabled:opacity-60"
                    >
                        {busy ? 'Working…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}