import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { signUpForEvent, cancelSignup } from '../lib/firestore';
import ConfirmModal from './ConfirmModal';

export default function SignupButton({
                                         event, initialSignedUp = false, disabled, stopPropagation, onChange, className = '',
                                     }) {
    const { profile } = useAuth();
    const [signedUp, setSignedUp] = useState(initialSignedUp);
    const [busy, setBusy] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => setSignedUp(initialSignedUp), [initialSignedUp]);

    function handleClick(e) {
        if (stopPropagation) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (disabled || busy) return;
        if (signedUp) {
            setConfirming(true);
        } else {
            doSignUp();
        }
    }

    async function doSignUp() {
        setError('');
        setBusy(true);
        try {
            await signUpForEvent({ event, uid: profile.uid, name: profile.name, email: profile.email });
            setSignedUp(true);
            onChange?.(true);
        } catch {
            setError('Couldn\u2019t sign you up \u2014 try again.');
        } finally {
            setBusy(false);
        }
    }

    async function handleConfirmCancel(e) {
        if (stopPropagation) {
            e?.preventDefault?.();
            e?.stopPropagation?.();
        }
        setError('');
        setBusy(true);
        try {
            await cancelSignup(event.id, profile.uid);
            setSignedUp(false);
            onChange?.(false);
        } catch {
            setError('Couldn\u2019t cancel \u2014 try again.');
        } finally {
            setBusy(false);
            setConfirming(false);
        }
    }

    function handleCancelModal(e) {
        if (stopPropagation) {
            e?.preventDefault?.();
            e?.stopPropagation?.();
        }
        setConfirming(false);
    }

    return (
        <div className={className}>
            <button
                type="button"
                onClick={handleClick}
                disabled={disabled || busy}
                className={`w-full rounded-full py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                    signedUp
                        ? 'border border-sage bg-sage-light text-sage'
                        : 'bg-plum text-paper hover:bg-plum-dark'
                }`}
            >
                {busy ? 'Saving\u2026' : signedUp ? '\u2713 Signed Up' : 'Sign Up'}
            </button>
            {error && <p className="mt-1.5 text-xs text-rust">{error}</p>}

            {confirming && (
                <ConfirmModal
                    title="Cancel your spot?"
                    body="You'll be taken off the roster for this event and the open-spots count will go back up."
                    confirmLabel="Cancel my spot"
                    cancelLabel="Keep my spot"
                    busy={busy}
                    onConfirm={handleConfirmCancel}
                    onCancel={handleCancelModal}
                />
            )}
        </div>
    );
}