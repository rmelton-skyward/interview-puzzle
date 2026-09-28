import type { Seat, VenueDetail } from './types';

type VenueFloorSeatingProps = {
    venue: VenueDetail | null;
    isLoading: boolean;
    hasVenues: boolean;
    recommendedSeats: Seat[];
};

function rowLabelFromIndex(index: number): string {
    let n = index + 1;
    let value = '';
    while (n > 0) {
        const remainder = (n - 1) % 26;
        value = String.fromCharCode(97 + remainder) + value;
        n = Math.floor((n - 1) / 26);
    }
    return value;
}

export default function VenueFloorSeating({ venue, isLoading, hasVenues, recommendedSeats }: VenueFloorSeatingProps) {
    if (isLoading) {
        return <p className="seat-map-message">Loading venue layout…</p>;
    }

    if (!venue) {
        return hasVenues ? <p className="seat-map-message">Select a venue to view the seat map.</p> : null;
    }

    const { rows, columns } = venue.layout;
    const seatsByDisplayId = new Map(venue.seats.map((seat) => [`${seat.row}${seat.column}`.toLowerCase(), seat]));
    const recommendedIds = new Set(recommendedSeats.map((seat) => seat.id));
    const recommendedDisplayIds = new Set(recommendedSeats.map((seat) => `${seat.row}${seat.column}`.toLowerCase()));

    return (
        <div className="seat-map">
            <div className="seat-map-header">
                <div>
                    <p className="section-eyebrow">Venue floor</p>
                    <h2 className="seat-map-title">{venue.name}</h2>
                </div>
                <span className="seat-map-size">
                    {rows} × {columns}
                </span>
            </div>

            <div className="seat-map-content">
                <div className="movie-screen">
                    <div className="stage-label">Stage</div>
                </div>

                <div className="seat-rows">
                    {Array.from({ length: rows }, (_, rowIndex) => {
                        const rowName = rowLabelFromIndex(rowIndex);
                        return (
                            <div key={rowName} className="seat-row">
                                <div className="seat-row-label">
                                    {rowName.toUpperCase()}
                                </div>
                                <div className="seat-row-items">
                                    {Array.from({ length: columns }, (_, columnIndex) => {
                                        const column = columnIndex + 1;
                                        const displaySeatId = `${rowName}${column}`;
                                        const seat = seatsByDisplayId.get(displaySeatId) ?? {
                                            id: displaySeatId,
                                            row: rowName,
                                            column,
                                            status: 'AVAILABLE' as const,
                                        };
                                        const isRecommended = recommendedIds.has(seat.id) || recommendedDisplayIds.has(displaySeatId);
                                        const aisleGap = columns >= 10 && column === Math.ceil(columns / 2) ? 'mr-5' : '';
                                        return (
                                            <div
                                                key={seat.id}
                                                role="img"
                                                aria-label={`Seat ${seat.id} ${seat.status.toLowerCase()}`}
                                                className={`seat-tile ${isRecommended ? 'seat-recommended' : `seat-${seat.status.toLowerCase()}`} ${aisleGap ? 'seat-aisle-gap' : ''}`}
                                            >
                                                {column}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="seat-legend">
                <span className="legend-item"><i className="legend-dot legend-dot-available" /> Available</span>
                <span className="legend-item"><i className="legend-dot legend-dot-recommended" /> Recommended</span>
                <span className="legend-item"><i className="legend-dot legend-dot-reserved" /> Reserved</span>
                <span className="legend-item"><i className="legend-dot legend-dot-booked" /> Booked</span>
            </div>
        </div>
    );
}