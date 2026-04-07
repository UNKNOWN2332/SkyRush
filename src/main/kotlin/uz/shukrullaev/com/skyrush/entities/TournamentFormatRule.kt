package uz.shukrullaev.com.skyrush.entities

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table

@Table("tournament_format_rules")
data class TournamentFormatRule(
    @Id val id: Long? = null,
    @Column("tournament_id") val tournamentId: Long,
    @Column("min_teams") val minTeams: Int,
    @Column("best_of") val bestOf: Int,
)
