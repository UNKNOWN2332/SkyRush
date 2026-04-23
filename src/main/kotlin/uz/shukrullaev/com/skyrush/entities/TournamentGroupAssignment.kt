package uz.shukrullaev.com.skyrush.entities

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table

@Table("tournament_group_assignments")
data class TournamentGroupAssignment(
    @Id val id: Long? = null,
    @Column("tournament_id") val tournamentId: Long,
    @Column("team_id") val teamId: Long,
    @Column("group_index") val groupIndex: Int,
)
