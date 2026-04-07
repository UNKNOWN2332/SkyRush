import type { TournamentStageDto } from './tournamentsService';

/** Mobile Legends M World uslubi: 8×4 guruh BO2 → g‘oliblar 16→8→4→2, pastki setka + grand final (andoza). */
export function mworld32Preset(): { maxTeams: number; stages: TournamentStageDto[] } {
  const g = { groupCount: null as number | null, teamsPerGroup: null as number | null, advancePerGroup: null as number | null };
  return {
    maxTeams: 32,
    stages: [
      {
        sortOrder: 1,
        bracketTrack: 'MAIN',
        phaseKind: 'GROUP_ROUND_ROBIN',
        label: '',
        bestOf: 2,
        teamsAtStart: 32,
        groupCount: 8,
        teamsPerGroup: 4,
        advancePerGroup: 2,
      },
      { sortOrder: 1, bracketTrack: 'WINNERS', phaseKind: 'ELIMINATION', label: 'Winners R16', bestOf: 3, teamsAtStart: 16, ...g },
      { sortOrder: 2, bracketTrack: 'WINNERS', phaseKind: 'ELIMINATION', label: 'Winners R8', bestOf: 3, teamsAtStart: 8, ...g },
      { sortOrder: 3, bracketTrack: 'WINNERS', phaseKind: 'ELIMINATION', label: 'Winners R4', bestOf: 5, teamsAtStart: 4, ...g },
      { sortOrder: 4, bracketTrack: 'WINNERS', phaseKind: 'ELIMINATION', label: 'Winners bracket final', bestOf: 7, teamsAtStart: 2, ...g },
      { sortOrder: 1, bracketTrack: 'LOSERS', phaseKind: 'ELIMINATION', label: 'Losers early', bestOf: 3, teamsAtStart: 16, ...g },
      { sortOrder: 2, bracketTrack: 'LOSERS', phaseKind: 'ELIMINATION', label: 'Losers R8', bestOf: 3, teamsAtStart: 8, ...g },
      { sortOrder: 3, bracketTrack: 'LOSERS', phaseKind: 'ELIMINATION', label: 'Losers R4', bestOf: 5, teamsAtStart: 4, ...g },
      { sortOrder: 4, bracketTrack: 'LOSERS', phaseKind: 'ELIMINATION', label: 'Losers bracket final', bestOf: 5, teamsAtStart: 2, ...g },
      { sortOrder: 1, bracketTrack: 'GRAND_FINAL', phaseKind: 'ELIMINATION', label: 'Grand final', bestOf: 7, teamsAtStart: 2, ...g },
    ],
  };
}
