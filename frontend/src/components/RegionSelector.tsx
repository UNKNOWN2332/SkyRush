import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getStoredRegion, REGIONS, setStoredRegion, type ShopRegion } from '../lib/region';
import { RegionFlagIcon } from './RegionFlags';

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RegionSelector() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [region, setRegion] = useState<ShopRegion>(() => getStoredRegion());
  const wrapRef = useRef<HTMLDivElement>(null);

  const current = REGIONS.find((r) => r.code === region) ?? REGIONS[0];

  useEffect(() => {
    const sync = () => setRegion(getStoredRegion());
    window.addEventListener('skyrush-region', sync as EventListener);
    return () => window.removeEventListener('skyrush-region', sync as EventListener);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const select = (code: ShopRegion) => {
    if (code === region) {
      setOpen(false);
      return;
    }
    setRegion(code);
    setStoredRegion(code);
    window.dispatchEvent(new CustomEvent('skyrush-region', { detail: code }));
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-2.5 py-2 text-white transition hover:bg-white/10 sm:px-3"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('region.aria', { code: current.code })}
      >
        <RegionFlagIcon code={current.code} />
        <span className="text-base font-extrabold tracking-widest">{current.code}</span>
        <ChevronDown className="shrink-0 text-slate-400" />
      </button>
      {open ? (
        <ul
          className="absolute right-0 z-[500] mt-2 min-w-[148px] overflow-hidden rounded-xl border border-white/15 bg-[#12152a] py-1 shadow-2xl ring-1 ring-black/40"
          role="listbox"
        >
          {REGIONS.map((r) => (
            <li key={r.code} role="option" aria-selected={r.code === region}>
              <button
                type="button"
                className={`flex w-full items-center justify-center gap-2.5 px-4 py-3 text-base font-extrabold tracking-[0.15em] transition hover:bg-white/10 ${
                  r.code === region ? 'bg-white/10 text-emerald-300' : 'text-white'
                }`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  select(r.code);
                }}
              >
                <RegionFlagIcon code={r.code} />
                {r.code}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
