import { useEffect, useRef, type FormEvent, type MouseEvent } from 'react';

type AskAIProps = {
    isOpen: boolean;
    prompt: string;
    isLoading: boolean;
    isDisabled: boolean;
    error: string;
    onPromptChange: (prompt: string) => void;
    onAsk: () => void;
    onClose: () => void;
};

export default function AskAI({ isOpen, prompt, isLoading, isDisabled, error, onPromptChange, onAsk, onClose }: AskAIProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const promptRef = useRef<HTMLInputElement>(null);
    const openerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) {
            return;
        }

        if (isOpen && !dialog.open) {
            openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            if (typeof dialog.showModal === 'function') {
                dialog.showModal();
            } else {
                dialog.setAttribute('open', '');
            }
            promptRef.current?.focus();
        } else if (!isOpen && dialog.open) {
            if (typeof dialog.close === 'function') {
                dialog.close();
            } else {
                dialog.removeAttribute('open');
                openerRef.current?.focus();
            }
            openerRef.current = null;
        }
    }, [isOpen]);

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onAsk();
    }

    function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
        if (event.target === event.currentTarget && !isLoading) {
            onClose();
        }
    }

    return (
        <dialog
            ref={dialogRef}
            className="assistant-dialog"
            hidden={!isOpen}
            aria-label="Ask AI"
            aria-describedby="ask-ai-description"
            aria-modal="true"
            onCancel={(event) => {
                event.preventDefault();
                if (!isLoading) onClose();
            }}
            onKeyDown={(event) => {
                if (typeof dialogRef.current?.showModal !== 'function' && event.key === 'Escape' && !isLoading) {
                    event.preventDefault();
                    onClose();
                }
            }}
            onClick={handleDialogClick}
        >
            <div className="assistant-modal">
                <header className="assistant-modal-header">
                    <div>
                        <p className="section-eyebrow">Seat assistant</p>
                        {/* <h2 className="manage-title" id="ask-ai-title">Ask AI</h2> */}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="button button-close"
                        aria-label="Close Ask AI dialog"
                    >
                        <span aria-hidden="true">×</span>
                    </button>
                </header>
                <p className="manage-description" id="ask-ai-description">
                    Describe how many seats you need. The seat-selection algorithm chooses the seats.
                </p>
                <form className="assistant-modal-form" onSubmit={handleSubmit}>
                    <label htmlFor="assistant-prompt" className="form-field">
                        <span className="field-label">Your request</span>
                        <input
                            ref={promptRef}
                            id="assistant-prompt"
                            value={prompt}
                            onChange={(event) => onPromptChange(event.target.value)}
                            placeholder="Example: I need seats for a group of 4"
                            minLength={3}
                            maxLength={500}
                            required
                            className="form-control form-control-select"
                        />
                    </label>
                    {error ? <p className="status-error" role="alert">{error}</p> : null}
                    <div className="assistant-modal-actions">
                        <button type="button" onClick={onClose} disabled={isLoading} className="button button-secondary">
                            Cancel
                        </button>
                        <button type="submit" disabled={isDisabled || isLoading} className="button button-assistant">
                            {isLoading ? 'Thinking…' : 'Find Seats'}
                        </button>
                    </div>
                </form>
            </div>
        </dialog>
    );
}