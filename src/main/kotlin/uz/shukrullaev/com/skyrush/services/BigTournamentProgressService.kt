package uz.shukrullaev.com.skyrush.services

import kotlinx.coroutines.flow.toList
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import uz.shukrullaev.com.skyrush.entities.Tournament
import uz.shukrullaev.com.skyrush.entities.TournamentGroupAssignment
import uz.shukrullaev.com.skyrush.entities.TournamentMatch
import uz.shukrullaev.com.skyrush.entities.TournamentMatchGame
import uz.shukrullaev.com.skyrush.repositories.TournamentGroupAssignmentRepository
import uz.shukrullaev.com.skyrush.repositories.TournamentMatchGameRepository
import uz.shukrullaev.com.skyrush.repositories.TournamentMatchRepository
import uz.shukrullaev.com.skyrush.repositories.TournamentRepository
import uz.shukrullaev.com.skyrush.repositories.TournamentTeamRepository
import uz.shukrullaev.com.skyrush.tournament.BigTournamentMatchStatuses
import uz.shukrullaev.com.skyrush.tournament.BigTournamentPhase
import uz.shukrullaev.com.skyrush.tournament.BigTournamentRules
import uz.shukrullaev.com.skyrush.tournament.BracketMatchDraft
import uz.shukrullaev.com.skyrush.tournament.BracketSlot
import uz.shukrullaev.com.skyrush.tournament.DoubleElimPowerOfTwoPlanner
import uz.shukrullaev.com.skyrush.tournament.GroupRoundRobinPlanner
import uz.shukrullaev.com.skyrush.tournament.QualifierKnockoutPlanner
import uz.shukrullaev.com.skyrush.tournament.TournamentEventHub
import uz.shukrullaev.com.skyrush.tournament.TournamentFormats

@Service
class BigTournamentProgressService(
    private val tournamentRepository: TournamentRepository,
    private val teamRepository: TournamentTeamRepository,
    private val matchRepository: TournamentMatchRepository,
    private val gameRepository: TournamentMatchGameRepository,
    private val groupAssignmentRepository: TournamentGroupAssignmentRepository,
    private val eventHub: TournamentEventHub,
) {

    suspend fun markGoldenTeams(tournamentId: Long, teamIds: Set<Long>) {
        val t = tournamentRepository.findById(tournamentId) ?: throw notFound()
        if (!t.bigTournament) badRequest("not a big tournament")
        val teams = teamRepository.findByTournamentId(tournamentId).toList()
        val idSet = teams.map { it.id!! }.toSet()
        if (!teamIds.all { it in idSet }) badRequest("teamIds must belong to tournament")
        if (teamIds.size >= BigTournamentRules.TOP32_SLOTS) {
            badRequest("golden team count must be less than ${BigTournamentRules.TOP32_SLOTS}")
        }
        for (team in teams) {
            val golden = team.id!! in teamIds
            if (team.isGolden != golden) {
                teamRepository.save(team.copy(isGolden = golden))
            }
        }
        eventHub.notifyTournamentsChanged()
    }

    /**
     * Birinchi kval raundi (BO1, BYE bilan). Keyingi raundlar o‘yin tugagach yaratiladi.
     * [orderedNonGoldenSeeds] — kuchliroq birinchi (tengda kichik team id).
     */
    suspend fun startQualifiers(tournamentId: Long, orderedNonGoldenSeeds: List<Long>, bestOf: Int) {
        val t = tournamentRepository.findById(tournamentId) ?: throw notFound()
        if (!t.bigTournament) badRequest("not a big tournament")
        if (t.bigPhase != null && t.bigPhase != BigTournamentPhase.QUALIFIERS) {
            badRequest("qualifiers already progressed or completed")
        }
        val teams = teamRepository.findByTournamentId(tournamentId).toList()
        val nonGolden = teams.filter { !it.isGolden }
        val golden = teams.filter { it.isGolden }
        val qualifierSurvivorsTarget = BigTournamentRules.TOP32_SLOTS - golden.size
        if (qualifierSurvivorsTarget < 0) {
            badRequest("golden teams cannot exceed ${BigTournamentRules.TOP32_SLOTS}")
        }
        if (nonGolden.size < BigTournamentRules.MIN_QUALIFIER_POOL) {
            badRequest("qualifier pool must be at least ${BigTournamentRules.MIN_QUALIFIER_POOL} team")
        }
        if (nonGolden.size < qualifierSurvivorsTarget) {
            badRequest("not enough non-golden teams for top-32 slots")
        }
        if (bestOf !in TournamentFormats.ALLOWED_BEST_OF) {
            badRequest("bestOf must be one of ${TournamentFormats.ALLOWED_BEST_OF.joinToString(",")}")
        }
        val ids = nonGolden.map { it.id!! }.toSet()
        if (orderedNonGoldenSeeds.toSet() != ids) badRequest("seed list must match non-golden teams exactly")
        if (nonGolden.size == qualifierSurvivorsTarget) {
            seedGroupStage(tournamentId)
            return
        }
        val spec = QualifierKnockoutPlanner.firstRoundWithByes(orderedNonGoldenSeeds, qualifierSurvivorsTarget)
        val drafts = buildQualifierRoundDrafts(0, spec, bestOf)
        saveNewQualifierMatches(tournamentId, drafts)
        tournamentRepository.save(
            t.copy(
                bigPhase = BigTournamentPhase.QUALIFIERS,
                bigQualifierRound = 0,
                status = "IN_PROGRESS",
            ),
        )
        eventHub.notifyTournamentsChanged()
    }

    private fun buildQualifierRoundDrafts(
        nextRound: Int,
        spec: QualifierKnockoutPlanner.QualRoundSpec,
        bestOf: Int,
    ): List<BracketMatchDraft> {
        val out = ArrayList<BracketMatchDraft>()
        var idx = 0
        for (pair in spec.pairs) {
            val (sa, sb) = slotsFromNullablePair(pair.first, pair.second)
            out += BracketMatchDraft(
                key = "Q|$nextRound|$idx",
                phase = BigTournamentPhase.QUALIFIERS,
                bracketTrack = null,
                groupIndex = -1,
                roundIndex = nextRound,
                matchIndex = idx,
                bestOf = bestOf,
                slotA = sa,
                slotB = sb,
                winnerFeedsTo = null,
                loserFeedsTo = null,
                closesQualifierPhase = spec.closesQualifierPhase,
            )
            idx++
        }
        for (tid in spec.byeTeams) {
            out += BracketMatchDraft(
                key = "Q|$nextRound|$idx",
                phase = BigTournamentPhase.QUALIFIERS,
                bracketTrack = null,
                groupIndex = -1,
                roundIndex = nextRound,
                matchIndex = idx,
                bestOf = bestOf,
                slotA = BracketSlot.Team(tid),
                slotB = BracketSlot.Absent,
                winnerFeedsTo = null,
                loserFeedsTo = null,
                closesQualifierPhase = spec.closesQualifierPhase,
            )
            idx++
        }
        return out
    }

    suspend fun createNextQualifierRound(tournamentId: Long, bestOf: Int) {
        val t = tournamentRepository.findById(tournamentId) ?: throw notFound()
        if (!t.bigTournament) badRequest("not a big tournament")
        if (t.bigPhase != BigTournamentPhase.QUALIFIERS) badRequest("tournament is not in QUALIFIERS phase")
        if (bestOf !in TournamentFormats.ALLOWED_BEST_OF) {
            badRequest("bestOf must be one of ${TournamentFormats.ALLOWED_BEST_OF.joinToString(",")}")
        }
        val currentRound = t.bigQualifierRound
        if (currentRound < 0) badRequest("invalid current qualifier round")
        val roundMatches = matchRepository.findByTournamentIdAndPhase(tournamentId, BigTournamentPhase.QUALIFIERS).toList()
            .filter { it.roundIndex == currentRound }
        if (roundMatches.isEmpty()) badRequest("current qualifier round has no matches")
        if (roundMatches.any { it.status != BigTournamentMatchStatuses.COMPLETED }) {
            badRequest("current qualifier round is not finished")
        }
        if (roundMatches.any { it.closesQualifierPhase }) {
            seedGroupStage(tournamentId)
            return
        }
        val nextRound = currentRound + 1
        val alreadyExists = matchRepository.findByTournamentIdAndPhase(tournamentId, BigTournamentPhase.QUALIFIERS)
            .toList()
            .any { it.roundIndex == nextRound }
        if (alreadyExists) badRequest("next qualifier round already created")

        val winners = roundMatches.mapNotNull { it.winnerTeamId }.distinct().sorted()
        if (winners.size != roundMatches.size) badRequest("missing winners in qualifier round")
        val goldenCount = teamRepository.findByTournamentId(tournamentId).toList().count { it.isGolden }
        val qualifierSurvivorsTarget = BigTournamentRules.TOP32_SLOTS - goldenCount
        if (qualifierSurvivorsTarget < 0) badRequest("golden teams cannot exceed ${BigTournamentRules.TOP32_SLOTS}")
        val nextSpec = QualifierKnockoutPlanner.planRound(winners, qualifierSurvivorsTarget)
            ?: badRequest("cannot plan next qualifier round")
        val drafts = buildQualifierRoundDrafts(nextRound, nextSpec, bestOf)
        val idByKey = linkedMapOf<String, Long>()
        for (d in drafts) {
            val saved = matchRepository.save(draftToEntity(tournamentId, d))
            idByKey[d.key] = saved.id!!
        }
        val winnerToMatchId = roundMatches.mapNotNull { m ->
            m.winnerTeamId?.let { wid -> wid to m.id!! }
        }.toMap()
        for (mi in nextSpec.pairs.indices) {
            val (a, b) = nextSpec.pairs[mi]
            if (a == null || b == null) continue
            val destId = idByKey["Q|$nextRound|$mi"] ?: continue
            patchFeeds(winnerToMatchId.getValue(a), destId, 'A')
            patchFeeds(winnerToMatchId.getValue(b), destId, 'B')
        }
        tournamentRepository.save(t.copy(bigQualifierRound = nextRound))
        for (key in idByKey.keys) {
            val m = matchRepository.findById(idByKey[key]!!)!!
            if (m.status == BigTournamentMatchStatuses.COMPLETED) {
                propagateCompletedMatch(m)
            }
        }
        eventHub.notifyTournamentsChanged()
    }

    private fun slotsFromNullablePair(a: Long?, b: Long?): Pair<BracketSlot, BracketSlot> = when {
        a != null && b != null -> BracketSlot.Team(a) to BracketSlot.Team(b)
        a != null && b == null -> BracketSlot.Team(a) to BracketSlot.Absent
        b != null && a == null -> BracketSlot.Team(b) to BracketSlot.Absent
        else -> badRequest("invalid qualifier pair")
    }

    private suspend fun saveNewQualifierMatches(tournamentId: Long, drafts: List<BracketMatchDraft>) {
        val idByKey = linkedMapOf<String, Long>()
        for (d in drafts) {
            val saved = matchRepository.save(draftToEntity(tournamentId, d))
            idByKey[d.key] = saved.id!!
        }
        for (d in drafts) {
            val m = matchRepository.findById(idByKey[d.key]!!)!!
            if (m.status == BigTournamentMatchStatuses.COMPLETED) {
                propagateCompletedMatch(m)
            }
        }
    }

    suspend fun recordGameResult(tournamentId: Long, matchId: Long, winnerTeamId: Long) {
        val m = matchRepository.findById(matchId) ?: throw notFound()
        if (m.tournamentId != tournamentId) badRequest("match mismatch")
        if (m.status == BigTournamentMatchStatuses.COMPLETED) badRequest("match already completed")
        val a = m.teamAId
        val b = m.teamBId
        if (winnerTeamId != a && winnerTeamId != b) badRequest("winner must be a participant")
        val games = gameRepository.findByMatchIdOrderByGameNumberAsc(matchId).toList()
        val nextGame = (games.maxOfOrNull { it.gameNumber } ?: 0) + 1
        gameRepository.save(
            TournamentMatchGame(matchId = matchId, gameNumber = nextGame, winnerTeamId = winnerTeamId),
        )
        val gamesAfter = gameRepository.findByMatchIdOrderByGameNumberAsc(matchId).toList()
        val winsA = gamesAfter.count { it.winnerTeamId == a }
        val winsB = gamesAfter.count { it.winnerTeamId == b }
        val need = TournamentFormats.winsToWin(m.bestOf)
        when {
            winsA >= need && a != null -> finalizeMatch(m, a)
            winsB >= need && b != null -> finalizeMatch(m, b)
            else -> {
                if (m.status == BigTournamentMatchStatuses.SCHEDULED) {
                    matchRepository.save(m.copy(status = BigTournamentMatchStatuses.IN_PROGRESS))
                }
            }
        }
        eventHub.notifyTournamentsChanged()
    }

    private suspend fun finalizeMatch(m: TournamentMatch, winnerId: Long) {
        val done = matchRepository.save(
            m.copy(
                winnerTeamId = winnerId,
                status = BigTournamentMatchStatuses.COMPLETED,
            ),
        )
        propagateCompletedMatch(done)
        maybeScheduleGrandFinalReset(done)
        handlePhaseTransitions(done)
    }

    private suspend fun propagateCompletedMatch(m: TournamentMatch) {
        val wid = m.winnerTeamId ?: return
        applyTeamToFeedTarget(m.feedsWinnerToMatchId, m.feedsWinnerSlot, wid)
        val loserId = when {
            wid == m.teamAId -> m.teamBId
            wid == m.teamBId -> m.teamAId
            else -> null
        }
        if (loserId != null) {
            applyTeamToFeedTarget(m.feedsLoserToMatchId, m.feedsLoserSlot, loserId)
        }
    }

    private suspend fun applyTeamToFeedTarget(destId: Long?, slot: Char?, teamId: Long) {
        if (destId == null || slot == null) return
        val d = matchRepository.findById(destId) ?: return
        val updated = when (slot) {
            'A' -> d.copy(teamAId = teamId)
            'B' -> d.copy(teamBId = teamId)
            else -> return
        }
        val saved = matchRepository.save(updated)
        tryAutoCompleteBye(saved)
    }

    private suspend fun tryAutoCompleteBye(m: TournamentMatch) {
        val cur = matchRepository.findById(m.id!!) ?: return
        if (cur.status != BigTournamentMatchStatuses.SCHEDULED && cur.status != BigTournamentMatchStatuses.IN_PROGRESS) return
        val a = cur.teamAId
        val b = cur.teamBId
        when {
            a != null && b == null -> finalizeMatch(cur, a)
            b != null && a == null -> finalizeMatch(cur, b)
        }
    }

    private suspend fun handlePhaseTransitions(completed: TournamentMatch) {
        val tid = completed.tournamentId
        val t = tournamentRepository.findById(tid) ?: return
        when (completed.phase) {
            BigTournamentPhase.QUALIFIERS -> advanceQualifiersIfRoundComplete(t)
            BigTournamentPhase.GROUP_STAGE -> maybeFinishGroupStage(t)
            BigTournamentPhase.PLAYOFFS -> maybeFinishPlayoffs(t, completed)
        }
    }

    private suspend fun advanceQualifiersIfRoundComplete(t: Tournament) {
        if (t.bigPhase != BigTournamentPhase.QUALIFIERS) return
        val r = t.bigQualifierRound
        if (r < 0) return
        val roundMatches = matchRepository.findByTournamentIdAndPhase(t.id!!, BigTournamentPhase.QUALIFIERS).toList()
            .filter { it.roundIndex == r }
        if (roundMatches.isEmpty()) return
        if (roundMatches.any { it.status != BigTournamentMatchStatuses.COMPLETED }) return
        val closes = roundMatches.any { it.closesQualifierPhase }
        if (closes) {
            seedGroupStage(t.id!!)
            return
        }
        tournamentRepository.save(t.copy(bigQualifierRound = r + 1))
        eventHub.notifyTournamentsChanged()
    }

    private suspend fun patchFeeds(sourceId: Long, destId: Long, slot: Char) {
        val s = matchRepository.findById(sourceId) ?: return
        matchRepository.save(
            s.copy(
                feedsWinnerToMatchId = destId,
                feedsWinnerSlot = slot,
            ),
        )
    }

    private suspend fun seedGroupStage(tournamentId: Long) {
        val t = tournamentRepository.findById(tournamentId) ?: return
        val qMatches = matchRepository.findByTournamentIdAndPhase(tournamentId, BigTournamentPhase.QUALIFIERS).toList()
        val lastRound = qMatches.maxOfOrNull { it.roundIndex } ?: -1
        val finals = qMatches.filter { it.roundIndex == lastRound && it.status == BigTournamentMatchStatuses.COMPLETED }
        val qualWinners = finals.mapNotNull { it.winnerTeamId }.distinct().sorted()
        val golden = teamRepository.findByTournamentId(tournamentId).toList()
            .filter { it.isGolden }
            .sortedBy { it.id!! }
            .map { it.id!! }
        if (golden.size >= BigTournamentRules.TOP32_SLOTS) {
            badRequest("golden teams cannot exceed ${BigTournamentRules.TOP32_SLOTS - 1}")
        }
        val qualifierSurvivorsTarget = BigTournamentRules.TOP32_SLOTS - golden.size
        if (qualWinners.size != qualifierSurvivorsTarget) {
            badRequest("expected $qualifierSurvivorsTarget qualifier winners, got ${qualWinners.size}")
        }
        val ordered32 = qualWinners + golden
        val snake = GroupRoundRobinPlanner.snakeAssignments(
            ordered32,
            BigTournamentRules.GROUP_COUNT,
            BigTournamentRules.TEAMS_PER_GROUP,
        )
        for ((g, teamId) in snake) {
            groupAssignmentRepository.save(
                TournamentGroupAssignment(tournamentId = tournamentId, teamId = teamId, groupIndex = g),
            )
        }
        val groups = Array(BigTournamentRules.GROUP_COUNT) { mutableListOf<Long>() }
        for ((g, teamId) in snake) {
            groups[g] += teamId
        }
        val drafts = GroupRoundRobinPlanner.buildGroupStageDrafts(groups.map { it.toList() }, bestOf = 1)
        persistPlayoffLikeDrafts(tournamentId, drafts)
        tournamentRepository.save(
            t.copy(
                bigPhase = BigTournamentPhase.GROUP_STAGE,
                bigQualifierRound = -1,
            ),
        )
        eventHub.notifyTournamentsChanged()
    }

    private suspend fun maybeFinishGroupStage(t: Tournament) {
        if (t.bigPhase != BigTournamentPhase.GROUP_STAGE) return
        val incomplete = matchRepository.countIncompleteByTournamentIdAndPhase(t.id!!, BigTournamentPhase.GROUP_STAGE)
        if (incomplete > 0) return
        val all = matchRepository.findByTournamentIdAndPhase(t.id!!, BigTournamentPhase.GROUP_STAGE).toList()
        val byGroup = all.groupBy { it.groupIndex }
        val advancing = mutableListOf<Long>()
        for (g in 0 until BigTournamentRules.GROUP_COUNT) {
            val ms = byGroup[g].orEmpty()
            val teamIds = groupAssignmentRepository.findByTournamentId(t.id!!).toList()
                .filter { it.groupIndex == g }
                .map { it.teamId }
                .distinct()
                .sorted()
            advancing += topTwoByGroupWins(teamIds, ms)
        }
        if (advancing.size != BigTournamentRules.PLAYOFF_TEAM_COUNT) {
            badRequest("playoff seeding failed: ${advancing.size} teams")
        }
        val drafts = DoubleElimPowerOfTwoPlanner.build(advancing)
        persistPlayoffLikeDrafts(t.id!!, drafts)
        tournamentRepository.save(t.copy(bigPhase = BigTournamentPhase.PLAYOFFS))
        eventHub.notifyTournamentsChanged()
    }

    private fun topTwoByGroupWins(teamIds: List<Long>, matches: List<TournamentMatch>): List<Long> {
        val wins = teamIds.associateWith { 0 }.toMutableMap()
        for (m in matches) {
            val w = m.winnerTeamId ?: continue
            wins[w] = (wins[w] ?: 0) + 1
        }
        return teamIds.map { tid -> tid to (wins[tid] ?: 0) }
            .sortedWith(compareByDescending<Pair<Long, Int>> { it.second }.thenBy { it.first })
            .take(BigTournamentRules.ADVANCE_PER_GROUP)
            .map { it.first }
    }

    private suspend fun maybeFinishPlayoffs(t: Tournament, completed: TournamentMatch) {
        if (t.bigPhase != BigTournamentPhase.PLAYOFFS) return
        if (completed.isGrandFinal && completed.grandFinalSet == 1 && completed.winnerTeamId == completed.teamBId) {
            return
        }
        if (!completed.isGrandFinal) return
        val incomplete = matchRepository.countIncompleteByTournamentIdAndPhase(t.id!!, BigTournamentPhase.PLAYOFFS)
        if (incomplete > 0) return
        tournamentRepository.save(t.copy(bigPhase = BigTournamentPhase.COMPLETED, status = "COMPLETED"))
        eventHub.notifyTournamentsChanged()
    }

    private suspend fun maybeScheduleGrandFinalReset(completed: TournamentMatch) {
        if (!completed.isGrandFinal || completed.grandFinalSet != 1) return
        val w = completed.winnerTeamId ?: return
        val bSide = completed.teamBId ?: return
        if (w != bSide) return
        val existing = matchRepository.findByTournamentIdAndBracketKey(completed.tournamentId, "GF|2")
        if (existing != null) return
        val aSide = completed.teamAId ?: return
        val t = tournamentRepository.findById(completed.tournamentId) ?: return
        matchRepository.save(
            TournamentMatch(
                tournamentId = completed.tournamentId,
                bracketKey = "GF|2",
                phase = BigTournamentPhase.PLAYOFFS,
                bracketTrack = "GRAND_FINAL",
                groupIndex = -1,
                roundIndex = 1,
                matchIndex = 0,
                teamAId = aSide,
                teamBId = bSide,
                bestOf = 5,
                status = BigTournamentMatchStatuses.SCHEDULED,
                isGrandFinal = true,
                grandFinalSet = 2,
            ),
        )
        tournamentRepository.save(t.copy(bigPhase = BigTournamentPhase.PLAYOFFS))
        eventHub.notifyTournamentsChanged()
    }

    private suspend fun persistPlayoffLikeDrafts(tournamentId: Long, drafts: List<BracketMatchDraft>) {
        val idByKey = linkedMapOf<String, Long>()
        for (d in drafts) {
            val saved = matchRepository.save(draftToEntity(tournamentId, d))
            idByKey[d.key] = saved.id!!
        }
        for (d in drafts) {
            val id = idByKey[d.key]!!
            val winTo = d.winnerFeedsTo?.let { idByKey[it.first] to it.second }
            val loseTo = d.loserFeedsTo?.let { idByKey[it.first] to it.second }
            if (winTo == null && loseTo == null) continue
            val cur = matchRepository.findById(id)!!
            matchRepository.save(
                cur.copy(
                    feedsWinnerToMatchId = winTo?.first,
                    feedsWinnerSlot = winTo?.second,
                    feedsLoserToMatchId = loseTo?.first,
                    feedsLoserSlot = loseTo?.second,
                ),
            )
        }
        for (d in drafts) {
            val m = matchRepository.findById(idByKey[d.key]!!)!!
            if (m.status == BigTournamentMatchStatuses.COMPLETED) {
                propagateCompletedMatch(m)
            }
        }
    }

    private fun draftToEntity(tournamentId: Long, d: BracketMatchDraft): TournamentMatch {
        val ta = slotToTeamId(d.slotA)
        val tb = slotToTeamId(d.slotB)
        var status = BigTournamentMatchStatuses.SCHEDULED
        var winner: Long? = null
        if (ta != null && tb == null) {
            status = BigTournamentMatchStatuses.COMPLETED
            winner = ta
        } else if (tb != null && ta == null) {
            status = BigTournamentMatchStatuses.COMPLETED
            winner = tb
        }
        return TournamentMatch(
            tournamentId = tournamentId,
            bracketKey = d.key,
            phase = d.phase,
            bracketTrack = d.bracketTrack,
            groupIndex = d.groupIndex,
            roundIndex = d.roundIndex,
            matchIndex = d.matchIndex,
            teamAId = ta,
            teamBId = tb,
            bestOf = d.bestOf,
            winnerTeamId = winner,
            status = status,
            isGrandFinal = d.isGrandFinal,
            grandFinalSet = d.grandFinalSet,
            closesQualifierPhase = d.closesQualifierPhase,
        )
    }

    private fun slotToTeamId(s: BracketSlot): Long? = when (s) {
        is BracketSlot.Team -> s.teamId
        BracketSlot.Absent -> null
        else -> null
    }

    private fun notFound(): Nothing = throw ResponseStatusException(HttpStatus.NOT_FOUND)
    private fun badRequest(msg: String): Nothing = throw ResponseStatusException(HttpStatus.BAD_REQUEST, msg)
}
