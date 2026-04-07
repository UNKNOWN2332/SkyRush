import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { getStoredUser } from '../api/authService';
import { BrandLayout, glassCardClass } from '../components/BrandLayout';

export function ProfilePage() {
  const { t } = useTranslation();
  const user = getStoredUser();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <BrandLayout title={t('profile.title')} subtitle={t('profile.subtitle')}>
      <div className={glassCardClass + ' max-w-lg'}>
        <div className="flex items-center gap-4 border-b border-slate-200 pb-6 dark:border-white/10">
          <img
            src="/avatar-default.png"
            alt=""
            className="h-16 w-16 shrink-0 rounded-full border-2 border-slate-200 object-cover ring-2 ring-indigo-400/30 dark:border-white/15 dark:ring-indigo-500/25"
          />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-slate-900 dark:text-white">{user.username}</p>
            <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>
        <dl className="mt-6 space-y-4 text-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <dt className="text-slate-500 dark:text-slate-400">{t('profile.usernameLabel')}</dt>
            <dd className="font-mono break-all text-slate-900 dark:text-slate-100">{user.username}</dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <dt className="text-slate-500 dark:text-slate-400">{t('profile.emailLabel')}</dt>
            <dd className="break-all text-slate-900 dark:text-slate-100">{user.email}</dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <dt className="text-slate-500 dark:text-slate-400">{t('profile.coinsLabel')}</dt>
            <dd className="text-emerald-700 dark:text-emerald-200">{user.goldCoins}</dd>
          </div>
        </dl>
      </div>
    </BrandLayout>
  );
}
