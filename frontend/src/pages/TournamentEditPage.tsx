import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { tournamentsService, type TournamentDetailDto } from '../api/tournamentsService';
import { getStoredUser, isAuthenticated } from '../api/authService';
import { BrandLayout, ghostButtonClass, glassCardClass, inputClass, labelClass, primaryButtonClass } from '../components/BrandLayout';

function toUiDateTimeInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Faqat raqamdan format yig‘adi: YYYY-MM-DD HH:mm */
function formatDateTimeTyping(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 12);
  const y = digits.slice(0, 4);
  const m = digits.slice(4, 6);
  const d = digits.slice(6, 8);
  const hh = digits.slice(8, 10);
  const mm = digits.slice(10, 12);

  let out = y;
  if (m) out += `-${m}`;
  if (d) out += `-${d}`;
  if (hh) out += ` ${hh}`;
  if (mm) out += `:${mm}`;
  return out;
}

function fromUiDateTimeInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mon = Number(m[2]);
  const day = Number(m[3]);
  const hh = Number(m[4]);
  const mm = Number(m[5]);
  if (mon < 1 || mon > 12 || day < 1 || day > 31 || hh > 23 || mm > 59) return null;
  const d = new Date(y, mon - 1, day, hh, mm, 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  // 2026-02-31 kabi qiymatlar Date tomonidan avtomatik surilib ketmasin.
  if (
    d.getFullYear() !== y ||
    d.getMonth() !== mon - 1 ||
    d.getDate() !== day ||
    d.getHours() !== hh ||
    d.getMinutes() !== mm
  ) {
    return null;
  }
  return d.toISOString();
}

function minTeamsForScale(scale: string): number {
  if (scale === 'SMALL') return 8;
  if (scale === 'MEDIUM') return 32;
  return 32;
}

function maxTeamsForScale(scale: string): number | null {
  if (scale === 'SMALL') return 16;
  if (scale === 'MEDIUM') return 64;
  return null;
}

export function TournamentEditPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const user = getStoredUser();

  const [detail, setDetail] = useState<TournamentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bigControlSaving, setBigControlSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('REGISTRATION_OPEN');
  const [maxTeamsInput, setMaxTeamsInput] = useState('32');
  const [registrationOpenAtInput, setRegistrationOpenAtInput] = useState('');
  const [registrationCloseAtInput, setRegistrationCloseAtInput] = useState('');
  const [drawAtInput, setDrawAtInput] = useState('');
  const [startAtInput, setStartAtInput] = useState('');
  const [registrationOpenAtError, setRegistrationOpenAtError] = useState<string | null>(null);
  const [registrationCloseAtError, setRegistrationCloseAtError] = useState<string | null>(null);
  const [drawAtError, setDrawAtError] = useState<string | null>(null);
  const [startAtError, setStartAtError] = useState<string | null>(null);
  const [selectedGoldenTeamIds, setSelectedGoldenTeamIds] = useState<number[]>([]);
  const [startQualBoInput, setStartQualBoInput] = useState('1');
  const [nextRoundBoInput, setNextRoundBoInput] = useState('1');
  const [invitedTeamsInput, setInvitedTeamsInput] = useState('');

  const load = useCallback(async () => {
    if (!Number.isFinite(id) || id < 1) {
      setDetail(null);
      setLoading(false);
      return;
    }
    try {
      const d = await tournamentsService.get(id);
      setDetail(d);
      setTitle(d.title);
      setDescription(d.description ?? '');
      setMaxTeamsInput(String(d.maxTeams));
      setRegistrationOpenAtInput(toUiDateTimeInput(d.registrationOpenAt));
      setRegistrationCloseAtInput(toUiDateTimeInput(d.registrationCloseAt));
      setDrawAtInput(toUiDateTimeInput(d.drawAt));
      setStartAtInput(toUiDateTimeInput(d.startAt));
      setSelectedGoldenTeamIds([]);
      if (d.status === 'REGISTRATION_OPEN' || d.status === 'REGISTRATION_CLOSED') {
        setStatus(d.status);
      } else {
        setStatus('REGISTRATION_OPEN');
      }
    } catch {
      toast.error(t('tournaments.toastDetailError'));
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    void load();
  }, [load, navigate]);

  const isOrganizer = Boolean(user && detail && detail.organizerUsername === user.username);
  const selectedGoldenSet = new Set(selectedGoldenTeamIds);
  const nonGoldenSeedIds = detail
    ? detail.teams
        .map((tm) => tm.id)
        .filter((teamId) => !selectedGoldenSet.has(teamId))
        .sort((a, b) => a - b)
    : [];

  function toggleGolden(teamId: number) {
    setSelectedGoldenTeamIds((prev) => (prev.includes(teamId) ? prev.filter((x) => x !== teamId) : [...prev, teamId]));
  }

  async function onStartQualifiers() {
    if (!detail) return;
    const bo = parseInt(startQualBoInput.trim(), 10);
    if (!Number.isFinite(bo)) {
      toast.error(t('tournaments.bigInvalidBo'));
      return;
    }
    setBigControlSaving(true);
    try {
      await tournamentsService.markGoldenTeams(detail.id, selectedGoldenTeamIds);
      await tournamentsService.startBigQualifiers(detail.id, {
        orderedNonGoldenSeeds: nonGoldenSeedIds,
        bestOf: bo,
      });
      toast.success(t('tournaments.bigStartOk'));
      await load();
    } catch {
      toast.error(t('tournaments.bigActionError'));
    } finally {
      setBigControlSaving(false);
    }
  }

  async function onCreateNextRound() {
    if (!detail) return;
    const bo = parseInt(nextRoundBoInput.trim(), 10);
    if (!Number.isFinite(bo)) {
      toast.error(t('tournaments.bigInvalidBo'));
      return;
    }
    setBigControlSaving(true);
    try {
      await tournamentsService.createNextBigQualifierRound(detail.id, bo);
      toast.success(t('tournaments.bigNextRoundOk'));
      await load();
    } catch {
      toast.error(t('tournaments.bigActionError'));
    } finally {
      setBigControlSaving(false);
    }
  }

  async function onInviteTeams() {
    if (!detail) return;
    const names = invitedTeamsInput
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean);
    if (names.length === 0) {
      toast.error(t('tournaments.bigInviteEmpty'));
      return;
    }
    setBigControlSaving(true);
    try {
      await tournamentsService.inviteTeams(detail.id, names);
      toast.success(t('tournaments.bigInviteOk'));
      setInvitedTeamsInput('');
      await load();
    } catch {
      toast.error(t('tournaments.bigActionError'));
    } finally {
      setBigControlSaving(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!detail || !isOrganizer) return;
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      toast.error(t('tournaments.toastTitleShort'));
      return;
    }
    const nextMaxTeams = parseInt(maxTeamsInput.trim(), 10);
    if (!Number.isFinite(nextMaxTeams)) {
      toast.error(t('tournaments.editMaxTeamsInvalid'));
      return;
    }
    const minTeams = minTeamsForScale(detail.tournamentScale);
    const maxTeams = maxTeamsForScale(detail.tournamentScale);
    if (nextMaxTeams < minTeams || (maxTeams != null && nextMaxTeams > maxTeams)) {
      toast.error(t('tournaments.editMaxTeamsOutOfRange', { min: minTeams, max: maxTeams ?? '∞' }));
      return;
    }
    if (nextMaxTeams < detail.teamCount) {
      toast.error(t('tournaments.editMaxTeamsBelowCurrent', { current: detail.teamCount }));
      return;
    }
    const regOpenIso = fromUiDateTimeInput(registrationOpenAtInput);
    const regCloseIso = fromUiDateTimeInput(registrationCloseAtInput);
    const drawIso = fromUiDateTimeInput(drawAtInput);
    const startIso = fromUiDateTimeInput(startAtInput);
    if (registrationOpenAtInput.trim() && !regOpenIso) {
      const msg = t('tournaments.editRegOpenInvalid');
      setRegistrationOpenAtError(msg);
      toast.error(msg);
      return;
    }
    if (registrationCloseAtInput.trim() && !regCloseIso) {
      const msg = t('tournaments.editRegCloseInvalid');
      setRegistrationCloseAtError(msg);
      toast.error(msg);
      return;
    }
    if (drawAtInput.trim() && !drawIso) {
      const msg = t('tournaments.editDrawInvalid');
      setDrawAtError(msg);
      toast.error(msg);
      return;
    }
    if (startAtInput.trim() && !startIso) {
      const msg = t('tournaments.editStartInvalid');
      setStartAtError(msg);
      toast.error(msg);
      return;
    }
    setRegistrationOpenAtError(null);
    setRegistrationCloseAtError(null);
    setDrawAtError(null);
    setStartAtError(null);
    if (regOpenIso) {
      const minOpenAt = Date.now() + 24 * 60 * 60 * 1000;
      if (new Date(regOpenIso).getTime() < minOpenAt) {
        const msg = t('tournaments.editRegOpenTooSoon');
        setRegistrationOpenAtError(msg);
        toast.error(msg);
        return;
      }
    }
    if (regOpenIso && regCloseIso && new Date(regCloseIso) < new Date(regOpenIso)) {
      const msg = t('tournaments.editRegRangeInvalid');
      setRegistrationCloseAtError(msg);
      toast.error(msg);
      return;
    }
    if (regCloseIso && drawIso && new Date(drawIso) <= new Date(regCloseIso)) {
      const msg = t('tournaments.editDrawAfterRegClose');
      setDrawAtError(msg);
      toast.error(msg);
      return;
    }
    if (drawIso && startIso) {
      const minStartAt = new Date(new Date(drawIso).getTime() + 24 * 60 * 60 * 1000);
      if (new Date(startIso) < minStartAt) {
        const msg = t('tournaments.editStartAfterDraw');
        setStartAtError(msg);
        toast.error(msg);
        return;
      }
    }

    const payload: {
      title?: string;
      description?: string | null;
      status?: string;
      maxTeams?: number;
      registrationOpenAt?: string | null;
      registrationCloseAt?: string | null;
      drawAt?: string | null;
      startAt?: string | null;
    } = {};
    if (trimmed !== detail.title) payload.title = trimmed;
    const descNorm = description.trim() || null;
    const prevDesc = detail.description ?? null;
    if (descNorm !== prevDesc) payload.description = descNorm;
    if (nextMaxTeams !== detail.maxTeams) payload.maxTeams = nextMaxTeams;
    if ((detail.registrationOpenAt ?? null) !== (regOpenIso ?? null)) payload.registrationOpenAt = regOpenIso;
    if ((detail.registrationCloseAt ?? null) !== (regCloseIso ?? null)) payload.registrationCloseAt = regCloseIso;
    if ((detail.drawAt ?? null) !== (drawIso ?? null)) payload.drawAt = drawIso;
    if ((detail.startAt ?? null) !== (startIso ?? null)) payload.startAt = startIso;
    const regEditable =
      detail.status === 'REGISTRATION_OPEN' || detail.status === 'REGISTRATION_CLOSED';
    if (regEditable && status !== detail.status) payload.status = status;
    if (Object.keys(payload).length === 0) {
      toast.info(t('tournaments.editNoChanges'));
      return;
    }
    setSaving(true);
    try {
      await tournamentsService.update(id, payload);
      toast.success(t('tournaments.editSaved'));
      navigate(`/tournaments/${id}`);
    } catch {
      toast.error(t('tournaments.editSaveError'));
    } finally {
      setSaving(false);
    }
  }

  if (!Number.isFinite(id) || id < 1) {
    return (
      <BrandLayout title={t('tournaments.badIdTitle')}>
        <p className="text-slate-600 dark:text-slate-400">{t('tournaments.badIdBody')}</p>
      </BrandLayout>
    );
  }

  if (loading) {
    return (
      <BrandLayout title={t('tournaments.editTitle')}>
        <p className="text-slate-500 dark:text-slate-400">{t('tournaments.loading')}</p>
      </BrandLayout>
    );
  }

  if (!detail) {
    return (
      <BrandLayout title={t('tournaments.editTitle')}>
        <p className="text-slate-500 dark:text-slate-400">{t('tournaments.notFound')}</p>
        <Link to="/tournaments" className={ghostButtonClass + ' mt-4 inline-flex'}>
          {t('tournaments.backList')}
        </Link>
      </BrandLayout>
    );
  }

  if (!isOrganizer) {
    return (
      <BrandLayout title={t('tournaments.editTitle')}>
        <p className="text-slate-500 dark:text-slate-400">{t('tournaments.editForbidden')}</p>
        <Link to={`/tournaments/${id}`} className={ghostButtonClass + ' mt-4 inline-flex'}>
          {t('tournaments.openDetail')}
        </Link>
      </BrandLayout>
    );
  }

  return (
    <BrandLayout title={t('tournaments.editTitle')} subtitle={detail.title}>
      <div className="mb-6 flex flex-wrap gap-3">
        <Link to={`/tournaments/${id}`} className={ghostButtonClass + ' inline-flex text-sm'}>
          {t('tournaments.editBackToDetail')}
        </Link>
        <Link to="/tournaments" className={ghostButtonClass + ' inline-flex text-sm'}>
          {t('tournaments.backList')}
        </Link>
      </div>

      <form onSubmit={onSubmit} className={glassCardClass + ' space-y-4'}>
        <p className="text-sm text-slate-600 dark:text-slate-400">{t('tournaments.editIntro')}</p>
        <div>
          <label className={labelClass} htmlFor="edit-tournament-title">
            {t('tournaments.fieldTitle')}
          </label>
          <input
            id="edit-tournament-title"
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={2}
            maxLength={200}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="edit-tournament-desc">
            {t('tournaments.fieldDescription')}
          </label>
          <textarea
            id="edit-tournament-desc"
            className={inputClass + ' min-h-[100px] max-h-48 resize-y'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={4000}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="edit-tournament-max-teams">
            {t('tournaments.fieldMaxTeams')}
          </label>
          <input
            id="edit-tournament-max-teams"
            className={inputClass}
            type="text"
            inputMode="numeric"
            value={maxTeamsInput}
            onChange={(e) => setMaxTeamsInput(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t('tournaments.editMaxTeamsHelp', {
              min: minTeamsForScale(detail.tournamentScale),
              max: maxTeamsForScale(detail.tournamentScale) ?? '∞',
              current: detail.teamCount,
            })}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="edit-reg-open-at">
              {t('tournaments.editRegOpenLabel')}
            </label>
            <input
              id="edit-reg-open-at"
              className={inputClass + (registrationOpenAtError ? ' border-red-500/80' : '')}
              type="text"
              inputMode="numeric"
              placeholder="2026-04-30 20:00"
              value={registrationOpenAtInput}
              onChange={(e) => {
                setRegistrationOpenAtInput(formatDateTimeTyping(e.target.value));
                if (registrationOpenAtError) setRegistrationOpenAtError(null);
              }}
              onBlur={() => {
                if (!registrationOpenAtInput.trim()) {
                  setRegistrationOpenAtError(null);
                  return;
                }
                const iso = fromUiDateTimeInput(registrationOpenAtInput);
                if (!iso) {
                  setRegistrationOpenAtError(t('tournaments.editRegOpenInvalid'));
                  return;
                }
                const minOpenAt = Date.now() + 24 * 60 * 60 * 1000;
                if (new Date(iso).getTime() < minOpenAt) {
                  setRegistrationOpenAtError(t('tournaments.editRegOpenTooSoon'));
                  return;
                }
                setRegistrationOpenAtError(null);
              }}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('tournaments.editDateTimeFormatHint')}</p>
            {registrationOpenAtError ? (
              <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{registrationOpenAtError}</p>
            ) : null}
          </div>
          <div>
            <label className={labelClass} htmlFor="edit-reg-close-at">
              {t('tournaments.editRegCloseLabel')}
            </label>
            <input
              id="edit-reg-close-at"
              className={inputClass + (registrationCloseAtError ? ' border-red-500/80' : '')}
              type="text"
              inputMode="numeric"
              placeholder="2026-05-02 18:30"
              value={registrationCloseAtInput}
              onChange={(e) => {
                setRegistrationCloseAtInput(formatDateTimeTyping(e.target.value));
                if (registrationCloseAtError) setRegistrationCloseAtError(null);
              }}
              onBlur={() => {
                if (!registrationCloseAtInput.trim()) {
                  setRegistrationCloseAtError(null);
                  return;
                }
                const closeIso = fromUiDateTimeInput(registrationCloseAtInput);
                if (!closeIso) {
                  setRegistrationCloseAtError(t('tournaments.editRegCloseInvalid'));
                  return;
                }
                const openIso = fromUiDateTimeInput(registrationOpenAtInput);
                if (openIso && new Date(closeIso) < new Date(openIso)) {
                  setRegistrationCloseAtError(t('tournaments.editRegRangeInvalid'));
                  return;
                }
                setRegistrationCloseAtError(null);
              }}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('tournaments.editDateTimeFormatHint')}</p>
            {registrationCloseAtError ? (
              <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{registrationCloseAtError}</p>
            ) : null}
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="edit-draw-at">
            {t('tournaments.editDrawLabel')}
          </label>
          <input
            id="edit-draw-at"
            className={inputClass + (drawAtError ? ' border-red-500/80' : '')}
            type="text"
            inputMode="numeric"
            placeholder="2026-05-02 19:00"
            value={drawAtInput}
            onChange={(e) => {
              setDrawAtInput(formatDateTimeTyping(e.target.value));
              if (drawAtError) setDrawAtError(null);
            }}
            onBlur={() => {
              if (!drawAtInput.trim()) {
                setDrawAtError(null);
                return;
              }
              const dIso = fromUiDateTimeInput(drawAtInput);
              if (!dIso) {
                setDrawAtError(t('tournaments.editDrawInvalid'));
                return;
              }
              const closeIso = fromUiDateTimeInput(registrationCloseAtInput);
              if (closeIso && new Date(dIso) <= new Date(closeIso)) {
                setDrawAtError(t('tournaments.editDrawAfterRegClose'));
                return;
              }
              setDrawAtError(null);
            }}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('tournaments.editDateTimeFormatHint')}</p>
          {drawAtError ? (
            <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{drawAtError}</p>
          ) : null}
        </div>
        <div>
          <label className={labelClass} htmlFor="edit-start-at">
            {t('tournaments.editStartLabel')}
          </label>
          <input
            id="edit-start-at"
            className={inputClass + (startAtError ? ' border-red-500/80' : '')}
            type="text"
            inputMode="numeric"
            placeholder="2026-05-03 19:00"
            value={startAtInput}
            onChange={(e) => {
              setStartAtInput(formatDateTimeTyping(e.target.value));
              if (startAtError) setStartAtError(null);
            }}
            onBlur={() => {
              if (!startAtInput.trim()) {
                setStartAtError(null);
                return;
              }
              const sIso = fromUiDateTimeInput(startAtInput);
              if (!sIso) {
                setStartAtError(t('tournaments.editStartInvalid'));
                return;
              }
              const dIso = fromUiDateTimeInput(drawAtInput);
              if (dIso) {
                const minStartAt = new Date(new Date(dIso).getTime() + 24 * 60 * 60 * 1000);
                if (new Date(sIso) < minStartAt) {
                  setStartAtError(t('tournaments.editStartAfterDraw'));
                  return;
                }
              }
              setStartAtError(null);
            }}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('tournaments.editDateTimeFormatHint')}</p>
          {startAtError ? (
            <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{startAtError}</p>
          ) : null}
        </div>
        <div>
          <label className={labelClass}>{t('tournaments.editStatusLabel')}</label>
          {detail.status === 'REGISTRATION_OPEN' || detail.status === 'REGISTRATION_CLOSED' ? (
            <>
              <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label={t('tournaments.editStatusLabel')}>
                {(['REGISTRATION_OPEN', 'REGISTRATION_CLOSED'] as const).map((s) => {
                  const selected = status === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setStatus(s)}
                      className={
                        selected
                          ? primaryButtonClass + ' px-4 py-2.5 text-sm'
                          : ghostButtonClass +
                            ' rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-white/15'
                      }
                    >
                      {s === 'REGISTRATION_OPEN'
                        ? t('tournaments.statusRegistrationOpen')
                        : t('tournaments.statusRegistrationClosed')}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('tournaments.editStatusHelp')}</p>
            </>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('tournaments.editStatusLocked', { status: detail.status })}
            </p>
          )}
        </div>
        {detail.bigTournament ? (
          <div className="rounded-2xl border border-emerald-300/60 bg-emerald-50/70 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/20">
            <h3 className="mb-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              {t('tournaments.bigControlTitle')}
            </h3>
            <p className="mb-3 text-xs text-emerald-700/90 dark:text-emerald-300/90">
              {t('tournaments.bigControlHint', {
                golden: selectedGoldenTeamIds.length,
                nonGolden: nonGoldenSeedIds.length,
              })}
            </p>
            <div className="mb-3 grid gap-2 sm:grid-cols-2">
              <div>
                <label className={labelClass}>{t('tournaments.bigStartBoLabel')}</label>
                <input
                  className={inputClass}
                  type="text"
                  inputMode="numeric"
                  value={startQualBoInput}
                  onChange={(e) => setStartQualBoInput(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>{t('tournaments.bigNextBoLabel')}</label>
                <input
                  className={inputClass}
                  type="text"
                  inputMode="numeric"
                  value={nextRoundBoInput}
                  onChange={(e) => setNextRoundBoInput(e.target.value)}
                />
              </div>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              <button type="button" onClick={onStartQualifiers} disabled={bigControlSaving} className={primaryButtonClass}>
                {t('tournaments.bigStartQualifiers')}
              </button>
              <button
                type="button"
                onClick={onCreateNextRound}
                disabled={bigControlSaving}
                className={ghostButtonClass + ' rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-white/15'}
              >
                {t('tournaments.bigCreateNextRound')}
              </button>
            </div>
            <div className="mb-3 rounded-xl border border-slate-200/80 p-3 dark:border-white/10">
              <label className={labelClass}>{t('tournaments.bigInviteLabel')}</label>
              <textarea
                className={inputClass + ' min-h-[92px]'}
                value={invitedTeamsInput}
                onChange={(e) => setInvitedTeamsInput(e.target.value)}
                placeholder={t('tournaments.bigInvitePlaceholder')}
              />
              <button type="button" onClick={onInviteTeams} disabled={bigControlSaving} className={primaryButtonClass + ' mt-2'}>
                {t('tournaments.bigInviteSubmit')}
              </button>
            </div>
            <div className="space-y-2">
              {detail.teams.map((tm) => (
                <label
                  key={tm.id}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white/60 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5"
                >
                  <span>
                    {tm.teamName}
                    {tm.isInvited ? (
                      <span className="ml-2 rounded-md border border-amber-300/60 bg-amber-100/70 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/25 dark:text-amber-300">
                        {t('tournaments.bigInvitedBadge')}
                      </span>
                    ) : null}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{t('tournaments.bigGoldenToggle')}</span>
                    <input type="checkbox" checked={selectedGoldenSet.has(tm.id)} onChange={() => toggleGolden(tm.id)} />
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200/80 pt-4 dark:border-white/10">
          <Link to={`/tournaments/${id}`} className={ghostButtonClass}>
            {t('tournaments.cancel')}
          </Link>
          <button type="submit" disabled={saving} className={primaryButtonClass}>
            {saving ? t('tournaments.saving') : t('tournaments.editSave')}
          </button>
        </div>
      </form>
    </BrandLayout>
  );
}
