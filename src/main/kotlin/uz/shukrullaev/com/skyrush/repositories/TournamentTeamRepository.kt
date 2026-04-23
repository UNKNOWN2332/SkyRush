package uz.shukrullaev.com.skyrush.repositories

import kotlinx.coroutines.flow.Flow
import org.springframework.data.repository.kotlin.CoroutineCrudRepository
import org.springframework.stereotype.Repository
import uz.shukrullaev.com.skyrush.entities.TournamentTeam

@Repository
interface TournamentTeamRepository : CoroutineCrudRepository<TournamentTeam, Long> {
    suspend fun countByTournamentId(tournamentId: Long): Long
    fun findByTournamentId(tournamentId: Long): Flow<TournamentTeam>
    fun findByCaptainUserIdOrderByCreatedAtDesc(captainUserId: Long): Flow<TournamentTeam>
}
