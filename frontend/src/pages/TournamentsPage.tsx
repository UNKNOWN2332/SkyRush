import { FormEvent, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { mworld32Preset } from '../api/tournamentPresets';
import { tournamentsService, type TournamentSummaryDto } from '../api/tournamentsService';
import { getStoredUser, isAuthenticated } from '../api/authService';
import { BrandLayout, ghostButtonClass, glassCardClass, inputClass, labelClass, primaryButtonClass } from '../components/BrandLayout';
import { useTournamentListEvents } from '../hooks/useTournamentListEvents';

const BEST_OF_OPTIONS = [1, 2, 3, 5, 7, 9] as const;

export function TournamentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const [items, setItems] = useState<TournamentSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    maxTeams: 8,
    bestOf: 3,
    rosterSize: 5,
    gameCode: 'ML',
    /** simple | phased (faqat BO chegara) | mworld32 (guruh + winners/losers + GF andoza) */
    structureMode: 'simple' as 'simple' | 'phased' | 'mworld32',
    phaseThresholdTeams: 32,
    earlyBestOf: 1,
    lateBestOf: 3,
  });

  const load = useCallback(async () => {
    try {
      const list = await tournamentsService.list();
      setItems(list);
    } catch {
      toast.error(t('tournaments.toastLoadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  useTournamentListEvents(() => {
    void load();
  });

  useEffect(() => {
    if (!createOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [createOpen]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!isAuthenticated()) {
      toast.error(t('tournaments.toastNeedLogin'));
      navigate('/login');
      return;
    }
    const title = form.title.trim();
    if (title.length < 2) {
      toast.error(t('tournaments.toastTitleShort'));
      return;
    }
    if (form.structureMode === 'phased') {
      const thr = form.phaseThresholdTeams;
      if (!Number.isFinite(thr) || thr < 1 || thr >= form.maxTeams) {
        toast.error(t('tournaments.toastPhaseThreshold'));
        return;
      }
    }
    setSaving(true);
    try {
      if (form.structureMode === 'mworld32') {
        const p = mworld32Preset();
        await tournamentsService.create({
          title,
          description: form.description.trim() || null,
          maxTeams: p.maxTeams,
          bestOf: 2,
          rosterSize: form.rosterSize,
          gameCode: form.gameCode.trim() || 'ML',
          stages: p.stages,
        });
      } else {
        await tournamentsService.create({
          title,
          description: form.description.trim() || null,
          maxTeams: form.maxTeams,
          bestOf: form.structureMode === 'phased' ? form.earlyBestOf : form.bestOf,
          rosterSize: form.rosterSize,
          gameCode: form.gameCode.trim() || 'ML',
          formatRules:
            form.structureMode === 'phased'
              ? [
                  { minTeams: form.phaseThresholdTeams + 1, bestOf: form.earlyBestOf },
                  { minTeams: 1, bestOf: form.lateBestOf },
                ]
              : undefined,
        });
      }
      toast.success(t('tournaments.toastCreated'));
      setCreateOpen(false);
      setForm((f) => ({ ...f, title: '', description: '' }));
      await load();
    } catch {
      toast.error(t('tournaments.toastCreateError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <BrandLayout title={t('tournaments.title')} subtitle={t('tournaments.subtitle')}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className={ghostButtonClass + ' inline-flex text-sm'}>
          {t('tournaments.backHome')}
        </Link>
        {user ? (
          <button type="button" onClick={() => setCreateOpen(true)} className={primaryButtonClass + ' text-sm'}>
            {t('tournaments.createOpen')}
          </button>
        ) : (
          <Link to="/login" className={primaryButtonClass + ' inline-flex text-sm'}>
            {t('tournaments.loginToCreate')}
          </Link>
        )}
      </div>

      {createOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[500] overflow-y-auto overflow-x-hidden bg-black/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal
            aria-label={t('tournaments.createTitle')}
          >
            <div className="flex min-h-screen items-start justify-center py-8 sm:min-h-[100dvh] sm:items-center sm:py-10">
              <div
                className={
                  glassCardClass +
                  ' relative w-full max-w-xl shrink-0 overflow-y-auto sm:max-h-[min(90vh,90dvh)]'
                }
              >
                <button
                  type="button"
                  className="absolute right-4 top-4 z-10 rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
                  onClick={() => setCreateOpen(false)}
                >
                  ✕
                </button>
                <h2 className="mb-4 pr-10 text-xl font-bold">{t('tournaments.createTitle')}</h2>
                <form onSubmit={onCreate} className="space-y-4">
                  <div>
                    <label className={labelClass}>{t('tournaments.fieldTitle')}</label>
                    <input
                      className={inputClass}
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      required
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t('tournaments.fieldDescription')}</label>
                    <textarea
                      className={inputClass + ' min-h-[88px] max-h-40 resize-y'}
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <p className={`${labelClass} mb-2`}>{t('tournaments.fieldStructureMode')}</p>
                    <div className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="structure"
                          checked={form.structureMode === 'simple'}
                          onChange={() => setForm((f) => ({ ...f, structureMode: 'simple' }))}
                        />
                        {t('tournaments.structureSimple')}
                      </label>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="structure"
                          checked={form.structureMode === 'phased'}
                          onChange={() => setForm((f) => ({ ...f, structureMode: 'phased' }))}
                        />
                        {t('tournaments.structurePhased')}
                      </label>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="structure"
                          checked={form.structureMode === 'mworld32'}
                          onChange={() =>
                            setForm((f) => ({ ...f, structureMode: 'mworld32', maxTeams: 32 }))
                          }
                        />
                        {t('tournaments.structureMworld32')}
                      </label>
                    </div>
                    {form.structureMode === 'mworld32' ? (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('tournaments.mworld32Hint')}</p>
                    ) : null}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>{t('tournaments.fieldMaxTeams')}</label>
                      <input
                        type="number"
                        min={2}
                        max={1024}
                        className={inputClass}
                        disabled={form.structureMode === 'mworld32'}
                        value={form.structureMode === 'mworld32' ? 32 : form.maxTeams}
                        onChange={(e) => setForm((f) => ({ ...f, maxTeams: Number(e.target.value) || 2 }))}
                      />
                    </div>
                    {form.structureMode === 'simple' ? (
                      <div>
                        <label className={labelClass}>{t('tournaments.fieldBestOf')}</label>
                        <select
                          className={inputClass}
                          value={form.bestOf}
                          onChange={(e) => setForm((f) => ({ ...f, bestOf: Number(e.target.value) }))}
                        >
                          {BEST_OF_OPTIONS.map((n) => (
                            <option key={n} value={n}>
                              BO{n}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                    <div>
                      <label className={labelClass}>{t('tournaments.fieldRoster')}</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        className={inputClass}
                        value={form.rosterSize}
                        onChange={(e) => setForm((f) => ({ ...f, rosterSize: Number(e.target.value) || 1 }))}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t('tournaments.fieldGame')}</label>
                      <input
                        className={inputClass}
                        value={form.gameCode}
                        onChange={(e) => setForm((f) => ({ ...f, gameCode: e.target.value }))}
                        maxLength={32}
                      />
                    </div>
                  </div>
                  {form.structureMode === 'phased' ? (
                    <div className="grid gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:grid-cols-2 dark:border-emerald-400/20">
                      <div className="sm:col-span-2">
                        <label className={labelClass}>{t('tournaments.fieldPhaseThreshold')}</label>
                        <input
                          type="number"
                          min={1}
                          max={1023}
                          className={inputClass}
                          value={form.phaseThresholdTeams}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, phaseThresholdTeams: Number(e.target.value) || 1 }))
                          }
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {t('tournaments.fieldPhaseThresholdHelp', { max: form.maxTeams })}
                        </p>
                      </div>
                      <div>
                        <label className={labelClass}>{t('tournaments.fieldEarlyBo')}</label>
                        <select
                          className={inputClass}
                          value={form.earlyBestOf}
                          onChange={(e) => setForm((f) => ({ ...f, earlyBestOf: Number(e.target.value) }))}
                        >
                          {BEST_OF_OPTIONS.map((n) => (
                            <option key={n} value={n}>
                              BO{n}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>{t('tournaments.fieldLateBo')}</label>
                        <select
                          className={inputClass}
                          value={form.lateBestOf}
                          onChange={(e) => setForm((f) => ({ ...f, lateBestOf: Number(e.target.value) }))}
                        >
                          {BEST_OF_OPTIONS.map((n) => (
                            <option key={n} value={n}>
                              BO{n}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200/80 pt-4 dark:border-white/10">
                    <button type="button" className={ghostButtonClass} onClick={() => setCreateOpen(false)}>
                      {t('tournaments.cancel')}
                    </button>
                    <button type="submit" disabled={saving} className={primaryButtonClass}>
                      {saving ? t('tournaments.saving') : t('tournaments.submitCreate')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <section className={glassCardClass}>
        <h2 className="mb-4 text-lg font-semibold">{t('tournaments.listTitle')}</h2>
        {loading ? (
          <p className="text-slate-500 dark:text-slate-400">{t('tournaments.loading')}</p>
        ) : items.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">{t('tournaments.empty')}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 p-4 dark:border-white/10"
              >
                <div>
                  <p className="font-semibold">{row.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t('tournaments.metaTeams', { current: row.teamCount, max: row.maxTeams })}
                    {row.hasCustomStages
                      ? ` · ${t('tournaments.metaMworld')}`
                      : row.phasedFormat
                        ? ` · ${t('tournaments.metaPhased')}`
                        : ''}{' '}
                    · {t('tournaments.metaMainBo', { bo: row.bestOf })} ·{' '}
                    {t('tournaments.metaRoster', { n: row.rosterSize })} · {row.organizerUsername}
                  </p>
                </div>
                <Link
                  to={`/tournaments/${row.id}`}
                  className={primaryButtonClass + ' inline-flex shrink-0 px-4 py-2 text-sm'}
                >
                  {t('tournaments.openDetail')}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </BrandLayout>
  );
}
