package uz.shukrullaev.com.skyrush.tournament

import uz.shukrullaev.com.skyrush.tournament.BigTournamentPhase.PLAYOFFS

/**
 * Bosqichlar uchun “draft” — DB ga yozishdan oldin kalitlar va slot manbalari.
 */
sealed class BracketSlot {
    data class Team(val teamId: Long) : BracketSlot()
    data class WinnerOf(val matchKey: String) : BracketSlot()
    data class LoserOf(val matchKey: String) : BracketSlot()
    /** BYE / bo‘sh slot (qarama-qarshi yo‘q). */
    object Absent : BracketSlot()
}

data class BracketMatchDraft(
    val key: String,
    val phase: String,
    val bracketTrack: String?,
    val groupIndex: Int,
    val roundIndex: Int,
    val matchIndex: Int,
    val bestOf: Int,
    val slotA: BracketSlot,
    val slotB: BracketSlot,
    val winnerFeedsTo: Pair<String, Char>?,
    val loserFeedsTo: Pair<String, Char>?,
    val isGrandFinal: Boolean = false,
    val grandFinalSet: Int = 1,
    /** true bo‘lsa, barcha kval o‘yinlari tugagach guruh bosqichiga o‘tish tekshiriladi. */
    val closesQualifierPhase: Boolean = false,
)

object DoubleElimPowerOfTwoPlanner {

    private const val TRACK_W = "WINNERS"
    private const val TRACK_L = "LOSERS"
    private const val TRACK_GF = "GRAND_FINAL"

    private fun intLog2PowerOfTwo(n: Int): Int {
        require(n >= 2 && n and (n - 1) == 0) { "teamCount must be a power of 2, got $n" }
        return 31 - n.countLeadingZeroBits()
    }

    /**
     * [seeds] tartibi: 1-o‘rin eng kuchli (tenglashuvda kichik id ustun).
     */
    fun build(seeds: List<Long>): List<BracketMatchDraft> {
        val n = seeds.size
        require(n >= 4 && n and (n - 1) == 0)
        val k = intLog2PowerOfTwo(n)
        val out = mutableListOf<BracketMatchDraft>()
        val wbLoserDest = mutableMapOf<String, Pair<String, Char>>()

        fun wbKey(r: Int, i: Int) = "WB|$r|$i"

        for (r in 0 until k) {
            val matchesInRound = n shr (r + 1)
            for (i in 0 until matchesInRound) {
                val key = wbKey(r, i)
                val slotA: BracketSlot
                val slotB: BracketSlot
                if (r == 0) {
                    slotA = BracketSlot.Team(seeds[2 * i])
                    slotB = BracketSlot.Team(seeds[2 * i + 1])
                } else {
                    slotA = BracketSlot.WinnerOf(wbKey(r - 1, 2 * i))
                    slotB = BracketSlot.WinnerOf(wbKey(r - 1, 2 * i + 1))
                }
                val winTo = if (r < k - 1) {
                    Pair(wbKey(r + 1, i shr 1), if (i % 2 == 0) 'A' else 'B')
                } else {
                    Pair("GF|1", 'A')
                }
                val loseTo = wbLoserDest[key]
                out += BracketMatchDraft(
                    key = key,
                    phase = PLAYOFFS,
                    bracketTrack = TRACK_W,
                    groupIndex = -1,
                    roundIndex = r,
                    matchIndex = i,
                    bestOf = 3,
                    slotA = slotA,
                    slotB = slotB,
                    winnerFeedsTo = winTo,
                    loserFeedsTo = loseTo,
                    isGrandFinal = false,
                )
            }
        }

        var layer = 0
        fun lbKey() = "LB|${layer++}"

        val l0Keys = mutableListOf<String>()
        val half = n / 2
        for (m in 0 until n / 4) {
            val key = lbKey()
            l0Keys += key
            val k0 = wbKey(0, 2 * m)
            val k1 = wbKey(0, 2 * m + 1)
            wbLoserDest[k0] = key to 'A'
            wbLoserDest[k1] = key to 'B'
            out += BracketMatchDraft(
                key = key,
                phase = PLAYOFFS,
                bracketTrack = TRACK_L,
                groupIndex = -1,
                roundIndex = 0,
                matchIndex = m,
                bestOf = 3,
                slotA = BracketSlot.LoserOf(k0),
                slotB = BracketSlot.LoserOf(k1),
                winnerFeedsTo = null,
                loserFeedsTo = null,
            )
        }

        val l1Keys = mutableListOf<String>()
        for (m in 0 until n / 4) {
            val key = lbKey()
            l1Keys += key
            val wbm = wbKey(1, m)
            wbLoserDest[wbm] = key to 'B'
            out += BracketMatchDraft(
                key = key,
                phase = PLAYOFFS,
                bracketTrack = TRACK_L,
                groupIndex = -1,
                roundIndex = 1,
                matchIndex = m,
                bestOf = 3,
                slotA = BracketSlot.WinnerOf(l0Keys[m]),
                slotB = BracketSlot.LoserOf(wbm),
                winnerFeedsTo = null,
                loserFeedsTo = null,
            )
        }

        var curKeys = l1Keys.toList()
        var rAttach = 2
        while (rAttach < k) {
            val mergedKeys = mutableListOf<String>()
            for (j in 0 until curKeys.size / 2) {
                val key = lbKey()
                mergedKeys += key
                out += BracketMatchDraft(
                    key = key,
                    phase = PLAYOFFS,
                    bracketTrack = TRACK_L,
                    groupIndex = -1,
                    roundIndex = rAttach,
                    matchIndex = j,
                    bestOf = 3,
                    slotA = BracketSlot.WinnerOf(curKeys[2 * j]),
                    slotB = BracketSlot.WinnerOf(curKeys[2 * j + 1]),
                    winnerFeedsTo = null,
                    loserFeedsTo = null,
                )
            }
            val attachKeys = mutableListOf<String>()
            for (j in mergedKeys.indices) {
                val key = lbKey()
                attachKeys += key
                val wbk = wbKey(rAttach, j)
                wbLoserDest[wbk] = key to 'B'
                out += BracketMatchDraft(
                    key = key,
                    phase = PLAYOFFS,
                    bracketTrack = TRACK_L,
                    groupIndex = -1,
                    roundIndex = rAttach + 1,
                    matchIndex = j,
                    bestOf = 3,
                    slotA = BracketSlot.WinnerOf(mergedKeys[j]),
                    slotB = BracketSlot.LoserOf(wbk),
                    winnerFeedsTo = null,
                    loserFeedsTo = null,
                )
            }
            curKeys = attachKeys
            rAttach++
        }

        val lastLb = curKeys.single()
        out += BracketMatchDraft(
            key = "GF|1",
            phase = PLAYOFFS,
            bracketTrack = TRACK_GF,
            groupIndex = -1,
            roundIndex = 0,
            matchIndex = 0,
            bestOf = 5,
            slotA = BracketSlot.WinnerOf(wbKey(k - 1, 0)),
            slotB = BracketSlot.WinnerOf(lastLb),
            winnerFeedsTo = null,
            loserFeedsTo = null,
            isGrandFinal = true,
            grandFinalSet = 1,
        )

        val patched = out.map { d ->
            if (d.bracketTrack == TRACK_W) {
                val lt = wbLoserDest[d.key]
                d.copy(loserFeedsTo = lt)
            } else {
                d
            }
        }

        return wireLbWinners(patched)
    }

    /** Har qaysi LB o‘yini g‘olibi qaysi keyingi slotga tushishi — slotlardagi [WinnerOf] bo‘yicha. */
    private fun wireLbWinners(all: List<BracketMatchDraft>): List<BracketMatchDraft> {
        val winnerFeedsIncoming = mutableMapOf<String, Pair<String, Char>>()
        for (c in all) {
            when (val s = c.slotA) {
                is BracketSlot.WinnerOf -> winnerFeedsIncoming[s.matchKey] = c.key to 'A'
                else -> Unit
            }
            when (val s = c.slotB) {
                is BracketSlot.WinnerOf -> winnerFeedsIncoming[s.matchKey] = c.key to 'B'
                else -> Unit
            }
        }
        return all.map { d ->
            if (d.winnerFeedsTo != null || d.isGrandFinal) return@map d
            val nxt = winnerFeedsIncoming[d.key] ?: return@map d
            d.copy(winnerFeedsTo = nxt)
        }
    }
}

object GroupRoundRobinPlanner {

    fun snakeAssignments(orderedSeeds: List<Long>, groupCount: Int, teamsPerGroup: Int): List<Pair<Int, Long>> {
        require(orderedSeeds.size == groupCount * teamsPerGroup)
        val out = ArrayList<Pair<Int, Long>>(orderedSeeds.size)
        var idx = 0
        repeat(teamsPerGroup) { round ->
            if (round % 2 == 0) {
                for (g in 0 until groupCount) {
                    out += g to orderedSeeds[idx++]
                }
            } else {
                for (g in groupCount - 1 downTo 0) {
                    out += g to orderedSeeds[idx++]
                }
            }
        }
        return out
    }

    /** Guruh ichida juftliklar (i < j) — bitta aylana. */
    fun groupMatchPairs(teamsPerGroup: Int): List<Pair<Int, Int>> {
        val p = mutableListOf<Pair<Int, Int>>()
        for (i in 0 until teamsPerGroup) {
            for (j in i + 1 until teamsPerGroup) {
                p += i to j
            }
        }
        return p
    }

    fun buildGroupStageDrafts(
        groups: List<List<Long>>,
        roundIndexBase: Int = 0,
        bestOf: Int = 1,
    ): List<BracketMatchDraft> {
        val drafts = mutableListOf<BracketMatchDraft>()
        for ((g, teamIds) in groups.withIndex()) {
            require(teamIds.size == BigTournamentRules.TEAMS_PER_GROUP)
            val pairs = groupMatchPairs(teamIds.size)
            pairs.forEachIndexed { mi, (ai, bi) ->
                drafts.add(
                    BracketMatchDraft(
                        key = "GRP|$g|$mi",
                        phase = BigTournamentPhase.GROUP_STAGE,
                        bracketTrack = null,
                        groupIndex = g,
                        roundIndex = roundIndexBase,
                        matchIndex = mi,
                        bestOf = bestOf,
                        slotA = BracketSlot.Team(teamIds[ai]),
                        slotB = BracketSlot.Team(teamIds[bi]),
                        winnerFeedsTo = null,
                        loserFeedsTo = null,
                    ),
                )
            }
        }
        return drafts
    }
}

object QualifierKnockoutPlanner {

    fun nextPowerOfTwo(x: Int): Int {
        require(x >= 1)
        var p = 1
        while (p < x) p *= 2
        return p
    }

    data class QualRoundSpec(
        val pairs: List<Pair<Long?, Long?>>,
        /** Qisman aylanada o‘ynamaydigan (BYE) jamoalar — alohida COMPLETED match sifatida saqlanadi. */
        val byeTeams: List<Long> = emptyList(),
        /** To‘liq aylana tugagach qolgan jamoalar soni. */
        val survivorsAfterRound: Int,
        val closesQualifierPhase: Boolean,
    )

    /**
     * [aliveBestFirst] — kuchliroq (seed) oldinda (tengda kichik id).
     * Qaytariladi: (teamA, teamB) juftliklari; null = BYE (qarama-qarshi to‘g‘ridan-to‘g‘ri o‘tadi).
     */
    fun planRound(aliveBestFirst: List<Long>, targetRemain: Int): QualRoundSpec? {
        if (aliveBestFirst.size <= targetRemain) return null
        val s = aliveBestFirst.size
        return if (s / 2 >= targetRemain) {
            val pairs = pairFullRound(aliveBestFirst)
            QualRoundSpec(
                pairs = pairs,
                byeTeams = emptyList(),
                survivorsAfterRound = s / 2,
                closesQualifierPhase = s / 2 == targetRemain,
            )
        } else {
            val m = s - targetRemain
            val playCount = 2 * m
            val byeAdvance = aliveBestFirst.take(s - playCount)
            val playPool = aliveBestFirst.drop(s - playCount)
            require(playPool.size == playCount)
            val pairs = mutableListOf<Pair<Long?, Long?>>()
            for (i in 0 until m) {
                pairs += playPool[2 * i] to playPool[2 * i + 1]
            }
            QualRoundSpec(
                pairs = pairs,
                byeTeams = byeAdvance,
                survivorsAfterRound = targetRemain,
                closesQualifierPhase = true,
            )
        }
    }

    private fun pairFullRound(alive: List<Long>): List<Pair<Long?, Long?>> {
        val padded: MutableList<Long?> = alive.mapTo(ArrayList<Long?>(alive.size + 1)) { it }
        if (padded.size % 2 == 1) padded.add(null)
        val out = ArrayList<Pair<Long?, Long?>>(padded.size / 2)
        for (i in padded.indices step 2) {
            out += padded[i] to padded[i + 1]
        }
        return out
    }

    /**
     * Birinchi kval raundi: 2 ning darajasigacha to‘ldirish va BYE.
     * [orderedBestFirst] — eng kuchli birinchi.
     */
    fun firstRoundWithByes(orderedBestFirst: List<Long>, targetRemain: Int): QualRoundSpec {
        val s = orderedBestFirst.size
        val p = nextPowerOfTwo(s)
        val byes = p - s
        val playing = orderedBestFirst.drop(byes)
        require(playing.size == 2 * (s - byes) / 2)
        val pairs = mutableListOf<Pair<Long?, Long?>>()
        for (t in orderedBestFirst.take(byes)) {
            pairs += t to null
        }
        for (i in playing.indices step 2) {
            pairs += playing[i] to playing[i + 1]
        }
        val survivors = byes + playing.size / 2
        return QualRoundSpec(
            pairs = pairs,
            byeTeams = emptyList(),
            survivorsAfterRound = survivors,
            closesQualifierPhase = survivors == targetRemain,
        )
    }
}
