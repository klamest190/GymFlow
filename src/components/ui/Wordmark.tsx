/** App wordmark: the plate from the app icon plus the name in narrow, heavy type. */
export function Wordmark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const large = size === 'lg'
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className={large ? 'size-10' : 'size-8'} aria-hidden>
        <circle cx="16" cy="16" r="15" fill="var(--accent)" />
        <circle cx="16" cy="16" r="12.4" fill="none" stroke="var(--accent-ink)" strokeOpacity={0.28} strokeWidth={0.8} />
        <circle cx="16" cy="16" r="4.8" fill="var(--accent-ink)" />
        <circle cx="16" cy="16" r="2" fill="var(--bg)" />
      </svg>
      <span className={`headline ${large ? 'text-[39px]' : 'text-[28px]'}`}>GymFlow</span>
    </span>
  )
}
