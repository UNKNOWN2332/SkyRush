package uz.shukrullaev.com.skyrush.entities

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant

@Table("tournament_teams")
data class TournamentTeam(
    @Id val id: Long? = null,
    @Column("tournament_id") val tournamentId: Long,
    @Column("team_name") val teamName: String,
    @Column("captain_user_id") val captainUserId: Long,
    @Column("logo_url") val logoUrl: String? = null,
    @Column("is_invited") val isInvited: Boolean = false,
    /** Oltin jamoa: 1-bosqichni o‘tkazib, 2-bosqichda (32) qatnashadi. */
    @Column("is_golden") val isGolden: Boolean = false,
    @Column("created_at") val createdAt: Instant? = null,
)
