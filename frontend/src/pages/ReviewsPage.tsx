import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { reviewsService, type ReviewDto } from '../api/reviewsService';
import { getStoredUser, isAuthenticated } from '../api/authService';
import { BrandLayout, ghostButtonClass, glassCardClass, primaryButtonClass } from '../components/BrandLayout';

const STORAGE_KEY = 'skyrush_pending_review';

export type PendingReviewState = {
  categoryId: number;
  productId: number;
  productName: string;
  categoryName: string;
};

function readStoredPending(): PendingReviewState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PendingReviewState;
    if (
      typeof p?.productName === 'string' &&
      typeof p?.categoryName === 'string' &&
      Number.isFinite(p.categoryId) &&
      Number.isFinite(p.productId)
    ) {
      return p;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function StarsRow({ value, interactive, onChange }: { value: number; interactive?: boolean; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-1" role={interactive ? 'radiogroup' : undefined} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(n)}
          className={`text-lg transition sm:text-xl ${
            n <= value ? 'text-amber-500 dark:text-amber-400' : 'text-slate-300 dark:text-slate-600'
          } ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
          aria-checked={interactive ? n === value : undefined}
          role={interactive ? 'radio' : undefined}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function ReviewsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state as { pendingReview?: PendingReviewState } | null)?.pendingReview;

  const [pending, setPending] = useState<PendingReviewState | null>(() => navState ?? readStoredPending());
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');

  const loggedIn = isAuthenticated();
  const user = getStoredUser();

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const list = await reviewsService.list(0, 100);
      setReviews(list);
    } catch {
      toast.error(t('reviews.toastLoadError'));
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    if (navState) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(navState));
      setPending(navState);
    }
  }, [navState]);

  const dismissPending = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setPending(null);
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!loggedIn) {
      navigate('/login', { state: { from: '/reviews' } });
      return;
    }
    const text = body.trim();
    if (text.length < 3) {
      toast.error(t('reviews.toastBodyShort'));
      return;
    }
    setSubmitting(true);
    try {
      await reviewsService.create({
        rating,
        body: text,
        categoryId: pending?.categoryId ?? null,
        productId: pending?.productId ?? null,
      });
      toast.success(t('reviews.toastSaved'));
      setBody('');
      setRating(5);
      dismissPending();
      await loadReviews();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        toast.error(t('reviews.toastNeedLogin'));
        navigate('/login', { state: { from: '/reviews' } });
      } else {
        toast.error(t('reviews.toastSaveError'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <BrandLayout title={t('reviews.title')} subtitle={t('reviews.subtitle')}>
      {pending ? (
        <div className="mb-8 rounded-2xl border border-emerald-300/70 bg-emerald-50 px-5 py-4 text-slate-800 shadow-md shadow-emerald-200/40 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-slate-100 dark:shadow-[0_0_40px_-20px_rgba(16,185,129,0.35)]">
          <p className="font-semibold text-emerald-900 dark:text-emerald-100">{t('reviews.afterPurchaseTitle')}</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {t('reviews.afterPurchaseBody', {
              product: pending.productName,
              category: pending.categoryName,
            })}
          </p>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{t('reviews.afterPurchaseHint')}</p>
          <button type="button" onClick={dismissPending} className={'mt-4 ' + ghostButtonClass}>
            {t('reviews.dismissBanner')}
          </button>
        </div>
      ) : null}

      {!loggedIn ? (
        <div className={'mb-8 ' + glassCardClass}>
          <p className="text-slate-700 dark:text-slate-200">{t('reviews.loginRequired')}</p>
          <Link
            to="/login"
            state={{ from: '/reviews' }}
            className={'mt-4 inline-flex ' + primaryButtonClass}
          >
            {t('reviews.goLogin')}
          </Link>
        </div>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className={'mb-10 ' + glassCardClass + ' space-y-5'}>
          <div>
            <div className="mb-2 text-sm font-medium text-slate-800 dark:text-slate-200">{t('reviews.formRating')}</div>
            <StarsRow value={rating} interactive onChange={setRating} />
          </div>
          <div>
            <label htmlFor="review-body" className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">
              {t('reviews.formBody')}
            </label>
            <textarea
              id="review-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={2000}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-500 outline-none focus:border-emerald-500/60 dark:border-white/15 dark:bg-black/30 dark:text-slate-100 dark:focus:border-emerald-400/50"
              placeholder={t('reviews.formPlaceholder')}
            />
            <div className="mt-1 text-xs text-slate-500">{body.length}/2000</div>
          </div>
          {user ? (
            <p className="text-xs text-slate-500">
              {t('reviews.postingAs', { name: user.username })}
            </p>
          ) : null}
          <button type="submit" disabled={submitting} className={primaryButtonClass + ' w-full sm:w-auto'}>
            {submitting ? t('reviews.saving') : t('reviews.submit')}
          </button>
        </form>
      )}

      <div className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{t('reviews.listTitle')}</div>

      {loading ? (
        <div className={glassCardClass + ' text-slate-500 dark:text-slate-400'}>{t('reviews.loading')}</div>
      ) : reviews.length === 0 ? (
        <div className={glassCardClass}>
          <p className="text-slate-600 dark:text-slate-300">{t('reviews.emptyList')}</p>
          <Link to="/" className={'mt-6 inline-block ' + ghostButtonClass}>
            {t('reviews.backHome')}
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className={glassCardClass + ' !py-5'}>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3 dark:border-white/10">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{r.authorUsername}</div>
                  <div className="text-xs text-slate-500">{formatDate(r.createdAt)}</div>
                </div>
                <StarsRow value={r.rating} />
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {r.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </BrandLayout>
  );
}
