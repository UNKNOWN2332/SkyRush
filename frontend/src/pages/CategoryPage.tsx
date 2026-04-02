import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { catalogService, type CategoryDto, type ProductDto } from '../api/catalogService';
import { BrandLayout, glassCardClass, ghostButtonClass, primaryButtonClass } from '../components/BrandLayout';

export function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const id = Number(categoryId);
  const [category, setCategory] = useState<CategoryDto | null>(null);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);

  const validId = useMemo(() => Number.isFinite(id) && id > 0, [id]);

  useEffect(() => {
    if (!validId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [cats, prods] = await Promise.all([
          catalogService.getActiveCategories(),
          catalogService.getProductsByCategory(id),
        ]);
        if (cancelled) return;
        const cat = cats.find((c) => c.id === id) ?? null;
        setCategory(cat);
        setProducts(prods.filter((p) => p.status === 'ACTIVE'));
      } catch {
        if (!cancelled) toast.error('Ma’lumot yuklanmadi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, validId]);

  if (!validId) {
    return (
      <BrandLayout title="Xato">
        <div className={glassCardClass}>
          <p className="text-slate-300">Noto‘g‘ri kategoriya.</p>
          <Link to="/" className={'mt-4 inline-block ' + primaryButtonClass}>
            Bosh sahifa
          </Link>
        </div>
      </BrandLayout>
    );
  }

  return (
    <BrandLayout
      title={category?.name ?? 'Kategoriya'}
      subtitle="Mahsulotni tanlang — keyin o‘yinchi ID sini kiritasiz."
    >
      <Link to="/" className={'mb-6 inline-block ' + ghostButtonClass}>
        ← Barcha o‘yinlar
      </Link>

      {loading ? (
        <div className={glassCardClass + ' text-slate-300'}>Yuklanmoqda...</div>
      ) : products.length === 0 ? (
        <div className={glassCardClass + ' text-slate-300'}>Bu kategoriyada mahsulot yo‘q.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((p) => (
            <Link
              key={p.id}
              to={`/category/${id}/checkout/${p.id}`}
              className={`${glassCardClass} block transition hover:border-emerald-300/40`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-white">{p.name}</div>
                  <div className="mt-2 text-sm text-emerald-200/90">{p.price} so‘m</div>
                </div>
                <span className="shrink-0 rounded-lg bg-gradient-to-r from-emerald-400/30 to-cyan-400/30 px-3 py-1 text-xs font-medium text-emerald-100">
                  Tanlash
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </BrandLayout>
  );
}
