package uz.shukrullaev.com.skyrush.entities

import org.springframework.data.annotation.Id
import org.springframework.data.relational.core.mapping.Column
import org.springframework.data.relational.core.mapping.Table
import uz.shukrullaev.com.skyrush.tournament.TournamentScale
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
    /** SMALL | MEDIUM | BIG — yaratishda tanlanadi. */
    @Column("tournament_scale") val tournamentScale: String = TournamentScale.MEDIUM,
    /** [tournamentScale] == BIG bo‘lganda true (kval + guruh + DE). */
    @Column("big_tournament") val bigTournament: Boolean = false,
    /** QUALIFIERS | GROUP_STAGE | PLAYOFFS | COMPLETED — faqat [bigTournament] uchun. */
    @Column("big_phase") val bigPhase: String? = null,
    /** Joriy kval raund indeksi (0-based); kval tugagach -1. */
    @Column("big_qualifier_round") val bigQualifierRound: Int = -1,
    @Column("roster_size") val rosterSize: Int = 5,
    @Column("game_code") val gameCode: String = "ML",
    @Column("registration_open_at") val registrationOpenAt: Instant? = null,
    @Column("registration_close_at") val registrationCloseAt: Instant? = null,
    @Column("draw_at") val drawAt: Instant? = null,
    @Column("start_at") val startAt: Instant? = null,
    @Column("created_at") val createdAt: Instant? = null,
)
