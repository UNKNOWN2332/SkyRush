import axios from 'axios';
import { v1Client } from './client';

export type TournamentFormatRuleDto = {
  minTeams: number;
  bestOf: number;
};

export type TournamentStageDto = {
  sortOrder: number;
  bracketTrack: string;
  phaseKind: string;
  label: string;
  bestOf: number;
  teamsAtStart: number;
  groupCount: number | null;
  teamsPerGroup: number | null;
  advancePerGroup: number | null;
};

export type TournamentSummaryDto = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  maxTeams: number;
  teamCount: number;
  bestOf: number;
  phasedFormat: boolean;
  hasCustomStages: boolean;
  /** SMALL | MEDIUM | BIG */
  tournamentScale: string;
  bigTournament: boolean;
  rosterSize: number;
  gameCode: string;
  registrationOpenAt: string | null;
  registrationCloseAt: string | null;
  drawAt: string | null;
  startAt: string | null;
  organizerUsername: string;
  createdAt: string | null;
};

export type TournamentMemberDto = {
  nickname: string;
  gamePlayerId: string;
  isCaptain: boolean;
};

export type TournamentTeamDto = {
  id: number;
  teamName: string;
  captainUsername: string;
  isInvited: boolean;
  members: TournamentMemberDto[];
};

export type TournamentDetailDto = TournamentSummaryDto & {
  formatRules: TournamentFormatRuleDto[];
  stages: TournamentStageDto[];
  teams: TournamentTeamDto[];
};

const publicV1 = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api'}/v1`,
});

/** API `.../api` dan server ildizini olib, WebSocket uchun `ws(s)://host/ws/tournaments` quradi */
export function tournamentsWebSocketUrl(): string {
  const api = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api';
  const root = api.replace(/\/api\/?$/i, '') || 'http://localhost:8080';
  try {
    const u = new URL(root);
    u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
    u.pathname = '/ws/tournaments';
    u.search = '';
    return u.href;
  } catch {
    return 'ws://localhost:8080/ws/tournaments';
  }
}

function normalizeSummaryRow(row: TournamentSummaryDto): TournamentSummaryDto {
  return {
    ...row,
    phasedFormat: Boolean(row.phasedFormat),
    hasCustomStages: Boolean(row.hasCustomStages),
    bigTournament: Boolean(row.bigTournament),
    tournamentScale: row.tournamentScale ?? 'MEDIUM',
    registrationOpenAt: row.registrationOpenAt ?? null,
    registrationCloseAt: row.registrationCloseAt ?? null,
    drawAt: row.drawAt ?? null,
    startAt: row.startAt ?? null,
  };
}

export const tournamentsService = {
  list: async (): Promise<TournamentSummaryDto[]> => {
    const { data } = await publicV1.get<TournamentSummaryDto[]>('/tournaments');
    const arr = Array.isArray(data) ? data : [];
    return arr.map(normalizeSummaryRow);
  },

  listMyOrganized: async (): Promise<TournamentSummaryDto[]> => {
    const { data } = await v1Client.get<TournamentSummaryDto[]>('/me/tournaments/organized');
    const arr = Array.isArray(data) ? data : [];
    return arr.map(normalizeSummaryRow);
  },

  listMyCaptain: async (): Promise<TournamentSummaryDto[]> => {
    const { data } = await v1Client.get<TournamentSummaryDto[]>('/me/tournaments/captain');
    const arr = Array.isArray(data) ? data : [];
    return arr.map(normalizeSummaryRow);
  },

  get: async (id: number): Promise<TournamentDetailDto> => {
    const { data } = await publicV1.get<TournamentDetailDto>(`/tournaments/${id}`);
    return {
      ...data,
      phasedFormat: Boolean(data.phasedFormat),
      hasCustomStages: Boolean(data.hasCustomStages),
      bigTournament: Boolean(data.bigTournament),
      tournamentScale: data.tournamentScale ?? 'MEDIUM',
      formatRules: Array.isArray(data.formatRules) ? data.formatRules : [],
      stages: Array.isArray(data.stages) ? data.stages : [],
      teams: Array.isArray(data.teams) ? data.teams : [],
    };
  },

  update: async (
    id: number,
    payload: {
      title?: string | null;
      description?: string | null;
      status?: string | null;
      maxTeams?: number | null;
      registrationOpenAt?: string | null;
      registrationCloseAt?: string | null;
      drawAt?: string | null;
      startAt?: string | null;
    },
  ): Promise<TournamentSummaryDto> => {
    const { data } = await v1Client.patch<TournamentSummaryDto>(`/tournaments/${id}`, payload);
    return normalizeSummaryRow(data);
  },

  create: async (payload: {
    title: string;
    description?: string | null;
    maxTeams: number;
    bestOf: number;
    rosterSize: number;
    gameCode?: string | null;
    tournamentScale: string;
    formatRules?: TournamentFormatRuleDto[] | null;
    stages?: TournamentStageDto[] | null;
  }): Promise<TournamentSummaryDto> => {
    const { data } = await v1Client.post<TournamentSummaryDto>('/tournaments', payload);
    return data;
  },

  registerTeam: async (
    tournamentId: number,
    payload: { teamName: string; members: TournamentMemberDto[] },
  ): Promise<TournamentTeamDto> => {
    const { data } = await v1Client.post<TournamentTeamDto>(`/tournaments/${tournamentId}/teams`, payload);
    return data;
  },

  markGoldenTeams: async (tournamentId: number, teamIds: number[]): Promise<void> => {
    await v1Client.post(`/tournaments/${tournamentId}/big/golden-teams`, { teamIds });
  },

  startBigQualifiers: async (
    tournamentId: number,
    payload: { orderedNonGoldenSeeds: number[]; bestOf: number },
  ): Promise<void> => {
    await v1Client.post(`/tournaments/${tournamentId}/big/qualifiers/start`, payload);
  },

  createNextBigQualifierRound: async (tournamentId: number, bestOf: number): Promise<void> => {
    await v1Client.post(`/tournaments/${tournamentId}/big/qualifiers/next-round`, { bestOf });
  },

  recordBigMatchGame: async (tournamentId: number, matchId: number, winnerTeamId: number): Promise<void> => {
    await v1Client.post(`/tournaments/${tournamentId}/big/matches/${matchId}/games`, { winnerTeamId });
  },

  inviteTeams: async (tournamentId: number, teamNames: string[]): Promise<TournamentTeamDto[]> => {
    const { data } = await v1Client.post<TournamentTeamDto[]>(`/tournaments/${tournamentId}/teams/invited`, { teamNames });
    return Array.isArray(data) ? data : [];
  },
};
