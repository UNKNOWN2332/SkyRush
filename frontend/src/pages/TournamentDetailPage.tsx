import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { tournamentsService, type TournamentDetailDto, type TournamentMemberDto } from '../api/tournamentsService';
import { getStoredUser, isAuthenticated } from '../api/authService';
import { BrandLayout, ghostButtonClass, glassCardClass, inputClass, labelClass, primaryButtonClass } from '../components/BrandLayout';

function winsToWin(bestOf: number): number {
  return bestOf === 2 ? 2 : Math.floor((bestOf + 1) / 2);
}

function bracketTrackLabel(track: string, t: (k: string) => string): string {
  switch (track) {
    case 'MAIN':
      return t('tournaments.trackMain');
    case 'WINNERS':
      return t('tournaments.trackWinners');
    case 'LOSERS':
      return t('tournaments.trackLosers');
    case 'GRAND_FINAL':
      return t('tournaments.trackGrandFinal');
    default:
      return track;
  }
}

function phaseKindLabel(kind: string, t: (k: string) => string): string {
  if (kind === 'GROUP_ROUND_ROBIN') return t('tournaments.phaseGroups');
  if (kind === 'ELIMINATION') return t('tournaments.phaseElim');
  return kind;
}

function emptyRoster(size: number): TournamentMemberDto[] {
  return Array.from({ length: size }, (_, i) => ({
    nickname: '',
    gamePlayerId: '',
    isCaptain: i === 0,
  }));
}

export function TournamentDetailPage() {
  const { t } = useTranslation();
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const id = Number(idParam);
  const [detail, setDetail] = useState<TournamentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bigControlSaving, setBigControlSaving] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<TournamentMemberDto[]>([]);
  const [selectedGoldenTeamIds, setSelectedGoldenTeamIds] = useState<number[]>([]);
  const [startQualBoInput, setStartQualBoInput] = useState('1');
  const [nextRoundBoInput, setNextRoundBoInput] = useState('1');

  const load = useCallback(async () => {
    if (!Number.isFinite(id) || id < 1) {
      setDetail(null);
      setLoading(false);
      return;
    }
    try {
      const d = await tournamentsService.get(id);
      setDetail(d);
      setMembers(emptyRoster(d.rosterSize));
      setSelectedGoldenTeamIds([]);
    } catch {
      toast.error(t('tournaments.toastDetailError'));
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const canRegister = useMemo(() => {
    if (!detail || detail.status !== 'REGISTRATION_OPEN') return false;
    if (detail.teamCount >= detail.maxTeams) return false;
    return true;
  }, [detail]);
  const isOrganizer = Boolean(detail && getStoredUser()?.username === detail.organizerUsername);

  const selectedGoldenSet = useMemo(() => new Set(selectedGoldenTeamIds), [selectedGoldenTeamIds]);
  const nonGoldenSeedIds = useMemo(() => {
    if (!detail) return [];
    return detail.teams
      .map((tm) => tm.id)
      .filter((teamId) => !selectedGoldenSet.has(teamId))
      .sort((a, b) => a - b);
  }, [detail, selectedGoldenSet]);

  function setMember(i: number, patch: Partial<TournamentMemberDto>) {
    setMembers((prev) => prev.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  }

  function setCaptain(i: number) {
    setMembers((prev) => prev.map((m, j) => ({ ...m, isCaptain: j === i })));
  }

  async function onRegister(e: FormEvent) {
    e.preventDefault();
    if (!detail || !canRegister) return;
    if (!isAuthenticated()) {
      toast.error(t('tournaments.toastNeedLogin'));
      navigate('/login');
      return;
    }
    const name = teamName.trim();
    if (name.length < 2) {
      toast.error(t('tournaments.toastTeamNameShort'));
      return;
    }
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.nickname.trim() || !m.gamePlayerId.trim()) {
        toast.error(t('tournaments.toastMemberIncomplete', { row: i + 1 }));
        return;
      }
    }
    if (members.filter((m) => m.isCaptain).length !== 1) {
      toast.error(t('tournaments.toastOneCaptain'));
      return;
    }
    setSaving(true);
    try {
      await tournamentsService.registerTeam(detail.id, { teamName: name, members });
      toast.success(t('tournaments.toastRegistered'));
      setTeamName('');
      setMembers(emptyRoster(detail.rosterSize));
      await load();
    } catch {
      toast.error(t('tournaments.toastRegisterError'));
    } finally {
      setSaving(false);
    }
  }

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

  if (!Number.isFinite(id) || id < 1) {
    return (
      <BrandLayout title={t('tournaments.badIdTitle')}>
        <p className="mb-4 text-slate-600 dark:text-slate-300">{t('tournaments.badIdBody')}</p>
        <Link to="/tournaments" className={ghostButtonClass}>
          {t('tournaments.backList')}
        </Link>
      </BrandLayout>
    );
  }

  return (
    <BrandLayout
      title={detail?.title ?? t('tournaments.detailLoadingTitle')}
      subtitle={detail ? t('tournaments.detailSubtitle', { status: detail.status }) : undefined}
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link to="/tournaments" className={ghostButtonClass + ' inline-flex text-sm'}>
          {t('tournaments.backList')}
        </Link>
        {!loading && detail && isOrganizer ? (
          <Link to={`/tournaments/${id}/edit`} className={primaryButtonClass + ' inline-flex px-4 py-2 text-sm'}>
            {t('tournaments.edit')}
          </Link>
        ) : null}
      </div>

      {loading ? (
        <p className="text-slate-500">{t('tournaments.loading')}</p>
      ) : !detail ? (
        <p className="text-slate-500">{t('tournaments.notFound')}</p>
      ) : (
        <>
          {detail.hasCustomStages && detail.stages.length > 0 ? (
            <section className={`${glassCardClass} mb-8`}>
              <h2 className="mb-2 text-lg font-semibold">{t('tournaments.stagesTitle')}</h2>
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{t('tournaments.stagesIntro')}</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-white/10">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead className="border-b border-slate-200/80 bg-slate-50/80 dark:border-white/10 dark:bg-white/5">
                    <tr>
                      <th className="p-3 font-semibold">{t('tournaments.stageColTrack')}</th>
                      <th className="p-3 font-semibold">{t('tournaments.stageColOrder')}</th>
                      <th className="p-3 font-semibold">{t('tournaments.stageColPhase')}</th>
                      <th className="p-3 font-semibold">{t('tournaments.stageColBo')}</th>
                      <th className="p-3 font-semibold">{t('tournaments.stageColTeams')}</th>
                      <th className="p-3 font-semibold">{t('tournaments.stageColExtra')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.stages.map((s, idx) => (
                      <tr
                        key={`${s.bracketTrack}-${s.sortOrder}-${idx}`}
                        className="border-b border-slate-100 dark:border-white/5"
                      >
                        <td className="p-3">{bracketTrackLabel(s.bracketTrack, t)}</td>
                        <td className="p-3">{s.sortOrder}</td>
                        <td className="p-3">{phaseKindLabel(s.phaseKind, t)}</td>
                        <td className="p-3">BO{s.bestOf}</td>
                        <td className="p-3">{s.teamsAtStart}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {s.groupCount != null && s.teamsPerGroup != null && s.advancePerGroup != null
                            ? t('tournaments.stageGroupsMeta', {
                                g: s.groupCount,
                                tpg: s.teamsPerGroup,
                                apg: s.advancePerGroup,
                              })
                            : s.label || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <section className={`${glassCardClass} mb-8`}>
            <h2 className="mb-2 text-lg font-semibold">{t('tournaments.rulesTitle')}</h2>
            <ul className="list-inside list-disc text-sm text-slate-600 dark:text-slate-300">
              <li>
                {detail.bigTournament
                  ? t('tournaments.ruleScaleBig')
                  : (detail.tournamentScale ?? 'MEDIUM') === 'SMALL'
                    ? t('tournaments.ruleScaleSmall')
                    : t('tournaments.ruleScaleMedium')}
              </li>
              {!detail.hasCustomStages && detail.phasedFormat && detail.formatRules.length > 0 ? (
                <>
                  <li className="mb-2 list-none font-medium text-emerald-700 dark:text-emerald-300">
                    {t('tournaments.formatPhasedIntro')}
                  </li>
                  {[...detail.formatRules]
                    .sort((a, b) => b.minTeams - a.minTeams)
                    .map((r) => (
                      <li key={r.minTeams}>
                        {t('tournaments.formatRuleRow', { min: r.minTeams, bo: r.bestOf })}
                      </li>
                    ))}
                </>
              ) : !detail.hasCustomStages ? (
                <li>
                  {t('tournaments.ruleBestOf', {
                    n: detail.bestOf,
                    wins: winsToWin(detail.bestOf),
                  })}
                </li>
              ) : (
                <li className="list-none text-slate-500 dark:text-slate-400">{t('tournaments.rulesSeeStages')}</li>
              )}
              <li>{t('tournaments.ruleRoster', { n: detail.rosterSize })}</li>
              <li>{t('tournaments.ruleGame', { code: detail.gameCode })}</li>
              <li>{t('tournaments.ruleOrganizer', { name: detail.organizerUsername })}</li>
            </ul>
            {detail.description ? (
              <p className="mt-4 whitespace-pre-wrap text-slate-700 dark:text-slate-200">{detail.description}</p>
            ) : null}
          </section>

          <section className={glassCardClass + ' mb-8'}>
            <h2 className="mb-4 text-lg font-semibold">{t('tournaments.teamsTitle')}</h2>
            {detail.bigTournament && isOrganizer ? (
              <div className="mb-4 rounded-2xl border border-emerald-300/60 bg-emerald-50/70 p-4 dark:border-emerald-500/30 dark:bg-emerald-950/20">
                <h3 className="mb-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  {t('tournaments.bigControlTitle')}
                </h3>
                <p className="mb-3 text-xs text-emerald-700/90 dark:text-emerald-300/90">
                  {t('tournaments.bigControlHint', {
                    golden: selectedGoldenTeamIds.length,
                    nonGolden: nonGoldenSeedIds.length,
                  })}
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200/80 p-3 dark:border-white/10">
                    <label className={labelClass}>{t('tournaments.bigStartBoLabel')}</label>
                    <input
                      className={inputClass}
                      type="text"
                      inputMode="numeric"
                      value={startQualBoInput}
                      onChange={(e) => setStartQualBoInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className={primaryButtonClass + ' mt-2 w-full'}
                      onClick={onStartQualifiers}
                      disabled={bigControlSaving}
                    >
                      {t('tournaments.bigStartQualifiers')}
                    </button>
                  </div>
                  <div className="rounded-xl border border-slate-200/80 p-3 dark:border-white/10">
                    <label className={labelClass}>{t('tournaments.bigNextBoLabel')}</label>
                    <input
                      className={inputClass}
                      type="text"
                      inputMode="numeric"
                      value={nextRoundBoInput}
                      onChange={(e) => setNextRoundBoInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className={ghostButtonClass + ' mt-2 w-full'}
                      onClick={onCreateNextRound}
                      disabled={bigControlSaving}
                    >
                      {t('tournaments.bigCreateNextRound')}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
            {detail.teams.length === 0 ? (
              <p className="text-slate-500">{t('tournaments.noTeams')}</p>
            ) : (
              <ul className="space-y-4">
                {detail.teams.map((team) => (
                  <li key={team.id} className="rounded-2xl border border-slate-200/80 p-4 dark:border-white/10">
                    <p className="flex flex-wrap items-center justify-between gap-2 font-semibold">
                      <span>
                        {team.teamName}{' '}
                      <span className="text-sm font-normal text-slate-500">
                        ({t('tournaments.captainLabel')}: {team.captainUsername})
                      </span>
                      </span>
                      {detail.bigTournament && isOrganizer ? (
                        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={selectedGoldenSet.has(team.id)}
                            onChange={() => toggleGolden(team.id)}
                          />
                          {t('tournaments.bigGoldenToggle')}
                        </label>
                      ) : null}
                    </p>
                    <ul className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {team.members.map((m, idx) => (
                        <li key={`${team.id}-${idx}`}>
                          {m.nickname} — ID: {m.gamePlayerId}
                          {m.isCaptain ? ` (${t('tournaments.captainBadge')})` : ''}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {canRegister && isAuthenticated() ? (
            <section className={glassCardClass}>
              <h2 className="mb-4 text-lg font-semibold">{t('tournaments.registerTitle')}</h2>
              <form onSubmit={onRegister} className="space-y-4">
                <div>
                  <label className={labelClass}>{t('tournaments.fieldTeamName')}</label>
                  <input
                    className={inputClass}
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                    maxLength={120}
                  />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('tournaments.registerHint')}</p>
                <div className="space-y-3">
                  {members.map((m, i) => (
                    <div
                      key={i}
                      className="grid gap-2 rounded-xl border border-slate-200/80 p-3 dark:border-white/10 sm:grid-cols-[1fr_1fr_auto]"
                    >
                      <div>
                        <label className={labelClass}>{t('tournaments.memberNickname', { n: i + 1 })}</label>
                        <input
                          className={inputClass}
                          value={m.nickname}
                          onChange={(e) => setMember(i, { nickname: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t('tournaments.memberGameId', { n: i + 1 })}</label>
                        <input
                          className={inputClass}
                          value={m.gamePlayerId}
                          onChange={(e) => setMember(i, { gamePlayerId: e.target.value })}
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <input type="radio" name="captain" checked={m.isCaptain} onChange={() => setCaptain(i)} />
                          {t('tournaments.captainRadio')}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="submit" disabled={saving} className={primaryButtonClass}>
                  {saving ? t('tournaments.saving') : t('tournaments.submitRegister')}
                </button>
              </form>
            </section>
          ) : canRegister ? (
            <section className={glassCardClass}>
              <p className="mb-3 text-slate-600 dark:text-slate-300">{t('tournaments.loginToJoin')}</p>
              <Link to="/login" className={primaryButtonClass + ' inline-flex text-sm'}>
                {t('tournaments.goLogin')}
              </Link>
            </section>
          ) : (
            <section className={glassCardClass}>
              <p className="text-slate-600 dark:text-slate-300">{t('tournaments.registrationClosed')}</p>
            </section>
          )}
        </>
      )}
    </BrandLayout>
  );
}
