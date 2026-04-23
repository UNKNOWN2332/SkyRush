package uz.shukrullaev.com.skyrush.tournament

/**
 * Katta turnir holat mashinasi: kvalifikatsiya → guruh → pley-off (ikki to‘liq setka + grand final).
 */
object BigTournamentPhase {
    const val QUALIFIERS = "QUALIFIERS"
    const val GROUP_STAGE = "GROUP_STAGE"
    const val PLAYOFFS = "PLAYOFFS"
    const val COMPLETED = "COMPLETED"

    val ORDER: List<String> = listOf(QUALIFIERS, GROUP_STAGE, PLAYOFFS, COMPLETED)
}

object BigTournamentMatchStatuses {
    const val SCHEDULED = "SCHEDULED"
    const val IN_PROGRESS = "IN_PROGRESS"
    const val COMPLETED = "COMPLETED"
}

object BigTournamentRules {
    const val TOP32_SLOTS: Int = 32
    const val GROUP_COUNT: Int = 8
    const val TEAMS_PER_GROUP: Int = 4
    const val ADVANCE_PER_GROUP: Int = 2
    const val PLAYOFF_TEAM_COUNT: Int = GROUP_COUNT * ADVANCE_PER_GROUP

    /** Saralash bosqichida qatnashadigan minimum jamoa (kamida 1 non-golden bo‘lishi kerak). */
    const val MIN_QUALIFIER_POOL: Int = 1
}
