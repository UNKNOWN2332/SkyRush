import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type PromoSlide = {
  imageUrl: string;
  linkUrl: string;
};

const FALLBACK_SLIDES: PromoSlide[] = [
  { imageUrl: 'https://picsum.photos/seed/skyfallback1/1400/480', linkUrl: 'https://vk.com' },
  { imageUrl: 'https://picsum.photos/seed/skyfallback2/1400/480', linkUrl: 'https://t.me' },
  { imageUrl: 'https://picsum.photos/seed/skyfallback3/1400/480', linkUrl: 'https://example.com' },
];

function isSafeExternalUrl(url: string): boolean {
  try {
    const u = new URL(url, window.location.origin);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

type PromoCarouselProps = {
  slides: PromoSlide[];
};

export function PromoCarousel({ slides }: PromoCarouselProps) {
  const { t } = useTranslation();
  const list = useMemo(() => (slides.length > 0 ? slides : FALLBACK_SLIDES), [slides]);
  const [index, setIndex] = useState(0);

  const n = list.length;
  const prev = useCallback(() => setIndex((i) => (i - 1 + n) % n), [n]);
  const next = useCallback(() => setIndex((i) => (i + 1) % n), [n]);

  useEffect(() => {
    setIndex((i) => (n > 0 ? Math.min(i, n - 1) : 0));
  }, [n]);

  useEffect(() => {
    if (n <= 1) return;
    const t = window.setInterval(next, 6500);
    return () => window.clearInterval(t);
  }, [n, next]);

  const current = list[index]!;
  const prevSlide = list[(index - 1 + n) % n]!;
  const nextSlide = list[(index + 1) % n]!;
  const linkOk = isSafeExternalUrl(current.linkUrl);

  const mainVisual = (
    <img
      src={current.imageUrl}
      alt={t('promo.bannerAlt')}
      className="h-full max-h-[280px] w-full object-cover md:max-h-[320px]"
    />
  );

  return (
    <section className="w-full" aria-label={t('promo.sectionAria')}>
      <div className="relative mx-auto w-full max-w-5xl">
        {/* Desktop: MobaPay-style side peek */}
        <div className="hidden items-stretch gap-3 md:grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,2.6fr)_minmax(0,0.9fr)] md:px-1">
          <button
            type="button"
            onClick={prev}
            className="group relative min-h-[168px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100/90 opacity-90 ring-1 ring-slate-200/80 transition hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 dark:border-white/10 dark:bg-black/40 dark:opacity-80 dark:ring-white/5"
            aria-label={t('promo.prevBanner')}
          >
            <img src={prevSlide.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-r from-slate-900/40 to-transparent dark:from-black/50" />
            <span className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-lg text-slate-800 shadow backdrop-blur-sm dark:border-transparent dark:bg-black/55 dark:text-white">
              ‹
            </span>
          </button>

          {linkOk ? (
            <a
              href={current.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block min-h-[200px] overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-lg shadow-slate-300/40 ring-1 ring-slate-200/80 transition hover:border-emerald-400/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 dark:border-white/15 dark:bg-black/30 dark:shadow-[0_24px_80px_-30px_rgba(16,185,129,0.35)] dark:ring-white/10 dark:hover:border-emerald-400/30"
            >
              {mainVisual}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900/50 to-transparent dark:from-black/70" />
            </a>
          ) : (
            <div className="relative block min-h-[200px] overflow-hidden rounded-2xl border border-slate-200 bg-white/80 ring-1 ring-slate-200/80 dark:border-white/15 dark:bg-black/30 dark:ring-white/10">
              {mainVisual}
            </div>
          )}

          <button
            type="button"
            onClick={next}
            className="group relative min-h-[168px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100/90 opacity-90 ring-1 ring-slate-200/80 transition hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 dark:border-white/10 dark:bg-black/40 dark:opacity-80 dark:ring-white/5"
            aria-label={t('promo.nextBanner')}
          >
            <img src={nextSlide.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <span className="absolute inset-0 bg-gradient-to-l from-slate-900/40 to-transparent dark:from-black/50" />
            <span className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-lg text-slate-800 shadow backdrop-blur-sm dark:border-transparent dark:bg-black/55 dark:text-white">
              ›
            </span>
          </button>
        </div>

        {/* Mobile: full bleed + overlay arrows */}
        <div className="relative md:hidden">
          {linkOk ? (
            <a
              href={current.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative block aspect-[2.15/1] max-h-[220px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white/80 dark:border-white/15 dark:bg-black/30"
            >
              <img src={current.imageUrl} alt={t('promo.bannerAlt')} className="h-full w-full object-cover" />
            </a>
          ) : (
            <div className="relative block aspect-[2.15/1] max-h-[220px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white/80 dark:border-white/15 dark:bg-black/30">
              <img src={current.imageUrl} alt={t('promo.bannerAlt')} className="h-full w-full object-cover" />
            </div>
          )}
          {n > 1 ? (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-xl text-slate-800 shadow backdrop-blur-md dark:border-white/20 dark:bg-black/50 dark:text-white"
                aria-label={t('promo.prev')}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-xl text-slate-800 shadow backdrop-blur-md dark:border-white/20 dark:bg-black/50 dark:text-white"
                aria-label={t('promo.next')}
              >
                ›
              </button>
            </>
          ) : null}
        </div>

        {/* Line indicators (MobaPay-style) */}
        {n > 1 ? (
          <div className="mt-4 flex justify-center gap-2 px-2">
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={
                  i === index
                    ? 'h-1 w-10 rounded-full bg-slate-800 shadow-md transition dark:bg-white dark:shadow-[0_0_12px_rgba(255,255,255,0.45)]'
                    : 'h-1 w-8 rounded-full bg-slate-300 transition hover:bg-slate-400 dark:bg-white/25 dark:hover:bg-white/40'
                }
                aria-label={t('promo.slide', { n: i + 1 })}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
