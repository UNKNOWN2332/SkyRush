package uz.shukrullaev.com.skyrush.entities

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import java.time.Instant

@Table("tournaments")
data class Tournament(
    @Id val id: Long? = null,
    @Column("organizer_id") val organizerId: Long,
    val title: String,
    val description: String? = null,
    val status: String = "REGISTRATION_OPEN",
    @Column("max_teams") val maxTeams: Int,
    @Column("best_of") val bestOf: Int,
    @Column("phased_format") val phasedFormat: Boolean = false,
    @Column("has_custom_stages") val hasCustomStages: Boolean = false,
    @Column("roster_size") val rosterSize: Int = 5,
    @Column("game_code") val gameCode: String = "ML",
    @Column("created_at") val createdAt: Instant? = null,
)
