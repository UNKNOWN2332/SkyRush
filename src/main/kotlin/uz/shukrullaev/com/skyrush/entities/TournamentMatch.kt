package uz.shukrullaev.com.skyrush.entities

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import uz.shukrullaev.com.skyrush.tournament.BigTournamentMatchStatuses
import java.time.Instant

@Table("tournament_matches")
data class TournamentMatch(
    @Id val id: Long? = null,
    @Column("tournament_id") val tournamentId: Long,
    @Column("bracket_key") val bracketKey: String = "",
    val phase: String,
    @Column("bracket_track") val bracketTrack: String? = null,
    @Column("group_index") val groupIndex: Int = -1,
    @Column("round_index") val roundIndex: Int = 0,
    @Column("match_index") val matchIndex: Int = 0,
    @Column("team_a_id") val teamAId: Long? = null,
    @Column("team_b_id") val teamBId: Long? = null,
    @Column("best_of") val bestOf: Int,
    @Column("winner_team_id") val winnerTeamId: Long? = null,
    val status: String = BigTournamentMatchStatuses.SCHEDULED,
    @Column("feeds_winner_to_match_id") val feedsWinnerToMatchId: Long? = null,
    @Column("feeds_winner_slot") val feedsWinnerSlot: Char? = null,
    @Column("feeds_loser_to_match_id") val feedsLoserToMatchId: Long? = null,
    @Column("feeds_loser_slot") val feedsLoserSlot: Char? = null,
    @Column("is_grand_final") val isGrandFinal: Boolean = false,
    @Column("grand_final_set") val grandFinalSet: Int = 1,
    @Column("closes_qualifier_phase") val closesQualifierPhase: Boolean = false,
    @Column("created_at") val createdAt: Instant? = null,
)
