type HeaderProps = {
    hasVenues: boolean;
    onManageVenues: () => void;
};

export default function Header({ hasVenues, onManageVenues }: HeaderProps) {
    return (
        <header className="page-header">
            <div>
                <p className="page-eyebrow">Live event seating</p>
                <h1 className="page-title">Choose your seats</h1>
                <p className="page-description">
                    Find a centered view near the front, then reserve your place for the show.
                </p>
            </div>
            {hasVenues ? (
                <button
                    type="button"
                    onClick={onManageVenues}
                    className="button button-secondary"
                >
                    Manage Venue
                </button>
            ) : null}
        </header>
    );
}