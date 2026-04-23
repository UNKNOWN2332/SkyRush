package uz.shukrullaev.com.skyrush.tournament

/**
 * Yaratishda tanlanadi: kichik / o‘rtacha / katta turnir.
 */
object TournamentScale {
    const val SMALL = "SMALL"
    const val MEDIUM = "MEDIUM"
    const val BIG = "BIG"

    /** Katta turnir: minimal ro‘yxat limiti; yuqori chegara yo‘q (Int/DB limitigacha). */
    const val BIG_MIN_MAX_TEAMS: Int = 32

    const val SMALL_MIN_TEAMS: Int = 8
    const val SMALL_MAX_TEAMS: Int = 16

    const val MEDIUM_MIN_TEAMS: Int = 32
    const val MEDIUM_MAX_TEAMS: Int = 64

    /** Tarkib (kapitan bilan): kichik/katta — [ROSTER_MIN, ROSTER_MAX_STANDARD]; o‘rta — [ROSTER_MIN, ROSTER_MAX_MEDIUM]. */
    const val ROSTER_MIN: Int = 5
    const val ROSTER_MAX_STANDARD: Int = 20
    const val ROSTER_MAX_MEDIUM: Int = 9

    fun parse(raw: String?): String {
        val u = raw?.trim()?.uppercase().orEmpty()
        return when (u) {
            SMALL, MEDIUM, BIG -> u
            "" -> MEDIUM
            else -> ""
        }
    }

    fun isKnown(scale: String): Boolean = scale == SMALL || scale == MEDIUM || scale == BIG
}
