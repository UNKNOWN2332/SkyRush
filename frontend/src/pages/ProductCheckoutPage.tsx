import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { catalogService, type CategoryDto, type ProductDto } from '../api/catalogService';
import { getStoredUser, isAuthenticated } from '../api/authService';
import {
  BrandLayout,
  glassCardClass,
  ghostButtonClass,
  inputClass,
  labelClass,
  primaryButtonClass,
} from '../components/BrandLayout';
import { mockVerifyPlayerId } from '../mock/playerCheck';

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function ProductCheckoutPage() {
  const { categoryId, productId } = useParams<{ categoryId: string; productId: string }>();
  const catId = Number(categoryId);
  const prodId = Number(productId);

  const [category, setCategory] = useState<CategoryDto | null>(null);
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [loading, setLoading] = useState(true);

  const [playerId, setPlayerId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [checkBusy, setCheckBusy] = useState(false);
  const [idVerified, setIdVerified] = useState(false);

  const authed = isAuthenticated();
  const profileEmail = getStoredUser()?.email ?? '';
  const hasZone = category?.hasZoneId ?? false;

  const validParams = useMemo(
    () => Number.isFinite(catId) && catId > 0 && Number.isFinite(prodId) && prodId > 0,
    [catId, prodId]
  );

  useEffect(() => {
    if (!validParams) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [cats, prods] = await Promise.all([
          catalogService.getActiveCategories(),
          catalogService.getProductsByCategory(catId),
        ]);
        if (cancelled) return;
        setCategory(cats.find((c) => c.id === catId) ?? null);
        setProduct(prods.find((p) => p.id === prodId) ?? null);
      } catch {
        if (!cancelled) toast.error('Ma’lumot yuklanmadi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [catId, prodId, validParams]);

  useEffect(() => {
    setIdVerified(false);
  }, [playerId, zoneId, catId, prodId]);

  const onCheck = async () => {
    setCheckBusy(true);
    try {
      const res = await mockVerifyPlayerId({
        playerId,
        zoneId: hasZone ? zoneId : null,
        hasZoneId: hasZone,
      });
      if (res.ok) {
        setIdVerified(true);
        toast.success(res.message);
      } else {
        setIdVerified(false);
        toast.error(res.message);
      }
    } finally {
      setCheckBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!idVerified) {
      toast.info('Avval «Tekshirish» tugmasini bosing.');
      return;
    }
    if (!authed && !isEmail(guestEmail.trim())) {
      toast.error('Email to‘g‘ri kiritilmagan.');
      return;
    }
    toast.success(
      authed
        ? `Demo: ${profileEmail} ga chek yuboriladi (keyingi bosqich).`
        : `Demo: ${guestEmail.trim()} ga chek yuboriladi (keyingi bosqich).`
    );
  };

  if (!validParams) {
    return (
      <BrandLayout title="Xato">
        <div className={glassCardClass}>
          <p className="text-slate-300">Noto‘g‘ri manzil.</p>
          <Link to="/" className={'mt-4 inline-block ' + primaryButtonClass}>
            Bosh sahifa
          </Link>
        </div>
      </BrandLayout>
    );
  }

  if (!loading && (!product || !category)) {
    return (
      <BrandLayout title="Topilmadi">
        <div className={glassCardClass}>
          <p className="text-slate-300">Mahsulot yoki kategoriya mavjud emas.</p>
          <Link to={`/category/${catId}`} className={'mt-4 inline-block ' + primaryButtonClass}>
            Orqaga
          </Link>
        </div>
      </BrandLayout>
    );
  }

  return (
    <BrandLayout title={product?.name ?? 'Buyurtma'} subtitle={category?.name}>
      <Link to={`/category/${catId}`} className={'mb-6 inline-block ' + ghostButtonClass}>
        ← Mahsulotlar
      </Link>

      {loading ? (
        <div className={glassCardClass + ' text-slate-300'}>Yuklanmoqda...</div>
      ) : (
        <div className={glassCardClass}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="text-sm text-slate-400">Narxi</div>
              <div className="text-2xl font-semibold text-emerald-200">{product!.price} so‘m</div>
            </div>
            {idVerified && (
              <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
                ID tekshirildi
              </span>
            )}
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className={labelClass}>Player ID</label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <input
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  className={inputClass + ' sm:flex-1'}
                  placeholder="O‘yinchi ID"
                  autoComplete="off"
                />
                <button
                  type="button"
                  disabled={checkBusy}
                  onClick={onCheck}
                  className={primaryButtonClass + ' shrink-0 sm:w-auto'}
                >
                  {checkBusy ? 'Tekshirilmoqda...' : 'Tekshirish'}
                </button>
              </div>
            </div>

            {hasZone && (
              <div>
                <label className={labelClass}>Zone ID</label>
                <input
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  className={inputClass}
                  placeholder="Zone ID"
                  autoComplete="off"
                />
              </div>
            )}

            {!authed && (
              <div>
                <label className={labelClass}>Email (chek uchun)</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className={inputClass}
                  placeholder="email@example.com"
                  autoComplete="email"
                  required
                />
                <p className="mt-2 text-xs text-slate-400">To‘lov tasdiqlangach xabar shu manzilga yuboriladi.</p>
              </div>
            )}

            {authed && (
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
                Siz tizimga kirgansiz. Chek <span className="font-medium text-white">{profileEmail}</span> manziliga
                yuboriladi.
              </div>
            )}

            <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-4 text-sm text-slate-400">
              To‘lov (Humo / Uzcard) va buyurtma saqlash keyingi bosqichda uladi. Hozircha faqat UI oqimi.
            </div>

            <button type="submit" className={'w-full ' + primaryButtonClass}>
              Davom etish (demo)
            </button>
          </form>
        </div>
      )}
    </BrandLayout>
  );
}
