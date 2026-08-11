export default function StarButton({ starred, onToggle, className = '' }) {
    function handleClick(e) {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-pressed={starred}
            aria-label={starred ? 'Unstar this chapter' : 'Star this chapter'}
            title={starred ? 'Unstar this chapter' : 'Star this chapter'}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-sand/70 ${className}`}
        >
            <svg
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill={starred ? '#D98E32' : 'none'}
                stroke={starred ? '#D98E32' : '#5C4F49'}
                strokeWidth="1.5"
                strokeLinejoin="round"
            >
                <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z" />
            </svg>
        </button>
    );
}