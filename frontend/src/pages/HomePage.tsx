import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { bannerService } from '../api/bannerService';
import { catalogService, type CategoryDto } from '../api/catalogService';
import { BrandLayout, ghostButtonClass, glassCardClass } from '../components/BrandLayout';
import { PromoCarousel, type PromoSlide } from '../components/PromoCarousel';
import { useShopRegion } from '../lib/region';

const PAGE_SIZE = 10;

function DoubleChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 8l6 6 6-6M6 14l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const region = useShopRegion();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [promoSlides, setPromoSlides] = useState<PromoSlide[]>([]);

  const loadInitial = useCallback(async () => {
    const list = await catalogService.getActiveCategories(region, 0, PAGE_SIZE);
    const active = list.filter((c) => c.status === 'ACTIVE');
    setCategories(active);
    setPage(0);
    setHasMore(active.length === PAGE_SIZE);
  }, [region]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setCategories([]);
    setHasMore(false);
    (async () => {
      try {
        await loadInitial();
      } catch {
        if (!cancelled) toast.error(t('home.toastCategoriesError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadInitial, t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await bannerService.getActiveBanners(region);
        const slides: PromoSlide[] = rows.map((b) => ({
          imageUrl: b.imageUrl,
          linkUrl: b.linkUrl,
        }));
        if (!cancelled) setPromoSlides(slides);
      } catch {
        if (!cancelled) setPromoSlides([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [region]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const list = await catalogService.getActiveCategories(region, next, PAGE_SIZE);
      const active = list.filter((c) => c.status === 'ACTIVE');
      setCategories((prev) => [...prev, ...active]);
      setPage(next);
      setHasMore(active.length === PAGE_SIZE);
    } catch {
      toast.error(t('home.toastLoadError'));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <BrandLayout
      topSlot={
        <div className="mx-auto w-full max-w-5xl">
          <PromoCarousel slides={promoSlides} />
        </div>
      }
      title={t('home.title')}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10">
        {loading ? (
          <div className={glassCardClass + ' w-full text-center text-slate-600 dark:text-slate-300'}>
            {t('home.loading')}
          </div>
        ) : categories.length === 0 ? (
          <div className={glassCardClass + ' w-full text-center text-slate-600 dark:text-slate-300'}>
            {t('home.emptyRegion')}
          </div>
        ) : (
          <>
            <div className="grid w-full grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 sm:gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to={`/category/${c.id}`}
                  className="group block w-full outline-none ring-offset-2 ring-offset-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-400/50 dark:ring-offset-[#060915]"
                >
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-white via-slate-100 to-slate-200/90 shadow-lg shadow-slate-300/50 transition duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-xl dark:from-slate-800/30 dark:via-[#0a0f1a] dark:to-black/80 dark:shadow-[0_24px_48px_-20px_rgba(0,0,0,0.85)] dark:group-hover:shadow-[0_36px_70px_-28px_rgba(0,0,0,0.95)]">
                    {c.logoUrl ? (
                      <img
                        src={c.logoUrl}
                        alt=""
                        className="h-full w-full object-contain p-4 transition duration-500 ease-out group-hover:scale-[1.05] sm:p-5 md:p-6"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-6 text-5xl font-black text-emerald-600/90 sm:text-6xl dark:text-emerald-300/80">
                        {c.name.slice(0, 1)}
                      </div>
                    )}
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-900/25 to-transparent opacity-80 dark:from-black/50 dark:opacity-70"
                      aria-hidden
                    />
                  </div>
                  <div className="mt-3 space-y-0.5 px-1 text-center sm:mt-3.5">
                    <div className="line-clamp-2 text-sm font-bold leading-snug text-slate-900 sm:text-[0.95rem] dark:text-white">
                      {c.name}
                    </div>
                    <div className="text-[11px] text-slate-500 sm:text-xs dark:text-slate-500">
                      {c.hasZoneId ? t('home.zoneId') : t('home.playerId')}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {hasMore ? (
              <div className="flex w-full justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className={
                    ghostButtonClass +
                    ' flex items-center gap-2 border-violet-300 py-3 pl-5 pr-6 hover:border-violet-400 hover:bg-violet-50 dark:border-violet-500/30 dark:text-slate-200 dark:hover:border-violet-400/50 dark:hover:bg-violet-500/10'
                  }
                >
                  <DoubleChevronDown className="text-violet-600 dark:text-violet-300" />
                  {loadingMore ? t('home.loadingMore') : t('home.loadMore')}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </BrandLayout>
  );
}
