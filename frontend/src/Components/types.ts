export type SeatStatus = 'AVAILABLE' | 'RESERVED' | 'BOOKED';

export type VenueSummary = {
    id: string;
    name: string;
    rows: number;
    columns: number;
};

export type Seat = {
    id: string;
    row: string;
    column: number;
    status: SeatStatus;
};

export type VenueDetail = {
    id: string;
    name: string;
    layout: { rows: number; columns: number };
    seats: Seat[];
};

export type CreateVenueInput = {
    name: string;
    rows: number;
    columns: number;
};