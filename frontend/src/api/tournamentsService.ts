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
  rosterSize: number;
  gameCode: string;
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

export const tournamentsService = {
  list: async (): Promise<TournamentSummaryDto[]> => {
    const { data } = await publicV1.get<TournamentSummaryDto[]>('/tournaments');
    const arr = Array.isArray(data) ? data : [];
    return arr.map((row) => ({
      ...row,
      phasedFormat: Boolean(row.phasedFormat),
      hasCustomStages: Boolean(row.hasCustomStages),
    }));
  },

  get: async (id: number): Promise<TournamentDetailDto> => {
    const { data } = await publicV1.get<TournamentDetailDto>(`/tournaments/${id}`);
    return {
      ...data,
      phasedFormat: Boolean(data.phasedFormat),
      hasCustomStages: Boolean(data.hasCustomStages),
      formatRules: Array.isArray(data.formatRules) ? data.formatRules : [],
      stages: Array.isArray(data.stages) ? data.stages : [],
      teams: Array.isArray(data.teams) ? data.teams : [],
    };
  },

  create: async (payload: {
    title: string;
    description?: string | null;
    maxTeams: number;
    bestOf: number;
    rosterSize: number;
    gameCode?: string | null;
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
};
