export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-ink-soft">
      <svg
        className="h-8 w-8 animate-spin text-plum"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <p className="text-sm">{label}</p>
    </div>
  );
}
