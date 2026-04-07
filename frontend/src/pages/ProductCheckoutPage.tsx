import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { catalogService, type CategoryDto, type ProductDto } from '../api/catalogService';
import { getStoredUser, isAuthenticated } from '../api/authService';
import { BrandLayout, glassCardClass, ghostButtonClass, primaryButtonClass } from '../components/BrandLayout';
import { canSelectProduct } from '../components/CategoryPlayerPanel';
import { useShopRegion } from '../lib/region';
import type { CategoryCheckoutState } from '../types/categoryCheckout';

const LOOKUP_SIZE = 200;

export function ProductCheckoutPage() {
  const { t } = useTranslation();
  const { categoryId, productId } = useParams<{ categoryId: string; productId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const region = useShopRegion();
  const catId = Number(categoryId);
  const prodId = Number(productId);

  const [category, setCategory] = useState<CategoryDto | null>(null);
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(true);

  const checkout = (location.state as CategoryCheckoutState | null) ?? null;
  const guestMode = !isAuthenticated();
  const profileEmail = getStoredUser()?.email ?? '';
  const receiptEmail = guestMode ? (checkout?.guestEmail?.trim() ?? '') : profileEmail;

  const validParams = useMemo(
    () => Number.isFinite(catId) && catId > 0 && Number.isFinite(prodId) && prodId > 0,
    [catId, prodId]
  );

  const checkoutOk = checkout && canSelectProduct(checkout, guestMode);

  useEffect(() => {
    const onRegionChange = () => {
      navigate('/', { replace: true });
    };
    window.addEventListener('skyrush-region', onRegionChange);
    return () => window.removeEventListener('skyrush-region', onRegionChange);
  }, [navigate]);

  useEffect(() => {
    if (!validParams) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [cats, prods] = await Promise.all([
          catalogService.getActiveCategories(region, 0, LOOKUP_SIZE),
          catalogService.getProductsByCategory(catId, 0, LOOKUP_SIZE),
        ]);
        if (cancelled) return;
        setCategory(cats.find((c) => c.id === catId) ?? null);
        setProduct(prods.find((p) => p.id === prodId) ?? null);
      } catch {
        if (!cancelled) toast.error(t('checkout.toastFetchError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [catId, prodId, validParams, region, t]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    toast.success(t('checkout.toastSuccess', { email: receiptEmail }));
    if (product && category) {
      const pending = {
        categoryId: catId,
        productId: prodId,
        productName: product.name,
        categoryName: category.name,
      };
      sessionStorage.setItem('skyrush_pending_review', JSON.stringify(pending));
      navigate('/reviews', { state: { pendingReview: pending } });
    }
  };

  if (!validParams) {
    return (
      <BrandLayout title={t('checkout.errorTitle')}>
        <div className={glassCardClass}>
          <p className="text-slate-600 dark:text-slate-300">{t('checkout.invalidUrl')}</p>
          <Link to="/" className={'mt-4 inline-block ' + primaryButtonClass}>
            {t('checkout.homeLink')}
          </Link>
        </div>
      </BrandLayout>
    );
  }

  if (!loading && (!product || !category)) {
    return (
      <BrandLayout title={t('checkout.notFoundTitle')}>
        <div className={glassCardClass}>
          <p className="text-slate-600 dark:text-slate-300">{t('checkout.notFoundBody')}</p>
          <Link to={`/category/${catId}`} className={'mt-4 inline-block ' + primaryButtonClass}>
            {t('checkout.back')}
          </Link>
        </div>
      </BrandLayout>
    );
  }

  if (!checkoutOk) {
    return (
      <BrandLayout title={t('checkout.needIdTitle')} subtitle={category?.name}>
        <Link to={`/category/${catId}`} className={'mb-6 inline-block ' + ghostButtonClass}>
          {t('checkout.backCategory')}
        </Link>
        <div className={glassCardClass}>
          <p className="text-slate-600 dark:text-slate-300">
            {guestMode ? t('checkout.needIdBodyGuest') : t('checkout.needIdBodyUser')}
          </p>
        </div>
      </BrandLayout>
    );
  }

  return (
    <BrandLayout title={product?.name ?? t('checkout.orderFallback')} subtitle={category?.name}>
      <Link to={`/category/${catId}`} className={'mb-6 inline-block ' + ghostButtonClass}>
        {t('checkout.backPackages')}
      </Link>

      {loading ? (
        <div className={glassCardClass + ' text-slate-600 dark:text-slate-300'}>{t('checkout.loading')}</div>
      ) : (
        <form onSubmit={onSubmit} className={glassCardClass + ' space-y-6'}>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6 dark:border-white/10">
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{t('checkout.price')}</div>
              <div className="text-2xl font-semibold text-emerald-700 dark:text-emerald-200">
                {product!.price} {t('category.currency')}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm dark:border-white/10 dark:bg-black/25">
            <div className="text-slate-500 dark:text-slate-400">{t('checkout.player')}</div>
            <div className="mt-1 font-medium text-slate-900 dark:text-white">{checkout!.playerDisplayName}</div>
            <div className="mt-3 text-slate-500 dark:text-slate-400">{t('checkout.idLabel')}</div>
            <div className="text-slate-800 dark:text-slate-200">
              {checkout!.playerId}
              {category!.hasZoneId ? ` · ${t('checkout.serverPrefix')} ${checkout!.zoneId}` : ''}
            </div>
            <div className="mt-3 text-slate-500 dark:text-slate-400">{t('checkout.receiptEmail')}</div>
            <div className="text-slate-800 dark:text-slate-200">{receiptEmail}</div>
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-white/20 dark:bg-white/5 dark:text-slate-400">
            {t('checkout.paymentNote')}
          </div>

          <button type="submit" className={'w-full ' + primaryButtonClass}>
            {t('checkout.submitDemo')}
          </button>
        </form>
      )}
    </BrandLayout>
  );
}
