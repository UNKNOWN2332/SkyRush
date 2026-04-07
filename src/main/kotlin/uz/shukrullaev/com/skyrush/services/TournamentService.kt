package uz.shukrullaev.com.skyrush.services

import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.reactor.awaitSingleOrNull
import org.springframework.http.HttpStatus
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.ReactiveSecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.web.server.ResponseStatusException
import uz.shukrullaev.com.skyrush.DTOs.CreateTournamentRequest
import uz.shukrullaev.com.skyrush.DTOs.RegisterTeamRequest
import uz.shukrullaev.com.skyrush.DTOs.TournamentDetailResponse
import uz.shukrullaev.com.skyrush.DTOs.TournamentFormatRuleRequest
import uz.shukrullaev.com.skyrush.DTOs.TournamentFormatRuleResponse
import uz.shukrullaev.com.skyrush.DTOs.TournamentMemberResponse
import uz.shukrullaev.com.skyrush.DTOs.TournamentStageRequest
import uz.shukrullaev.com.skyrush.DTOs.TournamentStageResponse
import uz.shukrullaev.com.skyrush.DTOs.TournamentSummaryResponse
import uz.shukrullaev.com.skyrush.DTOs.TournamentTeamResponse
import uz.shukrullaev.com.skyrush.entities.Tournament
import uz.shukrullaev.com.skyrush.entities.TournamentFormatRule
import uz.shukrullaev.com.skyrush.entities.TournamentStage
import uz.shukrullaev.com.skyrush.entities.TournamentTeam
import uz.shukrullaev.com.skyrush.entities.TournamentTeamMember
import uz.shukrullaev.com.skyrush.repositories.TournamentFormatRuleRepository
import uz.shukrullaev.com.skyrush.repositories.TournamentRepository
import uz.shukrullaev.com.skyrush.repositories.TournamentStageRepository
import uz.shukrullaev.com.skyrush.repositories.TournamentTeamMemberRepository
import uz.shukrullaev.com.skyrush.repositories.TournamentTeamRepository
import uz.shukrullaev.com.skyrush.repositories.UserRepository
import uz.shukrullaev.com.skyrush.tournament.TournamentEventHub
import uz.shukrullaev.com.skyrush.tournament.TournamentFormats

@Service
class TournamentService(
    private val tournamentRepository: TournamentRepository,
    private val teamRepository: TournamentTeamRepository,
    private val memberRepository: TournamentTeamMemberRepository,
    private val userRepository: UserRepository,
    private val formatRuleRepository: TournamentFormatRuleRepository,
    private val stageRepository: TournamentStageRepository,
    private val eventHub: TournamentEventHub,
) {

    private data class StageDraft(
        val sortOrder: Int,
        val bracketTrack: String,
        val phaseKind: String,
        val label: String,
        val bestOf: Int,
        val teamsAtStart: Int,
        val groupCount: Int?,
        val teamsPerGroup: Int?,
        val advancePerGroup: Int?,
    )

    fun listSummaries(): Flow<TournamentSummaryResponse> = flow {
        tournamentRepository.findAllOrdered().collect { t ->
            val id = t.id ?: return@collect
            val count = teamRepository.countByTournamentId(id)
            val org = userRepository.findById(t.organizerId)
            emit(
                TournamentSummaryResponse(
                    id = id,
                    title = t.title,
                    description = t.description,
                    status = t.status,
                    maxTeams = t.maxTeams,
                    teamCount = count,
                    bestOf = t.bestOf,
                    phasedFormat = t.phasedFormat,
                    hasCustomStages = t.hasCustomStages,
                    rosterSize = t.rosterSize,
                    gameCode = t.gameCode,
                    organizerUsername = org?.username ?: "?",
                    createdAt = t.createdAt,
                ),
            )
        }
    }

    suspend fun getDetail(id: Long): TournamentDetailResponse {
        val t = tournamentRepository.findById(id) ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        val tid = t.id!!
        val teams = teamRepository.findByTournamentId(tid).toList()
        val count = teams.size.toLong()
        val org = userRepository.findById(t.organizerId)
        val formatRules = formatRuleRepository.findByTournamentIdOrderByMinTeamsAsc(tid).toList().map { r ->
            TournamentFormatRuleResponse(minTeams = r.minTeams, bestOf = r.bestOf)
        }
        val stages = stageRepository.findByTournamentIdOrdered(tid).toList().map { s ->
            TournamentStageResponse(
                sortOrder = s.sortOrder,
                bracketTrack = s.bracketTrack,
                phaseKind = s.phaseKind,
                label = s.label,
                bestOf = s.bestOf,
                teamsAtStart = s.teamsAtStart,
                groupCount = s.groupCount,
                teamsPerGroup = s.teamsPerGroup,
                advancePerGroup = s.advancePerGroup,
            )
        }
        val teamResponses = teams.map { team ->
            val m = memberRepository.findByTeamId(team.id!!).toList()
            val cap = userRepository.findById(team.captainUserId)
            TournamentTeamResponse(
                id = team.id!!,
                teamName = team.teamName,
                captainUsername = cap?.username ?: "?",
                members = m.map { mm ->
                    TournamentMemberResponse(mm.nickname, mm.gamePlayerId, mm.isCaptain)
                },
            )
        }
        return TournamentDetailResponse(
            id = tid,
            title = t.title,
            description = t.description,
            status = t.status,
            maxTeams = t.maxTeams,
            teamCount = count,
            bestOf = t.bestOf,
            phasedFormat = t.phasedFormat,
            hasCustomStages = t.hasCustomStages,
            formatRules = formatRules,
            stages = stages,
            rosterSize = t.rosterSize,
            gameCode = t.gameCode,
            organizerUsername = org?.username ?: "?",
            createdAt = t.createdAt,
            teams = teamResponses,
        )
    }

    suspend fun create(request: CreateTournamentRequest): TournamentSummaryResponse {
        val username = currentUsername()
        val user = userRepository.findByUsername(username)
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        val hasRules = !request.formatRules.isNullOrEmpty()
        val hasStages = !request.stages.isNullOrEmpty()
        if (hasRules && hasStages) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "use either formatRules or stages, not both",
            )
        }
        val normalizedStages = if (hasStages) normalizeStages(request.maxTeams, request.stages!!) else null
        val normalizedRules = if (normalizedStages != null) null else normalizeFormatRules(request.maxTeams, request.formatRules)
        val phased = normalizedRules != null || normalizedStages != null
        val hasCustomStages = normalizedStages != null
        val bestOfColumn = when {
            normalizedStages != null ->
                normalizedStages.minWith(
                    compareBy({ it.sortOrder }, { TournamentFormats.bracketTrackRank(it.bracketTrack) }),
                ).bestOf
            normalizedRules != null -> normalizedRules.maxBy { it.first }.second
            else -> request.bestOf
        }
        if (bestOfColumn !in TournamentFormats.ALLOWED_BEST_OF) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "bestOf must be 1,2,3,5,7,9")
        }
        val gameCode = (request.gameCode?.trim()?.takeIf { it.isNotEmpty() } ?: "ML").uppercase()
        val desc = request.description?.trim()?.takeIf { it.isNotEmpty() }
        val saved = tournamentRepository.save(
            Tournament(
                organizerId = user.id!!,
                title = request.title.trim(),
                description = desc,
                status = "REGISTRATION_OPEN",
                maxTeams = request.maxTeams,
                bestOf = bestOfColumn,
                phasedFormat = phased,
                hasCustomStages = hasCustomStages,
                rosterSize = request.rosterSize,
                gameCode = gameCode,
            ),
        )
        val id = saved.id!!
        if (normalizedRules != null) {
            for ((minT, bo) in normalizedRules) {
                formatRuleRepository.save(
                    TournamentFormatRule(tournamentId = id, minTeams = minT, bestOf = bo),
                )
            }
        }
        if (normalizedStages != null) {
            for (d in normalizedStages) {
                stageRepository.save(
                    TournamentStage(
                        tournamentId = id,
                        sortOrder = d.sortOrder,
                        bracketTrack = d.bracketTrack,
                        phaseKind = d.phaseKind,
                        label = d.label,
                        bestOf = d.bestOf,
                        teamsAtStart = d.teamsAtStart,
                        groupCount = d.groupCount,
                        teamsPerGroup = d.teamsPerGroup,
                        advancePerGroup = d.advancePerGroup,
                    ),
                )
            }
        }
        eventHub.notifyTournamentsChanged()
        return TournamentSummaryResponse(
            id = id,
            title = saved.title,
            description = saved.description,
            status = saved.status,
            maxTeams = saved.maxTeams,
            teamCount = 0,
            bestOf = saved.bestOf,
            phasedFormat = saved.phasedFormat,
            hasCustomStages = saved.hasCustomStages,
            rosterSize = saved.rosterSize,
            gameCode = saved.gameCode,
            organizerUsername = user.username,
            createdAt = saved.createdAt,
        )
    }

    private fun normalizeStages(maxTeams: Int, raw: List<TournamentStageRequest>): List<StageDraft> {
        val keys = raw.map { it.sortOrder to it.bracketTrack.trim().uppercase() }
        if (keys.size != keys.toSet().size) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "duplicate sortOrder+bracketTrack in stages")
        }
        val drafts = mutableListOf<StageDraft>()
        for (s in raw) {
            val track = s.bracketTrack.trim().uppercase()
            if (track !in TournamentFormats.ALLOWED_BRACKET_TRACKS) {
                throw ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "bracketTrack must be one of: MAIN, WINNERS, LOSERS, GRAND_FINAL",
                )
            }
            val phase = s.phaseKind.trim().uppercase()
            if (s.bestOf !in TournamentFormats.ALLOWED_BEST_OF) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid bestOf in stage")
            }
            if (s.teamsAtStart > maxTeams) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "teamsAtStart cannot exceed maxTeams")
            }
            val gc = s.groupCount
            val tpg = s.teamsPerGroup
            val apg = s.advancePerGroup
            val isGroup = phase == TournamentFormats.PHASE_GROUP_ROUND_ROBIN
            if (isGroup) {
                if (gc == null || tpg == null || apg == null) {
                    throw ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "GROUP_ROUND_ROBIN requires groupCount, teamsPerGroup, advancePerGroup",
                    )
                }
                if (gc * tpg != s.teamsAtStart) {
                    throw ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "groupCount * teamsPerGroup must equal teamsAtStart for group stage",
                    )
                }
            } else {
                if (gc != null || tpg != null || apg != null) {
                    throw ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "only GROUP_ROUND_ROBIN may set group fields",
                    )
                }
            }
            drafts.add(
                StageDraft(
                    sortOrder = s.sortOrder,
                    bracketTrack = track,
                    phaseKind = phase,
                    label = s.label?.trim().orEmpty(),
                    bestOf = s.bestOf,
                    teamsAtStart = s.teamsAtStart,
                    groupCount = gc,
                    teamsPerGroup = tpg,
                    advancePerGroup = apg,
                ),
            )
        }
        return drafts.sortedWith(
            compareBy({ TournamentFormats.bracketTrackRank(it.bracketTrack) }, { it.sortOrder }),
        )
    }

    private fun normalizeFormatRules(
        maxTeams: Int,
        raw: List<TournamentFormatRuleRequest>?,
    ): List<Pair<Int, Int>>? {
        val list = raw?.takeIf { it.isNotEmpty() } ?: return null
        if (!list.any { it.minTeams == 1 }) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "formatRules must include a rule with minTeams=1 (final stage)",
            )
        }
        val pairs = list.map { it.minTeams to it.bestOf }
        if (pairs.map { it.first }.toSet().size != pairs.size) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "duplicate minTeams in formatRules")
        }
        for ((minT, bo) in pairs) {
            if (minT > maxTeams) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "minTeams cannot exceed maxTeams")
            }
            if (bo !in TournamentFormats.ALLOWED_BEST_OF) {
                throw ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid bestOf in formatRules")
            }
        }
        return pairs.sortedBy { it.first }
    }

    suspend fun registerTeam(tournamentId: Long, request: RegisterTeamRequest): TournamentTeamResponse {
        val username = currentUsername()
        val user = userRepository.findByUsername(username)
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        val t = tournamentRepository.findById(tournamentId) ?: throw ResponseStatusException(HttpStatus.NOT_FOUND)
        if (t.status != "REGISTRATION_OPEN") {
            throw ResponseStatusException(HttpStatus.CONFLICT, "registration closed")
        }
        val tid = t.id!!
        if (teamRepository.countByTournamentId(tid) >= t.maxTeams) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "tournament full")
        }
        if (request.members.size != t.rosterSize) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "members count must equal rosterSize")
        }
        val captains = request.members.count { it.isCaptain }
        if (captains != 1) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "exactly one captain required")
        }
        val normalizedTeam = request.teamName.trim()
        val existingTeams = teamRepository.findByTournamentId(tid).toList()
        if (existingTeams.any { it.captainUserId == user.id!! }) {
            throw ResponseStatusException(HttpStatus.CONFLICT, "already registered a team")
        }
        val newIds = request.members.map { it.gamePlayerId.trim().lowercase() }
        if (newIds.distinct().size != newIds.size) {
            throw ResponseStatusException(HttpStatus.BAD_REQUEST, "duplicate gamePlayerId in roster")
        }
        val usedIds = mutableSetOf<String>()
        for (team in existingTeams) {
            memberRepository.findByTeamId(team.id!!).toList().forEach { m ->
                usedIds.add(m.gamePlayerId.trim().lowercase())
            }
        }
        for (pid in newIds) {
            if (pid in usedIds) {
                throw ResponseStatusException(HttpStatus.CONFLICT, "gamePlayerId already in tournament")
            }
        }
        val team = teamRepository.save(
            TournamentTeam(
                tournamentId = tid,
                teamName = normalizedTeam,
                captainUserId = user.id!!,
            ),
        )
        val teamId = team.id!!
        for (m in request.members) {
            memberRepository.save(
                TournamentTeamMember(
                    teamId = teamId,
                    nickname = m.nickname.trim(),
                    gamePlayerId = m.gamePlayerId.trim(),
                    isCaptain = m.isCaptain,
                ),
            )
        }
        eventHub.notifyTournamentsChanged()
        val members = memberRepository.findByTeamId(teamId).toList().map { mm ->
            TournamentMemberResponse(mm.nickname, mm.gamePlayerId, mm.isCaptain)
        }
        return TournamentTeamResponse(
            id = teamId,
            teamName = team.teamName,
            captainUsername = user.username,
            members = members,
        )
    }

    private suspend fun currentUsername(): String {
        val ctx = ReactiveSecurityContextHolder.getContext().awaitSingleOrNull()
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        val auth = ctx.authentication
        if (auth !is UsernamePasswordAuthenticationToken || !auth.isAuthenticated) {
            throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
        }
        return auth.name?.takeIf { it.isNotBlank() }
            ?: throw ResponseStatusException(HttpStatus.UNAUTHORIZED)
    }
}
