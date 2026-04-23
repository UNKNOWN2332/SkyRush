package uz.shukrullaev.com.skyrush.repositories

import kotlinx.coroutines.flow.Flow
import org.springframework.data.r2dbc.repository.Query
import org.springframework.data.repository.kotlin.CoroutineCrudRepository
import org.springframework.stereotype.Repository
import uz.shukrullaev.com.skyrush.entities.TournamentMatch

@Repository
interface TournamentMatchRepository : CoroutineCrudRepository<TournamentMatch, Long> {

    fun findByTournamentId(tournamentId: Long): Flow<TournamentMatch>

    @Query(
        """
        SELECT * FROM tournament_matches
        WHERE tournament_id = :tournamentId AND phase = :phase
        ORDER BY bracket_track NULLS LAST, group_index, round_index, match_index
        """
    )
    fun findByTournamentIdAndPhase(tournamentId: Long, phase: String): Flow<TournamentMatch>

    @Query("SELECT COUNT(*) FROM tournament_matches WHERE tournament_id = :tournamentId AND phase = :phase AND status <> 'COMPLETED'")
    suspend fun countIncompleteByTournamentIdAndPhase(tournamentId: Long, phase: String): Long

    @Query("SELECT * FROM tournament_matches WHERE bracket_key = :key AND tournament_id = :tournamentId LIMIT 1")
    suspend fun findByTournamentIdAndBracketKey(tournamentId: Long, key: String): TournamentMatch?
}
