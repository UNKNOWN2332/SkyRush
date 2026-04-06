import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { catalogService, type CategoryDto, type ProductDto } from '../api/catalogService';
import { getStoredUser, isAuthenticated } from '../api/authService';
import { BrandLayout, glassCardClass, ghostButtonClass, primaryButtonClass } from '../components/BrandLayout';
import { canSelectProduct, CategoryPlayerPanel } from '../components/CategoryPlayerPanel';
import { useShopRegion } from '../lib/region';
import type { CategoryCheckoutState } from '../types/categoryCheckout';

const PAGE_SIZE = 10;
const CATEGORY_LOOKUP_SIZE = 200;

function DoubleChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 8l6 6 6-6M6 14l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const initialCheckout: CategoryCheckoutState = {
  playerId: '',
  zoneId: '',
  playerDisplayName: null,
  guestEmail: '',
  playerVerified: false,
};

export function CategoryPage() {
  const { t } = useTranslation();
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const region = useShopRegion();
  const id = Number(categoryId);
  const [category, setCategory] = useState<CategoryDto | null>(null);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [prodPage, setProdPage] = useState(0);
  const [prodHasMore, setProdHasMore] = useState(false);
  const [checkout, setCheckout] = useState<CategoryCheckoutState>(initialCheckout);

  const validId = useMemo(() => Number.isFinite(id) && id > 0, [id]);
  const guestMode = !isAuthenticated();

  const onSnapshotChange = useCallback((s: CategoryCheckoutState) => {
    setCheckout(s);
  }, []);

  useEffect(() => {
    const onRegionChange = () => {
      navigate('/', { replace: true });
    };
    window.addEventListener('skyrush-region', onRegionChange);
    return () => window.removeEventListener('skyrush-region', onRegionChange);
  }, [navigate]);

  useEffect(() => {
    setCheckout(initialCheckout);
  }, [id]);

  useEffect(() => {
    if (!validId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setProducts([]);
    setProdPage(0);
    setProdHasMore(false);
    (async () => {
      try {
        const cats = await catalogService.getActiveCategories(region, 0, CATEGORY_LOOKUP_SIZE);
        if (cancelled) return;
        const cat = cats.find((c) => c.id === id && c.status === 'ACTIVE') ?? null;
        setCategory(cat);

        const prods = await catalogService.getProductsByCategory(id, 0, PAGE_SIZE);
        if (cancelled) return;
        const active = prods.filter((p) => p.status === 'ACTIVE');
        setProducts(active);
        setProdHasMore(active.length === PAGE_SIZE);
        setProdPage(0);
      } catch {
        if (!cancelled) toast.error(t('category.toastFetchError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, validId, region, t]);

  const loadMoreProducts = async () => {
    if (loadingMore || !prodHasMore) return;
    setLoadingMore(true);
    try {
      const next = prodPage + 1;
      const batch = await catalogService.getProductsByCategory(id, next, PAGE_SIZE);
      const active = batch.filter((p) => p.status === 'ACTIVE');
      setProducts((prev) => [...prev, ...active]);
      setProdPage(next);
      setProdHasMore(active.length === PAGE_SIZE);
    } catch {
      toast.error(t('category.toastProductsError'));
    } finally {
      setLoadingMore(false);
    }
  };

  const onProductNavigate = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!canSelectProduct(checkout, guestMode)) {
      e.preventDefault();
      if (!checkout.playerVerified) {
        toast.info(t('category.toastNeedId'));
      } else if (guestMode) {
        toast.info(t('category.toastNeedEmail'));
      }
    }
  };

  if (!validId) {
    return (
      <BrandLayout title={t('category.errorTitle')}>
        <div className={glassCardClass}>
          <p className="text-slate-300">{t('category.invalidCategory')}</p>
          <Link to="/" className={'mt-4 inline-block ' + primaryButtonClass}>
            {t('category.homeLink')}
          </Link>
        </div>
      </BrandLayout>
    );
  }

  return (
    <BrandLayout
      title={category?.name ?? t('category.titleFallback')}
      subtitle={t('category.subtitle')}
    >
      <Link to="/" className={'mb-6 inline-block ' + ghostButtonClass}>
        {t('category.backAll')}
      </Link>

      {loading ? (
        <div className={glassCardClass + ' text-slate-300'}>{t('category.loading')}</div>
      ) : !category ? (
        <div className={glassCardClass + ' text-slate-300'}>{t('category.notInRegion')}</div>
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">{t('category.playerSection')}</h2>
            <CategoryPlayerPanel
              key={`${id}-${region}`}
              hasZoneId={category.hasZoneId}
              showGuestEmail={guestMode}
              profileEmail={getStoredUser()?.email}
              onSnapshotChange={onSnapshotChange}
            />
          </section>

          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">{t('category.packagesSection')}</h2>
            {products.length === 0 ? (
              <div className={glassCardClass + ' text-slate-300'}>{t('category.noProducts')}</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {products.map((p) => (
                    <Link
                      key={p.id}
                      to={`/category/${id}/checkout/${p.id}`}
                      state={checkout}
                      onClick={onProductNavigate}
                      className={`${glassCardClass} block p-4 transition hover:border-emerald-300/40 ${
                        !canSelectProduct(checkout, guestMode) ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex min-h-[100px] flex-col justify-between gap-2">
                        <div className="min-w-0">
                          <div className="line-clamp-2 text-sm font-semibold text-white">{p.name}</div>
                          <div className="mt-2 text-xs text-emerald-200/90 sm:text-sm">
                            {p.price} {t('category.currency')}
                          </div>
                        </div>
                        <span className="inline-flex w-fit rounded-md bg-gradient-to-r from-emerald-400/30 to-cyan-400/30 px-2 py-1 text-[10px] font-medium text-emerald-100 sm:text-xs">
                          {t('category.select')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
                {prodHasMore ? (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={loadMoreProducts}
                      disabled={loadingMore}
                      className={
                        ghostButtonClass +
                        ' flex items-center gap-2 border-violet-500/30 py-3 pl-5 pr-6 hover:border-violet-400/50 hover:bg-violet-500/10'
                      }
                    >
                      <DoubleChevronDown className="text-violet-300" />
                      {loadingMore ? t('category.loadingMore') : t('category.loadMore')}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>
      )}
    </BrandLayout>
  );
}
