type FindBestSeatsProps = {
    disabled: boolean;
    onFind: () => void;
};

export default function FindBestSeats({ disabled, onFind }: FindBestSeatsProps) {
    return (
        <button
            type="button"
            onClick={onFind}
            disabled={disabled}
            className="button button-primary"
        >
            Find Best Seats
        </button>
    );
}