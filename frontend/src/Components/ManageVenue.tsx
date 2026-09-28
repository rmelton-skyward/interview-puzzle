import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import type { CreateVenueInput, VenueSummary } from './types';

type ManageVenueProps = {
    isOpen: boolean;
    isLoading: boolean;
    error: string;
    status: string;
    statusType: 'create' | 'delete' | '';
    venues: VenueSummary[];
    onClose: () => void;
    onCreate: (input: CreateVenueInput) => Promise<boolean>;
    onDelete: (venueId: string) => Promise<boolean>;
};

export default function ManageVenue({
    isOpen,
    isLoading,
    error,
    status,
    statusType,
    venues,
    onClose,
    onCreate,
    onDelete,
}: ManageVenueProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const venueNameRef = useRef<HTMLInputElement>(null);
    const openerRef = useRef<HTMLElement | null>(null);
    const [name, setName] = useState('');
    const [rows, setRows] = useState('10');
    const [columns, setColumns] = useState('12');
    const [deleteVenueId, setDeleteVenueId] = useState('');
    const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
    const hasDuplicateName = name.trim().length > 0 && venues.some(
        (venue) => venue.name.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase(),
    );

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
            venueNameRef.current?.focus();
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

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const wasCreated = await onCreate({ name, rows: Number(rows), columns: Number(columns) });
        if (wasCreated) {
            setName('');
            setRows('10');
            setColumns('12');
        }
    }

    function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
        if (event.target === event.currentTarget && !isLoading) {
            onClose();
        }
    }

    return (
        <dialog
            ref={dialogRef}
            className="manage-dialog"
            hidden={!isOpen}
            aria-label="Manage Venue"
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
            <div className="manage-panel">
                <header className="manage-header">
                    <div>
                    <p className="section-eyebrow">Manage Venue</p>
                        {/* <h2 className="manage-title" id="manage-venue-title">Manage Venue</h2> */}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="button button-close"
                        aria-label="Close Manage Venue dialog"
                    >
                        <span aria-hidden="true">×</span>
                    </button>
                </header>

                {/* <p className="manage-description" id="manage-venue-description">
                    Add a venue layout or delete the selected venue and its bookings.
                </p> */}

                <div className="manage-grid">
                    <form onSubmit={handleSubmit} className="manage-subpanel">
                        <h3 className="subpanel-title">Add Venue</h3>
                        <div className="form-grid">
                            <label className="form-field form-field-wide" htmlFor="venue-name">
                                <span>Venue name</span>
                            <input
                                ref={venueNameRef}
                                id="venue-name"
                                value={name}
                                onChange={(event) => setName(event.target.value.slice(0, 30))}
                                maxLength={30}
                                required
                                className="form-control"
                            />
                            </label>
                            <label className="form-field" htmlFor="venue-rows">
                                <span>Rows</span>
                                <input
                                    id="venue-rows"
                                    type="number"
                                    min={1}
                                    max={50}
                                    step={1}
                                    value={rows}
                                    onChange={(event) => setRows(event.target.value)}
                                    required
                                    className="form-control"
                                />
                            </label>
                            <label className="form-field" htmlFor="venue-columns">
                                <span>Columns</span>
                                <input
                                    id="venue-columns"
                                    type="number"
                                    min={1}
                                    max={1000}
                                    step={1}
                                    value={columns}
                                    onChange={(event) => setColumns(event.target.value)}
                                    required
                                    className="form-control"
                                />
                            </label>
                            <button
                                type="submit"
                                disabled={isLoading || hasDuplicateName}
                                className="button button-primary manage-submit"
                            >
                                {isLoading ? 'Working…' : 'Add Venue'}
                            </button>
                        </div>
                        {hasDuplicateName ? <p className="status-error" role="alert">A venue with this name already exists.</p> : null}
                        {status && statusType === 'create' ? <p className="status-message" role="status">{status}</p> : null}
                    </form>

                    {venues.length > 0 ? (
                        <section className="manage-subpanel manage-subpanel-danger" aria-labelledby="delete-venue-title">
                            <h3 className="subpanel-title" id="delete-venue-title">Delete Venue</h3>
                            <p className="manage-description">
                                Deleting a venue permanently removes its seats, bookings, and booking-seat records.
                            </p>
                            <div className="delete-venue-controls">
                                <label className="form-field delete-venue-select-field" htmlFor="delete-venue-id">
                                    <span>Venue to delete</span>
                                    <select
                                        id="delete-venue-id"
                                        value={deleteVenueId}
                                        onChange={(event) => setDeleteVenueId(event.target.value)}
                                        disabled={isLoading || isDeleteConfirmationOpen}
                                        className="form-control form-control-select"
                                    >
                                        <option value="" disabled>Select a venue</option>
                                        {venues.map((venue) => (
                                            <option key={venue.id} value={venue.id}>{venue.name}</option>
                                        ))}
                                    </select>
                                </label>
                                <div className="delete-venue-actions">
                                    {isDeleteConfirmationOpen ? (
                                        <div className="delete-confirmation" role="group" aria-label="Confirm venue deletion">
                                            {/* <span>Confirm?</span> */}
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const wasDeleted = await onDelete(deleteVenueId);
                                                    if (wasDeleted) {
                                                        setDeleteVenueId('');
                                                        setIsDeleteConfirmationOpen(false);
                                                    }
                                                }}
                                                disabled={!deleteVenueId || isLoading}
                                                className="button button-danger button-small"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsDeleteConfirmationOpen(false)}
                                                disabled={isLoading}
                                                className="button button-secondary button-small"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsDeleteConfirmationOpen(true)}
                                            disabled={!deleteVenueId || isLoading}
                                            className="button button-danger"
                                        >
                                            Delete Venue
                                        </button>
                                    )}
                                </div>
                            </div>
                            {status && statusType === 'delete' ? <p className="status-message" role="status">{status}</p> : null}
                        </section>
                    ) : null}
                </div>

                {error ? <p className="status-error" role="alert">{error}</p> : null}
            </div>
        </dialog>
    );
}