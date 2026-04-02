import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { catalogService, type CategoryDto } from '../api/catalogService';
import { BrandLayout, glassCardClass } from '../components/BrandLayout';

export function HomePage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await catalogService.getActiveCategories();
        if (!cancelled) setCategories(list.filter((c) => c.status === 'ACTIVE'));
      } catch {
        if (!cancelled) toast.error('Kategoriyalarni yuklab bo‘lmadi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <BrandLayout
      title="O‘yinlar"
      subtitle="Login shart emas — kategoriyani tanlang va top-up qiling. Hozircha faqat ko‘rish va ID tekshiruvi."
    >
      {loading ? (
        <div className={glassCardClass + ' text-center text-slate-300'}>Yuklanmoqda...</div>
      ) : categories.length === 0 ? (
        <div className={glassCardClass + ' text-center text-slate-300'}>Hozircha faol kategoriya yo‘q.</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/category/${c.id}`}
              className={`${glassCardClass} block transition hover:border-emerald-300/40 hover:shadow-[0_20px_70px_-25px_rgba(16,185,129,0.35)]`}
            >
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                  {c.logoUrl ? (
                    <img src={c.logoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-emerald-200">
                      {c.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg font-semibold text-white">{c.name}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {c.hasZoneId ? 'Zone ID talab qilinadi' : 'Faqat Player ID'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </BrandLayout>
  );
}
