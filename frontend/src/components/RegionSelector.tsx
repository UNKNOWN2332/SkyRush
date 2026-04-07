import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getStoredRegion, REGIONS, setStoredRegion, type ShopRegion } from '../lib/region';
import { headerControlButtonClass } from './brandStyles';
import { RegionFlagIcon } from './RegionFlags';

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
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

  const regionName = (code: ShopRegion) => t(`region.${code.toLowerCase() as 'uz' | 'ru'}`);

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
        className={headerControlButtonClass}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('region.ariaSelector', { code: current.code })}
        title={t('region.buttonHint')}
      >
        <RegionFlagIcon
          code={current.code}
          className="h-4 w-[1.55rem] shrink-0 overflow-hidden rounded-[2px] ring-1 ring-slate-300/80 dark:ring-white/15"
        />
        <span className="text-sm font-extrabold tracking-widest text-slate-800 dark:text-white">{current.code}</span>
        <ChevronDown className="shrink-0 text-slate-500 dark:text-slate-400" />
      </button>
      {open ? (
        <div
          className="absolute right-0 z-[500] mt-2 min-w-[min(100vw-2rem,17rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-200/60 dark:border-white/15 dark:bg-[#12152a] dark:shadow-2xl dark:ring-black/40"
        >
          <p className="border-b border-slate-200 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:border-white/10 dark:text-slate-400">
            {t('region.dropdownTitle')}
          </p>
          <ul role="listbox" aria-label={t('region.dropdownTitle')} className="py-1">
            {REGIONS.map((r) => (
              <li
                key={r.code}
                role="option"
                aria-selected={r.code === region}
                className="border-b border-slate-100 last:border-b-0 dark:border-white/10"
              >
                <button
                  type="button"
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-slate-100 dark:hover:bg-white/10 ${
                    r.code === region ? 'bg-emerald-50 dark:bg-white/10' : ''
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    select(r.code);
                  }}
                >
                  <RegionFlagIcon
                    code={r.code}
                    className="h-4 w-[1.55rem] shrink-0 overflow-hidden rounded-[2px] ring-1 ring-slate-300/80 dark:ring-white/15"
                  />
                  <div className="min-w-0 flex-1">
                    <div
                      className={`truncate text-sm font-semibold leading-tight ${
                        r.code === region ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {regionName(r.code)}
                    </div>
                    <div className="mt-0.5 text-[10px] font-extrabold tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      {r.code}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
