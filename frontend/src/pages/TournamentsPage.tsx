import { FormEvent, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { tournamentsService, type TournamentSummaryDto } from '../api/tournamentsService';
import { getStoredUser, isAuthenticated } from '../api/authService';
import { BrandLayout, ghostButtonClass, glassCardClass, inputClass, labelClass, primaryButtonClass } from '../components/BrandLayout';
import { useTournamentListEvents } from '../hooks/useTournamentListEvents';

/** «Mening turnirlarim» — sayt palitrasi (emerald/teal/cyan), yaratish tugmasidan yumshoqroq */
const myTournamentsButtonClass =
  'inline-flex items-center justify-center rounded-xl border-2 border-emerald-400/65 bg-gradient-to-r from-emerald-500/12 via-teal-500/10 to-cyan-500/12 px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-emerald-400/85 hover:from-emerald-500/20 hover:via-teal-500/15 hover:to-cyan-500/20 dark:border-emerald-400/45 dark:from-emerald-400/10 dark:via-teal-400/10 dark:to-cyan-400/10 dark:text-slate-100 dark:hover:border-emerald-300/60 dark:hover:from-emerald-400/18 dark:hover:via-teal-400/14 dark:hover:to-cyan-400/18';

type TournamentScaleUi = 'SMALL' | 'MEDIUM' | 'BIG';

/** Yaratishda BO tanlanmaydi; standart qiymat (keyinroq sozlamalardan o‘zgartirish rejalashtirilgan). */
const DEFAULT_CREATE_BEST_OF = 3;

/** Hozircha faqat ML; matn maydoni yo‘q — logo orqali tanlash. */
const TOURNAMENT_GAME_OPTIONS = [{ code: 'ML' as const, logoSrc: '/games/ml-logo.png' }];

const SCALE_SMALL_MIN = 8;
const SCALE_SMALL_MAX = 16;
const SCALE_MEDIUM_MIN = 32;
const SCALE_MEDIUM_MAX = 64;
const SCALE_BIG_MIN = 32;

const ROSTER_MIN = 5;
/** Kichik va katta turnir */
const ROSTER_MAX_STANDARD = 20;
/** O‘rta turnir */
const ROSTER_MAX_MEDIUM = 9;
const DEFAULT_ROSTER_INPUT = '5';

function rosterMaxForScale(scale: TournamentScaleUi): number {
  return scale === 'MEDIUM' ? ROSTER_MAX_MEDIUM : ROSTER_MAX_STANDARD;
}

type MaxTeamsValidation =
  | { ok: true; value: number }
  | { ok: false; reason: 'empty' | 'nan' | 'low' | 'high' };

type RosterValidation =
  | { ok: true; value: number }
  | { ok: false; reason: 'empty' | 'nan' | 'low' | 'high' };

function validateMaxTeamsInput(scale: TournamentScaleUi, raw: string): MaxTeamsValidation {
  if (!raw.trim()) return { ok: false, reason: 'empty' };
  const n = parseInt(raw.trim().replace(/\s/g, ''), 10);
  if (!Number.isFinite(n)) return { ok: false, reason: 'nan' };
  const min = minTeamsForScale(scale);
  const max = maxTeamsForScale(scale);
  if (n < min) return { ok: false, reason: 'low' };
  if (max != null && n > max) return { ok: false, reason: 'high' };
  return { ok: true, value: n };
}

function validateRosterInput(scale: TournamentScaleUi, raw: string): RosterValidation {
  if (!raw.trim()) return { ok: false, reason: 'empty' };
  const n = parseInt(raw.trim().replace(/\s/g, ''), 10);
  if (!Number.isFinite(n)) return { ok: false, reason: 'nan' };
  if (n < ROSTER_MIN) return { ok: false, reason: 'low' };
  if (n > rosterMaxForScale(scale)) return { ok: false, reason: 'high' };
  return { ok: true, value: n };
}

function maxTeamsErrorMessage(t: TFunction, scale: TournamentScaleUi, v: MaxTeamsValidation): string | null {
  if (v.ok) return null;
  if (v.reason === 'empty') return t('tournaments.toastMaxTeamsRequired');
  if (v.reason === 'nan') return t('tournaments.toastInvalidNumber');
  if (v.reason === 'low') return t('tournaments.toastMaxTeamsTooFew', { min: minTeamsForScale(scale) });
  return t('tournaments.toastMaxTeamsTooMany', { max: maxTeamsForScale(scale)! });
}

function rosterErrorMessage(t: TFunction, scale: TournamentScaleUi, v: RosterValidation): string | null {
  if (v.ok) return null;
  if (v.reason === 'empty') return t('tournaments.toastRosterRequired');
  if (v.reason === 'nan') return t('tournaments.toastInvalidNumber');
  if (v.reason === 'low') return t('tournaments.toastRosterTooFew', { min: ROSTER_MIN });
  return t('tournaments.toastRosterTooMany', { max: rosterMaxForScale(scale) });
}

const inputErrorRingClass =
  'border-red-500/80 focus:border-red-500 focus:ring-red-400/35 dark:border-red-400/70 dark:focus:border-red-400 dark:focus:ring-red-400/25';

function minTeamsForScale(scale: TournamentScaleUi): number {
  switch (scale) {
    case 'SMALL':
      return SCALE_SMALL_MIN;
    case 'MEDIUM':
      return SCALE_MEDIUM_MIN;
    case 'BIG':
      return SCALE_BIG_MIN;
  }
}

function maxTeamsForScale(scale: TournamentScaleUi): number | null {
  switch (scale) {
    case 'SMALL':
      return SCALE_SMALL_MAX;
    case 'MEDIUM':
      return SCALE_MEDIUM_MAX;
    case 'BIG':
      return null;
  }
}

function defaultTeamsInput(scale: TournamentScaleUi): string {
  switch (scale) {
    case 'SMALL':
      return '12';
    case 'MEDIUM':
      return '32';
    case 'BIG':
      return '128';
  }
}

export function TournamentsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const [items, setItems] = useState<TournamentSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [maxTeamsError, setMaxTeamsError] = useState<string | null>(null);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    /** Matn — o‘chirib qayta yozish mumkin; blur/submit da tekshiriladi */
    maxTeamsInput: '32',
    rosterSizeInput: DEFAULT_ROSTER_INPUT,
    gameCode: 'ML',
    tournamentScale: 'MEDIUM' as TournamentScaleUi,
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

  useEffect(() => {
    if (!createOpen) return;
    setMaxTeamsError(null);
    setRosterError(null);
  }, [createOpen]);

  useEffect(() => {
    if (validateMaxTeamsInput(form.tournamentScale, form.maxTeamsInput).ok) {
      setMaxTeamsError(null);
    }
  }, [form.maxTeamsInput, form.tournamentScale]);

  useEffect(() => {
    if (validateRosterInput(form.tournamentScale, form.rosterSizeInput).ok) {
      setRosterError(null);
    }
  }, [form.rosterSizeInput, form.tournamentScale]);

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
    const maxV = validateMaxTeamsInput(form.tournamentScale, form.maxTeamsInput);
    const rosterV = validateRosterInput(form.tournamentScale, form.rosterSizeInput);
    if (!maxV.ok) {
      setMaxTeamsError(maxTeamsErrorMessage(t, form.tournamentScale, maxV));
    } else {
      setMaxTeamsError(null);
    }
    if (!rosterV.ok) {
      setRosterError(rosterErrorMessage(t, form.tournamentScale, rosterV));
    } else {
      setRosterError(null);
    }
    if (!maxV.ok || !rosterV.ok) {
      return;
    }
    const maxTeams = maxV.value;
    const rosterSize = rosterV.value;
    setSaving(true);
    try {
      if (form.tournamentScale === 'BIG') {
        await tournamentsService.create({
          title,
          description: form.description.trim() || null,
          maxTeams,
          bestOf: DEFAULT_CREATE_BEST_OF,
          rosterSize,
          gameCode: form.gameCode,
          tournamentScale: 'BIG',
        });
      } else if (form.tournamentScale === 'SMALL') {
        await tournamentsService.create({
          title,
          description: form.description.trim() || null,
          maxTeams,
          bestOf: 3,
          rosterSize,
          gameCode: form.gameCode,
          tournamentScale: 'SMALL',
        });
      } else {
        await tournamentsService.create({
          title,
          description: form.description.trim() || null,
          maxTeams,
          bestOf: DEFAULT_CREATE_BEST_OF,
          rosterSize,
          gameCode: form.gameCode,
          tournamentScale: 'MEDIUM',
        });
      }
      toast.success(t('tournaments.toastCreated'));
      setCreateOpen(false);
      setMaxTeamsError(null);
      setRosterError(null);
      setForm((f) => ({
        ...f,
        title: '',
        description: '',
        maxTeamsInput: defaultTeamsInput(f.tournamentScale),
        rosterSizeInput: DEFAULT_ROSTER_INPUT,
      }));
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
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link to="/tournaments/mine" className={myTournamentsButtonClass}>
              {t('tournaments.myTournaments')}
            </Link>
            <button type="button" onClick={() => setCreateOpen(true)} className={primaryButtonClass + ' text-sm'}>
              {t('tournaments.createOpen')}
            </button>
          </div>
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
                    <p className={`${labelClass} mb-2`}>{t('tournaments.fieldTournamentScale')}</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {(['SMALL', 'MEDIUM', 'BIG'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          aria-pressed={form.tournamentScale === s}
                          className={
                            form.tournamentScale === s
                              ? primaryButtonClass +
                                ' flex min-h-[4.5rem] flex-col items-center justify-center gap-0.5 px-3 py-2.5 text-center text-sm'
                              : ghostButtonClass +
                                ' flex min-h-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-200 px-3 py-2.5 text-center text-sm dark:border-white/15'
                          }
                          onClick={() => {
                            setMaxTeamsError(null);
                            setRosterError(null);
                            setForm((f) => ({
                              ...f,
                              tournamentScale: s,
                              maxTeamsInput: defaultTeamsInput(s),
                            }));
                          }}
                        >
                          <span className="font-semibold leading-tight">
                            {t(`tournaments.scalePickerTitle_${s}`)}
                          </span>
                          <span className="text-[11px] font-normal leading-snug opacity-90">
                            {t(`tournaments.scalePickerLine_${s}`)}
                          </span>
                        </button>
                      ))}
                    </div>
                    {form.tournamentScale === 'BIG' ? (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('tournaments.scaleBigHint')}</p>
                    ) : null}
                    {form.tournamentScale === 'SMALL' ? (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {t('tournaments.smallFormatPresetHint')}
                      </p>
                    ) : null}
                    {form.tournamentScale === 'MEDIUM' ? (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {t('tournaments.mediumWizardSoonHint')}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelClass} htmlFor="create-tournament-max-teams">
                        {t('tournaments.fieldMaxTeams')}
                      </label>
                      <input
                        id="create-tournament-max-teams"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        aria-invalid={maxTeamsError ? true : undefined}
                        aria-describedby={
                          maxTeamsError
                            ? 'create-tournament-max-teams-err'
                            : 'create-tournament-max-teams-hint'
                        }
                        className={inputClass + (maxTeamsError ? ' ' + inputErrorRingClass : '')}
                        value={form.maxTeamsInput}
                        onChange={(e) => setForm((f) => ({ ...f, maxTeamsInput: e.target.value }))}
                        onBlur={() => {
                          setForm((f) => {
                            const v = validateMaxTeamsInput(f.tournamentScale, f.maxTeamsInput);
                            if (!v.ok) {
                              queueMicrotask(() =>
                                setMaxTeamsError(maxTeamsErrorMessage(t, f.tournamentScale, v)),
                              );
                              return f;
                            }
                            queueMicrotask(() => setMaxTeamsError(null));
                            return { ...f, maxTeamsInput: String(v.value) };
                          });
                        }}
                      />
                      {maxTeamsError ? (
                        <p
                          id="create-tournament-max-teams-err"
                          className="mt-1 text-xs font-medium text-red-600 dark:text-red-400"
                          role="alert"
                        >
                          {maxTeamsError}
                        </p>
                      ) : (
                        <p
                          id="create-tournament-max-teams-hint"
                          className="mt-1 text-xs text-slate-500 dark:text-slate-400"
                        >
                          {form.tournamentScale === 'BIG'
                            ? t('tournaments.fieldMaxTeamsBigHelp', { min: SCALE_BIG_MIN })
                            : t('tournaments.fieldMaxTeamsRangeHelp', {
                                min: minTeamsForScale(form.tournamentScale),
                                max: maxTeamsForScale(form.tournamentScale) ?? '—',
                              })}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="create-tournament-roster">
                        {t('tournaments.fieldRoster')}
                      </label>
                      <input
                        id="create-tournament-roster"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        aria-invalid={rosterError ? true : undefined}
                        aria-describedby={
                          rosterError
                            ? 'create-tournament-roster-err'
                            : 'create-tournament-roster-hint'
                        }
                        className={inputClass + (rosterError ? ' ' + inputErrorRingClass : '')}
                        value={form.rosterSizeInput}
                        onChange={(e) => setForm((f) => ({ ...f, rosterSizeInput: e.target.value }))}
                        onBlur={() => {
                          setForm((f) => {
                            const v = validateRosterInput(f.tournamentScale, f.rosterSizeInput);
                            if (!v.ok) {
                              queueMicrotask(() => setRosterError(rosterErrorMessage(t, f.tournamentScale, v)));
                              return f;
                            }
                            queueMicrotask(() => setRosterError(null));
                            return { ...f, rosterSizeInput: String(v.value) };
                          });
                        }}
                      />
                      {rosterError ? (
                        <p
                          id="create-tournament-roster-err"
                          className="mt-1 text-xs font-medium text-red-600 dark:text-red-400"
                          role="alert"
                        >
                          {rosterError}
                        </p>
                      ) : (
                        <p
                          id="create-tournament-roster-hint"
                          className="mt-1 text-xs text-slate-500 dark:text-slate-400"
                        >
                          {t('tournaments.fieldRosterRangeHelp', {
                            min: ROSTER_MIN,
                            max: rosterMaxForScale(form.tournamentScale),
                          })}
                        </p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <p className={labelClass}>{t('tournaments.fieldGame')}</p>
                      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                        {t('tournaments.fieldGameSelectOnlyHint')}
                      </p>
                      <div
                        className="flex flex-wrap gap-3"
                        role="group"
                        aria-label={t('tournaments.fieldGame')}
                      >
                        {TOURNAMENT_GAME_OPTIONS.map((g) => {
                          const selected = form.gameCode === g.code;
                          return (
                            <button
                              key={g.code}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => setForm((f) => ({ ...f, gameCode: g.code }))}
                              className={
                                'flex min-w-[8.5rem] flex-col items-center gap-2 rounded-2xl border px-4 py-3 text-center transition ' +
                                (selected
                                  ? 'border-emerald-500/80 bg-emerald-500/10 ring-2 ring-emerald-400/40 dark:border-emerald-400/60 dark:bg-emerald-500/15'
                                  : 'border-slate-200 bg-white/80 hover:border-slate-300 dark:border-white/15 dark:bg-black/20 dark:hover:border-white/25')
                              }
                            >
                              <img
                                src={g.logoSrc}
                                alt={t('tournaments.gameMobileLegends')}
                                className="h-16 max-h-16 w-auto max-w-[140px] shrink-0 object-contain"
                              />
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                                {t('tournaments.gameMobileLegends')}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
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
