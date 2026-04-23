import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { tournamentsService, type TournamentSummaryDto } from '../api/tournamentsService';
import { getStoredUser, isAuthenticated } from '../api/authService';
import { BrandLayout, ghostButtonClass, glassCardClass, primaryButtonClass } from '../components/BrandLayout';

type TabId = 'organized' | 'captain';

export function MyTournamentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const [tab, setTab] = useState<TabId>('organized');
  const [organized, setOrganized] = useState<TournamentSummaryDto[]>([]);
  const [captain, setCaptain] = useState<TournamentSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!isAuthenticated()) return;
    setLoading(true);
    try {
      const [o, c] = await Promise.all([
        tournamentsService.listMyOrganized(),
        tournamentsService.listMyCaptain(),
      ]);
      setOrganized(o);
      setCaptain(c);
    } catch {
      toast.error(t('tournaments.myLoadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    void load();
  }, [load, navigate]);

  const rows = tab === 'organized' ? organized : captain;

  const tabBtn = (id: TabId, label: string) => (
    <button
      type="button"
      key={id}
      aria-pressed={tab === id}
      onClick={() => setTab(id)}
      className={
        tab === id
          ? primaryButtonClass + ' flex-1 px-4 py-2.5 text-sm'
          : ghostButtonClass +
            ' flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-white/15'
      }
    >
      {label}
    </button>
  );

  return (
    <BrandLayout title={t('tournaments.myTournamentsTitle')} subtitle={t('tournaments.myTournamentsSubtitle')}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to="/tournaments" className={ghostButtonClass + ' inline-flex text-sm'}>
          {t('tournaments.backList')}
        </Link>
        {user ? <span className="text-sm text-slate-500 dark:text-slate-400">{user.username}</span> : null}
      </div>

      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{t('tournaments.mySettingsHint')}</p>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
        {tabBtn('organized', t('tournaments.myTabOrganized'))}
        {tabBtn('captain', t('tournaments.myTabCaptain'))}
      </div>

      <section className={glassCardClass}>
        {loading ? (
          <p className="text-slate-500 dark:text-slate-400">{t('tournaments.loading')}</p>
        ) : rows.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">
            {tab === 'organized' ? t('tournaments.myEmptyOrganized') : t('tournaments.myEmptyCaptain')}
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li
                key={`${tab}-${row.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 p-4 dark:border-white/10"
              >
                <div>
                  <p className="font-semibold">{row.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t('tournaments.metaTeams', { current: row.teamCount, max: row.maxTeams })}
                    {row.bigTournament
                      ? ` · ${t('tournaments.metaScaleBig')}`
                      : row.tournamentScale === 'SMALL'
                        ? ` · ${t('tournaments.metaScaleSmall')}`
                        : ` · ${t('tournaments.metaScaleMedium')}`}
                    {row.hasCustomStages
                      ? ` · ${t('tournaments.metaMworld')}`
                      : row.phasedFormat
                        ? ` · ${t('tournaments.metaPhased')}`
                        : ''}{' '}
                    · {t('tournaments.metaMainBo', { bo: row.bestOf })} ·{' '}
                    {t('tournaments.metaRoster', { n: row.rosterSize })} · {row.organizerUsername}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={user && row.organizerUsername === user.username ? `/tournaments/${row.id}/edit` : `/tournaments/${row.id}`}
                    className={primaryButtonClass + ' inline-flex shrink-0 px-4 py-2 text-sm'}
                  >
                    {user && row.organizerUsername === user.username
                      ? t('tournaments.edit')
                      : t('tournaments.openDetail')}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </BrandLayout>
  );
}
