package uz.shukrullaev.com.skyrush.repositories

import kotlinx.coroutines.flow.Flow
import org.springframework.data.r2dbc.repository.Query
import org.springframework.data.repository.kotlin.CoroutineCrudRepository
import org.springframework.stereotype.Repository
import uz.shukrullaev.com.skyrush.entities.TournamentStage

@Repository
interface TournamentStageRepository : CoroutineCrudRepository<TournamentStage, Long> {

    @Query(
        """
        SELECT * FROM tournament_stages
        WHERE tournament_id = :tournamentId
        ORDER BY CASE bracket_track
            WHEN 'MAIN' THEN 0
            WHEN 'WINNERS' THEN 1
            WHEN 'LOSERS' THEN 2
            WHEN 'GRAND_FINAL' THEN 3
            ELSE 4
        END, sort_order ASC
        """
    )
    fun findByTournamentIdOrdered(tournamentId: Long): Flow<TournamentStage>
}
