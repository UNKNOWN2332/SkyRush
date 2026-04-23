package uz.shukrullaev.com.skyrush.DTOs

import com.fasterxml.jackson.annotation.JsonProperty
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import java.time.Instant

data class TournamentFormatRuleResponse(
    val minTeams: Int,
    val bestOf: Int,
)

data class TournamentStageResponse(
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

data class TournamentSummaryResponse(
    val id: Long,
    val title: String,
    val description: String?,
    val status: String,
    val maxTeams: Int,
    val teamCount: Long,
    val bestOf: Int,
    val phasedFormat: Boolean,
    val hasCustomStages: Boolean,
    /** SMALL | MEDIUM | BIG */
    val tournamentScale: String,
    val bigTournament: Boolean,
    val rosterSize: Int,
    val gameCode: String,
    val registrationOpenAt: Instant?,
    val registrationCloseAt: Instant?,
    val drawAt: Instant?,
    val startAt: Instant?,
    val organizerUsername: String,
    val createdAt: Instant?,
)

data class TournamentMemberResponse(
    val nickname: String,
    val gamePlayerId: String,
    val isCaptain: Boolean,
)

data class TournamentTeamResponse(
    val id: Long,
    val teamName: String,
    val captainUsername: String,
    val isInvited: Boolean,
    val members: List<TournamentMemberResponse>,
)

data class TournamentDetailResponse(
    val id: Long,
    val title: String,
    val description: String?,
    val status: String,
    val maxTeams: Int,
    val teamCount: Long,
    val bestOf: Int,
    val phasedFormat: Boolean,
    val hasCustomStages: Boolean,
    val tournamentScale: String,
    val bigTournament: Boolean,
    val formatRules: List<TournamentFormatRuleResponse>,
    val stages: List<TournamentStageResponse>,
    val rosterSize: Int,
    val gameCode: String,
    val registrationOpenAt: Instant?,
    val registrationCloseAt: Instant?,
    val drawAt: Instant?,
    val startAt: Instant?,
    val organizerUsername: String,
    val createdAt: Instant?,
    val teams: List<TournamentTeamResponse>,
)

data class TournamentFormatRuleRequest(
    @field:NotNull @field:Min(1) @field:Max(1024) val minTeams: Int,
    @field:NotNull val bestOf: Int,
)

data class TournamentStageRequest(
    @field:NotNull @field:Min(1) @field:Max(999) val sortOrder: Int,
    @field:NotBlank @field:Size(max = 24) val bracketTrack: String,
    @field:NotBlank @field:Size(max = 40) val phaseKind: String,
    @field:Size(max = 160) val label: String? = null,
    @field:NotNull val bestOf: Int,
    @field:NotNull @field:Min(2) @field:Max(1024) val teamsAtStart: Int,
    @field:Min(1) @field:Max(256) val groupCount: Int? = null,
    @field:Min(2) @field:Max(256) val teamsPerGroup: Int? = null,
    @field:Min(1) @field:Max(256) val advancePerGroup: Int? = null,
)

data class CreateTournamentRequest(
    @field:NotBlank @field:Size(max = 200) val title: String,
    val description: String? = null,
    @field:NotNull @field:Min(2) @field:Max(2_147_483_647) val maxTeams: Int,
    /** Oddiy turnir: barcha bosqichda shu BO. Bosqichli [formatRules] bo‘lsa — katta bosqichdagi BO (ustunda ham shu). */
    @field:NotNull val bestOf: Int,
    /** Kichik/katta: 5…20; o‘rta: 5…9 (qoʻshimcha tekshiruv [TournamentService]). */
    @field:NotNull @field:Min(5) @field:Max(20) val rosterSize: Int,
    @field:Size(max = 32) val gameCode: String? = null,
    /** Bo‘sh emas bo‘lsa: qolgan jamoalar soni bo‘yicha BO (kamida bitta qoida minTeams = 1 bo‘lishi kerak). */
    val formatRules: List<TournamentFormatRuleRequest>? = null,
    /** M World uslubi: guruhlar + g‘oliblar/pastki setka bosqichlari. [formatRules] bilan birga yuborilmasin. */
    val stages: List<TournamentStageRequest>? = null,
    /**
     * Kichik: 8…16 (serverda BO3/BO5/BO7 qoidalari). O‘rta: 32…64. Katta: ≥32, yuqori chegara yo‘q.
     * SMALL | MEDIUM | BIG (harf-registr muhim emas).
     */
    @field:NotBlank @field:Size(max = 16) val tournamentScale: String = "MEDIUM",
    /** Eski klientlar: true bo‘lsa [tournamentScale] BIG ga majburlanadi. */
    @field:JsonProperty("bigTournament") val legacyBigTournament: Boolean? = null,
)

/** Tashkilotchi: faqat berilgan maydonlar yangilanadi (null = o‘zgartirilmasin). */
data class UpdateTournamentRequest(
    @field:Size(min = 2, max = 200) val title: String? = null,
    @field:Size(max = 4000) val description: String? = null,
    /** REGISTRATION_OPEN yoki REGISTRATION_CLOSED (har qanday registr). */
    @field:Size(max = 32) val status: String? = null,
    @field:Min(2) @field:Max(2_147_483_647) val maxTeams: Int? = null,
    val registrationOpenAt: Instant? = null,
    val registrationCloseAt: Instant? = null,
    val drawAt: Instant? = null,
    val startAt: Instant? = null,
)

data class TournamentRosterMemberRequest(
    @field:NotBlank @field:Size(max = 100) val nickname: String,
    @field:NotBlank @field:Size(max = 64) val gamePlayerId: String,
    val isCaptain: Boolean = false,
)

data class RegisterTeamRequest(
    @field:NotBlank @field:Size(max = 120) val teamName: String,
    @field:NotNull @field:Size(min = 1, max = 20) val members: List<TournamentRosterMemberRequest>,
)

data class MarkGoldenTeamsRequest(
    @field:NotNull @field:Size(min = 0, max = 1024) val teamIds: Set<Long>,
)

data class StartBigQualifiersRequest(
    @field:NotNull @field:Size(min = 1, max = 1024) val orderedNonGoldenSeeds: List<Long>,
    @field:NotNull val bestOf: Int,
)

data class AdvanceBigQualifierRoundRequest(
    @field:NotNull val bestOf: Int,
)

data class RecordBigMatchGameRequest(
    @field:NotNull val winnerTeamId: Long,
)

data class InviteTeamsRequest(
    @field:NotNull @field:Size(min = 1, max = 256) val teamNames: List<String>,
)
