package uz.shukrullaev.com.skyrush.entities

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant

@Table("tournament_match_games")
data class TournamentMatchGame(
    @Id val id: Long? = null,
    @Column("match_id") val matchId: Long,
    @Column("game_number") val gameNumber: Int,
    @Column("winner_team_id") val winnerTeamId: Long,
    @Column("created_at") val createdAt: Instant? = null,
)
