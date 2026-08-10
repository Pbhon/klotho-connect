/** The brand's one recurring visual signature: a single thread, spun from
 *  a gold end to a plum end, looping into an open ring. Standing in for
 *  Klotho -- who spins the thread of life -- and for two generations
 *  joined at both ends of one line. Reused (small) in the navbar and
 *  (large, animated) in the homepage hero. */
export default function ThreadMark({ className = 'h-8 w-8', animate = false }) {
  const id = 'thread-gradient';
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="4" y1="8" x2="36" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#D98E32" />
          <stop offset="1" stopColor="#5B3654" />
        </linearGradient>
      </defs>
      <path
        d="M8 12 C 4 20, 8 30, 18 31 C 30 32, 34 22, 28 14 C 23 7, 12 8, 11 16 C 10 23, 18 27, 24 22"
        stroke={`url(#${id})`}
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
        className={animate ? 'thread-draw' : undefined}
      />
      <circle cx="8" cy="12" r="2.1" fill="#D98E32" />
      <circle cx="24" cy="22" r="2.1" fill="#5B3654" />
    </svg>
  );
}
