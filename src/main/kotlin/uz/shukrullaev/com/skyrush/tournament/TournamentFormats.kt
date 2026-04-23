package uz.shukrullaev.com.skyrush.tournament

/**
 * Turnir seriyasi: BO1, BO2 (2–0 yoki 1–1 durang — keyin tie-break), BO3, BO5, …
 * Katta turnirlarda qolgan jamoalar soniga qarab turli BO qoidalari [TournamentFormatRule] orqali.
 */
object TournamentFormats {
    val ALLOWED_BEST_OF: Set<Int> = setOf(1, 2, 3, 5, 7, 9)
    val ALLOWED_BRACKET_TRACKS: Set<String> = setOf("MAIN", "WINNERS", "LOSERS", "GRAND_FINAL")
    const val PHASE_GROUP_ROUND_ROBIN: String = "GROUP_ROUND_ROBIN"
    const val PHASE_ELIMINATION: String = "ELIMINATION"
    const val MAX_TEAMS: Int = Int.MAX_VALUE
    const val MIN_TEAMS: Int = 2

    fun bracketTrackRank(track: String): Int =
        when (track.uppercase()) {
            "MAIN" -> 0
            "WINNERS" -> 1
            "LOSERS" -> 2
            "GRAND_FINAL" -> 3
            else -> 99
        }

    /** Yutish uchun kerak bo‘lgan map/oyin soni (BO2 → ikkalasini ham yutish). */
    fun winsToWin(bestOf: Int): Int =
        when (bestOf) {
            2 -> 2
            else -> (bestOf + 1) / 2
        }

    /**
     * Qolgan jamoalar [remainingTeams] bo‘lganda qaysi BO qo‘llanadi.
     * Har qoida: «kamida [minTeams] jamoa qolganda» shu BO (eng katta mos [minTeams] tanlanadi).
     * Qoidalar bo‘sh bo‘lsa — turnir ustunidagi [fallbackBestOf].
     */
    fun resolveBestOf(remainingTeams: Int, rules: List<Pair<Int, Int>>, fallbackBestOf: Int): Int {
        if (rules.isEmpty()) return fallbackBestOf
        val n = remainingTeams.coerceAtLeast(1)
        return rules.filter { it.first <= n }.maxByOrNull { it.first }?.second ?: fallbackBestOf
    }
}
