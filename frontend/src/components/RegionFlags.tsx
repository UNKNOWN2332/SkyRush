import type { ShopRegion } from '../lib/region';

/** Kompakt SVG bayroqlar (emoji emas — Windows / shriftdan mustaqil) */
export function RegionFlagIcon({ code, className }: { code: ShopRegion; className?: string }) {
  const cn = className ?? 'h-3.5 w-[1.35rem] shrink-0 overflow-hidden rounded-[2px] ring-1 ring-white/15';
  if (code === 'RU') {
    return (
      <svg className={cn} viewBox="0 0 21 14" aria-hidden>
        <rect width="21" height="4.67" fill="#fff" />
        <rect y="4.67" width="21" height="4.67" fill="#0039a6" />
        <rect y="9.34" width="21" height="4.66" fill="#d52b1e" />
      </svg>
    );
  }
  return (
    <svg className={cn} viewBox="0 0 21 14" aria-hidden>
      <rect width="21" height="4.67" fill="#0099b5" />
      <rect y="4.67" width="21" height="4.67" fill="#fff" />
      <rect y="9.34" width="21" height="4.66" fill="#1eb53a" />
      <circle cx="6.2" cy="7" r="2.1" fill="#fff" />
      <circle cx="6.45" cy="7" r="1.55" fill="#0099b5" />
      <rect x="6.9" y="6.35" width="3.2" height="1.3" fill="#fff" transform="rotate(25 8.5 7)" />
    </svg>
  );
}
