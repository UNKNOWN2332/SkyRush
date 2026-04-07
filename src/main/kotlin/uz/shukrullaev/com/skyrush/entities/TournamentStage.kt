package uz.shukrullaev.com.skyrush.entities

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table

@Table("tournament_stages")
data class TournamentStage(
    @Id val id: Long? = null,
    @Column("tournament_id") val tournamentId: Long,
    @Column("sort_order") val sortOrder: Int,
    @Column("bracket_track") val bracketTrack: String,
    @Column("phase_kind") val phaseKind: String,
    val label: String = "",
    @Column("best_of") val bestOf: Int,
    @Column("teams_at_start") val teamsAtStart: Int,
    @Column("group_count") val groupCount: Int? = null,
    @Column("teams_per_group") val teamsPerGroup: Int? = null,
    @Column("advance_per_group") val advancePerGroup: Int? = null,
)
