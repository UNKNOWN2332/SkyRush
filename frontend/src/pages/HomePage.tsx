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
      subtitle={t('home.subtitle')}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10">
        {loading ? (
          <div className={glassCardClass + ' w-full text-center text-slate-300'}>{t('home.loading')}</div>
        ) : categories.length === 0 ? (
          <div className={glassCardClass + ' w-full text-center text-slate-300'}>{t('home.emptyRegion')}</div>
        ) : (
          <>
            <div className="flex w-full flex-wrap justify-center gap-4">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  to={`/category/${c.id}`}
                  className={`${glassCardClass} block w-full max-w-[340px] p-4 transition hover:border-emerald-300/40 hover:shadow-[0_20px_70px_-25px_rgba(16,185,129,0.35)] sm:p-5`}
                >
                  <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:text-left">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30 sm:h-16 sm:w-16">
                      {c.logoUrl ? (
                        <img src={c.logoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-bold text-emerald-200">
                          {c.name.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="line-clamp-2 text-sm font-semibold text-white sm:text-base">{c.name}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {c.hasZoneId ? t('home.zoneId') : t('home.playerId')}
                      </div>
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
                    ' flex items-center gap-2 border-violet-500/30 py-3 pl-5 pr-6 text-slate-200 hover:border-violet-400/50 hover:bg-violet-500/10'
                  }
                >
                  <DoubleChevronDown className="text-violet-300" />
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
