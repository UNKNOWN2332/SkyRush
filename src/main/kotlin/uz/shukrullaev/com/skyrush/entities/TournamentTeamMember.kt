package uz.shukrullaev.com.skyrush.entities

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table

@Table("tournament_team_members")
data class TournamentTeamMember(
    @Id val id: Long? = null,
    @Column("team_id") val teamId: Long,
    val nickname: String,
    @Column("game_player_id") val gamePlayerId: String,
    @Column("is_captain") val isCaptain: Boolean,
)
