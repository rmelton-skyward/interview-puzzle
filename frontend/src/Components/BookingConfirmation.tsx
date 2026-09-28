import { useEffect, useRef, type MouseEvent } from 'react';

type BookingConfirmationProps = {
    message: string;
    onClose: () => void;
};

export default function BookingConfirmation({ message, onClose }: BookingConfirmationProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) {
            return;
        }

        if (message && !dialog.open) {
            if (typeof dialog.showModal === 'function') {
                dialog.showModal();
            } else {
                dialog.setAttribute('open', '');
            }
        } else if (!message && dialog.open) {
            if (typeof dialog.close === 'function') {
                dialog.close();
            } else {
                dialog.removeAttribute('open');
            }
        }
    }, [message]);

    function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }

    return (
        <dialog
            ref={dialogRef}
            className="booking-dialog"
            hidden={!message}
            aria-labelledby="booking-confirmation-title"
            aria-describedby="booking-confirmation-message"
            aria-modal="true"
            onCancel={(event) => {
                event.preventDefault();
                onClose();
            }}
            onKeyDown={(event) => {
                if (typeof dialogRef.current?.showModal !== 'function' && event.key === 'Escape') {
                    event.preventDefault();
                    onClose();
                }
            }}
            onClick={handleDialogClick}
        >
            <div className="booking-modal">
                <header className="booking-modal-header">
                    <div>
                        <p className="section-eyebrow">Reservation complete</p>
                        <h2 className="manage-title" id="booking-confirmation-title">Booking confirmed</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="button button-close icon-button"
                        aria-label="Close booking confirmation"
                    >
                        <span aria-hidden="true">×</span>
                    </button>
                </header>
                <p className="booking-confirmation-message" id="booking-confirmation-message" role="status">
                    {message}
                </p>
            </div>
        </dialog>
    );
}